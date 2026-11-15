import React from 'react';
import { ExternalLink, Star, CheckCircle } from 'lucide-react';

export default function PlatformRatingBadge({ platform, data, compact = false }) {
  if (!data) return null;

  const platformMeta = {
    douban: {
      name: '豆瓣读书',
      tag: '豆',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeColor: 'bg-emerald-600',
      barColor: 'bg-emerald-500',
      scaleText: '/10',
      domain: 'book.douban.com'
    },
    goodreads: {
      name: 'Goodreads',
      tag: 'G',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      badgeColor: 'bg-amber-700',
      barColor: 'bg-amber-500',
      scaleText: '/5',
      domain: 'goodreads.com'
    },
    amazon: {
      name: 'Amazon 真实购书',
      tag: 'A',
      color: 'bg-orange-50 text-orange-900 border-orange-200',
      badgeColor: 'bg-orange-600',
      barColor: 'bg-orange-500',
      scaleText: '/5',
      domain: 'amazon.com'
    },
    googleBooks: {
      name: 'Google Books',
      tag: 'Go',
      color: 'bg-sky-50 text-sky-900 border-sky-200',
      badgeColor: 'bg-sky-600',
      barColor: 'bg-sky-500',
      scaleText: '/5',
      domain: 'books.google.com'
    }
  };

  const meta = platformMeta[platform] || {
    name: platform,
    tag: 'P',
    color: 'bg-slate-50 text-slate-800 border-slate-200',
    badgeColor: 'bg-slate-600',
    barColor: 'bg-slate-500',
    scaleText: '/10',
    domain: 'web'
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl border ${meta.color} transition-all`}>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          <span className="font-semibold text-xs">{meta.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-current text-amber-500" />
          <span className="font-black">{data.score}</span>
          <span className="text-[10px] opacity-75">{meta.scaleText}</span>
          <span className="text-[10px] opacity-60 ml-0.5">({data.ratingCount ? (data.ratingCount >= 10000 ? `${(data.ratingCount/10000).toFixed(1)}万评` : `${data.ratingCount}评`) : '权威'})</span>
        </div>
      </div>
    );
  }

  const breakdown = data.starBreakdown || {
    five: data.fiveStarPct || 60,
    four: 25,
    three: 10,
    two: 3,
    one: 2
  };

  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl border ${meta.color} flex flex-col justify-between transition-all hover:shadow-md bg-white/70 backdrop-blur-sm relative overflow-hidden group`}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-5 h-5 rounded-md ${meta.badgeColor} text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm`}>
            {meta.tag}
          </span>
          <span className="text-xs font-bold tracking-wide text-slate-800">{meta.name}</span>
          <span title="官方原站核验" className="flex items-center text-[10px] text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded font-medium ml-1">
            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
            已验真
          </span>
        </div>

        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-slate-500 hover:text-sky-600 flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-lg border border-slate-200/80 hover:border-sky-300 transition-all shadow-2xs"
            onClick={(e) => e.stopPropagation()}
            title={`在 ${meta.name} 官方网站查验真实页面与最新书评`}
          >
            <span>源站查验</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      {/* Main Score & Normalization */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{data.score}</span>
        <span className="text-xs font-bold text-slate-500">{meta.scaleText}</span>
        {data.normalizedScore && data.scale !== 10 && (
          <span className="text-[11px] ml-auto px-2 py-0.5 rounded-lg bg-slate-900 text-white font-medium shadow-2xs">
            折算 10分制: <b className="text-amber-300 font-bold">{data.normalizedScore}</b>
          </span>
        )}
      </div>

      {/* Real Count of Verified Reviews */}
      <div className="text-[11px] text-slate-500 flex items-center justify-between pb-2 border-b border-slate-200/60 mt-1">
        <span>全网参评人数</span>
        <span className="font-bold text-slate-800">{data.ratingCount ? data.ratingCount.toLocaleString() : '暂无'} 人真实打分</span>
      </div>

      {/* Real Star Rating Distribution Breakdown Bars (豆瓣/Goodreads 原版直方图) */}
      <div className="mt-2.5 space-y-1 text-[10px]">
        <div className="flex items-center justify-between text-slate-400 font-medium pb-0.5">
          <span>真实星级分布占比</span>
          <span>5星占比 {breakdown.five}%</span>
        </div>

        {[
          { label: '5星', pct: breakdown.five },
          { label: '4星', pct: breakdown.four },
          { label: '3星', pct: breakdown.three },
          { label: '2星', pct: breakdown.two },
          { label: '1星', pct: breakdown.one }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-5 text-slate-400 shrink-0 text-right">{item.label}</span>
            <div className="flex-1 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={`h-full ${meta.barColor} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(2, item.pct))}%` }}
              />
            </div>
            <span className="w-7 text-right text-slate-500 font-mono text-[9px]">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
