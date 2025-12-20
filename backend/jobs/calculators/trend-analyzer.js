/**
 * Calculate trend metrics for a product
 */
function analyzeTrend(product) {
  const { orderDates, recent7Days, recent30Days } = product;

  // Get previous 7 days range (8-14 days ago)
  const now = Date.now();
  const previous7dStart = now - (14 * 24 * 60 * 60 * 1000);
  const previous7dEnd = now - (7 * 24 * 60 * 60 * 1000);

  // Count orders in previous 7 days
  const previous7dOrders = orderDates.filter(date =>
    date >= previous7dStart && date < previous7dEnd
  ).length;

  const current7dOrders = recent7Days.orders;

  // Calculate trend score (-1 to +1)
  let trendScore = 0;
  let growthRate = 0;

  if (previous7dOrders > 0) {
    growthRate = ((current7dOrders - previous7dOrders) / previous7dOrders) * 100;
    trendScore = Math.max(-1, Math.min(1, growthRate / 200)); // Normalize to -1 to +1
  } else if (current7dOrders > 0) {
    growthRate = 100; // New product or surge
    trendScore = 1;
  }

  // Determine direction
  let direction = 'stable';
  if (trendScore > 0.1) direction = 'rising';
  else if (trendScore < -0.1) direction = 'falling';

  // Determine velocity
  let velocity = 'steady';
  if (Math.abs(trendScore) > 0.3) velocity = 'accelerating';
  else if (Math.abs(trendScore) < 0.1) velocity = 'slowing';

  // Calculate confidence (based on sample size)
  const totalOrders = current7dOrders + previous7dOrders;
  const confidence = Math.min(1, totalOrders / 20); // Full confidence at 20+ orders

  return {
    direction,
    score: Math.round(trendScore * 100) / 100,
    growthRate: Math.round(growthRate * 10) / 10,
    velocity,
    confidence: Math.round(confidence * 100) / 100
  };
}

module.exports = { analyzeTrend };
