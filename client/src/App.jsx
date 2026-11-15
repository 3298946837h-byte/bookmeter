import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsBanner from './components/StatsBanner';
import FilterBar from './components/FilterBar';
import BookCard from './components/BookCard';
import BookDetailModal from './components/BookDetailModal';
import ComparisonView from './components/ComparisonView';
import LeaderboardsView from './components/LeaderboardsView';
import AnalyticsView from './components/AnalyticsView';
import ScheduleModal from './components/ScheduleModal';
import MobileBottomNav from './components/MobileBottomNav';
import fallbackBooks from './data/staticBooks.json';
import { Search, BookOpen, AlertTriangle, Sparkles, RefreshCw, Flame, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [allMasterBooks, setAllMasterBooks] = useState(fallbackBooks);
  const [books, setBooks] = useState(fallbackBooks);
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

        const loadedList = booksData.data || fallbackBooks;
        setAllMasterBooks(loadedList);
        setBooks(loadedList);
        setStats(statsData);
        setCategories(catData || [{ name: '全部', count: loadedList.length }]);
      } else {
        // Fallback for static hosting environments (e.g. GitHub Pages)
        setAllMasterBooks(fallbackBooks);
        setBooks(fallbackBooks);
        const categoriesMap = { '全部': fallbackBooks.length };
        fallbackBooks.forEach(b => {
          categoriesMap[b.category] = (categoriesMap[b.category] || 0) + 1;
        });
        setCategories(Object.entries(categoriesMap).map(([name, count]) => ({ name, count })));
        setStats({
          totalBooks: fallbackBooks.length,
          totalReviewsAggregated: 11485880,
          averageCompositeScore: 8.4,
          verdictCounts: { masterpiece: 11, recommended: 11, controversial: 3, warning: 3, mediocre: 0 }
        });
      }
    } catch (err) {
      console.warn('API error, using offline database:', err);
      setAllMasterBooks(fallbackBooks);
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

  // Execute global search (Local + OpenLibrary + DeepSeek Live Resolver)
  const handleSearchSubmit = async (overrideQuery) => {
    const query = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!query) {
      setActiveSearchTerm('');
      setBooks(allMasterBooks);
      return;
    }

    try {
      setIsSearching(true);
      const term = query.toLowerCase();
      setActiveSearchTerm(query);
      setActiveTab('explore'); // Switch to explore grid to show results
      setSelectedCategory('全部');
      setSelectedVerdict('all');

      // 1. Instant local search across master catalog
      const localMatches = allMasterBooks.filter(b => {
        const titleMatch = b.title && b.title.toLowerCase().includes(term);
        const origMatch = b.originalTitle && b.originalTitle.toLowerCase().includes(term);
        const authorMatch = b.author && b.author.toLowerCase().includes(term);
        const transMatch = b.translator && b.translator.toLowerCase().includes(term);
        const catMatch = b.category && b.category.toLowerCase().includes(term);
        const tagMatch = b.tags && b.tags.some(t => t.toLowerCase().includes(term));
        const summaryMatch = b.summary && b.summary.toLowerCase().includes(term);
        return titleMatch || origMatch || authorMatch || transMatch || catMatch || tagMatch || summaryMatch;
      });

      // 2. Also query server API if available
      let remoteMatches = [];
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const searchData = await res.json();
          remoteMatches = [...(searchData.local || []), ...(searchData.live || [])];
        }
      } catch (err) {
        // static hosting or offline, silently ignore
      }

      // Merge and deduplicate
      const combined = [...localMatches];
      const seenIds = new Set(localMatches.map(b => b.id));
      for (const b of remoteMatches) {
        if (!seenIds.has(b.id)) {
          combined.push(b);
          seenIds.add(b.id);
        }
      }

      setBooks(combined);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
    setBooks(allMasterBooks);
  };

  // Filter books locally according to the active tab and options
  const displayBooks = books.filter(b => {
    // If active search term is present, strictly match
    if (activeSearchTerm) {
      const term = activeSearchTerm.toLowerCase();
      const titleMatch = b.title && b.title.toLowerCase().includes(term);
      const origMatch = b.originalTitle && b.originalTitle.toLowerCase().includes(term);
      const authorMatch = b.author && b.author.toLowerCase().includes(term);
      const transMatch = b.translator && b.translator.toLowerCase().includes(term);
      const catMatch = b.category && b.category.toLowerCase().includes(term);
      const tagMatch = b.tags && b.tags.some(t => t.toLowerCase().includes(term));
      const summaryMatch = b.summary && b.summary.toLowerCase().includes(term);
      if (!(titleMatch || origMatch || authorMatch || transMatch || catMatch || tagMatch || summaryMatch)) {
        return false;
      }
    }

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
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 md:pb-8 w-full">
        
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
              <div className="bg-white rounded-3xl p-6 sm:p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">
                    {activeSearchTerm ? `未找到匹配 “${activeSearchTerm}” 的书籍` : '当前分类暂无匹配书籍'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    当前书库已深度收录 28 部中外典藏名著、科普神作与避坑警示书。<br />
                    您可以尝试点击下方热门书目快速体验多源对冲与真实长评：
                  </p>
                </div>

                {/* Hot book suggestions chips */}
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1">
                  {[
                    '女士品茶',
                    '蛤蟆先生去看心理医生',
                    '被讨厌的勇气',
                    '思考，快与慢',
                    '穷查理宝典',
                    '原则',
                    '自私的基因',
                    '微积分的力量',
                    '三体',
                    '芯片战争'
                  ].map(kw => (
                    <button
                      key={kw}
                      onClick={() => {
                        setSearchQuery(kw);
                        handleSearchSubmit(kw);
                      }}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 rounded-lg border border-slate-200 transition-all font-medium active:scale-95"
                    >
                      {kw}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all active:scale-95"
                  >
                    重置并返回全部书库
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpenDetail={(b) => setSelectedBook(b)}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 sm:py-8 text-xs text-slate-500 mt-8 sm:mt-12 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span className="font-bold text-slate-800">BookMeter · 全网书评权威聚合</span>
            <span className="hidden sm:inline">-</span>
            <span className="text-[11px] sm:text-xs">对冲多平台评价偏见，呈现真实读者口碑</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400">
            <span>数据源: 豆瓣 / Goodreads / Amazon / Google Books</span>
            <span>·</span>
            <span>已支持全网实时检索</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

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
