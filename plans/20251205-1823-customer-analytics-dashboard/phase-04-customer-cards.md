# Phase 4: Customer Cards Enhancement

**Date**: 2025-12-05
**Priority**: 🟡 High
**Duration**: 3-4 hours
**Complexity**: Medium
**Dependencies**: Phase 1, 2, 3
**Next**: Phase 5 (Tabbed Interface) or Phase 6 (Modal)

---

## Overview

Enhance existing customer cards (grid view) and rows (list view) with new visual indicators for CLV, churn risk, health score, and location.

### Current Display
- Avatar with initial
- Name + RFM segment badge
- Phone, email, address
- Customer tenure
- Lifetime value card
- Orders/AOV/Last order stats

### Add to Display
1. **CLV Segment Badge** - Small pill next to name (VIP/High/Medium/Low)
2. **Churn Risk Indicator** - Color dot (🔴 High, 🟡 Medium, 🟢 Low)
3. **Health Score** - Mini progress bar or number badge
4. **Zone Label** - Location zone (Trung tâm, Đông, etc.)

---

## Implementation

### Step 1: Import New Utilities (2 min)

**Location**: Top of Customers.jsx

```javascript
import { getCLVSegmentColor } from '../utils/customerMetrics';
import { getZoneColor } from '../utils/addressParser';
```

---

### Step 2: Update Grid View Cards (1.5-2 hours)

**Location**: `src/pages/Customers.jsx`, lines ~407-498

**Enhance customer cards with new badges**:

