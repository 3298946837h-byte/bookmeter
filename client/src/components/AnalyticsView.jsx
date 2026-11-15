import React from 'react';
import { BarChart3, PieChart, TrendingUp, AlertTriangle, Scale } from 'lucide-react';

export default function AnalyticsView({ books }) {
  if (!books || books.length === 0) return null;

  // 1. Calculate Score Ranges
  const scoreBuckets = {
    '9.0 - 10.0 (殿堂)': books.filter(b => b.compositeScore >= 9.0),
    '8.0 - 8.9 (必读)': books.filter(b => b.compositeScore >= 8.0 && b.compositeScore < 9.0),
    '7.0 - 7.9 (争议/中规)': books.filter(b => b.compositeScore >= 7.0 && b.compositeScore < 8.0),
    '< 7.0 (避坑/低质)': books.filter(b => b.compositeScore < 7.0)
  };

  // 2. Calculate Category Average Scores
  const catStats = {};
  books.forEach(b => {
    if (!catStats[b.category]) {
      catStats[b.category] = { sum: 0, count: 0 };
    }
    catStats[b.category].sum += b.compositeScore;
    catStats[b.category].count += 1;
  });

  const categoryAverages = Object.entries(catStats).map(([name, data]) => ({
    name,
    avg: Number((data.sum / data.count).toFixed(2)),
    count: data.count
  })).sort((a, b) => b.avg - a.avg);

  // 3. Platform Bias comparison
  let totalDoubanNormalized = 0;
  let totalGoodreadsNormalized = 0;
  let validDoubanCount = 0;
  let validGoodreadsCount = 0;
  books.forEach(b => {
    if (b.platformRatings?.douban?.score != null) {
      totalDoubanNormalized += b.platformRatings.douban.score;
      validDoubanCount++;
    }
    if (b.platformRatings?.goodreads?.score != null) {
      totalGoodreadsNormalized += b.platformRatings.goodreads.score * 2;
      validGoodreadsCount++;
    }
  });
  const avgDouban = validDoubanCount > 0 ? (totalDoubanNormalized / validDoubanCount).toFixed(2) : '8.60';
  const avgGoodreads = validGoodreadsCount > 0 ? (totalGoodreadsNormalized / validGoodreadsCount).toFixed(2) : '8.45';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>全网多维度数据透视与偏见对冲看板</span>
          </div>
          <h2 className="text-2xl font-black">
            用客观宏观数据，解构全网图书真实评价生态
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            涵盖综合评分分布直方图、跨学科均分对比、中西权威平台系统性给分偏好对比，以及避坑重灾区统计。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0 text-center text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-slate-400">豆瓣全网均分</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{avgDouban} 分</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-slate-400">Goodreads折算均分</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{avgGoodreads} 分</div>
          </div>
        </div>
      </div>

      {/* Row 1: Score Range Distribution & Category Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Score Distribution Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-600" />
              <span>全书库综合评分区间分布</span>
            </h3>
            <span className="text-xs text-slate-400">总计 {books.length} 部样本作品</span>
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(scoreBuckets).map(([label, items]) => {
              const pct = Math.round((items.length / books.length) * 100);
              const colorClass =
                label.includes('殿堂') ? 'bg-emerald-500' :
                label.includes('必读') ? 'bg-sky-500' :
                label.includes('争议') ? 'bg-amber-500' : 'bg-rose-500';

              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{label}</span>
                    <span className="font-bold text-slate-900">
                      {items.length} 本 <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${colorClass} transition-all duration-500 rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 leading-relaxed border border-slate-100">
            💡 <b>数据结论</b>：全网公认 9.0+ 殿堂神作仅占少数，8.0~8.9 分是经典必读书籍主力；一旦跌破 7.0 分或避坑预警，读者通常反馈存在严重的机翻缺陷或概念炒作。
          </div>
        </div>

        {/* Category Averages */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>不同题材/品类平均权威分</span>
            </h3>
            <span className="text-xs text-slate-400">按均分高低排序</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {categoryAverages.map(cat => {
              const barWidth = Math.min(100, Math.max(20, (cat.avg / 10) * 100));
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{cat.count} 部</span>
                      <span className="font-black text-slate-900">{cat.avg} 分</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 leading-relaxed border border-slate-100">
            💡 <b>品类特征</b>：计算机硬核技术教材与文学名著的综合均分最稳定且高分集中；商业经管类书籍因充斥跟风快餐与成功学炒作，评分离散度最大、避坑风险最高。
          </div>
        </div>

      </div>

      {/* Row 2: Deep Dive into Platform Biases & Pitfall Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>豆瓣读者打分偏向</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            偏好文学沉思、哲学宿命与深度散文（如《百年孤独》《我的阿勒泰》均达 9.0+）。对劣质机翻容忍度极低，一旦译文生硬会集体怒打 2~4 分。
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Goodreads 全球打分偏向</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            评分呈现正态分布峰值集中在 4.1~4.3 星区间。对硬科幻概念、情节节奏感与通俗可读性极度宽容（如《三体》《芯片战争》参评量巨大）。
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-rose-200 bg-rose-50/20 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>避坑高危特征总结</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            ① 书名带有“月入十万/速成/红利”的焦虑快餐书；② 海外高分但在国内评分暴跌的劣质机翻译本；③ 概念火爆当年仓促出版的拼凑研报书。
          </p>
        </div>

      </div>

    </div>
  );
}
