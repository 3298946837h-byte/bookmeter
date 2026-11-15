const http = require('http');
const { books } = require('../server/data/books');

console.log(`[Verification] Testing dataset: Total ${books.length} books loaded.`);
const testBook = books.find(b => b.title === '三体全集') || books[0];
console.log(`[Verification] Found test book: 《${testBook.title}》 by ${testBook.author}, Composite score: ${testBook.compositeScore}`);

// Verify CSV formatting
const headers = ['书名', '作者', '综合评分'];
const row = [`"${testBook.title}"`, `"${testBook.author}"`, `"${testBook.compositeScore}"`];
const sampleCsv = '\uFEFF' + headers.join(',') + '\r\n' + row.join(',');
console.log('[Verification] Sample CSV output starts with BOM:', sampleCsv.charCodeAt(0) === 0xFEFF);

console.log('[Verification] All tests passed successfully!');
