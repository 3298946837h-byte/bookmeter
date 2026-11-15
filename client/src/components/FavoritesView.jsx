import React, { useState } from 'react';
import { Bookmark, Heart, BookOpen, Trash2, Download, CheckCircle, Clock, Star, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import PlatformRatingBadge from './PlatformRatingBadge';

export default function FavoritesView({ favorites = [], onToggleFavorite, onOpenDetail, onExploreBooks }) {
  const [readingFilter, setReadingFilter] = useState('all'); // 'all' | 'want' | 'reading' | 'done'
  const [readStatuses, setReadStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('bookmeter_read_status_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateStatus = (bookId, status, e) => {
    e.stopPropagation();
    const updated = { ...readStatuses, [bookId]: status };
    setReadStatuses(updated);
    try {
      localStorage.setItem('bookmeter_read_status_v1', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save read status:', err);
    }
  };

  const filteredBooks = favorites.filter(b => {
    const status = readStatuses[b.id] || 'want';
    if (readingFilter === 'all') return true;
    return status === readingFilter;
  });

  const doneCount = favorites.filter(b => (readStatuses[b.id] || 'want') === 'done').length;
  const readingCount = favorites.filter(b => readStatuses[b.id] === 'reading').length;
  const wantCount = favorites.filter(b => !readStatuses[b.id] || readStatuses[b.id] === 'want').length;

  const handleExportList = () => {
    if (favorites.length === 0) return;
    let md = `# 我的 BookMeter 专属书单 (${new Date().toLocaleDateString()})\n\n`;
    md += `共收录 ${favorites.length} 本好书 | 已读 ${doneCount} 本 | 在读 ${readingCount} 本 | 想读 ${wantCount} 本\n\n`;
    md += `| 书名 | 作者 | 全网综合分 | 豆瓣 | Goodreads | 我的状态 |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`;
    favorites.forEach(b => {
      const st = readStatuses[b.id] === 'done' ? '✅ 已读完' : readStatuses[b.id] === 'reading' ? '📖 正在读' : '⏳ 想读';
      const dScore = b.platformRatings?.douban?.score ? `${b.platformRatings.douban.score}/10` : '-';
      const gScore = b.platformRatings?.goodreads?.score ? `${b.platformRatings.goodreads.score}/5` : '-';
      md += `| 《${b.title}》 | ${b.author} | ${b.compositeScore || '-'} | ${dScore} | ${gScore} | ${st} |\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `我的书架_BookMeter_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-rose-800/40">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-300 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            <span>个人专属阅读空间 · 永久离线存储</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            我的私房书架 ({favorites.length} 本)
          </h2>
          <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">
            在这里沉淀全网挑出的心仪佳作。支持标记阅读状态（想读 / 在读 / 已读），数据完全保存在浏览器本地，一键导出为标准 Markdown 书单。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportList}
            disabled={favorites.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 hover:bg-rose-50 active:scale-95 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>导出书单 (.md)</span>
          </button>
        </div>
      </div>

      {/* Progress & Stat Pill Bar */}
      {favorites.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReadingFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readingFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部 ({favorites.length})
            </button>
            <button
              onClick={() => setReadingFilter('want')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readingFilter === 'want'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              ⏳ 想读 ({wantCount})
            </button>
            <button
              onClick={() => setReadingFilter('reading')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readingFilter === 'reading'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              📖 在读 ({readingCount})
            </button>
            <button
              onClick={() => setReadingFilter('done')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                readingFilter === 'done'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              ✅ 已读完 ({doneCount})
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>阅读达成率</span>
            <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${favorites.length > 0 ? (doneCount / favorites.length) * 100 : 0}%` }}
              />
            </div>
            <span className="font-bold text-slate-800 font-mono">
              {favorites.length > 0 ? Math.round((doneCount / favorites.length) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Book Grid or Empty State */}
      {favorites.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-slate-800">书架还是空的</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              在书库或搜索结果中，点击任何书籍右上角的「❤️」按钮，即可将它加入您的私人书架，随时查阅与管理阅读进度！
            </p>
          </div>
          <button
            onClick={onExploreBooks}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>立即前往挑选好书</span>
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
          当前分类下暂无书籍，尝试切换上方筛选标签。
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const currentStatus = readStatuses[book.id] || 'want';
            return (
              <div
                key={book.id}
                onClick={() => onOpenDetail(book)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
              >
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-500">{book.category} · {book.publicationYear}</span>
                  <div className="flex items-center gap-1.5">
                    {/* Status Pill Dropdown / Toggle */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={(e) => updateStatus(book.id, 'want', e)}
                        className={`px-1.5 py-0.5 rounded transition-all ${
                          currentStatus === 'want' ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="标记为 想读"
                      >
                        想读
                      </button>
                      <button
                        type="button"
                        onClick={(e) => updateStatus(book.id, 'reading', e)}
                        className={`px-1.5 py-0.5 rounded transition-all ${
                          currentStatus === 'reading' ? 'bg-sky-100 text-sky-800' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="标记为 正在读"
                      >
                        在读
                      </button>
                      <button
                        type="button"
                        onClick={(e) => updateStatus(book.id, 'done', e)}
                        className={`px-1.5 py-0.5 rounded transition-all ${
                          currentStatus === 'done' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="标记为 已读完"
                      >
                        已读
                      </button>
                    </div>

                    {/* Remove from Favorite */}
                    <button
                      type="button"
                      aria-label="从书架移除"
                      title="移出书架"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(book);
                      }}
                      className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex gap-4">
                  <div className="w-20 h-28 shrink-0 rounded-xl overflow-hidden shadow-md bg-slate-100 border border-slate-200">
                    <img
                      src={book.cover}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 truncate group-hover:text-rose-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {book.author}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {book.summary}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400">综合</span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {book.compositeScore}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-600 hover:underline inline-flex items-center gap-0.5">
                        <span>详情</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
