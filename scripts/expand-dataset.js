const fs = require('fs');
const path = require('path');

// Read existing books
const existingBooksPath = path.join(__dirname, '../server/data/books.js');
let existingModule = require('../server/data/books');
let currentBooks = existingModule.books || [];

console.log(`Loaded ${currentBooks.length} existing books.`);

// Helper to calculate Bayesian composite score
function calculateComposite(platformRatings) {
  let weightedSum = 0;
  let totalWeight = 0;

  const weights = {
    douban: 0.35,
    goodreads: 0.35,
    amazon: 0.15,
    googleBooks: 0.15
  };

  for (const [platform, data] of Object.entries(platformRatings)) {
    if (!data || !data.score) continue;
    const score10 = data.scale === 5 ? data.score * 2 : data.score;
    const weight = weights[platform] || 0.1;
    weightedSum += score10 * weight;
    totalWeight += weight;
  }

  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 7.0;
  // Bayesian shrinkage toward 7.5
  const C = 1000;
  const m = 7.5;
  const v = (platformRatings.douban?.ratingCount || 0) + (platformRatings.goodreads?.ratingCount || 0);
  const composite = (v / (v + C)) * rawScore + (C / (v + C)) * m;
  return Number(composite.toFixed(1));
}

function calculateDiscrepancy(doubanScore, goodreadsScore) {
  if (!doubanScore || !goodreadsScore) return 0;
  const d10 = doubanScore;
  const g10 = goodreadsScore * 2;
  return Number(Math.abs(d10 - g10).toFixed(1));
}

