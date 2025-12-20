const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Clean up product IDs that were mistakenly written to root level
 * These should be inside productTimeSeries/ collection instead
 */
async function cleanupRootProducts() {
  console.log('\n🧹 Cleaning up product IDs from root level...\n');

  const db = initializeFirebase();

  try {
    // Product ID pattern
    const productIdPattern = /^[A-Z]+_\d+$/;

    // Get all root-level keys
    const rootSnapshot = await db.ref().once('value');
    const rootData = rootSnapshot.val();

    if (!rootData) {
      console.log('❌ No data found at root level');
      return;
    }

    const rootKeys = Object.keys(rootData);
    const productIdsAtRoot = rootKeys.filter(key => productIdPattern.test(key));

    if (productIdsAtRoot.length === 0) {
      console.log('✅ No product IDs found at root level. Already clean!');
      return;
    }

    console.log(`⚠️  Found ${productIdsAtRoot.length} product IDs at root level:\n`);
    productIdsAtRoot.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });

    console.log('\n📋 Sample data that will be deleted:\n');
    const sample = rootData[productIdsAtRoot[0]];
    console.log(JSON.stringify(sample, null, 2));

    console.log('\n⚠️  WARNING: This will DELETE the above product IDs from root level.');
    console.log('ℹ️  The correct data should already exist in productTimeSeries/ collection.\n');

    // Create backup before deletion
    console.log('💾 Creating backup before deletion...\n');
    const backup = {};
    productIdsAtRoot.forEach(id => {
      backup[id] = rootData[id];
    });

    const backupPath = `./cleanup-backup-${new Date().toISOString().split('T')[0]}.json`;
    const fs = require('fs');
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved to: ${backupPath}\n`);

    // Delete product IDs from root level
    console.log('🗑️  Deleting product IDs from root level...\n');
    const deleteUpdates = {};
    productIdsAtRoot.forEach(id => {
      deleteUpdates[id] = null; // null means delete in Firebase
    });

    await db.ref().update(deleteUpdates);

    console.log(`✅ Successfully deleted ${productIdsAtRoot.length} product IDs from root level:\n`);
    productIdsAtRoot.forEach((id, index) => {
      console.log(`   ${index + 1}. ${id} ✓`);
    });

    // Verify deletion
    console.log('\n🔍 Verifying deletion...\n');
    const verifySnapshot = await db.ref().once('value');
    const verifyData = verifySnapshot.val();
    const verifyKeys = Object.keys(verifyData);
    const remainingProductIds = verifyKeys.filter(key => productIdPattern.test(key));

    if (remainingProductIds.length === 0) {
      console.log('✅ Verification passed: No product IDs remain at root level');
    } else {
      console.log(`⚠️  Warning: ${remainingProductIds.length} product IDs still at root level`);
      remainingProductIds.forEach(id => console.log(`   - ${id}`));
    }

    // Show final structure
    console.log('\n📊 Final root-level structure:\n');
    const expectedCollections = ['cakes', 'orders', 'productAnalytics', 'productTimeSeries', 'globalRankings'];
    expectedCollections.forEach(collection => {
      const exists = verifyKeys.includes(collection);
      console.log(`${exists ? '✅' : '❌'} ${collection}`);
    });

    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`   - Deleted: ${productIdsAtRoot.length} product IDs`);
    console.log(`   - Backup: ${backupPath}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await admin.app().delete();
    console.log('\n✅ Script completed\n');
  }
}

// Run the script
if (require.main === module) {
  cleanupRootProducts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { cleanupRootProducts };
