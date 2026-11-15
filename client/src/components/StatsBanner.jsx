import React from 'react';
import { Award, AlertOctagon, TrendingUp, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function StatsBanner({ stats, onSelectVerdict }) {
  if (!stats) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-8 shadow-xl shadow-slate-900/10 border border-slate-700/50">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
        
        {/* Left Column: Mission statement */}
        <div className="lg:col-span-7 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] sm:text-xs font-medium backdrop-blur">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">全网多源权威对冲算法 · 杜绝单一平台刷分与偏见</span>
          </div>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
            一眼看清 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">哪些书真正封神</span>，
            <br className="hidden sm:inline" />
            哪些是 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">营销噱头与翻车避坑</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none">
            单一平台打分常受粉圈水军、营销炒作或机翻翻车误导。我们通过对冲 <b>豆瓣读书 (10分制)</b> 与 <b>Goodreads/Amazon (5星制)</b> 真实读者数据，
            使用贝叶斯加权算法综合计算全网主评分，并提取好差评核心槽点。
          </p>

          {/* Quick Platform Badges */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-300">
            <span className="opacity-70">数据源:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">豆瓣 10分制</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">Goodreads 5星制</span>
            <span className="px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800">Amazon 购买真评</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">Google Books</span>
          </div>
        </div>

        {/* Right Column: Statistics Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2 sm:gap-3">
          <div
            onClick={() => onSelectVerdict('masterpiece')}
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20">9.0+ 殿堂</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.verdictCounts?.masterpiece || 0} 本</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">全网一致公认神作</div>
          </div>

          <div
            onClick={() => onSelectVerdict('warning')}
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 border border-rose-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-rose-500/20">避坑预警</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300">{stats.verdictCounts?.warning || 0} 本</div>
            <div className="text-[10px] sm:text-[11px] text-rose-200/70 mt-0.5">差评率高 / 译本翻车</div>
          </div>

          <div
            onClick={() => onSelectVerdict('controversial')}
            className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/25 border border-amber-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20">两极争议</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">{stats.verdictCounts?.controversial || 0} 本</div>
            <div className="text-[10px] sm:text-[11px] text-amber-200/70 mt-0.5">中西审美/口碑撕裂</div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-sky-400 mb-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-sky-500/20">全网累积</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {stats.totalReviewsAggregated ? (stats.totalReviewsAggregated / 10000).toFixed(0) : '0'}万+
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">跨平台真实参评量</div>
          </div>
        </div>

      </div>
    </div>
  );
}
