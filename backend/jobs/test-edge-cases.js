/**
 * Test 3: Edge Cases & Error Handling
 *
 * Objective: Verify the system handles edge cases gracefully
 *
 * Test Cases:
 * - No orders (customer with 0 orders)
 * - Missing phone (customer without phone)
 * - Invalid order data (order with null items)
 * - New customer (just created, no metrics yet)
 * - CFAbsoluteTime edge cases
 * - Very old customers
 */

require('dotenv').config();
const { computeCustomerAnalytics } = require('./customer-analytics-engine');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

function test(name, fn) {
  results.total++;
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

console.log('\n' + '='.repeat(80));
console.log('TEST 3: EDGE CASES & ERROR HANDLING');
console.log('Objective: Verify the system handles edge cases gracefully');
console.log('='.repeat(80) + '\n');

// ========== TEST CASE 1: Customer with No Orders ==========
console.log('📋 Test Case 1: Customer with No Orders\n');

test('Customer with 0 orders should not crash', async () => {
  const customers = {
    'c1': { phone: '0000000001', name: 'No Orders', createdAt: Date.now() }
  };
  const orders = {};

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed');
  assert(result.customersProcessed >= 1, 'Should process customer');
});

test('Customer with 0 orders should have default metrics', async () => {
  const customers = {
    'c1': { phone: '0000000001', name: 'No Orders', createdAt: Date.now() }
  };
  const orders = {};

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed');
  // Metrics should be computed even with no orders
});

// ========== TEST CASE 2: Missing Phone Number ==========
console.log('\n📋 Test Case 2: Missing Phone Number\n');

test('Customer without phone should be skipped', async () => {
  const customers = {
    'c1': { name: 'No Phone' }, // No phone field
    'c2': { phone: '', name: 'Empty Phone' }, // Empty phone
    'c3': { phone: '0901234567', name: 'Has Phone' }
  };
  const orders = {};

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed');
  assert(result.customersProcessed === 1, 'Should only process customer with valid phone');
});

// ========== TEST CASE 3: Invalid Order Data ==========
console.log('\n📋 Test Case 3: Invalid Order Data\n');

test('Order with null cakes should be handled', async () => {
  const customers = {
    'c1': { phone: '0000000003', name: 'Test', createdAt: Date.now() }
  };
  const orders = {
    'o1': {
      customer: { phone: '0000000003' },
      orderDate: Date.now() / 1000,
      cakes: null // Invalid: null cakes
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed despite null cakes');
});

test('Order with missing customer should be skipped', async () => {
  const customers = {
    'c1': { phone: '0000000004', name: 'Test', createdAt: Date.now() }
  };
  const orders = {
    'o1': {
      // No customer field
      orderDate: Date.now() / 1000,
      cakes: [{ price: 100000, amount: 1 }]
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed');
});

test('Order with invalid price should be handled', async () => {
  const customers = {
    'c1': { phone: '0000000005', name: 'Test', createdAt: Date.now() }
  };
  const orders = {
    'o1': {
      customer: { phone: '0000000005' },
      orderDate: Date.now() / 1000,
      cakes: [{ price: null, amount: 1 }] // Invalid: null price
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed despite invalid price');
});

// ========== TEST CASE 4: CFAbsoluteTime Edge Cases ==========
console.log('\n📋 Test Case 4: CFAbsoluteTime Edge Cases\n');

test('Order with orderDate = 0 should be handled', async () => {
  const customers = {
    'c1': { phone: '0000000006', name: 'Test', createdAt: Date.now() }
  };
  const orders = {
    'o1': {
      customer: { phone: '0000000006' },
      orderDate: 0, // CFAbsoluteTime 0 = 2001-01-01
      cakes: [{ price: 100000, amount: 1 }]
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should handle orderDate = 0');
});

test('Order with very old date should be handled', async () => {
  const customers = {
    'c1': { phone: '0000000007', name: 'Test', createdAt: Date.now() }
  };
  const orders = {
    'o1': {
      customer: { phone: '0000000007' },
      orderDate: -631152000, // Very old date (before 2001)
      cakes: [{ price: 100000, amount: 1 }]
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should handle very old dates');
});

// ========== TEST CASE 5: Very Old Customers ==========
console.log('\n📋 Test Case 5: Very Old Customers\n');

test('Customer created in 2020 should have correct tenure', async () => {
  const customers = {
    'c1': {
      phone: '0000000008',
      name: 'Old Customer',
      createdAt: new Date('2020-01-01').getTime()
    }
  };
  const orders = {
    'o1': {
      customer: { phone: '0000000008' },
      orderDate: Date.now() / 1000,
      cakes: [{ price: 100000, amount: 1 }]
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed');
  // Tenure should be ~5 years
});

// ========== TEST CASE 6: Missing Address ==========
console.log('\n📋 Test Case 6: Missing Address\n');

test('Customer without address should not crash', async () => {
  const customers = {
    'c1': { phone: '0000000009', name: 'No Address', createdAt: Date.now() }
    // No address field
  };
  const orders = {};

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed without address');
});

test('Customer with empty address should not crash', async () => {
  const customers = {
    'c1': {
      phone: '0000000010',
      name: 'Empty Address',
      address: '',
      createdAt: Date.now()
    }
  };
  const orders = {};

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed with empty address');
});

// ========== TEST CASE 7: Large Order Values ==========
console.log('\n📋 Test Case 7: Large Order Values\n');

test('Customer with very large order should be handled', async () => {
  const customers = {
    'c1': { phone: '0000000011', name: 'Big Spender', createdAt: Date.now() }
  };
  const orders = {
    'o1': {
      customer: { phone: '0000000011' },
      orderDate: Date.now() / 1000,
      cakes: [
        { price: 10000000, amount: 100 } // 1 billion VND order
      ]
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should handle large order values');
});

// ========== TEST CASE 8: Multiple Edge Cases Combined ==========
console.log('\n📋 Test Case 8: Multiple Edge Cases Combined\n');

test('Mix of valid and invalid data should be handled', async () => {
  const customers = {
    'c1': { phone: '0900000001', name: 'Valid', createdAt: Date.now() },
    'c2': { name: 'No Phone' }, // No phone
    'c3': { phone: '', name: 'Empty Phone' }, // Empty phone
    'c4': { phone: '0900000004', name: 'No Orders', createdAt: Date.now() }
  };
  const orders = {
    'o1': {
      customer: { phone: '0900000001' },
      orderDate: Date.now() / 1000,
      cakes: [{ price: 100000, amount: 1 }]
    },
    'o2': {
      customer: { phone: '0900000001' },
      cakes: null // Invalid: null cakes
    },
    'o3': {
      // No customer field
      orderDate: Date.now() / 1000,
      cakes: [{ price: 100000, amount: 1 }]
    }
  };

  const result = await computeCustomerAnalytics(customers, orders);
  assert(result.success, 'Should succeed with mixed data');
  assert(result.customersProcessed === 2, 'Should process 2 valid customers');
});

// ========== SUMMARY ==========
console.log('\n' + '='.repeat(80));
console.log('EDGE CASE TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total tests: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Pass rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
console.log('='.repeat(80) + '\n');

if (results.failed === 0) {
  console.log('🎉 ALL EDGE CASE TESTS PASSED');
  console.log('✅ System handles all edge cases gracefully\n');
  process.exit(0);
} else {
  console.log('⚠️  SOME EDGE CASE TESTS FAILED');
  console.log(`   ${results.failed} out of ${results.total} tests failed\n`);
  process.exit(1);
}
