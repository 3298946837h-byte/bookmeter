import React from 'react';
import { Search, BookOpen, Clock, AlertTriangle, Sparkles, X, Flame, Award, BarChart3, Scale } from 'lucide-react';

export default function Navbar({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  isSearching,
  activeTab,
  setActiveTab,
  onOpenScheduleModal
}) {
  const handleClear = () => {
    setSearchQuery('');
    onSearchSubmit('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (typeof document !== 'undefined' && document.activeElement) {
      document.activeElement.blur();
    }
    onSearchSubmit(searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Row 1: Brand & Desktop Search & Actions */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0 select-none"
            onClick={() => {
              setActiveTab('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  BookMeter
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800">
                  全网聚合
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden lg:block">
                豆瓣 · Goodreads · Amazon · Google Books 真实口碑对冲
              </p>
            </div>
          </div>

          {/* Desktop Search Box (hidden on mobile < sm, visible on sm:) */}
          <form
            onSubmit={handleFormSubmit}
            className="hidden sm:flex flex-1 max-w-md relative"
          >
            <div className="relative w-full">
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="搜索任意全网图书（如: 芯片战争、三体、原子习惯）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '15px' }}
                className="w-full pl-9 pr-20 py-2 bg-slate-100 hover:bg-slate-200/70 focus:bg-white focus:ring-2 focus:ring-sky-500 rounded-xl border border-transparent focus:border-sky-500 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all disabled:opacity-50"
              >
                {isSearching ? '检索中' : '全网搜'}
              </button>
            </div>
          </form>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onOpenScheduleModal}
              title="查看自动抓取与定期更新策略"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 rounded-lg font-medium border border-sky-200 transition-all shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-xs">排程同步</span>
            </button>
          </div>

        </div>

        {/* Row 2: Mobile Search Bar (Full width dedicated row on mobile screens < sm) */}
        <div className="sm:hidden pb-2.5 pt-0.5">
          <form onSubmit={handleFormSubmit} className="relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="搜索任意图书、作者（如: 三体、活着、余华）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '16px' }} // 16px strictly avoids iOS / Android browser zoom-in bug!
                className="w-full pl-9 pr-8 py-2 bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500 rounded-xl border border-slate-200 focus:border-sky-500 transition-all outline-none text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="h-10 px-3.5 bg-slate-900 active:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center justify-center transition-all disabled:opacity-50 touch-manipulation"
            >
              {isSearching ? '检索中' : '全网搜'}
            </button>
          </form>
        </div>

        {/* Row 3: Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 sm:py-2 border-t border-slate-100 scrollbar-none text-xs touch-pan-x -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'explore'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部书库
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'new'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>🆕 最新重磅新书</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboards')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'leaderboards'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>🏆 四大权威平台榜</span>
          </button>

          <button
            onClick={() => setActiveTab('warnings')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'warnings'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>⚠️ 避坑与翻车预警</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'comparison'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>好书 vs 避坑 对决</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 数据透视</span>
          </button>
        </div>

        {/* Row 4: Trending Quick-Pill Bar (全网热读书库直达胶囊条) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 border-t border-slate-100 scrollbar-none text-[11px] touch-pan-x -mx-3 px-3 sm:mx-0 sm:px-0">
          <span className="text-slate-400 font-bold shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            直达:
          </span>
          {[
            '三体全集', '活着', '红楼梦', '百年孤独', '1984', '置身事内',
            '人类简史', '围城', '白夜行', '芯片战争', '蛤蟆先生去看心理医生',
            '被讨厌的勇气', '穷查理宝典', '月亮与六便士', '房思琪的初恋乐园',
            '追风筝的人', '解忧杂货店', '银河帝国：基地', '海伯利安', '沙丘',
            '纳瓦尔宝典', '深入理解计算机系统', '代码整洁之道', '自私的基因',
            '万历十五年', '叫魂', '西西弗神话', '局外人'
          ].map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                setSearchQuery(title);
                if (typeof document !== 'undefined' && document.activeElement) {
                  document.activeElement.blur();
                }
                onSearchSubmit(title);
              }}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 active:bg-sky-100 hover:bg-sky-50 text-slate-700 active:text-sky-700 font-medium whitespace-nowrap transition-colors border border-slate-200/80 shrink-0 touch-manipulation"
            >
              + {title}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
