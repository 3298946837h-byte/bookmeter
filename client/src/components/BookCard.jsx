import React from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, ArrowUpRight, Scale, Download, Heart } from 'lucide-react';
import PlatformRatingBadge from './PlatformRatingBadge';

const FALLBACK_COVER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420" fill="none">
    <rect width="300" height="420" fill="#0f172a"/>
    <rect x="12" y="12" width="276" height="396" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <path d="M60 110h180M60 140h180M60 170h120" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
    <circle cx="150" cy="250" r="38" fill="#0284c7" opacity="0.85"/>
    <path d="M142 240l18 10-18 10v-20z" fill="#ffffff"/>
    <text x="150" y="325" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="15" font-weight="bold" fill="#f8fafc" text-anchor="middle">BookMeter 典藏</text>
    <text x="150" y="350" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">全网书评权威聚合</text>
  </svg>`
)}`;

export default function BookCard({ book, onOpenDetail, onOpenDownload, isFavorite, onToggleFavorite }) {
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
      role="button"
      tabIndex={0}
      aria-label={`查看《${book.title}》全网口碑详情`}
      onClick={() => onOpenDetail(book)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(book);
        }
      }}
      className={`group bg-white/95 backdrop-blur-xs rounded-2xl border ${style.border} shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_36px_-6px_rgba(15,23,42,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative`}
    >
      
      {/* Top Banner / Verdict Ribbon */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 bg-slate-50/80 border-b border-slate-100/80 text-xs">
        <span className="font-semibold text-slate-500 tracking-wide">{book.category} · {book.publicationYear}</span>
        <div className="flex items-center gap-1.5">
          {onToggleFavorite && (
            <button
              type="button"
              aria-label={isFavorite ? `取消收藏《${book.title}》` : `将《${book.title}》加入书架`}
              title={isFavorite ? "已在我的书架 (点击移出)" : "加入我的书架"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(book);
              }}
              className={`w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-all touch-manipulation cursor-pointer active:scale-90 ${
                isFavorite 
                  ? 'text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 shadow-2xs' 
                  : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
          {book.discrepancyIndex >= 1.0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800" title="各平台评分分歧较大">
              <Scale className="w-3 h-3" />
              <span>分歧 {book.discrepancyIndex}</span>
            </span>
          )}
          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] shadow-2xs ${style.badge}`}>
            {book.verdict?.label}
          </span>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="p-3.5 sm:p-5 flex gap-3 sm:gap-4">
        {/* Book Cover with 3D Spine effect */}
        <div className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden book-cover-3d group-hover:scale-105 transition-transform bg-slate-100 border border-slate-200/80 relative">
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_COVER_SVG) {
                e.currentTarget.src = FALLBACK_COVER_SVG;
              }
            }}
          />
        </div>

        {/* Title, Author, Master Score */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1.5">
              <h3 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 tracking-tight">
                {book.title}
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
              {book.author} {book.translator && `· 译: ${book.translator}`}
            </p>

            <p className="text-[10px] sm:text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
              {book.originalTitle}
            </p>
          </div>

          {/* Master Composite Score */}
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">综合权威分:</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                book.compositeScore >= 9.0 ? 'text-emerald-600' :
                book.compositeScore >= 8.2 ? 'text-blue-600' :
                book.compositeScore < 6.0 ? 'text-rose-600' : 'text-slate-800'
              }`}>
                {book.compositeScore}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold">/10</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 ml-auto hidden sm:inline font-mono">
              贝叶斯加权
            </span>
          </div>
        </div>
      </div>

      {/* 4 Major Platform Rating Grid */}
      <div className="px-3.5 sm:px-5 grid grid-cols-2 gap-1.5 sm:gap-2 pb-3">
        <PlatformRatingBadge platform="douban" data={book.platformRatings?.douban} compact={true} />
        <PlatformRatingBadge platform="goodreads" data={book.platformRatings?.goodreads} compact={true} />
        <PlatformRatingBadge platform="amazon" data={book.platformRatings?.amazon} compact={true} />
        <PlatformRatingBadge platform="googleBooks" data={book.platformRatings?.googleBooks} compact={true} />
      </div>

      {/* Sentiment Pros & Cons Highlights */}
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50/60 border-t border-slate-100/80 text-xs space-y-1.5 flex-1">
        {book.sentiment?.pros?.[0] && (
          <div className="flex items-start gap-1.5 text-emerald-800">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="line-clamp-1 text-[10px] sm:text-[11px] font-medium">{book.sentiment.pros[0]}</span>
          </div>
        )}
        {book.sentiment?.cons?.[0] && (
          <div className="flex items-start gap-1.5 text-rose-800">
            <ThumbsDown className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="line-clamp-1 text-[10px] sm:text-[11px] font-medium">{book.sentiment.cons[0]}</span>
          </div>
        )}
      </div>

      {/* Format Availability Badges Bar */}
      <div className="px-3.5 sm:px-5 py-2 bg-slate-50/80 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-semibold">支持格式:</span>
          <div className="flex items-center gap-1">
            {((book.formats && book.formats.length > 0) ? book.formats.map(f => String(f).toUpperCase()) : ['EPUB', 'PDF', 'TXT']).map((fmt) => (
              <span
                key={fmt}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenDownload) onOpenDownload(book);
                }}
                className="px-2 py-0.5 min-h-[26px] inline-flex items-center rounded-md font-mono font-bold text-[10px] bg-sky-50 text-sky-700 border border-sky-200/60 hover:bg-sky-600 hover:text-white transition-all cursor-pointer touch-manipulation active:scale-95 shadow-2xs"
                title={`点击下载 ${fmt} 格式`}
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          免翻墙直下
        </span>
      </div>

      {/* Footer: Sentiment Ratio Bar & Review count */}
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white/90 border-t border-slate-100/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-1 mr-3 sm:mr-4">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/50">
            <div
              style={{ width: `${book.sentiment?.positivePct || 80}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`好评率: ${book.sentiment?.positivePct}%`}
            />
            <div
              style={{ width: `${book.sentiment?.neutralPct || 10}%` }}
              className="bg-amber-400 h-full transition-all"
              title={`中立率: ${book.sentiment?.neutralPct}%`}
            />
            <div
              style={{ width: `${book.sentiment?.negativePct || 10}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`差评率: ${book.sentiment?.negativePct}%`}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-600 font-mono">
            {book.sentiment?.positivePct}% 好评
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenDownload) onOpenDownload(book);
            }}
            title="一键极速下载全本电子书 (EPUB/PDF/TXT)"
            className="min-h-[44px] sm:min-h-[38px] px-3.5 sm:px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50/90 hover:bg-sky-600 hover:text-white rounded-xl border border-sky-200/80 hover:border-sky-600 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs group/dl touch-manipulation"
          >
            <Download className="w-3.5 h-3.5 text-sky-600 group-hover/dl:text-white" />
            <span>下载全书</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(book);
            }}
            className="min-h-[44px] sm:min-h-[38px] px-2.5 sm:px-2 text-slate-500 hover:text-sky-600 font-semibold text-xs flex items-center gap-1 group-hover:underline cursor-pointer touch-manipulation"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">看书评</span>
          </button>
        </div>
      </div>

    </div>
  );
}
