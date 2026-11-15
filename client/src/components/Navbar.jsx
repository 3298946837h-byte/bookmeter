import React from 'react';
import { Search, BookOpen, Clock, AlertTriangle, ShieldCheck, Sparkles, X, Flame, Award, BarChart3, Scale } from 'lucide-react';

export default function Navbar({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  isSearching,
  activeTab,
  setActiveTab,
  onOpenScheduleModal
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab('explore')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
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

          {/* Search Box - Direct Global Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="flex-1 max-w-sm sm:max-w-md relative"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="搜索任意全网图书（如: 芯片战争、阿勒泰、三体、原子习惯）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200/70 focus:bg-white focus:ring-2 focus:ring-sky-500 rounded-xl border border-transparent focus:border-sky-500 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all"
              >
                {isSearching ? '检索中' : '全网搜'}
              </button>
            </div>
          </form>

          {/* Right Action: Schedule Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenScheduleModal}
              title="查看自动抓取与定期更新策略"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg font-medium border border-sky-200 transition-all shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">排程同步</span>
            </button>
          </div>

        </div>

        {/* Secondary Navigation Row: The 6 Display Panels */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none text-xs">
          
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'explore'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            全部书库
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>好书 vs 避坑 横向对决</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 全网数据透视</span>
          </button>

        </div>

        {/* Tertiary Row: Quick-Pill Bar (全网热门经典直达胶囊条) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 border-t border-slate-100 scrollbar-none text-[11px]">
          <span className="text-slate-400 font-bold shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            全网热读书库直达:
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
              onClick={() => {
                setSearchQuery(title);
                onSearchSubmit(title);
              }}
              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border border-slate-200/80 hover:border-sky-300 font-medium whitespace-nowrap transition-colors"
            >
              + {title}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
