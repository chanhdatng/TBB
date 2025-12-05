/**
 * RFM Customer Analytics Utilities
 * Implements Recency, Frequency, Monetary scoring and segmentation
 *
 * RFM Analysis:
 * - Recency (R): Days since last order (1-5, higher is better)
 * - Frequency (F): Total lifetime orders (1-5, higher is better)
 * - Monetary (M): Spending percentile (1-5, higher is better)
 *
 * Segments: 11 business-meaningful customer segments
 * Performance: O(n log n) for monetary percentile calculation
 */

// ========== SCORING FUNCTIONS ==========

/**
 * Calculate recency score (1-5) based on days since last order
 * @param {number} daysSinceLastOrder - Days since last order
 * @returns {number} Score 1-5 (5=most recent, 1=least recent)
 *
 * Scoring rules:
 * - 5: 0-7 days (last week)
 * - 4: 8-30 days (last month)
 * - 3: 31-90 days (last quarter)
 * - 2: 91-180 days (last 6 months)
 * - 1: 181+ days (over 6 months)
 */
export const calculateRecencyScore = (daysSinceLastOrder) => {
  if (daysSinceLastOrder <= 7) return 5;
  if (daysSinceLastOrder <= 30) return 4;
  if (daysSinceLastOrder <= 90) return 3;
  if (daysSinceLastOrder <= 180) return 2;
  return 1;
};

/**
 * Calculate frequency score (1-5) based on total orders
 * @param {number} totalOrders - Total lifetime orders
 * @returns {number} Score 1-5 (5=most frequent, 1=least frequent)
 *
 * Scoring rules:
 * - 5: 10+ orders (very frequent)
 * - 4: 6-9 orders (frequent)
 * - 3: 3-5 orders (moderate)
 * - 2: 2 orders (occasional)
 * - 1: 1 order (one-time buyer)
 */
export const calculateFrequencyScore = (totalOrders) => {
  if (totalOrders >= 10) return 5;
  if (totalOrders >= 6) return 4;
  if (totalOrders >= 3) return 3;
  if (totalOrders >= 2) return 2;
  return 1;
};

/**
 * Calculate monetary score (1-5) based on spending percentile
 * @param {Object} customer - Customer with totalSpent and id
 * @param {Array} allCustomers - All customers for percentile calculation
 * @returns {number} Score 1-5 (5=highest spender, 1=lowest spender)
 *
 * Scoring rules (percentile-based):
 * - 5: Top 20% (0-20th percentile)
 * - 4: 20-40th percentile
 * - 3: 40-60th percentile
 * - 2: 60-80th percentile
 * - 1: Bottom 20% (80-100th percentile)
 */
export const calculateMonetaryScore = (customer, allCustomers) => {
  if (!allCustomers || allCustomers.length === 0) return 3;
  if (!customer || customer.totalSpent === undefined) return 3;

  // Sort customers by spending (descending)
  const sorted = [...allCustomers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));

  // Find customer position in sorted list
  const index = sorted.findIndex(c => c.id === customer.id);

  if (index === -1) return 3; // Fallback if customer not found

  // Calculate percentile rank
  const percentile = index / sorted.length;

  // Map percentile to score
  if (percentile <= 0.20) return 5; // Top 20%
  if (percentile <= 0.40) return 4; // 20-40%
  if (percentile <= 0.60) return 3; // 40-60%
  if (percentile <= 0.80) return 2; // 60-80%
  return 1; // Bottom 20%
};

/**
 * Calculate complete RFM score for customer
 * @param {Object} customer - Customer with orders, totalSpent, rawLastOrder, id
 * @param {Array} allCustomers - All customers for M score calculation
 * @returns {Object} { R, F, M, total, pattern, segment }
 *
 * Example:
 * ```js
 * const rfm = calculateRFMScore(customer, allCustomers);
 * // { R: 5, F: 4, M: 5, total: 14, pattern: '545', segment: 'Champions' }
 * ```
 */
export const calculateRFMScore = (customer, allCustomers) => {
  // Calculate days since last order
  const daysSinceLastOrder = customer.rawLastOrder
    ? (Date.now() - customer.rawLastOrder) / (1000 * 60 * 60 * 24)
    : 999999; // No orders = very old (assign lowest recency)

  const R = calculateRecencyScore(daysSinceLastOrder);
  const F = calculateFrequencyScore(customer.orders || 0);
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
};

// ========== SEGMENTATION ==========

