import React, { useState } from 'react';
import { Award, AlertTriangle, Scale, Star, ThumbsUp, ThumbsDown, ArrowRight, Filter } from 'lucide-react';

export default function ComparisonView({ books, onOpenDetail }) {
  const [mobileFilter, setMobileFilter] = useState('all'); // 'all' | 'masterpieces' | 'warnings' | 'controversial'

  const masterpieces = books.filter(b => b.verdict?.status === 'masterpiece').slice(0, 5);
  const warnings = books.filter(b => b.verdict?.status === 'warning').slice(0, 5);
  const controversial = books.filter(b => b.verdict?.status === 'controversial' || b.discrepancyIndex >= 1.0).slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Intro Explainer Banner */}
      <div className="bg-indigo-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[11px] sm:text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>好书 vs 避坑 横向全景对决</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black leading-snug">
            一眼分清：哪些是全网交口称赞的真经典，哪些是差评如潮的翻车之作
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed line-clamp-3 sm:line-clamp-none">
            我们对比了各大平台（豆瓣、Goodreads、Amazon、Google Books）数百万条真实评价，把评分最坚挺的殿堂级好书与差评率奇高、机翻翻车或营销空洞的避坑书直观列出。
          </p>
        </div>
        <div className="shrink-0 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 border border-white/10 text-center w-full md:w-auto">
          <div className="text-2xl sm:text-3xl font-black text-amber-300">4 大维度对冲</div>
          <div className="text-[11px] sm:text-xs text-indigo-200 mt-0.5">分数 · 差评率 · 分歧度 · 真实书评</div>
        </div>
      </div>

      {/* Mobile Segmented Switcher */}
      <div className="flex lg:hidden bg-slate-200/80 p-1 rounded-xl text-xs font-bold gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setMobileFilter('all')}
          className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all ${
            mobileFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          全部对决
        </button>
        <button
          onClick={() => setMobileFilter('masterpieces')}
          className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
            mobileFilter === 'masterpieces' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <span>🏆 殿堂好书</span>
          <span className="text-[10px] opacity-80">({masterpieces.length})</span>
        </button>
        <button
          onClick={() => setMobileFilter('warnings')}
          className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
            mobileFilter === 'warnings' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-800 hover:text-rose-950'
          }`}
        >
          <span>⚠️ 避坑预警</span>
          <span className="text-[10px] opacity-80">({warnings.length})</span>
        </button>
        <button
          onClick={() => setMobileFilter('controversial')}
          className={`flex-1 py-2 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-1 ${
            mobileFilter === 'controversial' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:text-amber-950'
          }`}
        >
          <span>⚖️ 争议</span>
        </button>
      </div>

      {/* Two Column Layout: Masterpieces vs Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Left Column: Top-Rated Masterpieces (真正好书) */}
        {(mobileFilter === 'all' || mobileFilter === 'masterpieces') && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">殿堂级真好书 (全网 9.0+)</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">多平台几乎零差评，经受住时间与读者口碑检验</p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200 shrink-0">
              口碑天花板
            </span>
          </div>

          <div className="space-y-3">
            {masterpieces.map((book) => (
              <div
                key={book.id}
                onClick={() => onOpenDetail(book)}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer group flex gap-3 sm:gap-4 active:scale-[0.99]"
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-14 h-20 sm:w-16 sm:h-22 object-cover rounded-xl shadow-sm shrink-0 border border-slate-200"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {book.title}
                      </span>
                      <span className="text-emerald-600 font-black text-xs sm:text-sm shrink-0">
                        ★ {book.compositeScore}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {book.author} · {book.category}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-800 mt-1 font-medium">
                      <ThumbsUp className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="line-clamp-1">{book.sentiment?.pros?.[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mt-2">
                    <span className="text-emerald-700 font-semibold">{book.sentiment?.positivePct}% 好评</span>
                    <span className="flex items-center gap-1 group-hover:text-emerald-700 font-medium">
                      <span>查看书评</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Right Column: Warnings & Poor Books (避坑预警) */}
        {(mobileFilter === 'all' || mobileFilter === 'warnings') && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">避坑预警 (劣评/机翻翻车)</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">读者大量打差评、机翻语病严重或营销泡沫噱头</p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-rose-700 bg-rose-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-rose-200 shrink-0">
              买前慎重
            </span>
          </div>

          <div className="space-y-3">
            {warnings.map((book) => (
              <div
                key={book.id}
                onClick={() => onOpenDetail(book)}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50/30 hover:bg-rose-50/70 border border-rose-200 hover:border-rose-400 transition-all cursor-pointer group flex gap-3 sm:gap-4 active:scale-[0.99]"
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-14 h-20 sm:w-16 sm:h-22 object-cover rounded-xl shadow-sm shrink-0 border border-rose-200"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-rose-700 transition-colors truncate">
                        {book.title}
                      </span>
                      <span className="text-rose-600 font-black text-xs sm:text-sm shrink-0">
                        {book.compositeScore} 分
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {book.author} · {book.category}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-rose-800 mt-1 font-medium">
                      <ThumbsDown className="w-3 h-3 text-rose-600 shrink-0" />
                      <span className="line-clamp-1">{book.sentiment?.cons?.[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mt-2">
                    <span className="text-rose-700 font-semibold">{book.sentiment?.negativePct}% 差评率</span>
                    <span className="flex items-center gap-1 group-hover:text-rose-700 font-medium">
                      <span>看踩雷实评</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

      </div>

      {/* Controversy & Cultural Divergence Section */}
      {(mobileFilter === 'all' || mobileFilter === 'controversial') && (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-amber-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">两极分化与中西评分差异 (争议作品)</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">豆瓣与 Goodreads/Amazon 评分落差巨大，或观点引发读者激烈论战</p>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-200 shrink-0">
            辩证看待
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {controversial.map((book) => (
            <div
              key={book.id}
              onClick={() => onOpenDetail(book)}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/20 hover:bg-amber-50/50 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer group space-y-2 flex flex-col justify-between active:scale-[0.99]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                    {book.title}
                  </h4>
                  <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                    分歧 {book.discrepancyIndex}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">{book.author}</p>
                <div className="text-[11px] sm:text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed bg-white/70 p-2 rounded-lg border border-amber-100">
                  ⚠️ 争议点: {book.sentiment?.cons?.[0]}
                </div>
              </div>

              <div className="pt-2 border-t border-amber-100/70 flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-slate-500">综合: <b>{book.compositeScore}分</b></span>
                <span className="text-amber-700 font-semibold group-hover:underline flex items-center gap-0.5">
                  <span>剖析分歧</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

    </div>
  );
}
