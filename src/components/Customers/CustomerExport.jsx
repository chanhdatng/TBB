import React from 'react';
import { Download } from 'lucide-react';

const CustomerExport = ({ customers }) => {
  // Sanitize cell value to prevent CSV injection attacks
  const sanitizeCell = (value) => {
    const cellStr = String(value);
    // Prevent CSV injection by escaping dangerous characters
    // Characters that can trigger formulas: = + - @ \t \r
    if (/^[=+\-@\t\r]/.test(cellStr)) {
      return `'${cellStr}`;  // Prefix with single quote to treat as text
    }
    return cellStr;
  };

  const exportToCSV = () => {
    // Headers with Vietnamese labels
    const headers = [
      'Tên', 'Số điện thoại', 'Email', 'Địa chỉ',
      'Số đơn', 'Tổng chi tiêu', 'AOV', 'CLV', 'CLV Segment',
      'RFM_R', 'RFM_F', 'RFM_M', 'RFM_Segment',
      'Health Score', 'Churn Risk', 'Loyalty Stage',
      'Trend %', 'Peak Day', 'Peak Hour', 'Avg Days Between Orders',
      'District', 'Zone', 'Cohort Month', 'Cohort Quarter'
    ];

    // Rows - map customer data to CSV format with sanitization
    const rows = customers.map(c => [
      sanitizeCell(c.name || ''),
      sanitizeCell(c.phone || ''),
      sanitizeCell(c.email || ''),
      sanitizeCell(c.address || ''),
      c.orders || 0,
      c.totalSpent || 0,
      c.aov || 0,
      c.clv || 0,
      sanitizeCell(c.clvSegment || ''),
      c.rfm?.R || 0,
      c.rfm?.F || 0,
      c.rfm?.M || 0,
      sanitizeCell(c.rfm?.segment || ''),
      c.healthScore || 0,
      sanitizeCell(c.churnRisk?.level || ''),
      sanitizeCell(c.loyaltyStage?.stage || ''),
      c.trend || 0,
      sanitizeCell(c.behavior?.peakDay || ''),
      sanitizeCell(c.behavior?.peakHour || ''),
      c.behavior?.avgDaysBetweenOrders || 0,
      sanitizeCell(c.location?.district || ''),
      sanitizeCell(c.location?.zone || ''),
      sanitizeCell(c.cohort?.monthly || ''),
      sanitizeCell(c.cohort?.quarterly || '')
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Handle cells with commas or newlines - wrap in quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob with UTF-8 BOM for proper Vietnamese character encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;

    // Trigger download
    link.click();

    // Clean up
    URL.revokeObjectURL(link.href);
  };

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
      title="Export filtered customers to CSV"
    >
      <Download size={18} />
      <span>Export CSV</span>
    </button>
  );
};

export default CustomerExport;
