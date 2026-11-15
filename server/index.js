const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { books } = require('./data/books');
const { searchLiveBooks } = require('./services/bookFetcher');
const { generateBookDeepInsight, askBookConsultant } = require('./services/aiService');
const { getDownloadOptions, streamEbookDownload, getDownloadInfo } = require('./services/ebookDownloadService');
const ebookService = require('./services/ebookService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/**
 * Clean search query removing Chinese quotes, book brackets, and extra punctuation
 */
function cleanSearchQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .replace(/[《》\u201c\u201d\u2018\u2019\u300c\u300d\u300e\u300f\[\]【】\(\)（）]/g, ' ')
    .replace(/['"]/g, ' ')
    .trim();
}

/**
 * Multi-word tokenized search matcher
 * Matches books where all whitespace-separated tokens match across title, author, originalTitle, tags, category, or summary
 */
function matchBookQuery(book, query) {
  const cleaned = cleanSearchQuery(query);
  if (!cleaned) return false;
  const tokens = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const searchableText = [
    book.title || '',
    book.originalTitle || '',
    book.author || '',
    book.translator || '',
    book.category || '',
    ...(book.tags || []),
    book.isbn || '',
    book.summary || ''
  ].join(' ').toLowerCase();

  return tokens.every(token => searchableText.includes(token));
}

// Serve production static build if available
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// 1. Get all books with filtering, searching, and sorting
app.get('/api/books', (req, res) => {
  const { category, verdict, sort = 'composite', q } = req.query;

  let filtered = [...books];

  // Search keyword in title, author, originalTitle, tags, or summary
  if (q) {
    filtered = filtered.filter(b => matchBookQuery(b, q));
  }

  // Filter by category
  if (category && category !== '全部') {
    filtered = filtered.filter(b => b.category === category);
  }

  // Filter by verdict status (masterpiece, recommended, controversial, warning)
  if (verdict && verdict !== 'all') {
    filtered = filtered.filter(b => b.verdict.status === verdict);
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sort === 'composite') return b.compositeScore - a.compositeScore;
    if (sort === 'douban') return b.platformRatings.douban.score - a.platformRatings.douban.score;
    if (sort === 'goodreads') return b.platformRatings.goodreads.score - a.platformRatings.goodreads.score;
    if (sort === 'discrepancy') return b.discrepancyIndex - a.discrepancyIndex;
    if (sort === 'reviews') {
      const countA = Object.values(a.platformRatings).reduce((sum, p) => sum + (p.ratingCount || 0), 0);
      const countB = Object.values(b.platformRatings).reduce((sum, p) => sum + (p.ratingCount || 0), 0);
      return countB - countA;
    }
    return 0;
  });

  res.json({
    total: filtered.length,
    data: filtered
  });
});

// 2. Get book by ID
app.get('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const book = books.find(b => b.id === id);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  res.json(book);
});

// 3. Search endpoint with live fallback (DeepSeek + OpenLibrary)
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || !String(q).trim()) return res.json({ local: [], live: [] });

  const queryToUse = String(q).length > 500 ? String(q).slice(0, 500) : String(q);
  const localResults = books.filter(b => matchBookQuery(b, queryToUse));

  let liveResults = [];
  // If local has 0 or 1 result, trigger universal live search
  if (localResults.length <= 1) {
    try {
      liveResults = await searchLiveBooks(queryToUse);
    } catch (e) {
      console.error('Live search error:', e.message);
    }
  }

  res.json({
    local: localResults,
    live: liveResults
  });
});

// ==========================================
// Ebook Engine REST Endpoints (Milestone M1)
// ==========================================

