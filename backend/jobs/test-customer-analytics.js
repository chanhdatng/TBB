/**
 * Comprehensive Test Suite for Customer Analytics Engine
 * Tests with REAL production data (no mocks)
 */

require('dotenv').config();
const { computeCustomerAnalytics } = require('./customer-analytics-engine');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
  startTime: Date.now(),
  performance: {},
  issues: []
};

// Helper functions
function logTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${name}`);
    if (error) console.error(`   Error: ${error}`);
  }
  testResults.tests.push({ name, passed, error });
}

function logPerformance(metric, value) {
  testResults.performance[metric] = value;
  console.log(`📊 ${metric}: ${value}`);
}

function logIssue(issue) {
  testResults.issues.push(issue);
  console.log(`⚠️  Issue: ${issue}`);
}

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

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('CUSTOMER ANALYTICS ENGINE - COMPREHENSIVE TEST SUITE');
  console.log('Testing with REAL production data (no mocks)');
  console.log('='.repeat(80) + '\n');

  try {
    // Initialize Firebase
    db = initializeFirebase();
    console.log('✅ Firebase initialized\n');

    // ========== PRE-EXECUTION TESTS ==========
    console.log('📋 Phase 1: PRE-EXECUTION TESTS\n');

    // Test 1: Check Firebase connection
    try {
      const testRef = await db.ref('.info/connected').once('value');
      logTest('Firebase connection', testRef.val() === true);
    } catch (error) {
      logTest('Firebase connection', false, error.message);
    }

    // Test 2: Verify data exists
    try {
      const [customersSnap, ordersSnap] = await Promise.all([
        db.ref('newCustomers').once('value'),
        db.ref('orders').once('value')
      ]);
      const customers = customersSnap.val() || {};
      const orders = ordersSnap.val() || {};

      const customerCount = Object.keys(customers).length;
      const orderCount = Object.keys(orders).length;

      logTest('Customer data exists', customerCount > 0);
      logTest('Order data exists', orderCount > 0);
      logPerformance('Total customers in DB', customerCount);
      logPerformance('Total orders in DB', orderCount);

      // Test 3: Check data structure
      const firstCustomer = Object.values(customers)[0];
      const hasPhone = firstCustomer && 'phone' in firstCustomer;
      logTest('Customer has phone field', hasPhone);

      const firstOrder = Object.values(orders)[0];
      const hasCustomerInfo = firstOrder && firstOrder.customer && 'phone' in firstOrder.customer;
      logTest('Order has customer.phone', hasCustomerInfo);

      // Test 4: Edge case - customers without phones
      const customersWithoutPhone = Object.values(customers).filter(c => !c.phone).length;
      logPerformance('Customers without phone', customersWithoutPhone);
      if (customersWithoutPhone > 0) {
        logIssue(`${customersWithoutPhone} customers lack phone numbers (will be skipped)`);
      }

      // Test 5: Edge case - orders without customer info
      const ordersWithoutCustomer = Object.values(orders).filter(o => !o.customer || !o.customer.phone).length;
      logPerformance('Orders without customer', ordersWithoutCustomer);
      if (ordersWithoutCustomer > 0) {
        logIssue(`${ordersWithoutCustomer} orders lack customer phone (will be unmatched)`);
      }

    } catch (error) {
      logTest('Data verification', false, error.message);
    }

    // ========== EXECUTION TESTS ==========
    console.log('\n📋 Phase 2: EXECUTION TESTS\n');

    // Test 6: Run the main engine
    const engineStartTime = Date.now();
    let engineResult;

    try {
      console.log('🚀 Running customer analytics engine...\n');
      engineResult = await computeCustomerAnalytics();
      const engineDuration = (Date.now() - engineStartTime) / 1000;

      logTest('Engine execution completed', engineResult.success === true);
      logPerformance('Engine execution time', `${engineDuration.toFixed(2)}s`);
      logPerformance('Customers processed', engineResult.customersProcessed);
      logPerformance('Orders processed', engineResult.ordersProcessed);
      logPerformance('Metrics written', engineResult.metricsWritten);

      // Test 7: Performance - should complete within 30s
      const performanceThreshold = 30;
      const meetsPerformance = engineDuration < performanceThreshold;
      logTest(`Performance target (<${performanceThreshold}s)`, meetsPerformance);
      if (!meetsPerformance) {
        logIssue(`Execution took ${engineDuration.toFixed(2)}s, exceeds ${performanceThreshold}s target`);
      }

      // Test 8: All customers processed
      const customersSnapshot = await db.ref('newCustomers').once('value');
      const allCustomers = customersSnapshot.val() || {};
      const customersWithPhone = Object.values(allCustomers).filter(c => c.phone).length;
      const allProcessed = engineResult.customersProcessed === customersWithPhone;
      logTest('All customers with phone processed', allProcessed);
      if (!allProcessed) {
        logIssue(`Expected ${customersWithPhone} customers, processed ${engineResult.customersProcessed}`);
      }

    } catch (error) {
      logTest('Engine execution', false, error.message);
      console.error('\n❌ Fatal error during engine execution:', error);
      throw error;
    }

    // ========== POST-EXECUTION TESTS ==========
    console.log('\n📋 Phase 3: POST-EXECUTION VALIDATION\n');

    // Test 9: Verify metrics written to Firebase
    try {
      const metricsSnapshot = await db.ref('customerMetrics').once('value');
      const metrics = metricsSnapshot.val() || {};
      const metricsCount = Object.keys(metrics).length;

      logTest('Metrics exist in Firebase', metricsCount > 0);
      logPerformance('Metrics in database', metricsCount);

      // Test 10: Sample metric validation
      const samplePhone = Object.keys(metrics)[0];
      const sampleMetric = metrics[samplePhone];

      if (sampleMetric) {
        // Check required fields
        const requiredFields = [
          'totalOrders', 'totalSpent', 'lastOrderTimestamp', 'aov',
          'rfm', 'clv', 'clvSegment', 'churnRisk', 'healthScore',
          'loyaltyStage', 'location', 'trend', 'computedAt', 'lastUpdated'
        ];

        for (const field of requiredFields) {
          const hasField = field in sampleMetric;
          logTest(`Metric has field: ${field}`, hasField);
          if (!hasField) {
            logIssue(`Missing field '${field}' in metrics`);
          }
        }

        // Test 11: RFM structure validation
        if (sampleMetric.rfm) {
          const rfmFields = ['R', 'F', 'M', 'total', 'pattern', 'segment', 'daysSinceLastOrder'];
          for (const field of rfmFields) {
            const hasField = field in sampleMetric.rfm;
            logTest(`RFM has field: ${field}`, hasField);
          }

          // Validate RFM scores are in range 1-5
          const rfmValid =
            sampleMetric.rfm.R >= 1 && sampleMetric.rfm.R <= 5 &&
            sampleMetric.rfm.F >= 1 && sampleMetric.rfm.F <= 5 &&
            sampleMetric.rfm.M >= 1 && sampleMetric.rfm.M <= 5;
          logTest('RFM scores in valid range (1-5)', rfmValid);
        }

        // Test 12: Location structure validation
        if (sampleMetric.location) {
          const hasDistrict = 'district' in sampleMetric.location;
          const hasZone = 'zone' in sampleMetric.location;
          logTest('Location has district', hasDistrict);
          logTest('Location has zone', hasZone);
        }

        // Test 13: Timestamp format validation
        const hasValidTimestamp =
          typeof sampleMetric.lastUpdated === 'number' &&
          sampleMetric.lastUpdated > 0;
        logTest('Valid lastUpdated timestamp', hasValidTimestamp);

        const hasValidComputedAt =
          typeof sampleMetric.computedAt === 'string' &&
          sampleMetric.computedAt.includes('T');
        logTest('Valid computedAt ISO format', hasValidComputedAt);

        // Test 14: Numeric validation
        const validNumbers =
          typeof sampleMetric.totalOrders === 'number' &&
          typeof sampleMetric.totalSpent === 'number' &&
          typeof sampleMetric.aov === 'number' &&
          typeof sampleMetric.clv === 'number' &&
          typeof sampleMetric.healthScore === 'number';
        logTest('All numeric fields are numbers', validNumbers);

        // Test 15: Health score range (0-100)
        const healthScoreValid =
          sampleMetric.healthScore >= 0 &&
          sampleMetric.healthScore <= 100;
        logTest('Health score in range (0-100)', healthScoreValid);
      }

    } catch (error) {
      logTest('Post-execution validation', false, error.message);
    }

    // ========== EDGE CASE TESTS ==========
    console.log('\n📋 Phase 4: EDGE CASE VALIDATION\n');

    // Test 16: Check for customers with no orders
    try {
      const metricsSnapshot = await db.ref('customerMetrics').once('value');
      const metrics = metricsSnapshot.val() || {};

      let noOrderCount = 0;
      let invalidDataCount = 0;

      for (const [phone, metric] of Object.entries(metrics)) {
        if (metric.totalOrders === 0) {
          noOrderCount++;
        }

        // Check for NaN or invalid values
        if (
          isNaN(metric.totalSpent) ||
          isNaN(metric.aov) ||
          isNaN(metric.clv) ||
          isNaN(metric.healthScore)
        ) {
          invalidDataCount++;
        }
      }

      logPerformance('Customers with 0 orders', noOrderCount);
      logTest('No invalid numeric data (NaN)', invalidDataCount === 0);
      if (invalidDataCount > 0) {
        logIssue(`${invalidDataCount} metrics contain NaN values`);
      }

    } catch (error) {
      logTest('Edge case validation', false, error.message);
    }

    // Test 17: Verify CLV segments distribution
    try {
      const metricsSnapshot = await db.ref('customerMetrics').once('value');
      const metrics = metricsSnapshot.val() || {};

      const segmentCounts = { VIP: 0, High: 0, Medium: 0, Low: 0 };
      Object.values(metrics).forEach(m => {
        if (m.clvSegment in segmentCounts) {
          segmentCounts[m.clvSegment]++;
        }
      });

      logPerformance('CLV Segments', JSON.stringify(segmentCounts));
      const hasAllSegments = Object.values(segmentCounts).some(c => c > 0);
      logTest('CLV segments exist', hasAllSegments);

    } catch (error) {
      logTest('CLV segment validation', false, error.message);
    }

    // Test 18: Check memory usage
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    logPerformance('Memory usage', `${memMB} MB`);
    const memoryEfficient = memMB < 500;
    logTest('Memory usage reasonable (<500MB)', memoryEfficient);
    if (!memoryEfficient) {
      logIssue(`High memory usage: ${memMB}MB`);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    testResults.issues.push(`Fatal error: ${error.message}`);
  }

  // ========== GENERATE REPORT ==========
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2);

  console.log(`Total tests run: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Duration: ${duration}s`);

  console.log('\n--- Performance Metrics ---');
  Object.entries(testResults.performance).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  if (testResults.failed > 0) {
    console.log('\n--- Failed Tests ---');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`❌ ${t.name}`);
        if (t.error) console.log(`   Error: ${t.error}`);
      });
  }

  if (testResults.issues.length > 0) {
    console.log('\n--- Issues Found ---');
    testResults.issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  if (testResults.failed === 0) {
    console.log(`✅ ALL TESTS PASSED (${passRate}%)`);
  } else {
    console.log(`⚠️  SOME TESTS FAILED (${passRate}% pass rate)`);
  }
  console.log('='.repeat(80) + '\n');

  // Exit with appropriate code
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
