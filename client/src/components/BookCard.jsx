import React from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, ArrowUpRight, Scale } from 'lucide-react';
import PlatformRatingBadge from './PlatformRatingBadge';

export default function BookCard({ book, onOpenDetail }) {
  if (!book) return null;

  const verdictStyles = {
    masterpiece: {
      badge: 'bg-emerald-500 text-white',
      border: 'border-emerald-200 hover:border-emerald-400',
      bgTag: 'bg-emerald-50 text-emerald-700',
      bar: 'bg-emerald-500'
    },
    recommended: {
      badge: 'bg-blue-600 text-white',
      border: 'border-blue-200 hover:border-blue-400',
      bgTag: 'bg-blue-50 text-blue-700',
      bar: 'bg-blue-500'
    },
    controversial: {
      badge: 'bg-amber-500 text-white',
      border: 'border-amber-200 hover:border-amber-400',
      bgTag: 'bg-amber-50 text-amber-700',
      bar: 'bg-amber-500'
    },
    warning: {
      badge: 'bg-rose-500 text-white',
      border: 'border-rose-300 hover:border-rose-400 bg-rose-50/20',
      bgTag: 'bg-rose-50 text-rose-700',
      bar: 'bg-rose-500'
    },
    mediocre: {
      badge: 'bg-slate-500 text-white',
      border: 'border-slate-200 hover:border-slate-300',
      bgTag: 'bg-slate-50 text-slate-700',
      bar: 'bg-slate-400'
    }
  };

  const style = verdictStyles[book.verdict?.status] || verdictStyles.mediocre;

  return (
    <div
      onClick={() => onOpenDetail(book)}
      className={`group bg-white rounded-2xl border ${style.border} shadow-sm hover:shadow-xl active:scale-[0.99] transition-all duration-200 flex flex-col overflow-hidden cursor-pointer relative`}
    >
      
      {/* Top Banner / Verdict Ribbon */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 bg-slate-50/80 border-b border-slate-100 text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-500 truncate">{book.category} · {book.publicationYear}</span>
          {book.isLiveCrawled && (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white shrink-0 shadow-sm animate-pulse">
              ⚡ 全网实时新收录
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {book.discrepancyIndex >= 1.0 && (
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-800" title="各平台评分分歧较大">
              <Scale className="w-3 h-3" />
              <span>分歧 {book.discrepancyIndex}</span>
            </span>
          )}
          <span className={`px-2 sm:px-2.5 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] ${style.badge}`}>
            {book.verdict?.label}
          </span>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="p-3.5 sm:p-5 flex gap-3 sm:gap-4">
        {/* Book Cover */}
        <div className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform bg-slate-100 border border-slate-200 relative">
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
            }}
          />
        </div>

        {/* Title, Author, Master Score */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-bold text-sm sm:text-lg text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                {book.title}
              </h3>
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
              {book.author} {book.translator && `· 译: ${book.translator}`}
            </p>

            <p className="text-[10px] sm:text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
              {book.originalTitle}
            </p>
          </div>

          {/* Master Composite Score */}
          <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">综合权威分:</span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className={`text-xl sm:text-2xl font-black ${
                book.compositeScore >= 9.0 ? 'text-emerald-600' :
                book.compositeScore >= 8.2 ? 'text-blue-600' :
                book.compositeScore < 6.0 ? 'text-rose-600' : 'text-slate-800'
              }`}>
                {book.compositeScore}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold">/10</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 ml-auto hidden sm:inline">
              贝叶斯加权对冲
            </span>
          </div>
        </div>
      </div>

      {/* 4 Major Platform Rating Grid */}
      <div className="px-3.5 sm:px-5 grid grid-cols-2 gap-1.5 sm:gap-2 pb-2.5 sm:pb-3">
        <PlatformRatingBadge platform="douban" data={book.platformRatings.douban} compact={true} />
        <PlatformRatingBadge platform="goodreads" data={book.platformRatings.goodreads} compact={true} />
        <PlatformRatingBadge platform="amazon" data={book.platformRatings.amazon} compact={true} />
        <PlatformRatingBadge platform="googleBooks" data={book.platformRatings.googleBooks} compact={true} />
      </div>

      {/* Sentiment Pros & Cons Highlights */}
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/70 border-t border-slate-100 text-[11px] sm:text-xs space-y-1 sm:space-y-1.5 flex-1">
        {book.sentiment?.pros?.[0] && (
          <div className="flex items-start gap-1.5 text-emerald-800">
            <ThumbsUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="line-clamp-1 text-[10px] sm:text-[11px] font-medium">{book.sentiment.pros[0]}</span>
          </div>
        )}
        {book.sentiment?.cons?.[0] && (
          <div className="flex items-start gap-1.5 text-rose-800">
            <ThumbsDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1 text-[10px] sm:text-[11px] font-medium">{book.sentiment.cons[0]}</span>
          </div>
        )}
      </div>

      {/* Footer: Sentiment Ratio Bar & Review count */}
      <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 mr-3 sm:mr-4">
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${book.sentiment?.positivePct || 80}%` }}
              className="bg-emerald-500 h-full"
              title={`好评率: ${book.sentiment?.positivePct}%`}
            />
            <div
              style={{ width: `${book.sentiment?.neutralPct || 10}%` }}
              className="bg-amber-400 h-full"
              title={`中立率: ${book.sentiment?.neutralPct}%`}
            />
            <div
              style={{ width: `${book.sentiment?.negativePct || 10}%` }}
              className="bg-rose-500 h-full"
              title={`差评率: ${book.sentiment?.negativePct}%`}
            />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 shrink-0">
            {book.sentiment?.positivePct}% 好评
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(book);
          }}
          className="text-sky-600 hover:text-sky-700 font-semibold text-[11px] sm:text-xs flex items-center gap-1 group-hover:underline shrink-0"
        >
          <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>书评详情</span>
        </button>
      </div>

    </div>
  );
}
