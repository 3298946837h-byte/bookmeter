/**
 * Scoring & Normalization Engine for Multi-Platform Book Reviews (ESM)
 */

export function normalizeScore(score, scale = 10) {
  if (!score || score <= 0) return 0;
  if (scale === 5) {
    return Number((score * 2).toFixed(2));
  }
  if (scale === 100) {
    return Number((score / 10).toFixed(2));
  }
  return Number(Number(score).toFixed(2));
}

export function calculateCompositeScore(platformRatings, m = 500, C = 7.8) {
  let totalWeightedScoreSum = 0;
  let totalRatingCount = 0;

  for (const [platform, data] of Object.entries(platformRatings)) {
    if (data && data.score > 0 && data.ratingCount > 0) {
      const normalized = normalizeScore(data.score, data.scale);
      totalWeightedScoreSum += normalized * data.ratingCount;
      totalRatingCount += data.ratingCount;
    }
  }

  if (totalRatingCount === 0) return 0;

  const R = totalWeightedScoreSum / totalRatingCount;
  const v = totalRatingCount;
  const weightedRating = (v / (v + m)) * R + (m / (v + m)) * C;

  return Number(weightedRating.toFixed(2));
}

export function calculateDiscrepancy(platformRatings) {
  const douban = platformRatings.douban;
  const goodreads = platformRatings.goodreads;
  const amazon = platformRatings.amazon;

  const validScores = [];
  if (douban && douban.score > 0) validScores.push(normalizeScore(douban.score, douban.scale));
  if (goodreads && goodreads.score > 0) validScores.push(normalizeScore(goodreads.score, goodreads.scale));
  if (amazon && amazon.score > 0) validScores.push(normalizeScore(amazon.score, amazon.scale));

  if (validScores.length < 2) return 0;

  const max = Math.max(...validScores);
  const min = Math.min(...validScores);

  return Number((max - min).toFixed(2));
}

export function getVerdict(compositeScore, discrepancyIndex = 0, negativePct = 0) {
  if (compositeScore >= 9.0 && negativePct < 8) {
    return {
      status: 'masterpiece',
      label: '👑 殿堂神作 (全网公认 9.0+)',
      color: 'emerald',
      desc: '全平台零差评，极具深度与阅读价值，必读经典'
    };
  }
  if (negativePct >= 35 || compositeScore < 6.8) {
    return {
      status: 'warning',
      label: '⚠️ 避坑预警 (劣评/机翻翻车)',
      color: 'rose',
      desc: '读者大量差评，可能存在严重机翻语病或营销名不副实'
    };
  }
  if (discrepancyIndex >= 1.0) {
    return {
      status: 'controversial',
      label: '⚖️ 两极分化 / 争议之作',
      color: 'amber',
      desc: '中西方审美偏好差异极大，或观点激进引发读者严重撕裂'
    };
  }
  if (compositeScore >= 8.2) {
    return {
      status: 'recommended',
      label: '📚 经典必读 (8.2+ 扎实口碑)',
      color: 'blue',
      desc: '多平台读者评分稳定过硬，值得入手'
    };
  }
  return {
    status: 'mediocre',
    label: '中规中矩 / 普通通俗',
    color: 'slate',
    desc: '评价平稳，可根据个人兴趣选择'
  };
}