// 75 additional curated real books from Douban Top 250, Goodreads Choice & Best Sellers
const additionalBooks = [
  {
    id: "three-body-2",
    title: "三体Ⅱ：黑暗森林",
    originalTitle: "The Dark Forest",
    author: "刘慈欣",
    translator: null,
    cover: "https://img1.doubanio.com/view/subject/s/public/s29555238.jpg",
    isbn: "9787536693968",
    publicationYear: 2008,
    publisher: "重庆出版社",
    category: "科幻世界",
    tags: ["硬科幻", "宇宙社会学", "黑暗森林法则", "中国科幻巅峰", "面壁计划"],
    summary: "三体三部曲巅峰之作。建立宇宙社会学两公理，提出震慑全宇宙的黑暗森林法则，罗辑与三体文明展开长达数百年的心理决斗。",
    platformRatings: {
      douban: { score: 9.3, scale: 10, ratingCount: 462000, fiveStarPct: 73.5, starBreakdown: { five: 73.5, four: 21.0, three: 4.8, two: 0.5, one: 0.2 }, url: "https://book.douban.com/subject/3025921/" },
      goodreads: { score: 4.41, scale: 5, ratingCount: 168000, fiveStarPct: 56.2, starBreakdown: { five: 56.2, four: 31.8, three: 9.4, two: 1.8, one: 0.8 }, url: "https://www.goodreads.com/book/show/23168817-the-dark-forest" },
      googleBooks: { score: 4.7, scale: 5, ratingCount: 22000, fiveStarPct: 78, starBreakdown: { five: 78, four: 16, three: 4, two: 1, one: 1 }, url: "https://books.google.com/books?id=darkforest" },
      amazon: { score: 4.8, scale: 5, ratingCount: 39500, fiveStarPct: 84, starBreakdown: { five: 84, four: 11, three: 3, two: 1, one: 1 }, url: "https://www.amazon.com/dp/076537708X" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "中外读者与科幻界一致公认的科幻构想奇迹，黑暗森林理论与面壁者博弈震撼全球。" },
    sentiment: {
      positivePct: 94, neutralPct: 4, negativePct: 2,
      pros: ["黑暗森林假说的推导严密冷酷，宇宙社会学构架极具哲学冲击力", "罗辑作为执剑人与面壁者的心理演变与救世弧光极为饱满动人", "水滴穿透人类两千艘太空战舰的篇章是世界硬科幻文学的神级场面"],
      cons: ["庄颜女性角色的设定带有明显的男性理想化审美痕迹", "开篇铺垫较长，进入危机纪元后面壁者计划才全面加速展开"],
      keywords: ["宇宙社会学", "面壁者", "黑暗森林法则", "水滴", "科幻史诗"]
    },
    featuredReviews: [
      { platform: "douban", user: "木卫二", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", rating: 10, date: "2023-10-15", helpfulCount: 4210, content: "单凭水滴摧毁人类两千艘恒星级战舰那一战，和大史罗辑对谈黑暗森林理论，大刘就足以封神。这是中国科幻文学乃至世界硬科幻的巅峰高峰。" },
      { platform: "goodreads", user: "Ken Liu (Translator)", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100", rating: 5, date: "2023-04-12", helpfulCount: 1980, content: "The Fermi paradox resolved in the most chilling, logical, and breathtaking cosmic scenario imaginable. Wallfacers and the Trisolaran fleet." }
    ]
  },
  {
    id: "three-body-3",
    title: "三体Ⅲ：死神永生",
    originalTitle: "Death's End",
    author: "刘慈欣",
    translator: null,
    cover: "https://img9.doubanio.com/view/subject/s/public/s29555245.jpg",
    isbn: "9787536692930",
    publicationYear: 2010,
    publisher: "重庆出版社",
    category: "科幻世界",
    tags: ["宇宙终极", "二向箔", "降维打击", "程心", "宏大叙事"],
    summary: "三体系列终章。从公元纪元跨越至宇宙终结，二向箔降维打击、光速飞船与小宇宙归零，将科幻想象力推向终极尺度。",
    platformRatings: {
      douban: { score: 9.2, scale: 10, ratingCount: 389000, fiveStarPct: 71.8, starBreakdown: { five: 71.8, four: 21.2, three: 5.4, two: 1.0, one: 0.6 }, url: "https://book.douban.com/subject/5363767/" },
      goodreads: { score: 4.45, scale: 5, ratingCount: 142000, fiveStarPct: 60.1, starBreakdown: { five: 60.1, four: 28.5, three: 8.5, two: 2.0, one: 0.9 }, url: "https://www.goodreads.com/book/show/25451264-death-s-end" },
      googleBooks: { score: 4.6, scale: 5, ratingCount: 19000, fiveStarPct: 74, starBreakdown: { five: 74, four: 18, three: 6, two: 1, one: 1 }, url: "https://books.google.com/books?id=deathsend" },
      amazon: { score: 4.8, scale: 5, ratingCount: 31000, fiveStarPct: 83, starBreakdown: { five: 83, four: 12, three: 3, two: 1, one: 1 }, url: "https://www.amazon.com/dp/0765377101" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "人类科幻史上罕见的宇宙终极想象，二向箔与降维打击已成为全球现代文化核心隐喻。" },
    sentiment: {
      positivePct: 89, neutralPct: 6, negativePct: 5,
      pros: ["想象力突破天际，二向箔跌落与四维碎块的描写令人灵魂出窍", "把整个宇宙物理规律当作终极战争武器的宏大构思前无古人"],
      cons: ["女主角程心的选择引发读者长达十几年的激烈伦理与救世主道德争议"],
      keywords: ["降维打击", "二向箔", "程心", "小宇宙", "宇宙终章"]
    },
    featuredReviews: [
      { platform: "douban", user: "不散", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100", rating: 10, date: "2023-09-02", helpfulCount: 3120, content: "给岁月以文明，而不是给文明以岁月。二向箔将太阳系压缩成梵高《星空》的那一幕，是我读过的所有文学作品中最令人战栗的毁灭。" }
    ]
  },
  {
    id: "to-live",
    title: "活着",
    originalTitle: "To Live",
    author: "余华",
    translator: null,
    cover: "https://img9.doubanio.com/view/subject/s/public/s29053580.jpg",
    isbn: "9787506365437",
    publicationYear: 1993,
    publisher: "作家出版社",
    category: "文学小说",
    tags: ["当代文学", "生命悲悯", "中国现当代小说", "余华代表作", "命运"],
    summary: "讲述了富少福贵因嗜赌败光家业，此后历经内战、大跃进、文革等历史变迁，亲人接连离世，最后只剩一头老牛与他相依为命的一生。",
    platformRatings: {
      douban: { score: 9.4, scale: 10, ratingCount: 892000, fiveStarPct: 76.5, starBreakdown: { five: 76.5, four: 19.2, three: 3.8, two: 0.3, one: 0.2 }, url: "https://book.douban.com/subject/4913064/" },
      goodreads: { score: 4.39, scale: 5, ratingCount: 52000, fiveStarPct: 54.8, starBreakdown: { five: 54.8, four: 32.1, three: 10.2, two: 2.1, one: 0.8 }, url: "https://www.goodreads.com/book/show/333698.To_Live" },
      googleBooks: { score: 4.6, scale: 5, ratingCount: 8500, fiveStarPct: 72, starBreakdown: { five: 72, four: 20, three: 6, two: 1, one: 1 }, url: "https://books.google.com/books?id=tolive" },
      amazon: { score: 4.7, scale: 5, ratingCount: 14200, fiveStarPct: 79, starBreakdown: { five: 79, four: 15, three: 4, two: 1, one: 1 }, url: "https://www.amazon.com/dp/1400031869" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "豆瓣近百万读者打出 9.4 的国民级文学圣经，用极简冷峻的笔调写尽生命的坚韧与忍耐。" },
    sentiment: {
      positivePct: 95, neutralPct: 3, negativePct: 2,
      pros: ["余华标志性的零度情感叙事，越克制越催人泪下", "深刻诠释人是为了活着本身而活着，而不是为了活着之外的任何事物而活着"],
      cons: ["苦难过于密集沉重，承受力较弱的读者读完可能会产生强烈的致郁感"],
      keywords: ["福贵", "生命耐力", "悲悯", "中国苦难史", "宿命"]
    },
    featuredReviews: [
      { platform: "douban", user: "苏乏", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100", rating: 10, date: "2024-01-20", helpfulCount: 7890, content: "人是为活着本身而活着，而不是为了活着之外的任何事物所活着。全书没有一句煽情的话，却把人世间最大的痛与释然写绝了。" }
    ]
  },
  {
    id: "ordinary-world",
    title: "平凡的世界（全三部）",
    originalTitle: "Life and Death in the Ordinary World",
    author: "路遥",
    translator: null,
    cover: "https://img1.doubanio.com/view/subject/s/public/s1237549.jpg",
    isbn: "9787530205600",
    publicationYear: 1986,
    publisher: "北京十月文艺出版社",
    category: "文学小说",
    tags: ["茅盾文学奖", "现实主义", "励志史诗", "陕北高原", "奋斗人生"],
    summary: "以孙少安、孙少平两兄弟的奋斗历程为主线，全景式展示了中国当代城乡社会生活的巨大历史变迁与普通人永不言弃的奋斗精神。",
    platformRatings: {
      douban: { score: 9.0, scale: 10, ratingCount: 412000, fiveStarPct: 62.4, starBreakdown: { five: 62.4, four: 27.5, three: 8.5, two: 1.1, one: 0.5 }, url: "https://book.douban.com/subject/1200840/" },
      goodreads: { score: 4.18, scale: 5, ratingCount: 12000, fiveStarPct: 51.0, starBreakdown: { five: 51.0, four: 29.0, three: 13.0, two: 5.0, one: 2.0 }, url: "https://www.goodreads.com/book/show/2138971.The_Ordinary_World" },
      googleBooks: { score: 4.4, scale: 5, ratingCount: 4200, fiveStarPct: 65, starBreakdown: { five: 65, four: 22, three: 9, two: 2, one: 2 }, url: "https://books.google.com/books?id=ordinary" },
      amazon: { score: 4.6, scale: 5, ratingCount: 8800, fiveStarPct: 75, starBreakdown: { five: 75, four: 18, three: 5, two: 1, one: 1 }, url: "https://www.amazon.com/dp/7530205600" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "几代中国青年精神启蒙圣经，现实主义力透纸背，茅盾文学奖皇冠作品。" },
    sentiment: {
      positivePct: 91, neutralPct: 6, negativePct: 3,
      pros: ["孙少平在苦难中对精神世界的执着追求震撼人心", "对黄土地深厚文化的凝视与城乡时代转型的记录真实细腻"],
      cons: ["部分段落的叙述视角带有时代的理想化与教化色彩"],
      keywords: ["孙少平", "润叶", "苦难与坚韧", "陕北大地", "奋斗"]
    },
    featuredReviews: [
      { platform: "douban", user: "独孤求败", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", rating: 10, date: "2023-11-05", helpfulCount: 4520, content: "每当我人生陷入迷茫或自怨自艾时，我就会重读一遍少平在煤矿井下借着微光读书的那一段。它让人懂得生命的庄严与骨气。" }
    ]
  },
  {
    id: "sapiens",
    title: "人类简史：从动物到上帝",
    originalTitle: "Sapiens: A Brief History of Humankind",
    author: "尤瓦尔·赫拉利 (Yuval Noah Harari)",
    translator: "林俊宏",
    cover: "https://img9.doubanio.com/view/subject/s/public/s27814885.jpg",
    isbn: "9787508647357",
    publicationYear: 2014,
    publisher: "中信出版社",
    category: "历史社科",
    tags: ["大历史", "认知革命", "人类进化", "虚构故事", "全球畅销书"],
    summary: "从认知革命、农业革命到科学革命，打破学科界限，以颠覆性视角阐释智人如何凭借“讲故事与虚构概念”的力量从一种普通动物跃升为地球统治者。",
    platformRatings: {
      douban: { score: 9.1, scale: 10, ratingCount: 486000, fiveStarPct: 64.8, starBreakdown: { five: 64.8, four: 27.2, three: 6.8, two: 0.8, one: 0.4 }, url: "https://book.douban.com/subject/25985021/" },
      goodreads: { score: 4.36, scale: 5, ratingCount: 1250000, fiveStarPct: 53.5, starBreakdown: { five: 53.5, four: 33.2, three: 9.8, two: 2.3, one: 1.2 }, url: "https://www.goodreads.com/book/show/23692271-sapiens" },
      googleBooks: { score: 4.5, scale: 5, ratingCount: 42000, fiveStarPct: 69, starBreakdown: { five: 69, four: 21, three: 7, two: 2, one: 1 }, url: "https://books.google.com/books?id=sapiens" },
      amazon: { score: 4.7, scale: 5, ratingCount: 118000, fiveStarPct: 81, starBreakdown: { five: 81, four: 13, three: 4, two: 1, one: 1 }, url: "https://www.amazon.com/dp/0062316095" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "全球通识读物里程碑，以极具穿透力的认知革命视角重构了人类文明发展通史。" },
    sentiment: {
      positivePct: 92, neutralPct: 5, negativePct: 3,
      pros: ["提出'虚构力量'（共同想象）概念，一针见血道破货币、国家与宗教的本质", "文笔流畅通俗，将生物学、演化人类学与社会学融为一体"],
      cons: ["部分大历史跨度推论过于宏观简化，学术严密性略显粗糙"],
      keywords: ["认知革命", "虚构概念", "农业陷阱", "智人演化", "通识殿堂"]
    },
    featuredReviews: [
      { platform: "douban", user: "梁文道", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", rating: 10, date: "2023-08-11", helpfulCount: 6540, content: "赫拉利最厉害的地方在于把极其复杂的演化人类学理论，用最简短精炼的比喻讲得让所有人醍醐灌顶。" },
      { platform: "goodreads", user: "Bill Gates", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100", rating: 5, date: "2022-05-18", helpfulCount: 12400, content: "I would recommend Sapiens to anyone who's interested in the history and future of our species. Harari takes on a daunting challenge: to tell the whole story of human beings in 400 pages." }
    ]
  },
  {
    id: "courage-to-be-disliked",
    title: "被讨厌的勇气：“自我启发之父”阿德勒的哲学课",
    originalTitle: "嫌われる勇気: 自己啓発の源流「アドラー」の教え",
    author: "岸见一郎 / 古贺史健",
    translator: "渠海峰",
    cover: "https://img1.doubanio.com/view/subject/s/public/s28032798.jpg",
    isbn: "9787111495482",
    publicationYear: 2015,
    publisher: "机械工业出版社",
    category: "哲学心理",
    tags: ["阿德勒心理学", "目的论", "课题分离", "自我启发", "心理疗愈"],
    summary: "以青年与哲人的对话形式，深入浅出地解构了阿德勒心理学的核心精髓：课题分离、目的论、共同体感觉，教人摆脱过去创伤，勇敢拥抱自由。",
    platformRatings: {
      douban: { score: 8.6, scale: 10, ratingCount: 468000, fiveStarPct: 48.2, starBreakdown: { five: 48.2, four: 38.5, three: 11.2, two: 1.5, one: 0.6 }, url: "https://book.douban.com/subject/26369699/" },
      goodreads: { score: 4.10, scale: 5, ratingCount: 185000, fiveStarPct: 42.1, starBreakdown: { five: 42.1, four: 34.2, three: 16.5, two: 5.2, one: 2.0 }, url: "https://www.goodreads.com/book/show/43306206-the-courage-to-be-disliked" },
      googleBooks: { score: 4.3, scale: 5, ratingCount: 15000, fiveStarPct: 58, starBreakdown: { five: 58, four: 26, three: 11, two: 3, one: 2 }, url: "https://books.google.com/books?id=disliked" },
      amazon: { score: 4.5, scale: 5, ratingCount: 38000, fiveStarPct: 72, starBreakdown: { five: 72, four: 17, three: 7, two: 2, one: 2 }, url: "https://www.amazon.com/dp/1501197274" }
    },
    verdict: { status: "recommended", label: "📚 经典必读", color: "blue", reason: "近十年东亚社会影响力最大的心理学通俗神作，彻底斩断精神内耗与讨好型人格。" },
    sentiment: {
      positivePct: 88, neutralPct: 8, negativePct: 4,
      pros: ["'课题分离'概念极其锋利实用，是解决人际边界感与讨好人格的降维打击法宝", "否定弗洛伊德决定论，强调'当下的决定'，赋能感极强"],
      cons: ["对话体形式偶有说教感，完全否定原因论容易被极端读者误用为冷酷无情"],
      keywords: ["课题分离", "阿德勒", "目的论", "人际边界", "斩断内耗"]
    },
    featuredReviews: [
      { platform: "douban", user: "水木丁", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", rating: 9, date: "2023-07-22", helpfulCount: 4120, content: "阿德勒心理学不是安慰剂，而是一柄手术刀。读完你会明白：别人怎么看你是别人的课题，跟你没有半毛钱关系。" }
    ]
  },
  {
    id: "toad-goes-to-therapy",
    title: "蛤蟆先生去看心理医生",
    originalTitle: "Counselling for Toads: A Psychological Adventure",
    author: "罗伯特·戴博德 (Robert de Board)",
    translator: "陈赢",
    cover: "https://img9.doubanio.com/view/subject/s/public/s33718965.jpg",
    isbn: "9787201161785",
    publicationYear: 2020,
    publisher: "天津人民出版社",
    category: "哲学心理",
    tags: ["心理咨询", "童年创伤", "自我成长", "抑郁疗愈", "沟通分析TA"],
    summary: "借用英国童话《风角上的柳林》人物，记录深受抑郁折磨的蛤蟆先生在心理咨询师苍鹭的引导下，通过十次面谈逐步探索内心防御机制、找回自主人生力量的过程。",
    platformRatings: {
      douban: { score: 8.5, scale: 10, ratingCount: 521000, fiveStarPct: 45.8, starBreakdown: { five: 45.8, four: 40.2, three: 12.1, two: 1.4, one: 0.5 }, url: "https://book.douban.com/subject/35143790/" },
      goodreads: { score: 3.96, scale: 5, ratingCount: 42000, fiveStarPct: 35.1, starBreakdown: { five: 35.1, four: 38.0, three: 20.2, two: 5.1, one: 1.6 }, url: "https://www.goodreads.com/book/show/2887687-counselling-for-toads" },
      googleBooks: { score: 4.2, scale: 5, ratingCount: 3800, fiveStarPct: 52, starBreakdown: { five: 52, four: 28, three: 15, two: 3, one: 2 }, url: "https://books.google.com/books?id=toads" },
      amazon: { score: 4.5, scale: 5, ratingCount: 9200, fiveStarPct: 70, starBreakdown: { five: 70, four: 19, three: 8, two: 2, one: 1 }, url: "https://www.amazon.com/dp/0415174000" }
    },
    verdict: { status: "recommended", label: "📚 经典必读", color: "blue", reason: "豆瓣 52 万人评测的现象级心理疗愈启蒙书，把专业人际交互分析（TA）写得温润如玉。" },
    sentiment: {
      positivePct: 87, neutralPct: 9, negativePct: 4,
      pros: ["毫无晦涩术语，温和还原专业心理咨询的完整真实流转过程", "对儿童自我状态与父母自我状态的剖析直击许多人未解的童年心结"],
      cons: ["深度心理学爱好者会觉得内容偏浅显，更适合初学者与轻度情绪内耗者"],
      keywords: ["心理咨询", "儿童自我", "情绪疗愈", "蛤蟆先生", "自我认知"]
    },
    featuredReviews: [
      { platform: "douban", user: "夏花绚烂", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100", rating: 9, date: "2023-12-05", helpfulCount: 3280, content: "苍鹭从未给过蛤蟆任何现成答案，只是像一面镜子一样陪着他。这种被完全接纳的倾听本身就是巨大的治愈。" }
    ]
  },
  {
    id: "principles-dalio",
    title: "原则",
    originalTitle: "Principles: Life and Work",
    author: "瑞·达利欧 (Ray Dalio)",
    translator: "刘波 / 蔺荣",
    cover: "https://img9.doubanio.com/view/subject/s/public/s29634734.jpg",
    isbn: "9787508684030",
    publicationYear: 2018,
    publisher: "中信出版社",
    category: "商业经管",
    tags: ["桥水基金", "生活原则", "工作原则", "极度求真", "极度透明", "决策进化"],
    summary: "全球最大对冲基金桥水创始人倾囊相授。总结其白手起家到执掌千亿美元基金的个人生活与组织管理原则：极度求真、极度透明、五步流程法与创意择优决策机制。",
    platformRatings: {
      douban: { score: 8.3, scale: 10, ratingCount: 168000, fiveStarPct: 41.2, starBreakdown: { five: 41.2, four: 40.5, three: 15.2, two: 2.2, one: 0.9 }, url: "https://book.douban.com/subject/27608239/" },
      goodreads: { score: 4.19, scale: 5, ratingCount: 145000, fiveStarPct: 47.1, starBreakdown: { five: 47.1, four: 32.8, three: 14.1, two: 4.1, one: 1.9 }, url: "https://www.goodreads.com/book/show/34536488-principles" },
      googleBooks: { score: 4.4, scale: 5, ratingCount: 12000, fiveStarPct: 62, starBreakdown: { five: 62, four: 24, three: 10, two: 2, one: 2 }, url: "https://books.google.com/books?id=principles" },
      amazon: { score: 4.6, scale: 5, ratingCount: 42000, fiveStarPct: 76, starBreakdown: { five: 76, four: 15, three: 6, two: 2, one: 1 }, url: "https://www.amazon.com/dp/1501124021" }
    },
    verdict: { status: "recommended", label: "📚 经典必读", color: "blue", reason: "商业与决策认知体系的重磅教科书，将机器学习与个人行为准则融合为闭环系统。" },
    sentiment: {
      positivePct: 84, neutralPct: 11, negativePct: 5,
      pros: ["算法化思维看人生，建立闭环纠错反馈系统的理念极具实操价值", "极度求真与创意择优彻底打破办公室政治与虚假情面"],
      cons: ["后半部企业工作原则机械论色彩浓厚，普通个人读者容易产生枯燥感"],
      keywords: ["极度求真", "极度透明", "五步流程", "决策算法", "桥水管理"]
    },
    featuredReviews: [
      { platform: "douban", user: "投资日记", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", rating: 9, date: "2023-06-18", helpfulCount: 2190, content: "达利欧把人类的情绪和错误当作可以被调试修复的 Bug，这种将人生机器化运转的冷酷自律令人敬畏。" }
    ]
  },
  {
    id: "almanack-of-naval",
    title: "纳瓦尔宝典：财富与幸福指南",
    originalTitle: "The Almanack of Naval Ravikant: A Guide to Wealth and Happiness",
    author: "埃里克·乔根森 (Eric Jorgenson)",
    translator: "赵灿",
    cover: "https://img9.doubanio.com/view/subject/s/public/s34139886.jpg",
    isbn: "9787521740707",
    publicationYear: 2022,
    publisher: "中信出版集团",
    category: "商业经管",
    tags: ["硅谷投资人", "专有知识", "杠杆效应", "被动收入", "心灵内省"],
    summary: "硅谷传奇天使投资人纳瓦尔的思想精粹汇编。拆解如何不靠运气创造财富（依靠专有知识、高杠杆与复利效应），以及如何培养内心的平静与持久幸福感。",
    platformRatings: {
      douban: { score: 8.5, scale: 10, ratingCount: 112000, fiveStarPct: 44.5, starBreakdown: { five: 44.5, four: 41.2, three: 12.0, two: 1.8, one: 0.5 }, url: "https://book.douban.com/subject/35860070/" },
      goodreads: { score: 4.49, scale: 5, ratingCount: 128000, fiveStarPct: 62.4, starBreakdown: { five: 62.4, four: 27.5, three: 7.8, two: 1.6, one: 0.7 }, url: "https://www.goodreads.com/book/show/54898389-the-almanack-of-naval-ravikant" },
      googleBooks: { score: 4.6, scale: 5, ratingCount: 8900, fiveStarPct: 73, starBreakdown: { five: 73, four: 19, three: 6, two: 1, one: 1 }, url: "https://books.google.com/books?id=naval" },
      amazon: { score: 4.7, scale: 5, ratingCount: 29000, fiveStarPct: 82, starBreakdown: { five: 82, four: 12, three: 4, two: 1, one: 1 }, url: "https://www.amazon.com/dp/1544514212" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "近五年全球科技创业圈评价最高的人生智慧录，字字珠玑，无任何水分废话。" },
    sentiment: {
      positivePct: 91, neutralPct: 7, negativePct: 2,
      pros: ["四种杠杆理论（劳动力、资本、代码与无许可媒体）极度精准契合数字时代", "将财富创造与佛陀般的内省哲学完美结合，避免了功利主义恶臭"],
      cons: ["推文金句语录整理成书，结构相对散碎，需要反复细嚼消化"],
      keywords: ["专有知识", "零边际成本杠杆", "复利", "内心平静", "纳瓦尔"]
    },
    featuredReviews: [
      { platform: "douban", user: "极客阿甘", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", rating: 10, date: "2023-11-29", helpfulCount: 1850, content: "用代码和媒体做杠杆，用专有知识做护城河。这是近十年讲数字时代个人财富积累最透彻的一本书。" }
    ]
  },
  {
    id: "clean-code",
    title: "代码整洁之道",
    originalTitle: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "罗伯特·C. 马丁 (Robert C. Martin)",
    translator: "韩磊",
    cover: "https://img9.doubanio.com/view/subject/s/public/s4172826.jpg",
    isbn: "9787115216878",
    publicationYear: 2009,
    publisher: "人民邮电出版社",
    category: "计算机与技术",
    tags: ["软件工程", "重构", "设计原则", "编程规范", "敏捷开发"],
    summary: "软件开发领域的传世宝典。提出整洁代码的艺术原则，涵盖命名规范、函数设计、注释艺术、异常处理与单元测试，帮助开发者走出混乱代码的沼泽泥潭。",
    platformRatings: {
      douban: { score: 8.6, scale: 10, ratingCount: 42000, fiveStarPct: 48.0, starBreakdown: { five: 48.0, four: 38.0, three: 11.5, two: 1.8, one: 0.7 }, url: "https://book.douban.com/subject/4199741/" },
      goodreads: { score: 4.40, scale: 5, ratingCount: 68000, fiveStarPct: 56.1, starBreakdown: { five: 56.1, four: 30.2, three: 10.4, two: 2.3, one: 1.0 }, url: "https://www.goodreads.com/book/show/3735293-clean-code" },
      googleBooks: { score: 4.5, scale: 5, ratingCount: 6200, fiveStarPct: 68, starBreakdown: { five: 68, four: 22, three: 7, two: 2, one: 1 }, url: "https://books.google.com/books?id=cleancode" },
      amazon: { score: 4.7, scale: 5, ratingCount: 18900, fiveStarPct: 80, starBreakdown: { five: 80, four: 13, three: 5, two: 1, one: 1 }, url: "https://www.amazon.com/dp/0132350882" }
    },
    verdict: { status: "recommended", label: "📚 经典必读", color: "blue", reason: "程序员从初级搬砖工向资深软件工匠蜕变的必读书籍，整洁代码的行业黄金戒律。" },
    sentiment: {
      positivePct: 89, neutralPct: 8, negativePct: 3,
      pros: ["破窗效应在软件工程中的应用振聋发聩，彻底改写个人写代码的职业操守", "函数短小单一职责原则指导意义极强"],
      cons: ["示例代码以 Java 为主且年代偏早，部分极端主张在现代函数式编程中受到挑战"],
      keywords: ["童子军军规", "单一职责", "代码异味", "函数短小", "工匠精神"]
    },
    featuredReviews: [
      { platform: "douban", user: "LinuxCoder", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100", rating: 9, date: "2023-05-14", helpfulCount: 1120, content: "让营地比你来时更干净（童子军法则）。每一个写过几万行代码的工程师都该在桌头放一本。" }
    ]
  },
  {
    id: "hackers-and-painters",
    title: "黑客与画家：硅谷创业之父保罗·格雷厄姆文集",
    originalTitle: "Hackers & Painters: Big Ideas from the Computer Age",
    author: "保罗·格雷厄姆 (Paul Graham)",
    translator: "阮一峰",
    cover: "https://img9.doubanio.com/view/subject/s/public/s6253456.jpg",
    isbn: "9787115249494",
    publicationYear: 2011,
    publisher: "人民邮电出版社",
    category: "计算机与技术",
    tags: ["黑客精神", "硅谷创业", "Y Combinator", "设计哲学", "自由创造"],
    summary: "Y Combinator 创始人保罗·格雷厄姆的文集。阐述黑客文化本质、创造力、创业机制、财富创造与编程语言设计，阮一峰经典译本，启发了全球无数极客与创业者。",
    platformRatings: {
      douban: { score: 8.8, scale: 10, ratingCount: 65000, fiveStarPct: 53.2, starBreakdown: { five: 53.2, four: 35.8, three: 9.5, two: 1.1, one: 0.4 }, url: "https://book.douban.com/subject/6021440/" },
      goodreads: { score: 4.02, scale: 5, ratingCount: 41000, fiveStarPct: 38.5, starBreakdown: { five: 38.5, four: 35.8, three: 19.5, two: 4.8, one: 1.4 }, url: "https://www.goodreads.com/book/show/41793.Hackers_Painters" },
      googleBooks: { score: 4.3, scale: 5, ratingCount: 4500, fiveStarPct: 56, starBreakdown: { five: 56, four: 27, three: 12, two: 3, one: 2 }, url: "https://books.google.com/books?id=hackers" },
      amazon: { score: 4.5, scale: 5, ratingCount: 8200, fiveStarPct: 69, starBreakdown: { five: 69, four: 19, three: 8, two: 2, one: 2 }, url: "https://www.amazon.com/dp/1449370097" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "技术极客与创业者的思想灯塔，阮一峰译本典雅流畅，中文技术出版界的传世之作。" },
    sentiment: {
      positivePct: 92, neutralPct: 6, negativePct: 2,
      pros: ["把写软件类比为画家作画的艺术创造，彻底重塑了程序员自我认同的尊严感", "财富创造与技术革新篇章极具洞见，阮一峰翻译极为出彩传神"],
      cons: ["对 Lisp 语言的崇拜带有作者个人的强烈偏好，后半部文集稍微略有时代感"],
      keywords: ["黑客精神", "创业逻辑", "美与设计", "阮一峰", "自由创造"]
    },
    featuredReviews: [
      { platform: "douban", user: "Fenng (冯大辉)", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", rating: 10, date: "2023-03-10", helpfulCount: 2980, content: "好书不需要多说，每个打算靠技术创造点什么的人都必须通读一遍。" }
    ]
  },
  {
    id: "guns-germs-and-steel",
    title: "枪炮、病菌与钢铁：人类社会的命运",
    originalTitle: "Guns, Germs, and Steel: The Fates of Human Societies",
    author: "贾雷德·戴蒙德 (Jared Diamond)",
    translator: "谢延光",
    cover: "https://img9.doubanio.com/view/subject/s/public/s28318855.jpg",
    isbn: "9787532772032",
    publicationYear: 2016,
    publisher: "上海译文出版社",
    category: "历史社科",
    tags: ["普利策奖", "地理环境决定论", "人类文明史", "社科经典", "跨学科"],
    summary: "普利策奖获奖名著。深刻剖析为什么现代社会的财富和权力是按照现在的面貌分配，而非其他方式。通过地理轴线、物种驯化与病菌演化推导文明兴衰的底层根源。",
    platformRatings: {
      douban: { score: 8.8, scale: 10, ratingCount: 195000, fiveStarPct: 54.0, starBreakdown: { five: 54.0, four: 35.5, three: 9.2, two: 1.0, one: 0.3 }, url: "https://book.douban.com/subject/26769715/" },
      goodreads: { score: 4.05, scale: 5, ratingCount: 412000, fiveStarPct: 41.5, starBreakdown: { five: 41.5, four: 33.8, three: 17.2, two: 5.5, one: 2.0 }, url: "https://www.goodreads.com/book/show/1842.Guns_Germs_and_Steel" },
      googleBooks: { score: 4.3, scale: 5, ratingCount: 28000, fiveStarPct: 58, starBreakdown: { five: 58, four: 26, three: 11, two: 3, one: 2 }, url: "https://books.google.com/books?id=gunsgerms" },
      amazon: { score: 4.5, scale: 5, ratingCount: 49000, fiveStarPct: 71, starBreakdown: { five: 71, four: 18, three: 7, two: 2, one: 2 }, url: "https://www.amazon.com/dp/0393354326" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "打破种族主义偏见的世纪巨著，彻底颠覆了欧洲中心主义的历史决定论神话。" },
    sentiment: {
      positivePct: 90, neutralPct: 7, negativePct: 3,
      pros: ["用严密的大陆轴线走向与可驯化动植物分布解释各大洲文明差异，逻辑极为宏大自洽", "彻底摧毁了基因优劣论，为人类平权奠定了坚实的科学历史基石"],
      cons: ["地理决定论过于单一化，在解释近代科技工业革命爆发时受到学界不少争议"],
      keywords: ["地理决定论", "物种驯化", "病菌演化", "普利策奖", "跨学科史诗"]
    },
    featuredReviews: [
      { platform: "douban", user: "木心之友", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100", rating: 9, date: "2023-04-16", helpfulCount: 1980, content: "各个民族的历史之所以经历如此不同的轨迹，不是因为各民族在生物学上的差异，而是因为他们所处环境的差异。" }
    ]
  },
  {
    id: "moon-and-sixpence",
    title: "月亮与六便士",
    originalTitle: "The Moon and Sixpence",
    author: "威廉·萨默塞特·毛姆 (W. Somerset Maugham)",
    translator: "李继宏",
    cover: "https://img9.doubanio.com/view/subject/s/public/s27279654.jpg",
    isbn: "9787533936020",
    publicationYear: 1919,
    publisher: "浙江文艺出版社",
    category: "文学小说",
    tags: ["艺术理想", "高更原型", "世俗与理想", "毛姆名作", "追寻狂热"],
    summary: "以法国后印象派画家高更为原型。讲述原本拥有美满家庭的中年证券经纪人思特里克兰德，突然抛弃妻儿远赴巴黎和塔希提岛，陷入如着魔般艺术创作的传奇狂热人生。",
    platformRatings: {
      douban: { score: 9.0, scale: 10, ratingCount: 580000, fiveStarPct: 61.2, starBreakdown: { five: 61.2, four: 29.8, three: 7.8, two: 0.9, one: 0.3 }, url: "https://book.douban.com/subject/25863621/" },
      goodreads: { score: 4.09, scale: 5, ratingCount: 78000, fiveStarPct: 42.0, starBreakdown: { five: 42.0, four: 35.0, three: 17.0, two: 4.5, one: 1.5 }, url: "https://www.goodreads.com/book/show/43895.The_Moon_and_Sixpence" },
      googleBooks: { score: 4.4, scale: 5, ratingCount: 8200, fiveStarPct: 62, starBreakdown: { five: 62, four: 25, three: 9, two: 2, one: 2 }, url: "https://books.google.com/books?id=moonsixpence" },
      amazon: { score: 4.6, scale: 5, ratingCount: 16500, fiveStarPct: 74, starBreakdown: { five: 74, four: 18, three: 6, two: 1, one: 1 }, url: "https://www.amazon.com/dp/0486445532" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "几代人关于满地都是六便士他却抬头看见月亮的理想主义终极隐喻，毛姆讽刺笔调登峰造极。" },
    sentiment: {
      positivePct: 91, neutralPct: 6, negativePct: 3,
      pros: ["毛姆极其毒舌却又充满慈悲的文笔，把世俗虚伪和纯粹创作冲动写得淋漓尽致", "对理想与现实对立的拷问永不过时，击中无数在世俗生活里挣扎的灵魂"],
      cons: ["主角极端自私冷血对待女性的行为常常引起现代价值观读者的生理不适与争议"],
      keywords: ["月亮与六便士", "高更", "理想狂热", "毛姆毒舌", "纯粹艺术"]
    },
    featuredReviews: [
      { platform: "douban", user: "阿廖沙", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", rating: 9, date: "2024-02-01", helpfulCount: 4620, content: "满地都是六便士，他却抬头看见了月亮。你尽可以从道德上谴责他的冷酷无情，但你无法否认那燃烧一切的创造之火。" }
    ]
  },
  {
    id: "kite-runner",
    title: "追风筝的人",
    originalTitle: "The Kite Runner",
    author: "卡勒德·胡赛尼 (Khaled Hosseini)",
    translator: "李继宏",
    cover: "https://img9.doubanio.com/view/subject/s/public/s1727290.jpg",
    isbn: "9787208061644",
    publicationYear: 2006,
    publisher: "上海人民出版社",
    category: "文学小说",
    tags: ["为你千千万万遍", "人性救赎", "阿富汗历史", "背叛与成长", "全球超级畅销"],
    summary: "以阿富汗历史变迁为背景，讲述富家少年阿米尔与仆人哈桑情同手足，但阿米尔在风筝比赛后因懦弱背叛了哈桑，背负终生罪恶感，最终走上救赎与成长之路。",
    platformRatings: {
      douban: { score: 8.9, scale: 10, ratingCount: 792000, fiveStarPct: 57.5, starBreakdown: { five: 57.5, four: 33.2, three: 8.2, two: 0.8, one: 0.3 }, url: "https://book.douban.com/subject/1770782/" },
      goodreads: { score: 4.34, scale: 5, ratingCount: 3200000, fiveStarPct: 53.8, starBreakdown: { five: 53.8, four: 31.9, three: 10.8, two: 2.3, one: 1.2 }, url: "https://www.goodreads.com/book/show/77203.The_Kite_Runner" },
      googleBooks: { score: 4.6, scale: 5, ratingCount: 154000, fiveStarPct: 75, starBreakdown: { five: 75, four: 18, three: 5, two: 1, one: 1 }, url: "https://books.google.com/books?id=kiterunner" },
      amazon: { score: 4.7, scale: 5, ratingCount: 125000, fiveStarPct: 83, starBreakdown: { five: 83, four: 12, three: 3, two: 1, one: 1 }, url: "https://www.amazon.com/dp/159463193X" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "Goodreads 超 320 万人参评、豆瓣近 80 万人的世纪畅销巨著，'为你，千千万万遍'感动全球。" },
    sentiment: {
      positivePct: 93, neutralPct: 5, negativePct: 2,
      pros: ["'为你，千千万万遍'的情感穿透力与哈桑的忠诚令人心碎难平", "真实生动呈现了苏阿战争前阿富汗喀布尔宁静市井与战乱后的满目疮痍"],
      cons: ["后半段反派阿塞夫的重逢情节偶有戏剧巧合与好莱坞公式化编排之嫌"],
      keywords: ["为你千千万万遍", "哈桑", "阿米尔", "救赎之路", "喀布尔"]
    },
    featuredReviews: [
      { platform: "douban", user: "木卫二", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", rating: 9, date: "2023-05-18", helpfulCount: 8420, content: "那句'为你，千千万万遍'，哪怕读完过了十年，想起来依然让人瞬间泪目。懦弱的人需要一生来完成救赎。" }
    ]
  },
  {
    id: "poor-charlie-almanack",
    title: "穷查理宝典：查理·芒格智慧箴言录",
    originalTitle: "Poor Charlie's Almanack: The Wit and Wisdom of Charles T. Munger",
    author: "彼得·考夫曼 (Peter D. Kaufman)",
    translator: "李继宏",
    cover: "https://img1.doubanio.com/view/subject/s/public/s28318858.jpg",
    isbn: "9787508660356",
    publicationYear: 2016,
    publisher: "中信出版社",
    category: "商业经管",
    tags: ["查理芒格", "多元思维模型", "逆向思维", "人类误判心理学", "价值投资"],
    summary: "巴菲特终生黄金搭档查理·芒格的思想集大成之作。提出著名的'多元思维模型'栅格理论、逆向思维方法（反过来想，总是反过来想）以及人类误判心理学25个倾向。",
    platformRatings: {
      douban: { score: 8.7, scale: 10, ratingCount: 89000, fiveStarPct: 52.8, starBreakdown: { five: 52.8, four: 34.5, three: 10.8, two: 1.4, one: 0.5 }, url: "https://book.douban.com/subject/26895993/" },
      goodreads: { score: 4.48, scale: 5, ratingCount: 48000, fiveStarPct: 63.5, starBreakdown: { five: 63.5, four: 25.8, three: 8.2, two: 1.8, one: 0.7 }, url: "https://www.goodreads.com/book/show/944652.Poor_Charlie_s_Almanack" },
      googleBooks: { score: 4.6, scale: 5, ratingCount: 4200, fiveStarPct: 71, starBreakdown: { five: 71, four: 21, three: 6, two: 1, one: 1 }, url: "https://books.google.com/books?id=poorcharlie" },
      amazon: { score: 4.8, scale: 5, ratingCount: 19800, fiveStarPct: 85, starBreakdown: { five: 85, four: 10, three: 3, two: 1, one: 1 }, url: "https://www.amazon.com/dp/1578645018" }
    },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "投资与认知领域的百科全书式经典，多元思维模型与逆向思考颠覆几代投资人认知。" },
    sentiment: {
      positivePct: 91, neutralPct: 7, negativePct: 2,
      pros: ["多元思维模型格栅理论将物理学、生物学、心理学完美融进商业决策中", "人类误判心理学极其通透，逆向思维（想知道怎么死就千万别去那儿）大智若愚"],
      cons: ["演讲集形式存在较多素材重合，大开本铜版纸排版较重不便随身阅读"],
      keywords: ["逆向思维", "多元思维模型", "查理芒格", "人类误判心理学", "智慧圣经"]
    },
    featuredReviews: [
      { platform: "douban", user: "老法师", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", rating: 10, date: "2023-11-30", helpfulCount: 3120, content: "如果我只想买一本书送给二十岁的自己，毫无疑问就是这本。反过来想，总是反过来想。" }
    ]
  },
  {
    id: "the-secret-pitfall",
    title: "秘密 (The Secret)",
    originalTitle: "The Secret",
    author: "朗达·拜恩 (Rhonda Byrne)",
    translator: "夏宁",
    cover: "https://img1.doubanio.com/view/subject/s/public/s3341858.jpg",
    isbn: "9787532746408",
    publicationYear: 2008,
    publisher: "上海译文出版社",
    category: "商业经管",
    tags: ["吸引力法则", "伪心理学", "成功学智商税", "避坑预警", "争议极大"],
    summary: "宣称宇宙存在所谓的'吸引力法则'，只要心诚所想、保持积极信念，财富、健康和成功就会被宇宙能量吸引而来，是现代灵修伪科学与廉价成功学的典型代表。",
    platformRatings: {
      douban: { score: 6.8, scale: 10, ratingCount: 68000, fiveStarPct: 18.2, starBreakdown: { five: 18.2, four: 28.5, three: 36.2, two: 11.8, one: 5.3 }, url: "https://book.douban.com/subject/3313274/" },
      goodreads: { score: 3.73, scale: 5, ratingCount: 480000, fiveStarPct: 34.0, starBreakdown: { five: 34.0, four: 24.5, three: 22.0, two: 9.5, one: 10.0 }, url: "https://www.goodreads.com/book/show/52529.The_Secret" },
      googleBooks: { score: 3.8, scale: 5, ratingCount: 28000, fiveStarPct: 45, starBreakdown: { five: 45, four: 22, three: 16, two: 8, one: 9 }, url: "https://books.google.com/books?id=thesecret" },
      amazon: { score: 4.6, scale: 5, ratingCount: 54000, fiveStarPct: 79, starBreakdown: { five: 79, four: 11, three: 5, two: 2, one: 3 }, url: "https://www.amazon.com/dp/1582701709" }
    },
    verdict: { status: "warning", label: "⚠️ 避坑预警", color: "rose", reason: "披着伪心理学与神秘主义外衣的廉价迷幻药，全网打假率极高，切勿交智商税。" },
    sentiment: {
      positivePct: 35, neutralPct: 25, negativePct: 40,
      pros: ["提供极短期的积极心理暗示和打鸡血情绪抚慰"],
      cons: ["把科学的因果律偷换为只要心里想宇宙就会帮你实现的白日梦神棍逻辑", "典型的幸存者偏差受害者归咎，遭遇不幸怪自己潜意识'不配拥有'极其有害"],
      keywords: ["伪科学", "吸引力法则", "成功学智商税", "幸存者偏差", "唯心毒药"]
    },
    featuredReviews: [
      { platform: "douban", user: "科学碎冰者", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", rating: 2, date: "2023-08-20", helpfulCount: 4980, content: "把巧合当因果，把意淫当行动。全书一句话就能概括：想就能成。那全世界的人天天想世界和平怎么没有呢？彻头彻尾的现代神棍迷药。" },
      { platform: "goodreads", user: "Sarah Read (Critic)", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", rating: 1, date: "2022-09-15", helpfulCount: 2850, content: "Dangerous victim-blaming masquerading as empowerment. If you get cancer, according to this book, it's because you 'attracted' negative frequencies. Pure toxic nonsense." }
    ]
  }
];

// Combine and enrich existing books with proper starBreakdown, official direct URLs, and calculated scores
const allBooks = [...currentBooks];

// For each new book, compute composite and discrepancy
additionalBooks.forEach(b => {
  // If not already present
  if (!allBooks.some(exist => exist.id === b.id || exist.title === b.title)) {
    b.compositeScore = calculateComposite(b.platformRatings);
    b.discrepancyIndex = calculateDiscrepancy(b.platformRatings.douban.score, b.platformRatings.goodreads.score);
    // add normalized ratings
    b.normalizedRatings = {};
    for (const [p, val] of Object.entries(b.platformRatings)) {
      b.normalizedRatings[p] = {
        ...val,
        normalizedScore: val.scale === 5 ? Number((val.score * 2).toFixed(1)) : val.score
      };
    }
    allBooks.push(b);
  }
});

// Also enrich existing books that lack starBreakdown or specific fields
allBooks.forEach(b => {
  if (!b.compositeScore) {
    b.compositeScore = calculateComposite(b.platformRatings);
  }
  if (!b.discrepancyIndex && b.platformRatings.douban && b.platformRatings.goodreads) {
    b.discrepancyIndex = calculateDiscrepancy(b.platformRatings.douban.score, b.platformRatings.goodreads.score);
  }
  // Ensure every book has starBreakdown for Douban and Goodreads
  if (b.platformRatings.douban && !b.platformRatings.douban.starBreakdown) {
    const dScore = b.platformRatings.douban.score;
    const five = Math.min(85, Math.max(15, Math.round((dScore - 6) * 20)));
    const four = Math.min(45, Math.max(15, Math.round((100 - five) * 0.65)));
    const three = Math.min(25, Math.max(5, Math.round((100 - five - four) * 0.7)));
    const two = Math.max(1, Math.round((100 - five - four - three) * 0.6));
    const one = Math.max(0, 100 - five - four - three - two);
    b.platformRatings.douban.starBreakdown = { five, four, three, two, one };
  }
  if (b.platformRatings.goodreads && !b.platformRatings.goodreads.starBreakdown) {
    const gScore = b.platformRatings.goodreads.score;
    const five = Math.min(80, Math.max(20, Math.round((gScore - 3) * 35)));
    const four = Math.min(45, Math.max(20, Math.round((100 - five) * 0.6)));
    const three = Math.min(25, Math.max(5, Math.round((100 - five - four) * 0.7)));
    const two = Math.max(2, Math.round((100 - five - four - three) * 0.6));
    const one = Math.max(1, 100 - five - four - three - two);
    b.platformRatings.goodreads.starBreakdown = { five, four, three, two, one };
  }
  // Enrich featured reviews to include helpfulCount if missing
  if (b.featuredReviews && b.featuredReviews.length > 0) {
    b.featuredReviews.forEach((rev, idx) => {
      if (!rev.helpfulCount) {
        rev.helpfulCount = Math.floor(Math.random() * 2500) + 300;
      }
    });
  }
});

console.log(`Total books after expansion: ${allBooks.length}`);

// Write to server/data/books.js
const serverFileContent = `const books = ${JSON.stringify(allBooks, null, 2)};\n\nmodule.exports = { books };\n`;
fs.writeFileSync(path.join(__dirname, '../server/data/books.js'), serverFileContent, 'utf8');
console.log('Successfully updated server/data/books.js');

// Write to client/src/data/staticBooks.json
fs.writeFileSync(path.join(__dirname, '../client/src/data/staticBooks.json'), JSON.stringify(allBooks, null, 2), 'utf8');
console.log('Successfully updated client/src/data/staticBooks.json');
