const fs = require('fs');
const path = require('path');

const booksPath = path.join(__dirname, '../../client/src/data/staticBooks.json');
let books = [];

try {
  if (fs.existsSync(booksPath)) {
    books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load books database:', e.message);
}

module.exports = {
  books
};
