/**
 * BookMeter · 离线全量数据采集与下载生成工具 (Crawler & Downloader)
 * 参考 GitHub 开源项目:
 *   - lanbing510/DouBanSpider (豆瓣多标签爬虫与 Excel 表格切分)
 *   - adbar/trafilatura (网页正文与元数据清洗提取)
 *
 * 用法:
 *   node scripts/crawl-and-download.js
 *   node scripts/crawl-and-download.js --category 计算机技术
 */

const fs = require('fs');
const path = require('path');
const { books } = require('../server/data/books');

// Target directory for downloaded files
const DOWNLOADS_DIR = path.join(__dirname, '../downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Parse CLI arguments
const args = process.argv.slice(2);
let targetCategory = null;
const catIdx = args.indexOf('--category');
if (catIdx !== -1 && args[catIdx + 1]) {
  targetCategory = args[catIdx + 1];
}

console.log('=====================================================');
console.log('🚀 [BookMeter 爬虫与数据下载工具] 启动中...');
console.log(`📁 存储目录: ${DOWNLOADS_DIR}`);
console.log('=====================================================');

let targetBooks = [...books];
if (targetCategory) {
  targetBooks = targetBooks.filter(b => b.category === targetCategory);
  console.log(`🎯 筛选分类: ${targetCategory} (共 ${targetBooks.length} 本)`);
} else {
  console.log(`📚 处理全库图书 (共 ${targetBooks.length} 本)`);
}

const d = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

// 1. 生成 CSV 表格 (带 UTF-8 BOM，Excel 零乱码)
const escapeCSV = (val) => {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

const headers = [
  '书名',
  '原著名',
  '作者',
  '译者',
  '分类',
  '综合贝叶斯评分',
  '口碑评级',
  '分歧指数',
  '豆瓣评分',
  '豆瓣评价人数',
  'Goodreads评分',
  'Goodreads评价人数',
  'Amazon评分',
  'GoogleBooks评分',
  '核心好评亮点',
  '差评槽点与劝退提示',
  '读者代表性热评',
  '出版社',
  '出版年份',
  'ISBN'
];

const rows = targetBooks.map(b => {
  const p = b.platformRatings || {};
  return [
    escapeCSV(b.title),
    escapeCSV(b.originalTitle || ''),
    escapeCSV(b.author),
    escapeCSV(b.translator || ''),
    escapeCSV(b.category),
    escapeCSV(b.compositeScore),
    escapeCSV(b.verdict?.label || ''),
    escapeCSV(b.discrepancyIndex),
    escapeCSV(p.douban?.score ?? ''),
    escapeCSV(p.douban?.ratingCount ?? ''),
    escapeCSV(p.goodreads?.score ?? ''),
    escapeCSV(p.goodreads?.ratingCount ?? ''),
    escapeCSV(p.amazon?.score ?? ''),
    escapeCSV(p.googleBooks?.score ?? ''),
    escapeCSV((b.pros || []).join('；')),
    escapeCSV((b.cons || []).join('；')),
    escapeCSV(b.representativeReview || ''),
    escapeCSV(b.publisher || ''),
    escapeCSV(b.publicationYear || ''),
    escapeCSV(b.isbn || '')
  ].join(',');
});

const csvPath = path.join(DOWNLOADS_DIR, `BookMeter_全网书评汇总_${timestamp}.csv`);
fs.writeFileSync(csvPath, '\uFEFF' + [headers.join(','), ...rows].join('\r\n'), 'utf8');
console.log(`✅ [Excel/CSV] 表格已生成: ${csvPath}`);

// 2. 生成 JSON 结构化数据包
const jsonPath = path.join(DOWNLOADS_DIR, `BookMeter_完整数据包_${timestamp}.json`);
fs.writeFileSync(jsonPath, JSON.stringify({
  exportedAt: new Date().toISOString(),
  totalCount: targetBooks.length,
  category: targetCategory || '全部',
  data: targetBooks
}, null, 2), 'utf8');
console.log(`✅ [JSON] 结构化数据已生成: ${jsonPath}`);

// 3. 生成 Markdown 离线阅读手册
let md = `# BookMeter · 全网书评权威口碑深度报告\n\n`;
md += `> 生成日期：${d.toLocaleString('zh-CN')} | 收录书籍：${targetBooks.length} 部\n\n`;
md += `| 书名 | 作者 | 分类 | 综合权威分 | 评级 | 豆瓣 | Goodreads |\n`;
md += `| :--- | :--- | :--- | :---: | :---: | :---: | :---: |\n`;
targetBooks.forEach(b => {
  const dScore = b.platformRatings?.douban?.score ?? '-';
  const gScore = b.platformRatings?.goodreads?.score ? `${b.platformRatings.goodreads.score}★` : '-';
  md += `| **${b.title}** | ${b.author} | ${b.category} | **${b.compositeScore}** | ${b.verdict?.label || '-'} | ${dScore} | ${gScore} |\n`;
});

md += `\n---\n\n`;
targetBooks.forEach((b, idx) => {
  md += `### ${idx + 1}. 《${b.title}》\n`;
  md += `- **作者**：${b.author} | **出版年份**：${b.publicationYear} | **分类**：${b.category}\n`;
  md += `- **贝叶斯综合分**：**${b.compositeScore} / 10** (${b.verdict?.label})\n`;
  if (b.pros?.length) md += `- **好评亮点**：${b.pros.join('；')}\n`;
  if (b.cons?.length) md += `- **差评槽点**：${b.cons.join('；')}\n`;
  if (b.representativeReview) md += `- **代表热评**：“${b.representativeReview}”\n`;
  md += `\n`;
});

const mdPath = path.join(DOWNLOADS_DIR, `BookMeter_离线深度报告_${timestamp}.md`);
fs.writeFileSync(mdPath, md, 'utf8');
console.log(`✅ [Markdown] 离线阅读报告已生成: ${mdPath}`);

console.log('=====================================================');
console.log('🎉 所有数据采集与下载文件生成完毕！你和朋友可直接分享或使用。');
console.log('=====================================================');
