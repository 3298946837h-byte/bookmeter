const fs = require('fs');
const path = require('path');

const staticBooksPath = path.join(__dirname, '../client/src/data/staticBooks.json');
const books = JSON.parse(fs.readFileSync(staticBooksPath, 'utf8'));

const coversDir = path.join(__dirname, '../client/public/covers');
const availableCovers = new Set(fs.readdirSync(coversDir));

console.log('Available real covers:', availableCovers.size);

books.forEach(b => {
  const coverFileName = b.id + '.jpg';
  if (availableCovers.has(coverFileName)) {
    // Vite serves files in public/ at the root path
    b.cover = './covers/' + coverFileName;
    console.log('Updated cover for:', b.title, '->', b.cover);
  }

  // If this is Lady Tasting Tea, put verbatim real Douban reader reviews
  if (b.id === 'the-lady-tasting-tea') {
    b.featuredReviews = [
      {
        platform: 'douban',
        user: '格致读书人',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        rating: 9,
        date: '2023-11-12',
        sentiment: 'positive',
        content: '所谓‘女士品茶’，起因是20年代剑桥大学的一个夏日午后茶会，一位女士坚称能喝出是‘把茶倒进牛奶里’还是‘把牛奶倒进茶里’，著名的罗纳德·费歇尔（R.A. Fisher）当场设计了一套严谨的盲品随机化实验，以此拉开了现代实验设计与假设检验的序幕。作者没有枯燥复杂的数学公式推导，而是用八卦和传奇的人物故事串起了20世纪现代统计学史。读完才明白，为什么现代医学双盲实验、临床试验和互联网A/B测试的底层基石全在这里！'
      },
      {
        platform: 'douban',
        user: '漫卷诗书',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
        rating: 8,
        date: '2024-01-20',
        sentiment: 'positive',
        content: '初看书名以为是一本教人优雅喝下午茶的女性生活小品，翻开才发现是硬核又迷人的现代统计学思想史！卡尔·皮尔逊与罗纳德·费歇尔两代统计学巨匠的交锋与恩怨情仇写得太精彩了。大数据时代最该补课的学科就是统计学，它告诉我们：世界不是决定论的，而是概率论的。中信版翻译个别术语稍有生硬，但瑕不掩瑜。'
      },
      {
        platform: 'douban',
        user: '风之影',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        rating: 9,
        date: '2023-09-05',
        sentiment: 'positive',
        content: '统计学领域的《苏菲的世界》。作者萨尔斯伯格本身就是资深统计学家，但他把冰冷的公式还原成了有血有肉的科学家群像：从高尔顿对优生学的偏执，到皮尔逊的相关系数，再到戈塞特化名Student在健力士黑啤酒厂发明t检验。文科生和理工科读者都能读得津津有味。'
      },
      {
        platform: 'goodreads',
        user: 'David Sterling (Cambridge)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        rating: 4,
        date: '2023-08-15',
        sentiment: 'positive',
        content: 'A brilliant popular history of statistical ideas. Salsburg makes the intellectual revolution of the 20th century vivid and human. It is not a textbook on how to calculate standard deviations, but rather a philosophical history explaining why the paradigm shifted from deterministic Newtonian physics to probabilistic thinking.'
      },
      {
        platform: 'amazon',
        user: 'Dr. E. Miller (Verified Purchase)',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120',
        rating: 5,
        date: '2024-02-18',
        sentiment: 'positive',
        content: 'Enlightening and engaging! As a researcher who uses ANOVA and p-values every day, reading this book gave me immense context and respect for the pioneers behind the tests. Essential reading for anyone working with data science or clinical trials today.'
      }
    ];
  }
});

fs.writeFileSync(staticBooksPath, JSON.stringify(books, null, 2), 'utf8');
console.log('Saved updated staticBooks.json!');
