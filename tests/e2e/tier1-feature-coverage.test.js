/**
 * Tier 1: Feature Coverage Test Suite (F1 - F7)
 * Total: 35 Tests (5 tests per feature)
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
  // ==========================================
  // F1: Book Search API (/api/search) [5 tests]
  // ==========================================
  {
    id: 'T1.1',
    feature: 'F1: Book Search',
    name: 'Search by standard Chinese title (百年孤独) returns structured book results',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(res, 200);
      assert(res.data, 'Response body must exist');

      const items = Array.isArray(res.data) ? res.data : [...(res.data.local || []), ...(res.data.live || [])];
      assert(items.length > 0, 'Search for 百年孤独 should return at least one result');
      const found = items.find(b => b.title && b.title.includes('百年孤独'));
      assert(found, 'Should find book with title 百年孤独 in search results');
    }
  },
  {
    id: 'T1.2',
    feature: 'F1: Book Search',
    name: 'Search by author name (余华) returns matching books',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: '余华' } });
      assertStatus(res, 200);
      const items = Array.isArray(res.data) ? res.data : [...(res.data.local || []), ...(res.data.live || [])];
      assert(items.length > 0, 'Search for author 余华 should return results');
      const found = items.find(b => b.author && b.author.includes('余华'));
      assert(found, 'At least one book must be authored by 余华');
    }
  },
  {
    id: 'T1.3',
    feature: 'F1: Book Search',
    name: 'Search by English title (Clean Code or The Little Prince) returns matching books',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: 'Clean Code' } });
      assertStatus(res, 200);
      const items = Array.isArray(res.data) ? res.data : [...(res.data.local || []), ...(res.data.live || [])];
      assert(items.length > 0, 'Search for Clean Code should return results');
      const found = items.find(b =>
        (b.title && b.title.toLowerCase().includes('clean code')) ||
        (b.originalTitle && b.originalTitle.toLowerCase().includes('clean code'))
      );
      assert(found, 'Should find book matching Clean Code');
    }
  },
  {
    id: 'T1.4',
    feature: 'F1: Book Search',
    name: 'Search result items contain required metadata fields',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: '三体' } });
      assertStatus(res, 200);
      const items = Array.isArray(res.data) ? res.data : [...(res.data.local || []), ...(res.data.live || [])];
      assert(items.length > 0, 'Search results should not be empty');

      const sample = items[0];
      assert(sample.id, 'Book item must have an id');
      assert(sample.title, 'Book item must have a title');
      assert(sample.author, 'Book item must have an author');
      assert(sample.cover || sample.coverUrl, 'Book item must have a cover image');
      assert(
        sample.compositeScore !== undefined || (sample.platformRatings && Object.keys(sample.platformRatings).length > 0),
        'Book item must have rating metadata'
      );
    }
  },
  {
    id: 'T1.5',
    feature: 'F1: Book Search',
    name: 'Multi-word query (三体 刘慈欣) returns relevant match',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: '三体 刘慈欣' } });
      assertStatus(res, 200);
      const items = Array.isArray(res.data) ? res.data : [...(res.data.local || []), ...(res.data.live || [])];
      assert(items.length > 0, 'Multi-word search should return matching book');
      const found = items.find(b => b.title.includes('三体') || (b.author && b.author.includes('刘慈欣')));
      assert(found, 'Multi-word query must match book title or author');
    }
  },

  // ========================================================
  // F2: Ebook Download Options Discovery (/api/ebooks/options) [5 tests]
  // ========================================================
  {
    id: 'T1.6',
    feature: 'F2: Ebook Options',
    name: 'Query options for catalog book returns hasEbook: true and formats array',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', {
        params: { id: 'hundred-years-of-solitude', title: '百年孤独', author: '加西亚·马尔克斯' }
      });
      assertStatus(res, 200);
      assert(res.data, 'Response body must exist');
      assertEqual(res.data.success, true, 'Response success should be true');
      assertEqual(res.data.hasEbook, true, 'hasEbook flag must be true for catalog book');
      assert(Array.isArray(res.data.formats), 'formats field must be an array');
      assert(res.data.formats.length > 0, 'formats array must contain at least one format');
    }
  },
  {
    id: 'T1.7',
    feature: 'F2: Ebook Options',
    name: 'Options response includes epub format with valid downloadUrl',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', {
        params: { id: 'hundred-years-of-solitude', title: '百年孤独', author: '加西亚·马尔克斯' }
      });
      assertStatus(res, 200);
      const formats = res.data.formats || [];
      const epub = formats.find(f => f.format && f.format.toLowerCase() === 'epub');
      assert(epub, 'Options response must include epub format');
      assert(epub.downloadUrl, 'epub format entry must provide downloadUrl');
      assert(epub.downloadUrl.includes('format=epub'), 'epub downloadUrl must contain format=epub');
    }
  },
  {
    id: 'T1.8',
    feature: 'F2: Ebook Options',
    name: 'Options response includes pdf format with valid downloadUrl',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', {
        params: { id: 'hundred-years-of-solitude', title: '百年孤独', author: '加西亚·马尔克斯' }
      });
      assertStatus(res, 200);
      const formats = res.data.formats || [];
      const pdf = formats.find(f => f.format && f.format.toLowerCase() === 'pdf');
      assert(pdf, 'Options response must include pdf format');
      assert(pdf.downloadUrl, 'pdf format entry must provide downloadUrl');
      assert(pdf.downloadUrl.includes('format=pdf'), 'pdf downloadUrl must contain format=pdf');
    }
  },
  {
    id: 'T1.9',
    feature: 'F2: Ebook Options',
    name: 'Options response includes txt format with valid downloadUrl',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', {
        params: { id: 'hundred-years-of-solitude', title: '百年孤独', author: '加西亚·马尔克斯' }
      });
      assertStatus(res, 200);
      const formats = res.data.formats || [];
      const txt = formats.find(f => f.format && f.format.toLowerCase() === 'txt');
      assert(txt, 'Options response must include txt format');
      assert(txt.downloadUrl, 'txt format entry must provide downloadUrl');
      assert(txt.downloadUrl.includes('format=txt'), 'txt downloadUrl must contain format=txt');
    }
  },
  {
    id: 'T1.10',
    feature: 'F2: Ebook Options',
    name: 'Format entries contain positive integer sizeBytes and human-readable sizeFormatted',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', {
        params: { id: 'hundred-years-of-solitude', title: '百年孤独', author: '加西亚·马尔克斯' }
      });
      assertStatus(res, 200);
      const formats = res.data.formats || [];
      for (const fmt of formats) {
        assert(
          typeof fmt.sizeBytes === 'number' && fmt.sizeBytes > 0,
          `Format ${fmt.format} must have positive integer sizeBytes, got ${fmt.sizeBytes}`
        );
        assert(
          typeof fmt.sizeFormatted === 'string' && fmt.sizeFormatted.length > 0,
          `Format ${fmt.format} must have human-readable sizeFormatted string, got ${fmt.sizeFormatted}`
        );
      }
    }
  },

  // ========================================================
  // F3: Real EPUB Binary Download (/api/ebooks/download) [5 tests]
  // ========================================================
  {
    id: 'T1.11',
    feature: 'F3: EPUB Download',
    name: 'Download EPUB returns HTTP 200',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(res, 200);
    }
  },
  {
    id: 'T1.12',
    feature: 'F3: EPUB Download',
    name: 'EPUB Content-Type header is application/epub+zip or octet-stream',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(res, 200);
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      assert(
        ct.includes('application/epub+zip') || ct.includes('application/octet-stream') || ct.includes('application/zip'),
        `Unexpected Content-Type for EPUB: ${ct}`
      );
    }
  },
  {
    id: 'T1.13',
    feature: 'F3: EPUB Download',
    name: 'EPUB Content-Disposition header indicates attachment with .epub extension',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(res, 200);
      assertContentDisposition(res.headers, 'epub');
    }
  },
  {
    id: 'T1.14',
    feature: 'F3: EPUB Download',
    name: 'EPUB downloaded payload size is non-empty (>1024 bytes)',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(res, 200);
      assert(
        res.byteLength > 1024,
        `EPUB payload too small (${res.byteLength} bytes), expected genuine ebook > 1024 bytes`
      );
    }
  },
  {
    id: 'T1.15',
    feature: 'F3: EPUB Download',
    name: 'EPUB magic bytes match ZIP/EPUB container header (50 4B 03 04)',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(res, 200);
      assertMagicBytes(res.buffer, 'epub');
    }
  },

  // ========================================================
  // F4: Real PDF Binary Download (/api/ebooks/download) [5 tests]
  // ========================================================
  {
    id: 'T1.16',
    feature: 'F4: PDF Download',
    name: 'Download PDF returns HTTP 200',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'pdf' }
      });
      assertStatus(res, 200);
    }
  },
  {
    id: 'T1.17',
    feature: 'F4: PDF Download',
    name: 'PDF Content-Type header is application/pdf or octet-stream',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'pdf' }
      });
      assertStatus(res, 200);
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      assert(
        ct.includes('application/pdf') || ct.includes('application/octet-stream'),
        `Unexpected Content-Type for PDF: ${ct}`
      );
    }
  },
  {
    id: 'T1.18',
    feature: 'F4: PDF Download',
    name: 'PDF Content-Disposition header indicates attachment with .pdf extension',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'pdf' }
      });
      assertStatus(res, 200);
      assertContentDisposition(res.headers, 'pdf');
    }
  },
  {
    id: 'T1.19',
    feature: 'F4: PDF Download',
    name: 'PDF downloaded payload size is non-empty (>1024 bytes)',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'pdf' }
      });
      assertStatus(res, 200);
      assert(
        res.byteLength > 1024,
        `PDF payload too small (${res.byteLength} bytes), expected genuine PDF > 1024 bytes`
      );
    }
  },
  {
    id: 'T1.20',
    feature: 'F4: PDF Download',
    name: 'PDF magic bytes match standard PDF header (25 50 44 46 / %PDF)',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'pdf' }
      });
      assertStatus(res, 200);
      assertMagicBytes(res.buffer, 'pdf');
    }
  },

  // ========================================================
  // F5: Real TXT Binary Download (/api/ebooks/download) [5 tests]
  // ========================================================
  {
    id: 'T1.21',
    feature: 'F5: TXT Download',
    name: 'Download TXT returns HTTP 200',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
    }
  },
  {
    id: 'T1.22',
    feature: 'F5: TXT Download',
    name: 'TXT Content-Type header indicates text/plain',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      assert(
        ct.includes('text/plain') || ct.includes('charset=utf-8'),
        `Unexpected Content-Type for TXT: ${ct}`
      );
    }
  },
  {
    id: 'T1.23',
    feature: 'F5: TXT Download',
    name: 'TXT Content-Disposition header indicates attachment with .txt extension',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
      assertContentDisposition(res.headers, 'txt');
    }
  },
  {
    id: 'T1.24',
    feature: 'F5: TXT Download',
    name: 'TXT downloaded payload size is non-empty (>100 bytes)',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
      assert(
        res.byteLength > 100,
        `TXT payload too small (${res.byteLength} bytes), expected genuine text > 100 bytes`
      );
    }
  },
  {
    id: 'T1.25',
    feature: 'F5: TXT Download',
    name: 'TXT content is valid UTF-8 and contains no HTML error boilerplate',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
      assertMagicBytes(res.buffer, 'txt');
    }
  },

  // ========================================================
  // F6: Public Tunnel Status & URL Discovery (/api/tunnel-status) [5 tests]
  // ========================================================
  {
    id: 'T1.26',
    feature: 'F6: Tunnel Status',
    name: 'GET /api/tunnel-status returns HTTP 200 with JSON payload',
    fn: async ({ client }) => {
      const res = await client.get('/api/tunnel-status');
      assertStatus(res, 200);
      assert(res.data && typeof res.data === 'object', 'Tunnel status must return JSON object');
    }
  },
  {
    id: 'T1.27',
    feature: 'F6: Tunnel Status',
    name: 'Tunnel status payload contains boolean field active or enabled',
    fn: async ({ client }) => {
      const res = await client.get('/api/tunnel-status');
      assertStatus(res, 200);
      const active = res.data.active !== undefined ? res.data.active : res.data.enabled;
      assert(
        typeof active === 'boolean',
        `Expected active/enabled boolean field, got ${typeof active}`
      );
    }
  },
  {
    id: 'T1.28',
    feature: 'F6: Tunnel Status',
    name: 'Tunnel status payload contains status string (online, offline, or standby)',
    fn: async ({ client }) => {
      const res = await client.get('/api/tunnel-status');
      assertStatus(res, 200);
      const status = res.data.status;
      assert(typeof status === 'string', `status must be string, got ${typeof status}`);
      const validStatuses = ['online', 'offline', 'standby', 'starting', 'disabled'];
      assert(
        validStatuses.includes(status.toLowerCase()),
        `Unexpected tunnel status: ${status}`
      );
    }
  },
  {
    id: 'T1.29',
    feature: 'F6: Tunnel Status',
    name: 'Tunnel status payload contains localPort integer (5000)',
    fn: async ({ client }) => {
      const res = await client.get('/api/tunnel-status');
      assertStatus(res, 200);
      assertEqual(Number(res.data.localPort), 5000, 'localPort must be 5000');
    }
  },
  {
    id: 'T1.30',
    feature: 'F6: Tunnel Status',
    name: 'Tunnel status health check completes within 500ms',
    fn: async ({ client }) => {
      const start = Date.now();
      const res = await client.get('/api/tunnel-status');
      const elapsed = Date.now() - start;
      assertStatus(res, 200);
      assert(
        elapsed < 500,
        `Tunnel status check took ${elapsed}ms, expected fast health check < 500ms`
      );
    }
  },

  // ========================================================
  // F7: Full Search-to-Download Journey [5 tests]
  // ========================================================
  {
    id: 'T1.31',
    feature: 'F7: Search-to-Download Journey',
    name: 'Search query -> extract result id -> query options -> verify options available',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Must return at least 1 book');
      const targetBook = items[0];

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: targetBook.id, title: targetBook.title, author: targetBook.author }
      });
      assertStatus(optRes, 200);
      assertEqual(optRes.data.hasEbook, true, 'Discovered book must have ebooks available');
    }
  },
  {
    id: 'T1.32',
    feature: 'F7: Search-to-Download Journey',
    name: 'Search query -> download options -> execute EPUB download -> verify downloaded stream',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items[0];

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      const epubOpt = (optRes.data.formats || []).find(f => f.format === 'epub');
      assert(epubOpt, 'EPUB format must be in options');

      const dlRes = await client.download(epubOpt.downloadUrl || '/api/ebooks/download', {
        params: { id: book.id, format: 'epub' }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'epub');
    }
  },
  {
    id: 'T1.33',
    feature: 'F7: Search-to-Download Journey',
    name: 'Search query -> download options -> execute PDF download -> verify downloaded stream',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items[0];

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      const pdfOpt = (optRes.data.formats || []).find(f => f.format === 'pdf');
      assert(pdfOpt, 'PDF format must be in options');

      const dlRes = await client.download(pdfOpt.downloadUrl || '/api/ebooks/download', {
        params: { id: book.id, format: 'pdf' }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'pdf');
    }
  },
  {
    id: 'T1.34',
    feature: 'F7: Search-to-Download Journey',
    name: 'Search query -> download options -> execute TXT download -> verify downloaded stream',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items[0];

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      const txtOpt = (optRes.data.formats || []).find(f => f.format === 'txt');
      assert(txtOpt, 'TXT format must be in options');

      const dlRes = await client.download(txtOpt.downloadUrl || '/api/ebooks/download', {
        params: { id: book.id, format: 'txt' }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'txt');
    }
  },
  {
    id: 'T1.35',
    feature: 'F7: Search-to-Download Journey',
    name: 'Search-to-download journey preserves original book title in Content-Disposition filename',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items[0];

      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'epub', title: book.title }
      });
      assertStatus(dlRes, 200);
      const cd = dlRes.headers.get('content-disposition') || '';
      // Should preserve 百年孤独 or encoded representation
      const encodedTitle = encodeURIComponent('百年孤独');
      assert(
        cd.includes('百年孤独') || cd.includes(encodedTitle) || cd.toLowerCase().includes('solitude'),
        `Content-Disposition should preserve title: "${cd}"`
      );
    }
  }
];

// Standalone execution support
if (require.main === module) {
  (async () => {
    try {
      await startServerIfNotRunning();
      const summary = await runSuite('Tier 1: Feature Coverage (F1 - F7)', tests);
      process.exit(summary.failed > 0 ? 1 : 0);
    } catch (e) {
      console.error('Fatal test error:', e);
      process.exit(1);
    }
  })();
}

module.exports = {
  name: 'Tier 1: Feature Coverage',
  tests
};
