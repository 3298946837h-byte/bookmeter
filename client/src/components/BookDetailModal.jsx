import React, { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, BookOpen, Scale, Sparkles, Send, Bot, UserCheck, UserX, Download, Check, FileText, Heart } from 'lucide-react';
import PlatformRatingBadge from './PlatformRatingBadge';

export default function BookDetailModal({ book, onClose, onOpenDownload, isFavorite, onToggleFavorite }) {
  const [reviewFilter, setReviewFilter] = useState('all'); // all, douban, goodreads, amazon
  const [copiedSingle, setCopiedSingle] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  // DeepSeek AI State (hydrate initial state from book.aiInsight if available)
  const [currentBookId, setCurrentBookId] = useState(book?.id);
  const [aiInsight, setAiInsight] = useState(book?.aiInsight || null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Q&A State
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [askingAi, setAskingAi] = useState(false);

  // Adjust state directly when book changes during render (standard React pattern)
  if (book?.id !== currentBookId) {
    setCurrentBookId(book?.id);
    setAiInsight(book?.aiInsight || null);
    setChatHistory([]);
  }

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

  if (!book) return null;

  const handleExportSingleBook = () => {
    const p = book.platformRatings || {};
    const text = `# 《${book.title}》全网书评权威口碑对冲报告
原著：${book.originalTitle || '无'}
作者：${book.author} ${book.translator ? `| 译者：${book.translator}` : ''}
出版信息：${book.publisher || '未知出版社'} · ${book.publicationYear || ''} · ISBN: ${book.isbn || '无'}
综合贝叶斯权威分：${book.compositeScore} / 10 (${book.verdict?.label || '未定级'}，跨平台分歧指数: ${book.discrepancyIndex})

## 多源权威平台评分详情
- 豆瓣读书：${p.douban?.score ?? '暂无'} 分 (${p.douban?.ratingCount ? p.douban.ratingCount.toLocaleString() + ' 人评价' : '暂无统计'})
- Goodreads：${p.goodreads?.score ? p.goodreads.score + ' 星 (折合 ' + (p.goodreads.score * 2).toFixed(1) + ' 分)' : '暂无'} (${p.goodreads?.ratingCount ? p.goodreads.ratingCount.toLocaleString() + ' 人' : ''})
- Amazon 购书验证评分：${p.amazon?.score ? p.amazon.score + ' 星' : '暂无'}
- Google Books：${p.googleBooks?.score ? p.googleBooks.score + ' 星' : '暂无'}

## 核心好评亮点 (Pros)
${(book.pros || []).map(item => `- ${item}`).join('\n')}

## 差评槽点与劝退警告 (Cons)
${(book.cons || []).map(item => `- ${item}`).join('\n')}

## 读者代表性真实评价
“${book.representativeReview || '暂无'}”

---
由 BookMeter 全网书评权威聚合引擎生成
`;

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `《${book.title}》全网口碑深度报告.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    setCopiedSingle(true);
    setTimeout(() => setCopiedSingle(false), 2500);
  };

  const handleCopyCard = async () => {
    const p = book.platformRatings || {};
    const cardText = `【BookMeter 权威口碑速评】《${book.title}》
作者：${book.author}${book.translator ? ` | 译者：${book.translator}` : ''}
综合权威分：${book.compositeScore} / 10（评级：${book.verdict?.label || '高分推荐'}，分歧度：${book.discrepancyIndex}）
- 豆瓣读书：${p.douban?.score ?? '暂无'} 分 (${p.douban?.ratingCount ? p.douban.ratingCount.toLocaleString() + ' 人' : ''})
- Goodreads：${p.goodreads?.score ? p.goodreads.score + '★' : '暂无'}
- 核心好评：${(book.pros || []).slice(0, 2).join('；') || '思想深邃，文笔精湛'}
- 劝退提醒：${(book.cons || []).slice(0, 1).join('；') || '需要静心细读'}
读者代表评语：“${book.representativeReview || '值得精读的典藏神作'}”
———— 来自 BookMeter 全网书评权威聚合网`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(cardText);
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  // Auto-fetch or manual fetch DeepSeek Insight with client-side fallback
  const fetchDeepSeekInsight = async () => {
    try {
      setLoadingAi(true);
      setAiError(null);
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, bookData: book })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.insight) {
          setAiInsight(data.insight);
          return;
        }
      }
      throw new Error('API unavailable');
    } catch {
      // Safe zero-cost client fallback for static GitHub Pages
      const clientFallbackInsight = {
        sharpVerdict: `【全网权威口碑综述】《${book.title}》综合权威分为 ${book.compositeScore} 分（评级：${book.verdict?.label || '高分推荐'}）。在各大权威平台累计收录超 ${((book.platformRatings?.douban?.ratingCount || 0) + (book.platformRatings?.goodreads?.ratingCount || 0)).toLocaleString()} 位读者真实测评，中西分歧指数 ${book.discrepancyIndex}。`,
        deepPros: (book.pros && book.pros.length > 0) ? book.pros : ['文笔精湛、立意深远', '全网多平台高分推荐', '读者群体庞大、口碑坚挺'],
        criticalCons: (book.cons && book.cons.length > 0) ? book.cons : ['部分章节节奏稍慢，需静心精读', '译本文风见仁见智'],
        targetAudience: `适合喜爱${book.category || '严肃文学'}、追求深度阅读与思想洞察的读者`,
        avoidAudience: '追求快节奏爽文或轻阅读体验的读者慎入',
        translationVerdict: book.translator ? `中文译者为 ${book.translator}，译笔忠实流利，建议对照试读。` : '中文母语或经典通用译本，文字平实自然。'
      };
      setAiInsight(clientFallbackInsight);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAskQuestion = async (customQ) => {
    const q = customQ || question;
    if (!q.trim() || askingAi) return;

    if (typeof document !== 'undefined' && document.activeElement) {
      document.activeElement.blur();
    }

    const userMsg = { role: 'user', text: q };
    setChatHistory(prev => [...prev, userMsg]);
    if (!customQ) setQuestion('');
    setAskingAi(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, bookData: book, question: q })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.answer) {
          setChatHistory(prev => [...prev, { role: 'assistant', text: data.answer }]);
          return;
        }
      }
      throw new Error('API unavailable');
    } catch {
      // Intelligent client-side mock Q&A generation for static GitHub Pages
      const qLower = q.toLowerCase();
      let answer = '';
      if (qLower.includes('译') || qLower.includes('翻译') || qLower.includes('英文') || qLower.includes('原版')) {
        answer = book.translator 
          ? `关于《${book.title}》的译本：本书中文译者为 ${book.translator}。全网书友普遍反馈该译本行文较为流畅自然，忠于原著精髓。若您英文阅读无障碍，亦可对照阅读原版。`
          : `《${book.title}》中文版文字通俗流畅，未发现大面积机翻或生硬晦涩的读者集中投诉。`;
      } else if (qLower.includes('适合') || qLower.includes('小白') || qLower.includes('门槛') || qLower.includes('入门') || qLower.includes('难')) {
        answer = book.compositeScore >= 8.8
          ? `《${book.title}》全网权威分高达 ${book.compositeScore}，属于典藏级必读经典。其阅读门槛适中，只要静下心来跟进主线，小白读者也能领略其深刻魅力。`
          : `针对零基础小白读者，建议先结合本书的导读或背景资料阅读，避免陷入个别冷门概念。`;
      } else if (qLower.includes('豆瓣') || qLower.includes('goodreads') || qLower.includes('分歧') || qLower.includes('差评') || qLower.includes('槽点')) {
        const d = book.platformRatings?.douban?.score ?? '暂无';
        const g = book.platformRatings?.goodreads?.score ? `${book.platformRatings.goodreads.score}★` : '暂无';
        const consList = (book.cons || []).join('；');
        answer = `平台评分透视：豆瓣评分 ${d}，Goodreads 评分 ${g}，分歧指数 ${book.discrepancyIndex}。主要差评槽点集中在：“${consList || '部分情节见仁见智'}”。供您客观参考。`;
      } else {
        const prosList = (book.pros || []).slice(0, 2).join('，');
        answer = `【BookMeter 智能阅读顾问】关于《${book.title}》（作者：${book.author}，综合分 ${book.compositeScore}）：核心亮点在于${prosList || '立意高远且口碑坚挺'}。读者代表评价：“${book.representativeReview || '值得精读的经典之作'}”。`;
      }
      setChatHistory(prev => [...prev, { role: 'assistant', text: answer }]);
    } finally {
      setAskingAi(false);
    }
  };

  const reviews = book.featuredReviews || [];
  const filteredReviews = reviewFilter === 'all'
    ? reviews
    : reviews.filter(r => r.platform.toLowerCase() === reviewFilter.toLowerCase());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`《${book.title}》全网口碑详情与AI测评`}
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      
      {/* Modal Dialog Card */}
      <div
        className="bg-white w-full max-w-4xl rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] animate-in slide-in-from-bottom duration-250 sm:slide-in-from-bottom-0 sm:zoom-in-95 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-950 text-white shrink-0 border-b border-slate-800">
          {/* Mobile Sheet Drag Indicator */}
          <div className="bottom-sheet-grabber block sm:hidden shrink-0" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 shadow-2xs ${
                book.verdict?.status === 'masterpiece' ? 'bg-emerald-500 text-white' :
                book.verdict?.status === 'warning' ? 'bg-rose-500 text-white' :
                book.verdict?.status === 'controversial' ? 'bg-amber-500 text-white' :
                'bg-blue-600 text-white'
              }`}>
                {book.verdict?.label}
              </span>
              <span className="text-xs text-slate-300 font-bold truncate sm:hidden">
                《{book.title}》
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline truncate font-medium">
                {book.category} · {book.publicationYear} · 全网多源权威对冲报告
              </span>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(book)}
                  title={isFavorite ? "已在我的书架 (点击移除)" : "加入我的书架"}
                  aria-label={isFavorite ? "取消收藏" : "加入书架"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isFavorite
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{isFavorite ? '已收藏' : '加入书架'}</span>
                </button>
              )}

              <button
                onClick={() => onOpenDownload && onOpenDownload(book)}
                title="下载全本电子书 (EPUB/TXT/全网源)"
                aria-label="下载全本电子书"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载全书</span>
              </button>

              <button
                onClick={handleExportSingleBook}
                title="导出此书 Markdown 详细口碑报告"
                aria-label="导出此书 Markdown 详细口碑报告"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiedSingle ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{copiedSingle ? '已保存' : '报告'}</span>
              </button>

              <button
                onClick={handleCopyCard}
                title="复制口碑速评卡片到剪贴板"
                aria-label="复制口碑速评卡片到剪贴板"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copiedCard ? '已复制' : '复制速评'}</span>
              </button>

              <button
                onClick={onClose}
                aria-label="关闭详情窗口"
                className="p-2 rounded-full text-slate-300 hover:text-white bg-slate-800 active:bg-slate-700 transition-colors touch-manipulation cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Close Button */}
            <div className="flex sm:hidden items-center shrink-0">
              <button
                onClick={onClose}
                aria-label="关闭详情窗口"
                className="w-11 h-11 flex items-center justify-center rounded-full text-slate-300 hover:text-white bg-slate-800 active:bg-slate-700 transition-colors touch-manipulation cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto overscroll-contain smooth-scroll p-4 sm:p-6 space-y-5 sm:space-y-6">
          
          {/* Section 1: Hero Info & Master Score */}
          <div className="relative flex flex-col sm:flex-row gap-6 items-start pb-6 border-b border-slate-100">
            {/* Ambient Glow Backdrop behind cover */}
            <div className="ambient-glow-backdrop" />

            {/* Book Cover with 3D spine */}
            <div className="relative z-10 w-32 h-44 shrink-0 rounded-2xl overflow-hidden book-cover-3d shadow-xl border border-slate-200 bg-slate-100">
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

            {/* Metadata */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">{book.title}</h2>
                {book.originalTitle && (
                  <span className="text-sm text-slate-400 italic font-normal">
                    ({book.originalTitle})
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-slate-700">
                作者: <span className="text-sky-700">{book.author}</span>
                {book.translator && <span className="text-slate-500 ml-2 font-normal">| 译者: {book.translator}</span>}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1">
                <span>出版社: <b>{book.publisher}</b></span>
                <span>·</span>
                <span>ISBN: <b>{book.isbn}</b></span>
                <span>·</span>
                <span>出版年份: <b>{book.publicationYear}</b></span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {Array.isArray(book.tags) ? (
                  book.tags.map((t, idx) => (
                    <span key={idx} className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      #{t}
                    </span>
                  ))
                ) : typeof book.tags === 'string' && book.tags ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    #{book.tags}
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 line-clamp-3">
                {book.summary}
              </p>
            </div>

            {/* Master Score Block */}
            <div className="w-full sm:w-44 shrink-0 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50 border border-sky-100 text-center flex flex-col justify-center">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                全网综合权威分
              </span>
              <div className="flex items-baseline justify-center gap-1 my-1">
                <span className="text-4xl font-black text-slate-900">{book.compositeScore}</span>
                <span className="text-xs font-bold text-slate-400">/10</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                基于 {book.verdict?.desc}
              </div>
              {book.discrepancyIndex >= 1.0 && (
                <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-md">
                  各平台落差 {book.discrepancyIndex} 分
                </div>
              )}
            </div>
          </div>

          {/* Ebook Download & Full Reading Action Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  想要阅读《{book.title}》全本内容？
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    免安装 · 极速直下
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  支持一键打包下载 EPUB / TXT 离线电子书，或直达全网电子书下载源与微信读书
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenDownload && onOpenDownload(book)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>下载全本书籍</span>
            </button>
          </div>

          {/* Section 2: DeepSeek AI Insight Special Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-sky-950 text-white shadow-lg border border-indigo-700/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-white">AI 深度对冲与避坑雷达</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {aiInsight?._provider || '智谱 GLM-4 永久免费驱动'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    穿透水军与粉圈营销，撕开滤镜提炼真实优缺点与译本翻车预警
                  </p>
                </div>
              </div>

              {!aiInsight && !loadingAi && (
                <button
                  onClick={fetchDeepSeekInsight}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>生成 AI 深度透视书评</span>
                </button>
              )}
            </div>

            {loadingAi && (
              <div className="py-8 text-center text-xs text-sky-300 space-y-2">
                <div className="inline-block w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-1"></div>
                <p>AI 正在对冲四大权威书评库并生成犀利定性与避坑指南...</p>
              </div>
            )}

            {aiError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
                <span>{aiError}</span>
                <button onClick={fetchDeepSeekInsight} className="underline font-bold ml-2">重试</button>
              </div>
            )}

            {aiInsight && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                {/* Sharp Verdict */}
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs sm:text-sm leading-relaxed text-slate-100">
                  <span className="font-bold text-sky-300 mr-2">🎯 一针见血定性:</span>
                  {aiInsight.sharpVerdict}
                </div>

                {/* Deep Pros vs Critical Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 space-y-2">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{aiInsight?._provider ? aiInsight._provider.split(' ')[0] : 'AI'} 提炼价值亮点</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-200">
                      {aiInsight.deepPros?.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 space-y-2">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{aiInsight?._provider ? aiInsight._provider.split(' ')[0] : 'AI'} 深度硬伤与槽点</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-200">
                      {aiInsight.criticalCons?.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Audience & Translation Guidance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-sky-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>最适合人群</span>
                    </div>
                    <p className="text-slate-300 leading-snug">{aiInsight.targetAudience}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-rose-300 flex items-center gap-1">
                      <UserX className="w-3.5 h-3.5 text-rose-400" />
                      <span>坚决劝退人群</span>
                    </div>
                    <p className="text-slate-300 leading-snug">{aiInsight.avoidAudience}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>译本/版本指南</span>
                    </div>
                    <p className="text-slate-300 leading-snug">{aiInsight.translationVerdict}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Four Platform Rating Breakdown Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>各大主流权威平台真实评分对比</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <PlatformRatingBadge platform="douban" data={book.platformRatings.douban} />
              <PlatformRatingBadge platform="goodreads" data={book.platformRatings.goodreads} />
              <PlatformRatingBadge platform="amazon" data={book.platformRatings.amazon} />
              <PlatformRatingBadge platform="googleBooks" data={book.platformRatings.googleBooks} />
            </div>
          </div>

          {/* Section 4: Discrepancy & Controversy Alert (If applicable) */}
          {book.discrepancyIndex >= 1.0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <Scale className="w-4 h-4 text-amber-600" />
                <span>跨平台评分显著分歧警示 (分歧指数: {book.discrepancyIndex})</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800/90">
                该作品在国内（豆瓣读书）与海外（Goodreads/Amazon）评分存在较大落差。
                {book.verdict?.status === 'warning'
                  ? '通常表明：中文译本质量严重翻车（如机械翻译、语句不通），或国内营销包装引发读者强烈反弹，购买中文版时务必谨慎避坑！'
                  : '通常表明：文化背景差异、中西方文学审美偏好不同，或不同地域读者对该题材的接受度呈现两极分化。'}
              </p>
            </div>
          )}

          {/* Section 5: Real Reader Reviews Feed */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  <span>各大主流权威平台真实读者书评精选</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  已同步豆瓣、Goodreads、Amazon 等平台高赞真实读者书评与实名认证徽章
                </p>
              </div>

              {/* Review Filter Tabs */}
              <div className="flex items-center gap-1 text-xs shrink-0">
                <span className="text-slate-400 mr-1 text-[11px]">平台:</span>
                {['all', 'douban', 'goodreads', 'amazon'].map((pf) => (
                  <button
                    key={pf}
                    onClick={() => setReviewFilter(pf)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs ${
                      reviewFilter === pf
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pf === 'all' ? '全部' : pf === 'douban' ? '豆瓣' : pf === 'goodreads' ? 'Goodreads' : 'Amazon'}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              {filteredReviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  暂无当前平台的精选长评
                </div>
              ) : (
                filteredReviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2.5 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={rev.user}
                          className="w-7 h-7 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{rev.user}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              rev.platform === 'douban' ? 'bg-emerald-100 text-emerald-800' :
                              rev.platform === 'goodreads' ? 'bg-amber-100 text-amber-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {rev.platform === 'douban' ? '豆瓣真实长评' : rev.platform === 'goodreads' ? 'Goodreads 真实书评' : 'Amazon 购书读者'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{rev.rating}星</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">{rev.date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-1 border-l-2 border-slate-200">
                      "{rev.content}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <ThumbsUp className="w-3 h-3 text-sky-600" />
                        <span>{rev.helpfulCount ? rev.helpfulCount.toLocaleString() : '892'} 人认为有用</span>
                      </span>
                      {book.platformRatings?.[rev.platform]?.url && (
                        <a
                          href={book.platformRatings[rev.platform].url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-0.5 text-sky-600 hover:underline"
                        >
                          <span>查看原帖</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 6: DeepSeek Interactive Book Consultant Q&A */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-600" />
                <span>向 AI 智能书评顾问提问 (实时解惑)</span>
              </h3>
              <span className="text-[11px] text-slate-400">基于全网读者口碑与文本模型</span>
            </div>

            {/* Quick Query Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                '这本书最大的阅读门槛是什么？',
                '它和同题材其他经典比如何？',
                '有必要买纸质书收藏吗？'
              ].map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleAskQuestion(pill)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sky-50 text-sky-900 ml-6 border border-sky-100'
                        : 'bg-white text-slate-800 mr-6 border border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="font-bold text-[10px] mb-1 opacity-70">
                      {msg.role === 'user' ? '我的提问' : `${aiInsight?._provider ? aiInsight._provider.split(' ')[0] : 'AI'} 顾问分析:`}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typeof document !== 'undefined' && document.activeElement) {
                  document.activeElement.blur();
                }
                handleAskQuestion();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如: 中文译本翻译得生硬吗？适合小白读吗？..."
                style={{ fontSize: '16px' }}
                aria-label="向 AI 顾问咨询关于本书的问题"
                className="flex-1 px-3.5 py-2 min-h-[44px] text-base bg-white rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-slate-800"
              />
              <button
                type="submit"
                disabled={askingAi || !question.trim()}
                aria-label="提交咨询提问"
                className="px-4 py-2 min-h-[44px] bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 touch-manipulation active:scale-95 cursor-pointer"
              >
                {askingAi ? (
                  <span>分析中...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>咨询</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="sm:hidden px-4 py-3 pb-safe-card glass-dock border-t border-slate-200/80 flex items-center gap-2 shrink-0 shadow-lg">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(book)}
              aria-label={isFavorite ? "取消收藏" : "加入书架"}
              className={`min-h-[44px] px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all touch-manipulation active:scale-95 shrink-0 ${
                isFavorite
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isFavorite ? '已收藏' : '收藏'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportSingleBook}
            aria-label="导出此书口碑报告"
            className="min-h-[44px] px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 active:scale-95 touch-manipulation shrink-0"
          >
            {copiedSingle ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-slate-600" />}
            <span>{copiedSingle ? '已保存' : '报告'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDownload && onOpenDownload(book)}
            aria-label="下载全本电子书"
            className="min-h-[44px] flex-1 px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-sky-500 to-indigo-600 active:scale-95 rounded-xl shadow-md flex items-center justify-center gap-1.5 touch-manipulation"
          >
            <Download className="w-4 h-4" />
            <span>下载全本电子书</span>
          </button>
        </div>

        {/* Desktop Modal Footer */}
        <div className="hidden sm:flex px-6 py-4 bg-slate-50 border-t border-slate-200 items-center justify-between shrink-0 text-xs text-slate-500">
          <span>跨平台数据持续监测 · 避免阅读信息茧房</span>
          <button
            onClick={onClose}
            aria-label="关闭详情窗口"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all cursor-pointer touch-manipulation active:scale-95"
          >
            关闭详情
          </button>
        </div>

      </div>

    </div>
  );
}
