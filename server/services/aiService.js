const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

// Persistent disk cache to minimize token consumption
const cacheFilePath = path.join(__dirname, '../data/ai_cache.json');
let diskCache = {};
try {
  if (fs.existsSync(cacheFilePath)) {
    diskCache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load disk cache:', e.message);
}

function saveDiskCache() {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(diskCache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save disk cache:', e.message);
  }
}

/**
 * Dual AI Engine Dispatcher:
 * Priority 1: GitHub Models (Free quota - DeepSeek-R1 / GPT-4o-mini)
 * Priority 2: DeepSeek Official API (High reliability fallback)
 */
async function callDualAIEngine(messages, jsonFormat = false) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  // 1. Try free GitHub Models first if token exists
  if (GITHUB_TOKEN) {
    try {
      console.log('[Dual Engine] Calling GitHub Models (Free Tier)...');
      const ghRes = await axios.post(
        'https://models.inference.ai.azure.com/chat/completions',
        {
          model: 'DeepSeek-R1',
          messages: messages,
          temperature: 0.7,
          max_tokens: 800,
          ...(jsonFormat ? { response_format: { type: 'json_object' } } : {})
        },
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (ghRes.data && ghRes.data.choices && ghRes.data.choices[0]) {
        console.log('[Dual Engine] Handled successfully by GitHub Models (0 DeepSeek cost)');
        return {
          provider: 'GitHub Models (免费配额)',
          content: ghRes.data.choices[0].message.content
        };
      }
    } catch (ghErr) {
      console.warn('[Dual Engine] GitHub Models unavailable, falling back to DeepSeek API:', ghErr.response?.data?.error?.message || ghErr.message);
    }
  }

  // 2. Check if paid DeepSeek API is paused to prevent any billing
  if (process.env.DEEPSEEK_API_PAUSED === 'true' || !process.env.DEEPSEEK_API_KEY) {
    console.log('[Safe Guard] Paid DeepSeek API is PAUSED. 0 tokens will be consumed.');
    if (jsonFormat) {
      return {
        provider: '本地 0 消耗防护引擎 (已暂停付费 API)',
        content: JSON.stringify({
          sharpVerdict: "【当前处于 0 消耗安全防护模式】已帮您安全暂停付费 DeepSeek API 扣费，防止产生任何账单。您可以在排程设置中开启 GitHub Models 免费额度，或直接查看各大平台真实书评。",
          deepPros: ["已自动切断外部付费大模型请求通道，彻底杜绝额度损耗", "全站所有功能（多平台比价、好书对决、避坑筛选）正常运转", "本地磁盘缓存持续生效中"],
          criticalCons: ["付费 DeepSeek 实时推理处于人工静音状态", "如需生成全新 AI 书评，建议使用 GitHub Models 免费配额"],
          targetAudience: "希望零成本体验全网权威书评的读者",
          avoidAudience: "无",
          translationVerdict: "建议参考各大权威平台（豆瓣/Goodreads）真实长评与折算分"
        })
      };
    } else {
      return {
        provider: '本地 0 消耗防护引擎 (已暂停付费 API)',
        content: "【当前已为您开启 0 消耗安全防护模式】\n系统已全面暂停调用您的 DeepSeek 付费 API，绝对不会产生任何账单或扣费！您可以继续正常浏览全部 6 大看板与全网四大平台真实书评。"
      };
    }
  }

  // 3. Fallback to DeepSeek Official API

  console.log('[Dual Engine] Calling DeepSeek Official API...');
  const dsRes = await axios.post(
    `${DEEPSEEK_BASE_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
      ...(jsonFormat ? { response_format: { type: 'json_object' } } : {})
    },
    {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000
    }
  );

  return {
    provider: 'DeepSeek 官方 API',
    content: dsRes.data.choices[0].message.content
  };
}

/**
 * Generate deep-dive AI evaluation and review synthesis
 */
async function generateBookDeepInsight(book) {
  const cacheKey = `insight_${(book.id || book.title).toLowerCase()}`;
  if (diskCache[cacheKey]) {
    console.log(`[Token Saving] Loaded insight from disk cache for: ${book.title} (0 tokens burned)`);
    return diskCache[cacheKey];
  }

  const systemPrompt = `你是一位享誉全球的资深文学评论家与严肃图书导读专家。你的职责是对冲各大平台（豆瓣、Goodreads、Amazon、Google Books）的评分偏差、水军营销与读者偏见，为读者提供一针见血、客观犀利的真实书评洞察。
请以 JSON 格式输出，务必确保输出为合法合规的 JSON 对象，包含以下字段：
{
  "sharpVerdict": "1-2句极其犀利、客观中肯的定性评价（撕开营销泡沫，直击本质）",
  "deepPros": ["核心好评与思想/艺术价值亮点1", "亮点2", "亮点3"],
  "criticalCons": ["差评槽点与致命硬伤/劝退警示1", "槽点2", "槽点3"],
  "targetAudience": "最适合哪类读者阅读（如需要具备何种基础）",
  "avoidAudience": "千万不要读的读者群体（劝退预警）",
  "translationVerdict": "对中文译本或版本选择的专业建议（如无译本则写原著版本建议）"
}`;

  const userPrompt = `请对以下图书进行全网权威口碑与好差评深度剖析：
书名：《${book.title}》
原著名：${book.originalTitle || '无'}
作者：${book.author}
译者：${book.translator || '无'}
分类标签：${book.category} (${(book.tags || []).join(', ')})
当前全网评分：豆瓣 ${book.platformRatings?.douban?.score || '暂无'}/10，Goodreads ${book.platformRatings?.goodreads?.score || '暂无'}/5，Amazon ${book.platformRatings?.amazon?.score || '暂无'}/5
内容简介：${book.summary}
跨平台分歧指数：${book.discrepancyIndex || 0}
已知读者反馈：
好评点：${(book.sentiment?.pros || []).join('；')}
差评点：${(book.sentiment?.cons || []).join('；')}`;

  try {
    const result = await callDualAIEngine([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], true);

    const parsed = JSON.parse(result.content);
    parsed._provider = result.provider;
    diskCache[cacheKey] = parsed;
    saveDiskCache();
    return parsed;
  } catch (error) {
    console.error('AI insight error:', error.message);
    throw new Error('智能分析服务暂时繁忙，请稍后重试');
  }
}

/**
 * Ask DeepSeek / GitHub Models interactive questions regarding a book
 */
async function askBookConsultant(book, question) {
  const qaKey = `qa_${(book.id || book.title).toLowerCase()}_${question.trim().toLowerCase()}`;
  if (diskCache[qaKey]) {
    console.log(`[Token Saving] Loaded Q&A from disk cache (0 tokens burned)`);
    return diskCache[qaKey];
  }

  const systemPrompt = `你是一位熟悉全网各大权威书评社区（豆瓣读书、Goodreads、Amazon、学术界书评）的专业阅读顾问。请针对用户关于《${book.title}》（作者：${book.author}）的提问，结合该书在全网的真实口碑、好评与差评争议，给出客观、深刻、有理有据且有明确参考价值的回答。回答控制在300字内，精简直击核心。`;

  try {
    const result = await callDualAIEngine([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ], false);

    const answer = result.content;
    diskCache[qaKey] = answer;
    saveDiskCache();
    return answer;
  } catch (error) {
    console.error('AI Q&A error:', error.message);
    throw new Error('问答服务响应异常');
  }
}

module.exports = {
  callDualAIEngine,
  generateBookDeepInsight,
  askBookConsultant
};
