const { initializeFirebase, admin } = require('./firebase-config.cjs');

/**
 * Add cost tracking fields to existing products
 * New fields: cost, costLastUpdated, targetMargin
 * All fields are optional with default values
 */
async function addProductFields() {
  console.log('\n🚀 Adding cost fields to products...\n');

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

    // Prepare batch updates
    const updates = {};
    let updateCount = 0;

    for (const productId of productIds) {
      const product = products[productId];

      // Only add fields if they don't exist
      if (!product.hasOwnProperty('cost')) {
        updates[`cakes/${productId}/cost`] = 0;
        updateCount++;
      }

      if (!product.hasOwnProperty('costLastUpdated')) {
        updates[`cakes/${productId}/costLastUpdated`] = null;
      }

      if (!product.hasOwnProperty('targetMargin')) {
        updates[`cakes/${productId}/targetMargin`] = 40; // Default 40%
      }
    }

    if (Object.keys(updates).length === 0) {
      console.log('✅ All products already have cost fields. No updates needed.');
    } else {
      // Apply all updates in a single batch
      await db.ref().update(updates);

      console.log('✅ Successfully updated products:');
      console.log(`   - Products updated: ${updateCount}`);
      console.log(`   - Fields added: cost, costLastUpdated, targetMargin`);
      console.log(`   - Default values: cost=0, targetMargin=40%\n`);
    }

    // Display sample
    console.log('📋 Sample product after update:');
    const sampleId = productIds[0];
    const sampleSnapshot = await db.ref(`cakes/${sampleId}`).once('value');
    const sample = sampleSnapshot.val();

    console.log(JSON.stringify({
      id: sample.id,
      name: sample.name,
      price: sample.price,
      cost: sample.cost,
      targetMargin: sample.targetMargin,
      costLastUpdated: sample.costLastUpdated
    }, null, 2));

  } catch (error) {
    console.error('❌ Error adding product fields:', error);
    throw error;
  } finally {
    await admin.app().delete();
    console.log('\n✅ Script completed\n');
  }
}

// Run the script
if (require.main === module) {
  addProductFields().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { addProductFields };
