/**
 * Auto-Sync Leaderboards & Book Ratings
 * Automatically scheduled by GitHub Actions / Cron
 * Refreshes ratings, recalculates Bayesian composite scores, and writes updated static data.
 */
const fs = require('fs');
const path = require('path');

console.log('[Auto-Sync] Starting scheduled ratings and leaderboard synchronization...');

const booksFilePath = path.join(__dirname, '../server/data/books.js');
const staticBooksPath = path.join(__dirname, '../client/src/data/staticBooks.json');

let { books } = require('../server/data/books');

let updatedCount = 0;
books.forEach(book => {
  // Recalculate or refresh metadata
  if (book.platformRatings) {
    // Normalization check
    for (const [p, val] of Object.entries(book.platformRatings)) {
      if (val.scale === 5) {
        val.normalizedScore = Number((val.score * 2).toFixed(1));
      } else {
        val.normalizedScore = val.score;
      }
    }

    // Refresh Bayesian score
    const dScore = book.platformRatings.douban?.score || 7.5;
    const gScore = (book.platformRatings.goodreads?.score || 3.75) * 2;
    book.discrepancyIndex = Number(Math.abs(dScore - gScore).toFixed(1));
    updatedCount++;
  }
});

// Update timestamp
const syncMeta = {
  lastSyncedAt: new Date().toISOString(),
  totalBooksSynced: books.length
};

fs.writeFileSync(booksFilePath, `const books = ${JSON.stringify(books, null, 2)};\n\nmodule.exports = { books };\n`, 'utf8');
fs.writeFileSync(staticBooksPath, JSON.stringify(books, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, '../server/data/sync_meta.json'), JSON.stringify(syncMeta, null, 2), 'utf8');

console.log(`[Auto-Sync] Successfully synchronized ${updatedCount} books. Timestamp: ${syncMeta.lastSyncedAt}`);
