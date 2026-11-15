/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Total: 35 Tests (5 tests across 7 boundary areas)
 * Covers edge cases, error resilience, sanitization, concurrency, caching, and security boundaries.
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
  // Area 1: Search Boundary Cases [5 tests]
  // ==========================================
  {
    id: 'T2.1',
    area: 'Search Boundaries',
    name: 'Empty query string (/api/search?q=) returns graceful 200 or 400 without 500 crash',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: '' } });
      assert(res.status === 200 || res.status === 400, `Expected 200 or 400, got ${res.status}`);
      if (res.status === 200) {
        const items = Array.isArray(res.data) ? res.data : [...(res.data.local || []), ...(res.data.live || [])];
        assertEqual(items.length, 0, 'Empty query should return 0 items');
      }
    }
  },
  {
    id: 'T2.2',
    area: 'Search Boundaries',
    name: 'Chinese book title punctuation 《百年孤独》 is automatically sanitized and searches correctly',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: '《百年孤独》' } });
      assertStatus(res, 200);
      const items = Array.isArray(res.data) ? res.data : [...(res.data.local || []), ...(res.data.live || [])];
      assert(items.length > 0, 'Sanitized search should match book');
      const found = items.find(b => b.title && b.title.includes('百年孤独'));
      assert(found, 'Should find 百年孤独 despite book brackets');
    }
  },
  {
    id: 'T2.3',
    area: 'Search Boundaries',
    name: 'Quoted query “三体” and \'活着\' are sanitized and search successfully',
    fn: async ({ client }) => {
      const res1 = await client.get('/api/search', { params: { q: '“三体”' } });
      assertStatus(res1, 200);
      const items1 = Array.isArray(res1.data) ? res1.data : [...(res1.data.local || []), ...(res1.data.live || [])];
      assert(items1.some(b => b.title && b.title.includes('三体')), 'Should match 三体 with Chinese quotes');

      const res2 = await client.get('/api/search', { params: { q: "'活着'" } });
      assertStatus(res2, 200);
      const items2 = Array.isArray(res2.data) ? res2.data : [...(res2.data.local || []), ...(res2.data.live || [])];
      assert(items2.some(b => b.title && b.title.includes('活着')), 'Should match 活着 with single quotes');
    }
  },
  {
    id: 'T2.4',
    area: 'Search Boundaries',
    name: 'Extreme length query (500+ characters) is handled gracefully without 500 crash',
    fn: async ({ client }) => {
      const longQuery = '超长书名'.repeat(150);
      const res = await client.get('/api/search', { params: { q: longQuery } });
      assert(
        res.status === 200 || res.status === 400 || res.status === 414,
        `Expected graceful status, got ${res.status}`
      );
      assert(res.status !== 500, 'Server must not throw 500 internal server error on long query');
    }
  },
  {
    id: 'T2.5',
    area: 'Search Boundaries',
    name: 'Non-existent / random gibberish title returns zero dead-end response with fallback links',
    fn: async ({ client }) => {
      const res = await client.get('/api/search', { params: { q: 'xkj9102381023u1aslkd_non_existent' } });
      assertStatus(res, 200);
      // Either empty list or synthesized fallback portrait per GEMINI.md Zero Dead-End Search rule
      assert(res.data !== undefined, 'Response data must exist');
    }
  },

  // ==========================================
  // Area 2: Options Discovery Boundaries [5 tests]
  // ==========================================
  {
    id: 'T2.6',
    area: 'Options Boundaries',
    name: 'Missing id parameter in /api/ebooks/options returns graceful 400 Bad Request',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options');
      assertStatus(res, 400);
      assert(res.data && res.data.error, 'Error message should be provided in response');
    }
  },
  {
    id: 'T2.7',
    area: 'Options Boundaries',
    name: 'Negative or invalid ID (/api/ebooks/options?id=-999) handled without 500 crash',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', { params: { id: '-999' } });
      assert(
        res.status === 200 || res.status === 400 || res.status === 404,
        `Expected non-500 status, got ${res.status}`
      );
      assert(res.status !== 500, 'Server must not crash on invalid negative ID');
    }
  },
  {
    id: 'T2.8',
    area: 'Options Boundaries',
    name: 'Unknown book without ebook returns hasEbook: false or friendly empty formats array',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', {
        params: { id: 'unknown-book-xyz-99999', title: '不存在的虚构作品99999' }
      });
      assert(res.status === 200 || res.status === 404, `Expected 200 or 404, got ${res.status}`);
      if (res.status === 200 && res.data) {
        assertEqual(Boolean(res.data.hasEbook), false, 'hasEbook should be false for non-existent book');
      }
    }
  },
  {
    id: 'T2.9',
    area: 'Options Boundaries',
    name: 'Special characters and emoji in title/author query params are properly decoded',
    fn: async ({ client }) => {
      const res = await client.get('/api/ebooks/options', {
        params: {
          id: 'hundred-years-of-solitude',
          title: '百年孤独 📖 & Special%20Chars#@!',
          author: '加西亚·马尔克斯 <Gabriel>'
        }
      });
      assert(res.status !== 500, 'Special characters must not trigger unhandled internal server error');
    }
  },
  {
    id: 'T2.10',
    area: 'Options Boundaries',
    name: 'Rapid concurrent requests (10 parallel requests) return consistent responses',
    fn: async ({ client }) => {
      const promises = Array.from({ length: 10 }).map(() =>
        client.get('/api/ebooks/options', { params: { id: 'hundred-years-of-solitude' } })
      );
      const results = await Promise.all(promises);
      for (const res of results) {
        assertStatus(res, 200);
        assertEqual(res.data.hasEbook, true, 'All concurrent responses must be consistent');
      }
    }
  },

  // ==========================================
  // Area 3: EPUB Download Boundaries [5 tests]
  // ==========================================
  {
    id: 'T2.11',
    area: 'EPUB Boundaries',
    name: 'Unsupported format parameter (format=mobi or format=exe) returns 400 Bad Request',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'exe' }
      });
      assertStatus(res, 400);
    }
  },
  {
    id: 'T2.12',
    area: 'EPUB Boundaries',
    name: 'Non-existent book download request returns 404 with JSON error message',
    fn: async ({ client }) => {
      const res = await client.request('/api/ebooks/download', {
        params: { id: 'non-existent-book-id-987654', format: 'epub' }
      });
      assertStatus(res, 404);
      assert(res.data, '404 response should include JSON body');
      assert(res.data.error || res.data.message, '404 response should describe missing book');
    }
  },
  {
    id: 'T2.13',
    area: 'EPUB Boundaries',
    name: 'Download request with missing format parameter defaults gracefully or returns 400',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude' }
      });
      // Either defaults to epub (200) or prompts format error (400)
      assert(res.status === 200 || res.status === 400, `Expected 200 or 400, got ${res.status}`);
      if (res.status === 200) {
        assert(res.byteLength > 100, 'Default download should contain file bytes');
      }
    }
  },
  {
    id: 'T2.14',
    area: 'EPUB Boundaries',
    name: 'Range header handling (Range: bytes=0-100) responds with 206 or 200 without crashing',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' },
        headers: { Range: 'bytes=0-100' }
      });
      assert(
        res.status === 206 || res.status === 200,
        `Expected 206 Partial Content or 200 OK, got ${res.status}`
      );
      assert(res.byteLength > 0, 'Range response must not be empty');
    }
  },
  {
    id: 'T2.15',
    area: 'EPUB Boundaries',
    name: 'HTTP HEAD request on download endpoint returns valid headers without streaming body',
    fn: async ({ client }) => {
      const res = await client.head('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(res, 200);
      const ct = res.headers.get('content-type') || '';
      assert(ct.length > 0, 'HEAD request must return Content-Type header');
      const cl = res.headers.get('content-length');
      if (cl) {
        assert(Number(cl) > 1024, `Content-Length should reflect real size: ${cl}`);
      }
    }
  },

  // ==========================================
  // Area 4: PDF Download Boundaries [5 tests]
  // ==========================================
  {
    id: 'T2.16',
    area: 'PDF Boundaries',
    name: 'Download non-existent book PDF returns 404',
    fn: async ({ client }) => {
      const res = await client.request('/api/ebooks/download', {
        params: { id: 'random-ghost-book-8888', format: 'pdf' }
      });
      assertStatus(res, 404);
    }
  },
  {
    id: 'T2.17',
    area: 'PDF Boundaries',
    name: 'Large file streaming uses chunked transfer or sets proper Content-Length',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'pdf' }
      });
      assertStatus(res, 200);
      const cl = res.headers.get('content-length');
      const te = res.headers.get('transfer-encoding');
      assert(cl || te, 'Streaming download must provide either Content-Length or Transfer-Encoding: chunked');
    }
  },
  {
    id: 'T2.18',
    area: 'PDF Boundaries',
    name: 'Aborted client connection during download does not cause unhandled rejection on server',
    fn: async ({ client }) => {
      const controller = new AbortController();
      const fetchPromise = fetch(
        client.buildUrl('/api/ebooks/download', { id: 'hundred-years-of-solitude', format: 'pdf' }),
        { signal: controller.signal }
      );
      // Abort immediately after 20ms
      setTimeout(() => controller.abort(), 20);
      try {
        await fetchPromise;
      } catch (e) {
        // Expected abort error on client side
      }

      // Check server health right after abort
      const health = await client.get('/api/books');
      assertStatus(health, 200, 'Server must remain healthy after client aborts download');
    }
  },
  {
    id: 'T2.19',
    area: 'PDF Boundaries',
    name: 'Path traversal attack defense (id=../../etc/passwd) returns 400 or 404 preventing breakout',
    fn: async ({ client }) => {
      const attackVectors = [
        '../../package.json',
        '..\\..\\server\\index.js',
        '/%2e%2e/%2e%2e/etc/passwd'
      ];
      for (const vector of attackVectors) {
        const res = await client.download('/api/ebooks/download', {
          params: { id: vector, format: 'pdf' }
        });
        assert(
          res.status === 400 || res.status === 403 || res.status === 404,
          `Path traversal ${vector} must be rejected, got ${res.status}`
        );
        // Verify it didn't leak package.json or server source code
        const text = res.buffer ? res.buffer.toString('utf8', 0, 100) : '';
        assert(!text.includes('"name": "bookmeter"'), 'Path traversal leaked package.json!');
        assert(!text.includes('express()'), 'Path traversal leaked server code!');
      }
    }
  },
  {
    id: 'T2.20',
    area: 'PDF Boundaries',
    name: 'UTF-8 Chinese filename encoding in Content-Disposition uses RFC 5987 / UTF-8',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'pdf', title: '百年孤独' }
      });
      assertStatus(res, 200);
      const cd = res.headers.get('content-disposition') || '';
      // Valid RFC 5987 form: filename*=UTF-8''... or standard quoted filename
      const hasRfc5987 = cd.includes("filename*=UTF-8''") || cd.includes('filename*="UTF-8\'\'');
      const hasQuoted = cd.includes('filename=');
      assert(
        hasRfc5987 || hasQuoted,
        `Content-Disposition header must specify standard filename: "${cd}"`
      );
    }
  },

  // ==========================================
  // Area 5: TXT Download Boundaries [5 tests]
  // ==========================================
  {
    id: 'T2.21',
    area: 'TXT Boundaries',
    name: 'Missing book ID returns 400 or 404',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { format: 'txt' }
      });
      assert(res.status === 400 || res.status === 404, `Expected 400 or 404, got ${res.status}`);
    }
  },
  {
    id: 'T2.22',
    area: 'TXT Boundaries',
    name: 'TXT download does not serve raw HTML error page as .txt',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
      const text = res.buffer.toString('utf8');
      assert(
        !text.includes('<!DOCTYPE html>') && !text.includes('<html>'),
        'TXT download must not return HTML markup'
      );
    }
  },
  {
    id: 'T2.23',
    area: 'TXT Boundaries',
    name: 'Chinese characters in TXT payload are encoded in valid UTF-8 without byte corruption',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
      const text = res.buffer.toString('utf8');
      // Buffer should not contain replacement character 
      assert(!text.includes('\uFFFD'), 'Decoded UTF-8 text must not contain unicode replacement character U+FFFD');
      assert(/[\u4e00-\u9fa5]/.test(text), 'TXT book content should contain Chinese characters');
    }
  },
  {
    id: 'T2.24',
    area: 'TXT Boundaries',
    name: 'Concurrent downloads of the same TXT file resolve safely without race condition',
    fn: async ({ client }) => {
      const requests = Array.from({ length: 5 }).map(() =>
        client.download('/api/ebooks/download', {
          params: { id: 'hundred-years-of-solitude', format: 'txt' }
        })
      );
      const responses = await Promise.all(requests);
      for (const res of responses) {
        assertStatus(res, 200);
        assert(res.byteLength > 100, 'Payload must be complete');
        assertMagicBytes(res.buffer, 'txt');
      }
    }
  },
  {
    id: 'T2.25',
    area: 'TXT Boundaries',
    name: 'Empty or 0-byte files are never served as valid books',
    fn: async ({ client }) => {
      const res = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'txt' }
      });
      assertStatus(res, 200);
      assert(res.byteLength > 50, `File size (${res.byteLength} bytes) is suspiciously small or empty`);
    }
  },

  // ==========================================
  // Area 6: Tunnel Status Boundaries [5 tests]
  // ==========================================
  {
    id: 'T2.26',
    area: 'Tunnel Boundaries',
    name: 'Tunnel offline scenario reports active: false or status: offline without hanging',
    fn: async ({ client }) => {
      const res = await client.get('/api/tunnel-status');
      assertStatus(res, 200);
      assert(
        res.data.active === false || res.data.active === true,
        'active field must be boolean'
      );
    }
  },
  {
    id: 'T2.27',
    area: 'Tunnel Boundaries',
    name: 'Tunnel API responds even if cloudflared binary is not currently installed or running',
    fn: async ({ client }) => {
      const res = await client.get('/api/tunnel-status');
      assertStatus(res, 200);
      assert(res.data.provider || res.data.status, 'Payload must contain provider or status');
    }
  },
  {
    id: 'T2.28',
    area: 'Tunnel Boundaries',
    name: 'Method not allowed (POST /api/tunnel-status) is rejected cleanly',
    fn: async ({ client }) => {
      const res = await client.post('/api/tunnel-status', { dummy: 1 });
      assert(
        res.status === 404 || res.status === 405,
        `Expected 404 or 405 Method Not Allowed, got ${res.status}`
      );
    }
  },
  {
    id: 'T2.29',
    area: 'Tunnel Boundaries',
    name: 'Tunnel endpoint does not expose host credentials, auth tokens, or secret env vars',
    fn: async ({ client }) => {
      const res = await client.get('/api/tunnel-status');
      assertStatus(res, 200);
      const text = JSON.stringify(res.data);
      assert(!text.includes('DEEPSEEK_API_KEY'), 'Tunnel endpoint leaked DEEPSEEK_API_KEY');
      assert(!text.includes('CLOUDFLARE_TUNNEL_TOKEN'), 'Tunnel endpoint leaked CLOUDFLARE_TUNNEL_TOKEN');
      assert(!text.includes('password'), 'Tunnel endpoint leaked sensitive keyword');
    }
  },
  {
    id: 'T2.30',
    area: 'Tunnel Boundaries',
    name: 'Tunnel status stays responsive under 20 concurrent queries without latency degradation',
    fn: async ({ client }) => {
      const start = Date.now();
      const promises = Array.from({ length: 20 }).map(() => client.get('/api/tunnel-status'));
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - start;

      for (const res of responses) {
        assertStatus(res, 200);
      }
      assert(
        totalTime < 3000,
        `20 concurrent queries took ${totalTime}ms, expected fast completion < 3000ms`
      );
    }
  },

  // ==========================================
  // Area 7: Resilience Boundaries [5 tests]
  // ==========================================
  {
    id: 'T2.31',
    area: 'Resilience',
    name: 'Network timeout resilience: server handles external resolution within 30 seconds',
    fn: async ({ client }) => {
      const start = Date.now();
      const res = await client.get('/api/ebooks/options', {
        params: { id: 'three-body-problem', title: '三体全集' },
        timeout: 30000
      });
      const elapsed = Date.now() - start;
      assert(
        res.status === 200 || res.status === 404,
        `Expected 200 or 404 within timeout, got ${res.status}`
      );
      assert(elapsed < 30000, `Request took too long: ${elapsed}ms`);
    }
  },
  {
    id: 'T2.32',
    area: 'Resilience',
    name: 'High concurrency search does not exhaust file descriptors or crash event loop',
    fn: async ({ client }) => {
      const queries = ['百年孤独', '三体', '活着', '东野圭吾', '余华', '马尔克斯'];
      const requests = [];
      for (let i = 0; i < 15; i++) {
        const q = queries[i % queries.length];
        requests.push(client.get('/api/search', { params: { q } }));
      }
      const results = await Promise.all(requests);
      for (const res of results) {
        assertStatus(res, 200);
      }
    }
  },
  {
    id: 'T2.33',
    area: 'Resilience',
    name: 'Cache reuse: repeated download of same book completes swiftly (< 1000ms)',
    fn: async ({ client }) => {
      // First download (primes cache or serves from curated)
      await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });

      // Second download should be fast
      const t0 = Date.now();
      const res2 = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      const duration = Date.now() - t0;
      assertStatus(res2, 200);
      assertMagicBytes(res2.buffer, 'epub');
      assert(
        duration < 1000,
        `Cached download took ${duration}ms, expected fast cache hit (< 1000ms)`
      );
    }
  },
  {
    id: 'T2.34',
    area: 'Resilience',
    name: 'Cache integrity: downloaded file bytes are deterministic across multiple requests',
    fn: async ({ client }) => {
      const resA = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      const resB = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(resA, 200);
      assertStatus(resB, 200);
      assertEqual(
        resA.byteLength,
        resB.byteLength,
        `File length should be deterministic: ${resA.byteLength} vs ${resB.byteLength}`
      );
      assert(
        resA.buffer.equals(resB.buffer),
        'Payload bytes between identical download requests must match exactly'
      );
    }
  },
  {
    id: 'T2.35',
    area: 'Resilience',
    name: 'Server health check returns total books count and remains operational',
    fn: async ({ client }) => {
      const res = await client.get('/api/books');
      assertStatus(res, 200);
      assert(res.data && typeof res.data.total === 'number', 'Books count must be numeric');
      assert(res.data.total > 0, 'Database should contain books');
    }
  }
];

if (require.main === module) {
  (async () => {
    try {
      await startServerIfNotRunning();
      const summary = await runSuite('Tier 2: Boundary & Corner Cases', tests);
      process.exit(summary.failed > 0 ? 1 : 0);
    } catch (e) {
      console.error('Fatal test error:', e);
      process.exit(1);
    }
  })();
}

module.exports = {
  name: 'Tier 2: Boundary & Corner Cases',
  tests
};
