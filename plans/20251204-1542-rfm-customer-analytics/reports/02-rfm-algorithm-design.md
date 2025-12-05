# RFM Algorithm Design Report
**Date**: 2025-12-04
**Plan**: RFM Customer Analytics Phase 1

---

## RFM Scoring Algorithm

### Recency Score (R)

**Input**: Days since last order
**Output**: Score 1-5

```javascript
const calculateRecencyScore = (daysSinceLastOrder) => {
  if (daysSinceLastOrder <= 7) return 5;   // Hot - ordered this week
  if (daysSinceLastOrder <= 30) return 4;  // Active - this month
  if (daysSinceLastOrder <= 90) return 3;  // Engaged - last quarter
  if (daysSinceLastOrder <= 180) return 2; // At Risk - last 6 months
  return 1;                                 // Dormant - 180+ days
};
```

**Edge Cases:**
- No orders: daysSinceLastOrder = Infinity → Score 1
- First order today: daysSinceLastOrder = 0 → Score 5

### Frequency Score (F)

**Input**: Total lifetime orders
**Output**: Score 1-5

```javascript
const calculateFrequencyScore = (totalOrders) => {
  if (totalOrders >= 10) return 5; // Power user
  if (totalOrders >= 6) return 4;  // Loyal
  if (totalOrders >= 3) return 3;  // Regular
  if (totalOrders >= 2) return 2;  // Repeat buyer
  return 1;                         // One-time buyer
};
```

