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

// Initialize Firebase Admin (reuse existing instance if available)
let db;

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.database();
  }

  try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);

      const databaseURL = process.env.FIREBASE_DATABASE_URL ||
                         serviceAccount.databaseURL ||
                         `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
      });

      logger.info('Firebase Admin initialized for incremental updates', { databaseURL });
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
 * Calculate trend based on spending patterns
 */
function calculateTrend(customerData) {
  if (!customerData.customerOrders || customerData.customerOrders.length < 2) {
    return 0;
  }

  const sortedOrders = [...customerData.customerOrders].sort((a, b) =>
    (a.orderDate || 0) - (b.orderDate || 0)
  );

  const midpoint = Math.floor(sortedOrders.length / 2);
  const firstHalf = sortedOrders.slice(0, midpoint);
  const secondHalf = sortedOrders.slice(midpoint);

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

  if (firstHalfAOV === 0) return 0;

  const trend = ((secondHalfAOV - firstHalfAOV) / firstHalfAOV) * 100;
  return Math.round(trend * 10) / 10;
}

/**
 * Compute metrics for a single customer (incremental update)
 * @param {string} phone - Customer phone number
 * @returns {Promise<Object>} - Computation result
 */
async function computeSingleCustomerMetrics(phone) {
  const startTime = Date.now();
  logger.info(`🔄 Starting incremental update for customer ${phone}`);

  try {
    // Initialize Firebase
    db = initializeFirebase();

    // Step 1: Fetch only this customer and their orders
    logger.info(`📥 Fetching data for customer ${phone}...`);

    const [customersSnap, ordersSnap, allCustomersSnap] = await Promise.all([
      db.ref('newCustomers').orderByChild('phone').equalTo(phone).once('value'),
      db.ref('orders').orderByChild('customer/phone').equalTo(phone).once('value'),
      // Fetch all customers for RFM/CLV percentile calculations
      db.ref('newCustomers').once('value')
    ]);

    const customers = customersSnap.val() || {};
    const orders = ordersSnap.val() || {};
    const allCustomers = allCustomersSnap.val() || {};

    if (Object.keys(customers).length === 0) {
      logger.warn(`Customer with phone ${phone} not found`);
      return {
        success: false,
        error: 'Customer not found',
        phone
      };
    }

    // Step 2: Aggregate for this customer
    logger.info(`🔢 Aggregating data for customer ${phone}...`);
    const aggregated = aggregateCustomerData(customers, orders);
    const customerData = Array.from(aggregated.values())[0];

    if (!customerData) {
      logger.warn(`No data for customer ${phone} after aggregation`);
      return {
        success: false,
        error: 'No customer data after aggregation',
        phone
      };
    }

    // Step 3: Aggregate all customers for percentile calculations
    const allCustomersAggregated = aggregateCustomerData(allCustomers, await db.ref('orders').once('value').then(s => s.val() || {}));
    const allCustomersArray = Array.from(allCustomersAggregated.values());

    // Pre-compute all CLVs for percentile calculation
    const allCLVs = allCustomersArray.map(c => calculateCLV(c));

    // Step 4: Calculate RFM
    const rfm = calculateRFM(customerData, allCustomersArray);

    // Step 5: Calculate CLV
    const clv = calculateCLV(customerData);
    const clvSegment = getCLVSegment(clv, allCLVs);

    // Step 6: Calculate other metrics
    const churnRisk = calculateChurnRisk(customerData, rfm);
    const healthScore = calculateHealthScore(customerData, rfm);
    const loyaltyStage = getLoyaltyStage(customerData, rfm);
    const location = parseAddress(customerData.address || '');
    const trend = calculateTrend(customerData);

    // Step 7: Build metrics object
    const metrics = {
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

    // Step 8: Write to Firebase
    await db.ref(`customerMetrics/${phone}`).set(metrics);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.success(`✅ Updated metrics for customer ${phone} in ${duration}s`);

    return {
      success: true,
      phone,
      duration: `${duration}s`,
      metrics
    };

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error(`❌ Failed to update customer ${phone}`, { error: error.message, duration: `${duration}s` });

    return {
      success: false,
      phone,
      error: error.message,
      duration: `${duration}s`
    };
  }
}

module.exports = { computeSingleCustomerMetrics };