/**
 * Map RFM scores to customer segment
 * @param {Object} rfm - RFM scores { R, F, M }
 * @returns {string} Segment name (one of 11 segments or 'Other')
 *
 * Segments:
 * - Champions: Best customers (recent, frequent, high-value)
 * - Loyal: Regular high-value customers
 * - Potential Loyalists: Recent high-value, could become loyal
 * - New Customers: Just started buying
 * - Promising: Recent buyers with medium spend
 * - Need Attention: Above average, showing decline
 * - About to Sleep: Declining frequency
 * - At Risk: Were valuable, now inactive
 * - Cannot Lose Them: High spenders gone quiet
 * - Hibernating: Long inactive with low engagement
 * - Lost: Inactive with low value
 */
export const getCustomerSegment = (rfm) => {
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
};

// ========== VISUAL CONFIGURATION ==========

/**
 * Get Tailwind color classes for segment badge
 * @param {string} segment - Segment name
 * @returns {string} Tailwind classes for bg, text, and border
 *
 * Example:
 * ```js
 * const classes = getSegmentColor('Champions');
 * // 'bg-yellow-100 text-yellow-800 border-yellow-200'
 * ```
 */
export const getSegmentColor = (segment) => {
  const colors = {
    'Champions': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Loyal': 'bg-blue-100 text-blue-800 border-blue-200',
    'Potential Loyalists': 'bg-purple-100 text-purple-800 border-purple-200',
    'New Customers': 'bg-green-100 text-green-800 border-green-200',
    'Promising': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Need Attention': 'bg-orange-100 text-orange-800 border-orange-200',
    'About to Sleep': 'bg-amber-100 text-amber-800 border-amber-200',
    'At Risk': 'bg-red-100 text-red-800 border-red-200',
    'Cannot Lose Them': 'bg-rose-100 text-rose-800 border-rose-200',
    'Hibernating': 'bg-gray-100 text-gray-800 border-gray-200',
    'Lost': 'bg-slate-100 text-slate-800 border-slate-200',
    'Other': 'bg-neutral-100 text-neutral-800 border-neutral-200'
  };
  return colors[segment] || colors['Other'];
};

/**
 * Get Lucide icon name for segment
 * @param {string} segment - Segment name
 * @returns {string} Lucide icon name representing the segment
 */
export const getSegmentIcon = (segment) => {
  const icons = {
    'Champions': 'Award',
    'Loyal': 'Gem',
    'Potential Loyalists': 'Star',
    'New Customers': 'UserPlus',
    'Promising': 'Sparkles',
    'Need Attention': 'AlertTriangle',
    'About to Sleep': 'Moon',
    'At Risk': 'AlertCircle',
    'Cannot Lose Them': 'HeartCrack',
    'Hibernating': 'Snowflake',
    'Lost': 'UserX',
    'Other': 'HelpCircle'
  };
  return icons[segment] || icons['Other'];
};

/**
 * Get description text for segment tooltip
 * @param {string} segment - Segment name
 * @returns {string} Human-readable description of the segment
 */
export const getSegmentDescription = (segment) => {
  const descriptions = {
    'Champions': 'Your best customers - recent, frequent, high-value purchases',
    'Loyal': 'Regular high-value customers who order consistently',
    'Potential Loyalists': 'Recent high-value customers who could become loyal',
    'New Customers': 'Just started buying, nurture them into loyal customers',
    'Promising': 'Recent buyers with medium spend, encourage more purchases',
    'Need Attention': 'Above average customers showing signs of decline',
    'About to Sleep': 'Declining frequency, risk of becoming inactive',
    'At Risk': 'Were valuable customers, now inactive - urgent win-back needed',
    'Cannot Lose Them': 'High spenders gone quiet - personal outreach required',
    'Hibernating': 'Long inactive with low engagement, low-effort reactivation',
    'Lost': 'Inactive with low value, minimal recovery effort',
    'Other': 'Customer segment not classified'
  };
  return descriptions[segment] || descriptions['Other'];
};

/**
 * Get score color class for progress bars
 * @param {number} score - RFM score 1-5
 * @returns {string} Tailwind background color class
 */
export const getScoreColor = (score) => {
  if (score >= 4) return 'bg-green-500';
  if (score >= 3) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Get score label for display
 * @param {number} score - RFM score 1-5
 * @returns {string} Human-readable label
 */
export const getScoreLabel = (score) => {
  if (score === 5) return 'Excellent';
  if (score === 4) return 'Good';
  if (score === 3) return 'Average';
  if (score === 2) return 'Poor';
  return 'Very Poor';
};
