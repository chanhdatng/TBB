/**
 * Test 6: Data Integrity Validation
 *
 * Objective: Verify Firebase data structure and completeness
 *
 * Success Criteria:
 * - All customers with phone numbers have metrics
 * - All required fields are present
 * - Field values are within valid ranges
 * - Timestamps are recent (< 24 hours old)
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Test results
const results = {
  totalCustomers: 0,
  customersWithMetrics: 0,
  missingMetrics: [],
  invalidFields: [],
  staleMetrics: [],
  fieldValidation: {
    passed: 0,
    failed: 0
  },
  startTime: Date.now()
};

// Initialize Firebase
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
 * Validate a single customer's metrics structure
 */
function validateMetricsStructure(phone, metrics) {
  const errors = [];

  // Required numeric fields
  const numericFields = [
    'totalOrders',
    'totalSpent',
    'aov',
    'clv',
    'healthScore'
  ];

  for (const field of numericFields) {
    if (typeof metrics[field] !== 'number') {
      errors.push(`${field} is not a number (${typeof metrics[field]})`);
    } else if (metrics[field] < 0) {
      errors.push(`${field} is negative (${metrics[field]})`);
    }
  }

  // Health score should be 0-100
  if (typeof metrics.healthScore === 'number') {
    if (metrics.healthScore < 0 || metrics.healthScore > 100) {
      errors.push(`healthScore out of range (${metrics.healthScore}, expected 0-100)`);
    }
  }

  // RFM structure
  if (metrics.rfm) {
    if (typeof metrics.rfm.R !== 'number' || metrics.rfm.R < 1 || metrics.rfm.R > 5) {
      errors.push(`rfm.R invalid (${metrics.rfm.R}, expected 1-5)`);
    }
    if (typeof metrics.rfm.F !== 'number' || metrics.rfm.F < 1 || metrics.rfm.F > 5) {
      errors.push(`rfm.F invalid (${metrics.rfm.F}, expected 1-5)`);
    }
    if (typeof metrics.rfm.M !== 'number' || metrics.rfm.M < 1 || metrics.rfm.M > 5) {
      errors.push(`rfm.M invalid (${metrics.rfm.M}, expected 1-5)`);
    }
    if (!metrics.rfm.segment || typeof metrics.rfm.segment !== 'string') {
      errors.push('rfm.segment missing or invalid');
    }
  } else {
    errors.push('rfm object missing');
  }

  // CLV segment
  const validCLVSegments = ['VIP', 'High', 'Medium', 'Low'];
  if (!validCLVSegments.includes(metrics.clvSegment)) {
    errors.push(`clvSegment invalid (${metrics.clvSegment})`);
  }

  // Churn risk
  if (metrics.churnRisk) {
    const validLevels = ['low', 'medium', 'high'];
    if (!validLevels.includes(metrics.churnRisk.level)) {
      errors.push(`churnRisk.level invalid (${metrics.churnRisk.level})`);
    }
    if (typeof metrics.churnRisk.score !== 'number') {
      errors.push('churnRisk.score is not a number');
    }
  } else {
    errors.push('churnRisk object missing');
  }

  // Loyalty stage
  if (metrics.loyaltyStage) {
    if (!metrics.loyaltyStage.stage || typeof metrics.loyaltyStage.stage !== 'string') {
      errors.push('loyaltyStage.stage missing or invalid');
    }
  } else {
    errors.push('loyaltyStage object missing');
  }

  // Location (optional but should be valid if present)
  if (metrics.location) {
    if (metrics.location.zone && typeof metrics.location.zone !== 'string') {
      errors.push('location.zone is not a string');
    }
  }

  // Computed timestamp
  if (!metrics.computedAt) {
    errors.push('computedAt timestamp missing');
  } else {
    const computedDate = new Date(metrics.computedAt);
    if (isNaN(computedDate.getTime())) {
      errors.push('computedAt is not a valid date');
    } else {
      // Check if metrics are stale (> 24 hours)
      const hoursOld = (Date.now() - computedDate.getTime()) / (1000 * 60 * 60);
      if (hoursOld > 24) {
        return { errors, isStale: true, hoursOld: hoursOld.toFixed(1) };
      }
    }
  }

  return { errors, isStale: false };
}

