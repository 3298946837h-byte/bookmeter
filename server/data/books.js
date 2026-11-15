const { calculateCompositeScore, calculateDiscrepancy, getVerdict, normalizeScore } = require('../utils/scoring');

const rawBooks = [
  {
    id: "hundred-years-of-solitude",
    title: "百年孤独",
    originalTitle: "Cien años de soledad",
    author: "加西亚·马尔克斯 (Gabriel García Márquez)",
    translator: "范晔",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600",
    isbn: "9787544253994",
    publicationYear: 1967,
    publisher: "南海出版公司",
    category: "文学小说",
    tags: ["诺贝尔文学奖", "魔幻现实主义", "世界名著", "拉美文学", "孤独"],
    summary: "魔幻现实主义文学的集大成之作，描写了布恩迪亚家族七代人在虚构城镇马孔多的百年兴衰历程，展现了拉丁美洲历史的深沉、孤独与悲剧。",
    platformRatings: {
      douban: {
        score: 9.3,
        scale: 10,
        ratingCount: 421000,
        fiveStarPct: 73.2,
        url: "https://book.douban.com/subject/6082808/"
      },
      goodreads: {
        score: 4.12,
        scale: 5,
        ratingCount: 968000,
        fiveStarPct: 49.8,
        url: "https://www.goodreads.com/book/show/320.One_Hundred_Years_of_Solitude"
      },
      googleBooks: {
        score: 4.5,
        scale: 5,
        ratingCount: 18500,
        fiveStarPct: 68.0,
        url: "https://books.google.com/books?id=01"
      },
      amazon: {
        score: 4.6,
        scale: 5,
        ratingCount: 34200,
        fiveStarPct: 76.0,
        url: "https://www.amazon.com/dp/0060883286"
      }
    },
    sentiment: {
      positivePct: 91,
      neutralPct: 6,
      negativePct: 3,
      pros: [
        "文学结构精妙绝伦，魔幻与现实交织的叙事手法达到登峰造极之境",
        "范晔译本语言极富音律美与画面感，开篇第一句堪称世界文学史最伟大开篇之一",
        "深刻揭示人类深层存在的孤独感，宿命论与历史轮回的哲学体悟令人震撼"
      ],
      cons: [
        "人名极其重复（几代奥雷里亚诺与阿尔卡蒂奥），阅读需常备人物关系图表谱系",
        "非线性叙事与大量超现实意象，对普通读者阅读门槛较高，容易中途弃读"
      ],
      keywords: ["宿命感", "魔幻现实", "家族史诗", "人物谱系复杂", "文学巅峰"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "风之影",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-03-12",
        sentiment: "positive",
        content: "许多年之后，面对行刑队的奥雷里亚诺·布恩迪亚上校...范晔的译本太美了，将魔幻与现实的边界完全融化在加勒比海潮湿的空气里。读完最后一页马孔多被飓风抹去，那种宿命般的巨大空虚感久久不散。"
      },
      {
        platform: "goodreads",
        user: "Elena Vance",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
        rating: 4,
        date: "2023-11-20",
        sentiment: "neutral",
        content: "A masterpiece in prose, yet undeniably exhausting. Every male character shares one of two names, and their fates intertwine in dizzying loops. Beautiful, but requires immense patience."
      },
      {
        platform: "douban",
        user: "沉默的大多数",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        rating: 6,
        date: "2024-01-05",
        sentiment: "negative",
        content: "盛名之下其实难副其阅读快感。人名重名到怀疑人生，全书没有任何令人精神振奋的正面情绪，满篇都是乱伦、狂妄、内战与虚无，读得身心俱疲。"
      }
    ]
  },
  {
    id: "three-body-problem",
    title: "三体全集",
    originalTitle: "The Three-Body Problem Trilogy",
    author: "刘慈欣",
    translator: "Ken Liu (英译)",
    cover: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=600",
    isbn: "9787536692930",
    publicationYear: 2008,
    publisher: "重庆出版社",
    category: "科幻世界",
    tags: ["硬科幻", "雨果奖", "黑暗森林", "宇宙社会学", "降维打击"],
    summary: "中国当代科幻最高峰与雨果奖得奖巨作。描绘人类文明与三体文明在茫茫宇宙中的生死搏杀，提出著名的黑暗森林法则与宇宙社会学公理。",
    platformRatings: {
      douban: {
        score: 9.5,
        scale: 10,
        ratingCount: 680000,
        fiveStarPct: 79.5,
        url: "https://book.douban.com/subject/25814041/"
      },
      goodreads: {
        score: 4.28,
        scale: 5,
        ratingCount: 310000,
        fiveStarPct: 53.1,
        url: "https://www.goodreads.com/book/show/20518872-the-three-body-problem"
      },
      googleBooks: {
        score: 4.6,
        scale: 5,
        ratingCount: 22000,
        fiveStarPct: 72.0,
        url: "https://books.google.com/books?id=02"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 58000,
        fiveStarPct: 78.0,
        url: "https://www.amazon.com/dp/0765382032"
      }
    },
    sentiment: {
      positivePct: 94,
      neutralPct: 4,
      negativePct: 2,
      pros: [
        "宇宙社会学、黑暗森林、水滴、二向箔降维打击等硬科幻构想拥有撼动灵魂的宏大感",
        "故事节奏跌宕起伏，第三部《死神永生》将宇宙时间线拉至百亿年尺度，格局空前",
        "中西方顶级奖项与读者口碑双重认证，中国科幻的世界级标杆"
      ],
      cons: [
        "人物塑造尤其是女性角色与感情线偏向工具化和符号化，文学细腻度略显不足",
        "部分硬核物理学推演篇幅较长，对非理工科背景读者有一定认知门槛"
      ],
      keywords: ["黑暗森林", "二向箔", "降维打击", "宏大宇宙观", "科幻神作"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "北极星的眼泪",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-04-18",
        sentiment: "positive",
        content: "单凭‘毁灭你，与你何干’这一句话，和大刘构建的黑暗森林法则，就足以封神！第三部死神永生直接把人类的渺小刻画得体无完肤，看完全书抬头仰望星空，感觉整片夜空都在对我降维打击。"
      },
      {
        platform: "amazon",
        user: "David H. Miller",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120",
        rating: 5,
        date: "2023-09-14",
        sentiment: "positive",
        content: "Mind-bending concepts that Western sci-fi hasn't dared to explore in decades. The translation by Ken Liu maintains the profound philosophical chill of Chinese existential dread."
      },
      {
        platform: "goodreads",
        user: "Sarah Jenkins",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
        rating: 3,
        date: "2023-12-02",
        sentiment: "neutral",
        content: "Astonishing physics and cosmology concepts, but the characterization is flat cardboard. Characters feel like mere megaphones for theories rather than living, breathing humans."
      }
    ]
  },
  {
    id: "clean-code",
    title: "代码整洁之道",
    originalTitle: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin (Uncle Bob)",
    translator: "韩磊",
    cover: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
    isbn: "9787115216878",
    publicationYear: 2008,
    publisher: "人民邮电出版社",
    category: "计算机与技术",
    tags: ["软件工程", "重构", "程序员必读", "编程思想", "代码质量"],
    summary: "软件开发领域的传世经典指南，系统阐述了整洁代码的原则、模式与实践，涵盖命名、函数单一职责、注释、错误处理与单元测试等核心规范。",
    platformRatings: {
      douban: {
        score: 8.6,
        scale: 10,
        ratingCount: 18400,
        fiveStarPct: 49.3,
        url: "https://book.douban.com/subject/4199741/"
      },
      goodreads: {
        score: 4.41,
        scale: 5,
        ratingCount: 245000,
        fiveStarPct: 56.2,
        url: "https://www.goodreads.com/book/show/3735293-clean-code"
      },
      googleBooks: {
        score: 4.5,
        scale: 5,
        ratingCount: 5200,
        fiveStarPct: 65.0,
        url: "https://books.google.com/books?id=03"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 41000,
        fiveStarPct: 79.0,
        url: "https://www.amazon.com/dp/0132350882"
      }
    },
    sentiment: {
      positivePct: 87,
      neutralPct: 9,
      negativePct: 4,
      pros: [
        "对初中级程序员的代码审美与工程规范有醍醐灌顶的重塑作用",
        "童子军法则（让营地比你来时更干净）与函数单一职责原则极其经典实用",
        "大量真实Java重构实战对比，指导性与实操性极强"
      ],
      cons: [
        "部分教条主义倾向（例如函数不能超过20行、极端反对任何注释）在现代编程语言中过于死板",
        "示例代码全部基于早期的Java 5/6面向对象风格，对现代函数式、Go/Rust开发者存在技术代沟"
      ],
      keywords: ["重构", "可读性", "童子军法则", "单一职责", "代码规范"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "全栈老兵",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
        rating: 9,
        date: "2024-02-11",
        sentiment: "positive",
        content: "工作第二年读这本书拯救了我的职业生涯。学会了有意义的命名和抽取小函数，后来做code review的时候直接拿着当军规用。必读经典！"
      },
      {
        platform: "goodreads",
        user: "Alexandre",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
        rating: 3,
        date: "2023-08-19",
        sentiment: "neutral",
        content: "Contains great foundational wisdom, but don't treat it as religious dogma. The author's hatred of comments and obsession with 3-line functions can lead to spaghetti abstraction."
      }
    ]
  },
  {
    id: "sapiens-brief-history",
    title: "人类简史：从动物到上帝",
    originalTitle: "Sapiens: A Brief History of Humankind",
    author: "尤瓦尔·赫拉利 (Yuval Noah Harari)",
    translator: "林俊宏",
    cover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600",
    isbn: "9787508647357",
    publicationYear: 2014,
    publisher: "中信出版社",
    category: "历史社科",
    tags: ["认知革命", "人类学", "宏大历史", "全球畅销", "农业陷阱"],
    summary: "颠覆常识的全球现象级通识读物。以认知革命、农业革命和科学革命三大脉络，剖析智人如何通过‘虚构故事与集体想象’统一全球并走向神祇般的技术未来。",
    platformRatings: {
      douban: {
        score: 9.1,
        scale: 10,
        ratingCount: 385000,
        fiveStarPct: 62.8,
        url: "https://book.douban.com/subject/25985021/"
      },
      goodreads: {
        score: 4.35,
        scale: 5,
        ratingCount: 1250000,
        fiveStarPct: 54.3,
        url: "https://www.goodreads.com/book/show/23692271-sapiens"
      },
      googleBooks: {
        score: 4.6,
        scale: 5,
        ratingCount: 39000,
        fiveStarPct: 69.0,
        url: "https://books.google.com/books?id=04"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 89000,
        fiveStarPct: 77.0,
        url: "https://www.amazon.com/dp/0062316095"
      }
    },
    sentiment: {
      positivePct: 89,
      neutralPct: 7,
      negativePct: 4,
      pros: [
        "‘认知革命与虚构故事（想象的共同体）’核心洞见极其震撼，重新解释了货币、国家与宗教的本质",
        "笔触极为流畅风趣，将宏观人类学、生物学、经济学融会贯通，启发性拉满",
        "指出‘农业革命是历史上最大的骗局’，视角新颖独特，充满批判性思考"
      ],
      cons: [
        "部分历史学与人类学界学者批评其过度简化历史因果关系，存在宏大叙事的草率概括",
        "后期章节对幸福感与未来生物科技的论述略显散漫，不如前期的认知革命深刻"
      ],
      keywords: ["虚构故事", "认知革命", "农业骗局", "宏观通识", "全球畅销"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "青衫磊落",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-03-01",
        sentiment: "positive",
        content: "读完第一部《认知革命》整个人都被点醒了！原来智人之所以能碾压尼安德特人，根本不在于体能，而在于我们能够相信‘国家’、‘神明’和‘纸币’这些虚构的概念。视角无比开阔。"
      },
      {
        platform: "goodreads",
        user: "Professor Mark T.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        rating: 3,
        date: "2023-10-15",
        sentiment: "neutral",
        content: "A thrilling pop-science ride, but academically sloppy. Harari sweeps complex centuries of debate into broad, unverified generalizations. Great entertainment, questionable anthropology."
      }
    ]
  },
  {
    id: "rich-dad-poor-dad",
    title: "富爸爸穷爸爸",
    originalTitle: "Rich Dad Poor Dad",
    author: "罗伯特·清崎 (Robert T. Kiyosaki)",
    translator: "萧明",
    cover: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600",
    isbn: "9787508680903",
    publicationYear: 1997,
    publisher: "中信出版社",
    category: "商业经管",
    tags: ["财商启蒙", "资产负债", "两极分化", "畅销书", "争议"],
    summary: "全球最具争议的财商启蒙书之一。讲述两个爸爸不同的金钱观，提出‘资产产生现金流，负债产生支出’、跳出老鼠赛跑等理念，但作者本人的财务操盘与方法论备受质疑。",
    platformRatings: {
      douban: {
        score: 8.2,
        scale: 10,
        ratingCount: 162000,
        fiveStarPct: 41.5,
        url: "https://book.douban.com/subject/27116744/"
      },
      goodreads: {
        score: 4.11,
        scale: 5,
        ratingCount: 620000,
        fiveStarPct: 47.9,
        url: "https://www.goodreads.com/book/show/69571.Rich_Dad_Poor_Dad"
      },
      googleBooks: {
        score: 4.3,
        scale: 5,
        ratingCount: 15400,
        fiveStarPct: 58.0,
        url: "https://books.google.com/books?id=05"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 110000,
        fiveStarPct: 81.0,
        url: "https://www.amazon.com/dp/1612680194"
      }
    },
    sentiment: {
      positivePct: 68,
      neutralPct: 14,
      negativePct: 18,
      pros: [
        "‘资产与负债’的通俗化定义极其有力，彻底击碎普通人将自住房盲目视作资产的误区",
        "唤醒无数工薪族对‘被动收入’与‘财务自由’的意识，心理冲击力强",
        "语言浅显生动，没有繁杂数学公式，适合零基础读者开启理财启蒙"
      ],
      cons: [
        "书中关于房产炒作、避税与破产技巧缺乏合法合规实操性，作者旗下公司曾多次申请破产",
        "大量理念充斥成功学套路与虚构故事，存在严重的幸存者偏差与盲目杠杆风险",
        "严重贬低正规高等教育的价值，观点偏激武断"
      ],
      keywords: ["资产与负债", "老鼠赛跑", "争议很大", "成功学套路", "财商启蒙"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "理智投资客",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120",
        rating: 6,
        date: "2024-01-20",
        sentiment: "neutral",
        content: "理念可以拿来当警钟敲一敲（分清资产和负债），但千万别照着他的所谓实操去做！清崎鼓吹高杠杆炒房和投机，在现实中普通人跟着学大概率爆仓倾家荡产。"
      },
      {
        platform: "goodreads",
        user: "Financial Analyst Dan",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
        rating: 2,
        date: "2023-07-11",
        sentiment: "negative",
        content: "Mostly anecdotal snake oil. His definition of assets contradicts basic accounting, and his aggressive tax/debt advice borders on reckless illegality in many jurisdictions."
      },
      {
        platform: "amazon",
        user: "Young Entrepreneur",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
        rating: 5,
        date: "2024-02-15",
        sentiment: "positive",
        content: "Completely changed how I look at my paycheck. I stopped buying depreciating junk and started funneling cash into index funds and small businesses."
      }
    ]
  },
  {
    id: "miracles-of-namiya-store",
    title: "解忧杂货店",
    originalTitle: "ナミヤ雑貨店の奇蹟",
    author: "东野圭吾",
    translator: "李盈春",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
    isbn: "9787544270878",
    publicationYear: 2012,
    publisher: "南海出版公司",
    category: "文学小说",
    tags: ["东野圭吾", "治愈系", "温情推理", "口碑分化", "畅销王"],
    summary: "僻静街道旁的一家杂货店，只要写下烦恼投进卷帘门的投信口，第二天就会在牛奶箱里得到回信。五个时空交织的暖心故事，因时空信箱串联在一起。",
    platformRatings: {
      douban: {
        score: 8.5,
        scale: 10,
        ratingCount: 1120000,
        fiveStarPct: 45.3,
        url: "https://book.douban.com/subject/25862578/"
      },
      goodreads: {
        score: 4.14,
        scale: 5,
        ratingCount: 78000,
        fiveStarPct: 43.1,
        url: "https://www.goodreads.com/book/show/44088547-the-miracles-of-the-namiya-general-store"
      },
      googleBooks: {
        score: 4.3,
        scale: 5,
        ratingCount: 8900,
        fiveStarPct: 55.0,
        url: "https://books.google.com/books?id=06"
      },
      amazon: {
        score: 4.6,
        scale: 5,
        ratingCount: 14000,
        fiveStarPct: 74.0,
        url: "https://www.amazon.com/dp/1975382519"
      }
    },
    sentiment: {
      positivePct: 83,
      neutralPct: 11,
      negativePct: 6,
      pros: [
        "精巧的圆环形时空交错伏线结构，展现了东野圭吾高超的情节编织能力",
        "温暖治愈，褪去以往推理小说的阴暗残酷，充满对底层普通人的温情关怀",
        "阅读体验极度顺畅，‘白纸回信’的高潮收尾感人至深"
      ],
      cons: [
        "部分资深文学读者批评其‘鸡汤味过浓’、人物心理动机过分理想化甚至廉价",
        "后半程煽情套路较为刻意，与东野圭吾代表作《白夜行》《嫌疑人X的献身》的深度不可同日而语"
      ],
      keywords: ["治愈温暖", "环形时空", "鸡汤嫌疑", "营销大热", "通俗畅销"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "温暖如初",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-03-08",
        sentiment: "positive",
        content: "在最低谷的时候看哭了。那张白纸的回答：正因为是一张白纸，才可以随心所欲地描绘地图。世界上如果有这样一家杂货店该有多好啊。"
      },
      {
        platform: "douban",
        user: "冷眼看书人",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
        rating: 5,
        date: "2023-12-14",
        sentiment: "negative",
        content: "东野圭吾最流水线的一部作品，本质上就是一本高智商鸡汤合集。没有本格推理的严谨，也没有社会派的深刻刺痛，全靠巧合与煽情维系。"
      }
    ]
  },
  {
    id: "metaverse-bubble-hype",
    title: "元宇宙狂潮：开启人类未来新维度",
    originalTitle: "The Metaverse Phenomenon",
    author: "张某某 / 某前沿商业研究室",
    translator: "无",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
    isbn: "9787999812345",
    publicationYear: 2021,
    publisher: "某快速出版机构",
    category: "商业经管",
    tags: ["避坑预警", "概念炒作", "拼凑内容", "蹭热点", "低分"],
    summary: "2021年元宇宙概念火爆时应运而生的快餐书。大量摘录网络百科、新闻通稿与投行PPT，充斥宏大却空洞的造词狂欢，缺乏实际技术落地与严谨论据。",
    platformRatings: {
      douban: {
        score: 4.8,
        scale: 10,
        ratingCount: 3200,
        fiveStarPct: 4.2,
        url: "https://book.douban.com/subject/35600000/"
      },
      goodreads: {
        score: 2.75,
        scale: 5,
        ratingCount: 1800,
        fiveStarPct: 9.1,
        url: "https://www.goodreads.com/book/show/99999"
      },
      googleBooks: {
        score: 2.8,
        scale: 5,
        ratingCount: 420,
        fiveStarPct: 8.0,
        url: "https://books.google.com/books?id=07"
      },
      amazon: {
        score: 3.1,
        scale: 5,
        ratingCount: 890,
        fiveStarPct: 15.0,
        url: "https://www.amazon.com/dp/B09FAKE001"
      }
    },
    sentiment: {
      positivePct: 18,
      neutralPct: 22,
      negativePct: 60,
      pros: [
        "对完全不知道元宇宙是什么的外行提供了粗浅的概念汇总词汇表",
        "装帧与副标题非常吸引眼球，营销包装精美"
      ],
      cons: [
        "通篇为新闻稿与投行研报的大杂烩洗稿，充斥大量未经验证的技术狂言与虚假泡沫",
        "无核心原创观点，概念偷换严重，将VR、区块链、数字孪生简单生搬硬套",
        "定价虚高，典型的收割热点跟风劣质快餐读物，极不建议购买"
      ],
      keywords: ["概念炒作", "东拼西凑", "避坑差评", "割韭菜", "空洞无物"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "科技观察员Leo",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
        rating: 2,
        date: "2023-05-19",
        sentiment: "negative",
        content: "纯粹的垃圾拼凑书！全书看下来就是百度百科+券商研报直接机翻缝合，连基本的分布式系统常识都没有。骗读者钱包的劣质跟风之作，大家千万避坑！"
      },
      {
        platform: "amazon",
        user: "Disappointed Techie",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120",
        rating: 1,
        date: "2023-04-10",
        sentiment: "negative",
        content: "Read like a collection of buzzwords generated by a 2021 sales brochure. Zero technical depth, zero realistic insights. Pure hype."
      }
    ]
  },
  {
    id: "to-live",
    title: "活着",
    originalTitle: "To Live",
    author: "余华",
    translator: "Michael Berry (英译)",
    cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600",
    isbn: "9787506365437",
    publicationYear: 1993,
    publisher: "作家出版社",
    category: "文学小说",
    tags: ["当代文学", "余华", "苦难史诗", "国民经典", "高分神作"],
    summary: "中国当代文学最高峰之一。地主少爷福贵嗜赌成性输光家产沦为贫农，在往后的漫长岁月中，亲历战争、灾荒与动荡，亲人相继离他而去，最后唯有一头老牛与他相依为命。",
    platformRatings: {
      douban: {
        score: 9.4,
        scale: 10,
        ratingCount: 795000,
        fiveStarPct: 76.8,
        url: "https://book.douban.com/subject/4913064/"
      },
      goodreads: {
        score: 4.42,
        scale: 5,
        ratingCount: 115000,
        fiveStarPct: 57.8,
        url: "https://www.goodreads.com/book/show/330999.To_Live"
      },
      googleBooks: {
        score: 4.7,
        scale: 5,
        ratingCount: 16800,
        fiveStarPct: 75.0,
        url: "https://books.google.com/books?id=08"
      },
      amazon: {
        score: 4.8,
        scale: 5,
        ratingCount: 28000,
        fiveStarPct: 83.0,
        url: "https://www.amazon.com/dp/1400031869"
      }
    },
    sentiment: {
      positivePct: 96,
      neutralPct: 3,
      negativePct: 1,
      pros: [
        "语言洗练质朴到了极致，毫无雕饰感，却具有穿透纸背的震撼力量",
        "‘人是为了活着本身而活着，而不是为了活着之外的任何事物所活着’这一命题直击灵魂",
        "苦难叙事不矫情不怨怼，福贵平静叙述口吻下涌动的生命韧性令人落泪"
      ],
      cons: [
        "情节极度悲惨致郁，亲人相继离世的密集冲击可能导致部分读者心理压抑不适"
      ],
      keywords: ["生命韧性", "余华代表作", "质朴深沉", "当代经典", "万人垂泪"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "月落乌啼",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-04-02",
        sentiment: "positive",
        content: "余华用最克制的文字写尽了世间最惨烈的离别。有庆抽血而死、凤霞大出血、家珍病死、二喜工伤、苦根吃豆子撑死...读完坐在窗前大哭一场。但合上书本，福贵哼着歌赶着老牛的背影，又给了我无比巨大的活着的力量。"
      },
      {
        platform: "goodreads",
        user: "James K.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        rating: 5,
        date: "2023-11-09",
        sentiment: "positive",
        content: "A devastating masterpiece. It shows human resilience stripped of romanticism or heroic delusion. Fugui's voice will stay with me for the rest of my life."
      }
    ]
  },
  {
    id: "csapp-computer-systems",
    title: "深入理解计算机系统",
    originalTitle: "Computer Systems: A Programmer's Perspective (CS:APP)",
    author: "Randal E. Bryant / David R. O'Hallaron",
    translator: "龚奕利 / 贺莲",
    cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600",
    isbn: "9787111544937",
    publicationYear: 2016,
    publisher: "机械工业出版社",
    category: "计算机与技术",
    tags: ["底层原理", "操作系统", "经典教材", "程序员内功", "高分力作"],
    summary: "全球计算机科学圣经级读物。从程序员的视角切入，融汇信息表示、汇编语言、处理器架构、优化、存储器层次结构、链接、异常控制流与网络编程，打通计算机全栈底层认知。",
    platformRatings: {
      douban: {
        score: 9.8,
        scale: 10,
        ratingCount: 22800,
        fiveStarPct: 88.6,
        url: "https://book.douban.com/subject/26912767/"
      },
      goodreads: {
        score: 4.67,
        scale: 5,
        ratingCount: 38000,
        fiveStarPct: 76.5,
        url: "https://www.goodreads.com/book/show/829182.Computer_Systems"
      },
      googleBooks: {
        score: 4.8,
        scale: 5,
        ratingCount: 3100,
        fiveStarPct: 84.0,
        url: "https://books.google.com/books?id=09"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 6200,
        fiveStarPct: 82.0,
        url: "https://www.amazon.com/dp/013409266X"
      }
    },
    sentiment: {
      positivePct: 98,
      neutralPct: 2,
      negativePct: 0,
      pros: [
        "融会贯通硬件与软件的桥梁之作，读完后对程序的执行过程再无黑盒迷茫",
        "配套实验（Data Lab, Bomb Lab, Cache Lab, Malloc Lab）设计堪称神工鬼斧",
        "逻辑极其严谨，由浅入深，技术人职业生涯最值得反复研读的底蕴之作"
      ],
      cons: [
        "近千页的大部头厚重如砖，需要投入数月时间与扎实的C语言功底，啃读难度极大"
      ],
      keywords: ["计算机圣经", "打通任督二脉", "硬核内功", "Lab神作", "9.8分超神"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "KernelDev",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-03-22",
        sentiment: "positive",
        content: "如果大学四年计算机专业只能留下一本书，那我毫不犹豫选CSAPP！做完Bomb Lab和Cache Lab的那一刻，真的感觉全身任督二脉都被打通了，从汇编到虚拟内存再到链接器，所有的碎知识全连成了坚固的网络！"
      }
    ]
  },
  {
    id: "mechanical-heart-disaster-translation",
    title: "机械心（某争议翻车译本）",
    originalTitle: "La mécanique du cœur",
    author: "马提亚斯·马尔齐乌 (Mathias Malzieu)",
    translator: "某争议译者",
    cover: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600",
    isbn: "9787999819999",
    publicationYear: 2018,
    publisher: "某地方少儿文艺社",
    category: "文学小说",
    tags: ["避坑预警", "机翻翻车", "译本踩雷", "读者怒批", "负面示范"],
    summary: "法国极富诗意与蒸汽朋克浪漫的童话经典，原著口碑极佳。然而该版本因粗制滥造的机翻、语病连篇及错译漏译引发全网读者声讨与低分退书潮。",
    platformRatings: {
      douban: {
        score: 4.1,
        scale: 10,
        ratingCount: 5400,
        fiveStarPct: 3.5,
        url: "https://book.douban.com/subject/00000000/"
      },
      goodreads: {
        score: 3.92,
        scale: 5,
        ratingCount: 45000,
        fiveStarPct: 32.0,
        url: "https://www.goodreads.com/book/show/2887309-the-boy-with-the-cuckoo-clock-heart"
      },
      googleBooks: {
        score: 4.0,
        scale: 5,
        ratingCount: 1200,
        fiveStarPct: 40.0,
        url: "https://books.google.com/books?id=10"
      },
      amazon: {
        score: 4.4,
        scale: 5,
        ratingCount: 3800,
        fiveStarPct: 62.0,
        url: "https://www.amazon.com/dp/030747587X"
      }
    },
    sentiment: {
      positivePct: 15,
      neutralPct: 18,
      negativePct: 67,
      pros: [
        "原著本身的世界观设定精巧浪漫（主角装着咕咕钟心脏不能动情）"
      ],
      cons: [
        "典型译本翻车案例：Goodreads原版高达3.92星，中文该译本在豆瓣被怒打4.1分",
        "大量语句不通顺，欧化长句与机翻感极为明显，破坏了原著优美的法式童话韵味",
        "错译成语、主谓倒装严重，读者普遍呼吁避开该出版社与译者，认准权威新译"
      ],
      keywords: ["翻译翻车", "避坑退书", "机翻灾难", "原著背锅", "毁经典"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "法语文学爱好者",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
        rating: 2,
        date: "2023-09-03",
        sentiment: "negative",
        content: "译者到底懂不懂法文和中文？！第一章就出现三处常识性错译，句子颠三倒四，连百度机翻都不如！一部绝美的蒸汽朋克童话就这么被这个劣质译本活活给糟蹋了，大家买书前一定要看译者避雷！"
      },
      {
        platform: "goodreads",
        user: "Claire M.",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
        rating: 4,
        date: "2022-08-11",
        sentiment: "positive",
        content: "A bittersweet Parisian fairy tale filled with whimsy and melancholy. Mathias Malzieu writes with such poetic magic in the original French."
      }
    ]
  },
  {
    id: "the-secret-law-of-attraction",
    title: "秘密：吸引力法则",
    originalTitle: "The Secret",
    author: "朗达·拜恩 (Rhonda Byrne)",
    translator: "胡娆",
    cover: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600",
    isbn: "9787532746408",
    publicationYear: 2006,
    publisher: "上海译文出版社",
    category: "哲学心理",
    tags: ["吸引力法则", "伪科学争议", "身心启蒙", "两极撕裂", "畅销神话"],
    summary: "全球狂销数千万册的超级现象级畅销书。宣称宇宙存在‘吸引力法则’，只要心中坚定渴望并发出振动频率，财富、健康与爱情就会被吸引而来。引发科学界与心理学界的剧烈抨击。",
    platformRatings: {
      douban: {
        score: 6.9,
        scale: 10,
        ratingCount: 132000,
        fiveStarPct: 22.4,
        url: "https://book.douban.com/subject/3233804/"
      },
      goodreads: {
        score: 3.74,
        scale: 5,
        ratingCount: 480000,
        fiveStarPct: 35.8,
        url: "https://www.goodreads.com/book/show/52529.The_Secret"
      },
      googleBooks: {
        score: 4.1,
        scale: 5,
        ratingCount: 19000,
        fiveStarPct: 48.0,
        url: "https://books.google.com/books?id=11"
      },
      amazon: {
        score: 4.6,
        scale: 5,
        ratingCount: 72000,
        fiveStarPct: 75.0,
        url: "https://www.amazon.com/dp/1582701709"
      }
    },
    sentiment: {
      positivePct: 52,
      neutralPct: 15,
      negativePct: 33,
      pros: [
        "积极的心理暗示疗愈效果，为陷入迷茫或抑郁的读者提供了一定的情绪希望与自信重塑",
        "阅读极其轻松，配图唯美，仪式感拉满"
      ],
      cons: [
        "披着量子物理与量子力学伪科学外衣的唯心主义神秘学，缺乏任何可验证的实证支持",
        "极端危险的‘受害者有罪论’隐患（声称所有疾病与苦难都是因为你思想不够纯净吸引来的）",
        "逃避现实行动，助长不劳而获的幻想"
      ],
      keywords: ["伪科学争议", "吸引力法则", "心理暗示", "受害者有罪论", "争议两极"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "科学松鼠小王",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        rating: 2,
        date: "2023-11-18",
        sentiment: "negative",
        content: "披着所谓‘宇宙量子振动’羊皮的现代巫术传销！如果靠天天闭眼想钱就能发财，世界上怎么还会有穷人？最恶心的是它暗示生重病的人是因为自己‘负能量招来的’，毫无医学道德底线！"
      },
      {
        platform: "amazon",
        user: "Mindful Reader",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
        rating: 5,
        date: "2023-04-12",
        sentiment: "positive",
        content: "Take the quantum talk with a grain of salt, but the cognitive reframing is real. Focusing on gratitude and positive outcomes genuinely transformed my daily motivation."
      }
    ]
  },
  {
    id: "almanack-of-naval-ravikant",
    title: "纳瓦尔宝典",
    originalTitle: "The Almanack of Naval Ravikant",
    author: "埃里克·乔根森 (Eric Jorgenson)",
    translator: "赵灿",
    cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600",
    isbn: "9787521741124",
    publicationYear: 2020,
    publisher: "中信出版集团",
    category: "商业经管",
    tags: ["财富哲学", "杠杆率", "幸福指南", "硅谷教父", "好评如潮"],
    summary: "硅谷著名投资人纳瓦尔·拉威康特的智慧箴言录。深入探讨如何不靠运气致富、构建专属杠杆（代码与媒体）、培养判断力，以及如何追求内心的平静与持久幸福。",
    platformRatings: {
      douban: {
        score: 8.6,
        scale: 10,
        ratingCount: 64000,
        fiveStarPct: 48.9,
        url: "https://book.douban.com/subject/35887201/"
      },
      goodreads: {
        score: 4.54,
        scale: 5,
        ratingCount: 142000,
        fiveStarPct: 66.8,
        url: "https://www.goodreads.com/book/show/54898389-the-almanack-of-naval-ravikant"
      },
      googleBooks: {
        score: 4.7,
        scale: 5,
        ratingCount: 12000,
        fiveStarPct: 77.0,
        url: "https://books.google.com/books?id=12"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 36000,
        fiveStarPct: 81.0,
        url: "https://www.amazon.com/dp/1544514212"
      }
    },
    sentiment: {
      positivePct: 92,
      neutralPct: 6,
      negativePct: 2,
      pros: [
        "区分‘地位博弈’与‘财富创造’，关于边际成本为零的杠杆（代码与媒体）论述一针见血",
        "语言极为凝练，没有丝毫废话与拖沓，每一条推文箴言都值得反复咀嚼",
        "财富与幸福兼顾，既有硬核的商业底层逻辑，又有通透的东方式禅宗智慧"
      ],
      cons: [
        "全书由播客与推特推文整理而成，篇章结构较为零碎，缺乏长篇论著的体系推导"
      ],
      keywords: ["边际成本为零", "商业杠杆", "内心平静", "不靠运气致富", "硅谷哲学"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "独立开发者Tom",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-02-28",
        sentiment: "positive",
        content: "颠覆了我对‘致富’的理解！纳瓦尔说得太清楚了：出卖时间永远无法获得财富自由，你必须拥有资产、拥有边际成本为零的代码或媒体杠杆。独立开发者和内容创作者的圣经！"
      }
    ]
  },
  {
    id: "siddhartha",
    title: "悉达多",
    originalTitle: "Siddhartha",
    author: "赫尔曼·黑塞 (Hermann Hesse)",
    translator: "姜乙",
    cover: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
    isbn: "9787201111681",
    publicationYear: 1922,
    publisher: "天津人民出版社",
    category: "哲学心理",
    tags: ["诺奖得主", "灵性成长", "姜乙译本", "寻找自我", "精神疗愈"],
    summary: "诺贝尔文学奖得主黑塞的心灵探索名作。古印度青年悉达多经历苦行、情欲、财富与绝望，最终在一条大河边聆听万物的声音，体悟到圆满与解脱的真谛。",
    platformRatings: {
      douban: {
        score: 9.3,
        scale: 10,
        ratingCount: 198000,
        fiveStarPct: 71.3,
        url: "https://book.douban.com/subject/26980486/"
      },
      goodreads: {
        score: 4.07,
        scale: 5,
        ratingCount: 720000,
        fiveStarPct: 45.1,
        url: "https://www.goodreads.com/book/show/52036.Siddhartha"
      },
      googleBooks: {
        score: 4.5,
        scale: 5,
        ratingCount: 14000,
        fiveStarPct: 65.0,
        url: "https://books.google.com/books?id=13"
      },
      amazon: {
        score: 4.6,
        scale: 5,
        ratingCount: 42000,
        fiveStarPct: 76.0,
        url: "https://www.amazon.com/dp/0553208845"
      }
    },
    sentiment: {
      positivePct: 93,
      neutralPct: 5,
      negativePct: 2,
      pros: [
        "姜乙译本文风凝练圣洁，如晨钟暮鼓般抚平读者内心的浮躁与焦虑",
        "深刻阐述‘真理是不可教授的，唯有亲身体验’这一东方哲学智慧",
        "短小精悍却直击灵魂，是浮躁现代人洗涤精神内耗的良药"
      ],
      cons: [
        "全书寓言化倾向明显，情节简单，对于偏好紧凑戏剧冲突的读者可能会觉得平淡"
      ],
      keywords: ["精神洗礼", "姜乙绝美翻译", "黑塞经典", "倾听大河", "寻找真我"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "静水流深",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-04-12",
        sentiment: "positive",
        content: "‘知识可以传授，智慧却无法相授。’姜乙的译文像泉水一样清冽。在每一个感到精神迷茫与内耗的时刻，重新翻开悉达多坐在河边的章节，内心就会重归平静。"
      }
    ]
  },
  {
    id: "chip-war-semiconductors",
    title: "芯片战争",
    originalTitle: "Chip War: The Fight for the World's Most Critical Technology",
    author: "克里斯·米勒 (Chris Miller)",
    translator: "蔡树军",
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
    isbn: "9787213109300",
    publicationYear: 2023,
    publisher: "浙江人民出版社",
    category: "历史社科",
    tags: ["重磅新书", "地缘政治", "半导体", "金融时报年度最佳", "技术史"],
    isNewRelease: true,
    summary: "《金融时报》年度最佳商业图书。深度解密微芯片如何成为现代世界的‘新石油’，全景展现英特尔、台积电、阿斯麦（ASML）、三星等巨头崛起与全球芯片冷战博弈。",
    platformRatings: {
      douban: {
        score: 8.5,
        scale: 10,
        ratingCount: 38200,
        fiveStarPct: 45.1,
        url: "https://book.douban.com/subject/36319808/"
      },
      goodreads: {
        score: 4.45,
        scale: 5,
        ratingCount: 42000,
        fiveStarPct: 58.2,
        url: "https://www.goodreads.com/book/show/60321447-chip-war"
      },
      googleBooks: {
        score: 4.6,
        scale: 5,
        ratingCount: 3800,
        fiveStarPct: 69.0,
        url: "https://books.google.com/books?id=chipwar"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 12500,
        fiveStarPct: 78.0,
        url: "https://www.amazon.com/dp/1982172002"
      }
    },
    sentiment: {
      positivePct: 90,
      neutralPct: 7,
      negativePct: 3,
      pros: [
        "宏大的历史视野与扎实的行业内幕调研，将冰冷的晶圆光刻机写得惊心动魄",
        "精准梳理了ASML极紫外光刻机（EUV）如何赌上国运突破物理极限的传奇",
        "理解现代大国科技博弈与供应链命脉的不可多得必读大作"
      ],
      cons: [
        "作为美国学者著作，地缘政治叙事带有较强西方中心主义视角",
        "后半部分涉及未来博弈推演略有仓促"
      ],
      keywords: ["光刻机", "台积电", "地缘科技", "半导体史诗", "2023重磅"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "硬科技观察者",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
        rating: 9,
        date: "2024-01-10",
        sentiment: "positive",
        content: "绝对是这几年读过最好的科技商业通识读物！把半导体从实验室到变成地缘战略武器的脉络理得一清二楚。看完才真正明白为什么ASML的一台光刻机会卡住全球脖子。"
      }
    ]
  },
  {
    id: "inside-the-system-china-economy",
    title: "置身事内：中国政府与经济发展",
    originalTitle: "How China Works: Government and Economic Development",
    author: "兰小欢",
    translator: "无",
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
    isbn: "9787208171299",
    publicationYear: 2021,
    publisher: "上海人民出版社",
    category: "历史社科",
    tags: ["经济学神作", "地方政府", "土地财政", "国内权威", "近年顶流"],
    isNewRelease: true,
    summary: "近年国内口碑最炸裂的经济学著作之一。以地方政府投融资为主线，深入浅出剖析土地财政、招商引资、城市化与债务风险，打通宏观政策与微观现实的认知壁垒。",
    platformRatings: {
      douban: {
        score: 9.1,
        scale: 10,
        ratingCount: 245000,
        fiveStarPct: 62.1,
        url: "https://book.douban.com/subject/35546622/"
      },
      goodreads: {
        score: 4.58,
        scale: 5,
        ratingCount: 12000,
        fiveStarPct: 68.5,
        url: "https://www.goodreads.com/book/show/58882084"
      },
      googleBooks: {
        score: 4.7,
        scale: 5,
        ratingCount: 2100,
        fiveStarPct: 76.0,
        url: "https://books.google.com/books?id=insidesystem"
      },
      amazon: {
        score: 4.8,
        scale: 5,
        ratingCount: 4200,
        fiveStarPct: 82.0,
        url: "https://www.amazon.com/dp/7208171299"
      }
    },
    sentiment: {
      positivePct: 95,
      neutralPct: 4,
      negativePct: 1,
      pros: [
        "没有任何晦涩数学模型，用通俗接地气的语言讲透了中国地方政府的运转逻辑与土地财政",
        "笔触务实中肯，既看到举国体制大搞基建的辉煌成就，也冷静指出产能过剩与债务灰犀牛",
        "文末每章附带极高质量的拓展书单与参考文献，治学态度极度严谨"
      ],
      cons: [
        "对完全没有经济学和财经新闻常识的读者，后半部分的债务重组与宏观调控有一定烧脑度"
      ],
      keywords: ["土地财政", "地方债务", "通俗透彻", "国内经济学封神", "9.1超高分"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "宏观行者",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-03-15",
        sentiment: "positive",
        content: "这本书解答了我过去十几年看财经新闻所有的困惑！读完才知道，为什么地方政府热衷建工业园、为什么城投债这么庞大、为什么房价与地价息息相关。兰小欢教授功德无量！"
      }
    ]
  },
  {
    id: "elon-musk-biography-isaacson",
    title: "埃隆·马斯克传",
    originalTitle: "Elon Musk",
    author: "沃尔特·艾萨克森 (Walter Isaacson)",
    translator: "孙思远 等",
    cover: "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&q=80&w=600",
    isbn: "9787521759242",
    publicationYear: 2023,
    publisher: "中信出版集团",
    category: "商业经管",
    tags: ["2023全球热议", "马斯克传", "两极争议", "SpaceX", "狂人实录"],
    isNewRelease: true,
    summary: "《乔布斯传》作者艾萨克森近身跟访两年的权威巨著。完整记录马斯克在特斯拉、SpaceX、星链以及充满争议收购推特（X）背后的疯狂与恶魔人格。",
    platformRatings: {
      douban: {
        score: 8.1,
        scale: 10,
        ratingCount: 78000,
        fiveStarPct: 38.6,
        url: "https://book.douban.com/subject/36531980/"
      },
      goodreads: {
        score: 4.24,
        scale: 5,
        ratingCount: 135000,
        fiveStarPct: 48.9,
        url: "https://www.goodreads.com/book/show/122765395-elon-musk"
      },
      googleBooks: {
        score: 4.4,
        scale: 5,
        ratingCount: 8900,
        fiveStarPct: 62.0,
        url: "https://books.google.com/books?id=muskbio"
      },
      amazon: {
        score: 4.6,
        scale: 5,
        ratingCount: 48000,
        fiveStarPct: 76.0,
        url: "https://www.amazon.com/dp/1982181281"
      }
    },
    sentiment: {
      positivePct: 76,
      neutralPct: 12,
      negativePct: 12,
      pros: [
        "第一手近身观察素材极其生动，不避讳马斯克的暴躁、缺乏同理心与‘恶魔模式’",
        "五步工作法（质疑要求、删除无用部分、简化优化、加速周期、自动化）极具工程管理实操启发",
        "全景展现火箭回收与电动车量产地狱的惊心动魄"
      ],
      cons: [
        "作者艾萨克森有时陷入对主角超人魅力的沉溺，批判性与独立思考不如其之前的《达芬奇传》",
        "收购推特部分琐碎繁杂，叙事节奏略显冗长"
      ],
      keywords: ["恶魔模式", "五步工作法", "两极争议", "狂人传记", "近身实录"]
    },
    featuredReviews: [
      {
        platform: "goodreads",
        user: "Silicon Reader",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        rating: 4,
        date: "2023-10-22",
        sentiment: "neutral",
        content: "A thrilling portrait of a deeply fractured genius. He drives humanity forward while driving every human being around him insane."
      }
    ]
  },
  {
    id: "my-altay-lijuan",
    title: "我的阿勒泰",
    originalTitle: "My Altay",
    author: "李娟",
    translator: "无",
    cover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600",
    isbn: "9787544299839",
    publicationYear: 2024,
    publisher: "花城出版社",
    category: "文学小说",
    tags: ["2024顶流", "当代散文", "李娟", "治愈天花板", "高分神作"],
    isNewRelease: true,
    summary: "2024年现象级爆火的治愈文学代表作。李娟以清澈明亮的笔触记录北疆阿勒泰边陲戈壁深处牧民生活的寂寞与自在，呈现出生命天然纯粹的灵动美感。",
    platformRatings: {
      douban: {
        score: 9.0,
        scale: 10,
        ratingCount: 168000,
        fiveStarPct: 61.4,
        url: "https://book.douban.com/subject/35390757/"
      },
      goodreads: {
        score: 4.41,
        scale: 5,
        ratingCount: 8900,
        fiveStarPct: 56.0,
        url: "https://www.goodreads.com/book/show/176916521"
      },
      googleBooks: {
        score: 4.6,
        scale: 5,
        ratingCount: 1400,
        fiveStarPct: 70.0,
        url: "https://books.google.com/books?id=altay"
      },
      amazon: {
        score: 4.8,
        scale: 5,
        ratingCount: 5200,
        fiveStarPct: 83.0,
        url: "https://www.amazon.com/dp/7544299839"
      }
    },
    sentiment: {
      positivePct: 96,
      neutralPct: 3,
      negativePct: 1,
      pros: [
        "文字极其干净透亮，天然去雕饰，充满如林间泉水般的生机与灵气",
        "不仅写风景，更写恶劣自然条件下普通人毫无怨尤的坦荡与乐观生命力",
        "精神内耗时代的天然解药，阅读体验极度舒适治愈"
      ],
      cons: [
        "属于随笔散文集，缺乏紧凑戏剧性主线情节，适合慢节奏分段品读"
      ],
      keywords: ["透亮文字", "精神疗愈", "阿勒泰", "当代散文经典", "2024爆款"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "旷野的风",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-05-18",
        sentiment: "positive",
        content: "李娟的文字有一种让人瞬间安静下来的神奇魔力。没有大惊小怪的赞叹，只是平静地写母亲的裁缝铺、写荒原上的野兔子。在这个喧嚣焦虑的时代，这碗纯净的山泉水太珍贵了！"
      }
    ]
  },
  {
    id: "starting-from-the-limit-ueno",
    title: "始于极限：女性主义往复书信",
    originalTitle: "往復書簡 限界から始まる",
    author: "上野千鹤子 / 铃木凉美",
    translator: "曹逸冰",
    cover: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600",
    isbn: "9787513349758",
    publicationYear: 2022,
    publisher: "新星出版社",
    category: "历史社科",
    tags: ["女性主义", "年度顶流畅销", "真实对话", "社会学", "高分力作"],
    isNewRelease: true,
    summary: "当代女性主义学者上野千鹤子与原AV女优、前记者铃木凉美历时一年的十二次回信。坦诚交锋关于恋爱、性、婚姻、工作、独立的尖锐命题。",
    platformRatings: {
      douban: {
        score: 9.0,
        scale: 10,
        ratingCount: 289000,
        fiveStarPct: 61.2,
        url: "https://book.douban.com/subject/35999086/"
      },
      goodreads: {
        score: 4.48,
        scale: 5,
        ratingCount: 32000,
        fiveStarPct: 62.1,
        url: "https://www.goodreads.com/book/show/60451833"
      },
      googleBooks: {
        score: 4.6,
        scale: 5,
        ratingCount: 2800,
        fiveStarPct: 71.0,
        url: "https://books.google.com/books?id=uenolimit"
      },
      amazon: {
        score: 4.7,
        scale: 5,
        ratingCount: 9800,
        fiveStarPct: 79.0,
        url: "https://www.amazon.com/dp/7513349758"
      }
    },
    sentiment: {
      positivePct: 93,
      neutralPct: 5,
      negativePct: 2,
      pros: [
        "上野千鹤子的回信如手术刀般精准剔透，毫不留情地解构弱者内心的自欺与妥协",
        "不回避真实人性幽微复杂的情欲与恐惧，对话诚恳赤裸到了令人震撼的程度",
        "‘不要糊弄自己，活出不糊弄的人生’赋能无数迷茫年轻读者"
      ],
      cons: [
        "铃木凉美的部分来信略带矫饰与优越感的防备姿态，部分读者读来略感拧巴"
      ],
      keywords: ["上野千鹤子", "清醒不糊弄", "往复书信", "年度现象级", "女性主义"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "野蔷薇",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
        rating: 10,
        date: "2024-02-14",
        sentiment: "positive",
        content: "上野老师真的太温柔也太犀利了！每一句话都像是一记耳光，把你从‘自怜自艾’的泥潭里打醒。看完立刻明白了什么叫真正的清醒独立。"
      }
    ]
  },
  {
    id: "ai-make-money-hype-trap",
    title: "普通人AI玩赚指南：轻松月入十万的实操课",
    originalTitle: "AI Money Making Blueprint",
    author: "某AI知识博主 / 暴富研究社",
    translator: "无",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
    isbn: "9787999812999",
    publicationYear: 2024,
    publisher: "某快速出版印刷所",
    category: "商业经管",
    tags: ["2024新书避坑", "割韭菜", "低质营销", "翻车预警", "差评如潮"],
    isNewRelease: true,
    summary: "乘着ChatGPT与大模型热潮粗制滥造的快餐焦虑割韭菜读物。内容大多是网络免费Prompt指令与生成图片的初级拼凑，辅以大量虚假造富案例与卖课引流广告。",
    platformRatings: {
      douban: {
        score: 3.8,
        scale: 10,
        ratingCount: 6200,
        fiveStarPct: 2.1,
        url: "https://book.douban.com/subject/00000001/"
      },
      goodreads: {
        score: 2.21,
        scale: 5,
        ratingCount: 1400,
        fiveStarPct: 5.0,
        url: "https://www.goodreads.com/book/show/00000001"
      },
      googleBooks: {
        score: 2.5,
        scale: 5,
        ratingCount: 320,
        fiveStarPct: 6.0,
        url: "https://books.google.com/books?id=aitrap"
      },
      amazon: {
        score: 2.7,
        scale: 5,
        ratingCount: 950,
        fiveStarPct: 10.0,
        url: "https://www.amazon.com/dp/B0FAKEAI01"
      }
    },
    sentiment: {
      positivePct: 11,
      neutralPct: 14,
      negativePct: 75,
      pros: [
        "书里贴了几页Midjourney和ChatGPT最基础的注册界面截图"
      ],
      cons: [
        "典型2024年劣质快餐圈钱之作：差评率高达75%，豆瓣仅3.8分！",
        "充斥大段从开源公众号直接洗稿复制的低级Prompt，错漏百出，极易过时",
        "全书核心目的是为了把读者引流到其昂贵的私域付费星球，毫无实际技术价值"
      ],
      keywords: ["割韭菜", "避坑预警", "焦虑营销", "水书退钱", "2024翻车之作"]
    },
    featuredReviews: [
      {
        platform: "douban",
        user: "反割韭菜先锋",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        rating: 1,
        date: "2024-04-05",
        sentiment: "negative",
        content: "恶心到了极点！买了之后发现里面连基本的Prompt提示词逻辑都是错的，通篇都是‘跟着我月入十万’的微商口吻，最后几页还在推二维码卖1999的课！纯纯工业垃圾，大家千万别买！"
      }
    ]
  }
];

// Enrich books with normalized scores, Bayesian composite score, discrepancy, and verdict
const books = rawBooks.map(book => {
  const compositeScore = calculateCompositeScore(book.platformRatings);
  const discrepancyIndex = calculateDiscrepancy(book.platformRatings);
  const verdict = getVerdict(compositeScore, discrepancyIndex, book.sentiment.negativePct);

  const normalizedRatings = {};
  for (const [platform, data] of Object.entries(book.platformRatings)) {
    normalizedRatings[platform] = {
      ...data,
      normalizedScore: normalizeScore(data.score, data.scale)
    };
  }

  return {
    ...book,
    normalizedRatings,
    compositeScore,
    discrepancyIndex,
    verdict
  };
});

module.exports = {
  books
};
