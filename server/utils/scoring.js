/**
 * Scoring & Normalization Engine for Multi-Platform Book Reviews
 */

// Normalizes any platform score to a standard 10-point scale
function normalizeScore(score, scale = 10) {
  if (!score || score <= 0) return 0;
  if (scale === 5) {
    return Number((score * 2).toFixed(2));
  }
  if (scale === 100) {
    return Number((score / 10).toFixed(2));
  }
  return Number(Number(score).toFixed(2));
}

/**
 * Bayesian Weighted Rating (IMDb formula adapted for book aggregation)
 * WR = (v / (v + m)) * R + (m / (v + m)) * C
 * v = total ratings count
 * m = minimum rating count threshold for confidence (default: 500)
 * R = average rating of the book (0-10 scale)
 * C = mean rating across all books (default: 7.8)
 */
function calculateCompositeScore(platformRatings, m = 500, C = 7.8) {
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

/**
 * Calculate discrepancy index between Douban and Western platforms (Goodreads/Amazon)
 */
function calculateDiscrepancy(platformRatings) {
  const douban = platformRatings.douban;
  const goodreads = platformRatings.goodreads;

  if (douban && douban.score && goodreads && goodreads.score) {
    const douban10 = normalizeScore(douban.score, douban.scale);
    const goodreads10 = normalizeScore(goodreads.score, goodreads.scale);
    return Number(Math.abs(douban10 - goodreads10).toFixed(2));
  }
  return 0;
}

/**
 * Determine editorial verdict and badge
 */
function getVerdict(compositeScore, discrepancyIndex, negativePct = 0) {
  if (compositeScore < 6.0 || negativePct >= 40) {
    return {
      status: "warning",
      label: "避坑预警",
      color: "rose",
      desc: "读者负评较多，内容质量欠佳或存在营销虚高、翻译翻车"
    };
  }
  if (discrepancyIndex >= 1.5 || negativePct >= 16) {
    return {
      status: "controversial",
      label: "两极分化 / 争议",
      color: "amber",
      desc: "各大平台评分分歧显著或读者评价两极撕裂，需辩证看待"
    };
  }
  if (compositeScore >= 9.0 && negativePct < 8) {
    return {
      status: "masterpiece",
      label: "殿堂神作",
      color: "emerald",
      desc: "全平台罕见超高分，极具深度与阅读价值，必读经典"
    };
  }
  if (compositeScore >= 8.2) {
    return {
      status: "recommended",
      label: "经典必读",
      color: "blue",
      desc: "多平台一致好评，口碑过硬，阅读体验极佳"
    };
  }
  return {
    status: "mediocre",
    label: "见仁见智",
    color: "gray",
    desc: "评分中规中矩，可根据个人兴趣酌情阅读"
  };
}

module.exports = {
  normalizeScore,
  calculateCompositeScore,
  calculateDiscrepancy,
  getVerdict
};
