# DataSync Optimization - Quick Start Guide

**TL;DR**: DataSync is slow (10M ops per render). This plan makes it 70-85% faster through lazy computation, phone caching, and virtualization.

---

## Quick Facts

- **Current Performance**: ~1200ms initial render, ~1000ms tab switch
- **Target Performance**: <300ms initial render, <50ms tab switch
- **Data Scale**: 2353 customers, 4083 orders
- **Main Bottleneck**: Eager computation of ALL detection algorithms on EVERY render

---

## Implementation Checklist

### Pre-Implementation

```bash
# 1. Create branch
git checkout -b perf/datasync-optimization

# 2. Backup current file
cp src/pages/DataSync.jsx src/pages/DataSync.jsx.backup

# 3. Install dependencies (Phase 3 only)
npm install @tanstack/react-virtual
```

---

### Phase 1: Critical Fixes (1 week)

#### Task 1.1: Add Lazy Computation

**File**: `src/pages/DataSync.jsx`

**Changes**:
- [ ] Line 90: Add `activeTab` to `ordersWithPhoneIssues` dependencies
- [ ] Line 91: Add early return if `activeTab !== 'standardize' && activeTab !== 'overview'`
- [ ] Line 132: Add `activeTab` to `customersMissingOrderIds` dependencies
- [ ] Line 133: Add early return if `activeTab !== 'standardize' && activeTab !== 'overview'`
- [ ] Line 198: Add `activeTab` to `ordersWithWrongKeys` dependencies
- [ ] Line 199: Add early return if `activeTab !== 'standardize' && activeTab !== 'overview'`
- [ ] Line 278: Add `activeTab` to `customersWithInvalidPhones` dependencies
- [ ] Line 279: Add early return if `activeTab !== 'optimize' && activeTab !== 'overview'`
- [ ] Line 329: Add `activeTab` to `duplicateCustomers` dependencies
- [ ] Line 330: Add early return if `activeTab !== 'optimize' && activeTab !== 'overview'`

**Code Template**:
```javascript
const hookName = useMemo(() => {
  // ADD THIS:
  if (activeTab !== 'relevant-tab' && activeTab !== 'overview') {
    return [];
  }

  // ... existing logic
}, [existingDeps, activeTab]); // ADD activeTab
```

**Test**:
```bash
# Open DataSync, switch to Maintenance tab
# Console should show SKIPPED for all hooks
```

---

#### Task 1.2: Implement Phone Cache

**File**: `src/pages/DataSync.jsx`

**Changes**:
- [ ] After line 43: Add `const phoneCache = useRef(new Map());`
- [ ] Replace line 45: Wrap `normalizePhone` with `useCallback` and cache logic
- [ ] After line 87: Add `useEffect` to clear cache when data changes

**Code**:
```javascript
// After line 43
const phoneCache = useRef(new Map());

// Replace line 45
const normalizePhone = useCallback((phone) => {
  if (!phone) return '';

  if (phoneCache.current.has(phone)) {
    return phoneCache.current.get(phone);
  }

  const normalized = phone.replace(/\D/g, '');
  phoneCache.current.set(phone, normalized);
  return normalized;
}, []);

// After line 87 (after firebaseCustomers useEffect)
useEffect(() => {
  phoneCache.current.clear();
}, [customers, orders]);
```

**Test**:
```javascript
// Add temporary logging
const normalizePhone = useCallback((phone) => {
  if (!phone) return '';

  const hit = phoneCache.current.has(phone);
  console.log(`normalizePhone(${phone}): ${hit ? 'HIT' : 'MISS'}`);

  // ... rest of logic
}, []);

// Should see 80%+ HIT rate after first pass
```

---

### Phase 2: Stats Optimization (2-3 days)

**File**: `src/pages/DataSync.jsx`

**Changes**:
- [ ] Lines 218-267: Split `stats` into `basicStats`, `issueStats`, and `stats`

**Code**:
```javascript
// Replace lines 218-267
const basicStats = useMemo(() => ({
  totalCustomers: customers?.length || 0,
  totalOrders: orders?.length || 0
}), [customers, orders]);

const issueStats = useMemo(() => {
  if (activeTab === 'maintenance') {
    return {
      phoneIssues: 0,
      orderIdIssues: 0,
      keyIssues: 0,
      customersMissingRequiredFields: 0,
      duplicateCount: 0,
      totalIssues: 0
    };
  }

  // ... existing stats calculation
  return { phoneIssues, orderIdIssues, keyIssues, ... };
}, [activeTab, ordersWithPhoneIssues, customersMissingOrderIds, ...]);

const stats = useMemo(() => {
  const possibleIssues = basicStats.totalOrders + basicStats.totalCustomers * 2;
  const healthScore = possibleIssues > 0
    ? Math.round(((possibleIssues - issueStats.totalIssues) / possibleIssues) * 100)
    : 100;

  return {
    ...basicStats,
    ...issueStats,
    healthScore,
    needsOptimization: issueStats.totalIssues > 0
  };
}, [basicStats, issueStats]);
```

