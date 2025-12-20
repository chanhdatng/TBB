const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Inspect product IDs found at root level to understand their structure
 */
async function inspectRootProducts() {
  console.log('\n🔍 Inspecting product IDs at root level...\n');

  const db = initializeFirebase();

  try {
    // Get one sample product ID at root
    const sampleId = 'BB_001';
    const snapshot = await db.ref(sampleId).once('value');
    const data = snapshot.val();

    if (!data) {
      console.log(`❌ No data found for ${sampleId} at root level`);
      return;
    }

    console.log(`📊 Sample data for root-level "${sampleId}":\n`);
    console.log(JSON.stringify(data, null, 2));
    console.log('\n---\n');

    // Compare with correct productTimeSeries structure
    const correctPath = `productTimeSeries/${sampleId}`;
    const correctSnapshot = await db.ref(correctPath).once('value');
    const correctData = correctSnapshot.val();

    console.log(`📊 Correct data at "productTimeSeries/${sampleId}":\n`);
    if (correctData) {
      console.log(JSON.stringify(correctData, null, 2).slice(0, 500) + '...');
    } else {
      console.log('❌ No data found at correct path');
    }

  } catch (error) {
    console.error('❌ Error inspecting root products:', error);
    throw error;
  } finally {
    await admin.app().delete();
    console.log('\n✅ Inspection completed\n');
  }
}

// Run the script
if (require.main === module) {
  inspectRootProducts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { inspectRootProducts };
