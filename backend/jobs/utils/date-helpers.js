/**
 * Get date range for "yesterday" (since job runs at 00:00)
 */
function getYesterdayRange() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  return {
    start: yesterday.getTime(),
    end: yesterdayEnd.getTime(),
    dateStr: yesterday.toISOString().split('T')[0] // "2025-12-08"
  };
}

/**
 * Get date range for last N days
 */
function getLastNDaysRange(days) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return {
    start: start.getTime(),
    end: now.getTime()
  };
}

/**
 * Parse CFAbsoluteTime to JavaScript Date
 */
function parseCFTime(timestamp) {
  return new Date((timestamp + 978307200) * 1000);
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

module.exports = {
  getYesterdayRange,
  getLastNDaysRange,
  parseCFTime,
  getCurrentMonth
};
