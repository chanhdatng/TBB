const { addProductFields } = require('./add-product-fields.cjs');
const { initProductAnalytics } = require('./init-product-analytics.cjs');
const { initTimeSeries } = require('./init-timeseries.cjs');
const { initRankings } = require('./init-rankings.cjs');
const { testPermissions } = require('./test-permissions.cjs');

/**
 * Master script to run all Phase 1 initialization scripts in sequence
 */
async function runAll() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║   Phase 1: Schema & Infrastructure Setup                ║');
  console.log('║   Product Analytics System                               ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  try {
    // Step 1: Test permissions first
    console.log('🔐 Step 1/5: Testing Firebase permissions...');
    await testPermissions();

    // Step 2: Add product fields
    console.log('\n📝 Step 2/5: Adding cost fields to products...');
    await addProductFields();

    // Step 3: Initialize product analytics
    console.log('\n📊 Step 3/5: Initializing productAnalytics collection...');
    await initProductAnalytics();

    // Step 4: Initialize time-series
    console.log('\n📈 Step 4/5: Initializing productTimeSeries collection...');
    await initTimeSeries();

    // Step 5: Initialize rankings
    console.log('\n🏆 Step 5/5: Initializing globalRankings collection...');
    await initRankings();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║              ✅ Phase 1 Completed Successfully           ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('📊 Results Summary:');
    console.log('   ✅ Firebase permissions verified');
    console.log('   ✅ Product cost fields added');
    console.log('   ✅ productAnalytics collection initialized');
    console.log('   ✅ productTimeSeries collection initialized');
    console.log('   ✅ globalRankings collection initialized');
    console.log(`\n⏱️  Total time: ${duration}s\n`);

    console.log('🎯 Next Steps:');
    console.log('   1. Verify collections in Firebase Console');
    console.log('   2. Proceed to Phase 2: Backend Computation Engine');
    console.log('   3. Check implementation plan at: plans/20251209-1520-product-analytics-system/\n');

  } catch (error) {
    console.error('\n❌ Phase 1 initialization failed:', error.message);
    console.error('\nPlease check the error above and ensure:');
    console.error('   1. Firebase credentials are correctly configured');
    console.error('   2. Firebase collections were created in Console');
    console.error('   3. Firebase security rules allow Admin SDK access\n');
    process.exit(1);
  }
}

// Run the master script
if (require.main === module) {
  runAll();
}

module.exports = { runAll };
