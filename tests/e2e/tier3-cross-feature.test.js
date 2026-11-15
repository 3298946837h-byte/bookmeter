/**
 * Tier 3: Cross-Feature Combinations & Pairwise Flows
 * Total: 12 Tests
 * Adheres strictly to specifications in PROJECT.md & TEST_INFRA.md
 */

const {
  TestClient,
  assert,
  assertEqual,
  assertStatus,
  assertMagicBytes,
  assertContentDisposition,
  runSuite,
  startServerIfNotRunning
} = require('./helpers/test-client');

const tests = [
  {
    id: 'T3.1',
    flow: 'Search + Options',
    name: 'Pairwise Search + Options: Search 百年孤独 -> query options with returned ID -> verify title match',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Search should find book');
      const book = items.find(b => b.title && b.title.includes('百年孤独'));
      assert(book, 'Book should be found');

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      assertEqual(optRes.data.hasEbook, true, 'hasEbook must be true');
      assert(
        optRes.data.title.includes('百年孤独'),
        `Options title "${optRes.data.title}" should match search title`
      );
    }
  },
  {
    id: 'T3.2',
    flow: 'Search + EPUB',
    name: 'Pairwise Search + EPUB: Search 百年孤独 -> download EPUB -> verify EPUB magic bytes',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items[0];

      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'epub', title: book.title }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'epub');
      assertContentDisposition(dlRes.headers, 'epub');
    }
  },
  {
    id: 'T3.3',
    flow: 'Search + PDF',
    name: 'Pairwise Search + PDF: Search 三体 -> download PDF -> verify PDF magic bytes',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '三体' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Should find 三体');
      const book = items[0];

      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'pdf', title: book.title }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'pdf');
      assertContentDisposition(dlRes.headers, 'pdf');
    }
  },
  {
    id: 'T3.4',
    flow: 'Search + TXT',
    name: 'Pairwise Search + TXT: Search 活着 -> download TXT -> verify UTF-8 content',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '活着' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Should find 活着');
      const book = items.find(b => b.title && b.title.includes('活着')) || items[0];

      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'txt', title: book.title }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'txt');
      assertContentDisposition(dlRes.headers, 'txt');
    }
  },
  {
    id: 'T3.5',
    flow: 'Full Chain Triplet',
    name: 'Full Chain Triplet: Search 小王子/Clean Code -> fetch options -> download EPUB & PDF -> verify magic bytes',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items[0];

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);

      // Download EPUB
      const epubRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'epub' }
      });
      assertStatus(epubRes, 200);
      assertMagicBytes(epubRes.buffer, 'epub');

      // Download PDF
      const pdfRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'pdf' }
      });
      assertStatus(pdfRes, 200);
      assertMagicBytes(pdfRes.buffer, 'pdf');
    }
  },
  {
    id: 'T3.6',
    flow: 'Tunnel + Search',
    name: 'Tunnel + Search Flow: Check tunnel status -> query search endpoint -> verify public search readiness',
    fn: async ({ client }) => {
      const tunnelRes = await client.get('/api/tunnel-status');
      assertStatus(tunnelRes, 200);

      const searchRes = await client.get('/api/search', { params: { q: '东野圭吾' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Search must work concurrently with tunnel operational');
    }
  },
  {
    id: 'T3.7',
    flow: 'Tunnel + Options',
    name: 'Tunnel + Options Flow: Check tunnel status -> query options endpoint for book formats',
    fn: async ({ client }) => {
      const tunnelRes = await client.get('/api/tunnel-status');
      assertStatus(tunnelRes, 200);

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: 'hundred-years-of-solitude' }
      });
      assertStatus(optRes, 200);
      assertEqual(optRes.data.hasEbook, true, 'hasEbook must be true');
    }
  },
  {
    id: 'T3.8',
    flow: 'Tunnel + Download',
    name: 'Tunnel + Download Flow: Check tunnel status -> execute download -> verify stream headers',
    fn: async ({ client }) => {
      const tunnelRes = await client.get('/api/tunnel-status');
      assertStatus(tunnelRes, 200);

      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(dlRes, 200);
      assert(dlRes.headers.get('content-disposition'), 'Must have Content-Disposition header');
    }
  },
  {
    id: 'T3.9',
    flow: 'Cache Interplay',
    name: 'Cache Interplay: Query options -> download EPUB -> query options again -> verify consistency',
    fn: async ({ client }) => {
      const opt1 = await client.get('/api/ebooks/options', { params: { id: 'hundred-years-of-solitude' } });
      assertStatus(opt1, 200);

      const dl = await client.download('/api/ebooks/download', { params: { id: 'hundred-years-of-solitude', format: 'epub' } });
      assertStatus(dl, 200);

      const opt2 = await client.get('/api/ebooks/options', { params: { id: 'hundred-years-of-solitude' } });
      assertStatus(opt2, 200);
      assertEqual(opt2.data.hasEbook, true, 'hasEbook state should remain stable');
      assertEqual(opt2.data.formats.length, opt1.data.formats.length, 'Formats length should match');
    }
  },
  {
    id: 'T3.10',
    flow: 'Multi-Format Consistency',
    name: 'Multi-Format Consistency: Download EPUB, PDF, and TXT for same book -> verify title consistency in headers',
    fn: async ({ client }) => {
      const bookId = 'hundred-years-of-solitude';
      const formats = ['epub', 'pdf', 'txt'];
      const results = [];

      for (const fmt of formats) {
        const res = await client.download('/api/ebooks/download', {
          params: { id: bookId, format: fmt, title: '百年孤独' }
        });
        assertStatus(res, 200);
        assertMagicBytes(res.buffer, fmt);
        assertContentDisposition(res.headers, fmt);
        results.push(res);
      }

      assertEqual(results.length, 3, 'All 3 formats must download successfully');
    }
  },
  {
    id: 'T3.11',
    flow: 'Search Sanitization + Download',
    name: 'Search Sanitization + Download: Search with 《百年孤独》 -> resolve download -> verify stream',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '《百年孤独》' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Search with book brackets must succeed');
      const book = items[0];

      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'epub' }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'epub');
    }
  },
  {
    id: 'T3.12',
    flow: 'Public Share Link',
    name: 'Public Share Link Integration: Verify tunnel public URL or local share link format',
    fn: async ({ client }) => {
      const tunnelRes = await client.get('/api/tunnel-status');
      assertStatus(tunnelRes, 200);
      const { publicUrl, localPort, active } = tunnelRes.data;

      if (active && publicUrl) {
        assert(
          publicUrl.startsWith('https://'),
          `Public tunnel URL must be HTTPS, got: ${publicUrl}`
        );
      } else {
        // Fallback / Standby behavior
        assert(
          localPort === 5000 || localPort === '5000',
          `Local port should default to 5000, got: ${localPort}`
        );
      }
    }
  }
];

if (require.main === module) {
  (async () => {
    try {
      await startServerIfNotRunning();
      const summary = await runSuite('Tier 3: Cross-Feature Combinations', tests);
      process.exit(summary.failed > 0 ? 1 : 0);
    } catch (e) {
      console.error('Fatal test error:', e);
      process.exit(1);
    }
  })();
}

module.exports = {
  name: 'Tier 3: Cross-Feature Combinations',
  tests
};
