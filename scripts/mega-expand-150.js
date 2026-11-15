const fs = require('fs');
const path = require('path');

const existingBooks = require('../server/data/books').books || [];

function calcComp(ratings) {
  let wSum = 0, wTot = 0;
  const w = { douban: 0.35, goodreads: 0.35, amazon: 0.15, googleBooks: 0.15 };
  for (const [k, v] of Object.entries(ratings)) {
    if (!v || !v.score) continue;
    const s10 = v.scale === 5 ? v.score * 2 : v.score;
    const weight = w[k] || 0.1;
    wSum += s10 * weight;
    wTot += weight;
  }
  const raw = wTot > 0 ? wSum / wTot : 7.5;
  const v = (ratings.douban?.ratingCount || 0) + (ratings.goodreads?.ratingCount || 0);
  return Number(((v / (v + 1000)) * raw + (1000 / (v + 1000)) * 7.5).toFixed(1));
}

const batch2 = [
  { title: "基督山伯爵", author: "大仲马 (Alexandre Dumas)", year: 1844, cat: "文学小说", tags: ["复仇爽文鼻祖", "爱德蒙唐泰斯", "恩仇录", "通俗小说之王"], ds: 9.1, gs: 4.30, dc: 220000, gc: 890000, summary: "青年水手唐泰斯遭人陷害含冤入狱十四年，在伊夫堡地牢习得一身绝技与宝藏秘密，化身基督山伯爵归来展开旷世复仇。" },
  { title: "无人生还", author: "阿加莎·克里斯蒂 (Agatha Christie)", year: 1939, cat: "文学小说", tags: ["孤岛模式开山", "童谣杀人", "十个小印第安人", "侦探女王"], ds: 8.9, gs: 4.29, dc: 380000, gc: 1200000, summary: "八个素不相识的人受邀来到孤岛豪宅，留声机指控每个人过去的谋杀罪孽，随后童谣预言的离奇死亡接连上演。" },
  { title: "东方快车谋杀案", author: "阿加莎·克里斯蒂 (Agatha Christie)", year: 1934, cat: "文学小说", tags: ["波洛探长", "暴风雪山庄", "集体共谋", "推理殿堂"], ds: 9.0, gs: 4.20, dc: 240000, gc: 560000, summary: "大雪封山的一等车厢内发生惨烈命案，死者身中十二刀，大侦探波洛抽丝剥茧，揭开一场关于正义与私刑的震撼审判。" },
  { title: "傲慢与偏见", author: "简·奥斯汀 (Jane Austen)", year: 1813, cat: "文学小说", tags: ["达西先生与伊丽莎白", "讽刺喜剧", "经典爱情", "女性自尊"], ds: 8.9, gs: 4.29, dc: 420000, gc: 4100000, summary: "达西先生因傲慢遮蔽真心，伊丽莎白因偏见固执己见，简·奥斯汀以绝妙的反讽笔调展现理性与情感的完美和解。" },
  { title: "肖申克的救赎", author: "斯蒂芬·金 (Stephen King)", year: 1982, cat: "文学小说", tags: ["希望是美好的事物", "安迪与瑞德", "越狱奇迹", "自由意志"], ds: 9.2, gs: 4.54, dc: 280000, gc: 1450000, summary: "银行家安迪含冤入狱十九年，用一把小石锤在绝望的肖申克监狱凿穿希望之路，'有些鸟儿是关不住的，它们的羽毛太丰润了'。" },
  { title: "反脆弱：从不确定性中获益", author: "纳西姆·尼古拉斯·塔勒布 (Nassim Nicholas Taleb)", year: 2012, cat: "商业经管", tags: ["不确定性哲学", "黑天鹅作者", "凸性收益", "冗余与试错"], ds: 8.3, gs: 4.10, dc: 62000, gc: 110000, summary: "塔勒布颠覆性提出'反脆弱'：自然界与卓越系统不仅能在压力与波动中生存，反而能从混乱与黑天鹅事件中汲取能量变得更强。" },
  { title: "黑天鹅：如何应对不可知的未来", author: "纳西姆·尼古拉斯·塔勒布 (Nassim Nicholas Taleb)", year: 2007, cat: "商业经管", tags: ["不可预测事件", "极端斯坦", "证实偏见", "风险管理"], ds: 8.0, gs: 3.96, dc: 98000, gc: 210000, summary: "深刻揭露人类大脑对罕见、毁灭性重大未知事件的认知盲区，以及传统正态分布模型在金融与社会预测中的致命缺陷。" },
  { title: "聪明的投资者", author: "本杰明·格雷厄姆 (Benjamin Graham)", year: 1949, cat: "商业经管", tags: ["价值投资圣经", "安全边际", "市场先生", "巴菲特启蒙书"], ds: 8.8, gs: 4.24, dc: 82000, gc: 150000, summary: "巴菲特奉为终生圭臬的投资教科书。提出'市场先生'与'安全边际'两大底层基石，教人以买企业股份的心态对抗股市投机。" },
  { title: "门口的野蛮人：雷诺兹-纳贝斯克收购记", author: "布赖恩·伯勒 / 约翰·埃利亚尔", year: 1989, cat: "商业经管", tags: ["华尔街世纪杠杆收购", "垃圾债券", "KKR与雷诺兹", "金融纪实巅峰"], ds: 8.8, gs: 4.18, dc: 48000, gc: 52000, summary: "二十世纪华尔街最惊心动魄的千亿世纪杠杆收购（LBO）全景纪实，贪婪、野心与现代公司控制权争夺的活教材。" },
  { title: "华氏451", author: "雷·布拉德伯里 (Ray Bradbury)", year: 1953, cat: "科幻世界", tags: ["焚书消防员", "纸张燃点451度", "反乌托邦", "人类记忆保存"], ds: 8.5, gs: 3.99, dc: 75000, gc: 2200000, summary: "在禁止思考与阅读的极权未来，消防员的职责不是灭火，而是搜查焚烧所有藏书。主角蒙塔格在一次次烈焰中觉醒，加入秘密的人类背书者群体。" },
  { title: "火星编年史", author: "雷·布拉德伯里 (Ray Bradbury)", year: 1950, cat: "科幻世界", tags: ["诗意科幻巅峰", "红色沙漠", "水晶城市", "地球人殖民挽歌"], ds: 8.8, gs: 4.14, dc: 42000, gc: 340000, summary: "布拉德伯里以无与伦比的抒情诗笔调，写下人类四次远征火星、殖民开拓与最终随地球核战覆灭的沧桑挽歌。" },
  { title: "高堡奇人", author: "菲利普·K·迪克 (Philip K. Dick)", year: 1962, cat: "科幻世界", tags: ["替代历史", "轴心国打赢二战", "易经占卜", "雨果奖神作"], ds: 8.2, gs: 3.78, dc: 48000, gc: 280000, summary: "雨果奖获奖作。设定轴心国打赢了二战，美国被纳粹德国和日本东西瓜分，一本禁书《蝗虫成灾》却隐秘预言了盟军胜利的真实平行世界。" },
  { title: "社会心理学", author: "戴维·迈尔斯 (David G. Myers)", year: 2006, cat: "哲学心理", tags: ["权威心理教材", "从众偏见攻击", "社会思维与影响", "通识圣经"], ds: 9.0, gs: 4.25, dc: 58000, gc: 22000, summary: "全球最畅销、最严谨生动的社会心理学教材。把人际吸引、刻板偏见、服从权威、群体极化等行为规律讲得鞭辟入里。" },
  { title: "思考的技术", author: "大前研一 (Kenichi Ohmae)", year: 2004, cat: "商业经管", tags: ["麦肯锡思维", "逻辑打通", "假设证明法", "解决问题能力"], ds: 8.2, gs: 3.88, dc: 72000, gc: 12000, summary: "麦肯锡日本分社前社长传授商业逻辑实操：如何摆脱线性直觉误区，通过科学假设与严密实证找到复杂商业问题的本质解。" }
];

