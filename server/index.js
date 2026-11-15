const path = require('path');
const express = require('express');
const cors = require('cors');
const { books } = require('./data/books');
const { searchLiveBooks } = require('./services/bookFetcher');
const { generateBookDeepInsight, askBookConsultant } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve production static build if available
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// 1. Get all books with filtering, searching, and sorting
app.get('/api/books', (req, res) => {
  const { category, verdict, sort = 'composite', q } = req.query;

  let filtered = [...books];

  // Search keyword in title, author, originalTitle, tags, or summary
  if (q) {
    const query = q.toLowerCase().trim();
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.originalTitle.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.tags.some(t => t.toLowerCase().includes(query)) ||
      (b.isbn && b.isbn.includes(query))
    );
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
  if (!q) return res.json({ local: [], live: [] });

  const query = q.toLowerCase().trim();
  const localResults = books.filter(b =>
    b.title.toLowerCase().includes(query) ||
    b.originalTitle.toLowerCase().includes(query) ||
    b.author.toLowerCase().includes(query) ||
    b.tags.some(t => t.toLowerCase().includes(query)) ||
    (b.isbn && b.isbn.includes(query))
  );

  let liveResults = [];
  // If local has 0 or 1 result, trigger universal live search
  if (localResults.length <= 1) {
    try {
      liveResults = await searchLiveBooks(q);
    } catch (e) {
      console.error('Live search error:', e.message);
    }
  }

  res.json({
    local: localResults,
    live: liveResults
  });
});

// Auto-add live crawled book into persistent catalog
app.post('/api/books/auto-add', (req, res) => {
  const newBook = req.body;
  if (!newBook || !newBook.title) return res.status(400).json({ error: 'Missing title' });

  const staticPath = path.join(__dirname, '../client/src/data/staticBooks.json');
  try {
    const list = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
    if (!list.some(b => b.title.toLowerCase() === newBook.title.toLowerCase())) {
      list.unshift(newBook);
      fs.writeFileSync(staticPath, JSON.stringify(list, null, 2), 'utf8');
      books.unshift(newBook);
      console.log(`[Auto Add] Saved new book to catalog: ${newBook.title}`);
    }
    res.json({ success: true, count: list.length });
  } catch (e) {
    console.error('Failed to auto-add book:', e.message);
    res.status(500).json({ error: e.message });
  }
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
