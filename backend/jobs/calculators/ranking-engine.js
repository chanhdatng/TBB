/**
 * Generate rankings for all products
 */
function generateRankings(aggregatedProducts) {
  const products = Object.values(aggregatedProducts);

  // Sort by popularity (units sold in last 30 days)
  const byPopularity = [...products]
    .sort((a, b) => b.recent30Days.sold - a.recent30Days.sold)
    .map((p, index) => ({ ...p, rank: index + 1 }));

  // Sort by revenue (last 30 days)
  const byRevenue = [...products]
    .sort((a, b) => b.recent30Days.revenue - a.recent30Days.revenue)
    .map((p, index) => ({ ...p, rank: index + 1 }));

  // Sort by growth rate
  const byGrowth = [...products]
    .filter(p => p.trend.growthRate > 0)
    .sort((a, b) => b.trend.growthRate - a.trend.growthRate)
    .map((p, index) => ({ ...p, rank: index + 1 }));

  // Sort by profit (when cost available)
  const byProfit = [...products]
    .filter(p => p.cost > 0)
    .sort((a, b) => b.recent30Days.profit - a.recent30Days.profit)
    .map((p, index) => ({ ...p, rank: index + 1 }));

  // Update rankings in products
  const rankedProducts = {};
  products.forEach(product => {
    const popularityRank = byPopularity.find(p => p.productId === product.productId)?.rank;
    const revenueRank = byRevenue.find(p => p.productId === product.productId)?.rank;
    const growthRank = byGrowth.find(p => p.productId === product.productId)?.rank;
    const profitRank = byProfit.find(p => p.productId === product.productId)?.rank;

    const rankings = {
      popularity: popularityRank,
      revenue: revenueRank,
      growth: growthRank || null,
      profit: profitRank || null,
      lastUpdated: new Date().toISOString()
    };

    rankedProducts[product.productId] = {
      ...product,
      rankings,
      flags: calculateFlags(product, byPopularity.length, popularityRank)
    };
  });

  // Generate global leaderboards
  const topSellers = byPopularity.slice(0, 20).map(p => ({
    id: p.productId,
    name: p.name,
    type: '', // Can be added from products if needed
    sold: p.recent30Days.sold,
    revenue: p.recent30Days.revenue,
    rank: p.rank,
    badge: p.rank === 1 ? '🏆' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : ''
  }));

  const topRevenue = byRevenue.slice(0, 20).map(p => ({
    id: p.productId,
    name: p.name,
    revenue: p.recent30Days.revenue,
    sold: p.recent30Days.sold,
    rank: p.rank
  }));

  const slowMovers = [...products]
    .filter(p => p.recent30Days.sold < 5)
    .sort((a, b) => a.recent30Days.sold - b.recent30Days.sold)
    .slice(0, 20)
    .map((p, index) => {
      const daysSinceLastSale = p.lifetime.lastSoldAt
        ? Math.floor((Date.now() - new Date(p.lifetime.lastSoldAt).getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      return {
        id: p.productId,
        name: p.name,
        sold: p.recent30Days.sold,
        daysSinceLastSale,
        rank: index + 1,
        alertLevel: daysSinceLastSale > 14 ? 'high' : daysSinceLastSale > 7 ? 'medium' : 'low'
      };
    });

  const trending = byGrowth.slice(0, 20).map(p => ({
    id: p.productId,
    name: p.name,
    growth: p.trend.growthRate,
    velocity: p.trend.velocity === 'accelerating' ? '🚀' : p.trend.velocity === 'steady' ? '📈' : '📉',
    rank: p.rank
  }));

  const topProfit = byProfit.slice(0, 20).map(p => ({
    id: p.productId,
    name: p.name,
    profit: p.recent30Days.profit,
    margin: p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0,
    rank: p.rank
  }));

  return {
    rankedProducts,
    globalRankings: {
      topSellers,
      topRevenue,
      slowMovers,
      trending,
      topProfit
    }
  };
}

function calculateFlags(product, totalProducts, popularityRank) {
  const top20Percent = Math.ceil(totalProducts * 0.2);

  return {
    isTopSeller: popularityRank ? popularityRank <= top20Percent : false,
    isSlowMover: product.recent30Days.sold < 5,
    isTrending: product.trend.growthRate > 10,
    isProfitable: product.cost > 0 ? (product.price - product.cost) / product.price >= (product.targetMargin || 40) / 100 : null,
    isNew: product.lifetime.firstSoldAt
      ? (Date.now() - new Date(product.lifetime.firstSoldAt).getTime()) < (30 * 24 * 60 * 60 * 1000)
      : false
  };
}

module.exports = { generateRankings };
