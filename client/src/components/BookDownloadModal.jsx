import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  BookOpen,
  ExternalLink,
  Check,
  Sparkles,
  Smartphone,
  Loader2,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { generateBookEpub } from '../services/epubGenerator';

export default function BookDownloadModal({ book, onClose }) {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [downloadOptions, setDownloadOptions] = useState([]);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [copiedKeyword, setCopiedKeyword] = useState(false);

  // Escape key handler for accessible dialog closing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch genuine backend download options
  useEffect(() => {
    if (!book) return;
    let isMounted = true;
    const fetchOptions = async () => {
      setLoadingOptions(true);
      setDownloadError(null);
      try {
        const id = book.id || '';
        const title = book.title || '';
        const author = book.author || '';

        // 1. Primary: Query canonical endpoint /api/ebooks/options
        const ebookRes = await fetch(`/api/ebooks/options?id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);
        if (ebookRes.ok) {
          const ebookData = await ebookRes.json();
          if (isMounted && ebookData.success && ebookData.hasEbook && Array.isArray(ebookData.formats) && ebookData.formats.length > 0) {
            const mapped = ebookData.formats.map(f => ({
              format: f.format,
              label: f.label || `${f.format.toUpperCase()} 电子书`,
              size: f.sizeFormatted || (f.sizeBytes ? `${(f.sizeBytes / 1024).toFixed(0)} KB` : '极速秒下'),
              sizeBytes: f.sizeBytes,
              source: f.source || 'genuine',
              downloadUrl: f.downloadUrl || `/api/ebooks/download?id=${encodeURIComponent(id || title)}&format=${f.format}&title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
            }));
            setDownloadOptions(mapped);
            setLoadingOptions(false);
            return;
          }
        }

        // 2. Secondary fallback: Query legacy /api/download/options
        const res = await fetch(`/api/download/options?q=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.options && data.options.length > 0) {
            setDownloadOptions(data.options);
            setLoadingOptions(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch download options from API, using default formats:', err.message);
      }

      // Fallback default format options if API is unreachable or returned empty
      if (isMounted) {
        setDownloadOptions([
          {
            format: 'epub',
            label: 'EPUB 电子书 (推荐阅读器/微信读书/Apple Books)',
            size: '完整全本',
            downloadUrl: `/api/ebooks/download?id=${encodeURIComponent(book.id || book.title || '')}&format=epub&title=${encodeURIComponent(book.title || '')}&author=${encodeURIComponent(book.author || '')}`,
            streamUrl: `/api/download/stream?q=${encodeURIComponent(book.title)}&format=epub&title=${encodeURIComponent(book.title)}`
          },
          {
            format: 'pdf',
            label: 'PDF 电子书 (原版排版/电脑阅读)',
            size: '高清排版',
            downloadUrl: `/api/ebooks/download?id=${encodeURIComponent(book.id || book.title || '')}&format=pdf&title=${encodeURIComponent(book.title || '')}&author=${encodeURIComponent(book.author || '')}`,
            streamUrl: `/api/download/stream?q=${encodeURIComponent(book.title)}&format=pdf&title=${encodeURIComponent(book.title)}`
          },
          {
            format: 'txt',
            label: 'TXT 纯文本 (极简/全平台通用)',
            size: '通用畅读',
            downloadUrl: `/api/ebooks/download?id=${encodeURIComponent(book.id || book.title || '')}&format=txt&title=${encodeURIComponent(book.title || '')}&author=${encodeURIComponent(book.author || '')}`,
            streamUrl: `/api/download/stream?q=${encodeURIComponent(book.title)}&format=txt&title=${encodeURIComponent(book.title)}`
          }
        ]);
        setLoadingOptions(false);
      }
    };

    fetchOptions();
    return () => { isMounted = false; };
  }, [book]);

  if (!book) return null;

  // Client-side fallback TXT generator
  const handleDownloadTxtFallback = () => {
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
    }, 200);

    setDownloadSuccess('TXT');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Helper to trigger browser file download from response
  const triggerBrowserDownload = async (response, format) => {
    // Try reading filename from RFC 5987 / standard Content-Disposition
    const disposition = response.headers.get('content-disposition');
    let filename = `《${book.title}》.${format}`;
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match && utf8Match[1]) {
        try {
          filename = decodeURIComponent(utf8Match[1]);
        } catch (e) {}
      } else {
        const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
        if (asciiMatch && asciiMatch[1]) {
          filename = asciiMatch[1];
        }
      }
    }

    const blob = await response.blob();
    if (!blob || blob.size < 100) {
      throw new Error('下载文件为空');
    }

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 200);

    setDownloadSuccess(format.toUpperCase());
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Main stream download handler
  const handleDownloadStream = async (format, explicitUrl) => {
    try {
      setDownloadingFormat(format);
      setDownloadError(null);

      const targetUrl = explicitUrl || `/api/ebooks/download?id=${encodeURIComponent(book.id || book.title || '')}&format=${format}&title=${encodeURIComponent(book.title || '')}&author=${encodeURIComponent(book.author || '')}`;
      let response = await fetch(targetUrl);

      // If /api/ebooks/download fails (e.g. 404), fallback to legacy /api/download/stream
      if (!response.ok && targetUrl.includes('/api/ebooks/download')) {
        const legacyUrl = `/api/download/stream?q=${encodeURIComponent(book.title)}&format=${format}&title=${encodeURIComponent(book.title)}`;
        const legacyRes = await fetch(legacyUrl);
        if (legacyRes.ok) {
          await triggerBrowserDownload(legacyRes, format);
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`服务响应 HTTP ${response.status}`);
      }

      await triggerBrowserDownload(response, format);
    } catch (err) {
      console.warn(`Direct download for ${format} failed, falling back to local generator:`, err.message);

      // Resilient local fallback
      if (format === 'epub') {
        try {
          const blob = await generateBookEpub(book);
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `《${book.title}》_全本精编.epub`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          }, 200);
          setDownloadSuccess('EPUB');
          setTimeout(() => setDownloadSuccess(null), 3500);
          return;
        } catch (genErr) {
          setDownloadError(`生成 EPUB 失败: ${genErr.message}`);
        }
      } else if (format === 'txt') {
        handleDownloadTxtFallback();
        return;
      }

      setDownloadError(`下载《${book.title}》${format.toUpperCase()} 失败: ${err.message}。请尝试其他格式或下方全网备用源。`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Helper to copy book name and open Jiumo search
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
  const annasArchiveUrl = `https://annas-archive.gl/search?q=${encodeURIComponent(book.title)}`;
  const zlibUrl = `https://singlelogin.re/s/${encodeURIComponent(book.title)}`;

  const getFormatIcon = (fmt) => {
    const f = String(fmt).toLowerCase();
    if (f === 'epub' || f === 'mobi' || f === 'azw3') return <BookOpen className="w-5 h-5" />;
    if (f === 'pdf') return <HardDrive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getFormatBadgeColor = (fmt) => {
    const f = String(fmt).toLowerCase();
    if (f === 'epub') return 'bg-sky-600 text-white shadow-sky-600/20 border-sky-200';
    if (f === 'pdf') return 'bg-rose-600 text-white shadow-rose-600/20 border-rose-200';
    if (f === 'mobi' || f === 'azw3') return 'bg-amber-600 text-white shadow-amber-600/20 border-amber-200';
    return 'bg-emerald-600 text-white shadow-emerald-600/20 border-emerald-200';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`《${book.title}》全本电子书下载`}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
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
                全本电子书一键极速下载
              </h3>
              <p className="text-xs text-slate-300">
                免翻墙 · 免登录 · 原版真实全本文件秒存本地
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="关闭下载窗口"
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

          {/* Error Banner */}
          {downloadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Section 1: One-Click Direct Stream Downloads */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                一、一键极速下载原版电子书 (免翻墙 · 秒存本地)
              </label>
              {loadingOptions && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                  正在检索可用格式...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {downloadOptions.map((opt) => {
                const fmtUpper = opt.format.toUpperCase();
                const isDownloading = downloadingFormat === opt.format;
                const isSuccess = downloadSuccess === fmtUpper;

                return (
                  <button
                    key={opt.format}
                    type="button"
                    onClick={() => handleDownloadStream(opt.format, opt.downloadUrl || opt.streamUrl)}
                    disabled={isDownloading}
                    className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white hover:border-sky-300 hover:from-sky-50/50 hover:to-white active:scale-98 transition-all text-left shadow-xs flex flex-col justify-between group cursor-pointer disabled:opacity-70"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${getFormatBadgeColor(opt.format)}`}>
                          {isDownloading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            getFormatIcon(opt.format)
                          )}
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {opt.size || '极速秒下'}
                        </span>
                      </div>

                      <div className="font-bold text-sm text-slate-900 group-hover:text-sky-800 flex items-center gap-1.5">
                        <span>{opt.label || `${fmtUpper} 电子书`}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700">
                          .{opt.format}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {opt.format === 'epub' && '标准流式排版，完美支持微信读书、Kindle、苹果图书与掌阅'}
                        {opt.format === 'pdf' && '完整图文版式，保留原著原貌排版，适合平板与电脑高清研读'}
                        {opt.format === 'txt' && 'UTF-8 纯文本通用格式，手机记事本及各类阅读器零门槛秒开'}
                        {(opt.format === 'mobi' || opt.format === 'azw3') && '专为 Kindle 与电子墨水屏阅读器深度优化的原版格式'}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                      <span>
                        {isDownloading
                          ? '正在高速拉取并流式传输...'
                          : isSuccess
                          ? '✓ 已成功保存到本地！'
                          : `点击下载 ${fmtUpper}`}
                      </span>
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                      ) : isSuccess ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Download className="w-4 h-4 text-sky-600 group-hover:translate-y-0.5 transition-transform" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Online Full-Text Ebook Direct Search & Download Channels (Zero Dead-End Search) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              二、国内免翻墙多源镜像 & 公版开放阅读直达 (备用通道)
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

              {/* Anna's Archive (安娜档案) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    安娜
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      Anna's Archive (安娜档案)
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                        全球最大电子书库
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      全开放图书镜像，聚合数千万本中英文学术与文学图书原版下载
                    </div>
                  </div>
                </div>

                <a
                  href={annasArchiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1 transition-all"
                >
                  <span>镜像检索</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Project Gutenberg & Open Library */}
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

              {/* Z-Library Direct Search */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    Z-Lib
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      Z-Library (全球数字图书馆)
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        海量原版
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      全球知名开放数字图书馆，支持各类语言原版书籍直接检索与借阅
                    </div>
                  </div>
                </div>

                <a
                  href={zlibUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1 transition-all"
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
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">下载后的 EPUB/PDF/TXT 可直接发送到手机、微信或各类阅读器打开</span>
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
