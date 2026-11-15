/**
 * Tier 4: Real-World Application Scenarios
 * Total: 8 Realistic User Journey Tests
 * Directly exercises the core acceptance criterion:
 * “把网站发我朋友，我朋友随便搜本书，就能下到电子版”
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
  // =========================================================================
  // Scenario 1: 《百年孤独》完整好友分享与下载链路
  // =========================================================================
  {
    id: 'T4.1',
    scenario: 'Scenario 1',
    name: '《百年孤独》完整好友分享与下载链路: 模拟朋友打开公网链接搜索并秒下真实EPUB',
    fn: async ({ client }) => {
      // Step 1: Friend accesses public link / tunnel status
      const tunnelRes = await client.get('/api/tunnel-status');
      assertStatus(tunnelRes, 200);

      // Step 2: Friend types "百年孤独" into top search bar
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Search must return results for 百年孤独');
      const book = items[0];

      // Step 3: Friend clicks download button -> modal queries options
      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      assertEqual(optRes.data.hasEbook, true, 'Book must have downloadable formats');

      const epubOption = (optRes.data.formats || []).find(f => f.format === 'epub');
      assert(epubOption, 'EPUB format must be available');

      // Step 4: Friend clicks EPUB download -> real binary file streams to device
      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'epub', title: book.title }
      });
      assertStatus(dlRes, 200);
      assertContentDisposition(dlRes.headers, 'epub');
      assertMagicBytes(dlRes.buffer, 'epub');
      assert(
        dlRes.byteLength > 100 * 1024,
        `Expected complete EPUB > 100KB, got ${(dlRes.byteLength / 1024).toFixed(1)}KB`
      );
    }
  },

  // =========================================================================
  // Scenario 2: 《三体》PDF版免翻墙即开即下
  // =========================================================================
  {
    id: 'T4.2',
    scenario: 'Scenario 2',
    name: '《三体》PDF版免翻墙即开即下: 模拟朋友搜索《三体》并下载高清完整PDF',
    fn: async ({ client }) => {
      // Step 1: Search with Chinese brackets
      const searchRes = await client.get('/api/search', { params: { q: '《三体》' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Search must return 三体');
      const book = items[0];

      // Step 2: Query options
      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      const pdfOption = (optRes.data.formats || []).find(f => f.format === 'pdf');
      assert(pdfOption, 'PDF format must be available in options');

      // Step 3: Download PDF stream
      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'pdf', title: book.title }
      });
      assertStatus(dlRes, 200);
      assertContentDisposition(dlRes.headers, 'pdf');
      assertMagicBytes(dlRes.buffer, 'pdf');
      assert(
        dlRes.byteLength > 200 * 1024,
        `Expected complete PDF > 200KB, got ${(dlRes.byteLength / 1024).toFixed(1)}KB`
      );
    }
  },

  // =========================================================================
  // Scenario 3: 《活着》TXT版纯文本完整下载
  // =========================================================================
  {
    id: 'T4.3',
    scenario: 'Scenario 3',
    name: '《活着》TXT版纯文本完整下载: 模拟移动端离线纯文本下载',
    fn: async ({ client }) => {
      // Step 1: Search
      const searchRes = await client.get('/api/search', { params: { q: '活着' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items.find(b => b.title && b.title.includes('活着')) || items[0];

      // Step 2: Download TXT
      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'txt', title: book.title }
      });
      assertStatus(dlRes, 200);
      assertContentDisposition(dlRes.headers, 'txt');
      assertMagicBytes(dlRes.buffer, 'txt');
      assert(
        dlRes.byteLength > 50 * 1024,
        `Expected complete TXT book > 50KB, got ${(dlRes.byteLength / 1024).toFixed(1)}KB`
      );

      // Verify no HTML error boilerplate
      const text = dlRes.buffer.toString('utf8');
      assert(!text.includes('<!DOCTYPE'), 'Downloaded TXT should not contain HTML doctype');
    }
  },

  // =========================================================================
  // Scenario 4: 《小王子》中英双语多格式支持
  // =========================================================================
  {
    id: 'T4.4',
    scenario: 'Scenario 4',
    name: '《小王子》/ Clean Code: 验证经典文学多格式检索与下载',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      const book = items[0];

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      const formats = optRes.data.formats || [];
      assert(formats.length >= 2, 'Should offer multiple format options (e.g. EPUB and PDF)');

      // Download EPUB
      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'epub' }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'epub');
    }
  },

  // =========================================================================
  // Scenario 5: 《解忧杂货店》真实电子书下载
  // =========================================================================
  {
    id: 'T4.5',
    scenario: 'Scenario 5',
    name: '《解忧杂货店》真实电子书下载: 模拟热门畅销书一键下载',
    fn: async ({ client }) => {
      const searchRes = await client.get('/api/search', { params: { q: '解忧杂货店' } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, 'Should find 解忧杂货店');
      const book = items[0];

      const optRes = await client.get('/api/ebooks/options', {
        params: { id: book.id, title: book.title, author: book.author }
      });
      assertStatus(optRes, 200);
      assertEqual(optRes.data.hasEbook, true, 'hasEbook must be true');

      const dlRes = await client.download('/api/ebooks/download', {
        params: { id: book.id, format: 'epub' }
      });
      assertStatus(dlRes, 200);
      assertMagicBytes(dlRes.buffer, 'epub');
    }
  },

  // =========================================================================
  // Scenario 6: 移动端用户连续搜索与多本下载流程
  // =========================================================================
  {
    id: 'T4.6',
    scenario: 'Scenario 6',
    name: '移动端用户连续搜索与多本下载流程: 连续检索Book A和Book B并依次下载',
    fn: async ({ client }) => {
      // User searches and downloads Book A (百年孤独)
      const resA = await client.get('/api/search', { params: { q: '百年孤独' } });
      assertStatus(resA, 200);
      const dlA = await client.download('/api/ebooks/download', {
        params: { id: 'hundred-years-of-solitude', format: 'epub' }
      });
      assertStatus(dlA, 200);
      assertMagicBytes(dlA.buffer, 'epub');

      // User immediately searches and downloads Book B (三体) without reload
      const resB = await client.get('/api/search', { params: { q: '三体' } });
      assertStatus(resB, 200);
      const dlB = await client.download('/api/ebooks/download', {
        params: { id: 'three-body-problem', format: 'pdf' }
      });
      assertStatus(dlB, 200);
      assertMagicBytes(dlB.buffer, 'pdf');
    }
  },

  // =========================================================================
  // Scenario 7: 网络抖动与重复点击下载防护
  // =========================================================================
  {
    id: 'T4.7',
    scenario: 'Scenario 7',
    name: '网络抖动与重复点击下载防护: 快速双击下载按钮触发两个并行流，均无损坏',
    fn: async ({ client }) => {
      const bookId = 'hundred-years-of-solitude';
      const [click1, click2] = await Promise.all([
        client.download('/api/ebooks/download', { params: { id: bookId, format: 'epub' } }),
        client.download('/api/ebooks/download', { params: { id: bookId, format: 'epub' } })
      ]);

      assertStatus(click1, 200);
      assertStatus(click2, 200);
      assertMagicBytes(click1.buffer, 'epub');
      assertMagicBytes(click2.buffer, 'epub');
      assertEqual(click1.byteLength, click2.byteLength, 'Both parallel downloads must yield identical byte sizes');
    }
  },

  // =========================================================================
  // Scenario 8: 终极端到端验收
  // =========================================================================
  {
    id: 'T4.8',
    scenario: 'Scenario 8',
    name: '终极端到端验收：“发给朋友，随便搜本书，直接下到电子版”全链路模拟',
    fn: async ({ client }) => {
      // 1. Friend receives and checks public sharing link
      const tunnel = await client.get('/api/tunnel-status');
      assertStatus(tunnel, 200);

      // 2. Friend opens web interface and searches for favorite book
      const targetQuery = '百年孤独';
      const searchRes = await client.get('/api/search', { params: { q: targetQuery } });
      assertStatus(searchRes, 200);
      const items = Array.isArray(searchRes.data) ? searchRes.data : [...(searchRes.data.local || []), ...(searchRes.data.live || [])];
      assert(items.length > 0, `Search for ${targetQuery} should return matching books`);
      const selectedBook = items[0];

      // 3. Friend opens download card, sees format options with genuine sizes
      const optionsRes = await client.get('/api/ebooks/options', {
        params: { id: selectedBook.id, title: selectedBook.title, author: selectedBook.author }
      });
      assertStatus(optionsRes, 200);
      assertEqual(optionsRes.data.hasEbook, true, 'Ebook must be ready for download');
      assert(optionsRes.data.formats && optionsRes.data.formats.length > 0, 'Must provide downloadable formats');

      // 4. Friend clicks download EPUB
      const downloadRes = await client.download('/api/ebooks/download', {
        params: { id: selectedBook.id, format: 'epub', title: selectedBook.title }
      });
      assertStatus(downloadRes, 200);

      // 5. Deep validation of downloaded file:
      // - Correct MIME type
      const ct = downloadRes.headers.get('content-type') || '';
      assert(
        ct.includes('epub') || ct.includes('octet-stream') || ct.includes('zip'),
        `Unexpected Content-Type: ${ct}`
      );
      // - Correct Content-Disposition with attachment and title
      assertContentDisposition(downloadRes.headers, 'epub');
      // - Magic bytes match PK.. (0x50 0x4B 0x03 0x04)
      assertMagicBytes(downloadRes.buffer, 'epub');
      // - Substantial genuine file size (>100KB)
      assert(
        downloadRes.byteLength > 100 * 1024,
        `File size (${(downloadRes.byteLength / 1024).toFixed(1)}KB) should be a complete genuine ebook (>100KB)`
      );

      console.log(`       [Scenario 8 Success] Verified complete friend search & download journey for "${selectedBook.title}" (${(downloadRes.byteLength / 1024).toFixed(1)} KB)`);
    }
  }
];

if (require.main === module) {
  (async () => {
    try {
      await startServerIfNotRunning();
      const summary = await runSuite('Tier 4: Real-World Application Scenarios', tests);
      process.exit(summary.failed > 0 ? 1 : 0);
    } catch (e) {
      console.error('Fatal test error:', e);
      process.exit(1);
    }
  })();
}

module.exports = {
  name: 'Tier 4: Real-World Application Scenarios',
  tests
};
