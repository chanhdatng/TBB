const admin = require('firebase-admin');

/**
 * Generate orderCounts metadata: { "2024-12-20": 15, "2024-12-21": 23, ... }
 * Runs daily to update counts for calendar picker
 * Phase 4: Firebase Bandwidth Optimization
 */
async function generateOrderCounts() {
  const startTime = Date.now();
  console.log('🚀 Starting orderCounts generation...');

  try {
    const db = admin.database();

    // Fetch ALL orders (read once/day acceptable)
    const ordersSnapshot = await db.ref('orders').once('value');
    const orders = ordersSnapshot.val() || {};

    // Helper: CFAbsoluteTime to YYYY-MM-DD
    const formatDate = (cfTime) => {
      const jsTime = (cfTime + 978307200) * 1000;
      const date = new Date(jsTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Count orders by date
    const counts = {};
    Object.values(orders).forEach(order => {
      if (order.orderDate) {
        const date = formatDate(order.orderDate);
        counts[date] = (counts[date] || 0) + 1;
      }
    });

    // Write to metadata
    await db.ref('metadata/orderCounts').set(counts);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ OrderCounts generated: ${Object.keys(counts).length} dates in ${duration}s`);

    return { success: true, datesCount: Object.keys(counts).length, duration };

  } catch (error) {
    console.error('❌ OrderCounts generation failed', { error: error.message });
    throw error;
  }
}

// Allow manual execution
if (require.main === module) {
  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    const serviceAccount = require('../../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://butterbake.firebaseio.com'
    });
  }

  generateOrderCounts()
    .then(result => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { generateOrderCounts };
