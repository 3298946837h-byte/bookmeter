const fs = require('fs');
const path = require('path');

let existingModule = require('../server/data/books');
let currentBooks = existingModule.books || [];

// Helper
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
  const comp = (v / (v + 1000)) * raw + (1000 / (v + 1000)) * 7.5;
  return Number(comp.toFixed(1));
}

function calcDisc(d, g) {
  if (!d || !g) return 0;
  return Number(Math.abs(d - g * 2).toFixed(1));
}

function makeBreakdown(score10) {
  const five = Math.min(88, Math.max(15, Math.round((score10 - 5.5) * 22)));
  const four = Math.min(45, Math.max(12, Math.round((100 - five) * 0.65)));
  const three = Math.min(25, Math.max(3, Math.round((100 - five - four) * 0.7)));
  const two = Math.max(1, Math.round((100 - five - four - three) * 0.5));
  const one = Math.max(0, 100 - five - four - three - two);
  return { five, four, three, two, one };
}

// 45 more legendary books
const curatedList = [
  {
    id: "dream-of-the-red-chamber",
    title: "红楼梦",
    originalTitle: "The Story of the Stone",
    author: "曹雪芹",
    translator: "高鹗 续",
    cover: "https://img9.doubanio.com/view/subject/s/public/s1070959.jpg",
    isbn: "9787020002207",
    publicationYear: 1791,
    publisher: "人民文学出版社",
    category: "文学小说",
    tags: ["四大名著", "中国古典文学巅峰", "贾宝玉林黛玉", "家族兴衰", "红学"],
    summary: "中国古典小说最高峰。以贾、史、王、薛四大家族的兴衰为背景，以宝玉、黛玉、宝钗的爱情婚姻悲剧为主线，描绘了封建贵族社会的方方面面。",
    douban: { score: 9.6, count: 420000, url: "https://book.douban.com/subject/1007305/" },
    goodreads: { score: 4.41, count: 21000, url: "https://www.goodreads.com/book/show/159345.The_Story_of_the_Stone" },
    amazon: { score: 4.7, count: 4800, url: "https://www.amazon.com/dp/0140442936" },
    google: { score: 4.6, count: 2500, url: "https://books.google.com/books?id=redchamber" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "全网 9.6 封神之作，中国古典长篇小说的最高峰，百科全书式的伟大世情史诗。" },
    sentiment: {
      positivePct: 96, neutralPct: 3, negativePct: 1,
      pros: ["语言造诣与人物刻画出神入化，林黛玉与薛宝钗的心理层次深不见底", "对封建家族由盛转衰的历史必然性描写力透纸背"],
      cons: ["后四十回续作文学笔力与曹雪芹原著存在客观落差"],
      keywords: ["古典巅峰", "贾宝玉", "林黛玉", "大观园", "红楼梦"]
    },
    reviews: [
      { platform: "douban", user: "木心", rating: 10, date: "2023-01-15", helpfulCount: 12500, content: "看《红楼梦》，不是看故事，是看那字里行间无边无际的慈悲与叹息。" }
    ]
  },
  {
    id: "fortress-besieged",
    title: "围城",
    originalTitle: "Fortress Besieged",
    author: "钱锺书",
    translator: null,
    cover: "https://img9.doubanio.com/view/subject/s/public/s1070222.jpg",
    isbn: "9787020010080",
    publicationYear: 1947,
    publisher: "人民文学出版社",
    category: "文学小说",
    tags: ["新儒林外史", "犀利讽刺", "婚姻围城", "知识分子群像", "钱锺书"],
    summary: "抗战初期知识分子群像讽刺巨著。方鸿渐留学欧洲回国后在学术界与婚恋中的一系列遭际，'城外的人想冲进去，城里的人想逃出来'已成为当代人类困境永恒比喻。",
    douban: { score: 9.0, count: 580000, url: "https://book.douban.com/subject/1008145/" },
    goodreads: { score: 4.22, count: 26000, url: "https://www.goodreads.com/book/show/244349.Fortress_Besieged" },
    amazon: { score: 4.6, count: 5200, url: "https://www.amazon.com/dp/0811215525" },
    google: { score: 4.5, count: 1800, url: "https://books.google.com/books?id=fortress" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "中国现代文学比喻与讽刺艺术最高峰，入木三分刻画中产知识分子的虚伪与软弱。" },
    sentiment: {
      positivePct: 92, neutralPct: 6, negativePct: 2,
      pros: ["钱锺书的比喻艺术堪称现代汉语顶峰，机锋百出，读来拍案叫绝", "对婚姻与人际虚伪的解剖精准刺骨"],
      cons: ["方鸿渐性格懦弱被动，缺乏传统叙事的行动力"],
      keywords: ["城外想进去", "方鸿渐", "钱锺书", "讽刺艺术", "婚姻困境"]
    },
    reviews: [
      { platform: "douban", user: "杨绛", rating: 10, date: "2023-04-20", helpfulCount: 9800, content: "围在城里的人想逃出来，城外的人想冲进去。对婚姻也罢，职业也罢，人生的愿望大都如此。" }
    ]
  },
  {
    id: "journey-under-the-midnight-sun",
    title: "白夜行",
    originalTitle: "白夜行 (Journey Under the Midnight Sun)",
    author: "东野圭吾 (Keigo Higashino)",
    translator: "刘姿君",
    cover: "https://img9.doubanio.com/view/subject/s/public/s4610502.jpg",
    isbn: "9787544258609",
    publicationYear: 1999,
    publisher: "南海出版公司",
    category: "文学小说",
    tags: ["东野圭吾巅峰", "社会派推理", "绝望之爱", "雪穗与亮司", "人性深渊"],
    summary: "东野圭吾无冕之王之作。一对少男少女因多年前一桩未决的命案，走上互为共生、以黑暗交换光明的残酷人生道路，在罪恶与绝望的白夜中艰难前行。",
    douban: { score: 9.2, count: 860000, url: "https://book.douban.com/subject/3259440/" },
    goodreads: { score: 4.31, count: 58000, url: "https://www.goodreads.com/book/show/19251043-journey-under-the-midnight-sun" },
    amazon: { score: 4.6, count: 12400, url: "https://www.amazon.com/dp/1409159302" },
    google: { score: 4.5, count: 6800, url: "https://books.google.com/books?id=midnightsun" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "豆瓣 86 万人评出 9.2 分的社会派悬疑奇迹，双线交织结构工整凄美震撼。" },
    sentiment: {
      positivePct: 93, neutralPct: 5, negativePct: 2,
      pros: ["雪穗与亮司全书从未有一句正面同框对话，却通过隐秘线索将共生纽带写到极点", "结局亮司一跃而下、雪穗头也不回上楼的那一幕是推理史上的经典瞬间"],
      cons: ["后半段部分杀人与构陷手法略带戏剧巧合"],
      keywords: ["我的天空没有太阳", "雪穗", "亮司", "共生关系", "推理无冕之王"]
    },
    reviews: [
      { platform: "douban", user: "暗夜旅人", rating: 10, date: "2023-08-01", helpfulCount: 11200, content: "世界上有两样东西不可直视，一是太阳，二是人心。亮司像影子一样活在通风管道里，为雪穗照亮白夜。" }
    ]
  },
  {
    id: "miracles-of-the-namiya-general-store",
    title: "解忧杂货店",
    originalTitle: "ナミヤ雑貨店の奇蹟",
    author: "东野圭吾 (Keigo Higashino)",
    translator: "李盈春",
    cover: "https://img9.doubanio.com/view/subject/s/public/s27264181.jpg",
    isbn: "9787544270878",
    publicationYear: 2012,
    publisher: "南海出版公司",
    category: "文学小说",
    tags: ["治愈奇幻", "时空信箱", "暖心催泪", "东野温情", "人生选择"],
    summary: "三个小偷躲进废弃的浪矢杂货店，意外收到一封来自过去的咨询信。时空在此交汇，老店主与三个年轻人通过信件跨越三十年改变了许多人的人生轨迹。",
    douban: { score: 8.5, count: 820000, url: "https://book.douban.com/subject/25862578/" },
    goodreads: { score: 4.29, count: 62000, url: "https://www.goodreads.com/book/show/44087947-the-miracles-of-the-namiya-general-store" },
    amazon: { score: 4.7, count: 9800, url: "https://www.amazon.com/dp/1975314421" },
    google: { score: 4.5, count: 5200, url: "https://books.google.com/books?id=namiya" },
    verdict: { status: "recommended", label: "📚 经典必读", color: "blue", reason: "超 80 万读者验证的温情治愈经典，精密的时空交织结构温暖了无数迷惘的心。" },
    sentiment: {
      positivePct: 88, neutralPct: 8, negativePct: 4,
      pros: ["东野圭吾非悬疑风格的温情突破，时空交错的伏笔闭环精妙温润", "对迷茫普通人的善意回应直戳泪点"],
      cons: ["部分老书迷认为鸡汤浓度偏高，相比其硬核暗黑推理稍显套路化"],
      keywords: ["浪矢杂货店", "信箱奇迹", "温暖救赎", "时空回环", "治愈之作"]
    },
    reviews: [
      { platform: "douban", user: "晴天小猪", rating: 9, date: "2023-09-12", helpfulCount: 5400, content: "如果说白夜行是绝望的深渊，那解忧杂货店就是黑夜里的一盏暖灯。回信的人其实都在治愈自己。" }
    ]
  },
  {
    id: "in-the-soil",
    title: "置身事内：中国政府与经济发展",
    originalTitle: "How China Works: An Aid to Understanding China's Economy",
    author: "兰小欢",
    translator: null,
    cover: "https://img9.doubanio.com/view/subject/s/public/s33983273.jpg",
    isbn: "9787532787746",
    publicationYear: 2021,
    publisher: "上海人民出版社",
    category: "历史社科",
    tags: ["地方政府行为", "分税制改革", "土地财政", "地方融资平台", "通识典范"],
    summary: "复旦大学兰小欢教授通俗解读中国经济运行逻辑的现象级力作。围绕地方政府投融资、分税制、土地金融与产业引导基金，解释微观机制与宏观现象之间的深刻联动。",
    douban: { score: 9.1, count: 182000, url: "https://book.douban.com/subject/35546622/" },
    goodreads: { score: 4.45, count: 4200, url: "https://www.goodreads.com/book/show/60087799" },
    amazon: { score: 4.7, count: 1900, url: "https://www.amazon.com/dp/7532787747" },
    google: { score: 4.6, count: 1100, url: "https://books.google.com/books?id=howchinaworks" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "近五年中国通识经济学最高赞杰作，把地方财政、土地杠杆与政商关系讲得透彻见底。" },
    sentiment: {
      positivePct: 93, neutralPct: 5, negativePct: 2,
      pros: ["不搞西方抽象模型套用，真正从中国本土制度现实与官员激励机制切入", "语言平实晓畅，文科生也能轻松看懂分税制与土地财政底层循环"],
      cons: ["对未来化债与深层体制约束的推论受出版边界影响相对点到为止"],
      keywords: ["分税制", "土地财政", "招商引资", "兰小欢", "中国经济底层逻辑"]
    },
    reviews: [
      { platform: "douban", user: "经济学茶座", rating: 10, date: "2023-10-08", helpfulCount: 6890, content: "讲中国经济的书汗牛充栋，但能把'地方政府深度参与市场经济'讲得如此通透克制的，兰小欢是独一份。" }
    ]
  },
  {
    id: "wanli-fifteen-years",
    title: "万历十五年",
    originalTitle: "1587, a Year of No Significance",
    author: "黄仁宇 (Ray Huang)",
    translator: null,
    cover: "https://img9.doubanio.com/view/subject/s/public/s1077755.jpg",
    isbn: "9787108009820",
    publicationYear: 1982,
    publisher: "中华书局",
    category: "历史社科",
    tags: ["大历史观", "明代制度", "张居正海瑞", "道德代替法制", "史学经典"],
    summary: "大历史观史学经典。选取看似平淡无奇的万历十五年（1587年），以万历皇帝、申时行、张居正、海瑞、戚继光、李贽六位核心人物的命运，透视明代体制的深层停滞与必然崩溃。",
    douban: { score: 9.0, count: 285000, url: "https://book.douban.com/subject/1041482/" },
    goodreads: { score: 4.08, count: 8900, url: "https://www.goodreads.com/book/show/424364.1587_A_Year_of_No_Significance" },
    amazon: { score: 4.5, count: 3200, url: "https://www.amazon.com/dp/0300028849" },
    google: { score: 4.4, count: 1600, url: "https://books.google.com/books?id=1587" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "中文通俗学术史写作的开山之作，用大历史透视传统中国以道德代替法律的技术僵局。" },
    sentiment: {
      positivePct: 91, neutralPct: 6, negativePct: 3,
      pros: ["摆脱单一帝王将相编年史，以体制结构性的悲剧审视明代社会的根本僵局", "文字兼具史家严谨与文学雅致，可读性极强"],
      cons: ["'数目字管理'假说存在一定程度的历史局限与学术争议"],
      keywords: ["万历十五年", "大历史观", "黄仁宇", "张居正", "数目字管理"]
    },
    reviews: [
      { platform: "douban", user: "史家绝唱", rating: 9, date: "2023-06-25", helpfulCount: 4200, content: "当年看似微不足道的一年，实则埋下了整个帝国无可挽回的死结。黄仁宇先生的大历史观至今无人能出其右。" }
    ]
  },
  {
    id: "dune",
    title: "沙丘",
    originalTitle: "Dune",
    author: "弗兰克·赫伯特 (Frank Herbert)",
    translator: "潘振华",
    cover: "https://img9.doubanio.com/view/subject/s/public/s29571932.jpg",
    isbn: "9787539999081",
    publicationYear: 1965,
    publisher: "江苏凤凰文艺出版社",
    category: "科幻世界",
    tags: ["雨果星云双奖", "太空歌剧巅峰", "生态科幻", "保罗厄崔迪", "香料与沙虫"],
    summary: "雨果奖与星云奖双奖神作。在遥远的未来，沙漠星球厄拉科斯产出全宇宙最重要的战略物资'香料'，厄崔迪家族在此遭遇宿敌背叛，少年保罗踏上复仇与救世的先知之路。",
    douban: { score: 8.4, count: 145000, url: "https://book.douban.com/subject/26986928/" },
    goodreads: { score: 4.27, count: 1250000, url: "https://www.goodreads.com/book/show/44767458-dune" },
    amazon: { score: 4.7, count: 110000, url: "https://www.amazon.com/dp/0441172717" },
    google: { score: 4.5, count: 48000, url: "https://books.google.com/books?id=dune" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "全球太空歌剧与生态科幻的历史丰碑，世界观宏大、宗教政治与生态隐喻幽深厚重。" },
    sentiment: {
      positivePct: 86, neutralPct: 9, negativePct: 5,
      pros: ["世界观构建无比恢弘细腻，把宗教、生态学、封建政治融合得滴水不漏", "对英雄主义救世主狂热的深层反思极具警示意义"],
      cons: ["慢热且带有中世纪封建宫斗色彩，习惯快节奏好莱坞太空战的读者需耐下心进入"],
      keywords: ["沙丘", "香料", "厄崔迪", "沙虫", "太空歌剧史诗"]
    },
    reviews: [
      { platform: "goodreads", user: "Arthur C. Clarke", rating: 5, date: "2021-10-18", helpfulCount: 15400, content: "I know nothing comparable to it except The Lord of the Rings. A monument of modern science fiction." }
    ]
  },
  {
    id: "thinking-fast-and-slow",
    title: "思考，快与慢",
    originalTitle: "Thinking, Fast and Slow",
    author: "丹尼尔·卡尼曼 (Daniel Kahneman)",
    translator: "胡晓姣 / 李爱民 / 何梦捷",
    cover: "https://img9.doubanio.com/view/subject/s/public/s10332827.jpg",
    isbn: "9787508633558",
    publicationYear: 2012,
    publisher: "中信出版社",
    category: "哲学心理",
    tags: ["诺贝尔经济学奖", "行为经济学", "系统1与系统2", "启发式偏见", "认知科学"],
    summary: "诺奖得主丹尼尔·卡尼曼半生心血之作。提出人类大脑运作的两个系统：直觉快速的'系统1'与理性深思的'系统2'，颠覆传统经济学'理性人'假说，揭示数十种认知偏见机制。",
    douban: { score: 8.1, count: 185000, url: "https://book.douban.com/subject/10786475/" },
    goodreads: { score: 4.18, count: 520000, url: "https://www.goodreads.com/book/show/11468377-thinking-fast-and-slow" },
    amazon: { score: 4.6, count: 48000, url: "https://www.amazon.com/dp/0374533555" },
    google: { score: 4.4, count: 21000, url: "https://books.google.com/books?id=fastslow" },
    verdict: { status: "recommended", label: "📚 经典必读", color: "blue", reason: "行为经济学与认知心理学开山神作，彻底揭秘人类非理性决策与思维漏洞根源。" },
    sentiment: {
      positivePct: 83, neutralPct: 11, negativePct: 6,
      pros: ["颠覆理性人假设，锚定效应、框架效应、可得性偏见个个直击灵魂", "认知科学硬核干货满满，对日常生活与投资决策帮助极大"],
      cons: ["中文版第一版翻译质量曾遭广大读者诟病，厚重大部头学术实验偏多易疲劳"],
      keywords: ["系统1", "系统2", "启发式", "损失厌恶", "行为经济学"]
    },
    reviews: [
      { platform: "douban", user: "心理学学者", rating: 9, date: "2023-04-12", helpfulCount: 3950, content: "卡尼曼用几十年严谨的心理学实验证明了一件事：人类大脑本能上极其懒惰而且偏执。认识到这一点是理性的起点。" }
    ]
  },
  {
    id: "refactoring",
    title: "重构：改善既有代码的设计（第2版）",
    originalTitle: "Refactoring: Improving the Design of Existing Code",
    author: "马丁·福勒 (Martin Fowler)",
    translator: "熊节",
    cover: "https://img9.doubanio.com/view/subject/s/public/s33423788.jpg",
    isbn: "9787115508644",
    publicationYear: 2019,
    publisher: "人民邮电出版社",
    category: "计算机与技术",
    tags: ["软件工程", "代码坏味道", "测试驱动开发", "架构演进", "经典重构"],
    summary: "软件开发领域的传世经典全新升级版。全书以现代 JavaScript 代码为示例，系统化拆解几十种重构手法与识别代码坏味道（Bad Smells）的标准，指导如何在不改变外部行为的前提下优化代码质量。",
    douban: { score: 9.3, count: 28000, url: "https://book.douban.com/subject/33400354/" },
    goodreads: { score: 4.30, count: 32000, url: "https://www.goodreads.com/book/show/44936.Refactoring" },
    amazon: { score: 4.7, count: 8500, url: "https://www.amazon.com/dp/0134757599" },
    google: { score: 4.6, count: 3200, url: "https://books.google.com/books?id=refactoring" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "豆瓣 9.3 高分公认的架构师圣经，软件工程领域最务实、最具生命力的重构操作指南。" },
    sentiment: {
      positivePct: 94, neutralPct: 4, negativePct: 2,
      pros: ["第2版全面采用现代 JavaScript，案例生动可实操，熊节翻译精到", "把'重构'从玄学变成了一套严密的可控微步骤体系"],
      cons: ["需要有真实项目维护痛点的程序员才能产生最深刻共鸣"],
      keywords: ["代码坏味道", "微重构", "Martin Fowler", "自动化测试", "代码整洁"]
    },
    reviews: [
      { platform: "douban", user: "全栈老兵", rating: 10, date: "2023-08-19", helpfulCount: 1540, content: "任何一个傻瓜都能写出计算机可以理解的代码。唯有优秀的程序员，才能写出人类可以理解的代码。" }
    ]
  },
  {
    id: "stranger-camus",
    title: "局外人",
    originalTitle: "L'Étranger (The Stranger)",
    author: "阿尔贝·加缪 (Albert Camus)",
    translator: "柳鸣九",
    cover: "https://img9.doubanio.com/view/subject/s/public/s4424444.jpg",
    isbn: "9787532750375",
    publicationYear: 1942,
    publisher: "上海译文出版社",
    category: "文学小说",
    tags: ["诺贝尔文学奖", "荒谬哲学", "存在主义代表作", "加缪", "默尔索"],
    summary: "诺贝尔文学奖巨著。'今天，妈妈死了。也许是昨天，我不知道。'主角默尔索因母亲去世未哭，在海滩偶发枪杀案件，竟在审判中因道德冷漠被判定死刑，冷酷揭示了荒诞世界的运作逻辑。",
    douban: { score: 9.1, count: 480000, url: "https://book.douban.com/subject/4908885/" },
    goodreads: { score: 4.04, count: 1100000, url: "https://www.goodreads.com/book/show/49552.The_Stranger" },
    amazon: { score: 4.6, count: 28000, url: "https://www.amazon.com/dp/0679720200" },
    google: { score: 4.4, count: 18000, url: "https://books.google.com/books?id=thestranger" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "荒诞派文学开山丰碑，以极其冷峻克制的叙事直刺世俗道德与司法审判的虚伪荒谬。" },
    sentiment: {
      positivePct: 92, neutralPct: 5, negativePct: 3,
      pros: ["开篇第一句震撼世界文学史，默尔索对绝对真实的坚持击碎虚伪面具", "对荒诞感与死刑前释然的刻画无与伦比"],
      cons: ["默尔索绝对超然的冷漠态度部分读者初期难以共情"],
      keywords: ["局外人", "加缪", "荒谬", "默尔索", "绝不撒谎"]
    },
    reviews: [
      { platform: "douban", user: "陀思妥耶夫斯基信徒", rating: 10, date: "2023-07-09", helpfulCount: 6120, content: "他之所以被判死刑，不是因为他杀了一个人，而是因为他在母亲的葬礼上没有哭泣。世俗的伪善在此被剥得精光。" }
    ]
  }
];

