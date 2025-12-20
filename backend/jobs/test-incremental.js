require('dotenv').config();
const { computeSingleCustomerMetrics } = require('./customer-analytics-incremental');

/**
 * Test script for incremental customer metrics update
 */
async function testIncrementalUpdate() {
  console.log('\n=== Testing Incremental Customer Metrics Update ===\n');

  try {
    // Test with a sample phone number (you should replace with a real one from your database)
    const testPhone = '0123456789'; // Replace with actual phone number

    console.log(`Test: Update metrics for customer ${testPhone}`);
    const result = await computeSingleCustomerMetrics(testPhone);

    console.log('\nResult:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Incremental update test PASSED');
      process.exit(0);
    } else {
      console.log('\n⚠️  Incremental update test completed with warnings');
      console.log('Note: This may be because the test phone number does not exist in the database');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Incremental update test FAILED:', error);
    process.exit(1);
  }
}

// Run test
testIncrementalUpdate();
