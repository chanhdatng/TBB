# Phase 1: Core Metrics Integration

**Date**: 2025-12-05
**Priority**: 🔴 Critical (Foundation for all other phases)
**Duration**: 4-6 hours
**Complexity**: Medium
**Implementation Status**: 📋 Ready
**Review Status**: ⏳ Pending User Approval

---

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: Phase 0 (utils created)
- **Next Phase**: [phase-02-summary-cards.md](./phase-02-summary-cards.md)
- **Related Docs**:
  - `src/utils/customerMetrics.js`
  - `src/utils/addressParser.js`
  - `src/pages/Customers.jsx`

---

## Overview

Enhance the `enrichedCustomers` calculation to include 15 advanced metrics. This is the foundation phase - all subsequent phases depend on these metrics being available on every customer object.

### Current State
Customer objects have:
- Basic: name, phone, email, address, createdAt
- Calculated: orders, totalSpent, aov, lastOrder, rawLastOrder
- RFM: rfm.R, rfm.F, rfm.M, rfm.total, rfm.segment

### Target State
Add these new properties to each customer:
```javascript
customer = {
  // ... existing properties ...
  clv: 1500000,                    // Customer Lifetime Value (VND)
  clvSegment: 'High',              // VIP/High/Medium/Low
  churnRisk: {...},                // { level, score, label, color }
  healthScore: 75,                 // 0-100
  loyaltyStage: {...},             // { stage, label, color, icon }
  location: {...},                 // { district, zone, raw }
  cohort: {...},                   // { monthly, quarterly, yearly + labels }
  behavior: {...},                 // { peakDay, peakHour, avgDaysBetweenOrders }
  productAffinity: [...],          // [{ name, quantity, revenue }]
  trend: 15.5                      // % change (already exists, keep)
}
```

---

## Key Insights

### Performance Considerations
- **2353 customers** = enrichedCustomers runs ~2353 iterations
- **CLV percentile** = requires full array sort (O(n log n))
- **Product affinity** = must filter orders per customer
- **Behavioral patterns** = date calculations per order

**Solution**:
1. Calculate in 3 passes:
   - Pass 1: Basic metrics (existing)
   - Pass 2: RFM + metrics needing full dataset
   - Pass 3: Individual metrics (CLV, churn, etc.)
2. Use memoization aggressively
3. Calculate trend in Phase 2 (already exists in code)

### Data Dependencies
- **CLV**: Needs orders, aov, createdAt
- **Churn Risk**: Needs rfm, orders, trend
- **Health Score**: Needs rfm, trend
- **Loyalty Stage**: Needs rfm, orders, trend
- **Location**: Needs address string
- **Cohort**: Needs createdAt
- **Behavior**: Needs all customer orders
- **Product Affinity**: Needs all customer orders with items

---

## Requirements

### Functional
1. All 15 metrics must calculate correctly
2. Handle edge cases:
   - Customers with 0 orders
   - Customers with no address
   - Customers with no createdAt
   - Orders with missing timeline data
3. Metrics must be consistent across all customers
4. Calculation must complete <2 seconds for 2353 customers

### Non-Functional
- Code must be readable and maintainable
- No breaking changes to existing metrics
- All text in Vietnamese
- Follow existing code patterns

---

## Architecture

### Calculation Flow

```
enrichedCustomers useMemo:
  ↓
1. withBasicMetrics (existing)
   - Filter orders per customer
   - Calculate: orders, totalSpent, aov, lastOrder, rawLastOrder
   ↓
2. withRFM (existing)
   - Calculate RFM scores
   ↓
3. withTrend (existing - keep this)
   - Calculate 3-month trend
   ↓
4. withCLV (NEW)
   - Calculate CLV for all
   - Calculate percentiles
   - Assign CLV segments
   ↓
5. withAdvancedMetrics (NEW)
   - Churn risk
   - Health score
   - Loyalty stage
   - Location parsing
   - Cohort grouping
   - Behavioral patterns
   - Product affinity
   ↓
6. Return enriched array
```

### Function Imports

```javascript
// Top of Customers.jsx - add these imports
import {
  calculateCLV,
  getCLVSegment,
  calculateChurnRisk,
  calculateHealthScore,
  getLoyaltyStage,
  getCohortGroup,
  analyzeBehavioralPatterns,
  calculateProductAffinity,
  calculateRepurchaseRate
} from '../utils/customerMetrics';

import {
  parseAddress,
  calculateGeographicStats
} from '../utils/addressParser';
```

---

## Related Code Files

### Files to Modify
1. `src/pages/Customers.jsx`
   - Lines 1-8: Add imports
   - Lines 41-87: Modify enrichedCustomers useMemo

