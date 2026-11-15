import React from 'react';
import { ExternalLink, Star } from 'lucide-react';

export default function PlatformRatingBadge({ platform, data, compact = false }) {
  if (!data) return null;

  const platformMeta = {
    douban: {
      name: '豆瓣读书',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeColor: 'bg-emerald-600',
      scaleText: '/10',
      isDouban: true
    },
    goodreads: {
      name: 'Goodreads',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeColor: 'bg-amber-700',
      scaleText: '/5',
      isGoodreads: true
    },
    amazon: {
      name: 'Amazon',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      badgeColor: 'bg-orange-600',
      scaleText: '/5',
      isAmazon: true
    },
    googleBooks: {
      name: 'Google Books',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeColor: 'bg-blue-600',
      scaleText: '/5',
      isGoogle: true
    }
  };

  const meta = platformMeta[platform] || {
    name: platform,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    badgeColor: 'bg-slate-600',
    scaleText: '/10'
  };

  const formatCount = (count) => {
    if (!count) return '0评';
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万评`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k评`;
    }
    return `${count}评`;
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border ${meta.color}`}>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          <span>{meta.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          <span className="font-bold">{data.score}</span>
          <span className="text-[10px] opacity-75">{meta.scaleText}</span>
          <span className="text-[10px] opacity-60 ml-1">({formatCount(data.ratingCount)})</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${meta.color} flex flex-col justify-between transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-wide uppercase">{meta.name}</span>
        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs opacity-75 hover:opacity-100 flex items-center gap-0.5 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <span>源站</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black">{data.score}</span>
        <span className="text-xs opacity-75 font-semibold">{meta.scaleText}</span>
        {data.normalizedScore && data.scale !== 10 && (
          <span className="text-[11px] ml-auto px-1.5 py-0.5 rounded bg-white/70 font-medium">
            折算 10分制: <b>{data.normalizedScore}</b>
          </span>
        )}
      </div>

      <div className="mt-2 text-[11px] opacity-75 flex items-center justify-between">
        <span>参评人数</span>
        <span className="font-semibold">{data.ratingCount ? data.ratingCount.toLocaleString() : '暂无'}</span>
      </div>
    </div>
  );
}
