/**
 * Unit Tests for Individual Calculator Modules
 * Tests each calculator in isolation with various edge cases
 */

const { aggregateCustomerData, parseCFAbsoluteTime } = require('./calculators/customer-aggregator');
const {
  calculateRFM,
  calculateRecencyScore,
  calculateFrequencyScore,
  calculateMonetaryScore,
  getCustomerSegment
} = require('./calculators/customer-rfm');
const {
  calculateCLV,
  getCLVSegment,
  calculateChurnRisk,
  calculateHealthScore,
  getLoyaltyStage
} = require('./calculators/customer-metrics');
const { parseAddress, HCM_DISTRICTS } = require('./calculators/customer-location');

// Test tracking
const results = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('CALCULATOR MODULE UNIT TESTS');
console.log('='.repeat(80) + '\n');

// ========== CUSTOMER AGGREGATOR TESTS ==========
console.log('📋 Testing: customer-aggregator.js\n');

test('parseCFAbsoluteTime converts correctly', () => {
  // CFAbsoluteTime 0 = 2001-01-01 00:00:00 UTC
  const result = parseCFAbsoluteTime(0);
  const expected = 978307200000; // Unix timestamp in ms
  assertEqual(result, expected);
});

test('parseCFAbsoluteTime handles invalid input', () => {
  const result = parseCFAbsoluteTime(null);
  assert(result > 0, 'Should return current time for invalid input');
});

test('aggregateCustomerData filters out customers without phone', () => {
  const customers = {
    c1: { phone: '0901234567', name: 'Test' },
    c2: { name: 'No Phone' }, // No phone
    c3: { phone: '', name: 'Empty Phone' } // Empty phone
  };
  const orders = {};

  const result = aggregateCustomerData(customers, orders);
  assertEqual(result.size, 1, 'Should only include customer with valid phone');
  assert(result.has('0901234567'), 'Should have customer c1');
});

test('aggregateCustomerData matches orders to customers', () => {
  const customers = {
    c1: { phone: '0901234567', name: 'Test', createdAt: 0 }
  };
  const orders = {
    o1: {
      customer: { phone: '0901234567' },
      orderDate: 100000,
      cakes: [{ price: 100000, amount: 2 }]
    },
    o2: {
      customer: { phone: '0901234567' },
      orderDate: 200000,
      cakes: [{ price: 150000, amount: 1 }]
    }
  };

  const result = aggregateCustomerData(customers, orders);
  const customer = result.get('0901234567');

  assertEqual(customer.totalOrders, 2, 'Should have 2 orders');
  assertEqual(customer.totalSpent, 350000, 'Should calculate total spent correctly');
  assertEqual(customer.aov, 175000, 'Should calculate AOV correctly');
});

test('aggregateCustomerData handles customers with no orders', () => {
  const customers = {
    c1: { phone: '0901234567', name: 'No Orders', createdAt: 0 }
  };
  const orders = {};

  const result = aggregateCustomerData(customers, orders);
  const customer = result.get('0901234567');

  assertEqual(customer.totalOrders, 0);
  assertEqual(customer.totalSpent, 0);
  assertEqual(customer.aov, 0);
  assertEqual(customer.lastOrderTimestamp, 0);
});

test('aggregateCustomerData handles orders with missing prices', () => {
  const customers = {
    c1: { phone: '0901234567', name: 'Test', createdAt: 0 }
  };
  const orders = {
    o1: {
      customer: { phone: '0901234567' },
      cakes: [
        { price: 100000, amount: 1 },
        { amount: 2 }, // Missing price
        { price: 50000 } // Missing amount
      ]
    }
  };

  const result = aggregateCustomerData(customers, orders);
  const customer = result.get('0901234567');

  assertEqual(customer.totalSpent, 100000, 'Should handle missing values as 0');
});

// ========== RFM CALCULATOR TESTS ==========
console.log('\n📋 Testing: customer-rfm.js\n');

test('calculateRecencyScore returns correct scores', () => {
  assertEqual(calculateRecencyScore(5), 5, 'Recent (7 days)');
  assertEqual(calculateRecencyScore(15), 4, 'Recent (30 days)');
  assertEqual(calculateRecencyScore(60), 3, 'Medium (90 days)');
  assertEqual(calculateRecencyScore(120), 2, 'Old (180 days)');
  assertEqual(calculateRecencyScore(200), 1, 'Very old (>180 days)');
});

test('calculateFrequencyScore returns correct scores', () => {
  assertEqual(calculateFrequencyScore(1), 1, '1 order');
  assertEqual(calculateFrequencyScore(2), 2, '2 orders');
  assertEqual(calculateFrequencyScore(3), 3, '3 orders');
  assertEqual(calculateFrequencyScore(6), 4, '6 orders');
  assertEqual(calculateFrequencyScore(10), 5, '10+ orders');
});

