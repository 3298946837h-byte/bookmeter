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

  // Fetch initial books & data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [booksRes, statsRes, catRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/stats'),
        fetch('/api/categories')
      ]);

      const booksData = await booksRes.json();
      const statsData = await statsRes.json();
      const catData = await catRes.json();

      setBooks(booksData.data || []);
      setStats(statsData);
      setCategories(catData || [{ name: '全部', count: booksData.data?.length || 0 }]);
    } catch (err) {
      console.error('Failed to load initial data:', err);
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
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      setActiveSearchTerm('');
      loadData();
      return;
    }

    try {
      setIsSearching(true);
      setActiveSearchTerm(searchQuery.trim());
      setActiveTab('explore'); // Switch to explore grid to show results
      setSelectedCategory('全部');
      setSelectedVerdict('all');

      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const searchData = await res.json();
      
      const local = searchData.local || [];
      const live = searchData.live || [];

      // Deduplicate by title
      const titleSet = new Set(local.map(b => b.title.toLowerCase()));
      const filteredLive = live.filter(b => !titleSet.has(b.title.toLowerCase()));

      setBooks([...local, ...filteredLive]);
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