---

### Phase 3: Modal Virtualization (3-4 days)

#### Task 3.1: PhoneFormatModal

**File**: `src/components/DataSync/PhoneFormatModal.jsx`

**Changes**:
- [ ] Line 1: Add `import { useVirtualizer } from '@tanstack/react-virtual';`
- [ ] After line 11: Add `const parentRef = useRef(null);` and virtualizer setup
- [ ] Lines 184-260: Replace `.map()` with virtualizer

**Code** (see full implementation in IMPLEMENTATION_PLAN.md)

---

#### Task 3.2: InvalidPhonesModal

**File**: `src/components/DataSync/InvalidPhonesModal.jsx`

**Changes**: Same pattern as PhoneFormatModal

---

#### Task 3.3: OrderIdsModal

**File**: `src/components/DataSync/OrderIdsModal.jsx`

**Changes**: Same pattern as PhoneFormatModal

---

## Testing Checklist

### Phase 1 Tests

- [ ] Maintenance tab renders in <50ms
- [ ] Optimize tab renders in <100ms
- [ ] All detection algorithms still work correctly
- [ ] Phone cache hit rate > 80%
- [ ] No console errors

### Phase 2 Tests

- [ ] Stats display correctly on all tabs
- [ ] Maintenance tab doesn't trigger detection computation
- [ ] No performance regression

### Phase 3 Tests

- [ ] Modals open in <100ms
- [ ] Smooth scrolling (60fps)
- [ ] All modal functionality works (select, fix buttons)
- [ ] No layout shift

---

## Performance Verification

```javascript
// Add to DataSync component (temporary)
useEffect(() => {
  console.time('DataSync Render');
}, []);

useEffect(() => {
  console.timeEnd('DataSync Render');
  console.log('Active Tab:', activeTab);
  console.log('Operations:', {
    phoneIssues: ordersWithPhoneIssues.length,
    orderIdIssues: customersMissingOrderIds.length,
    keyIssues: ordersWithWrongKeys.length,
    invalidPhones: customersWithInvalidPhones.length,
    duplicates: duplicateCustomers.length
  });
});
```

**Expected Output**:
```
// Maintenance Tab
DataSync Render: 45ms (vs ~1200ms before)
Operations: { phoneIssues: 0, orderIdIssues: 0, ... }

// Optimize Tab
DataSync Render: 85ms (vs ~1200ms before)
Operations: { phoneIssues: 0, orderIdIssues: 0, invalidPhones: 127, duplicates: 45 }
```

---

## Rollback

If something breaks:

```bash
# Revert specific phase
git revert <commit-hash>

# OR restore backup
cp src/pages/DataSync.jsx.backup src/pages/DataSync.jsx

# OR reset branch
git reset --hard main
```

---

## Success Metrics

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Initial render | 1200ms | <300ms | ⏳ |
| Tab switch (Maintenance) | 1000ms | <50ms | ⏳ |
| Tab switch (Optimize) | 1000ms | <100ms | ⏳ |
| Modal open | 300ms | <100ms | ⏳ |
| Total operations | 10M | <2M | ⏳ |

---

## Common Issues

### Issue: Detection returns empty arrays on wrong tabs

**Cause**: Lazy computation working correctly
**Fix**: This is expected! Check activeTab conditions match requirements

---

### Issue: Stale data in cache after edit

**Cause**: Cache not cleared on data change
**Fix**: Ensure `useEffect` clears cache when customers/orders change

---

### Issue: Modal virtualization breaks layout

**Cause**: Incorrect `estimateSize` value
**Fix**: Measure actual item height and adjust:
```javascript
const virtualizer = useVirtualizer({
  estimateSize: () => 160, // Increase if items taller
  overscan: 10 // Increase buffer
});
```

---

## Quick Reference

**Tab → Detection Mapping**:
- `overview`: ALL detections
- `standardize`: ordersWithPhoneIssues, customersMissingOrderIds, ordersWithWrongKeys
- `optimize`: customersWithInvalidPhones, duplicateCustomers
- `maintenance`: NONE

**Key Files**:
- `/src/pages/DataSync.jsx` (main target)
- `/src/components/DataSync/PhoneFormatModal.jsx`
- `/src/components/DataSync/InvalidPhonesModal.jsx`
- `/src/components/DataSync/OrderIdsModal.jsx`

**Full Documentation**: `IMPLEMENTATION_PLAN.md`

---

**Last Updated**: 2025-12-05
