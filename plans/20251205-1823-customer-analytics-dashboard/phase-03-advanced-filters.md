# Phase 3: Advanced Filters

**Date**: 2025-12-05
**Priority**: 🟡 High
**Duration**: 3-4 hours
**Complexity**: Medium
**Dependencies**: Phase 1, Phase 2
**Next**: Phase 4 (Customer Cards Enhancement)

---

## Context Links

- **Parent Plan**: [plan.md](./plan.md)
- **Previous**: [phase-02-summary-cards.md](./phase-02-summary-cards.md)
- **Next**: [phase-04-customer-cards.md](./phase-04-customer-cards.md)
- **Related**: `src/pages/Customers.jsx`

---

## Overview

Add 5 new filter dimensions and 3 new sort options to help users find specific customer segments quickly.

### Current Filters (Keep These)
- Search (name/phone/email)
- Min Orders
- Min Spent
- Last Order Date (all/30days/3months/year)
- RFM Segment (11 segments)

### New Filters (Add)
1. **Churn Risk Level** - all/high/medium/low
2. **CLV Segment** - all/VIP/High/Medium/Low
3. **Loyalty Stage** - all/New/Growing/Loyal/Champion/At Risk/Lost
4. **Zone** - all/Trung tâm/Đông/Nam/Tây/Bắc/Ngoại thành
5. **District** - all + 24 HCM districts

### New Sort Options (Add)
- CLV (highest → lowest)
- Health Score (highest → lowest)
- Churn Risk (highest risk → lowest)

---

## Key Insights

### Filter Combinations
Users will combine multiple filters:
- "Show VIP customers in Quận 1 with high churn risk"
- "Show Loyal customers who ordered in last 30 days"
- "Show customers in Đông zone with declining trend"

**Implementation**: Use AND logic for all filters

### Performance
With 2353 customers + 5 new filters = potential lag

**Solution**:
- Keep filteredCustomers memoized
- Apply all filters in single pass
- Use early returns for efficiency

### UX Considerations
9 total filters = overwhelming

**Solution**:
- Group related filters
- Clear visual hierarchy
- "Reset All" button prominent

---

## Requirements

### Functional
1. All 9 filters work independently
2. Filters combine with AND logic
3. Reset button clears all filters
4. Filtered count displays
5. Sort applies to filtered results
6. Filters persist during navigation

### Non-Functional
- Filter response <100ms
- Clear visual feedback
- Mobile responsive
- Accessible (keyboard nav)

---

## Implementation Steps

### Step 1: Update Filters State (5 min)

**Location**: `src/pages/Customers.jsx`, line ~15

**Replace filters state**:
```javascript
const [filters, setFilters] = useState({
  // Existing
  minOrders: '',
  minSpent: '',
  lastOrderDate: 'all',
  segment: 'all',

  // NEW filters
  churnRisk: 'all',
  clvSegment: 'all',
  loyaltyStage: 'all',
  zone: 'all',
  district: 'all'
});
```

---

### Step 2: Add Sort Options (5 min)

**Location**: `src/pages/Customers.jsx`, line ~14

**Update sortConfig to support new options**:
```javascript
const [sortConfig, setSortConfig] = useState({
  key: 'lastOrder',
  direction: 'desc'
});

// Sort options will be: totalSpent, orders, lastOrder, name, clv, healthScore, churnRisk
```

---

### Step 3: Enhance filteredCustomers Logic (1-1.5 hours)

**Location**: `src/pages/Customers.jsx`, lines ~112-166

**Replace filteredCustomers useMemo with**:

```javascript
const filteredCustomers = useMemo(() => {
  let result = enrichedCustomers.filter(customer =>
    // Search filter (existing)
    (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone || '').includes(searchTerm) ||
    (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== EXISTING FILTERS =====

  // Min Orders
  if (filters.minOrders) {
    result = result.filter(c => c.orders >= Number(filters.minOrders));
  }

  // Min Spent
  if (filters.minSpent) {
    result = result.filter(c => c.totalSpent >= Number(filters.minSpent));
  }

  // Last Order Date
  if (filters.lastOrderDate !== 'all') {
    const days = filters.lastOrderDate === '30days' ? 30 :
                 filters.lastOrderDate === '3months' ? 90 :
                 filters.lastOrderDate === 'year' ? 365 : 0;

    if (days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      result = result.filter(c => {
        if (!c.rawLastOrder) return false;
        return new Date(c.rawLastOrder) >= cutoff;
      });
    }
  }

  // RFM Segment
  if (filters.segment !== 'all') {
    result = result.filter(c => c.rfm?.segment === filters.segment);
  }

  // ===== NEW FILTERS =====

  // Churn Risk
  if (filters.churnRisk !== 'all') {
    result = result.filter(c => c.churnRisk?.level === filters.churnRisk);
  }

  // CLV Segment
  if (filters.clvSegment !== 'all') {
    result = result.filter(c => c.clvSegment === filters.clvSegment);
  }

  // Loyalty Stage
  if (filters.loyaltyStage !== 'all') {
    result = result.filter(c => c.loyaltyStage?.stage === filters.loyaltyStage);
  }

  // Zone
  if (filters.zone !== 'all') {
    result = result.filter(c => c.location?.zone === filters.zone);
  }

  // District
  if (filters.district !== 'all') {
    result = result.filter(c => c.location?.district === filters.district);
  }

  // ===== SORTING =====
  result.sort((a, b) => {
    let comparison = 0;

    switch (sortConfig.key) {
      case 'totalSpent':
        comparison = a.totalSpent - b.totalSpent;
        break;
      case 'orders':
        comparison = a.orders - b.orders;
        break;
      case 'lastOrder':
        comparison = (a.rawLastOrder || 0) - (b.rawLastOrder || 0);
        break;
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;

      // NEW SORT OPTIONS
      case 'clv':
        comparison = (a.clv || 0) - (b.clv || 0);
        break;
      case 'healthScore':
        comparison = (a.healthScore || 0) - (b.healthScore || 0);
        break;
      case 'churnRisk':
        // Higher risk = higher score = show first
        comparison = (a.churnRisk?.score || 0) - (b.churnRisk?.score || 0);
        break;

      default:
        comparison = 0;
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  return result;
}, [enrichedCustomers, searchTerm, filters, sortConfig]);
```

