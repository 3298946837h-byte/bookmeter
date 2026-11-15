const express = require('express');
const cors = require('cors');
const { books } = require('../server/data/books');
const { searchLiveBooks } = require('../server/services/bookFetcher');
const { generateBookDeepInsight, askBookConsultant } = require('../server/services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Get all books with filtering, searching, and sorting
app.get('/api/books', (req, res) => {
  const { category, verdict, sort = 'composite', q } = req.query;

  let filtered = [...books];

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

  if (category && category !== '全部') {
    filtered = filtered.filter(b => b.category === category);
  }

  if (verdict && verdict !== 'all') {
    filtered = filtered.filter(b => b.verdict.status === verdict);
  }

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

// 3. Search endpoint with live crawler fallback
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

// 6. AI Insight endpoint (0 cost cache / safe)
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

// 7. AI Q&A Consultant endpoint
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

module.exports = app;
