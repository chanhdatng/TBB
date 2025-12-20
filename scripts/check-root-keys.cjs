const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Check root-level keys in Firebase Realtime Database
 * This will help identify if product IDs are written at root level
 */
async function checkRootKeys() {
  console.log('\n🔍 Checking Firebase root-level keys...\n');

  const db = initializeFirebase();

  try {
    // Get root level snapshot
    const rootSnapshot = await db.ref().once('value');
    const rootData = rootSnapshot.val();

    if (!rootData) {
      console.log('❌ No data found at root level');
      return;
    }

    const rootKeys = Object.keys(rootData);
    console.log(`📊 Found ${rootKeys.length} root-level keys:\n`);

    // Display all root keys
    rootKeys.forEach((key, index) => {
      const childSnapshot = rootData[key];
      const isCollection = typeof childSnapshot === 'object' && childSnapshot !== null;
      const childCount = isCollection ? Object.keys(childSnapshot).length : 0;

      console.log(`${index + 1}. ${key}`);
      console.log(`   Type: ${isCollection ? 'Collection' : 'Value'}`);
      if (isCollection) {
        console.log(`   Children: ${childCount}`);
        // Show first few child keys
        const childKeys = Object.keys(childSnapshot).slice(0, 5);
        console.log(`   Sample keys: ${childKeys.join(', ')}${childCount > 5 ? ', ...' : ''}`);
      }
      console.log('');
    });

    // Check for product IDs at root level
    console.log('\n🔎 Checking for product IDs at root level...\n');
    const productIdPattern = /^[A-Z]+_\d+$/; // Pattern like BB_001, BCO_001
    const suspiciousKeys = rootKeys.filter(key => productIdPattern.test(key));

    if (suspiciousKeys.length > 0) {
      console.log(`⚠️  WARNING: Found ${suspiciousKeys.length} product IDs at root level:`);
      suspiciousKeys.forEach(key => {
        console.log(`   - ${key}`);
      });
      console.log('\n   These should be inside collections like "productAnalytics/" or "cakes/"');
    } else {
      console.log('✅ No product IDs found at root level. Structure is correct!');
    }

    // Verify expected collections exist
    console.log('\n📋 Verifying expected collections:\n');
    const expectedCollections = ['cakes', 'orders', 'productAnalytics', 'productTimeSeries', 'globalRankings'];
    expectedCollections.forEach(collection => {
      const exists = rootKeys.includes(collection);
      console.log(`${exists ? '✅' : '❌'} ${collection}`);
    });

  } catch (error) {
    console.error('❌ Error checking root keys:', error);
    throw error;
  } finally {
    await admin.app().delete();
    console.log('\n✅ Check completed\n');
  }
}

// Run the script
if (require.main === module) {
  checkRootKeys().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkRootKeys };
