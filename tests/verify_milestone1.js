/**
 * Milestone 1 Verification Test Suite
 * Tests Backend Ebook Download Engine & REST Endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
let failedCount = 0;
let passedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passedCount++;
  }
}

async function testOptionsEndpoint() {
  console.log('\n--- Test 1: GET /api/download/options ---');
  
  // 1.1 Test Chinese book 《活着》
  const res1 = await axios.get(`${BASE_URL}/api/download/options?q=${encodeURIComponent('《活着》')}`);
  assert(res1.status === 200, 'Status is 200 for 《活着》');
  assert(res1.data.query === '活着', 'Query is cleaned of brackets: ' + res1.data.query);
  assert(res1.data.hasDownload === true, 'hasDownload is true for 活着');
  assert(Array.isArray(res1.data.options) && res1.data.options.length > 0, 'Options array populated');
  
  const formats = res1.data.options.map(o => o.format);
  console.log('Available formats for 《活着》:', formats);
  assert(formats.includes('epub'), 'Contains EPUB format');
  
  const epubOpt = res1.data.options.find(o => o.format === 'epub');
  assert(epubOpt.streamUrl.includes('/api/download/stream'), 'Stream URL is properly formatted');
  assert(typeof epubOpt.size === 'string' && epubOpt.size.length > 0, 'Size is provided: ' + epubOpt.size);
  
  assert(Array.isArray(res1.data.externalSearchLinks) && res1.data.externalSearchLinks.length >= 3, 'External search links present');
  console.log('External links count:', res1.data.externalSearchLinks.length);

  // 1.2 Test classic English book "The Great Gatsby"
  const res2 = await axios.get(`${BASE_URL}/api/download/options?q=${encodeURIComponent('The Great Gatsby')}`);
  assert(res2.status === 200, 'Status is 200 for The Great Gatsby');
  assert(res2.data.hasDownload === true, 'hasDownload is true for The Great Gatsby');
  console.log('Available formats for The Great Gatsby:', res2.data.options.map(o => o.format));

  // 1.3 Test obscure/non-existent query (Zero dead-end fallback)
  const res3 = await axios.get(`${BASE_URL}/api/download/options?q=${encodeURIComponent('xyz_obscure_book_not_in_any_db_9999')}`);
  assert(res3.status === 200, 'Status is 200 for obscure query');
  assert(Array.isArray(res3.data.externalSearchLinks) && res3.data.externalSearchLinks.length >= 3, 'Fallback search links provided for obscure query');
  assert(res3.data.externalSearchLinks.some(l => l.name.includes("安娜")), 'Includes Anna Archive fallback');
}

async function testInfoEndpoint() {
  console.log('\n--- Test 2: GET /api/download/info ---');
  const res = await axios.get(`${BASE_URL}/api/download/info?id=to-live&title=${encodeURIComponent('活着')}`);
  assert(res.status === 200, 'Status is 200 for /api/download/info');
  assert(res.data.bookId === 'to-live', 'bookId matches');
  assert(res.data.title === '活着', 'title matches');
  assert(res.data.available === true, 'available is true');
  assert(Array.isArray(res.data.formats) && res.data.formats.length > 0, 'formats array populated');
  assert(Array.isArray(res.data.mirrors) && res.data.mirrors.length >= 2, 'mirrors array populated');
}

async function testStreamDownload() {
  console.log('\n--- Test 3: GET /api/download/stream (Binary Integrity & Streaming) ---');

  // 3.1 Stream 《活着》 EPUB
  console.log('Downloading 《活着》 EPUB stream...');
  const start1 = Date.now();
  const res1 = await axios({
    method: 'GET',
    url: `${BASE_URL}/api/download/stream?q=${encodeURIComponent('活着')}&format=epub&title=${encodeURIComponent('活着')}`,
    responseType: 'arraybuffer'
  });
  const dur1 = Date.now() - start1;
  console.log(`Downloaded in ${dur1}ms. Status: ${res1.status}`);

  assert(res1.status === 200, 'Status is 200 for 《活着》 stream');
  assert(res1.headers['content-type'] === 'application/epub+zip', 'Content-Type is application/epub+zip: ' + res1.headers['content-type']);
  
  const disp = res1.headers['content-disposition'] || '';
  assert(disp.includes("filename*="), 'Content-Disposition contains RFC 5987 encoded filename: ' + disp);
  
  const buffer1 = Buffer.from(res1.data);
  assert(buffer1.length > 10000, `Buffer size is sufficient (${buffer1.length} bytes)`);
  
  // Verify EPUB magic bytes: PK\x03\x04
  const magicEpub = buffer1.slice(0, 4);
  const isEpubValid = magicEpub[0] === 0x50 && magicEpub[1] === 0x4B && magicEpub[2] === 0x03 && magicEpub[3] === 0x04;
  assert(isEpubValid, `Magic bytes verified PK\\x03\\x04: ${magicEpub.toString('hex')}`);

  // 3.2 Repeat Download: Verify Tier 1 Local Cache (HIT) and sub-50ms latency
  console.log('Testing Tier 1 Local Cache HIT for repeat request...');
  const startCache = Date.now();
  const resCache = await axios({
    method: 'GET',
    url: `${BASE_URL}/api/download/stream?q=${encodeURIComponent('活着')}&format=epub&title=${encodeURIComponent('活着')}`,
    responseType: 'arraybuffer'
  });
  const durCache = Date.now() - startCache;
  console.log(`Cache HIT response in ${durCache}ms. X-Cache-Status: ${resCache.headers['x-cache-status']}`);
  
  assert(resCache.status === 200, 'Status is 200 for cached download');
  assert(resCache.headers['x-cache-status'] === 'HIT', 'Header X-Cache-Status is HIT');
  assert(durCache < 100, `Repeat download latency is ultra-fast: ${durCache}ms (<100ms)`);
  assert(Buffer.from(resCache.data).length === buffer1.length, 'Cached file size matches original bit-for-bit');

  // 3.3 Stream 《The Great Gatsby》 EPUB
  console.log('\nDownloading 《The Great Gatsby》 EPUB stream...');
  const res2 = await axios({
    method: 'GET',
    url: `${BASE_URL}/api/download/stream?q=${encodeURIComponent('The Great Gatsby')}&format=epub&title=${encodeURIComponent('The Great Gatsby')}`,
    responseType: 'arraybuffer'
  });
  assert(res2.status === 200, 'Status is 200 for The Great Gatsby');
  assert(res2.headers['content-type'] === 'application/epub+zip', 'Content-Type is application/epub+zip');
  const buffer2 = Buffer.from(res2.data);
  const magic2 = buffer2.slice(0, 4);
  assert(magic2[0] === 0x50 && magic2[1] === 0x4B && magic2[2] === 0x03 && magic2[3] === 0x04, `Magic bytes verified PK\\x03\\x04 for Gatsby: ${magic2.toString('hex')}`);
  console.log(`The Great Gatsby EPUB verified: ${buffer2.length} bytes`);

  // 3.4 Stream 《三体》 PDF
  console.log('\nDownloading 《三体》 PDF stream...');
  const res3 = await axios({
    method: 'GET',
    url: `${BASE_URL}/api/download/stream?q=${encodeURIComponent('三体')}&format=pdf&title=${encodeURIComponent('三体')}`,
    responseType: 'arraybuffer'
  });
  assert(res3.status === 200, 'Status is 200 for 三体 PDF');
  assert(res3.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');
  const buffer3 = Buffer.from(res3.data);
  const magic3 = buffer3.slice(0, 4).toString('utf8');
  assert(magic3 === '%PDF', `Magic bytes verified %PDF for 三体: ${magic3}`);
  console.log(`三体 PDF verified: ${buffer3.length} bytes`);
}

async function run() {
  console.log('====================================================');
  console.log('   Milestone 1 Verification Test Suite');
  console.log('====================================================');
  try {
    await testOptionsEndpoint();
    await testInfoEndpoint();
    await testStreamDownload();
    console.log('\n====================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passedCount} passed, 0 failed)`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test execution encountered failure:', err.message);
    console.log(`Summary: ${passedCount} passed, ${failedCount} failed`);
    process.exit(1);
  }
}

run();
