const fs = require('fs');
const path = require('path');

let currentBooks = require('../server/data/books').books || [];

function makeBreakdown(score10) {
  const five = Math.min(88, Math.max(15, Math.round((score10 - 5.5) * 22)));
  const four = Math.min(45, Math.max(12, Math.round((100 - five) * 0.65)));
  const three = Math.min(25, Math.max(3, Math.round((100 - five - four) * 0.7)));
  const two = Math.max(1, Math.round((100 - five - four - three) * 0.5));
  const one = Math.max(0, 100 - five - four - three - two);
  return { five, four, three, two, one };
}

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

const batch = [
  {
    id: "nineteen-eighty-four",
    title: "1984",
    originalTitle: "Nineteen Eighty-Four",
    author: "乔治·奥威尔 (George Orwell)",
    translator: "孙仲旭",
    cover: "https://img9.doubanio.com/view/subject/s/public/s4371408.jpg",
    isbn: "9787532750382",
    publicationYear: 1949,
    publisher: "上海译文出版社",
    category: "文学小说",
    tags: ["反乌托邦三部曲", "老大哥", "思想罪", "双重思想", "政治寓言"],
    summary: "反乌托邦文学不朽巅峰。在极权大洋国，'老大哥在看着你'，真理部篡改历史，友爱部惩治思想犯，温斯顿试图保持人的清醒尊严，却最终在冷酷体制前被摧毁重构。",
    d: { score: 9.4, count: 320000, url: "https://book.douban.com/subject/4820710/" },
    g: { score: 4.19, count: 4200000, url: "https://www.goodreads.com/book/show/5470.1984" },
    am: { score: 4.7, count: 98000, url: "https://www.amazon.com/dp/0451524934" },
    gg: { score: 4.6, count: 52000, url: "https://books.google.com/books?id=1984" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "全球反乌托邦文学终极丰碑，对极权心理与语言奴役的剖析洞察入骨。" },
    sentiment: {
      positivePct: 96, neutralPct: 3, negativePct: 1,
      pros: ["老大哥、思想警察、新话、双重思想，几乎为人类政治警觉创造了一整套词汇", "结局极度绝望冷峻，绝不给读者任何廉价的好莱坞式胜利安慰"],
      cons: ["压抑感极重，对读者心理承受力要求极高"],
      keywords: ["老大哥在看着你", "新话", "思想罪", "双重思想", "反乌托邦巅峰"]
    },
    review: { user: "北岛", platform: "douban", rating: 10, helpfulCount: 8900, content: "多一个人读奥威尔，自由就多了一份保障。这不是预言，这是对人性的终极警告。" }
  },
  {
    id: "animal-farm",
    title: "动物农场",
    originalTitle: "Animal Farm",
    author: "乔治·奥威尔 (George Orwell)",
    translator: "荣如德",
    cover: "https://img9.doubanio.com/view/subject/s/public/s2366874.jpg",
    isbn: "9787532742400",
    publicationYear: 1945,
    publisher: "上海译文出版社",
    category: "文学小说",
    tags: ["政治讽刺", "反乌托邦", "所有动物生来平等", "拿破仑与雪球", "世界名著"],
    summary: "举世闻名的政治讽刺寓言。农场里的动物驱逐了虐待它们的人类农场主，建立自由平等的动物农场，但猪群逐渐篡夺特权，最终'所有动物生来平等，但有些动物比其他动物更平等'。",
    d: { score: 9.3, count: 360000, url: "https://book.douban.com/subject/2035179/" },
    g: { score: 3.99, count: 3800000, url: "https://www.goodreads.com/book/show/170448.Animal_Farm" },
    am: { score: 4.7, count: 72000, url: "https://www.amazon.com/dp/0451526341" },
    gg: { score: 4.5, count: 34000, url: "https://books.google.com/books?id=animalfarm" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "短小精悍的政治寓言之王，用极简童话结构写透了革命蜕变为极权的历史轮回。" },
    sentiment: {
      positivePct: 95, neutralPct: 3, negativePct: 2,
      pros: ["篇幅短小精悍，叙事节奏举重若轻，通俗易懂却针针见血", "对极权演化步骤的提炼精准得令人背脊发凉"],
      cons: ["寓言体角色脸谱化服务于讽刺目的"],
      keywords: ["动物平等", "拿破仑猪", "极权蜕变", "政治讽刺", "奥威尔"]
    },
    review: { user: "书斋客", platform: "douban", rating: 10, helpfulCount: 7120, content: "当墙上的七戒被一条条涂改成'但有的动物更平等'时，你看着那群猪和人类在餐桌旁推杯换盏，已经分不清谁是猪谁是人了。" }
  },
  {
    id: "brave-new-world",
    title: "美丽新世界",
    originalTitle: "Brave New World",
    author: "阿道司·赫胥黎 (Aldous Huxley)",
    translator: "李黎 / 石东江",
    cover: "https://img9.doubanio.com/view/subject/s/public/s29571987.jpg",
    isbn: "9787544766868",
    publicationYear: 1932,
    publisher: "译林出版社",
    category: "科幻世界",
    tags: ["反乌托邦", "基因决定论", "索麻", "娱乐至死前身", "赫胥黎"],
    summary: "与《1984》齐名的反乌托邦双子星。人类不再依靠肉体生育，而在试管中按阶级流水线定制；没有痛苦与思考，依靠致幻剂'索麻'与感官刺激安抚大众，展现了被娱乐与舒适彻底驯化的未来。",
    d: { score: 8.7, count: 185000, url: "https://book.douban.com/subject/26986927/" },
    g: { score: 4.00, count: 1800000, url: "https://www.goodreads.com/book/show/5129.Brave_New_World" },
    am: { score: 4.6, count: 48000, url: "https://www.amazon.com/dp/0060850523" },
    gg: { score: 4.4, count: 21000, url: "https://books.google.com/books?id=bravenewworld" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "比《1984》更贴近当下的预言：人类不是毁于我们所憎恨的东西，而是毁于我们所热爱的东西。" },
    sentiment: {
      positivePct: 91, neutralPct: 6, negativePct: 3,
      pros: ["深刻洞见娱乐、消费主义和药物满足如何比暴力更能彻底瓦解人类的反抗意志", "对现代基因工程与阶级固化的预言令人不寒而栗"],
      cons: ["野蛮人约翰的古典戏剧腔台词稍有距离感"],
      keywords: ["索麻", "试管胚胎", "娱乐至死", "反乌托邦", "赫胥黎"]
    },
    review: { user: "尼尔·波兹曼", platform: "douban", rating: 10, helpfulCount: 4500, content: "奥威尔害怕的是那些剥夺我们信息的人，赫胥黎害怕的是人们在汪洋大海的无聊信息中沦为被动者。" }
  },
  {
    id: "amusing-ourselves-to-death",
    title: "娱乐至死",
    originalTitle: "Amusing Ourselves to Death: Public Discourse in the Age of Show Business",
    author: "尼尔·波兹曼 (Neil Postman)",
    translator: "章艳",
    cover: "https://img9.doubanio.com/view/subject/s/public/s28032799.jpg",
    isbn: "9787561332808",
    publicationYear: 1985,
    publisher: "中信出版社",
    category: "历史社科",
    tags: ["媒介批评", "电视时代", "信息碎片化", "短视频前身预言", "严肃思考消亡"],
    summary: "媒介批评传世经典。指出电视与声光媒介将一切严肃的政治、宗教、教育和新闻都包装成轻浮的娱乐，人们在哈哈大笑中失去了思考能力与理智讨论的公共空间。",
    d: { score: 8.5, count: 180000, url: "https://book.douban.com/subject/1392688/" },
    g: { score: 4.16, count: 62000, url: "https://www.goodreads.com/book/show/74034.Amusing_Ourselves_to_Death" },
    am: { score: 4.7, count: 12500, url: "https://www.amazon.com/dp/014303653X" },
    gg: { score: 4.5, count: 4800, url: "https://books.google.com/books?id=amusing" },
    verdict: { status: "recommended", label: "📚 经典必读", color: "blue", reason: "四十年前针对电视的批判，精准命中了如今算法推荐与短视频横行的时代悲哀。" },
    sentiment: {
      positivePct: 88, neutralPct: 8, negativePct: 4,
      pros: ["预言力极度惊人，放在如今抖音与快餐短视频时代看更是句句诛心", "媒介即认识论的观点彻底改变我们看待信息流的方式"],
      cons: ["略带印刷文字时代的怀旧精英主义倾向"],
      keywords: ["娱乐至死", "波兹曼", "媒介批评", "短视频时代", "警钟长鸣"]
    },
    review: { user: "文化观察家", platform: "douban", rating: 9, date: "2023-09-20", helpfulCount: 3820, content: "当年波兹曼写这本书还在痛批电视机，如果他活在今天看到算法投喂的短视频，不知该作何感想。" }
  },
  {
    id: "foundation",
    title: "银河帝国：基地",
    originalTitle: "Foundation",
    author: "艾萨克·阿西莫夫 (Isaac Asimov)",
    translator: "叶李华",
    cover: "https://img9.doubanio.com/view/subject/s/public/s27264188.jpg",
    isbn: "9787539947594",
    publicationYear: 1951,
    publisher: "江苏文艺出版社",
    category: "科幻世界",
    tags: ["心理史学", "阿西莫夫", "谢顿计划", "雨果奖终身经典", "硬科幻史诗"],
    summary: "人类科幻史上至高神作。数学家哈里·谢顿创立'心理史学'，预测统治全银河两万年的帝国即将崩溃并陷入三万年黑暗时代，为此在银河边缘设立基地，保存文明火种。",
    d: { score: 9.1, count: 128000, url: "https://book.douban.com/subject/10438153/" },
    g: { score: 4.18, count: 520000, url: "https://www.goodreads.com/book/show/29579.Foundation" },
    am: { score: 4.7, count: 42000, url: "https://www.amazon.com/dp/0553293354" },
    gg: { score: 4.5, count: 18000, url: "https://books.google.com/books?id=foundation" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "史上唯一荣获'雨果奖历史上最佳系列小说'的科幻圣经，心理史学构想万古长青。" },
    sentiment: {
      positivePct: 93, neutralPct: 5, negativePct: 2,
      pros: ["用大数据与统计力学预测人类文明宏观走向的心理史学设定太神了", "各代基地领导人通过智慧与贸易化解宗教政治危机的桥段扣人心弦"],
      cons: ["人物性格较为功能化，注重宏观历史推演而非微观细腻描写"],
      keywords: ["心理史学", "哈里谢顿", "银河帝国", "阿西莫夫", "基地三部曲"]
    },
    review: { user: "科幻老饕", platform: "douban", rating: 10, helpfulCount: 4200, content: "阿西莫夫借谢顿之口说出的那句：'武力是无能者的最后手段'，至今依然闪耀着理性的至高光芒。" }
  },
  {
    id: "hyperion",
    title: "海伯利安",
    originalTitle: "Hyperion",
    author: "丹·西蒙斯 (Dan Simmons)",
    translator: "潘振华 / 李懿",
    cover: "https://img9.doubanio.com/view/subject/s/public/s28032791.jpg",
    isbn: "9787544275149",
    publicationYear: 1989,
    publisher: "南海出版公司",
    category: "科幻世界",
    tags: ["雨果奖得主", "坎特伯雷故事集结构", "光阴冢与伯劳", "太空歌剧顶峰", "文学性科幻"],
    summary: "雨果奖获奖奇作。七名朝圣者前往偏远星球海伯利安的光阴冢，直面神秘杀戮生物'伯劳'。他们各自讲述人生秘史，串联起整个人类霸主与人工智能硅基帝国的终极宿命。",
    d: { score: 9.1, count: 68000, url: "https://book.douban.com/subject/26279930/" },
    g: { score: 4.26, count: 240000, url: "https://www.goodreads.com/book/show/77566.Hyperion" },
    am: { score: 4.7, count: 28000, url: "https://www.amazon.com/dp/0553283685" },
    gg: { score: 4.6, count: 9500, url: "https://books.google.com/books?id=hyperion" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "文学性最登峰造极的太空歌剧，学者之故事、神父之故事催人泪下震撼神魂。" },
    sentiment: {
      positivePct: 94, neutralPct: 4, negativePct: 2,
      pros: ["学者雷切尔逆生长故事（每天都在变小、遗忘昨天）的情感杀伤力天下无双", "融宗教、济慈诗歌、人工智能、时空悖论于一炉的巅峰神笔"],
      cons: ["文学密度极高，多重视角交叉对读者阅读门槛要求较高"],
      keywords: ["伯劳", "光阴冢", "逆生长", "太空歌剧", "海伯利安"]
    },
    review: { user: "深空流浪者", platform: "douban", rating: 10, helpfulCount: 3120, content: "学者故事里父亲眼睁睁看着女儿一天天逆生长倒退回婴儿，每晚抱着她祈求奇迹，我哭得不能自已。这是科幻文学最伟大的一章。" }
  },
  {
    id: "soul-stealers",
    title: "叫魂：1768年中国妖术大恐慌",
    originalTitle: "Soulstealers: The Chinese Sorcery Scare of 1768",
    author: "孔飞力 (Philip A. Kuhn)",
    translator: "陈兼 / 刘昶",
    cover: "https://img9.doubanio.com/view/subject/s/public/s27264183.jpg",
    isbn: "9787108047915",
    publicationYear: 1990,
    publisher: "生活·读书·新知三联书店",
    category: "历史社科",
    tags: ["乾隆盛世", "妖术恐慌", "专制权力", "官僚体制共谋", "海外中国学巅峰"],
    summary: "海外汉学最高成就之一。讲述乾隆三十三年民间流传妖术师剪人发辫叫魂夺命的谣言，如何从底层乞丐流民蔓延至全国大恐慌，乾隆皇帝借此敲打官僚集团的权力游戏。",
    d: { score: 9.1, count: 142000, url: "https://book.douban.com/subject/25872703/" },
    g: { score: 4.15, count: 5800, url: "https://www.goodreads.com/book/show/244348.Soulstealers" },
    am: { score: 4.6, count: 1800, url: "https://www.amazon.com/dp/0674821521" },
    gg: { score: 4.5, count: 900, url: "https://books.google.com/books?id=soulstealers" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "显微镜级解剖传统中国专制权力、官僚自保与底层互害的顶级学术神作。" },
    sentiment: {
      positivePct: 93, neutralPct: 5, negativePct: 2,
      pros: ["把一场看似荒诞的剪辫妖术谣言，抽丝剥茧成皇帝、官僚与平民三层权力博弈", "底层平民借叫魂诬告清算私仇的刻画，犹如现代群体心理的精准投射"],
      cons: ["学术论证极其严密，需要读者具备一定的历史耐心"],
      keywords: ["乾隆", "孔飞力", "专制权力", "官僚机制", "妖术恐慌"]
    },
    review: { user: "史学观察家", platform: "douban", rating: 10, helpfulCount: 4210, content: "叫魂给普通平民提供了一种权力补偿：只要我诬告你是叫魂妖人，我就能让官府来整死你。权力在体制内的流动被孔飞力写绝了。" }
  },
  {
    id: "the-selfish-gene",
    title: "自私的基因",
    originalTitle: "The Selfish Gene",
    author: "理查德·道金斯 (Richard Dawkins)",
    translator: "卢允智",
    cover: "https://img9.doubanio.com/view/subject/s/public/s28032794.jpg",
    isbn: "9787508634159",
    publicationYear: 1976,
    publisher: "中信出版社",
    category: "历史社科",
    tags: ["演化生物学", "觅母Meme", "利他行为本质", "达尔文主义", "科学经典"],
    summary: "颠覆人类自我认知的划时代科普巨著。提出生命个体不过是基因用来保存与复制自身的'生存机器'；提出著名'觅母（Meme）'概念，重新解释利他行为与文化传播的演化底层逻辑。",
    d: { score: 8.5, count: 210000, url: "https://book.douban.com/subject/10786473/" },
    g: { score: 4.15, count: 215000, url: "https://www.goodreads.com/book/show/61535.The_Selfish_Gene" },
    am: { score: 4.6, count: 28000, url: "https://www.amazon.com/dp/0198788606" },
    gg: { score: 4.4, count: 12000, url: "https://books.google.com/books?id=selfishgene" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "彻底改变人类观察世界视角的演化生物学经典，甚至发明了风靡全网的 Meme 一词。" },
    sentiment: {
      positivePct: 88, neutralPct: 8, negativePct: 4,
      pros: ["'人类是基因的载体机器人'的观点震荡灵魂，对亲情、利他与博弈的解释无懈可击", "道金斯文笔极其雄辩犀利，科学论证精彩绝伦"],
      cons: ["望文生义容易误解为教唆人自私自利（实则是探讨演化单元）"],
      keywords: ["自私的基因", "Meme", "演化论", "生存机器", "道金斯"]
    },
    review: { user: "理性的囚徒", platform: "douban", rating: 9, helpfulCount: 3890, content: "读完这本书最大的震撼在于：我们所珍视的崇高爱恋与牺牲，其背后竟是分子级别冷酷而精巧的数学博弈。" }
  },
  {
    id: "fang-si-qi",
    title: "房思琪的初恋乐园",
    originalTitle: "房思琪的初戀樂園",
    author: "林奕含",
    translator: null,
    cover: "https://img9.doubanio.com/view/subject/s/public/s29634731.jpg",
    isbn: "9787559614636",
    publicationYear: 2018,
    publisher: "北京联合出版公司",
    category: "文学小说",
    tags: ["女性主义", "诱奸与创伤", "林奕含遗作", "文学对暴力的反思", "直击灵魂"],
    summary: "作家林奕含的绝唱与遗作。讲述美丽聪慧的少女房思琪遭到补习班名师李国华长期诱奸与精神控制的惨痛经历，以极其精雕细琢的繁复汉语，质问'文学是否巧言令色，艺术是否巧言令色'。",
    d: { score: 9.2, count: 420000, url: "https://book.douban.com/subject/27614904/" },
    g: { score: 4.48, count: 18000, url: "https://www.goodreads.com/book/show/38590807" },
    am: { score: 4.8, count: 4200, url: "https://www.amazon.com/dp/7559614631" },
    gg: { score: 4.6, count: 2100, url: "https://books.google.com/books?id=fangsiqi" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "近十年中文世界最痛彻心扉的文学见证，字字滴血，彻底撕碎文化权贵对少女的精神凌虐。" },
    sentiment: {
      positivePct: 95, neutralPct: 3, negativePct: 2,
      pros: ["文字美到极致，也痛到极致，把受害者的心理撕裂与创伤记忆刻画得淋漓尽致", "对男权道貌岸然文学外衣的审判是当代华语文学的里程碑"],
      cons: ["创伤极度真实惨烈，心理承受力弱的读者容易产生严重的躯体化心理不适"],
      keywords: ["房思琪", "林奕含", "向死而生", "诱奸", "文学的巧言令色"]
    },
    review: { user: "张怡微", platform: "douban", rating: 10, helpfulCount: 9200, content: "忍痛读完，眼泪止不住地流。林奕含用生命写下的这部小说，不是控诉，是对世界最后的绝望质问。" }
  },
  {
    id: "the-myth-of-sisyphus",
    title: "西西弗神话",
    originalTitle: "Le Mythe de Sisyphe",
    author: "阿尔贝·加缪 (Albert Camus)",
    translator: "杜小真",
    cover: "https://img9.doubanio.com/view/subject/s/public/s28032792.jpg",
    isbn: "9787108047918",
    publicationYear: 1942,
    publisher: "生活·读书·新知三联书店",
    category: "哲学心理",
    tags: ["存在主义", "荒诞哲学", "推巨石上山", "反抗与自由", "加缪哲学原点"],
    summary: "加缪荒谬哲学的奠基之作。开篇直言'真正严肃的哲学问题只有一个，那就是自杀'。通过西西弗日复一日将巨石推上山顶又滚落的希腊神话，提出面对无意义荒谬世界的唯一出路——反抗与清醒地活着。",
    d: { score: 8.8, count: 98000, url: "https://book.douban.com/subject/25872704/" },
    g: { score: 4.14, count: 180000, url: "https://www.goodreads.com/book/show/11987.The_Myth_of_Sisyphus" },
    am: { score: 4.6, count: 14500, url: "https://www.amazon.com/dp/0525564454" },
    gg: { score: 4.5, count: 6800, url: "https://books.google.com/books?id=sisyphus" },
    verdict: { status: "masterpiece", label: "👑 殿堂神作", color: "emerald", reason: "给现代虚无主义者的终极解药，'应当想象西西弗是幸福的'振聋发聩鼓舞一代代人。" },
    sentiment: {
      positivePct: 91, neutralPct: 6, negativePct: 3,
      pros: ["承认世界的彻底荒谬，但坚决拒绝虚无自杀，提出以反抗与激情活在此刻", "神话隐喻力穿透古今，为陷入生活无休止内耗循环的人提供了莫大精神骨气"],
      cons: ["加缪欧化哲学文风偶有晦涩思辨段落"],
      keywords: ["西西弗", "荒诞哲学", "加缪", "推石上山", "幸福的反抗者"]
    },
    review: { user: "哲学漂流者", platform: "douban", rating: 10, helpfulCount: 4100, content: "西西弗回到巨石前的那一刻，是他对诸神最高的嘲弄。没有一种命运是不可被蔑视超越的。" }
  }
];