### Files Referenced (No Changes)
1. `src/utils/customerMetrics.js` (already created)
2. `src/utils/addressParser.js` (already created)
3. `src/utils/rfm.js` (existing)

---

## Implementation Steps

### Step 1: Add Imports (2 min)

**Location**: `src/pages/Customers.jsx`, line 1-8

**Add after existing imports**:
```javascript
import {
  calculateCLV,
  getCLVSegment,
  calculateChurnRisk,
  calculateHealthScore,
  getLoyaltyStage,
  getCohortGroup,
  analyzeBehavioralPatterns,
  calculateProductAffinity
} from '../utils/customerMetrics';

import { parseAddress } from '../utils/addressParser';
```

---

### Step 2: Enhance enrichedCustomers Calculation (2-3 hours)

**Location**: `src/pages/Customers.jsx`, lines 41-87

**Replace entire enrichedCustomers useMemo with**:

```javascript
const enrichedCustomers = useMemo(() => {
  if (!customers || !orders) return [];

  // ===== PASS 1: Basic Metrics (existing logic) =====
  const withBasicMetrics = customers.map(customer => {
    const customerOrders = orders.filter(order =>
      order.customer.phone === customer.phone
    );

    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.rawPrice) || 0), 0);

    // Find last order date
    let lastOrderDate = '-';
    let rawLastOrder = 0;
    if (customerOrders.length > 0) {
      const sortedOrders = [...customerOrders].sort((a, b) => {
        const dateA = a.timeline?.received?.raw || new Date(0);
        const dateB = b.timeline?.received?.raw || new Date(0);
        return dateB - dateA;
      });
      lastOrderDate = sortedOrders[0]?.timeline?.received?.date || '-';
      rawLastOrder = sortedOrders[0]?.timeline?.received?.raw || 0;
    }

    // Calculate AOV
    const aov = totalOrders > 0 ? totalSpent / totalOrders : 0;

    return {
      ...customer,
      orders: totalOrders,
      totalSpent: totalSpent,
      lastOrder: lastOrderDate,
      rawLastOrder: rawLastOrder,
      aov: aov
    };
  });

  // ===== PASS 2: RFM Scores (existing logic) =====
  const withRFM = withBasicMetrics.map(customer => ({
    ...customer,
    rfm: calculateRFMScore(customer, withBasicMetrics)
  }));

  // ===== PASS 3: 3-Month Trend (existing - extracted from current code) =====
  const withTrend = withRFM.map(customer => {
    const customerOrders = orders.filter(o => o.customer.phone === customer.phone);

    const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;

    const recentOrders = customerOrders.filter(o => (o.timeline?.received?.raw || 0) >= threeMonthsAgo);
    const previousOrders = customerOrders.filter(o => {
      const date = o.timeline?.received?.raw || 0;
      return date >= sixMonthsAgo && date < threeMonthsAgo;
    });

    const recentSpending = recentOrders.reduce((sum, o) => sum + (Number(o.rawPrice) || 0), 0);
    const previousSpending = previousOrders.reduce((sum, o) => sum + (Number(o.rawPrice) || 0), 0);

    const trend = previousSpending > 0
      ? ((recentSpending - previousSpending) / previousSpending) * 100
      : recentSpending > 0 ? 100 : 0;

    return {
      ...customer,
      trend
    };
  });

  // ===== PASS 4: CLV Calculation =====
  const withCLV = withTrend.map(customer => ({
    ...customer,
    clv: calculateCLV(customer)
  }));

  // Calculate CLV segments (need all CLVs first)
  const allCLVs = withCLV.map(c => c.clv);
  const withCLVSegment = withCLV.map(customer => ({
    ...customer,
    clvSegment: getCLVSegment(customer.clv, allCLVs)
  }));

  // ===== PASS 5: Advanced Metrics =====
  const fullyEnriched = withCLVSegment.map(customer => {
    const customerOrders = orders.filter(o => o.customer.phone === customer.phone);

    return {
      ...customer,
      churnRisk: calculateChurnRisk(customer),
      healthScore: calculateHealthScore(customer),
      loyaltyStage: getLoyaltyStage(customer),
      location: parseAddress(customer.address),
      cohort: getCohortGroup(customer),
      behavior: analyzeBehavioralPatterns(customer, orders),
      productAffinity: calculateProductAffinity(customer, orders)
    };
  });

  return fullyEnriched;
}, [customers, orders]);
```

---

### Step 3: Verify Data Structure (30 min)

Add temporary console.log to verify:

