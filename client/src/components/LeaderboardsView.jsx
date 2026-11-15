import React, { useState } from 'react';
import { Award, Star, TrendingUp, Scale, ArrowRight, ExternalLink } from 'lucide-react';
import PlatformRatingBadge from './PlatformRatingBadge';

export default function LeaderboardsView({ books, onOpenDetail }) {
  const [activeBoard, setActiveBoard] = useState('douban'); // 'douban' | 'goodreads' | 'amazon' | 'discrepancy'

  // Sort lists
  const doubanTop = [...books].sort((a, b) => b.platformRatings.douban.score - a.platformRatings.douban.score);
  const goodreadsTop = [...books].sort((a, b) => b.platformRatings.goodreads.score - a.platformRatings.goodreads.score);
  const amazonTop = [...books].sort((a, b) => b.platformRatings.amazon.score - a.platformRatings.amazon.score);
  const discrepancyTop = [...books].sort((a, b) => b.discrepancyIndex - a.discrepancyIndex);

  const boards = [
    { id: 'douban', name: '豆瓣读书 Top 权威榜', icon: '📗', desc: '以中文深度书评与文青口碑著称，10分制衡量', color: 'emerald', list: doubanTop },
    { id: 'goodreads', name: 'Goodreads 全球读者殿堂榜', icon: '📙', desc: '全球最大读书社区数百万真实投票，5星制衡量', color: 'amber', list: goodreadsTop },
    { id: 'amazon', name: 'Amazon 购买真评好评榜', icon: '📦', desc: '真金白银购买读者验证，衡量大众阅读普及度', color: 'orange', list: amazonTop },
    { id: 'discrepancy', name: '跨平台最大争议与分歧榜', icon: '⚖️', desc: '中西审美冲突或机翻翻车，分歧指数最大', color: 'rose', list: discrepancyTop }
  ];

  const currentBoard = boards.find(b => b.id === activeBoard) || boards[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>四大权威平台垂直风云榜</span>
            </div>
            <h2 className="text-2xl font-black">
              不同平台到底更喜欢什么书？横向穿透平台偏见
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              豆瓣重文学性与哲学思辨，Goodreads偏爱叙事宏大与通俗性，Amazon看重大众实用度。切换下方榜单，看清不同权威视角的评价图景。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs shrink-0">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-lg font-black text-emerald-400">豆瓣 9.8</div>
              <div className="text-[10px] text-slate-400 mt-0.5">历史最高分记录</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-lg font-black text-amber-400">Goodreads 4.67★</div>
              <div className="text-[10px] text-slate-400 mt-0.5">全球读者登顶神作</div>
            </div>
          </div>
        </div>

        {/* Board Selection Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800">
          {boards.map(b => {
            const isActive = activeBoard === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveBoard(b.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-lg scale-105'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <span>{b.icon}</span>
                <span>{b.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Board Description */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2">
        <div>
          当前榜单：<b className="text-slate-800">{currentBoard.name}</b> · {currentBoard.desc}
        </div>
        <div>共收录 {currentBoard.list.length} 本代表作品</div>
      </div>

      {/* Board Books List */}
      <div className="space-y-3">
        {currentBoard.list.map((book, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;

          let displayScore = '';
          if (activeBoard === 'douban') {
            displayScore = `${book.platformRatings.douban.score} 分`;
          } else if (activeBoard === 'goodreads') {
            displayScore = `${book.platformRatings.goodreads.score} 星`;
          } else if (activeBoard === 'amazon') {
            displayScore = `${book.platformRatings.amazon.score} 星`;
          } else {
            displayScore = `落差 ${book.discrepancyIndex} 分`;
          }

          return (
            <div
              key={book.id}
              onClick={() => onOpenDetail(book)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
            >
              {/* Rank Badge */}
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 ${
                rank === 1 ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30' :
                rank === 2 ? 'bg-slate-300 text-slate-800' :
                rank === 3 ? 'bg-amber-700/20 text-amber-800' :
                'bg-slate-100 text-slate-500'
              }`}>
                {rank}
              </div>

              {/* Cover */}
              <img
                src={book.cover}
                alt={book.title}
                className="w-14 h-20 sm:w-16 sm:h-22 object-cover rounded-xl shadow-sm shrink-0 border border-slate-200"
              />

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                    {book.title}
                  </h4>
                  {book.isNewRelease && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700">
                      2023-2024新书
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                    book.verdict?.status === 'masterpiece' ? 'bg-emerald-100 text-emerald-800' :
                    book.verdict?.status === 'warning' ? 'bg-rose-100 text-rose-800' :
                    book.verdict?.status === 'controversial' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {book.verdict?.label}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {book.author} · {book.category} · {book.publicationYear}年
                </p>

                <p className="text-xs text-slate-600 line-clamp-1 mt-1 hidden sm:block">
                  💡 {book.sentiment?.pros?.[0] || book.summary}
                </p>
              </div>

              {/* Score Display */}
              <div className="text-right shrink-0">
                <div className={`text-base sm:text-xl font-black ${
                  activeBoard === 'discrepancy' ? 'text-amber-600' :
                  isTop3 ? 'text-emerald-600' : 'text-slate-800'
                }`}>
                  {displayScore}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  综合加权: {book.compositeScore}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-1 transition-all shrink-0 ml-1 hidden sm:block" />
            </div>
          );
        })}
      </div>

    </div>
  );
}
