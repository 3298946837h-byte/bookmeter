import React, { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, ShieldCheck, AlertTriangle, BookOpen, User, Calendar, Tag, Scale, Sparkles, Send, Bot, CheckCircle2, UserCheck, UserX } from 'lucide-react';
import PlatformRatingBadge from './PlatformRatingBadge';

export default function BookDetailModal({ book, onClose }) {
  if (!book) return null;

  const [reviewFilter, setReviewFilter] = useState('all'); // all, douban, goodreads, amazon

  // DeepSeek AI State
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Q&A State
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [askingAi, setAskingAi] = useState(false);

  // Auto-fetch or manual fetch DeepSeek Insight
  const fetchDeepSeekInsight = async () => {
    try {
      setLoadingAi(true);
      setAiError(null);
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, bookData: book })
      });
      const data = await res.json();
      if (data.success && data.insight) {
        setAiInsight(data.insight);
      } else {
        setAiError(data.error || '获取 AI 深度测评失败');
      }
    } catch (err) {
      setAiError(err.message || '网络连接异常');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAskQuestion = async (customQ) => {
    const q = customQ || question;
    if (!q.trim() || askingAi) return;

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
      const data = await res.json();
      if (data.success && data.answer) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', text: '抱歉，DeepSeek 智能顾问暂时未能回答该问题，请稍后重试。' }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: `请求错误: ${err.message}` }]);
    } finally {
      setAskingAi(false);
    }
  };

  const reviews = book.featuredReviews || [];
  const filteredReviews = reviewFilter === 'all'
    ? reviews
    : reviews.filter(r => r.platform.toLowerCase() === reviewFilter.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Modal Dialog Card (Bottom sheet on mobile, centered modal on desktop) */}
      <div
        className="bg-white w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
              book.verdict?.status === 'masterpiece' ? 'bg-emerald-500 text-white' :
              book.verdict?.status === 'warning' ? 'bg-rose-500 text-white' :
              book.verdict?.status === 'controversial' ? 'bg-amber-500 text-white' :
              'bg-blue-600 text-white'
            }`}>
              {book.verdict?.label}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300 hidden sm:inline">
              {book.category} · {book.publicationYear} · 全网多源权威对冲报告
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Section 1: Hero Info & Master Score */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start pb-4 sm:pb-6 border-b border-slate-100">
            <div className="flex gap-3 sm:gap-4 items-start w-full sm:w-auto">
              {/* Book Cover */}
              <div className="w-20 h-28 sm:w-32 sm:h-44 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
                  }}
                />
              </div>

              {/* Title & Author on mobile */}
              <div className="flex-1 sm:hidden space-y-1">
                <h2 className="text-lg font-black text-slate-900 leading-snug line-clamp-2">{book.title}</h2>
                <p className="text-xs font-semibold text-sky-700">{book.author}</p>
                {book.translator && <p className="text-[11px] text-slate-500">译: {book.translator}</p>}
                <div className="text-[10px] text-slate-400">{book.publisher} · {book.publicationYear}</div>
              </div>
            </div>

            {/* Metadata (Desktop) */}
            <div className="flex-1 space-y-2 hidden sm:block">
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
                {book.tags?.map((t, idx) => (
                  <span key={idx} className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    #{t}
                  </span>
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2 line-clamp-3">
                {book.summary}
              </p>
            </div>

            {/* Mobile Summary */}
            <p className="text-xs text-slate-600 leading-relaxed sm:hidden line-clamp-3">
              {book.summary}
            </p>

            {/* Master Score Block */}
            <div className="w-full sm:w-44 shrink-0 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50 border border-sky-100 text-center flex flex-col justify-center">
              <span className="text-[10px] sm:text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                全网综合权威分
              </span>
              <div className="flex items-baseline justify-center gap-1 my-0.5 sm:my-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">{book.compositeScore}</span>
                <span className="text-xs font-bold text-slate-400">/10</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500">
                基于 {book.verdict?.desc}
              </div>
              {book.discrepancyIndex >= 1.0 && (
                <div className="mt-1.5 sm:mt-2 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  各平台落差 {book.discrepancyIndex} 分
                </div>
              )}
            </div>
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
                    <span className="font-extrabold text-sm sm:text-base text-white">DeepSeek AI 深度对冲与避坑雷达</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      Powered by DeepSeek-V3
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
                <p>DeepSeek 正在对冲四大权威书评库并生成犀利定性与避坑指南...</p>
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
                      <span>DeepSeek 提炼价值亮点</span>
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
                      <span>DeepSeek 深度硬伤与槽点</span>
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
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>各大主流权威平台真实读者长评精选</span>
              </h3>

              {/* Review Filter Tabs */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 mr-1">平台过滤:</span>
                {['all', 'douban', 'goodreads', 'amazon'].map((pf) => (
                  <button
                    key={pf}
                    onClick={() => setReviewFilter(pf)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      reviewFilter === pf
                        ? 'bg-slate-900 text-white'
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
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 transition-all hover:bg-slate-100/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.avatar}
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
                              {rev.platform === 'douban' ? '豆瓣精选' : rev.platform === 'goodreads' ? 'Goodreads 认证' : 'Amazon 购书买家'}
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

                    <p className="text-xs text-slate-700 leading-relaxed">
                      "{rev.content}"
                    </p>
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
                <span>向 DeepSeek 智能书评顾问提问 (实时解惑)</span>
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
                      {msg.role === 'user' ? '我的提问' : 'DeepSeek 顾问分析:'}
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
                handleAskQuestion();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如: 中文译本翻译得生硬吗？适合小白读吗？..."
                className="flex-1 px-3.5 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <button
                type="submit"
                disabled={askingAi || !question.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
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

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>跨平台数据持续监测 · 避免阅读信息茧房</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all"
          >
            关闭详情
          </button>
        </div>

      </div>

    </div>
  );
}
