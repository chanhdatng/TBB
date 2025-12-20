require('dotenv').config();
const { runCustomerAnalyticsJob, getSchedulerStatus } = require('./scheduler');

/**
 * Test mutex lock - run two jobs truly concurrently
 */
async function testMutexLock() {
  console.log('\n=== Testing Mutex-Based Concurrent Execution Prevention ===\n');

  try {
    console.log('Starting two jobs simultaneously...\n');

    // Start both jobs at the same time (don't await the first one)
    const job1Promise = runCustomerAnalyticsJob('test-concurrent-1');
    const job2Promise = runCustomerAnalyticsJob('test-concurrent-2');

    // Wait for both to complete
    const [result1, result2] = await Promise.all([job1Promise, job2Promise]);

    console.log('\n\n=== Results ===\n');
    console.log('Job 1 Result:', JSON.stringify(result1, null, 2));
    console.log('\nJob 2 Result:', JSON.stringify(result2, null, 2));

    // Verify one succeeded and one was skipped
    if (result1.success && result2.skipped) {
      console.log('\n✅ TEST PASSED: Job 1 executed, Job 2 skipped (mutex working correctly)');
      process.exit(0);
    } else if (result1.skipped && result2.success) {
      console.log('\n✅ TEST PASSED: Job 2 executed, Job 1 skipped (mutex working correctly)');
      process.exit(0);
    } else if (result1.success && result2.success) {
      console.log('\n❌ TEST FAILED: Both jobs executed (mutex NOT working - race condition exists)');
      process.exit(1);
    } else {
      console.log('\n⚠️ UNEXPECTED RESULT: Check output above');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run test
testMutexLock();
