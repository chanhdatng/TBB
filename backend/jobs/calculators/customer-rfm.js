/**
 * RFM Customer Analytics Calculator (Backend Port)
 * Implements Recency, Frequency, Monetary scoring and segmentation
 *
 * Ported from: web/src/utils/rfm.js
 * Changes: ES6 exports → CommonJS, added CFAbsoluteTime handling
 */

// ========== SCORING FUNCTIONS ==========

/**
 * Calculate recency score (1-5) based on days since last order
 * @param {number} daysSinceLastOrder - Days since last order
 * @returns {number} Score 1-5 (5=most recent, 1=least recent)
 */
function calculateRecencyScore(daysSinceLastOrder) {
  if (daysSinceLastOrder <= 7) return 5;
  if (daysSinceLastOrder <= 30) return 4;
  if (daysSinceLastOrder <= 90) return 3;
  if (daysSinceLastOrder <= 180) return 2;
  return 1;
}

/**
 * Calculate frequency score (1-5) based on total orders
 * @param {number} totalOrders - Total lifetime orders
 * @returns {number} Score 1-5 (5=most frequent, 1=least frequent)
 */
function calculateFrequencyScore(totalOrders) {
  if (totalOrders >= 10) return 5;
  if (totalOrders >= 6) return 4;
  if (totalOrders >= 3) return 3;
  if (totalOrders >= 2) return 2;
  return 1;
}

/**
 * Calculate monetary score (1-5) based on spending percentile
 * @param {Object} customer - Customer with totalSpent and id/phone
 * @param {Array} allCustomers - All customers for percentile calculation
 * @returns {number} Score 1-5 (5=highest spender, 1=lowest spender)
 */
function calculateMonetaryScore(customer, allCustomers) {
  if (!allCustomers || allCustomers.length === 0) return 3;
  if (!customer || customer.totalSpent === undefined) return 3;

  // Sort customers by spending (descending)
  const sorted = [...allCustomers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));

  // Find customer position in sorted list (match by phone or id)
  const customerKey = customer.phone || customer.id;
  const index = sorted.findIndex(c => {
    const cKey = c.phone || c.id;
    return cKey === customerKey;
  });

  if (index === -1) return 3; // Fallback if customer not found

  // Calculate percentile rank
  const percentile = index / sorted.length;

  // Map percentile to score
  if (percentile < 0.20) return 5; // Top 20%
  if (percentile < 0.40) return 4; // 20-40%
  if (percentile < 0.60) return 3; // 40-60%
  if (percentile < 0.80) return 2; // 60-80%
  return 1; // Bottom 20%
}

/**
 * Map RFM scores to customer segment
 * @param {Object} rfm - RFM scores { R, F, M }
 * @returns {string} Segment name
 */
function getCustomerSegment(rfm) {
  const pattern = `${rfm.R}${rfm.F}${rfm.M}`;

  const segmentMap = {
    'Champions': ['555', '554', '544', '545'],
    'Loyal': ['543', '444', '435', '355', '354', '345'],
    'Potential Loyalists': ['553', '551', '552', '541', '542'],
    'New Customers': ['512', '511', '422', '421', '412', '411', '311'],
    'Promising': ['525', '524', '523', '522', '521', '515', '514', '513'],
    'Need Attention': ['535', '534', '443', '434', '343', '334', '325', '324'],
    'About to Sleep': ['331', '321', '312', '221', '213', '231', '241', '251'],
    'At Risk': [
      '255', '254', '245', '244', '253', '252', '243', '242',
      '235', '234', '225', '224', '153', '152', '145', '143',
      '142', '135', '134', '133', '125', '124'
    ],
    'Cannot Lose Them': ['155', '154', '144', '214', '215', '115', '114', '113'],
    'Hibernating': [
      '332', '322', '231', '241', '251', '233', '232',
      '223', '222', '132', '123', '122', '212', '211'
    ],
    'Lost': ['111', '112', '121', '131', '141', '151']
  };

  for (const [segment, patterns] of Object.entries(segmentMap)) {
    if (patterns.includes(pattern)) {
      return segment;
    }
  }

  return 'Other';
}

/**
 * Calculate complete RFM score for customer
 * @param {Object} customer - Customer with orders, totalSpent, rawLastOrder
 * @param {Array} allCustomers - All customers for M score calculation
 * @returns {Object} { R, F, M, total, pattern, segment, daysSinceLastOrder }
 */
function calculateRFM(customer, allCustomers) {
  // Calculate days since last order using rawLastOrder (already parsed timestamp)
  const daysSinceLastOrder = customer.rawLastOrder
    ? Math.floor((Date.now() - customer.rawLastOrder) / (1000 * 60 * 60 * 24))
    : 999999; // No orders = very old

  const R = calculateRecencyScore(daysSinceLastOrder);
  const F = calculateFrequencyScore(customer.orders || customer.totalOrders || 0);
  const M = calculateMonetaryScore(customer, allCustomers);

  const total = R + F + M;
  const pattern = `${R}${F}${M}`;
  const segment = getCustomerSegment({ R, F, M });

  return {
    R,
    F,
    M,
    total,
    pattern,
    segment,
    daysSinceLastOrder: Math.floor(daysSinceLastOrder)
  };
}

module.exports = {
  calculateRFM,
  calculateRecencyScore,
  calculateFrequencyScore,
  calculateMonetaryScore,
  getCustomerSegment
};