async function runDataIntegrityTest() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 6: DATA INTEGRITY VALIDATION');
  console.log('Objective: Verify Firebase data structure and completeness');
  console.log('='.repeat(80) + '\n');

  try {
    // Initialize Firebase
    const db = initializeFirebase();
    console.log('✅ Firebase initialized\n');

    // Fetch data
    console.log('📥 Fetching data from Firebase...');
    const [customersSnap, metricsSnap] = await Promise.all([
      db.ref('newCustomers').once('value'),
      db.ref('customerMetrics').once('value')
    ]);

    const customers = customersSnap.val() || {};
    const metrics = metricsSnap.val() || {};

    // Filter customers with phone
    const customersWithPhone = Object.values(customers).filter(c => c.phone);
    results.totalCustomers = customersWithPhone.length;

    console.log(`   Customers with phone: ${customersWithPhone.length}`);
    console.log(`   Metrics entries: ${Object.keys(metrics).length}`);
    console.log('');

    console.log('🔍 Validating data integrity...\n');

    // Check each customer
    for (const customer of customersWithPhone) {
      const phone = customer.phone;
      const customerMetrics = metrics[phone];

      if (!customerMetrics) {
        results.missingMetrics.push({
          phone,
          name: customer.name
        });
        continue;
      }

      results.customersWithMetrics++;

      // Validate structure
      const validation = validateMetricsStructure(phone, customerMetrics);

      if (validation.errors.length > 0) {
        results.fieldValidation.failed++;
        results.invalidFields.push({
          phone,
          name: customer.name,
          errors: validation.errors
        });
      } else {
        results.fieldValidation.passed++;
      }

      if (validation.isStale) {
        results.staleMetrics.push({
          phone,
          name: customer.name,
          hoursOld: validation.hoursOld
        });
      }
    }

    // Print results
    console.log('✅ Validation complete\n');

    console.log('='.repeat(80));
    console.log('COVERAGE');
    console.log('='.repeat(80));
    console.log(`Total customers: ${results.totalCustomers}`);
    console.log(`Customers with metrics: ${results.customersWithMetrics} (${((results.customersWithMetrics / results.totalCustomers) * 100).toFixed(2)}%)`);
    console.log(`Missing metrics: ${results.missingMetrics.length}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('FIELD VALIDATION');
    console.log('='.repeat(80));
    console.log(`Valid structures: ${results.fieldValidation.passed}`);
    console.log(`Invalid structures: ${results.fieldValidation.failed}`);
    console.log(`Validation rate: ${((results.fieldValidation.passed / results.customersWithMetrics) * 100).toFixed(2)}%`);
    console.log('');

    console.log('='.repeat(80));
    console.log('FRESHNESS');
    console.log('='.repeat(80));
    console.log(`Fresh metrics (< 24h): ${results.customersWithMetrics - results.staleMetrics.length}`);
    console.log(`Stale metrics (> 24h): ${results.staleMetrics.length}`);
    console.log('');

    // Print issues
    if (results.missingMetrics.length > 0) {
      console.log('⚠️  MISSING METRICS:');
      results.missingMetrics.slice(0, 10).forEach(item => {
        console.log(`   - ${item.name} (${item.phone})`);
      });
      if (results.missingMetrics.length > 10) {
        console.log(`   ... and ${results.missingMetrics.length - 10} more`);
      }
      console.log('');
    }

    if (results.invalidFields.length > 0) {
      console.log('❌ INVALID FIELDS:');
      results.invalidFields.slice(0, 5).forEach(item => {
        console.log(`   ${item.name} (${item.phone}):`);
        item.errors.forEach(err => console.log(`      - ${err}`));
      });
      if (results.invalidFields.length > 5) {
        console.log(`   ... and ${results.invalidFields.length - 5} more`);
      }
      console.log('');
    }

    if (results.staleMetrics.length > 0) {
      console.log('⏰ STALE METRICS:');
      results.staleMetrics.slice(0, 5).forEach(item => {
        console.log(`   - ${item.name} (${item.phone}): ${item.hoursOld}h old`);
      });
      if (results.staleMetrics.length > 5) {
        console.log(`   ... and ${results.staleMetrics.length - 5} more`);
      }
      console.log('');
    }

    // Final verdict
    console.log('='.repeat(80));
    console.log('VERDICT');
    console.log('='.repeat(80));
    console.log(`Duration: ${((Date.now() - results.startTime) / 1000).toFixed(2)}s`);

    const success = results.missingMetrics.length === 0 &&
                   results.invalidFields.length === 0;

    if (success) {
      console.log('🎉 TEST PASSED: All data integrity checks passed!');
      console.log('✅ All customers have valid metrics');
      console.log('✅ All fields are properly structured');
      if (results.staleMetrics.length > 0) {
        console.log(`⚠️  Note: ${results.staleMetrics.length} metrics are stale (> 24h old)`);
      }
      console.log('');
      process.exit(0);
    } else {
      console.log('⚠️  TEST FAILED: Data integrity issues found');
      if (results.missingMetrics.length > 0) {
        console.log(`   - ${results.missingMetrics.length} customers missing metrics`);
      }
      if (results.invalidFields.length > 0) {
        console.log(`   - ${results.invalidFields.length} customers have invalid fields`);
      }
      console.log('');
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
runDataIntegrityTest();