---

### Step 4: Update Filter UI (1.5-2 hours)

**Location**: `src/pages/Customers.jsx`, lines ~254-361

**Replace filter bar with enhanced version**:

```jsx
{/* Persistent Filter Bar */}
<div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
  {/* Search Row */}
  <div className="relative">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
    <input
      type="text"
      placeholder="Tìm kiếm theo tên, SĐT, email..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm transition-all placeholder:text-gray-400"
    />
  </div>

  {/* Filters Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
    {/* Row 1: Core Filters */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Sắp xếp</label>
      <div className="flex gap-2">
        <select
          value={sortConfig.key}
          onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
        >
          <option value="totalSpent">Tổng chi tiêu</option>
          <option value="orders">Số đơn hàng</option>
          <option value="lastOrder">Đơn cuối</option>
          <option value="name">Tên</option>
          <option value="clv">CLV</option>
          <option value="healthScore">Điểm sức khỏe</option>
          <option value="churnRisk">Rủi ro cao nhất</option>
        </select>
        <button
          onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
          className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title={`Sắp xếp ${sortConfig.direction === 'asc' ? 'Giảm dần' : 'Tăng dần'}`}
        >
          {sortConfig.direction === 'asc' ? <ArrowUp size={18} className="text-gray-600" /> : <ArrowDown size={18} className="text-gray-600" />}
        </button>
      </div>
    </div>

    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Đơn cuối</label>
      <select
        value={filters.lastOrderDate}
        onChange={(e) => setFilters({ ...filters, lastOrderDate: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
      >
        <option value="all">Tất cả</option>
        <option value="30days">30 ngày</option>
        <option value="3months">3 tháng</option>
        <option value="year">1 năm</option>
      </select>
    </div>

    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phân khúc RFM</label>
      <select
        value={filters.segment}
        onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
      >
        <option value="all">Tất cả</option>
        <option value="Champions">Champions</option>
        <option value="Loyal">Loyal</option>
        <option value="Potential Loyalists">Potential Loyalists</option>
        <option value="New Customers">New Customers</option>
        <option value="Promising">Promising</option>
        <option value="Need Attention">Need Attention</option>
        <option value="About to Sleep">About to Sleep</option>
        <option value="At Risk">At Risk</option>
        <option value="Cannot Lose Them">Cannot Lose Them</option>
        <option value="Hibernating">Hibernating</option>
        <option value="Lost">Lost</option>
      </select>
    </div>

    {/* NEW: Churn Risk */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Rủi ro mất khách</label>
      <select
        value={filters.churnRisk}
        onChange={(e) => setFilters({ ...filters, churnRisk: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
      >
        <option value="all">Tất cả</option>
        <option value="high">Cao</option>
        <option value="medium">Trung bình</option>
        <option value="low">Thấp</option>
      </select>
    </div>

    {/* Row 2: Advanced Filters */}
    {/* NEW: CLV Segment */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phân khúc CLV</label>
      <select
        value={filters.clvSegment}
        onChange={(e) => setFilters({ ...filters, clvSegment: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
      >
        <option value="all">Tất cả</option>
        <option value="VIP">VIP (Top 10%)</option>
        <option value="High">High (10-30%)</option>
        <option value="Medium">Medium (30-70%)</option>
        <option value="Low">Low (70%+)</option>
      </select>
    </div>

    {/* NEW: Loyalty Stage */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Giai đoạn</label>
      <select
        value={filters.loyaltyStage}
        onChange={(e) => setFilters({ ...filters, loyaltyStage: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
      >
        <option value="all">Tất cả</option>
        <option value="Champion">Champion</option>
        <option value="Loyal">Trung thành</option>
        <option value="Growing">Phát triển</option>
        <option value="New">Mới</option>
        <option value="At Risk">Nguy cơ</option>
        <option value="Lost">Đã mất</option>
      </select>
    </div>

    {/* NEW: Zone */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Khu vực</label>
      <select
        value={filters.zone}
        onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
      >
        <option value="all">Tất cả</option>
        <option value="Trung tâm">Trung tâm</option>
        <option value="Đông">Đông</option>
        <option value="Nam">Nam</option>
        <option value="Tây">Tây</option>
        <option value="Bắc">Bắc</option>
        <option value="Ngoại thành">Ngoại thành</option>
      </select>
    </div>

    {/* NEW: District */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Quận/Huyện</label>
      <select
        value={filters.district}
        onChange={(e) => setFilters({ ...filters, district: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
      >
        <option value="all">Tất cả</option>
        <option value="Quận 1">Quận 1</option>
        <option value="Quận 2">Quận 2</option>
        <option value="Quận 3">Quận 3</option>
        <option value="Quận 4">Quận 4</option>
        <option value="Quận 5">Quận 5</option>
        <option value="Quận 6">Quận 6</option>
        <option value="Quận 7">Quận 7</option>
        <option value="Quận 8">Quận 8</option>
        <option value="Quận 9">Quận 9</option>
        <option value="Quận 10">Quận 10</option>
        <option value="Quận 11">Quận 11</option>
        <option value="Quận 12">Quận 12</option>
        <option value="Thủ Đức">Thủ Đức</option>
        <option value="Bình Thạnh">Bình Thạnh</option>
        <option value="Tân Bình">Tân Bình</option>
        <option value="Tân Phú">Tân Phú</option>
        <option value="Phú Nhuận">Phú Nhuận</option>
        <option value="Gò Vấp">Gò Vấp</option>
        <option value="Bình Tân">Bình Tân</option>
        <option value="Hóc Môn">Hóc Môn</option>
        <option value="Củ Chi">Củ Chi</option>
        <option value="Bình Chánh">Bình Chánh</option>
        <option value="Nhà Bè">Nhà Bè</option>
        <option value="Cần Giờ">Cần Giờ</option>
      </select>
    </div>

    {/* Row 3: Numeric Filters */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Số đơn tối thiểu</label>
      <input
        type="number"
        min="0"
        value={filters.minOrders}
        onChange={(e) => setFilters({ ...filters, minOrders: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all hover:bg-gray-100"
        placeholder="0"
      />
    </div>

    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Chi tiêu tối thiểu</label>
      <input
        type="number"
        min="0"
        value={filters.minSpent}
        onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all hover:bg-gray-100"
        placeholder="0"
      />
    </div>

    {/* Spacer + Reset */}
    <div className="md:col-span-2 lg:col-span-2 flex items-end justify-between">
      {/* Filtered count */}
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-gray-900">{filteredCustomers.length}</span> / {enrichedCustomers.length} khách hàng
      </div>

      {/* Reset button */}
      <button
        onClick={() => {
          setFilters({
            minOrders: '',
            minSpent: '',
            lastOrderDate: 'all',
            segment: 'all',
            churnRisk: 'all',
            clvSegment: 'all',
            loyaltyStage: 'all',
            zone: 'all',
            district: 'all'
          });
          setSortConfig({ key: 'lastOrder', direction: 'desc' });
          setSearchTerm('');
        }}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer font-medium"
      >
        <RotateCcw size={16} />
        <span>Đặt lại</span>
      </button>
    </div>
  </div>
</div>
```

