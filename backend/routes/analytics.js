const express = require('express');
const router = express.Router();
const { runProductAnalyticsJob, runCustomerAnalyticsJob, getSchedulerStatus } = require('../jobs/scheduler');
const { computeSingleCustomerMetrics } = require('../jobs/customer-analytics-incremental');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/analytics/status
 * Get scheduler status and last run info
 * Public endpoint for monitoring
 */
router.get('/status', (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/product/refresh
 * Manually trigger product analytics computation
 * Protected: Requires valid JWT token with admin role
 */
router.post('/product/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Check if already running
    const status = getSchedulerStatus();
    if (status.product.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Product analytics job is already running',
        status: status.product
      });
    }

    // Run job
    const result = await runProductAnalyticsJob('manual-api');

    if (result.success) {
      res.json({
        success: true,
        message: 'Product analytics computation completed',
        data: result
      });
    } else if (result.skipped) {
      res.status(409).json({
        success: false,
        error: result.error,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        data: result
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/customer/refresh
 * Manually trigger customer analytics computation
 * Protected: Requires valid JWT token with admin role
 */
router.post('/customer/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Check if already running
    const status = getSchedulerStatus();
    if (status.customer.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Customer analytics job is already running',
        status: status.customer
      });
    }

    // Run job
    const result = await runCustomerAnalyticsJob('manual-api');

    if (result.success) {
      res.json({
        success: true,
        message: 'Customer analytics computation completed',
        data: result
      });
    } else if (result.skipped) {
      res.status(409).json({
        success: false,
        error: result.error,
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        data: result
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/customer/refresh/:phone
 * Trigger incremental update for a single customer
 * Protected: Requires valid JWT token with admin role
 */
router.post('/customer/refresh/:phone', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { phone } = req.params;

    // Validate phone parameter
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Vietnam phone format validation: 10-11 digits, starting with 0
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Expected Vietnam phone format (e.g., 0901234567)'
      });
    }

    // Sanitize phone (remove any non-digit characters that might have slipped through)
    const sanitizedPhone = phone.replace(/\D/g, '');

    const result = await computeSingleCustomerMetrics(sanitizedPhone);

    if (result.success) {
      res.json({
        success: true,
        message: `Customer ${phone} metrics updated`,
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        data: result
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/health
 * Health check endpoint for monitoring
 */
router.get('/health', (req, res) => {
  const status = getSchedulerStatus();

  // Determine health based on last runs
  let healthy = true;
  let messages = [];

  if (status.product.lastRun && !status.product.lastRun.success) {
    healthy = false;
    messages.push(`Product analytics failed: ${status.product.lastRun.error}`);
  }

  if (status.customer.lastRun && !status.customer.lastRun.success) {
    healthy = false;
    messages.push(`Customer analytics failed: ${status.customer.lastRun.error}`);
  }

  const message = healthy ? 'All schedulers are healthy' : messages.join('; ');

  res.status(healthy ? 200 : 503).json({
    healthy,
    message,
    product: {
      schedulerActive: status.product.schedulerActive,
      lastRun: status.product.lastRun?.completedAt || status.product.lastRun?.failedAt || null
    },
    customer: {
      schedulerActive: status.customer.schedulerActive,
      lastRun: status.customer.lastRun?.completedAt || status.customer.lastRun?.failedAt || null
    }
  });
});

module.exports = router;