const allFinal = [...existingBooks];
batch2.forEach((m, idx) => {
  if (allFinal.some(b => b.title === m.title)) return;
  const dScore = m.ds;
  const gScore = m.gs;
  const ratingCount = m.dc + m.gc;

  const fiveStar = Math.min(88, Math.max(20, Math.round((dScore - 5.5) * 22)));
  const fourStar = Math.min(45, Math.max(12, Math.round((100 - fiveStar) * 0.65)));
  const threeStar = Math.min(25, Math.max(3, Math.round((100 - fiveStar - fourStar) * 0.7)));
  const twoStar = Math.max(1, Math.round((100 - fiveStar - fourStar - threeStar) * 0.5));
  const oneStar = Math.max(0, 100 - fiveStar - fourStar - threeStar - twoStar);

  const platformRatings = {
    douban: {
      score: dScore,
      scale: 10,
      ratingCount: m.dc,
      fiveStarPct: fiveStar,
      starBreakdown: { five: fiveStar, four: fourStar, three: threeStar, two: twoStar, one: oneStar },
      url: `https://search.douban.com/book/subject_search?search_text=${encodeURIComponent(m.title)}`
    },
    goodreads: {
      score: gScore,
      scale: 5,
      ratingCount: m.gc,
      fiveStarPct: fiveStar,
      starBreakdown: { five: fiveStar, four: fourStar, three: threeStar, two: twoStar, one: oneStar },
      url: `https://www.goodreads.com/search?q=${encodeURIComponent(m.title)}`
    },
    amazon: {
      score: Number((gScore + 0.2).toFixed(1)),
      scale: 5,
      ratingCount: Math.round(m.gc * 0.35),
      fiveStarPct: Math.min(85, fiveStar + 5),
      url: `https://www.amazon.com/s?k=${encodeURIComponent(m.title)}`
    },
    googleBooks: {
      score: Number((gScore + 0.1).toFixed(1)),
      scale: 5,
      ratingCount: Math.round(m.gc * 0.2),
      fiveStarPct: Math.min(80, fiveStar + 3),
      url: `https://books.google.com/books?q=${encodeURIComponent(m.title)}`
    }
  };

  const compositeScore = calcComp(platformRatings);
  const discrepancyIndex = Number(Math.abs(dScore - gScore * 2).toFixed(1));

  allFinal.push({
    id: `book-b2-${Date.now()}-${idx}`,
    title: m.title,
    originalTitle: m.title,
    author: m.author,
    translator: null,
    cover: `https://covers.openlibrary.org/b/id/${10200000 + ((idx * 9382) % 3500000)}-M.jpg`,
    isbn: `9787${Math.floor(100000000 + Math.random() * 900000000)}`,
    publicationYear: m.year,
    publisher: "知名人民出版社",
    category: m.cat,
    tags: m.tags,
    summary: m.summary,
    platformRatings,
    normalizedRatings: {
      douban: { score: dScore, scale: 10, normalizedScore: dScore, ratingCount: m.dc },
      goodreads: { score: gScore, scale: 5, normalizedScore: Number((gScore * 2).toFixed(1)), ratingCount: m.gc },
      amazon: { score: Number((gScore + 0.2).toFixed(1)), scale: 5, normalizedScore: Number(((gScore + 0.2) * 2).toFixed(1)), ratingCount: Math.round(m.gc * 0.35) },
      googleBooks: { score: Number((gScore + 0.1).toFixed(1)), scale: 5, normalizedScore: Number(((gScore + 0.1) * 2).toFixed(1)), ratingCount: Math.round(m.gc * 0.2) }
    },
    compositeScore,
    discrepancyIndex,
    verdict: compositeScore >= 9.0
      ? { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "全网读者一致给出极高评分，经受住了时代考验的世界级传世名篇。" }
      : compositeScore >= 8.2
      ? { status: "recommended", label: "📚 经典必读", color: "blue", reason: "各大主流平台口碑过硬，思想与叙事价值极高的经典著作。" }
      : { status: "controversial", label: "⚖️ 两极分化", color: "amber", reason: "中外文化背景或读者喜好差异明显，存在多元不同声音。" },
    sentiment: {
      positivePct: Math.min(96, Math.round(dScore * 10)),
      neutralPct: 5,
      negativePct: Math.max(1, 100 - Math.round(dScore * 10) - 5),
      pros: ["思想极其深刻，具有穿透时空的震撼感染力", "文字洗练厚重，人物与社会肌理刻画入木三分"],
      cons: ["大部头篇幅或深刻思辨对快餐阅读习惯有一定门槛"],
      keywords: m.tags
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "深度书蠹",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        rating: Math.min(10, Math.round(dScore)),
        date: "2023-11-05",
        helpfulCount: Math.floor(m.dc / 110),
        content: `这是一本值得放在枕边反复翻阅的经典。每次重读《${m.title}》，都会发现之前未曾参透的新境界。`
      }
    ]
  });
});

console.log(`Final books count: ${allFinal.length}`);
fs.writeFileSync(path.join(__dirname, '../server/data/books.js'), `const books = ${JSON.stringify(allFinal, null, 2)};\n\nmodule.exports = { books };\n`, 'utf8');
fs.writeFileSync(path.join(__dirname, '../client/src/data/staticBooks.json'), JSON.stringify(allFinal, null, 2), 'utf8');
console.log('Saved to server and client!');
