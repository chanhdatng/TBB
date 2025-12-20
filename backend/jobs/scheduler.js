const cron = require('node-cron');
const { Mutex } = require('async-mutex');
const logger = require('./utils/logger');
const { computeProductAnalytics } = require('./analytics-engine');
const { computeCustomerAnalytics } = require('./customer-analytics-engine');
const { resetStocks } = require('./stock-reset');
const { generateOrderCounts } = require('./calculators/ordercounts-generator');

// Mutex locks to prevent concurrent execution
const productMutex = new Mutex();
const customerMutex = new Mutex();
const stockMutex = new Mutex();
const orderCountsMutex = new Mutex();

// Job state tracking
let lastProductRunResult = null;
let lastCustomerRunResult = null;
let lastStockRunResult = null;
let lastOrderCountsRunResult = null;
let productScheduledJob = null;
let customerScheduledJob = null;
let stockScheduledJob = null;
let orderCountsScheduledJob = null;

/**
 * Schedule analytics jobs
 * - Product analytics: Daily at 00:00 Vietnam time (UTC+7)
 * - Customer analytics: Hourly at :00
 */
function initScheduler() {
  // Schedule: Product analytics at 00:00 VN time daily
  productScheduledJob = cron.schedule('0 0 * * *', async () => {
    await runProductAnalyticsJob('scheduled');
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  // Schedule: Customer analytics at 00:00 VN time daily
  customerScheduledJob = cron.schedule('0 0 * * *', async () => {
    await runCustomerAnalyticsJob('scheduled');
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  // Schedule: Stock reset at 00:00 VN time daily
  stockScheduledJob = cron.schedule('0 0 * * *', async () => {
    await runStockResetJob('scheduled');
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  // Schedule: OrderCounts generation at 00:01 VN time daily (Phase 4)
  orderCountsScheduledJob = cron.schedule('1 0 * * *', async () => {
    await runOrderCountsJob('scheduled');
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  logger.info('📅 Analytics schedulers initialized');
  logger.info('  - Product analytics: 00:00 daily (VN time)');
  logger.info('  - Customer analytics: 00:00 daily (VN time)');
  logger.info('  - Stock reset: 00:00 daily (VN time)');
  logger.info('  - OrderCounts: 00:01 daily (VN time) [Phase 4]');

  return { productScheduledJob, customerScheduledJob, stockScheduledJob, orderCountsScheduledJob };
}

/**
 * Stop the schedulers
 */
function stopScheduler() {
  if (productScheduledJob) {
    productScheduledJob.stop();
    logger.info('🛑 Product analytics scheduler stopped');
  }
  if (customerScheduledJob) {
    customerScheduledJob.stop();
    logger.info('🛑 Customer analytics scheduler stopped');
  }
  if (stockScheduledJob) {
    stockScheduledJob.stop();
    logger.info('🛑 Stock reset scheduler stopped');
  }
  if (orderCountsScheduledJob) {
    orderCountsScheduledJob.stop();
    logger.info('🛑 OrderCounts scheduler stopped [Phase 4]');
  }
}

/**
 * Execute product analytics job with mutex-based lock protection
 * @param {string} trigger - Source of trigger: 'scheduled', 'manual', 'manual-api', 'test'
 */
async function runProductAnalyticsJob(trigger = 'manual') {
  // Try to acquire lock - if already locked, skip execution
  if (productMutex.isLocked()) {
    logger.warn('⚠️ Product analytics job already running, skipping', { trigger });
    return {
      success: false,
      error: 'Product job already running',
      skipped: true
    };
  }

  // Acquire lock for the duration of the job
  const release = await productMutex.acquire();
  const startTime = Date.now();

  logger.info(`🚀 Starting product analytics job (trigger: ${trigger})`, {
    trigger,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await computeProductAnalytics();

    lastProductRunResult = {
      success: true,
      trigger,
      completedAt: new Date().toISOString(),
      duration: result.duration,
      productsProcessed: result.productsProcessed,
      ordersProcessed: result.ordersProcessed
    };

    logger.success('✅ Product analytics job completed', lastProductRunResult);

    return lastProductRunResult;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const errorResult = {
      success: false,
      trigger,
      failedAt: new Date().toISOString(),
      duration: `${duration}s`,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    lastProductRunResult = errorResult;
    logger.error('❌ Product analytics job failed', errorResult);

    return errorResult;

  } finally {
    // Always release the lock
    release();
  }
}

/**
 * Execute customer analytics job with mutex-based lock protection
 * @param {string} trigger - Source of trigger: 'scheduled', 'manual', 'manual-api', 'test'
 */
async function runCustomerAnalyticsJob(trigger = 'manual') {
  // Try to acquire lock - if already locked, skip execution
  if (customerMutex.isLocked()) {
    logger.warn('⚠️ Customer analytics job already running, skipping', { trigger });
    return {
      success: false,
      error: 'Customer job already running',
      skipped: true
    };
  }

  // Acquire lock for the duration of the job
  const release = await customerMutex.acquire();
  const startTime = Date.now();

  logger.info(`🚀 Starting customer analytics job (trigger: ${trigger})`, {
    trigger,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await computeCustomerAnalytics();

    lastCustomerRunResult = {
      success: true,
      trigger,
      completedAt: new Date().toISOString(),
      duration: result.duration,
      customersProcessed: result.customersProcessed,
      ordersProcessed: result.ordersProcessed
    };

    logger.success('✅ Customer analytics job completed', lastCustomerRunResult);

    return lastCustomerRunResult;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const errorResult = {
      success: false,
      trigger,
      failedAt: new Date().toISOString(),
      duration: `${duration}s`,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    lastCustomerRunResult = errorResult;
    logger.error('❌ Customer analytics job failed', errorResult);

    return errorResult;

  } finally {
    // Always release the lock
    release();
  }
}

/**
 * Execute stock reset job with mutex-based lock protection
 * @param {string} trigger - Source of trigger: 'scheduled', 'manual', 'manual-api', 'test'
 */
async function runStockResetJob(trigger = 'manual') {
  // Try to acquire lock - if already locked, skip execution
  if (stockMutex.isLocked()) {
    logger.warn('⚠️ Stock reset job already running, skipping', { trigger });
    return {
      success: false,
      error: 'Stock reset job already running',
      skipped: true
    };
  }

  // Acquire lock for the duration of the job
  const release = await stockMutex.acquire();
  const startTime = Date.now();

  logger.info(`🚀 Starting stock reset job (trigger: ${trigger})`, {
    trigger,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await resetStocks();

    lastStockRunResult = {
      ...result,
      trigger,
      completedAt: new Date().toISOString(),
      duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    };

    logger.success('✅ Stock reset job completed', lastStockRunResult);

    return lastStockRunResult;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const errorResult = {
      success: false,
      trigger,
      failedAt: new Date().toISOString(),
      duration: `${duration}s`,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    lastStockRunResult = errorResult;
    logger.error('❌ Stock reset job failed', errorResult);

    return errorResult;

  } finally {
    // Always release the lock
    release();
  }
}

/**
 * Execute orderCounts generation job with mutex-based lock protection
 * Phase 4: Firebase Bandwidth Optimization
 * @param {string} trigger - Source of trigger: 'scheduled', 'manual', 'manual-api', 'test'
 */
async function runOrderCountsJob(trigger = 'manual') {
  // Try to acquire lock - if already locked, skip execution
  if (orderCountsMutex.isLocked()) {
    logger.warn('⚠️ OrderCounts job already running, skipping', { trigger });
    return {
      success: false,
      error: 'OrderCounts job already running',
      skipped: true
    };
  }

  // Acquire lock for the duration of the job
  const release = await orderCountsMutex.acquire();
  const startTime = Date.now();

  logger.info(`🚀 Starting orderCounts generation job (trigger: ${trigger})`, {
    trigger,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await generateOrderCounts();

    lastOrderCountsRunResult = {
      ...result,
      trigger,
      completedAt: new Date().toISOString()
    };

    logger.success('✅ OrderCounts generation job completed', lastOrderCountsRunResult);

    return lastOrderCountsRunResult;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const errorResult = {
      success: false,
      trigger,
      failedAt: new Date().toISOString(),
      duration: `${duration}s`,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    lastOrderCountsRunResult = errorResult;
    logger.error('❌ OrderCounts generation job failed', errorResult);

    return errorResult;

  } finally {
    // Always release the lock
    release();
  }
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    product: {
      isRunning: productMutex.isLocked(),
      lastRun: lastProductRunResult,
      schedule: '00:00 daily (VN time)',
      schedulerActive: productScheduledJob !== null
    },
    customer: {
      isRunning: customerMutex.isLocked(),
      lastRun: lastCustomerRunResult,
      schedule: '00:00 daily (VN time)',
      schedulerActive: customerScheduledJob !== null
    },
    stock: {
      isRunning: stockMutex.isLocked(),
      lastRun: lastStockRunResult,
      schedule: '00:00 daily (VN time)',
      schedulerActive: stockScheduledJob !== null
    },
    orderCounts: {
      isRunning: orderCountsMutex.isLocked(),
      lastRun: lastOrderCountsRunResult,
      schedule: '00:01 daily (VN time)',
      schedulerActive: orderCountsScheduledJob !== null
    },
    timezone: 'Asia/Ho_Chi_Minh'
  };
}

module.exports = {
  initScheduler,
  stopScheduler,
  runProductAnalyticsJob,
  runCustomerAnalyticsJob,
  runStockResetJob,
  runOrderCountsJob,
  getSchedulerStatus
};
