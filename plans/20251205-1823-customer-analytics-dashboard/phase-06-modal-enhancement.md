# Phase 6: Customer Details Modal Enhancement

**Duration**: 4-5 hours | **Complexity**: Medium | **Priority**: 🟡 High

---

## Overview

Enhance existing CustomerDetailsModal with new sections for CLV, churn risk, health, loyalty, behavior, and location.

**File**: `src/components/Customers/CustomerDetailsModal.jsx`

---

## What to Add

Insert AFTER header (line ~98), BEFORE existing RFM Scorecard:

### 1. Top Summary Bar
```jsx
<div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
  <div className="grid grid-cols-4 gap-4">
    {/* CLV */}
    <div>
      <p className="text-xs text-gray-600 mb-1">CLV Dự kiến</p>
      <p className="text-2xl font-bold text-purple-900">
        {formatCurrency(customer.clv)}
      </p>
      <span className={`text-xs px-2 py-0.5 rounded ${getCLVSegmentColor(customer.clvSegment)}`}>
        {customer.clvSegment}
      </span>
    </div>

    {/* Health Score */}
    <div>
      <p className="text-xs text-gray-600 mb-1">Sức khỏe</p>
      <p className="text-2xl font-bold">{customer.healthScore}/100</p>
      <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
        <div style={{width: `${customer.healthScore}%`}} className="h-2 bg-green-500 rounded-full"/>
      </div>
    </div>

    {/* Churn Risk */}
    <div>
      <p className="text-xs text-gray-600 mb-1">Rủi ro</p>
      <span className={`inline-block px-3 py-1 rounded-full ${customer.churnRisk.color}`}>
        {customer.churnRisk.label}
      </span>
      <p className="text-xs text-gray-600 mt-1">Score: {customer.churnRisk.score}/100</p>
    </div>

    {/* Loyalty Stage */}
    <div>
      <p className="text-xs text-gray-600 mb-1">Giai đoạn</p>
      <span className={`inline-block px-3 py-1 rounded-full ${customer.loyaltyStage.color}`}>
        {customer.loyaltyStage.label}
      </span>
    </div>
  </div>
</div>
```

### 2. Behavioral Insights Card
```jsx
<div className="p-6 border-b bg-blue-50/30">
  <h3 className="font-bold text-lg mb-4">Hành vi mua hàng</h3>
  <div className="grid grid-cols-3 gap-4">
    <div className="bg-white p-4 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Ngày thường mua</p>
      <p className="font-bold text-lg">{customer.behavior.peakDay}</p>
    </div>
    <div className="bg-white p-4 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Giờ thường mua</p>
      <p className="font-bold text-lg">{customer.behavior.peakHour}</p>
    </div>
    <div className="bg-white p-4 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Khoảng cách đơn TB</p>
      <p className="font-bold text-lg">{customer.behavior.avgDaysBetweenOrders} ngày</p>
    </div>
  </div>
</div>
```

### 3. Location Info Card
```jsx
<div className="p-6 border-b">
  <h3 className="font-bold text-lg mb-4">Thông tin địa lý</h3>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <p className="text-xs text-gray-600 mb-1">Quận/Huyện</p>
      <p className="font-bold">{customer.location.district}</p>
    </div>
    <div>
      <p className="text-xs text-gray-600 mb-1">Khu vực</p>
      <span className={`px-2 py-1 rounded ${getZoneColor(customer.location.zone)}`}>
        {customer.location.zone}
      </span>
    </div>
    <div>
      <p className="text-xs text-gray-600 mb-1">Tier giao hàng</p>
      <p className="font-bold">{getDeliveryTier(customer.location.district).label}</p>
    </div>
  </div>
</div>
```

---

## Keep Existing Sections
- RFM Scorecard (keep as is)
- Stats grid (orders/spent/AOV)
- Purchase metrics (trend, frequency)
- Favorite items
- Order history

---

## Implementation Steps

1. Import new utilities (5 min)
2. Add top summary bar after header (30 min)
3. Add behavioral insights card (30 min)
4. Add location card (30 min)
5. Test with various customer types (1 hour)
6. Adjust styling/spacing (1 hour)

---

## Testing

- [ ] All new sections display
- [ ] Data accurate
- [ ] Colors correct
- [ ] Mobile responsive
- [ ] Scrolling works

---

## Success Criteria

✅ Modal shows all new metrics
✅ Existing sections still work
✅ Layout not broken
✅ Performance OK
