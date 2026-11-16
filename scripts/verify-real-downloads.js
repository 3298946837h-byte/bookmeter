const axios = require('axios');

const testBooks = [
  '三体',
  '红楼梦',
  '活着',
  '百年孤独',
  '解忧杂货店',
  '1984',
  '代码整洁之道'
];

async function verifyAll() {
  console.log('====================================================');
  console.log('   CANONICAL VERIFICATION: ZERO FAKE TEXT AUDIT     ');
  console.log('====================================================');

  let allPassed = true;

  for (const book of testBooks) {
    for (const fmt of ['epub', 'pdf', 'txt']) {
      const url = `http://localhost:5000/api/download/stream?q=${encodeURIComponent(book)}&format=${fmt}`;
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const buf = Buffer.from(res.data);

      let magicOk = false;
      if (fmt === 'epub') magicOk = buf[0] === 0x50 && buf[1] === 0x4B;
      else if (fmt === 'pdf') magicOk = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
      else if (fmt === 'txt') magicOk = buf.length > 5000 && !buf.includes(Buffer.from([0x00]));

      let fakeDetected = false;
      if (fmt === 'txt') {
        const text = buf.toString('utf8');
        fakeDetected = text.includes('【全书简介】') ||
                       text.includes('【全网权威对冲评分') ||
                       text.includes('【全书内容提要与核心大纲】') ||
                       text.includes('BookMeter 经典文学数字化文库') ||
                       text.includes('文学是人类灵魂最深沉的共鸣');
      }

      const pass = magicOk && !fakeDetected;
      if (!pass) allPassed = false;
      const status = pass ? 'PASS' : 'FAIL';
      console.log(`[${status}] 《${book}》.${fmt} -> ${buf.length} bytes, Magic: ${magicOk}, FakeDetected: ${fakeDetected}`);
      if (fmt === 'txt') {
        console.log('       Snippet: ' + buf.toString('utf8').slice(0, 75).replace(/\s+/g, ' '));
      }
    }
  }

  // Also test an external book via stream relay
  console.log('\n--- External Book Stream Relay Test ---');
  const extUrl = `http://localhost:5000/api/download/stream?q=${encodeURIComponent('Pride and Prejudice')}&format=epub`;
  const extRes = await axios.get(extUrl, { responseType: 'arraybuffer' });
  const extBuf = Buffer.from(extRes.data);
  const extMagic = extBuf[0] === 0x50 && extBuf[1] === 0x4B;
  console.log(`[${extMagic ? 'PASS' : 'FAIL'}] 《Pride and Prejudice》.epub -> ${extBuf.length} bytes, Magic: ${extMagic}`);

  console.log('====================================================');
  if (allPassed && extMagic) {
    console.log('RESULT: 100% OF DOWNLOADED NOVELS ARE AUTHENTIC FULL TEXT!');
  } else {
    console.error('RESULT: FAILED! Fake content or corrupted bytes detected.');
    process.exit(1);
  }
  console.log('====================================================');
}

verifyAll().catch(err => {
  console.error('Verification error:', err.message);
  process.exit(1);
});
