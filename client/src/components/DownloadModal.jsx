import React, { useState, useEffect } from 'react';
import { X, Download, FileSpreadsheet, FileCode, FileText, Check, Copy, Sparkles, BookOpen, Layers, Printer } from 'lucide-react';

export default function DownloadModal({ isOpen, onClose, currentBooks = [], allBooks = [] }) {
  const [downloadScope, setDownloadScope] = useState('current'); // 'current' | 'all'
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  // Escape key handler and body scroll lock for mobile modals
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetBooks = downloadScope === 'current' ? currentBooks : (allBooks.length > 0 ? allBooks : currentBooks);

  // Helper to trigger browser file download via Blob
  const triggerDownload = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const getTimestamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  };

  // 1. Export as Excel-compatible CSV (with UTF-8 BOM)
  const handleExportCSV = () => {
    const headers = [
      '书名',
      '原著名',
      '作者',
      '译者',
      '分类',
      '综合贝叶斯评分(10分制)',
      '口碑评级',
      '跨平台分歧指数',
      '豆瓣评分',
      '豆瓣评价人数',
      'Goodreads评分(5星制)',
      'Goodreads折算分(10分制)',
      'Goodreads评价人数',
      'Amazon评分',
      'GoogleBooks评分',
      '核心好评亮点',
      '差评槽点与劝退提示',
      '读者代表性热评',
      '出版社',
      '出版年份',
      'ISBN',
      '豆瓣源站链接',
      'Goodreads源站链接'
    ];

    const escapeCSV = (val) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = targetBooks.map(b => {
      const p = b.platformRatings || {};
      const douban = p.douban || {};
      const goodreads = p.goodreads || {};
      const amazon = p.amazon || {};
      const google = p.googleBooks || {};

      return [
        escapeCSV(b.title),
        escapeCSV(b.originalTitle || ''),
        escapeCSV(b.author),
        escapeCSV(b.translator || ''),
        escapeCSV(b.category),
        escapeCSV(b.compositeScore),
        escapeCSV(b.verdict?.label || ''),
        escapeCSV(b.discrepancyIndex),
        escapeCSV(douban.score ?? ''),
        escapeCSV(douban.ratingCount ?? ''),
        escapeCSV(goodreads.score ?? ''),
        escapeCSV(goodreads.normalizedScore ?? (goodreads.score ? goodreads.score * 2 : '')),
        escapeCSV(goodreads.ratingCount ?? ''),
        escapeCSV(amazon.score ?? ''),
        escapeCSV(google.score ?? ''),
        escapeCSV((b.pros || []).join('；')),
        escapeCSV((b.cons || []).join('；')),
        escapeCSV(b.representativeReview || ''),
        escapeCSV(b.publisher || ''),
        escapeCSV(b.publicationYear || ''),
        escapeCSV(b.isbn || ''),
        escapeCSV(douban.url || ''),
        escapeCSV(goodreads.url || '')
      ].join(',');
    });

    // \uFEFF is essential for Excel/WPS on Windows to parse UTF-8 Chinese correctly!
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const filename = `BookMeter_全网书评汇总_${downloadScope === 'current' ? '筛选视图' : '全库打包'}_${getTimestamp()}.csv`;
    
    triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
    setDownloadSuccess('CSV');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 2. Export as JSON
  const handleExportJSON = () => {
    const jsonContent = JSON.stringify({
      exportedAt: new Date().toISOString(),
      scope: downloadScope,
      totalCount: targetBooks.length,
      data: targetBooks
    }, null, 2);

    const filename = `BookMeter_书籍完整数据包_${downloadScope === 'current' ? '筛选视图' : '全库打包'}_${getTimestamp()}.json`;
    triggerDownload(jsonContent, filename, 'application/json;charset=utf-8;');
    setDownloadSuccess('JSON');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 3. Export as Markdown / TXT Report
  const handleExportMarkdown = () => {
    const dateStr = new Date().toLocaleString('zh-CN');
    let md = `# BookMeter · 全网书评与口碑对冲权威报告\n\n`;
    md += `> 导出时间：${dateStr} | 导出范围：${downloadScope === 'current' ? '当前筛选视图' : '全库打包'} | 共收录书籍：${targetBooks.length} 本\n\n`;
    md += `---\n\n`;

    md += `## 📊 图书综合评分速查表\n\n`;
    md += `| 书名 | 作者 | 分类 | 综合权威分 | 评级 | 豆瓣 | Goodreads | 分歧指数 |\n`;
    md += `| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    targetBooks.forEach(b => {
      const dScore = b.platformRatings?.douban?.score ?? '-';
      const gScore = b.platformRatings?.goodreads?.score ? `${b.platformRatings.goodreads.score}★` : '-';
      md += `| **${b.title}** | ${b.author} | ${b.category} | **${b.compositeScore}** | ${b.verdict?.label || '-'} | ${dScore} | ${gScore} | ${b.discrepancyIndex} |\n`;
    });

    md += `\n---\n\n## 📖 逐本图书详细深度剖析与好差评对冲\n\n`;
    targetBooks.forEach((b, idx) => {
      const p = b.platformRatings || {};
      md += `### ${idx + 1}. 《${b.title}》 ${b.originalTitle ? `(${b.originalTitle})` : ''}\n\n`;
      md += `- **作者**：${b.author} ${b.translator ? `| **译者**：${b.translator}` : ''}\n`;
      md += `- **出版信息**：${b.publisher || '未知出版社'} · ${b.publicationYear} · ISBN: ${b.isbn || '无'}\n`;
      md += `- **综合评分**：**${b.compositeScore} / 10**（评级：**${b.verdict?.label}** | 分歧度：${b.discrepancyIndex}）\n`;
      md += `- **多平台口碑**：\n`;
      md += `  - 豆瓣读书：${p.douban?.score ?? '暂无'} 分 (${p.douban?.ratingCount ? p.douban.ratingCount.toLocaleString() + ' 人评价' : '暂无人数'})\n`;
      md += `  - Goodreads：${p.goodreads?.score ? p.goodreads.score + ' 星 (折合 ' + (p.goodreads.score * 2).toFixed(1) + ' 分)' : '暂无'} (${p.goodreads?.ratingCount ? p.goodreads.ratingCount.toLocaleString() + ' 人' : ''})\n`;
      md += `  - Amazon 购书评价：${p.amazon?.score ? p.amazon.score + ' 星' : '暂无'}\n`;
      md += `  - Google Books：${p.googleBooks?.score ? p.googleBooks.score + ' 星' : '暂无'}\n\n`;

      if (b.pros && b.pros.length > 0) {
        md += `**🌟 为什么大家说好 (Pros)**：\n`;
        b.pros.forEach(item => {
          md += `- ${item}\n`;
        });
        md += `\n`;
      }

      if (b.cons && b.cons.length > 0) {
        md += `**⚠️ 为什么有人打差评 / 劝退提示 (Cons)**：\n`;
        b.cons.forEach(item => {
          md += `- ${item}\n`;
        });
        md += `\n`;
      }

      if (b.representativeReview) {
        md += `> **读者高赞代表评语**：“${b.representativeReview}”\n\n`;
      }

      md += `---\n\n`;
    });

    const filename = `BookMeter_全网书评深度报告_${downloadScope === 'current' ? '筛选视图' : '全库打包'}_${getTimestamp()}.md`;
    triggerDownload(md, filename, 'text/markdown;charset=utf-8;');
    setDownloadSuccess('Markdown');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 4. Print / PDF Styled Report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>BookMeter 全网书评与口碑对冲研报</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; }
    h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px; font-size: 22px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
    .score { font-weight: bold; color: #0284c7; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
    .card { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; background: #ffffff; }
    .pros { color: #15803d; font-size: 12px; margin: 4px 0; }
    .cons { color: #b91c1c; font-size: 12px; margin: 4px 0; }
    .review { font-style: italic; color: #475569; background: #f8fafc; padding: 8px 12px; border-radius: 6px; margin-top: 8px; font-size: 12px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>📚 BookMeter · 全网书评与口碑对冲权威研报</h1>
  <div class="meta">导出时间：${new Date().toLocaleString('zh-CN')} | 收录书籍：${targetBooks.length} 部 | 范围：${downloadScope === 'current' ? '当前筛选视图' : '全库收录'}</div>
  
  <table>
    <thead>
      <tr>
        <th>书名</th>
        <th>作者</th>
        <th>分类</th>
        <th>综合权威分</th>
        <th>评级</th>
        <th>豆瓣</th>
        <th>Goodreads</th>
        <th>分歧度</th>
      </tr>
    </thead>
    <tbody>
      ${targetBooks.map(b => `
        <tr>
          <td><strong>${b.title}</strong></td>
          <td>${b.author}</td>
          <td>${b.category}</td>
          <td class="score">${b.compositeScore}</td>
          <td><span class="badge">${b.verdict?.label || '推荐'}</span></td>
          <td>${b.platformRatings?.douban?.score ?? '-'}</td>
          <td>${b.platformRatings?.goodreads?.score ? b.platformRatings.goodreads.score + '★' : '-'}</td>
          <td>${b.discrepancyIndex}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2 style="margin-top: 32px; font-size: 18px; color: #0f172a;">📖 深度剖析与读者代表口碑</h2>
  ${targetBooks.map((b, i) => `
    <div class="card">
      <h3 style="margin: 0 0 6px 0; font-size: 16px;">${i + 1}. 《${b.title}》 <span style="font-size: 12px; font-weight: normal; color: #64748b;">${b.author} · ${b.publicationYear || ''}</span></h3>
      <div style="font-size: 13px; margin-bottom: 6px;">综合权威分：<strong>${b.compositeScore} / 10</strong> | 豆瓣：${b.platformRatings?.douban?.score ?? '无'} | Goodreads：${b.platformRatings?.goodreads?.score ?? '无'}★</div>
      ${b.pros?.length ? `<div class="pros"><strong>亮点：</strong>${b.pros.join('；')}</div>` : ''}
      ${b.cons?.length ? `<div class="cons"><strong>提醒：</strong>${b.cons.join('；')}</div>` : ''}
      ${b.representativeReview ? `<div class="review">“${b.representativeReview}”</div>` : ''}
    </div>
  `).join('')}

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Copy backend direct shareable link for friends
  const handleCopyLink = (format) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    const link = `${origin}/api/export?format=${format}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2500);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="全内容一键直接下载中心"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[92vh] animate-in slide-in-from-bottom duration-250 sm:slide-in-from-bottom-0 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shrink-0">
          {/* Mobile Sheet Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2 block sm:hidden shrink-0" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                  全内容一键直接下载中心
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/30 hidden sm:inline-block">
                    即时生成 · 免等待
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  可下载当前屏幕可见内容或整站全库数据，好友也可直接下载
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="关闭导出窗口"
              className="w-11 h-11 flex items-center justify-center rounded-full text-slate-300 hover:text-white bg-slate-800/80 active:bg-slate-700 transition-colors touch-manipulation cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain smooth-scroll space-y-5 sm:space-y-6">
          
          {/* 1. Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              第一步：选择下载范围
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDownloadScope('current')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  downloadScope === 'current'
                    ? 'border-sky-500 bg-sky-50/70 text-sky-900 shadow-xs ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  downloadScope === 'current' ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {downloadScope === 'current' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-bold text-sm">当前筛选视图 ({currentBooks.length} 本)</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    仅下载当前分类、搜索结果或筛选后能在网页上看到的书籍
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDownloadScope('all')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  downloadScope === 'all'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  downloadScope === 'all' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {downloadScope === 'all' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="font-bold text-sm">全书库完整打包 ({allBooks.length || currentBooks.length} 本)</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    打包下载全站收录的全部书籍、四大平台评分与读者好差评汇总
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Download Formats (One-click Buttons) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              第二步：选择文件格式立即下载
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* CSV / Excel Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="group relative p-4 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white hover:from-emerald-100 hover:to-emerald-50 active:scale-98 transition-all text-left shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-800">
                    Excel / CSV 表格
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    带 UTF-8 BOM，可用 Excel / WPS 直接打开，不乱码，方便快速筛选和排序。
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>{downloadSuccess === 'CSV' ? '✓ 已保存到本地' : '点击立即下载'}</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>

              {/* JSON Data Button */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="group relative p-4 rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-white hover:from-indigo-100 hover:to-indigo-50 active:scale-98 transition-all text-left shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-800">
                    JSON 结构化数据
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    完整原始对象，包含所有细分平台原始分数、好评与差评数组，适合技术分析。
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-700">
                  <span>{downloadSuccess === 'JSON' ? '✓ 已保存到本地' : '点击立即下载'}</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>

              {/* Markdown / TXT Report Button */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="group relative p-4 rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white hover:from-amber-100 hover:to-amber-50 active:scale-98 transition-all text-left shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-amber-800">
                    Markdown 离线报告
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    排版精美的读者口碑手册，含速查对比表与逐本优缺点深度摘录，便于手机阅读。
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-amber-700">
                  <span>{downloadSuccess === 'Markdown' ? '✓ 已保存到本地' : '点击立即下载'}</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>

              {/* Printable PDF / Print Report Button */}
              <button
                type="button"
                onClick={handlePrintReport}
                className="group relative p-4 rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/80 to-white hover:from-sky-100 hover:to-sky-50 active:scale-98 transition-all text-left shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-3 shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-sky-800">
                    打印 / 另存为 PDF
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    生成排版规范的高清口碑评测研报，支持一键调用系统打印或另存为 PDF。
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between text-xs font-bold text-sky-700">
                  <span>调用系统打印 / PDF</span>
                  <Printer className="w-4 h-4" />
                </div>
              </button>

            </div>
          </div>

          {/* 3. Direct Shareable Link for Friends */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                分享给朋友直接下载 (免安装任何环境)
              </span>
              <span className="text-[11px] text-slate-400">后端直链 API</span>
            </div>
            <p className="text-xs text-slate-500">
              您可以复制以下直链发给好友，对方在浏览器打开即可自动开始下载数据集：
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyLink('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl shadow-xs transition-colors"
              >
                {copiedFormat === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                {copiedFormat === 'csv' ? '已复制 CSV 直链' : '复制全库 CSV 直链'}
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink('json')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl shadow-xs transition-colors"
              >
                {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                {copiedFormat === 'json' ? '已复制 JSON 直链' : '复制全库 JSON 直链'}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 pb-safe-card bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">准备导出 <b>{targetBooks.length}</b> 本图书的所有多源口碑数据</span>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭窗口"
            className="min-h-[44px] px-5 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 rounded-xl transition-all touch-manipulation active:scale-95 shrink-0"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
}
