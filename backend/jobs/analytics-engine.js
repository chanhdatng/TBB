require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const { aggregateOrdersByProduct } = require('./calculators/aggregator');
const { analyzeTrend } = require('./calculators/trend-analyzer');
const { generateRankings } = require('./calculators/ranking-engine');
const { writeTimeSeries } = require('./calculators/timeseries');

// Initialize Firebase Admin
let db;

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.database();
  }

  try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);

      // Construct databaseURL from project_id if not provided
      const databaseURL = process.env.FIREBASE_DATABASE_URL ||
                         serviceAccount.databaseURL ||
                         `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
      });

      logger.info('Firebase Admin initialized', { databaseURL });
      return admin.database();
    } else {
      throw new Error('Service account key not found at backend/serviceAccountKey.json');
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin', error);
    throw error;
  }
}

/**
 * Main analytics computation function
 */
async function computeProductAnalytics() {
  const startTime = Date.now();
  logger.info('🚀 Starting product analytics computation');

  try {
    // Initialize Firebase
    db = initializeFirebase();

    // Step 1: Fetch data from Firebase
    logger.info('📥 Fetching data from Firebase...');

    const [ordersSnapshot, productsSnapshot] = await Promise.all([
      db.ref('orders').once('value'),
      db.ref('cakes').once('value')
    ]);

    const orders = ordersSnapshot.val() || {};
    const products = productsSnapshot.val() || {};

    logger.info(`✅ Fetched ${Object.keys(orders).length} orders and ${Object.keys(products).length} products`);

    // Step 2: Aggregate order data
    logger.info('🔢 Aggregating order data...');
    const aggregated = aggregateOrdersByProduct(orders, products);

    // Step 3: Analyze trends
    logger.info('📈 Analyzing trends...');
    Object.values(aggregated).forEach(product => {
      product.trend = analyzeTrend(product);
    });

    // Step 4: Generate rankings
    logger.info('🏆 Generating rankings...');
    const { rankedProducts, globalRankings } = generateRankings(aggregated);

    // Step 5: Write time-series data
    logger.info('📊 Writing time-series data...');
    const timeSeriesResult = await writeTimeSeries(db, orders, products);
    logger.info(`✅ Time-series updated for ${timeSeriesResult.date}`);

    // Step 6: Update productAnalytics collection
    logger.info('💾 Updating productAnalytics...');
    const analyticsUpdates = {};

    Object.entries(rankedProducts).forEach(([productId, product]) => {
      analyticsUpdates[`productAnalytics/${productId}`] = {
        productId,
        name: product.name || '',  // Add for frontend matching
        type: product.type || '',  // Add for frontend matching (with fallback)
        lifetime: product.lifetime,
        recent30Days: product.recent30Days,
        recent7Days: product.recent7Days,
        trend: product.trend,
        rankings: product.rankings,
        flags: product.flags,
        lastUpdated: Date.now(),
        computedAt: new Date().toISOString()
      };
    });

    await db.ref().update(analyticsUpdates);
    logger.info(`✅ Updated analytics for ${Object.keys(analyticsUpdates).length} products`);

    // Step 7: Update globalRankings
    logger.info('🌍 Updating global rankings...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const totalRevenue30Days = Object.values(rankedProducts).reduce((sum, p) => sum + p.recent30Days.revenue, 0);

    await db.ref('globalRankings/current').set({
      date: new Date().toISOString().split('T')[0],
      period: 'last30Days',
      ...globalRankings,
      summary: {
        totalProducts: Object.keys(products).length,
        totalRevenue30Days: Math.round(totalRevenue30Days),
        avgProductRevenue: Math.round(totalRevenue30Days / Object.keys(products).length),
        topCategory: globalRankings.topSellers[0]?.type || ''
      },
      lastUpdated: Date.now(),
      nextUpdate: tomorrow.getTime()
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.success(`✅ Analytics computation completed in ${duration}s`);

    return {
      success: true,
      duration: `${duration}s`,
      productsProcessed: Object.keys(products).length,
      ordersProcessed: Object.keys(orders).length,
      timeSeriesDate: timeSeriesResult.date
    };

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error('❌ Analytics computation failed', { error: error.message, duration: `${duration}s` });
    throw error;
  }
}

// Allow manual execution
if (require.main === module) {
  computeProductAnalytics()
    .then(result => {
      console.log('\n✅ Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { computeProductAnalytics };
