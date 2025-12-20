const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Initialize productTimeSeries collection for current month
 * Creates time-series documents for test products (first 3)
 */
async function initTimeSeries() {
  console.log('\n🚀 Initializing productTimeSeries collection...\n');

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

    // Get first 3 products for testing
    const productIds = Object.keys(products).slice(0, 3);
    console.log(`📦 Initializing time-series for ${productIds.length} test products\n`);

    // Get current month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // "2025-12"
    const currentYear = now.getFullYear();

    // Get days in current month
    const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();

    const timeSeriesRef = db.ref('productTimeSeries');
    let created = 0;
    let skipped = 0;

    for (const productId of productIds) {
      const product = products[productId];
      const monthPath = `${productId}/${currentMonth}`;

      // Check if already exists
      const existingSnapshot = await timeSeriesRef.child(monthPath).once('value');
      if (existingSnapshot.exists()) {
        console.log(`⏭️  ${productId}/${currentMonth} - Already exists, skipping`);
        skipped++;
        continue;
      }

      // Initialize daily data for all days in month
      const daily = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day.toString().padStart(2, '0');
        daily[dayStr] = { s: 0, r: 0, o: 0 }; // sold, revenue, orders
      }

      const timeSeriesData = {
        productId: productId,
        month: currentMonth,
        year: currentYear,
        daily: daily,
        monthTotal: {
          sold: 0,
          revenue: 0,
          orders: 0,
          avgDaily: 0
        },
        lastUpdated: Date.now()
      };

      await timeSeriesRef.child(monthPath).set(timeSeriesData);
      console.log(`✅ ${productId} - ${product.name} (${currentMonth})`);
      created++;
    }

    console.log('\n📊 Summary:');
    console.log(`   - Created: ${created}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Month: ${currentMonth}`);
    console.log(`   - Days initialized: ${daysInMonth}\n`);

    // Display sample
    if (created > 0) {
      console.log('📋 Sample time-series document:');
      const sampleId = productIds[0];
      const sampleSnapshot = await timeSeriesRef.child(`${sampleId}/${currentMonth}`).once('value');
      const sample = sampleSnapshot.val();

      // Show first 3 days
      const sampleDaily = {};
      ['01', '02', '03'].forEach(day => {
        sampleDaily[day] = sample.daily[day];
      });

      console.log(JSON.stringify({
        productId: sample.productId,
        month: sample.month,
        year: sample.year,
        daily: sampleDaily,
        monthTotal: sample.monthTotal
      }, null, 2));
    }

  } catch (error) {
    console.error('❌ Error initializing time-series:', error);
    throw error;
  } finally {
    await admin.app().delete();
    console.log('\n✅ Script completed\n');
  }
}

// Run the script
if (require.main === module) {
  initTimeSeries().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { initTimeSeries };
