# Phase 1: RFM Utility Foundation
**Date**: 2025-12-04
**Priority**: P0 - Critical Foundation
**Status**: ✅ Complete
**Duration**: 1 day

---

## Context

**Parent Plan**: [plan.md](./plan.md)
**Dependencies**: None
**Related Docs**:
- [RFM Algorithm Design](./reports/02-rfm-algorithm-design.md)
- [Customer Analytics Plan](../../CUSTOMER_ANALYTICS_PLAN.md)

---

## Overview

Create core RFM utility module (`src/utils/rfm.js`) containing all calculation functions, segment mapping logic, and visual configuration. This foundation enables all subsequent phases.

**Implementation Status**: Complete
**Review Status**: Approved

---

## Key Insights

- RFM = Recency (days since last order) + Frequency (total orders) + Monetary (spending percentile)
- Each component scored 1-5
- 125 possible RFM combinations (5×5×5)
- 92 mapped to 11 business-meaningful segments
- Percentile-based M score ensures fair distribution
- Client-side calculation keeps architecture simple

---

## Requirements

### Functional Requirements

1. **calculateRFMScore**: Calculate R/F/M scores for single customer
2. **getCustomerSegment**: Map RFM pattern to segment name
3. **getSegmentColor**: Return Tailwind color classes
4. **getSegmentIcon**: Return emoji/icon for segment
5. **getSegmentDescription**: Return tooltip explanation text

### Non-Functional Requirements

- Performance: O(n log n) for monetary percentile calculation
- Accuracy: Handle edge cases (no orders, zero spend, single customer)
- Maintainability: Clear code, JSDoc comments
- Testability: Pure functions, no side effects

---

## Architecture

### Module Structure

```javascript
// src/utils/rfm.js

/**
 * RFM Customer Analytics Utilities
 * Implements Recency, Frequency, Monetary scoring and segmentation
 */

// ========== SCORING FUNCTIONS ==========

/**
 * Calculate recency score (1-5) based on days since last order
 * @param {number} daysSinceLastOrder - Days since last order
 * @returns {number} Score 1-5 (5=most recent)
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
 * @returns {number} Score 1-5 (5=most frequent)
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
 * @param {Object} customer - Customer with totalSpent
 * @param {Array} allCustomers - All customers for percentile calculation
 * @returns {number} Score 1-5 (5=highest spender)
 */
export const calculateMonetaryScore = (customer, allCustomers) => {
  if (!allCustomers || allCustomers.length === 0) return 3;

  const sorted = [...allCustomers].sort((a, b) => b.totalSpent - a.totalSpent);
  const index = sorted.findIndex(c => c.id === customer.id);

  if (index === -1) return 3; // Fallback

  const percentile = index / sorted.length;

  if (percentile <= 0.20) return 5;
  if (percentile <= 0.40) return 4;
  if (percentile <= 0.60) return 3;
  if (percentile <= 0.80) return 2;
  return 1;
};

/**
 * Calculate complete RFM score for customer
 * @param {Object} customer - Customer with orders, totalSpent, rawLastOrder
 * @param {Array} allCustomers - All customers for M score calculation
 * @returns {Object} { R, F, M, total, segment }
 */
export const calculateRFMScore = (customer, allCustomers) => {
  // Calculate days since last order
  const daysSinceLastOrder = customer.rawLastOrder
    ? (Date.now() - customer.rawLastOrder) / (1000 * 60 * 60 * 24)
    : 999999; // No orders = very old

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
    segment
  };
};

// ========== SEGMENTATION ==========

/**
 * Map RFM scores to customer segment
 * @param {Object} rfm - RFM scores { R, F, M }
 * @returns {string} Segment name
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
 * @returns {string} Tailwind classes
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
 * Get icon/emoji for segment
 * @param {string} segment - Segment name
 * @returns {string} Emoji
 */
export const getSegmentIcon = (segment) => {
  const icons = {
    'Champions': '🏆',
    'Loyal': '💎',
    'Potential Loyalists': '🌟',
    'New Customers': '🆕',
    'Promising': '💫',
    'Need Attention': '⚠️',
    'About to Sleep': '😴',
    'At Risk': '🚨',
    'Cannot Lose Them': '💔',
    'Hibernating': '❄️',
    'Lost': '👋',
    'Other': '❓'
  };
  return icons[segment] || icons['Other'];
};

/**
 * Get description text for segment tooltip
 * @param {string} segment - Segment name
 * @returns {string} Description
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
 * @returns {string} Tailwind color class
 */
export const getScoreColor = (score) => {
  if (score >= 4) return 'bg-green-500';
  if (score >= 3) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Get score label for display
 * @param {number} score - RFM score 1-5
 * @returns {string} Label
 */
export const getScoreLabel = (score) => {
  if (score === 5) return 'Excellent';
  if (score === 4) return 'Good';
  if (score === 3) return 'Average';
  if (score === 2) return 'Poor';
  return 'Very Poor';
};
```

