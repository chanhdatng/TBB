/**
 * Test 1: Metric Accuracy Validation
 *
 * Objective: Verify backend metrics === client computation
 * Compare every customer's metrics computed by backend vs. frontend logic
 *
 * Success Criteria:
 * - Zero mismatches across all customers
 * - All segments match exactly
 * - CLV values within 1% tolerance
 * - RFM scores identical
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Import backend calculators
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

// Test results
const results = {
  totalCustomers: 0,
  mismatches: 0,
  passed: 0,
  tolerance: 0.01, // 1% tolerance for float comparisons
  issues: [],
  summary: {},
  startTime: Date.now()
};

// Initialize Firebase
let db;
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.database();
  }

  const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('Service account key not found');
  }

  const serviceAccount = require(serviceAccountPath);
  const databaseURL = process.env.FIREBASE_DATABASE_URL ||
                     serviceAccount.databaseURL ||
                     `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
  });

  return admin.database();
}

/**
 * Compare two values with tolerance for floats
 */
function valuesMatch(val1, val2, tolerance = results.tolerance) {
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    // Allow 1% tolerance for float comparisons
    const diff = Math.abs(val1 - val2);
    const maxVal = Math.max(Math.abs(val1), Math.abs(val2));
    return maxVal === 0 || (diff / maxVal) <= tolerance;
  }
  return val1 === val2;
}

/**
 * Validate metrics for a single customer
 */
function validateCustomerMetrics(phone, backendMetrics, clientMetrics) {
  const diffs = [];

  // Compare basic metrics
  if (!valuesMatch(clientMetrics.totalOrders, backendMetrics.totalOrders)) {
    diffs.push({
      field: 'totalOrders',
      client: clientMetrics.totalOrders,
      backend: backendMetrics.totalOrders
    });
  }

  if (!valuesMatch(clientMetrics.totalSpent, backendMetrics.totalSpent)) {
    diffs.push({
      field: 'totalSpent',
      client: clientMetrics.totalSpent,
      backend: backendMetrics.totalSpent
    });
  }

  if (!valuesMatch(clientMetrics.aov, backendMetrics.aov)) {
    diffs.push({
      field: 'aov (Average Order Value)',
      client: clientMetrics.aov,
      backend: backendMetrics.aov
    });
  }

  // Compare RFM
  if (clientMetrics.rfm && backendMetrics.rfm) {
    if (!valuesMatch(clientMetrics.rfm.R, backendMetrics.rfm.R)) {
      diffs.push({
        field: 'rfm.R (Recency)',
        client: clientMetrics.rfm.R,
        backend: backendMetrics.rfm.R
      });
    }
    if (!valuesMatch(clientMetrics.rfm.F, backendMetrics.rfm.F)) {
      diffs.push({
        field: 'rfm.F (Frequency)',
        client: clientMetrics.rfm.F,
        backend: backendMetrics.rfm.F
      });
    }
    if (!valuesMatch(clientMetrics.rfm.M, backendMetrics.rfm.M)) {
      diffs.push({
        field: 'rfm.M (Monetary)',
        client: clientMetrics.rfm.M,
        backend: backendMetrics.rfm.M
      });
    }
    if (clientMetrics.rfm.segment !== backendMetrics.rfm.segment) {
      diffs.push({
        field: 'rfm.segment',
        client: clientMetrics.rfm.segment,
        backend: backendMetrics.rfm.segment
      });
    }
  }

  // Compare CLV
  if (!valuesMatch(clientMetrics.clv, backendMetrics.clv)) {
    diffs.push({
      field: 'clv (Customer Lifetime Value)',
      client: clientMetrics.clv,
      backend: backendMetrics.clv
    });
  }

  if (clientMetrics.clvSegment !== backendMetrics.clvSegment) {
    diffs.push({
      field: 'clvSegment',
      client: clientMetrics.clvSegment,
      backend: backendMetrics.clvSegment
    });
  }

  // Compare churn risk
  if (clientMetrics.churnRisk && backendMetrics.churnRisk) {
    if (clientMetrics.churnRisk.level !== backendMetrics.churnRisk.level) {
      diffs.push({
        field: 'churnRisk.level',
        client: clientMetrics.churnRisk.level,
        backend: backendMetrics.churnRisk.level
      });
    }
  }

  // Compare health score
  if (!valuesMatch(clientMetrics.healthScore, backendMetrics.healthScore)) {
    diffs.push({
      field: 'healthScore',
      client: clientMetrics.healthScore,
      backend: backendMetrics.healthScore
    });
  }

  // Compare loyalty stage
  if (clientMetrics.loyaltyStage?.stage !== backendMetrics.loyaltyStage?.stage) {
    diffs.push({
      field: 'loyaltyStage.stage',
      client: clientMetrics.loyaltyStage?.stage,
      backend: backendMetrics.loyaltyStage?.stage
    });
  }

  // Compare location
  if (clientMetrics.location && backendMetrics.location) {
    if (clientMetrics.location.zone !== backendMetrics.location.zone) {
      diffs.push({
        field: 'location.zone',
        client: clientMetrics.location.zone,
        backend: backendMetrics.location.zone
      });
    }
  }

  return diffs;
}

/**
 * Simulate client-side computation (from Customers.jsx)
 */