**Edge Cases:**
- 0 orders: Score 1 (shouldn't happen if customer exists)
- 100+ orders: Still Score 5 (no upper bound)

### Monetary Score (M)

**Input**: Total spent, all customers array
**Output**: Score 1-5

**Algorithm**: Percentile-based ranking

```javascript
const calculateMonetaryScore = (customer, allCustomers) => {
  // Sort all customers by total spent (descending)
  const sorted = [...allCustomers].sort((a, b) => b.totalSpent - a.totalSpent);

  // Find customer's position
  const index = sorted.findIndex(c => c.id === customer.id);
  const percentile = index / sorted.length;

  // Score based on percentile
  if (percentile <= 0.20) return 5; // Top 20%
  if (percentile <= 0.40) return 4; // 20-40%
  if (percentile <= 0.60) return 3; // 40-60%
  if (percentile <= 0.80) return 2; // 60-80%
  return 1;                         // Bottom 20%
};
```

**Edge Cases:**
- All customers spent same amount: All get M=3 (middle)
- Customer spent 0: Gets M=1 (bottom)
- Only 1 customer: Gets M=5 (top 100%)

**Performance Optimization:**
- Sort once, reuse for all customers
- Time complexity: O(n log n) for sort + O(n) for scoring = O(n log n)
- Space complexity: O(n) for sorted array

---

## Customer Segmentation

### Segment Mapping Table

| Segment | RFM Patterns | Priority | Description |
|---------|-------------|----------|-------------|
| Champions | 555,554,544,545 | P0 | Best customers |
| Loyal | 543,444,435,355,354,345 | P0 | Regular high-value |
| Potential Loyalists | 553,551,552,541,542 | P1 | Recent high-value |
| New Customers | 512,511,422,421,412,411,311 | P1 | Just started |
| Promising | 525,524,523,522,521,515,514,513 | P2 | Recent medium spend |
| Need Attention | 535,534,443,434,343,334,325,324 | P2 | Declining |
| About to Sleep | 331,321,312,221,213,231,241,251 | P3 | Low frequency |
| At Risk | 255,254,245,244,253,252,243,242,235,234,225,224,153,152,145,143,142,135,134,133,125,124 | P1 | Were valuable |
| Cannot Lose Them | 155,154,144,214,215,115,114,113 | P0 | High spenders gone |
| Hibernating | 332,322,231,241,251,233,232,223,222,132,123,122,212,211 | P4 | Long inactive |
| Lost | 111,112,121,131,141,151 | P5 | Inactive + low value |

### Segmentation Algorithm

```javascript
const getCustomerSegment = (rfm) => {
  const pattern = `${rfm.R}${rfm.F}${rfm.M}`;

  // Map patterns to segments
  const segmentMap = {
    'Champions': ['555','554','544','545'],
    'Loyal': ['543','444','435','355','354','345'],
    'Potential Loyalists': ['553','551','552','541','542'],
    // ... etc
  };

  for (const [segment, patterns] of Object.entries(segmentMap)) {
    if (patterns.includes(pattern)) {
      return segment;
    }
  }

  return 'Other'; // Fallback for unclassified patterns
};
```

**Total Patterns**: 125 possible (5×5×5)
**Mapped Patterns**: 92 (73.6% coverage)
**Unmapped**: 33 patterns → 'Other' segment

**Edge Case Handling:**
- Unmapped patterns get 'Other' segment
- Can be refined later based on business rules

---

## Visual Design

### Segment Colors (Tailwind)

```javascript
const getSegmentColor = (segment) => {
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
```

### Segment Icons

```javascript
const getSegmentIcon = (segment) => {
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
```

### Score Visualization

**Progress Bars for R/F/M:**
```javascript
const getScoreColor = (score) => {
  if (score >= 4) return 'bg-green-500'; // Good
  if (score >= 3) return 'bg-yellow-500'; // OK
  return 'bg-red-500'; // Poor
};

const ScoreBar = ({ score }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className={`h-2 rounded-full ${getScoreColor(score)}`}
      style={{ width: `${(score / 5) * 100}%` }}
    />
  </div>
);
```

---

## Data Flow

### Complete RFM Enrichment Flow

```javascript
const enrichedCustomers = useMemo(() => {
  if (!customers || !orders) return [];

  // Step 1: Enrich with basic metrics (existing)
  const withBasicMetrics = customers.map(customer => {
    const customerOrders = orders.filter(
      order => order.customer.phone === customer.phone
    );

    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce(
      (sum, order) => sum + (Number(order.rawPrice) || 0),
      0
    );

    // Find last order
    let rawLastOrder = 0;
    if (customerOrders.length > 0) {
      const sorted = [...customerOrders].sort((a, b) =>
        (b.timeline?.received?.raw || 0) - (a.timeline?.received?.raw || 0)
      );
      rawLastOrder = sorted[0]?.timeline?.received?.raw || 0;
    }

    return {
      ...customer,
      orders: totalOrders,
      totalSpent,
      rawLastOrder,
      aov: totalOrders > 0 ? totalSpent / totalOrders : 0
    };
  });

  // Step 2: Calculate RFM scores
  const withRFM = withBasicMetrics.map(customer => ({
    ...customer,
    rfm: calculateRFMScore(customer, withBasicMetrics)
  }));

  return withRFM;
}, [customers, orders]);
```

**Complexity Analysis:**
- Step 1: O(n × m) where n=customers, m=avg orders per customer
- Step 2: O(n log n) for monetary percentile + O(n) for R/F
- Total: O(n × m + n log n)

**For 500 customers with avg 5 orders each:**
- ~2,500 order iterations + ~4,500 comparisons
- Estimated: 10-20ms on modern hardware

---

## Testing Strategy

### Unit Tests for RFM Utils

```javascript
// Test recency scoring
test('calculateRecencyScore', () => {
  expect(calculateRecencyScore(3)).toBe(5);    // 3 days
  expect(calculateRecencyScore(15)).toBe(4);   // 15 days
  expect(calculateRecencyScore(60)).toBe(3);   // 60 days
  expect(calculateRecencyScore(120)).toBe(2);  // 120 days
  expect(calculateRecencyScore(200)).toBe(1);  // 200 days
});

// Test frequency scoring
test('calculateFrequencyScore', () => {
  expect(calculateFrequencyScore(1)).toBe(1);
  expect(calculateFrequencyScore(2)).toBe(2);
  expect(calculateFrequencyScore(5)).toBe(3);
  expect(calculateFrequencyScore(8)).toBe(4);
  expect(calculateFrequencyScore(15)).toBe(5);
});

// Test segmentation
test('getCustomerSegment', () => {
  expect(getCustomerSegment({R:5,F:5,M:5})).toBe('Champions');
  expect(getCustomerSegment({R:1,F:1,M:1})).toBe('Lost');
  expect(getCustomerSegment({R:5,F:1,M:2})).toBe('New Customers');
});
```

### Integration Tests

```javascript
// Test with mock data
const mockCustomers = [
  { id: '1', totalSpent: 1000000, orders: 10, rawLastOrder: Date.now() },
  { id: '2', totalSpent: 500000, orders: 3, rawLastOrder: Date.now() - 60*24*60*60*1000 },
  // ... more mock data
];

test('enrichment adds RFM scores', () => {
  const enriched = enrichCustomers(mockCustomers, mockOrders);
  expect(enriched[0].rfm).toBeDefined();
  expect(enriched[0].rfm.R).toBeGreaterThan(0);
  expect(enriched[0].rfm.segment).toBeDefined();
});
```

---

## Performance Benchmarks

### Target Metrics

| Customer Count | Enrichment Time | Acceptable? |
|----------------|-----------------|-------------|
| 100 | <50ms | ✅ Excellent |
| 500 | <200ms | ✅ Good |
| 1000 | <500ms | ⚠️ Acceptable |
| 2000 | <1000ms | ❌ Sluggish |

### Optimization Opportunities

1. **Memoize Sorted Array**: Cache sorted customers for M score
2. **Lazy Calculation**: Only calculate RFM for visible customers (future)
3. **Web Worker**: Move calculations off main thread (future)
4. **Incremental Updates**: Only recalc changed customers (future)

---

## Security Considerations

✅ No user input in calculations
✅ No external API calls
✅ No sensitive data exposure
✅ Client-side only (no server risk)

**Privacy**: RFM scores are derived from existing order data, no new PII collected

---

## Accessibility

- Segment badges: Use both color AND text/icon (not color alone)
- Score bars: Include numeric labels for screen readers
- Tooltips: Provide aria-labels for segment explanations
- Keyboard navigation: Ensure filter dropdown is accessible

---

## Recommendations

1. **Implement in stages**: Utils → Enrichment → UI
2. **Test performance early**: Use 500+ mock customers
3. **Monitor useMemo deps**: Ensure no unnecessary recalculations
4. **Document edge cases**: Handle missing data gracefully
5. **Add loading states**: Show skeleton while calculating
