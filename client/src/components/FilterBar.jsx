import React from 'react';
import { SlidersHorizontal, ArrowUpDown, Filter, Sparkles, AlertTriangle } from 'lucide-react';

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
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200 shadow-sm mb-4 sm:mb-6 space-y-3 sm:space-y-4">
      
      {/* Row 1: Verdict Pills (好书 vs 差评 vs 争议) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>口碑评级</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-nowrap">
          {verdictOptions.map(option => {
            const isActive = selectedVerdict === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedVerdict(option.id)}
                className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold border whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Categories and Sorting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-nowrap">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`whitespace-nowrap text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name} <span className="opacity-70 text-[9px] sm:text-[10px]">({cat.count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-[11px] sm:text-xs text-slate-500">
            共 <b className="text-slate-800">{totalResults}</b> 部
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 sm:py-1.5">
            <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-700 outline-none cursor-pointer"
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
