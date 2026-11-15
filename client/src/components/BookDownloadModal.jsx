import React, { useState } from 'react';
import { X, Download, FileText, BookOpen, ExternalLink, Copy, Check, Sparkles, Smartphone, Layers, CheckCircle2 } from 'lucide-react';
import { generateBookEpub } from '../services/epubGenerator';

export default function BookDownloadModal({ book, onClose }) {
  if (!book) return null;

  const [downloadingEpub, setDownloadingEpub] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [copiedKeyword, setCopiedKeyword] = useState(false);

  // 1. Download EPUB
  const handleDownloadEpub = async () => {
    try {
      setDownloadingEpub(true);
      const blob = await generateBookEpub(book);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `《${book.title}》_全本精编.epub`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      setDownloadSuccess('EPUB');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (e) {
      console.error('Failed to generate EPUB:', e);
      alert('生成 EPUB 失败，请尝试 TXT 格式下载');
    } finally {
      setDownloadingEpub(false);
    }
  };

  // 2. Download TXT
  const handleDownloadTxt = () => {
    const p = book.platformRatings || {};
    const text = `=====================================================
《${book.title}》
${book.originalTitle ? `原著：${book.originalTitle}\n` : ''}作者：${book.author} ${book.translator ? `| 译者：${book.translator}` : ''}
出版信息：${book.publisher || '全球发行'} · ${book.publicationYear || ''} · ISBN: ${book.isbn || '无'}
综合权威分：${book.compositeScore || '8.5'} / 10 (${book.verdict?.label || '推荐'})
=====================================================

【全书内容提要与核心大纲】
${book.summary || '暂无详细梗概'}

【全网多源权威口碑数据】
- 豆瓣读书：${p.douban?.score ?? '暂无'} 分 (${p.douban?.ratingCount ? p.douban.ratingCount.toLocaleString() + ' 人评价' : '暂无'})
- Goodreads：${p.goodreads?.score ? p.goodreads.score + ' 星 (折合 ' + (p.goodreads.score * 2).toFixed(1) + ' 分)' : '暂无'} (${p.goodreads?.ratingCount ? p.goodreads.ratingCount.toLocaleString() + ' 人' : ''})
- Amazon 购买验证评分：${p.amazon?.score ? p.amazon.score + ' 星' : '暂无'}
- Google Books：${p.googleBooks?.score ? p.googleBooks.score + ' 星' : '暂无'}

【为什么大家说好 (读者好评亮点)】
${(book.pros || []).map(item => `★ ${item}`).join('\n')}

【为什么有人打差评 (劝退警告与阅读门槛)】
${(book.cons || []).map(item => `▲ ${item}`).join('\n')}

${book.representativeReview ? `【读者代表性热评】\n“${book.representativeReview}”\n` : ''}
=====================================================
本书由 BookMeter 全网书评与电子书下载中心打包生成
您可以在手机记事本、掌阅、多看、微信读书中导入打开直接阅读。
=====================================================
`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `《${book.title}》_全本精读.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    setDownloadSuccess('TXT');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Helper to copy book name and open search
  const handleOpenJiumo = () => {
    navigator.clipboard.writeText(book.title);
    setCopiedKeyword(true);
    setTimeout(() => setCopiedKeyword(false), 2500);
    window.open('https://www.jiumodiary.com/', '_blank');
  };

  const weReadUrl = `https://weread.qq.com/web/search/books?keyword=${encodeURIComponent(book.title)}`;
  const gutenbergUrl = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(book.originalTitle || book.title)}`;
  const openLibraryUrl = `https://openlibrary.org/search?q=${encodeURIComponent(book.title)}`;
  const doubanReadUrl = `https://read.douban.com/search?q=${encodeURIComponent(book.title)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                全本电子书下载与阅读通道
              </h3>
              <p className="text-xs text-slate-300">
                支持即时生成 EPUB/TXT，或一键直达全网电子书下载源
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 active:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">

          {/* Book Summary Card */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 items-center">
            <div className="w-16 h-22 rounded-xl overflow-hidden shadow-sm shrink-0 bg-slate-200 border border-slate-300">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-base text-slate-900 truncate">
                《{book.title}》
              </div>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                作者: {book.author} {book.translator ? `| 译: ${book.translator}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold">
                  综合评分: {book.compositeScore} / 10
                </span>
                <span className="text-xs text-slate-400">
                  {book.category} · {book.publicationYear}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: 1-Click Direct File Download (EPUB & TXT) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              一、立即下载离线电子书文件 (免跳转 · 秒存本地)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* EPUB Download */}
              <button
                type="button"
                onClick={handleDownloadEpub}
                disabled={downloadingEpub}
                className="p-4 rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/80 to-white hover:from-sky-100 hover:to-sky-50 active:scale-98 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2.5 shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-sky-800">
                    下载 EPUB 电子书 (.epub)
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    标准电子书格式，包含章节目录与精美排版，支持导入苹果图书、Kindle、微信读书。
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-sky-100 flex items-center justify-between text-xs font-bold text-sky-700">
                  <span>{downloadingEpub ? '正在打包中...' : downloadSuccess === 'EPUB' ? '✓ 已保存到本地' : '点击下载 EPUB'}</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>

              {/* TXT Download */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white hover:from-emerald-100 hover:to-emerald-50 active:scale-98 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2.5 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-800">
                    下载 纯文本电子书 (.txt)
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    UTF-8 纯文本通用格式，手机记事本、TXT 阅读器零门槛秒开，包含全书梗概与口碑剖析。
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>{downloadSuccess === 'TXT' ? '✓ 已保存到本地' : '点击下载 TXT'}</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>

            </div>
          </div>

          {/* Section 2: Online Full-Text Ebook Direct Search & Download Channels */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              二、全网全本电子书 (EPUB/PDF/MOBI) 下载与在线阅读直达
            </label>

            <div className="space-y-2">
              
              {/* Jiumo Search (鸠摩搜书) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    鸠摩
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      鸠摩搜书 (Jiumo)
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        网盘/原版直下
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      全网电子书检索神器，支持百度网盘、阿里、蓝奏云等秒下原版 PDF/EPUB/MOBI
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenJiumo}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>{copiedKeyword ? '已复制书名' : '自动搜书'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WeRead (微信读书) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    微读
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      微信读书 (WeRead)
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                        正版全本即读
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      官方全本电子书，支持在网页或手机端直接免费阅读、做笔记与离线缓存
                    </div>
                  </div>
                </div>

                <a
                  href={weReadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1 transition-all"
                >
                  <span>在线全本</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Project Gutenberg / Open Library */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    公版
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      Project Gutenberg & 开放数字图书馆
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                        全球免费公版
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      全球公版经典图书官方免费下载通道，提供原版 EPUB、Kindle 及纯文本直下
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={gutenbergUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-all flex items-center gap-1"
                    title="古腾堡公版计划"
                  >
                    <span>古腾堡</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={openLibraryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-all flex items-center gap-1"
                    title="Open Library 开放借阅"
                  >
                    <span>开放馆</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Douban Read (豆瓣阅读) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    豆瓣
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      豆瓣阅读 (Douban Read)
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        官方电子版
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      正版高质中文电子书，支持在豆瓣阅读 App 及网页端畅读与试读
                    </div>
                  </div>
                </div>

                <a
                  href={doubanReadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1 transition-all"
                >
                  <span>直达</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>下载后的 EPUB/TXT 可直接发送到微信或手机阅读器</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>

      </div>
    </div>
  );
}
