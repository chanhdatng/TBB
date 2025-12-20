const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Initialize productAnalytics collection
 * Creates analytics document for each product with default values
 */
async function initProductAnalytics() {
  console.log('\n🚀 Initializing productAnalytics collection...\n');

  const db = initializeFirebase();

  try {
    // Fetch all products
    const productsRef = db.ref('cakes');
    const snapshot = await productsRef.once('value');
    const products = snapshot.val();

    if (!products) {
      console.log('❌ No products found in cakes collection');
      return;
    }

    const productIds = Object.keys(products);
    console.log(`📦 Found ${productIds.length} products\n`);

    const analyticsRef = db.ref('productAnalytics');
    let created = 0;
    let skipped = 0;

    for (const productId of productIds) {
      const product = products[productId];

      // Check if analytics already exists
      const existingSnapshot = await analyticsRef.child(productId).once('value');
      if (existingSnapshot.exists()) {
        console.log(`⏭️  ${productId} - Already exists, skipping`);
        skipped++;
        continue;
      }

      // Create analytics document with default structure
      const analyticsData = {
        productId: productId,

        // Lifetime Statistics
        lifetime: {
          totalSold: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgOrderSize: 0,
          firstSoldAt: null,
          lastSoldAt: null
        },

        // Recent Performance (Last 30 Days)
        recent30Days: {
          sold: 0,
          orders: 0,
          revenue: 0,
          profit: 0,
          avgDaily: 0
        },

        // Short-term Performance (Last 7 Days)
        recent7Days: {
          sold: 0,
          orders: 0,
          revenue: 0,
          avgDaily: 0
        },

        // Trend Analysis
        trend: {
          direction: "stable",
          score: 0,
          growthRate: 0,
          velocity: "steady",
          confidence: 0
        },

        // Rankings
        rankings: {
          popularity: null,
          revenue: null,
          profit: null,
          growth: null,
          lastUpdated: null
        },

        // Quick Flags
        flags: {
          isTopSeller: false,
          isSlowMover: false,
          isTrending: false,
          isProfitable: null,
          isNew: false
        },

        lastUpdated: Date.now(),
        computedAt: new Date().toISOString()
      };

      await analyticsRef.child(productId).set(analyticsData);
      console.log(`✅ ${productId} - ${product.name}`);
      created++;
    }

    console.log('\n📊 Summary:');
    console.log(`   - Created: ${created}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Total: ${productIds.length}\n`);

    // Display sample
    if (created > 0) {
      console.log('📋 Sample analytics document:');
      const sampleId = productIds.find(id => !products[id]._skipped) || productIds[0];
      const sampleSnapshot = await analyticsRef.child(sampleId).once('value');
      const sample = sampleSnapshot.val();

      console.log(JSON.stringify({
        productId: sample.productId,
        lifetime: sample.lifetime,
        trend: sample.trend,
        flags: sample.flags
      }, null, 2));
    }

  } catch (error) {
    console.error('❌ Error initializing product analytics:', error);
    throw error;
  } finally {
    await admin.app().delete();
    console.log('\n✅ Script completed\n');
  }
}

// Run the script
if (require.main === module) {
  initProductAnalytics().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { initProductAnalytics };