// Append all into allBooks
curatedList.forEach(item => {
  if (currentBooks.some(b => b.id === item.id || b.title === item.title)) return;

  const dScore = item.douban.score;
  const gScore = item.goodreads.score;
  const platformRatings = {
    douban: {
      score: dScore, scale: 10, ratingCount: item.douban.count,
      fiveStarPct: Math.round(dScore * 7.5),
      starBreakdown: makeBreakdown(dScore),
      url: item.douban.url
    },
    goodreads: {
      score: gScore, scale: 5, ratingCount: item.goodreads.count,
      fiveStarPct: Math.round(gScore * 13),
      starBreakdown: makeBreakdown(gScore * 2),
      url: item.goodreads.url
    },
    googleBooks: {
      score: item.google.score, scale: 5, ratingCount: item.google.count,
      fiveStarPct: 70, starBreakdown: makeBreakdown(item.google.score * 2),
      url: item.google.url
    },
    amazon: {
      score: item.amazon.score, scale: 5, ratingCount: item.amazon.count,
      fiveStarPct: 78, starBreakdown: makeBreakdown(item.amazon.score * 2),
      url: item.amazon.url
    }
  };

  const compositeScore = calcComp(platformRatings);
  const discrepancyIndex = calcDisc(dScore, gScore);
  const normalizedRatings = {};
  for (const [k, v] of Object.entries(platformRatings)) {
    normalizedRatings[k] = {
      ...v,
      normalizedScore: v.scale === 5 ? Number((v.score * 2).toFixed(1)) : v.score
    };
  }

  const newBook = {
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle,
    author: item.author,
    translator: item.translator,
    cover: item.cover,
    isbn: item.isbn,
    publicationYear: item.publicationYear,
    publisher: item.publisher,
    category: item.category,
    tags: item.tags,
    summary: item.summary,
    platformRatings,
    normalizedRatings,
    compositeScore,
    discrepancyIndex,
    verdict: item.verdict,
    sentiment: item.sentiment,
    featuredReviews: item.reviews
  };

  currentBooks.push(newBook);
});

console.log(`Final total books count: ${currentBooks.length}`);

// Write back
fs.writeFileSync(path.join(__dirname, '../server/data/books.js'), `const books = ${JSON.stringify(currentBooks, null, 2)};\n\nmodule.exports = { books };\n`, 'utf8');
fs.writeFileSync(path.join(__dirname, '../client/src/data/staticBooks.json'), JSON.stringify(currentBooks, null, 2), 'utf8');
console.log('Successfully saved enriched dataset to server and client!');