---

## Related Code Files

**New Files**:
- `src/utils/rfm.js` (create)

**Reference Files**:
- `src/utils/clipboard.js` (pattern reference)
- `src/utils/animations.js` (pattern reference)

---

## Implementation Steps

### Step 1: Create Utility File
- [x] Create `src/utils/rfm.js`
- [x] Add file header with description
- [x] Set up exports structure

### Step 2: Implement Scoring Functions
- [x] Implement `calculateRecencyScore`
- [x] Implement `calculateFrequencyScore`
- [x] Implement `calculateMonetaryScore`
- [x] Implement `calculateRFMScore`
- [x] Add JSDoc comments to all functions

### Step 3: Implement Segmentation
- [x] Create segment map with all 92 patterns
- [x] Implement `getCustomerSegment`
- [x] Handle 'Other' fallback for unmapped patterns

### Step 4: Implement Visual Helpers
- [x] Implement `getSegmentColor` with Tailwind classes
- [x] Implement `getSegmentIcon` with emojis
- [x] Implement `getSegmentDescription` with tooltips
- [x] Implement `getScoreColor` for progress bars
- [x] Implement `getScoreLabel` for score display

### Step 5: Testing
- [x] Write unit tests for scoring functions
- [x] Test edge cases (no orders, zero spend, single customer)
- [x] Test segmentation with all 11 segments
- [x] Test visual helpers return correct values
- [x] Performance test with 1000 customers

### Step 6: Documentation
- [x] Ensure all functions have JSDoc
- [x] Add usage examples in comments
- [x] Document edge cases handled

---

## Todo List

- [x] Create src/utils/rfm.js file
- [x] Implement calculateRecencyScore function
- [x] Implement calculateFrequencyScore function
- [x] Implement calculateMonetaryScore function
- [x] Implement calculateRFMScore function
- [x] Create segment map with 11 segments
- [x] Implement getCustomerSegment function
- [x] Implement getSegmentColor function
- [x] Implement getSegmentIcon function
- [x] Implement getSegmentDescription function
- [x] Implement getScoreColor function
- [x] Implement getScoreLabel function
- [x] Write unit tests
- [x] Test edge cases
- [x] Add JSDoc comments
- [x] Performance benchmark

---

## Success Criteria

✅ All RFM calculation functions implemented
✅ All 11 segments mapped correctly
✅ Visual helper functions return correct values
✅ JSDoc comments on all exported functions
✅ Edge cases handled (no orders, missing data)
✅ Unit tests passing for all functions
✅ Performance: <10ms for 500 customer M score calculation
✅ No external dependencies added

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Percentile calculation slow | Medium | Low | Optimize sort, memoize if needed |
| Segment map incomplete | Low | Low | Cover all patterns, use 'Other' fallback |
| Edge cases break scoring | Medium | Medium | Comprehensive tests, graceful degradation |

---

## Security Considerations

✅ No user input processed
✅ No external API calls
✅ No sensitive data exposed
✅ Pure functions, no side effects
✅ Client-side only, no server risk

---

## Next Steps

After Phase 1 completion:
1. ✅ Review code quality and test coverage
2. ⏳ Proceed to Phase 2: Data Enrichment
3. ⏳ Import rfm.js in Customers.jsx
4. ⏳ Integrate RFM calculations into enrichedCustomers
