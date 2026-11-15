import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import StatsBanner from './components/StatsBanner';
import FilterBar from './components/FilterBar';
import BookCard from './components/BookCard';
import BookDetailModal from './components/BookDetailModal';
import ComparisonView from './components/ComparisonView';
import LeaderboardsView from './components/LeaderboardsView';
import AnalyticsView from './components/AnalyticsView';
import ScheduleModal from './components/ScheduleModal';
import fallbackBooks from './data/staticBooks.json';
import { searchOpenLibraryLive, fetchInfiniteBooks } from './services/clientCrawler';
import { Search, BookOpen, AlertTriangle, Sparkles, RefreshCw, Flame, ArrowLeft, CheckCircle2 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);

  // Infinite Scrolling Stream ("滚不完的书单")
  const [streamOffset, setStreamOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const loadMoreBooks = async () => {
    if (isLoadingMore || activeTab !== 'explore' || activeSearchTerm) return;
    try {
      setIsLoadingMore(true);
      const nextOffset = streamOffset + 16;
      const newBooks = await fetchInfiniteBooks(selectedCategory, nextOffset, 16);
      if (newBooks && newBooks.length > 0) {
        setStreamOffset(nextOffset);
        setBooks(prev => {
          const existingIds = new Set(prev.map(b => b.id));
          const existingTitles = new Set(prev.map(b => b.title.toLowerCase().trim()));
          const filtered = newBooks.filter(b => !existingIds.has(b.id) && !existingTitles.has(b.title.toLowerCase().trim()));
          return [...prev, ...filtered];
        });
      }
    } catch (e) {
      console.warn('Infinite scroll error:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (activeTab !== 'explore' || activeSearchTerm || isLoadingMore) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - (scrollY + windowHeight) < 600) {
        loadMoreBooks();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, activeSearchTerm, isLoadingMore, streamOffset, selectedCategory]);

  useEffect(() => {
    setStreamOffset(0);
  }, [selectedCategory]);

  // Fetch initial books & data (with static fallback for GitHub Pages / Vercel)
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [booksRes, statsRes, catRes] = await Promise.all([
        fetch('/api/books').catch(() => null),
        fetch('/api/stats').catch(() => null),
        fetch('/api/categories').catch(() => null)
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
        fallbackBooks.forEach(b => {
          categoriesMap[b.category] = (categoriesMap[b.category] || 0) + 1;
        });
        setCategories(Object.entries(categoriesMap).map(([name, count]) => ({ name, count })));
        setStats({
          totalBooks: fallbackBooks.length,
          totalReviewsAggregated: 10885880,
          averageCompositeScore: 8.3,
          verdictCounts: { masterpiece: 7, recommended: 7, controversial: 2, warning: 3, mediocre: 0 }
        });
      }
    } catch (err) {
      console.warn('API error, using offline database:', err);
      setBooks(fallbackBooks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When activeTab changes, adjust relevant verdict filters
  useEffect(() => {
    if (activeTab === 'warnings') {
      setSelectedVerdict('warning');
    } else if (activeTab === 'explore' && selectedVerdict === 'warning') {
      setSelectedVerdict('all');
    }
  }, [activeTab]);

  // Execute global search (Local + Backend API + Client-side OpenLibrary Live Crawler)
  const handleSearchSubmit = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setActiveSearchTerm('');
      loadData();
      return;
    }

    try {
      setIsSearching(true);
      setActiveSearchTerm(query);
      setActiveTab('explore'); // Switch to explore grid to show results
      setSelectedCategory('全部');
      setSelectedVerdict('all');

      let local = [];
      let live = [];

      // 1. First search local memory
      const qLower = query.toLowerCase();
      const localMatches = (fallbackBooks || []).filter(b =>
        b.title.toLowerCase().includes(qLower) ||
        (b.originalTitle && b.originalTitle.toLowerCase().includes(qLower)) ||
        b.author.toLowerCase().includes(qLower) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(qLower)))
      );
      local = localMatches;

      // 2. Try backend API if available
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const searchData = await res.json();
          if (searchData.local) local = searchData.local;
          if (searchData.live) live = searchData.live;
        }
      } catch (e) {
        // Fallback for static GitHub Pages deployment
      }

      // 3. If local + live results are sparse, trigger direct browser live crawler (Open Library)
      if (local.length + live.length <= 1) {
        try {
          const directLiveBooks = await searchOpenLibraryLive(query);
          live = [...live, ...directLiveBooks];
        } catch (crawlerErr) {
          console.warn('Direct crawler error:', crawlerErr);
        }
      }

      // Deduplicate by title
      const titleSet = new Set();
      const combined = [];
      [...local, ...live].forEach(b => {
        const normTitle = b.title.toLowerCase().trim();
        if (!titleSet.has(normTitle)) {
          titleSet.add(normTitle);
          combined.push(b);
        }
      });

      setBooks(combined.length > 0 ? combined : localMatches);
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
    if (sortBy === 'composite') return b.compositeScore - a.compositeScore;
    if (sortBy === 'douban') return b.platformRatings.douban.score - a.platformRatings.douban.score;
    if (sortBy === 'goodreads') return b.platformRatings.goodreads.score - a.platformRatings.goodreads.score;
    if (sortBy === 'discrepancy') return b.discrepancyIndex - a.discrepancyIndex;
    if (sortBy === 'reviews') {
      const countA = Object.values(a.platformRatings).reduce((sum, p) => sum + (p.ratingCount || 0), 0);
      const countB = Object.values(b.platformRatings).reduce((sum, p) => sum + (p.ratingCount || 0), 0);
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Global Search Banner when user searched */}
        {activeSearchTerm && (
          <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-sky-950 font-medium">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                正在展示全网检索 “<b>{activeSearchTerm}</b>” 的多源对冲结果（共找到 {displayBooks.length} 部作品）
              </span>
            </div>
            <button
              onClick={handleClearSearch}
              className="px-3 py-1 bg-white hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-300 transition-all shrink-0 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回全部书库</span>
            </button>
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

        {/* View Switching Logic */}
        {activeTab === 'leaderboards' ? (
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
              setSelectedCategory={setSelectedCategory}
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
                    您可以尝试在上方搜索框输入任意书名（如《蛤蟆先生》《原子习惯》《三体》），系统将通过 DeepSeek 实时拉取全网数据！
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
                    />
                  ))}
                </div>

                {/* Infinite Stream Sentinel & Dynamic Loader ("滚不完的书单") */}
                {activeTab === 'explore' && !activeSearchTerm && (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2.5 text-xs text-sky-800 font-bold bg-sky-50 px-6 py-3 rounded-full border border-sky-200 animate-pulse shadow-sm">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                        <span>正在从全球开放图书库动态载入下一批图书...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={loadMoreBooks}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-600 font-bold text-xs rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all active:scale-95"
                        >
                          <BookOpen className="w-4 h-4 text-sky-600" />
                          <span>点击载入更多全球好书 (或继续向下滚动)</span>
                        </button>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          已接入全球开放图书库 · 无限流滚不完
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
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500 mt-12">
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

      {/* Detailed Book Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Schedule Automation Modal */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onRefreshData={loadData}
      />

    </div>
  );
}