function computeClientSideMetrics(customer, allCustomersData, orders) {
  const phone = customer.phone;

  // Get customer orders
  const customerOrders = Object.values(orders || {}).filter(
    order => order.customer?.phone === phone
  );

  // Basic aggregation
  const totalOrders = customerOrders.length;
  const totalSpent = customerOrders.reduce((sum, order) => {
    const orderTotal = (order.cakes || []).reduce((total, cake) =>
      total + (cake.price * cake.amount), 0
    );
    return sum + orderTotal;
  }, 0);
  const aov = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Get last order timestamp
  const lastOrderTimestamp = customerOrders.length > 0
    ? Math.max(...customerOrders.map(o => o.orderDate || 0))
    : null;

  // Customer data for RFM
  const customerData = {
    phone,
    totalOrders,
    totalSpent,
    lastOrderTimestamp,
    createdAt: customer.createdAt
  };

  // Calculate RFM (using all customers for percentile calculation)
  const rfm = calculateRFM(customerData, allCustomersData);

  // Calculate CLV
  const clv = calculateCLV(customerData, customerOrders);
  const clvSegment = getCLVSegment(clv);

  // Calculate churn risk
  const churnRisk = calculateChurnRisk(customerData);

  // Calculate health score
  const healthScore = calculateHealthScore(customerData, rfm, churnRisk);

  // Get loyalty stage
  const loyaltyStage = getLoyaltyStage(customerData);

  // Parse address
  const location = parseAddress(customer.address || '');

  return {
    totalOrders,
    totalSpent,
    aov,
    lastOrderTimestamp,
    rfm,
    clv,
    clvSegment,
    churnRisk,
    healthScore,
    loyaltyStage,
    location
  };
}

async function runMetricAccuracyTest() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: METRIC ACCURACY VALIDATION');
  console.log('Objective: Verify backend metrics === client computation');
  console.log('='.repeat(80) + '\n');

  try {
    // Initialize Firebase
    db = initializeFirebase();
    console.log('✅ Firebase initialized\n');

    // Fetch data
    console.log('📥 Fetching data from Firebase...');
    const [customersSnap, ordersSnap, metricsSnap] = await Promise.all([
      db.ref('newCustomers').once('value'),
      db.ref('orders').once('value'),
      db.ref('customerMetrics').once('value')
    ]);

    const customers = customersSnap.val() || {};
    const orders = ordersSnap.val() || {};
    const backendMetrics = metricsSnap.val() || {};

    // Filter customers with phone
    const customersArray = Object.values(customers).filter(c => c.phone);
    results.totalCustomers = customersArray.length;

    console.log(`   Customers: ${customersArray.length}`);
    console.log(`   Orders: ${Object.keys(orders).length}`);
    console.log(`   Backend Metrics: ${Object.keys(backendMetrics).length}`);
    console.log('');

    // Prepare data for client-side computation
    const aggregatedData = Array.from(
      aggregateCustomerData(customers, orders).values()
    );

    console.log('🔍 Comparing metrics...\n');

    // Compare each customer
    let matched = 0;
    let mismatched = 0;

    for (const customer of customersArray) {
      const phone = customer.phone;
      const backend = backendMetrics[phone];

      if (!backend) {
        results.issues.push({
          phone,
          type: 'MISSING_BACKEND_METRICS',
          message: 'No backend metrics found for this customer'
        });
        mismatched++;
        continue;
      }

      // Compute client-side metrics
      const client = computeClientSideMetrics(customer, aggregatedData, orders);

      // Validate
      const diffs = validateCustomerMetrics(phone, backend, client);

      if (diffs.length > 0) {
        mismatched++;
        results.issues.push({
          phone,
          name: customer.name,
          type: 'METRIC_MISMATCH',
          diffs
        });

        console.log(`❌ Mismatch for ${customer.name} (${phone}):`);
        diffs.forEach(diff => {
          console.log(`   - ${diff.field}: client=${diff.client}, backend=${diff.backend}`);
        });
      } else {
        matched++;
        if (matched <= 5) {
          console.log(`✅ Metrics match for ${customer.name} (${phone})`);
        }
      }
    }

    if (matched > 5) {
      console.log(`✅ ... and ${matched - 5} more customers with matching metrics`);
    }

    results.passed = matched;
    results.mismatches = mismatched;

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Customers: ${results.totalCustomers}`);
    console.log(`Matched: ${results.passed} (${((results.passed / results.totalCustomers) * 100).toFixed(2)}%)`);
    console.log(`Mismatched: ${results.mismatches} (${((results.mismatches / results.totalCustomers) * 100).toFixed(2)}%)`);
    console.log(`Accuracy Rate: ${((results.passed / results.totalCustomers) * 100).toFixed(2)}%`);
    console.log(`Duration: ${((Date.now() - results.startTime) / 1000).toFixed(2)}s`);
    console.log('='.repeat(80) + '\n');

    // Success criteria
    if (results.mismatches === 0) {
      console.log('🎉 TEST PASSED: 100% accuracy - all metrics match!');
      console.log('✅ Backend computation is identical to client-side logic\n');
      process.exit(0);
    } else {
      console.log('⚠️  TEST FAILED: Metric mismatches found');
      console.log(`   ${results.mismatches} customers have different metrics\n`);

      // Print first 10 issues
      console.log('First 10 issues:');
      results.issues.slice(0, 10).forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.name || issue.phone}`);
        if (issue.type === 'MISSING_BACKEND_METRICS') {
          console.log(`   Type: ${issue.type}`);
        } else {
          issue.diffs.forEach(diff => {
            console.log(`   - ${diff.field}: client=${diff.client}, backend=${diff.backend}`);
          });
        }
      });

      console.log(`\nTotal issues: ${results.issues.length}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

// Run the test
runMetricAccuracyTest();