```jsx
{currentCustomers.map((customer) => {
  const tenureDays = customer.createdAt ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const tenureMonths = Math.floor(tenureDays / 30);

  // Get colors for new badges
  const clvColors = getCLVSegmentColor(customer.clvSegment);
  const zoneColors = getZoneColor(customer.location?.zone);
  const churnColor = customer.churnRisk?.level === 'high' ? 'bg-red-500' :
                     customer.churnRisk?.level === 'medium' ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div
      key={customer.id}
      onClick={() => setSelectedCustomer(customer)}
      className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* Header with Avatar and Badges */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-xl font-heading flex-shrink-0 relative">
            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
            {/* Churn Risk Dot */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 ${churnColor} rounded-full border-2 border-white`}
                 title={`Rủi ro: ${customer.churnRisk?.label}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + CLV Badge */}
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-bold text-gray-900 font-heading text-lg truncate">{customer.name || 'Unknown'}</h3>
              {/* CLV Segment Badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${clvColors}`}>
                {customer.clvSegment}
              </span>
            </div>

            {/* RFM Segment Badge (existing) */}
            <SegmentBadge segment={customer.rfm?.segment} size="sm" />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <Phone size={14} className="text-gray-400 flex-shrink-0" />
          <span>{customer.phone || 'N/A'}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Mail size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {/* Zone Label (NEW) */}
        {customer.location?.zone && customer.location.zone !== 'Unknown' && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${zoneColors.bg} ${zoneColors.text} ${zoneColors.border}`}>
              {customer.location.zone}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Customer Since</p>
          <p className="font-bold text-gray-900 text-sm">
            {tenureMonths > 0 ? `${tenureMonths}mo` : `${tenureDays}d`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }) : 'N/A'}
          </p>
        </div>

        <div className="bg-primary/5 p-3 rounded-lg">
          <p className="text-xs font-medium text-primary/70 mb-1">Lifetime Value</p>
          <p className="font-bold text-primary text-sm">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.totalSpent) || 0)}
          </p>
          <p className="text-xs text-primary/70 mt-0.5">{customer.orders} orders</p>
        </div>
      </div>

      {/* Health Score Bar (NEW) */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-gray-600">Sức khỏe</span>
          <span className="font-bold text-gray-900">{customer.healthScore || 0}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              customer.healthScore >= 80 ? 'bg-green-500' :
              customer.healthScore >= 60 ? 'bg-blue-500' :
              customer.healthScore >= 40 ? 'bg-yellow-500' :
              customer.healthScore >= 20 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${customer.healthScore || 0}%` }}
          />
        </div>
      </div>

      {/* Bottom Stats (existing) */}
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-500 mb-1">Orders</p>
          <p className="font-bold text-gray-900 text-base">{customer.orders}</p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">AOV</p>
          <p className="font-bold text-gray-900 text-sm">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.aov) || 0)}
          </p>
        </div>
        <div className="text-center border-l border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Last</p>
          <p className="font-bold text-gray-900 text-xs truncate">{customer.lastOrder}</p>
        </div>
      </div>

      <button className="w-full mt-3 py-2.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group-hover:bg-primary/10">
        Xem chi tiết
      </button>
    </div>
  );
})}
```

---

### Step 3: Update List View Rows (1-1.5 hours)

**Location**: `src/pages/Customers.jsx`, lines ~500-625

**Enhance table rows**:

```jsx
{currentCustomers.map((customer) => {
  const tenureDays = customer.createdAt ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const tenureMonths = Math.floor(tenureDays / 30);

  const clvColors = getCLVSegmentColor(customer.clvSegment);
  const zoneColors = getZoneColor(customer.location?.zone);
  const churnColor = customer.churnRisk?.level === 'high' ? 'bg-red-500' :
                     customer.churnRisk?.level === 'medium' ? 'bg-orange-500' : 'bg-green-500';

  return (
    <tr
      key={customer.id}
      onClick={() => setSelectedCustomer(customer)}
      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
    >
      {/* Customer Column */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold font-heading flex-shrink-0 relative">
            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
            {/* Churn Risk Dot */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 ${churnColor} rounded-full border-2 border-white`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-semibold text-gray-900 truncate">{customer.name || 'Unknown'}</div>
              {/* CLV Badge */}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${clvColors}`}>
                {customer.clvSegment}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </div>
          </div>
        </div>
      </td>

      {/* RFM Segment */}
      <td className="px-5 py-4">
        <SegmentBadge segment={customer.rfm?.segment} size="sm" />
      </td>

      {/* Contact */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          {customer.phone && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Phone size={13} className="text-gray-400 flex-shrink-0" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Mail size={13} className="text-gray-400 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{customer.email}</span>
            </div>
          )}
        </div>
      </td>

      {/* Location (NEW) */}
      <td className="px-5 py-4">
        {customer.location?.zone && customer.location.zone !== 'Unknown' ? (
          <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium border ${zoneColors.bg} ${zoneColors.text} ${zoneColors.border}`}>
            {customer.location.zone}
          </span>
        ) : (
          <span className="text-xs text-gray-400">Unknown</span>
        )}
        {customer.location?.district && customer.location.district !== 'Unknown' && (
          <div className="text-xs text-gray-500 mt-1">{customer.location.district}</div>
        )}
      </td>

      {/* Health Score (NEW) */}
      <td className="px-5 py-4 text-center">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-gray-900 text-sm mb-1">
            {customer.healthScore || 0}
          </span>
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                customer.healthScore >= 80 ? 'bg-green-500' :
                customer.healthScore >= 60 ? 'bg-blue-500' :
                customer.healthScore >= 40 ? 'bg-yellow-500' :
                customer.healthScore >= 20 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${customer.healthScore || 0}%` }}
            />
          </div>
        </div>
      </td>

      {/* Rest of columns (existing) */}
      <td className="px-5 py-4 text-center">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-gray-900 text-sm">
            {tenureMonths > 0 ? `${tenureMonths}mo` : `${tenureDays}d`}
          </span>
        </div>
      </td>

      <td className="px-5 py-4 text-center">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          {customer.orders}
        </span>
      </td>

      <td className="px-5 py-4 text-right font-semibold text-gray-900">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.aov) || 0)}
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex flex-col items-end">
          <span className="font-bold text-primary">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.totalSpent) || 0)}
          </span>
          <span className="text-xs text-gray-500">
            {customer.orders > 0 ? `${customer.orders} orders` : 'No orders'}
          </span>
        </div>
      </td>

      <td className="px-5 py-4 text-gray-600 text-sm">
        {customer.lastOrder}
      </td>

      <td className="px-5 py-4 text-right">
        <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
          <ChevronRight size={18} />
        </button>
      </td>
    </tr>
  );
})}
```

---

### Step 4: Update Table Headers (10 min)

**Add new columns to thead**:

```jsx
<thead className="bg-gray-50/80 border-b border-gray-200">
  <tr>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Customer</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Segment</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Contact</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Location</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-center">Health</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-center">Tenure</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-center">Orders</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">AOV</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">LTV</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Last Order</th>
    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider"></th>
  </tr>
</thead>
```

---

## Testing Checklist

### Visual Tests
- [ ] CLV badges display with correct colors
- [ ] Churn risk dots show correct colors
- [ ] Health score bars render properly
- [ ] Zone labels display with zone colors
- [ ] All badges fit without overflow

### Grid View
- [ ] Cards maintain layout with new badges
- [ ] Hover states work
- [ ] Click opens modal
- [ ] Mobile responsive

### List View
- [ ] Table columns align properly
- [ ] New columns visible
- [ ] Horizontal scroll if needed
- [ ] Hover states work

---

## Success Criteria

- ✅ All 4 new indicators display
- ✅ Colors match segment/level
- ✅ Layout not broken
- ✅ Mobile responsive
- ✅ Performance no degradation

---

## Next Steps

After Phase 4:
- Proceed to Phase 5 (Tabs) OR Phase 6 (Modal)
- Recommendation: Do Phase 6 first (modal simpler)
