# Phase 7: CSV Export Functionality

**Duration**: 2-3 hours | **Complexity**: Low-Medium | **Priority**: 🟢 Nice-to-have

---

## Overview

Add "Export CSV" button that downloads all customer data with 20+ metrics.

---

## New File: CustomerExport.jsx

**Location**: `src/components/Customers/CustomerExport.jsx`

```javascript
import React from 'react';
import { Download } from 'lucide-react';

const CustomerExport = ({ customers }) => {
  const exportToCSV = () => {
    // Headers
    const headers = [
      'Tên', 'Số điện thoại', 'Email', 'Địa chỉ',
      'Số đơn', 'Tổng chi tiêu', 'AOV', 'CLV', 'CLV Segment',
      'RFM_R', 'RFM_F', 'RFM_M', 'RFM_Segment',
      'Health Score', 'Churn Risk', 'Loyalty Stage',
      'Trend %', 'Peak Day', 'Peak Hour', 'Avg Days Between Orders',
      'District', 'Zone', 'Cohort Month', 'Cohort Quarter'
    ];

    // Rows
    const rows = customers.map(c => [
      c.name || '',
      c.phone || '',
      c.email || '',
      c.address || '',
      c.orders || 0,
      c.totalSpent || 0,
      c.aov || 0,
      c.clv || 0,
      c.clvSegment || '',
      c.rfm?.R || 0,
      c.rfm?.F || 0,
      c.rfm?.M || 0,
      c.rfm?.segment || '',
      c.healthScore || 0,
      c.churnRisk?.level || '',
      c.loyaltyStage?.stage || '',
      c.trend || 0,
      c.behavior?.peakDay || '',
      c.behavior?.peakHour || '',
      c.behavior?.avgDaysBetweenOrders || 0,
      c.location?.district || '',
      c.location?.zone || '',
      c.cohort?.monthly || '',
      c.cohort?.quarterly || ''
    ]);

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',')
          ? `"${cell}"`
          : cell
      ).join(','))
    ].join('\n');

    // Download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
    >
      <Download size={18} />
      <span>Export CSV</span>
    </button>
  );
};

export default CustomerExport;
```

---

## Modify Customers.jsx

**Add import**:
```javascript
import CustomerExport from '../components/Customers/CustomerExport';
```

**Add button near view toggle**:
```jsx
<div className="flex items-center gap-4">
  <CustomerExport customers={filteredCustomers} />
  {/* Existing view toggle buttons */}
</div>
```

---

## Features

- Export filtered customers (not all)
- 24 columns of data
- UTF-8 BOM for Vietnamese characters
- Filename with date
- Handles commas in text fields

---

## Testing

- [ ] CSV downloads
- [ ] All columns present
- [ ] Vietnamese characters OK
- [ ] Commas in address don't break format
- [ ] Opens in Excel/Google Sheets correctly

---

## Success Criteria

✅ Export button visible
✅ CSV downloads with correct data
✅ All 24 columns included
✅ Vietnamese text displays correctly
