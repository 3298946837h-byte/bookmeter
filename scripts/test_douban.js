const axios = require('axios');

async function testDouban(q) {
  try {
    const res = await axios.get('https://book.douban.com/j/subject_suggest?q=' + encodeURIComponent(q), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 5000
    });
    console.log('Suggestions found:', res.data.length);
    if (res.data.length > 0) {
      const top = res.data[0];
      const pageRes = await axios.get(top.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 5000
      });
      const html = pageRes.data;
      const scoreMatch = html.match(/class="ll rating_num"[^>]*>([0-9\.]+)</) || html.match(/rating_num.*?([0-9\.]+)/);
      const votesMatch = html.match(/property="v:votes">(\d+)</) || html.match(/(\d+)人评价/);
      const introMatch = html.match(/class="intro"[\s\S]*?<p>([\s\S]*?)<\/p>/);
      const cleanIntro = introMatch ? introMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      console.log('Crawled Douban result:', {
        title: top.title,
        author: top.author_name,
        year: top.year,
        cover: top.pic,
        score: scoreMatch ? Number(scoreMatch[1]) : 8.0,
        votes: votesMatch ? Number(votesMatch[1]) : 10000,
        summary: cleanIntro.slice(0, 100)
      });
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testDouban('黑客与画家');
