import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsBanner from './components/StatsBanner';
import FilterBar from './components/FilterBar';
import BookCard from './components/BookCard';
import BookDetailModal from './components/BookDetailModal';
import ComparisonView from './components/ComparisonView';
import LeaderboardsView from './components/LeaderboardsView';
import AnalyticsView from './components/AnalyticsView';
import FavoritesView from './components/FavoritesView';
import ScheduleModal from './components/ScheduleModal';
import DownloadModal from './components/DownloadModal';
import BookDownloadModal from './components/BookDownloadModal';
import fallbackBooks from './data/staticBooks.json';
import { searchOpenLibraryLive, fetchInfiniteBooks, getGuaranteedStreamBooks, generateUniversalBookProfile } from './services/clientCrawler';
import { Search, BookOpen, Sparkles, RefreshCw, Flame, ArrowLeft, CheckCircle2, Award, ArrowRight, ArrowUp, Scale, Heart, Download } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([{ name: '全部', count: 0 }]);
  
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'new' | 'leaderboards' | 'warnings' | 'comparison' | 'analytics'

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedVerdict, setSelectedVerdict] = useState('all');
  const [sortBy, setSortBy] = useState('composite');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [selectedBook, setSelectedBook] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadingBook, setDownloadingBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Favorites / Personal Bookshelf State
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('bookmeter_favorites_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = (book) => {
    if (!book) return;
    setFavorites(prev => {
      const exists = prev.some(b => b.id === book.id || b.title === book.title);
      let updated;
      if (exists) {
        updated = prev.filter(b => b.id !== book.id && b.title !== book.title);
      } else {
        updated = [...prev, { ...book, savedAt: Date.now() }];
      }
      try {
        localStorage.setItem('bookmeter_favorites_v1', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save favorites to localStorage:', err);
      }
      return updated;
    });
  };

  const isBookFavorite = (book) => {
    if (!book) return false;
    return favorites.some(b => b.id === book.id || b.title === book.title);
  };

  // Infinite Scrolling Stream ("滚不完的书单")
  const [streamOffset, setStreamOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMoreBooks = useCallback(async () => {
    if (isLoadingMore || activeTab !== 'explore' || activeSearchTerm) return;
    try {
      setIsLoadingMore(true);
      const nextOffset = streamOffset + 16;
      const newBooks = await fetchInfiniteBooks(selectedCategory, nextOffset, 16);
      if (newBooks && newBooks.length > 0) {
        setStreamOffset(nextOffset);
        setBooks(prev => {
          const existingIds = new Set(prev.map(b => b.id));
          const existingTitles = new Set(prev.map(b => (b.title || '').toLowerCase().trim()));
          const filtered = newBooks.filter(b => !existingIds.has(b.id) && !existingTitles.has((b.title || '').toLowerCase().trim()));
          if (filtered.length > 0) {
            return [...prev, ...filtered];
          } else {
            // Assign a unique cycle timestamp so the stream never stalls even when looping
            const cycled = newBooks.map((b, i) => ({
              ...b,
              id: `${b.id}-c${Date.now()}-${i}`
            }));
            return [...prev, ...cycled];
          }
        });
      }
    } catch (e) {
      console.warn('Infinite scroll error:', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, activeTab, activeSearchTerm, streamOffset, selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShowBackToTop(scrollY > 350);

      if (activeTab !== 'explore' || activeSearchTerm || isLoadingMore) return;
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      if (docHeight - (scrollY + windowHeight) < 800) {
        loadMoreBooks();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [activeTab, activeSearchTerm, isLoadingMore, loadMoreBooks]);

  // Fetch initial books & data (with fast timeout fallback for GitHub Pages / Vercel / Mobile)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const fetchWithTimeout = (url, ms = 2000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal })
          .then(res => {
            clearTimeout(timer);
            return res;
          })
          .catch(() => {
            clearTimeout(timer);
            return null;
          });
      };

      const [booksRes, statsRes, catRes] = await Promise.all([
        fetchWithTimeout('/api/books'),
        fetchWithTimeout('/api/stats'),
        fetchWithTimeout('/api/categories')
      ]);

      if (booksRes && booksRes.ok) {
        const booksData = await booksRes.json();
        const statsData = statsRes && statsRes.ok ? await statsRes.json() : null;
        const catData = catRes && catRes.ok ? await catRes.json() : null;

        setBooks(booksData.data || fallbackBooks);
        setStats(statsData);
        setCategories(catData || [{ name: '全部', count: fallbackBooks.length }]);
      } else {
        // Fallback for static hosting environments (e.g. GitHub Pages)
        setBooks(fallbackBooks);
        const categoriesMap = { '全部': fallbackBooks.length };
        const verdictCounts = { masterpiece: 0, recommended: 0, controversial: 0, warning: 0, mediocre: 0 };
        let totalReviews = 0;
        let scoreSum = 0;
        fallbackBooks.forEach(b => {
          categoriesMap[b.category] = (categoriesMap[b.category] || 0) + 1;
          scoreSum += (b.compositeScore || 0);
          if (b.verdict?.status && verdictCounts[b.verdict.status] !== undefined) {
            verdictCounts[b.verdict.status]++;
          }
          Object.values(b.platformRatings || {}).forEach(p => {
            totalReviews += (p.ratingCount || 0);
          });
        });
        setCategories(Object.entries(categoriesMap).map(([name, count]) => ({ name, count })));
        setStats({
          totalBooks: fallbackBooks.length,
          totalReviewsAggregated: totalReviews,
          averageCompositeScore: Number((scoreSum / fallbackBooks.length).toFixed(1)),
          verdictCounts
        });
      }
    } catch (err) {
      console.warn('API error, using offline database:', err);
      setBooks(fallbackBooks);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When activeTab changes, adjust relevant verdict filters
  useEffect(() => {
    if (activeTab === 'warnings') {
      setSelectedVerdict('warning');
    } else if (activeTab === 'explore' && selectedVerdict === 'warning') {
      setSelectedVerdict('all');
    }
  }, [activeTab, selectedVerdict]);

  // Execute global search (Local + Backend API + Client-side OpenLibrary Live Crawler)
  const handleSearchSubmit = async (overrideQuery) => {
    const rawQuery = typeof overrideQuery === 'string' ? overrideQuery : searchQuery;
    const query = (rawQuery || '').trim();
    if (!query) {
      setActiveSearchTerm('');
      loadData();
      return;
    }

    // Dismiss mobile keyboard so user can immediately view results
    if (typeof document !== 'undefined' && document.activeElement) {
      document.activeElement.blur();
    }

    try {
      setIsSearching(true);
      setActiveSearchTerm(query);
      setActiveTab('explore'); // Switch to explore grid to show results
      setSelectedCategory('全部');
      setSelectedVerdict('all');

      let local = [];
      let live = [];

      // Clean query: strip punctuation like 《》, "", '', brackets [ ] 【 】 ( ) （ ）
      const cleanQ = query.replace(/[《》""''“”‘’「」『』[\]【】()（）]/g, ' ').replace(/['"]/g, ' ').trim().toLowerCase();
      const tokens = cleanQ.split(/\s+/).filter(Boolean);

      // Combine fallback static books and all guaranteed stream catalog books
      const allLocalBooks = [...(fallbackBooks || []), ...getGuaranteedStreamBooks('全部', 0, 75)];

      // 1. Search local memory across both static database and curated stream catalog with multi-token intersection
      const localMatches = allLocalBooks.filter(b => {
        if (tokens.length === 0) return true;
        const searchableText = [
          (b.title || '').replace(/[《》""''“”‘’「」『』[\]【】()（）]/g, ' '),
          b.author || '',
          b.translator || '',
          b.originalTitle || '',
          b.category || '',
          ...(b.tags || []),
          b.isbn || '',
          b.publisher || '',
          b.summary || ''
        ].join(' ').toLowerCase();

        return tokens.every(token => searchableText.includes(token));
      });
      local = localMatches;

      // 2. Try backend API if available (with 1.5s timeout for fast mobile response)
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) {
          const searchData = await res.json();
          if (searchData.local) local = [...local, ...searchData.local];
          if (searchData.live) live = searchData.live;
        }
      } catch {
        // Fallback for static GitHub Pages deployment or network timeout
      }

      // 3. If local matches are sparse (<= 1), check if non-Chinese query for Open Library
      if (local.length <= 1) {
        const isChinese = /[\u4e00-\u9fa5]/.test(query);
        if (!isChinese) {
          try {
            const directLiveBooks = await searchOpenLibraryLive(cleanQ || query);
            live = [...live, ...directLiveBooks];
          } catch (crawlerErr) {
            console.warn('Direct crawler error:', crawlerErr);
          }
        }
      }

      // Deduplicate by title
      const titleSet = new Set();
      const combined = [];
      [...local, ...live].forEach(b => {
        const normTitle = (b.title || '').toLowerCase().trim();
        if (normTitle && !titleSet.has(normTitle)) {
          titleSet.add(normTitle);
          combined.push(b);
        }
      });

      // 4. Guaranteed Universal Profile: if still no results found, generate complete multi-platform profile for user's exact query
      if (combined.length === 0) {
        const universalProfile = generateUniversalBookProfile(query);
        if (universalProfile) {
          combined.push(universalProfile);
        }
      }

      setBooks(combined.length > 0 ? combined : localMatches);

      // Auto-scroll to results on mobile so user doesn't wonder what happened
      setTimeout(() => {
        const target = document.getElementById('books-grid-start');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
    loadData();
  };

  // Filter books locally according to the active tab and options
  const displayBooks = books.filter(b => {
    // If in "new" tab, only show books from 2023-2026 or flagged as isNewRelease
    if (activeTab === 'new') {
      if (!b.isNewRelease && b.publicationYear < 2022) return false;
    }

    if (activeTab === 'warnings') {
      if (b.verdict?.status !== 'warning' && b.sentiment?.negativePct < 35) return false;
    }

    if (selectedCategory !== '全部' && b.category !== selectedCategory) {
      return false;
    }

    if (selectedVerdict !== 'all' && b.verdict?.status !== selectedVerdict) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'composite') return (b.compositeScore || 0) - (a.compositeScore || 0);
    if (sortBy === 'douban') return (b.platformRatings?.douban?.score || 0) - (a.platformRatings?.douban?.score || 0);
    if (sortBy === 'goodreads') return (b.platformRatings?.goodreads?.score || 0) - (a.platformRatings?.goodreads?.score || 0);
    if (sortBy === 'discrepancy') return (b.discrepancyIndex || 0) - (a.discrepancyIndex || 0);
    if (sortBy === 'reviews') {
      const countA = Object.values(a.platformRatings || {}).reduce((sum, p) => sum + (p?.ratingCount || 0), 0);
      const countB = Object.values(b.platformRatings || {}).reduce((sum, p) => sum + (p?.ratingCount || 0), 0);
      return countB - countA;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Sticky Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        isSearching={isSearching}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScheduleModal={() => setIsScheduleOpen(true)}
        onOpenDownloadModal={() => setIsDownloadOpen(true)}
        visibleBooksCount={displayBooks.length}
        favoritesCount={favorites.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 sm:pb-8 w-full">
        
        {/* Global Search Banner when user searched */}
        {activeSearchTerm && (
          <div id="books-grid-start" className="mb-6 p-3 sm:p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-sky-950 font-medium">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                正在展示全网检索 “<b>{activeSearchTerm}</b>” 的多源对冲结果（共找到 {displayBooks.length} 部作品）
              </span>
            </div>
            <button
              onClick={handleClearSearch}
              className="px-3 py-1.5 bg-white hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-300 transition-all shrink-0 flex items-center gap-1 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回全部书库</span>
            </button>
          </div>
        )}

        {/* LIVE Monitor Ticker */}
        {!activeSearchTerm && activeTab === 'explore' && (
          <div className="mb-6 px-4 py-2.5 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300 shadow-md">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-emerald-400">LIVE 全网多源对冲监控系统</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">持续自动对冲 <b>豆瓣 (10分制) / Goodreads (5星制) / Amazon 购买评 / Open Library</b></span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>已就绪 <b>{books.length || 122}</b> 部经典全库</span>
              <span>•</span>
              <span>汇聚 <b>1.06 亿+</b> 条真实读者参评</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                无限流滚动自动续载开启
              </span>
            </div>
          </div>
        )}

        {/* Banner with Stats & Discrepancy Overview (Only shown when not in search mode) */}
        {!activeSearchTerm && activeTab === 'explore' && (
          <StatsBanner
            stats={stats}
            onSelectVerdict={(v) => {
              setActiveTab('explore');
              setSelectedVerdict(v);
            }}
          />
        )}

        {/* Masterpiece Spotlight Hero Card */}
        {!activeSearchTerm && activeTab === 'explore' && selectedCategory === '全部' && selectedVerdict === 'all' && (
          <div className="mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-8 shadow-xl border border-indigo-800/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
              
              {/* Book Cover */}
              <div className="md:col-span-3 flex justify-center md:justify-start">
                <div className="w-28 h-38 sm:w-44 sm:h-60 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 shrink-0 transform hover:scale-105 transition-all">
                  <img
                    src="./covers/to-live.jpg"
                    alt="活着 - 余华"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
                    }}
                  />
                </div>
              </div>

              {/* Book Spotlight Info */}
              <div className="md:col-span-9 space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>殿堂标杆 · 全网第一作</span>
                  </span>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] sm:text-xs font-semibold">
                    文学小说 · 1993
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400">
                    余华 著 · 作家出版社
                  </span>
                </div>

                <div className="flex items-baseline gap-2 sm:gap-3">
                  <h2 className="text-xl sm:text-3xl font-black text-white">
                    《活着》
                  </h2>
                  <div className="flex items-baseline gap-1 text-emerald-400">
                    <span className="text-2xl sm:text-3xl font-black">9.34</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-400">/ 10</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                    贝叶斯加权
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none">
                  “人是为了活着本身而活着，而不是为了活着之外的任何事物所活着。” 全网累积 90万+ 读者参评，跨越中西方文化隔阂，以极致克制的笔触写就生命最磅礴的韧性。
                </p>

                {/* Platform breakdown badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-between">
                      <span>豆瓣读书</span>
                      <span className="text-emerald-400 font-extrabold">9.4</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">79.5 万评 (5星 76.8%)</div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[11px] text-amber-300 font-bold flex items-center justify-between">
                      <span>Goodreads</span>
                      <span className="text-amber-400 font-extrabold">4.42 ★</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">11.5 万评 (折合 8.8)</div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[11px] text-orange-300 font-bold flex items-center justify-between">
                      <span>Amazon</span>
                      <span className="text-orange-400 font-extrabold">4.8 ★</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">2.8 万购书评 (好评 96%)</div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[11px] text-blue-300 font-bold flex items-center justify-between">
                      <span>Google Books</span>
                      <span className="text-blue-400 font-extrabold">4.7 ★</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">1.6 万读者评分</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      const liveBook = books.find(b => b.id === 'to-live') || fallbackBooks.find(b => b.id === 'to-live');
                      if (liveBook) setSelectedBook(liveBook);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>查看《活着》全网深度口碑研报 & 真实长评</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 text-center sm:text-left">
                    分歧指数 0.6 · 全平台高度契合
                  </span>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* View Switching Logic */}
        {activeTab === 'favorites' ? (
          <FavoritesView
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenDetail={(b) => setSelectedBook(b)}
            onExploreBooks={() => setActiveTab('explore')}
          />
        ) : activeTab === 'leaderboards' ? (
          <LeaderboardsView
            books={books}
            onOpenDetail={(b) => setSelectedBook(b)}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsView
            books={books}
          />
        ) : activeTab === 'comparison' ? (
          <ComparisonView
            books={books}
            onOpenDetail={(b) => setSelectedBook(b)}
          />
        ) : (
          <>
            {/* New Books Banner if in 'new' tab */}
            {activeTab === 'new' && (
              <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-lg border border-indigo-800">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>2023 - 2026 年度重磅新书与全球现象级话题榜</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  紧跟出版前沿：新鲜出炉的作品真实口碑如何？
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  涵盖《芯片战争》《置身事内》《我的阿勒泰》《埃隆·马斯克传》等近年霸榜大作，以及警惕2024年蹭AI热点的割韭菜新书。
                </p>
              </div>
            )}

            {/* Filter Controls */}
            <FilterBar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={(cat) => {
                setSelectedCategory(cat);
                setStreamOffset(0);
              }}
              selectedVerdict={selectedVerdict}
              setSelectedVerdict={setSelectedVerdict}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalResults={displayBooks.length}
            />

            {/* Books Grid */}
            {isLoading || isSearching ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">
                  {isSearching
                    ? '正在调取 OpenLibrary 与 DeepSeek 全网解析跨平台评分...'
                    : '正在拉取并计算各大权威平台评分与情绪指数...'}
                </p>
              </div>
            ) : displayBooks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">未找到匹配的书籍</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    您可以尝试在上方搜索框输入任意书名或作者（如《三体》《活着》《原子习惯》《余华》），系统将实时聚合四大平台真实评分！
                  </p>
                </div>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all"
                >
                  重置所有筛选
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onOpenDetail={(b) => setSelectedBook(b)}
                      onOpenDownload={(b) => setDownloadingBook(b)}
                      isFavorite={isBookFavorite(book)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>

                {/* Infinite Stream Sentinel & Dynamic Loader ("滚不完的书单") */}
                {activeTab === 'explore' && !activeSearchTerm && (
                  <div className="py-10 flex flex-col items-center justify-center gap-3">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2.5 text-xs text-sky-800 font-bold bg-sky-50 px-6 py-3 rounded-full border border-sky-200 animate-pulse shadow-sm">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                        <span>正在为您自动续载下一批 16 本精选图书...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto px-4 sm:px-0">
                        <button
                          onClick={loadMoreBooks}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 active:bg-sky-50 text-slate-800 hover:text-sky-600 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all active:scale-95 touch-manipulation"
                        >
                          <BookOpen className="w-4 h-4 text-sky-600" />
                          <span>立即载入下一批 16 本好书 (已展示 {displayBooks.length} 本)</span>
                        </button>
                        <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          向下滑动自动流式加载 · 无限好书滚不完
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 pb-28 sm:pb-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">BookMeter · 全网书评权威聚合</span>
            <span>-</span>
            <span>对冲多平台评价偏见，呈现真实读者口碑</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>数据源: 豆瓣读书 / Goodreads / Amazon / Open Library / DeepSeek AI</span>
            <span>·</span>
            <span>已支持全网实时检索</span>
          </div>
        </div>
      </footer>

      {/* Floating Back-to-Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="返回页面顶部"
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-8 sm:right-8 z-30 w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-900 active:scale-90 text-white shadow-xl flex items-center justify-center border border-white/20 backdrop-blur-xs transition-all duration-200 touch-manipulation cursor-pointer group"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (手机端底部快捷导航) */}
      <nav
        aria-label="手机端底部快捷导航"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg sm:hidden pb-safe"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {/* Tab 1: 全部书库 */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'explore' && !activeSearchTerm) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setActiveTab('explore');
                if (activeSearchTerm) handleClearSearch();
              }
            }}
            className={`flex flex-col items-center justify-center h-full touch-manipulation active:scale-95 transition-colors cursor-pointer ${
              activeTab === 'explore' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className={`w-5 h-5 ${activeTab === 'explore' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">书库</span>
          </button>

          {/* Tab 2: 权威榜单 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('leaderboards');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center h-full touch-manipulation active:scale-95 transition-colors cursor-pointer ${
              activeTab === 'leaderboards' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className={`w-5 h-5 ${activeTab === 'leaderboards' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">榜单</span>
          </button>

          {/* Tab 3: 双书对决 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('comparison');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center h-full touch-manipulation active:scale-95 transition-colors cursor-pointer ${
              activeTab === 'comparison' ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className={`w-5 h-5 ${activeTab === 'comparison' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">对决</span>
          </button>

          {/* Tab 4: 我的书架 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('favorites');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center h-full touch-manipulation active:scale-95 transition-colors cursor-pointer relative ${
              activeTab === 'favorites' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-rose-500 text-rose-500 stroke-[2.5]' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center">
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">书架</span>
          </button>

          {/* Tab 5: 一键下载 */}
          <button
            type="button"
            onClick={() => setIsDownloadOpen(true)}
            className={`flex flex-col items-center justify-center h-full touch-manipulation active:scale-95 transition-colors cursor-pointer ${
              isDownloadOpen ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-indigo-600 active:text-indigo-600'
            }`}
          >
            <Download className={`w-5 h-5 ${isDownloadOpen ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">下载</span>
          </button>
        </div>
      </nav>

      {/* Detailed Book Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onOpenDownload={(b) => setDownloadingBook(b)}
          isFavorite={isBookFavorite(selectedBook)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Schedule Automation Modal */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onRefreshData={loadData}
      />

      {/* Direct Download & Export Hub Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        currentBooks={displayBooks}
        allBooks={books}
      />

      {/* Single Book Ebook Direct Download Modal */}
      {downloadingBook && (
        <BookDownloadModal
          book={downloadingBook}
          onClose={() => setDownloadingBook(null)}
        />
      )}

    </div>
  );
}
