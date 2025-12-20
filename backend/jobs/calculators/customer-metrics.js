/**
 * Advanced Customer Metrics Calculator (Backend Port)
 * CLV, Churn Risk, Health Score, Loyalty Stage calculations
 *
 * Ported from: web/src/utils/customerMetrics.js
 * Changes: ES6 exports → CommonJS
 */

// ========== CLV CALCULATION ==========

/**
 * Calculate Customer Lifetime Value
 * @param {Object} customer - Customer with orders, aov, createdAt
 * @returns {number} CLV estimate (VND)
 */
function calculateCLV(customer) {
  const createdAt = customer.createdAt || Date.now();
  const tenureDays = Math.max(1, (Date.now() - createdAt) / (1000 * 60 * 60 * 24));

  // Purchase frequency per year
  const purchaseFrequencyPerYear = (customer.orders || 0) / Math.max(tenureDays / 365, 0.1);

  // Predicted lifespan
  let predictedLifespanYears = 1;
  if (customer.orders >= 6) predictedLifespanYears = 2;
  else if (customer.orders >= 3) predictedLifespanYears = 1.5;

  // CLV = AOV × Purchase Frequency/Year × Predicted Lifespan
  const clv = (customer.aov || 0) * purchaseFrequencyPerYear * predictedLifespanYears;

  return Math.round(clv);
}

/**
 * Determine CLV segment
 * @param {number} clv - Customer's CLV
 * @param {Array} allCLVs - All CLV values for percentile calculation
 * @returns {string} 'VIP' | 'High' | 'Medium' | 'Low'
 */
function getCLVSegment(clv, allCLVs) {
  if (!allCLVs || allCLVs.length === 0) return 'Medium';

  const sorted = [...allCLVs].sort((a, b) => b - a);
  const index = sorted.findIndex(val => val <= clv);

  if (index === -1) return 'Low';

  const percentile = index / sorted.length;

  if (percentile <= 0.10) return 'VIP'; // Top 10%
  if (percentile <= 0.30) return 'High'; // 10-30%
  if (percentile <= 0.70) return 'Medium'; // 30-70%
  return 'Low'; // 70%+
}

// ========== CHURN RISK ==========

/**
 * Calculate Churn Risk Score
 * @param {Object} customer - Customer with rfm, orders, trend
 * @param {Object} rfm - RFM scores (optional if passed separately)
 * @returns {Object} { level, score, label }
 */
function calculateChurnRisk(customer, rfm) {
  const customerRFM = rfm || customer.rfm || {};
  const daysSinceLastOrder = customerRFM.daysSinceLastOrder || 999;
  const orderCount = customer.orders || customer.totalOrders || 0;
  const trend = customer.trend || 0;

  let riskScore = 0;

  // Factor 1: Recency (50% weight)
  if (daysSinceLastOrder > 180) riskScore += 50;
  else if (daysSinceLastOrder > 120) riskScore += 40;
  else if (daysSinceLastOrder > 90) riskScore += 30;
  else if (daysSinceLastOrder > 60) riskScore += 20;
  else if (daysSinceLastOrder > 45) riskScore += 15;
  else if (daysSinceLastOrder > 30) riskScore += 10;

  // Factor 2: Declining trend (30% weight)
  if (trend < -50) riskScore += 30;
  else if (trend < -30) riskScore += 25;
  else if (trend < -10) riskScore += 15;
  else if (trend < 0) riskScore += 5;

  // Factor 3: Was valuable customer? (20% weight)
  if (orderCount >= 10 && daysSinceLastOrder > 90) riskScore += 20;
  else if (orderCount >= 5 && daysSinceLastOrder > 60) riskScore += 15;
  else if (orderCount >= 3 && daysSinceLastOrder > 45) riskScore += 10;

  // Convert to level
  let level, label;
  if (riskScore >= 60) {
    level = 'high';
    label = 'Nguy cơ cao';
  } else if (riskScore >= 30) {
    level = 'medium';
    label = 'Nguy cơ TB';
  } else {
    level = 'low';
    label = 'Ổn định';
  }

  return { level, score: riskScore, label };
}

// ========== CUSTOMER HEALTH SCORE ==========

/**
 * Calculate Customer Health Score (0-100)
 * @param {Object} customer - Customer data
 * @param {Object} rfm - RFM scores (optional if passed separately)
 * @returns {number} Health score 0-100
 */
function calculateHealthScore(customer, rfm) {
  const customerRFM = rfm || customer.rfm || {};
  let score = 0;

  // Recency (25 points)
  score += (customerRFM.R || 0) * 5;

  // Frequency (25 points)
  score += (customerRFM.F || 0) * 5;

  // Monetary (25 points)
  score += (customerRFM.M || 0) * 5;

  // Trend (25 points)
  const trend = customer.trend || 0;
  if (trend > 50) score += 25;
  else if (trend > 30) score += 22;
  else if (trend > 10) score += 18;
  else if (trend > 0) score += 15;
  else if (trend > -10) score += 12;
  else if (trend > -30) score += 8;
  else if (trend > -50) score += 4;
  else score += 0;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ========== LOYALTY STAGE ==========

/**
 * Determine customer loyalty stage
 * @param {Object} customer - Customer data
 * @param {Object} rfm - RFM scores (optional if passed separately)
 * @returns {Object} { stage, label }
 */
function getLoyaltyStage(customer, rfm) {
  const customerRFM = rfm || customer.rfm || {};
  const orders = customer.orders || customer.totalOrders || 0;
  const daysSinceLastOrder = customerRFM.daysSinceLastOrder || 999;
  const trend = customer.trend || 0;

  // Lost - Đã mất khách
  if (daysSinceLastOrder > 180 && orders >= 2) {
    return { stage: 'Lost', label: 'Đã mất' };
  }

  // At Risk - Có nguy cơ mất
  if (daysSinceLastOrder > 90 && orders >= 3) {
    return { stage: 'At Risk', label: 'Nguy cơ cao' };
  }

  // Champion - Khách hàng xuất sắc
  if (orders >= 10 && daysSinceLastOrder <= 45 && trend >= 0) {
    return { stage: 'Champion', label: 'Champion' };
  }

  // Loyal - Trung thành
  if (orders >= 5 && daysSinceLastOrder <= 60) {
    return { stage: 'Loyal', label: 'Trung thành' };
  }

  // Growing - Đang phát triển
  if (orders >= 2 && daysSinceLastOrder <= 60) {
    return { stage: 'Growing', label: 'Phát triển' };
  }

  // New - Khách mới
  return { stage: 'New', label: 'Mới' };
}

module.exports = {
  calculateCLV,
  getCLVSegment,
  calculateChurnRisk,
  calculateHealthScore,
  getLoyaltyStage
};