test('calculateMonetaryScore handles empty customer list', () => {
  const customer = { phone: '123', totalSpent: 1000000 };
  const score = calculateMonetaryScore(customer, []);
  assertEqual(score, 3, 'Should return 3 for empty list');
});

test('calculateMonetaryScore ranks correctly', () => {
  const customers = [
    { phone: '1', totalSpent: 5000000 },
    { phone: '2', totalSpent: 3000000 },
    { phone: '3', totalSpent: 1000000 },
    { phone: '4', totalSpent: 500000 },
    { phone: '5', totalSpent: 100000 }
  ];

  assertEqual(calculateMonetaryScore(customers[0], customers), 5, 'Top spender');
  assertEqual(calculateMonetaryScore(customers[2], customers), 3, 'Middle spender');
  assertEqual(calculateMonetaryScore(customers[4], customers), 1, 'Bottom spender');
});

test('getCustomerSegment identifies Champions', () => {
  const segment = getCustomerSegment({ R: 5, F: 5, M: 5 });
  assertEqual(segment, 'Champions');
});

test('getCustomerSegment identifies Lost customers', () => {
  const segment = getCustomerSegment({ R: 1, F: 1, M: 1 });
  assertEqual(segment, 'Lost');
});

test('calculateRFM returns complete structure', () => {
  const customer = {
    phone: '123',
    orders: 5,
    totalSpent: 1000000,
    rawLastOrder: Date.now() - (15 * 24 * 60 * 60 * 1000) // 15 days ago
  };
  const allCustomers = [customer];

  const rfm = calculateRFM(customer, allCustomers);

  assert('R' in rfm);
  assert('F' in rfm);
  assert('M' in rfm);
  assert('total' in rfm);
  assert('pattern' in rfm);
  assert('segment' in rfm);
  assert('daysSinceLastOrder' in rfm);

  assertEqual(rfm.R, 4, 'Recent customer');
  assertEqual(rfm.F, 3, '5 orders = score 3');
  assert(rfm.daysSinceLastOrder >= 14 && rfm.daysSinceLastOrder <= 16);
});

test('calculateRFM handles customer with no orders', () => {
  const customer = {
    phone: '123',
    orders: 0,
    totalSpent: 0,
    rawLastOrder: 0
  };

  const rfm = calculateRFM(customer, [customer]);

  assertEqual(rfm.R, 1, 'No orders = lowest recency');
  assertEqual(rfm.F, 1, 'No orders = lowest frequency');
  assert(rfm.daysSinceLastOrder > 100000, 'Should have very high days value');
});

// ========== METRICS CALCULATOR TESTS ==========
console.log('\n📋 Testing: customer-metrics.js\n');

test('calculateCLV returns positive value for active customer', () => {
  const customer = {
    orders: 5,
    aov: 200000,
    createdAt: Date.now() - (180 * 24 * 60 * 60 * 1000) // 6 months ago
  };

  const clv = calculateCLV(customer);
  assert(clv > 0, 'CLV should be positive');
  assert(clv > customer.aov, 'CLV should be greater than AOV');
});

test('calculateCLV handles new customer', () => {
  const customer = {
    orders: 1,
    aov: 150000,
    createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000) // 1 week ago
  };

  const clv = calculateCLV(customer);
  assert(clv > 0, 'Should calculate CLV for new customer');
});

test('getCLVSegment categorizes correctly', () => {
  const allCLVs = [1000000, 800000, 600000, 400000, 200000, 100000, 50000, 20000, 10000, 5000];

  assertEqual(getCLVSegment(1000000, allCLVs), 'VIP', 'Top CLV');
  assertEqual(getCLVSegment(600000, allCLVs), 'High', 'High CLV');
  assertEqual(getCLVSegment(200000, allCLVs), 'Medium', 'Medium CLV');
  assertEqual(getCLVSegment(5000, allCLVs), 'Low', 'Low CLV');
});

test('calculateChurnRisk identifies high risk', () => {
  const customer = {
    orders: 10,
    trend: -60
  };
  const rfm = {
    daysSinceLastOrder: 200,
    R: 1
  };

  const churnRisk = calculateChurnRisk(customer, rfm);
  assertEqual(churnRisk.level, 'high', 'Should identify high churn risk');
  assert(churnRisk.score >= 60, 'Score should be >= 60');
});

test('calculateChurnRisk identifies low risk', () => {
  const customer = {
    orders: 5,
    trend: 20
  };
  const rfm = {
    daysSinceLastOrder: 15,
    R: 4
  };

  const churnRisk = calculateChurnRisk(customer, rfm);
  assertEqual(churnRisk.level, 'low', 'Should identify low churn risk');
  assert(churnRisk.score < 30, 'Score should be < 30');
});

test('calculateHealthScore returns value 0-100', () => {
  const customer = { orders: 5, trend: 10 };
  const rfm = { R: 4, F: 3, M: 4 };

  const healthScore = calculateHealthScore(customer, rfm);
  assert(healthScore >= 0 && healthScore <= 100, 'Health score should be 0-100');
});

