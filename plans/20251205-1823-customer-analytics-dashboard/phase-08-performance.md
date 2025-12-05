# Phase 8: Performance Optimizations

**Duration**: 3-4 hours | **Complexity**: Medium | **Priority**: 🟢 Do if experiencing lag

---

## Overview

Optimize for 2353 customers with aggressive memoization, debouncing, and conditional optimizations.

**Target**: <2s page load, <300ms search response

---

## Optimizations to Implement

### 1. Debounced Search (30 min)

**Add custom hook**:
```javascript
// At top of Customers.jsx
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// In component
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);

// Use debouncedSearch instead of searchTerm in filteredCustomers
```

---

### 2. Memoize Expensive Calculations (1 hour)

**CLV percentile calculation**:
```javascript
const allCLVs = useMemo(() =>
  withCLV.map(c => c.clv),
  [withCLV]
);
```

**Geographic stats**:
```javascript
const geoStats = useMemo(() =>
  calculateGeographicStats(enrichedCustomers),
  [enrichedCustomers]
);
```

**Cohort data**:
```javascript
const cohortData = useMemo(() =>
  buildCohortRetentionData(enrichedCustomers, orders),
  [enrichedCustomers, orders]
);
```

---

### 3. React.memo for CustomerCard (1 hour)

**Create memoized component**:
```javascript
const CustomerCard = React.memo(({ customer, onClick }) => {
  // ... card JSX
}, (prevProps, nextProps) => {
  // Only re-render if customer ID changes
  return prevProps.customer.id === nextProps.customer.id;
});
```

---

### 4. Virtualized Table (1-2 hours) - OPTIONAL

**Only if list view is laggy**:

```bash
npm install react-window
```

```javascript
import { FixedSizeList } from 'react-window';

// Replace table mapping with:
<FixedSizeList
  height={600}
  itemCount={filteredCustomers.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <CustomerRow
      key={filteredCustomers[index].id}
      customer={filteredCustomers[index]}
      style={style}
    />
  )}
</FixedSizeList>
```

---

### 5. Loading States for Tabs (30 min)

```javascript
const [isLoadingTab, setIsLoadingTab] = useState(false);

const handleTabChange = async (tab) => {
  setIsLoadingTab(true);
  setActiveTab(tab);
  await new Promise(resolve => setTimeout(resolve, 100));
  setIsLoadingTab(false);
};

{isLoadingTab && <LoadingSpinner />}
```

---

### 6. Lazy Load Heavy Components (30 min)

```javascript
const CohortAnalysisView = lazy(() => import('../components/Customers/CohortAnalysisView'));
const ProductAffinityView = lazy(() => import('../components/Customers/ProductAffinityView'));
const GeographicView = lazy(() => import('../components/Customers/GeographicView'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  {activeTab === 'cohort' && <CohortAnalysisView ... />}
</Suspense>
```

---

## Performance Metrics to Track

**Before optimization**:
- Measure enrichedCustomers calculation time
- Measure filteredCustomers calculation time
- Measure render time for 100 cards
- Measure search input lag

**After optimization**:
- All should be <100ms faster

---

## Testing

Use React DevTools Profiler:
1. Record interaction
2. Check "Ranked" chart
3. Identify slow components
4. Apply optimizations
5. Re-measure

---

## Success Criteria

✅ Page loads <2s
✅ Search responds <300ms
✅ No lag scrolling
✅ Tabs switch <100ms
✅ Filters apply instantly

---

## When to Apply

**Do this phase if**:
- Page takes >2s to load
- Search feels laggy
- Scrolling stutters
- Tab switching slow

**Skip if**:
- Everything feels fast already
- User doesn't complain