// 1. Ebook Options Discovery
app.get('/api/ebooks/options', async (req, res) => {
  try {
    const rawId = req.query.id;
    const rawTitle = req.query.title;
    const rawAuthor = req.query.author;
    if (!rawId && !rawTitle) {
      return res.status(400).json({ success: false, error: 'Book ID or title is required' });
    }
    if (ebookService.hasPathTraversal(rawId) || ebookService.hasPathTraversal(rawTitle) || ebookService.hasPathTraversal(rawAuthor)) {
      return res.status(400).json({ success: false, error: 'Path traversal attempt rejected' });
    }
    const options = await ebookService.getDownloadOptions(rawId, rawTitle, rawAuthor);
    res.json(options);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Real Ebook Binary Download (EPUB, PDF, TXT)
app.get('/api/ebooks/download', async (req, res) => {
  try {
    await ebookService.handleEbookDownload(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

app.head('/api/ebooks/download', async (req, res) => {
  try {
    await ebookService.handleEbookDownload(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).end();
    }
  }
});

/**
 * Verify whether a process is alive
 */
function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number' || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

// 3. Public Tunnel Status (Health & Share Discovery)
app.get('/api/tunnel-status', (req, res) => {
  const tunnelFile = path.join(__dirname, '../public_tunnel.json');
  if (fs.existsSync(tunnelFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(tunnelFile, 'utf8'));
      if (data && data.status) {
        // Verify process liveness before reporting online or starting
        let isAlive = true;
        const hasDaemon = typeof data.daemonPid === 'number';
        const hasChild = typeof data.childPid === 'number';
        if (data.status === 'online' || data.status === 'starting') {
          if (hasDaemon || hasChild) {
            const daemonAlive = hasDaemon && isPidAlive(data.daemonPid);
            const childAlive = hasChild && isPidAlive(data.childPid);
            isAlive = daemonAlive || childAlive;
          }
        }

        const effectiveStatus = isAlive ? data.status : 'offline';
        const effectiveActive = effectiveStatus === 'online';
        const effectiveUrl = effectiveStatus === 'online' ? (data.publicUrl || null) : null;

        return res.json({
          status: effectiveStatus,
          active: effectiveActive,
          daemonPid: data.daemonPid || null,
          childPid: data.childPid || null,
          provider: data.provider || 'cloudflare',
          publicUrl: effectiveUrl,
          target: data.target || `http://localhost:${PORT}`,
          localPort: Number(PORT),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      }
    } catch (e) {
      // Ignore parse errors, fall through to default
    }
  }

  res.json({
    status: 'offline',
    active: false,
    daemonPid: null,
    childPid: null,
    provider: 'cloudflare',
    localPort: Number(PORT),
    publicUrl: null,
    target: `http://localhost:${PORT}`,
    updatedAt: null
  });
});

// 3.6. Book Ebook Direct Download APIs (Milestone 1)
// Query available formats, sizes, and stream URLs
app.get('/api/download/options', async (req, res) => {
  try {
    const { q, author } = req.query;
    const result = await getDownloadOptions(q, author);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stream actual binary ebook file (EPUB, PDF, MOBI, TXT) with zero memory accumulation
app.get('/api/download/stream', async (req, res) => {
  try {
    await streamEbookDownload(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Compatibility file streaming alias
app.get('/api/download/file', async (req, res) => {
  try {
    if (!req.query.q && req.query.id) {
      req.query.q = req.query.id;
    }
    await streamEbookDownload(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Compatibility info endpoint for UI
app.get('/api/download/info', async (req, res) => {
  try {
    const { id, title, q, author } = req.query;
    const result = await getDownloadInfo(id, title || q, author);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.5. Full Dataset Export & Direct Download API (CSV with UTF-8 BOM, JSON)
app.get('/api/export', (req, res) => {
  const { format = 'csv', category, verdict } = req.query;

  let targetBooks = [...books];
  if (category && category !== '全部') {
    targetBooks = targetBooks.filter(b => b.category === category);
  }
  if (verdict && verdict !== 'all') {
    targetBooks = targetBooks.filter(b => b.verdict && b.verdict.status === verdict);
  }

  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

  if (format === 'json') {
    const filename = `BookMeter_Dataset_${timestamp}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalBooks: targetBooks.length,
      data: targetBooks
    }, null, 2));
  }

  // Default: CSV format with UTF-8 BOM
  const headers = [
    '书名',
    '原著名',
    '作者',
    '译者',
    '分类',
    '综合贝叶斯权威分',
    '口碑评级',
    '跨平台分歧指数',
    '豆瓣评分',
    '豆瓣参评人数',
    'Goodreads评分(5星制)',
    'Goodreads参评人数',
    'Amazon评分',
    'GoogleBooks评分',
    '核心好评亮点',
    '差评槽点与劝退提示',
    '读者代表性热评',
    '出版社',
    '出版年份',
    'ISBN'
  ];

  const escapeCSV = (val) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

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

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const filename = `BookMeter_Dataset_${timestamp}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csvContent);
});

// 4. Statistics endpoint
app.get('/api/stats', (req, res) => {
  let totalReviews = 0;
  let scoreSum = 0;

  const verdictCounts = {
    masterpiece: 0,
    recommended: 0,
    controversial: 0,
    warning: 0,
    mediocre: 0
  };

  books.forEach(b => {
    scoreSum += b.compositeScore;
    if (verdictCounts[b.verdict.status] !== undefined) {
      verdictCounts[b.verdict.status]++;
    }
    Object.values(b.platformRatings).forEach(p => {
      totalReviews += p.ratingCount || 0;
    });
  });

  res.json({
    totalBooks: books.length,
    totalReviewsAggregated: totalReviews,
    averageCompositeScore: Number((scoreSum / books.length).toFixed(1)),
    verdictCounts,
    platformsSupported: ['豆瓣读书 (Douban)', 'Goodreads', 'Google Books', 'Amazon Books', 'Open Library']
  });
});

// 5. Categories list with counts
app.get('/api/categories', (req, res) => {
  const counts = { '全部': books.length };
  books.forEach(b => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
  res.json(list);
});

// 6. DeepSeek AI Deep Review & Quality Insight
app.post('/api/ai/insight', async (req, res) => {
  const { bookId, bookData } = req.body;
  const targetBook = bookData || books.find(b => b.id === bookId);

  if (!targetBook) {
    return res.status(404).json({ error: 'Book not found' });
  }

  try {
    const insight = await generateBookDeepInsight(targetBook);
    res.json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DeepSeek Interactive Book Q&A Consultant
app.post('/api/ai/ask', async (req, res) => {
  const { bookId, bookData, question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const targetBook = bookData || books.find(b => b.id === bookId);
  if (!targetBook) {
    return res.status(404).json({ error: 'Book not found' });
  }

  try {
    const answer = await askBookConsultant(targetBook, question);
    res.json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. AI Engine Status & Configuration
app.get('/api/settings/ai-status', (req, res) => {
  res.json({
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
    activeProvider: process.env.GITHUB_TOKEN ? 'GitHub Models (免费优先)' : 'DeepSeek 官方 API (商业后备)'
  });
});

app.post('/api/settings/github-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  process.env.GITHUB_TOKEN = token.trim();
  const envPath = path.join(__dirname, '../.env');
  try {
    const fs = require('fs');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('GITHUB_TOKEN=')) {
      envContent = envContent.replace(/GITHUB_TOKEN=.*/g, `GITHUB_TOKEN=${token.trim()}`);
    } else {
      envContent += `\nGITHUB_TOKEN=${token.trim()}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (e) {
    console.error('Failed to write .env:', e.message);
  }
  res.json({ success: true, message: '已启用 GitHub Models 免费配额优先调度！' });
});

// Fallback to client SPA for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BookMeter Server] Running locally on: http://localhost:${PORT}`);
  console.log(`[BookMeter Server] LAN network access: http://10.3.207.107:${PORT}`);
});