```javascript
// After enrichedCustomers calculation
useMemo(() => {
  if (enrichedCustomers.length > 0) {
    console.log('Sample enriched customer:', enrichedCustomers[0]);
    console.log('Total customers:', enrichedCustomers.length);
    console.log('CLV range:', {
      min: Math.min(...enrichedCustomers.map(c => c.clv)),
      max: Math.max(...enrichedCustomers.map(c => c.clv)),
      avg: enrichedCustomers.reduce((sum, c) => sum + c.clv, 0) / enrichedCustomers.length
    });
  }
}, [enrichedCustomers]);
```

**Check console for**:
- All properties present
- No undefined/null values
- CLV values reasonable (>0 for customers with orders)
- Location district recognized for HCM addresses
- Cohort groups assigned

**Remove console.log after verification**

---

### Step 4: Test Edge Cases (1 hour)

Test with these customer scenarios:
1. **Customer with 0 orders**
   - CLV should be 0
   - Churn risk should be 'low' (new customer)
   - Health score should be low but not 0
   - Loyalty stage should be 'New'

2. **Customer with no address**
   - location.district should be 'Unknown'
   - location.zone should be 'Unknown'

3. **Customer with no createdAt**
   - cohort should show 'Unknown'
   - CLV should still calculate (use default 365 days)

4. **Customer with 1 very old order**
   - Churn risk should be 'high'
   - Loyalty stage should be 'Lost' or 'At Risk'

5. **Champion customer**
   - 10+ orders, recent, high spend
   - CLV segment should be 'VIP' or 'High'
   - Churn risk should be 'low'
   - Health score should be >80

---

### Step 5: Performance Check (30 min)

Measure calculation time:

```javascript
const enrichedCustomers = useMemo(() => {
  const startTime = performance.now();

  // ... calculation logic ...

  const endTime = performance.now();
  console.log(`Enriched ${fullyEnriched.length} customers in ${(endTime - startTime).toFixed(2)}ms`);

  return fullyEnriched;
}, [customers, orders]);
```

**Target**: <2000ms for 2353 customers

If slower:
- Check if orders array is filtered efficiently
- Consider moving product affinity to lazy load
- Profile with React DevTools

---

## Todo List

- [ ] Add imports for customerMetrics functions
- [ ] Add import for addressParser
- [ ] Replace enrichedCustomers useMemo with new calculation
- [ ] Test with sample customer data
- [ ] Verify all metrics calculate correctly
- [ ] Test edge cases (0 orders, no address, etc.)
- [ ] Check console for any errors
- [ ] Measure performance (should be <2s)
- [ ] Remove console.log statements
- [ ] Commit changes with message: "feat: integrate advanced customer metrics (CLV, churn, health, loyalty, location, cohort, behavior)"

---

## Success Criteria

### Must Have
- ✅ All 15 metrics calculate without errors
- ✅ enrichedCustomers array has all new properties
- ✅ Existing features still work (filters, sort, pagination)
- ✅ No console errors
- ✅ Performance <2 seconds for 2353 customers

### Nice to Have
- ✅ Console logs show sensible values
- ✅ Edge cases handled gracefully
- ✅ Code is clean and well-commented

### Test Cases
1. **Smoke Test**: Page loads without errors
2. **Data Test**: Click on a customer → modal opens with correct data
3. **Filter Test**: Existing filters still work
4. **Sort Test**: Existing sort options still work
5. **Performance Test**: No noticeable lag

---

## Risk Assessment

### High Risk
- **Performance Degradation**: 15 new calculations per customer
  - **Mitigation**: Aggressive memoization, measure time, optimize if needed
  - **Rollback**: Can disable individual metrics if causing lag

### Medium Risk
- **Incorrect CLV Percentile**: Sort logic may have bugs
  - **Mitigation**: Manual verify top 10% are truly highest CLV
  - **Fix**: Adjust getCLVSegment logic

- **Address Parser Failures**: Non-standard addresses
  - **Mitigation**: Already defaults to 'Unknown'
  - **Fix**: Review failed addresses, add more aliases

### Low Risk
- **Missing Data**: Some customers lack createdAt or orders
  - **Mitigation**: All functions handle undefined/null gracefully
  - **Fix**: Add more null checks if needed

---

## Security Considerations

- No sensitive data exposed
- All calculations client-side
- No API calls or external dependencies
- Firebase data already secured by existing rules

---

## Next Steps

After Phase 1 complete:
1. **Verify**: Open DevTools, check enrichedCustomers structure
2. **Test**: Click through 10-20 customers, ensure data looks correct
3. **Performance**: If >2s, optimize before continuing
4. **Proceed**: Move to Phase 2 (Summary Cards)

---

## Questions

None - all requirements clear from existing code and utility functions.
