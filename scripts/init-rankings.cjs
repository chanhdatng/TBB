const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Initialize globalRankings collection
 * Creates the 'current' document with empty leaderboard structure
 */
async function initRankings() {
  console.log('\n🚀 Initializing globalRankings collection...\n');

  const db = initializeFirebase();

  try {
    const rankingsRef = db.ref('globalRankings/current');

    // Check if already exists
    const existingSnapshot = await rankingsRef.once('value');
    if (existingSnapshot.exists()) {
      console.log('⏭️  globalRankings/current already exists');

      const existing = existingSnapshot.val();
      console.log('\n📋 Current rankings document:');
      console.log(JSON.stringify({
        date: existing.date,
        period: existing.period,
        topSellersCount: existing.topSellers?.length || 0,
        topRevenueCount: existing.topRevenue?.length || 0,
        slowMoversCount: existing.slowMovers?.length || 0,
        trendingCount: existing.trending?.length || 0,
        topProfitCount: existing.topProfit?.length || 0,
        lastUpdated: new Date(existing.lastUpdated).toISOString()
      }, null, 2));

      console.log('\n✅ No changes needed\n');
      return;
    }

    // Create new rankings document
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const rankingsData = {
      date: today,
      period: "last30Days",

      // Top Sellers (Top 20)
      topSellers: [],

      // Top Revenue (Top 20)
      topRevenue: [],

      // Slow Movers (Bottom 20)
      slowMovers: [],

      // Trending (Top 20 by growth rate)
      trending: [],

      // Top Profit (when cost data available)
      topProfit: [],

      // Summary Statistics
      summary: {
        totalProducts: 0,
        totalRevenue30Days: 0,
        avgProductRevenue: 0,
        topCategory: ""
      },

      lastUpdated: Date.now(),
      nextUpdate: tomorrow.getTime()
    };

    await rankingsRef.set(rankingsData);

    console.log('✅ Created globalRankings/current');
    console.log('\n📋 Initial rankings document:');
    console.log(JSON.stringify({
      date: rankingsData.date,
      period: rankingsData.period,
      topSellers: "[] (empty, will be populated by batch job)",
      topRevenue: "[] (empty, will be populated by batch job)",
      slowMovers: "[] (empty, will be populated by batch job)",
      trending: "[] (empty, will be populated by batch job)",
      topProfit: "[] (empty, will be populated by batch job)",
      summary: rankingsData.summary,
      nextUpdate: new Date(rankingsData.nextUpdate).toISOString()
    }, null, 2));

  } catch (error) {
    console.error('❌ Error initializing rankings:', error);
    throw error;
  } finally {
    await admin.app().delete();
    console.log('\n✅ Script completed\n');
  }
}

// Run the script
if (require.main === module) {
  initRankings().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { initRankings };
