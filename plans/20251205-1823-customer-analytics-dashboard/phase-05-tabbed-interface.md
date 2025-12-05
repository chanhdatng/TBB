# Phase 5: Tabbed Interface

**Duration**: 8-10 hours | **Complexity**: HIGH | **Priority**: 🟢 Nice-to-have

---

## Overview

Add 4-tab navigation with 3 new analytics views. This is the MOST COMPLEX phase.

**Tabs**:
1. **Tổng quan** - Enhanced customer list (existing + all improvements)
2. **Phân tích Cohort** - Retention heatmap by signup month
3. **Sản phẩm** - Product affinity by RFM segment
4. **Địa lý** - HCM district/zone distribution

---

## New Files to Create

### 1. CohortAnalysisView.jsx (~200 lines)

**Location**: `src/components/Customers/CohortAnalysisView.jsx`

**Features**:
- Retention heatmap (12 months × 12 months)
- Color-coded cells (green=high retention, red=low)
- Cohort size + stats
- Uses `buildCohortRetentionData` from customerMetrics

**Key Code**:
```javascript
import { buildCohortRetentionData } from '../../utils/customerMetrics';

const CohortAnalysisView = ({ customers, orders }) => {
  const cohortData = useMemo(() =>
    buildCohortRetentionData(customers, orders),
    [customers, orders]
  );

  return (
    <div>
      <h2>Phân tích Cohort Retention</h2>
      {/* Heatmap grid */}
      {/* Stats table */}
    </div>
  );
};
```

---

### 2. ProductAffinityView.jsx (~150 lines)

**Location**: `src/components/Customers/ProductAffinityView.jsx`

**Features**:
- Top 10 products overall
- Product popularity by RFM segment
- Revenue contribution chart
- Uses `analyzeProductAffinityBySegment`

---

### 3. GeographicView.jsx (~200 lines)

**Location**: `src/components/Customers/GeographicView.jsx`

**Features**:
- District ranking table (count + revenue)
- Zone distribution chart
- Top 5 high-value districts
- Delivery tier classification
- Uses `calculateGeographicStats`

---

## Modify Customers.jsx

**Add tab state**:
```javascript
const [activeTab, setActiveTab] = useState('overview');
```

**Add tab navigation UI**:
```jsx
<div className="flex gap-2 mb-6 border-b">
  <button onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'active' : ''}>
    Tổng quan
  </button>
  <button onClick={() => setActiveTab('cohort')}>Phân tích Cohort</button>
  <button onClick={() => setActiveTab('products')}>Sản phẩm</button>
  <button onClick={() => setActiveTab('geographic')}>Địa lý</button>
</div>
```

**Conditional render**:
```jsx
{activeTab === 'overview' && (
  // Existing customer list
)}
{activeTab === 'cohort' && (
  <CohortAnalysisView customers={enrichedCustomers} orders={orders} />
)}
{activeTab === 'products' && (
  <ProductAffinityView customers={enrichedCustomers} orders={orders} />
)}
{activeTab === 'geographic' && (
  <GeographicView customers={enrichedCustomers} />
)}
```

---

## Implementation Order

1. **Day 1**: Create CohortAnalysisView (4-5h)
2. **Day 2**: Create ProductAffinityView + GeographicView (4-5h)
3. **Integration**: Add tabs to Customers.jsx (1h)
4. **Testing**: All tabs + data accuracy (1h)

---

## Success Criteria

- [ ] 4 tabs switch smoothly
- [ ] Cohort heatmap renders correctly
- [ ] Product charts display
- [ ] Geographic map works
- [ ] No performance issues

---

## Recommendation

**CAN SKIP THIS PHASE** if time limited. Do Phases 1-4, 6-8 first. Come back to tabs later.
