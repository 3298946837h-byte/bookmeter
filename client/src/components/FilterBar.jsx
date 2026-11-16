import React from 'react';
import { ArrowUpDown, Filter } from 'lucide-react';

export default function FilterBar({
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedVerdict,
  setSelectedVerdict,
  sortBy,
  setSortBy,
  totalResults
}) {
  const verdictOptions = [
    { id: 'all', label: '全部口碑', icon: null },
    { id: 'masterpiece', label: '👑 殿堂神作 (9.0+)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
    { id: 'recommended', label: '📚 经典必读 (8.2+)', color: 'text-blue-700 bg-blue-50 border-blue-300' },
    { id: 'controversial', label: '⚖️ 两极分化 / 争议', color: 'text-amber-700 bg-amber-50 border-amber-300' },
    { id: 'warning', label: '⚠️ 避坑预警 (劣评/翻车)', color: 'text-rose-700 bg-rose-50 border-rose-300' }
  ];

  const sortOptions = [
    { id: 'composite', label: '综合权威加权分 (高→低)' },
    { id: 'douban', label: '豆瓣评分最高' },
    { id: 'goodreads', label: 'Goodreads 评分最高' },
    { id: 'discrepancy', label: '跨平台分歧度最大 (争议)' },
    { id: 'reviews', label: '全网评价人数最多' }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] mb-6 space-y-4">
      
      {/* Row 1: Verdict Pills (好书 vs 差评 vs 争议) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100/80">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>口碑评级</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {verdictOptions.map(option => {
            const isActive = selectedVerdict === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedVerdict(option.id)}
                aria-label={`筛选口碑评级: ${option.label}`}
                className={`text-xs min-h-[44px] sm:min-h-[36px] inline-flex items-center justify-center px-4 py-2 sm:px-3.5 sm:py-1.5 rounded-full font-bold border transition-all touch-manipulation cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20'
                    : 'bg-slate-50/80 text-slate-600 border-slate-200/80 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Categories and Sorting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none touch-pan-x smooth-scroll -mx-1 px-1">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                aria-label={`选择图书分类: ${cat.name}`}
                className={`whitespace-nowrap text-xs min-h-[44px] sm:min-h-[36px] inline-flex items-center justify-center px-4 py-2 sm:px-3.5 sm:py-1.5 rounded-full font-semibold transition-all touch-manipulation cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {cat.name} <span className="opacity-60 text-[10px] ml-1 font-mono">({cat.count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            共找到 <b className="text-slate-900 font-mono font-bold">{totalResults}</b> 部作品
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl px-3 py-1.5 min-h-[44px] shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ fontSize: '16px' }}
              aria-label="书籍排序方式"
              className="bg-transparent text-base font-semibold text-slate-700 outline-none cursor-pointer py-1"
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

    </div>
  );
}
