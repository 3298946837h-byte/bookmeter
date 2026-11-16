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

export default function BookDownloadModal({ book, onClose }) {
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [downloadOptions, setDownloadOptions] = useState([]);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [copiedKeyword, setCopiedKeyword] = useState(false);
  const [copiedQuark, setCopiedQuark] = useState(false);

  // Escape key handler and body scroll lock for mobile modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
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
        } catch {}
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

    let finalBlob = blob;
    if (format.toLowerCase() === 'txt') {
      try {
        const header = await blob.slice(0, 3).arrayBuffer();
        const bytes = new Uint8Array(header);
        const hasBom = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
        if (!hasBom) {
          finalBlob = new Blob(['\uFEFF', blob], { type: 'text/plain;charset=utf-8' });
        }
      } catch {}
    }

    const blobUrl = URL.createObjectURL(finalBlob);
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
        let errMsg = `服务响应 HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch {}
        throw new Error(errMsg);
      }

      await triggerBrowserDownload(response, format);
    } catch (err) {
      console.warn(`Direct download for ${format} failed:`, err.message);
      // Zero-Fake Policy: strictly display honest status and never fabricate summary text
      setDownloadError(err.message.includes('严禁交付') || err.message.includes('未在全网')
        ? err.message
        : `未检索到书籍《${book.title}》的真实 ${format.toUpperCase()} 全本文件。为保障阅读体验，系统绝不提供伪造导读文件。请点击下方全网对冲源直达原版。`);
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

  // Helper to copy book name and open Quark Drive search
  const handleOpenQuark = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(book.title);
    }
    setCopiedQuark(true);
    setTimeout(() => setCopiedQuark(false), 2500);
    window.open(`https://www.alipansou.com/search?k=${encodeURIComponent(book.title)}&type=quark`, '_blank');
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
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[92vh] animate-in slide-in-from-bottom duration-250 sm:slide-in-from-bottom-0 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          {/* Mobile Sheet Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2 block sm:hidden shrink-0" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
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
              className="w-11 h-11 flex items-center justify-center rounded-full text-slate-300 hover:text-white bg-slate-800 active:bg-slate-700 transition-colors touch-manipulation cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain smooth-scroll space-y-5 sm:space-y-6">

          {/* Book Summary Card */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 items-center">
            <div className="w-16 h-22 rounded-xl overflow-hidden shadow-sm shrink-0 bg-slate-200 border border-slate-300">
              <img
                src={book.cover}
                alt={book.title}
                referrerPolicy="no-referrer"
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
                        <div className="flex items-center gap-1.5">
                          {opt.source && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {opt.source}
                            </span>
                          )}
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {opt.size || '极速秒下'}
                          </span>
                        </div>
                      </div>

                      <div className="font-bold text-sm text-slate-900 group-hover:text-sky-800 flex items-center gap-1.5">
                        <span>{opt.label || `${fmtUpper} 电子书`}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700">
                          .{opt.format}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {opt.format === 'epub' && '专用电子书容器（含排版与插图，请勿用记事本打开）。手机推荐微信读书/苹果图书，电脑推荐 SumatraPDF'}
                        {opt.format === 'pdf' && '完整图文版式，保留原著原貌排版，双击直接用 Edge/Chrome 浏览器或 PDF 阅读器查看'}
                        {opt.format === 'txt' && '纯文本全本正文，已内置 UTF-8 BOM 防乱码签名，Windows 记事本双击秒开，汉字工整不乱码'}
                        {(opt.format === 'mobi' || opt.format === 'azw3') && 'Kindle 专用格式（非纯文本，请勿用记事本打开），专为 Kindle 设备与电纸书深度优化'}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                      <span>
                        {isDownloading
                          ? (opt.source === 'curated' || opt.source === '本地极速节点'
                              ? '从本地极速节点获取中...'
                              : (opt.source === 'cache' || opt.source === '本地高速缓存'
                                  ? '从本地高速缓存读取中...'
                                  : '全网镜像高速流式拉取中...'))
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

            {/* Reading App & Notepad Mojibake Guide */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs space-y-1.5 shadow-xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>电子书打开避坑提示（为什么用记事本打开部分格式会乱码？）</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                <strong>1. EPUB / MOBI / AZW3 是专业打包电子书容器</strong>（内部包含排版样式、字体与目录，类似于压缩包），<strong>请勿直接使用记事本打开</strong>。推荐手机端用<strong>【微信读书】</strong>或苹果<strong>【图书】</strong>打开，电脑端推荐使用轻量免费的<strong>【SumatraPDF】</strong>或<strong>【Calibre】</strong>。<br />
                <strong>2. 如果您喜欢直接用记事本读小说</strong>：请下载<strong>【TXT 纯文本】</strong>格式，本站所有 TXT 均已内置 <strong>UTF-8 BOM 防乱码标识</strong>，在 Windows 记事本中双击直接秒开，文字清晰工整绝无乱码！
              </p>
            </div>
          </div>

          {/* Section 2: Online Full-Text Ebook Direct Search & Download Channels (Zero Dead-End Search) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              二、国内免翻墙多源镜像 & 公版开放阅读直达 (备用通道)
            </label>

            <div className="space-y-2">
              
              {/* Quark Drive (夸克网盘) */}
              <div className="p-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/70 flex items-center justify-between gap-3 transition-colors shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    夸克
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      夸克网盘 (Quark Drive)
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200/60">
                        免会员极速秒存
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      国内热门网盘资源聚合，一键秒存完整原版 EPUB / PDF / TXT，手机/iPad/电脑原画直读
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenQuark}
                  className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white rounded-xl shadow-xs shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>{copiedQuark ? '已复制书名' : '夸克转存'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

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
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 pb-safe-card bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-600 font-medium truncate">下载后可发送到手机微信或阅读器打开</span>
          </div>
          <button
            onClick={onClose}
            aria-label="完成下载"
            className="min-h-[44px] px-5 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 rounded-xl transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0"
          >
            完成
          </button>
        </div>

      </div>
    </div>
  );
}
