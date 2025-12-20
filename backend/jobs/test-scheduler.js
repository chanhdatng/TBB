require('dotenv').config();
const { runProductAnalyticsJob, runCustomerAnalyticsJob, getSchedulerStatus } = require('./scheduler');
const logger = require('./utils/logger');

/**
 * Test script for scheduler functions
 */
async function testScheduler() {
  console.log('\n=== Testing Analytics Scheduler ===\n');

  try {
    // Test 1: Get initial status
    console.log('Test 1: Get scheduler status');
    const initialStatus = getSchedulerStatus();
    console.log('Initial status:', JSON.stringify(initialStatus, null, 2));

    // Test 2: Run customer analytics manually
    console.log('\n\nTest 2: Run customer analytics job manually');
    const customerResult = await runCustomerAnalyticsJob('test');
    console.log('Customer analytics result:', JSON.stringify(customerResult, null, 2));

    // Test 3: Get status after customer analytics
    console.log('\n\nTest 3: Get status after customer analytics');
    const afterCustomerStatus = getSchedulerStatus();
    console.log('Status after customer analytics:', JSON.stringify(afterCustomerStatus, null, 2));

    // Test 4: Try to run customer analytics while running (should be skipped)
    console.log('\n\nTest 4: Try to run customer analytics concurrently (should skip)');
    const concurrentResult = await runCustomerAnalyticsJob('test');
    console.log('Concurrent run result:', JSON.stringify(concurrentResult, null, 2));

    // Test 5: Run product analytics manually
    console.log('\n\nTest 5: Run product analytics job manually');
    const productResult = await runProductAnalyticsJob('test');
    console.log('Product analytics result:', JSON.stringify(productResult, null, 2));

    // Test 6: Final status
    console.log('\n\nTest 6: Final scheduler status');
    const finalStatus = getSchedulerStatus();
    console.log('Final status:', JSON.stringify(finalStatus, null, 2));

    console.log('\n\n=== All Tests Completed ===\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testScheduler();
