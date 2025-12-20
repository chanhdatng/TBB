require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const { aggregateCustomerData } = require('./calculators/customer-aggregator');
const { calculateRFM } = require('./calculators/customer-rfm');
const {
  calculateCLV,
  getCLVSegment,
  calculateChurnRisk,
  calculateHealthScore,
  getLoyaltyStage
} = require('./calculators/customer-metrics');
const { parseAddress } = require('./calculators/customer-location');

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
 * Compute all metrics for a single customer
 */
function computeAllMetrics(customerData, allCustomersMap, allCLVs) {
  const allCustomers = Array.from(allCustomersMap.values());

  // Calculate RFM
  const rfm = calculateRFM(customerData, allCustomers);

  // Calculate CLV
  const clv = calculateCLV(customerData);
  const clvSegment = getCLVSegment(clv, allCLVs);

  // Calculate churn risk
  const churnRisk = calculateChurnRisk(customerData, rfm);

  // Calculate health score
  const healthScore = calculateHealthScore(customerData, rfm);

  // Get loyalty stage
  const loyaltyStage = getLoyaltyStage(customerData, rfm);

  // Parse location
  const location = parseAddress(customerData.address || '');

  // Calculate trend (simple version - comparing recent vs lifetime AOV)
  const trend = calculateTrend(customerData);

  return {
    // Basic metrics
    totalOrders: customerData.totalOrders,
    totalSpent: customerData.totalSpent,
    lastOrderTimestamp: customerData.lastOrderTimestamp,
    aov: customerData.aov,

    // Advanced metrics
    rfm,
    clv,
    clvSegment,
    churnRisk,
    healthScore,
    loyaltyStage,
    location: {
      district: location.district,
      zone: location.zone
    },
    trend,

    // Metadata
    computedAt: new Date().toISOString(),
    lastUpdated: Date.now()
  };
}

/**
 * Calculate trend based on spending patterns
 */
function calculateTrend(customerData) {
  if (!customerData.customerOrders || customerData.customerOrders.length < 2) {
    return 0;
  }

  // Sort orders by date
  const sortedOrders = [...customerData.customerOrders].sort((a, b) =>
    (a.orderDate || 0) - (b.orderDate || 0)
  );

  // Split into two halves
  const midpoint = Math.floor(sortedOrders.length / 2);
  const firstHalf = sortedOrders.slice(0, midpoint);
  const secondHalf = sortedOrders.slice(midpoint);

  // Calculate average order value for each half
  const firstHalfAOV = firstHalf.reduce((sum, order) => {
    const orderTotal = (order.cakes || []).reduce((s, item) =>
      s + (item.price * item.amount), 0
    );
    return sum + orderTotal;
  }, 0) / firstHalf.length;

  const secondHalfAOV = secondHalf.reduce((sum, order) => {
    const orderTotal = (order.cakes || []).reduce((s, item) =>
      s + (item.price * item.amount), 0
    );
    return sum + orderTotal;
  }, 0) / secondHalf.length;

  // Calculate percentage change
  if (firstHalfAOV === 0) return 0;

  const trend = ((secondHalfAOV - firstHalfAOV) / firstHalfAOV) * 100;
  return Math.round(trend * 10) / 10; // Round to 1 decimal
}

/**
 * Main customer analytics computation function
 */
async function computeCustomerAnalytics() {
  const startTime = Date.now();
  logger.info('🚀 Starting customer analytics computation');

  try {
    // Initialize Firebase
    db = initializeFirebase();

    // Step 1: Fetch data from Firebase
    logger.info('📥 Fetching data from Firebase...');

    const [customersSnapshot, ordersSnapshot] = await Promise.all([
      db.ref('newCustomers').once('value'),
      db.ref('orders').once('value')
    ]);

    const customers = customersSnapshot.val() || {};
    const orders = ordersSnapshot.val() || {};

    logger.info(`✅ Fetched ${Object.keys(customers).length} customers, ${Object.keys(orders).length} orders`);

    // Step 2: Aggregate orders per customer
    logger.info('🔢 Aggregating customer data...');
    const aggregated = aggregateCustomerData(customers, orders);
    logger.info(`✅ Aggregated data for ${aggregated.size} customers with phone numbers`);

    // Step 3: Pre-compute all CLVs once (optimization: O(N) instead of O(N²))
    logger.info('📊 Pre-computing CLV values...');
    const allCLVs = Array.from(aggregated.values()).map(customer => calculateCLV(customer));
    logger.info(`✅ Pre-computed ${allCLVs.length} CLV values`);

    // Step 4: Compute metrics for each customer
    logger.info('📊 Computing customer metrics...');
    const metricsUpdates = {};
    let processedCount = 0;

    for (const [phone, customerData] of aggregated.entries()) {
      try {
        const metrics = computeAllMetrics(customerData, aggregated, allCLVs);
        metricsUpdates[`customerMetrics/${phone}`] = metrics;
        processedCount++;

        // Log progress every 100 customers
        if (processedCount % 100 === 0) {
          logger.info(`Progress: ${processedCount}/${aggregated.size} customers processed`);
        }
      } catch (error) {
        logger.error(`Error computing metrics for customer ${phone}`, { error: error.message });
        // Continue processing other customers
      }
    }

    logger.info(`✅ Computed metrics for ${processedCount} customers`);

    // Step 4: Write to Firebase
    logger.info('💾 Updating customerMetrics in Firebase...');
    await db.ref().update(metricsUpdates);
    logger.info(`✅ Updated ${Object.keys(metricsUpdates).length} customer metrics in Firebase`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.success(`✅ Customer analytics computation completed in ${duration}s`);

    return {
      success: true,
      duration: `${duration}s`,
      customersProcessed: processedCount,
      ordersProcessed: Object.keys(orders).length,
      metricsWritten: Object.keys(metricsUpdates).length
    };

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error('❌ Customer analytics computation failed', { error: error.message, duration: `${duration}s` });
    throw error;
  }
}

// Allow manual execution
if (require.main === module) {
  computeCustomerAnalytics()
    .then(result => {
      console.log('\n✅ Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { computeCustomerAnalytics };
