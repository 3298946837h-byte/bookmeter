import React from 'react';
import { Award, AlertOctagon, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function StatsBanner({ stats, onSelectVerdict }) {
  if (!stats) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-2xl shadow-slate-950/20 border border-slate-800/80">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
        
        {/* Left Column: Mission statement */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] text-sky-300 text-[11px] sm:text-xs font-semibold backdrop-blur-md border border-white/10 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>全网多源权威对冲算法 · 杜绝单一平台刷分与偏见</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            一眼看清 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300">哪些书真正封神</span>，
            <br className="hidden sm:inline" />
            哪些是 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">营销噱头与翻车避坑</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
            单一平台打分常受粉圈水军、营销炒作或机翻翻车误导。我们通过对冲 <b className="text-white font-semibold">豆瓣读书 (10分制)</b> 与 <b className="text-white font-semibold">Goodreads/Amazon (5星制)</b> 真实读者数据，
            使用贝叶斯加权算法综合计算全网主评分，并提取好差评核心槽点。
          </p>

          {/* Quick Platform Badges */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-300 font-medium">
            <span className="opacity-60">权威数据源:</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 backdrop-blur-xs">豆瓣 10分制</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-800/80 backdrop-blur-xs">Goodreads 5星制</span>
            <span className="px-2 py-0.5 rounded-lg bg-orange-950/70 text-orange-300 border border-orange-800/80 backdrop-blur-xs">Amazon 购书真评</span>
            <span className="px-2 py-0.5 rounded-lg bg-sky-950/70 text-sky-300 border border-sky-800/80 backdrop-blur-xs">Google Books</span>
          </div>
        </div>

        {/* Right Column: Statistics Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-3.5">
          <div
            onClick={() => onSelectVerdict('masterpiece')}
            className="p-3.5 sm:p-4.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-emerald-500/40 backdrop-blur-md transition-all duration-200 cursor-pointer group active:scale-95 shadow-sm"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1.5">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">9.0+ 殿堂</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.verdictCounts?.masterpiece || 0} 本</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">全网公认神作</div>
          </div>

          <div
            onClick={() => onSelectVerdict('warning')}
            className="p-3.5 sm:p-4.5 rounded-2xl bg-rose-500/[0.08] hover:bg-rose-500/[0.14] border border-rose-500/20 hover:border-rose-500/40 backdrop-blur-md transition-all duration-200 cursor-pointer group active:scale-95 shadow-sm"
          >
            <div className="flex items-center justify-between text-rose-400 mb-1.5">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-rose-400" />
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">避坑预警</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono">{stats.verdictCounts?.warning || 0} 本</div>
            <div className="text-[10px] sm:text-[11px] text-rose-200/70 mt-0.5">差评率高 / 翻车</div>
          </div>

          <div
            onClick={() => onSelectVerdict('controversial')}
            className="p-3.5 sm:p-4.5 rounded-2xl bg-amber-500/[0.08] hover:bg-amber-500/[0.14] border border-amber-500/20 hover:border-amber-500/40 backdrop-blur-md transition-all duration-200 cursor-pointer group active:scale-95 shadow-sm"
          >
            <div className="flex items-center justify-between text-amber-400 mb-1.5">
              <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-amber-400" />
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">两极争议</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{stats.verdictCounts?.controversial || 0} 本</div>
            <div className="text-[10px] sm:text-[11px] text-amber-200/70 mt-0.5">中西口碑撕裂</div>
          </div>

          <div className="p-3.5 sm:p-4.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-sky-500/40 backdrop-blur-md transition-all duration-200">
            <div className="flex items-center justify-between text-sky-400 mb-1.5">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">全网累积</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {stats.totalReviewsAggregated ? (stats.totalReviewsAggregated / 10000).toFixed(0) : '0'}万+
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">真实参评量</div>
          </div>
        </div>

      </div>
    </div>
  );
}