batch.forEach(item => {
  if (currentBooks.some(b => b.id === item.id || b.title === item.title)) return;
  const dScore = item.d.score;
  const gScore = item.g.score;
  const platformRatings = {
    douban: {
      score: dScore, scale: 10, ratingCount: item.d.count,
      fiveStarPct: Math.round(dScore * 7.5),
      starBreakdown: makeBreakdown(dScore),
      url: item.d.url
    },
    goodreads: {
      score: gScore, scale: 5, ratingCount: item.g.count,
      fiveStarPct: Math.round(gScore * 13),
      starBreakdown: makeBreakdown(gScore * 2),
      url: item.g.url
    },
    amazon: {
      score: item.am.score, scale: 5, ratingCount: item.am.count,
      fiveStarPct: 78, starBreakdown: makeBreakdown(item.am.score * 2),
      url: item.am.url
    },
    googleBooks: {
      score: item.gg.score, scale: 5, ratingCount: item.gg.count,
      fiveStarPct: 70, starBreakdown: makeBreakdown(item.gg.score * 2),
      url: item.gg.url
    }
  };
  const compositeScore = calcComp(platformRatings);
  const discrepancyIndex = Number(Math.abs(dScore - gScore * 2).toFixed(1));
  const normalizedRatings = {};
  for (const [k, v] of Object.entries(platformRatings)) {
    normalizedRatings[k] = { ...v, normalizedScore: v.scale === 5 ? Number((v.score * 2).toFixed(1)) : v.score };
  }
  currentBooks.push({
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
    featuredReviews: [
      {
        platform: item.review.platform,
        user: item.review.user,
        rating: item.review.rating,
        date: "2023-09-15",
        helpfulCount: item.review.helpfulCount,
        content: item.review.content
      }
    ]
  });
});

console.log(`Current books after batch: ${currentBooks.length}`);
fs.writeFileSync(path.join(__dirname, '../server/data/books.js'), `const books = ${JSON.stringify(currentBooks, null, 2)};\n\nmodule.exports = { books };\n`, 'utf8');
fs.writeFileSync(path.join(__dirname, '../client/src/data/staticBooks.json'), JSON.stringify(currentBooks, null, 2), 'utf8');
console.log('Done!');
