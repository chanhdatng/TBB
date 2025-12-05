# Phase 2: Enhanced Summary Cards

**Date**: 2025-12-05
**Priority**: 🟡 High
**Duration**: 2-3 hours
**Complexity**: Low-Medium
**Dependencies**: Phase 1 complete
**Next**: Phase 3 (Advanced Filters)

## Overview

Replace existing 4 summary cards with 6 enhanced cards showing key customer intelligence metrics.

## Current State (4 Cards)
1. Total Customers + Active Rate (90 days)
2. Total Revenue
3. Average Order Value (per customer)
4. Total Orders + Avg orders/customer

## Target State (6 Cards)
1. **Total Customers** (keep) + Active Rate
2. **Total Revenue** (keep)
3. **Average CLV** (new) - Show average customer lifetime value
4. **Repurchase Rate** (new) - % customers with 2+ orders
5. **High Churn Risk** (new) - Count of high-risk customers
6. **Customer Health** (new) - Average health score 0-100

## Implementation

### File: src/pages/Customers.jsx

### Step 1: Update summaryStats Calculation

**Location**: Lines 90-110 (approximate)

**Replace with**:
```javascript
const summaryStats = useMemo(() => {
  const totalCustomers = enrichedCustomers.length;
  const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrders = enrichedCustomers.reduce((sum, c) => sum + (c.orders || 0), 0);

  // Active customers (90 days)
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const activeCustomers = enrichedCustomers.filter(c =>
    c.rawLastOrder && new Date(c.rawLastOrder) >= cutoffDate
  ).length;

  // Average CLV
  const avgCLV = totalCustomers > 0
    ? enrichedCustomers.reduce((sum, c) => sum + (c.clv || 0), 0) / totalCustomers
    : 0;

  // Repurchase Rate
  const customersWithOrders = enrichedCustomers.filter(c => (c.orders || 0) >= 1).length;
  const customersWithRepurchase = enrichedCustomers.filter(c => (c.orders || 0) >= 2).length;
  const repurchaseRate = customersWithOrders > 0
    ? (customersWithRepurchase / customersWithOrders) * 100
    : 0;

  // High Churn Risk Count
  const highChurnRiskCount = enrichedCustomers.filter(c =>
    c.churnRisk?.level === 'high'
  ).length;

  // Average Health Score
  const avgHealthScore = totalCustomers > 0
    ? enrichedCustomers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / totalCustomers
    : 0;

  return {
    totalCustomers,
    totalRevenue,
    totalOrders,
    activeCustomers,
    activeRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
    avgCLV,
    repurchaseRate,
    highChurnRiskCount,
    avgHealthScore
  };
}, [enrichedCustomers]);
```

### Step 2: Replace Summary Cards JSX

**Location**: Lines 197-252 (approximate)

**Replace entire grid div with**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  {/* Card 1: Total Customers */}
  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-blue-500 rounded-lg shadow-md">
        <Users size={24} className="text-white" />
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-blue-700">Tỷ lệ hoạt động</p>
        <p className="text-lg font-bold text-blue-900">{summaryStats.activeRate.toFixed(0)}%</p>
      </div>
    </div>
    <h3 className="text-3xl font-bold text-blue-900 mb-1">{summaryStats.totalCustomers}</h3>
    <p className="text-sm text-blue-700 font-medium">Tổng khách hàng</p>
    <p className="text-xs text-blue-600 mt-2">{summaryStats.activeCustomers} hoạt động trong 90 ngày</p>
  </div>

  {/* Card 2: Total Revenue */}
  <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-xl border border-green-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-green-500 rounded-lg shadow-md">
        <DollarSign size={24} className="text-white" />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-green-900 mb-1">
      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(summaryStats.totalRevenue)}
    </h3>
    <p className="text-sm text-green-700 font-medium">Tổng doanh thu</p>
    <p className="text-xs text-green-600 mt-2">Từ tất cả khách hàng</p>
  </div>

  {/* Card 3: Average CLV (NEW) */}
  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-purple-500 rounded-lg shadow-md">
        <TrendingUp size={24} className="text-white" />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-purple-900 mb-1">
      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(summaryStats.avgCLV)}
    </h3>
    <p className="text-sm text-purple-700 font-medium">CLV Trung bình</p>
    <p className="text-xs text-purple-600 mt-2">Giá trị trọn đời khách hàng</p>
  </div>

  {/* Card 4: Repurchase Rate (NEW) */}
  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-6 rounded-xl border border-cyan-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-cyan-500 rounded-lg shadow-md">
        <ShoppingBag size={24} className="text-white" />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-cyan-900 mb-1">{summaryStats.repurchaseRate.toFixed(1)}%</h3>
    <p className="text-sm text-cyan-700 font-medium">Tỷ lệ mua lại</p>
    <p className="text-xs text-cyan-600 mt-2">Khách hàng có 2+ đơn hàng</p>
  </div>

  {/* Card 5: High Churn Risk (NEW) */}
  <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl border border-red-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-red-500 rounded-lg shadow-md">
        <AlertCircle size={24} className="text-white" />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-red-900 mb-1">{summaryStats.highChurnRiskCount}</h3>
    <p className="text-sm text-red-700 font-medium">Nguy cơ cao</p>
    <p className="text-xs text-red-600 mt-2">Khách hàng cần chú ý ngay</p>
  </div>

  {/* Card 6: Customer Health (NEW) */}
  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-xl border border-amber-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-amber-500 rounded-lg shadow-md">
        <Award size={24} className="text-white" />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-amber-900 mb-1">{summaryStats.avgHealthScore.toFixed(0)}</h3>
    <p className="text-sm text-amber-700 font-medium">Sức khỏe TB</p>
    <p className="text-xs text-amber-600 mt-2">Điểm trung bình 0-100</p>
  </div>
</div>
```

## Success Criteria
- [ ] 6 cards display correct values
- [ ] All numbers calculate properly
- [ ] Cards responsive on mobile
- [ ] No layout breaking
- [ ] Icons render correctly

## Testing
1. Verify repurchase rate <100%
2. Check high churn risk count < total customers
3. Confirm avg health score between 0-100
4. Test responsive layout on mobile