---

## Testing Checklist

### Filter Tests
- [ ] Each filter works independently
- [ ] Combining 2+ filters works (AND logic)
- [ ] Filtered count updates correctly
- [ ] "Tất cả" option shows all customers
- [ ] Reset button clears all filters
- [ ] Search + filters work together

### Sort Tests
- [ ] CLV sort: highest first (desc)
- [ ] Health Score sort: highest first (desc)
- [ ] Churn Risk sort: highest risk first (desc)
- [ ] Existing sorts still work
- [ ] Sort direction toggle works
- [ ] Sort applies to filtered results

### Edge Cases
- [ ] 0 results after filtering
- [ ] All filters at maximum restriction
- [ ] District filter with Zone filter (should work)
- [ ] Switching filters quickly

### Performance
- [ ] Filter response <100ms
- [ ] No lag with 2353 customers
- [ ] Smooth UI updates

---

## Success Criteria

- ✅ 5 new filters functional
- ✅ 3 new sort options working
- ✅ Filter combinations work
- ✅ Filtered count accurate
- ✅ Reset clears everything
- ✅ Mobile responsive
- ✅ No performance issues

---

## Risk Assessment

### Medium Risk
- **Too many filters**: Users overwhelmed
  - **Mitigation**: Clear labels, logical grouping

- **Performance**: Filtering 2353 customers
  - **Mitigation**: Already memoized, should be fast

### Low Risk
- **UI complexity**: Filters taking too much space
  - **Mitigation**: Responsive grid layout

---

## Next Steps

After Phase 3 complete:
1. Test all filter combinations
2. Verify performance
3. Get user feedback on UI
4. Proceed to Phase 4 (Customer Cards Enhancement)