test('calculateHealthScore perfect customer gets high score', () => {
  const customer = { orders: 10, trend: 60 };
  const rfm = { R: 5, F: 5, M: 5 };

  const healthScore = calculateHealthScore(customer, rfm);
  assert(healthScore >= 90, 'Perfect customer should have score >= 90');
});

test('getLoyaltyStage identifies Champion', () => {
  const customer = { orders: 12, trend: 10 };
  const rfm = { daysSinceLastOrder: 20 };

  const loyalty = getLoyaltyStage(customer, rfm);
  assertEqual(loyalty.stage, 'Champion');
  assertEqual(loyalty.label, 'Champion');
});

test('getLoyaltyStage identifies Lost customer', () => {
  const customer = { orders: 5, trend: -20 };
  const rfm = { daysSinceLastOrder: 200 };

  const loyalty = getLoyaltyStage(customer, rfm);
  assertEqual(loyalty.stage, 'Lost');
  assertEqual(loyalty.label, 'Đã mất');
});

test('getLoyaltyStage identifies At Risk', () => {
  const customer = { orders: 8, trend: -30 };
  const rfm = { daysSinceLastOrder: 120 };

  const loyalty = getLoyaltyStage(customer, rfm);
  assertEqual(loyalty.stage, 'At Risk');
  assertEqual(loyalty.label, 'Nguy cơ cao');
});

test('getLoyaltyStage handles new customer', () => {
  const customer = { orders: 1, trend: 0 };
  const rfm = { daysSinceLastOrder: 10 };

  const loyalty = getLoyaltyStage(customer, rfm);
  assertEqual(loyalty.stage, 'New');
  assertEqual(loyalty.label, 'Mới');
});

// ========== LOCATION PARSER TESTS ==========
console.log('\n📋 Testing: customer-location.js\n');

test('parseAddress identifies District 1', () => {
  const result = parseAddress('123 Nguyen Hue, Quan 1, TP.HCM');
  assertEqual(result.district, 'Quận 1');
  assertEqual(result.zone, 'Trung tâm');
});

test('parseAddress identifies District 7', () => {
  const result = parseAddress('456 Nguyen Van Linh, Q7, HCM');
  assertEqual(result.district, 'Quận 7');
  assertEqual(result.zone, 'Nam');
});

test('parseAddress handles Thu Duc', () => {
  const result = parseAddress('789 Xa Lo Ha Noi, Thu Duc');
  assertEqual(result.district, 'Thủ Đức');
  assertEqual(result.zone, 'Đông');
});

test('parseAddress handles Binh Thanh', () => {
  const result = parseAddress('Dien Bien Phu, Binh Thanh');
  assertEqual(result.district, 'Bình Thạnh');
  assertEqual(result.zone, 'Bắc');
});

test('parseAddress handles unknown district', () => {
  const result = parseAddress('Some address in Hanoi');
  assertEqual(result.district, 'Unknown');
  assertEqual(result.zone, 'Unknown');
});

test('parseAddress handles empty address', () => {
  const result = parseAddress('');
  assertEqual(result.district, 'Unknown');
  assertEqual(result.zone, 'Unknown');
});

test('parseAddress handles null address', () => {
  const result = parseAddress(null);
  assertEqual(result.district, 'Unknown');
  assertEqual(result.zone, 'Unknown');
});

test('parseAddress handles case insensitive', () => {
  const result1 = parseAddress('QUAN 3');
  const result2 = parseAddress('quan 3');
  const result3 = parseAddress('Quận 3');

  assertEqual(result1.district, 'Quận 3');
  assertEqual(result2.district, 'Quận 3');
  assertEqual(result3.district, 'Quận 3');
});

test('HCM_DISTRICTS has 24 districts', () => {
  assertEqual(HCM_DISTRICTS.length, 24, 'Should have all 24 districts of HCM');
});

// ========== PRINT SUMMARY ==========
console.log('\n' + '='.repeat(80));
console.log('UNIT TEST SUMMARY');
console.log('='.repeat(80) + '\n');

const total = results.passed + results.failed;
const passRate = ((results.passed / total) * 100).toFixed(1);

console.log(`Total tests: ${total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Pass rate: ${passRate}%`);

if (results.failed > 0) {
  console.log('\n--- Failed Tests ---');
  results.tests
    .filter(t => !t.passed)
    .forEach(t => {
      console.log(`❌ ${t.name}`);
      console.log(`   Error: ${t.error}`);
    });
}

console.log('\n' + '='.repeat(80));
if (results.failed === 0) {
  console.log('✅ ALL UNIT TESTS PASSED');
} else {
  console.log(`⚠️  ${results.failed} TESTS FAILED`);
}
console.log('='.repeat(80) + '\n');

process.exit(results.failed === 0 ? 0 : 1);
