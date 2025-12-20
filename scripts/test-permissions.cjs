const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Test write permissions for all new collections
 * Verifies that Firebase Admin SDK can write to productAnalytics, productTimeSeries, and globalRankings
 */
async function testPermissions() {
  console.log('\n🚀 Testing Firebase write permissions...\n');

  const db = initializeFirebase();

  const tests = [
    {
      name: 'productAnalytics',
      path: 'productAnalytics/TEST_001',
      data: { test: true, timestamp: Date.now() }
    },
    {
      name: 'productTimeSeries',
      path: 'productTimeSeries/TEST_001/2025-12',
      data: { test: true, timestamp: Date.now() }
    },
    {
      name: 'globalRankings',
      path: 'globalRankings/test',
      data: { test: true, timestamp: Date.now() }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);

      // Test write
      await db.ref(test.path).set(test.data);
      console.log(`  ✅ Write successful`);

      // Test read
      const snapshot = await db.ref(test.path).once('value');
      const data = snapshot.val();

      if (data && data.test === true) {
        console.log(`  ✅ Read successful`);
      } else {
        throw new Error('Read verification failed');
      }

      // Test delete
      await db.ref(test.path).remove();
      console.log(`  ✅ Delete successful`);

      // Verify deletion
      const deletedSnapshot = await db.ref(test.path).once('value');
      if (!deletedSnapshot.exists()) {
        console.log(`  ✅ Deletion verified`);
      } else {
        throw new Error('Deletion verification failed');
      }

      console.log(`✅ ${test.name} - All operations successful\n`);
      passed++;

    } catch (error) {
      console.error(`❌ ${test.name} - Failed:`, error.message);
      console.error(`   Path: ${test.path}\n`);
      failed++;
    }
  }

  console.log('\n📊 Test Summary:');
  console.log(`   - Passed: ${passed}/${tests.length}`);
  console.log(`   - Failed: ${failed}/${tests.length}`);

  if (failed === 0) {
    console.log('\n✅ All permissions verified! Ready for production use.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check Firebase security rules.\n');
    throw new Error('Permission tests failed');
  }

  await admin.app().delete();
}

// Run the script
if (require.main === module) {
  testPermissions().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testPermissions };
