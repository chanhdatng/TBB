import { format } from 'date-fns';

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Optional array of header labels
 * @returns {string} - CSV string
 */
const convertToCSV = (data, headers = null) => {
    if (!data || data.length === 0) return '';

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV content
    const csvRows = [];

    // Add headers
    csvRows.push(csvHeaders.join(','));

    // Add data rows
    data.forEach(row => {
        const values = csvHeaders.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in values
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Name of the file
 */
const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Export production metrics to CSV
 * @param {Object} productionMetrics - Production metrics object
 * @param {string} timeRange - Time range string
 * @param {Date} exportDate - Export date
 */
export const exportProductionMetrics = (productionMetrics, timeRange, exportDate = new Date()) => {
    if (!productionMetrics) return;

    const timestamp = format(exportDate, 'yyyy-MM-dd_HH-mm-ss');
    const filename = `production_metrics_${timeRange}_${timestamp}.csv`;

    // Prepare summary data
    const summaryData = [
        {
            Metric: 'Total Production',
            Value: productionMetrics.totalProduction || 0,
            TimeRange: timeRange,
            ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
        },
        {
            Metric: 'Today Production',
            Value: productionMetrics.summary?.today || 0,
            TimeRange: timeRange,
            ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
        },
        {
            Metric: 'Weekly Production',
            Value: productionMetrics.summary?.thisWeek || 0,
            TimeRange: timeRange,
            ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
        },
        {
            Metric: 'Monthly Production',
            Value: productionMetrics.summary?.thisMonth || 0,
            TimeRange: timeRange,
            ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
        },
        {
            Metric: 'Daily Average',
            Value: productionMetrics.summary?.averagePerDay || 0,
            TimeRange: timeRange,
            ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
        }
    ];

    const summaryCSV = convertToCSV(summaryData);

    // Prepare daily production data
    const dailyData = Object.entries(productionMetrics.dailyProduction || {}).map(([date, production]) => ({
        Date: date,
        Production: production,
        TimeRange: timeRange,
        ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
    }));

    const dailyCSV = dailyData.length > 0 ? convertToCSV(dailyData) : '';

    // Prepare time slot distribution data
    const timeSlotData = Object.entries(productionMetrics.timeSlotDistribution || {}).map(([timeSlot, count]) => ({
        TimeSlot: timeSlot,
        Count: count,
        TimeRange: timeRange,
        ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
    }));

    const timeSlotCSV = timeSlotData.length > 0 ? convertToCSV(timeSlotData) : '';

    // Combine all sections
    let fullCSV = '';

    fullCSV += 'PRODUCTION METRICS SUMMARY\n';
    fullCSV += summaryCSV;
    fullCSV += '\n\n';

    if (dailyCSV) {
        fullCSV += 'DAILY PRODUCTION\n';
        fullCSV += dailyCSV;
        fullCSV += '\n\n';
    }

    if (timeSlotCSV) {
        fullCSV += 'TIME SLOT DISTRIBUTION\n';
        fullCSV += timeSlotCSV;
        fullCSV += '\n\n';
    }

    downloadCSV(fullCSV, filename);
};

/**
 * Export product comparison data to CSV
 * @param {Object} productProduction - Product production data
 * @param {string} timeRange - Time range string
 * @param {Date} exportDate - Export date
 */
export const exportProductComparison = (productProduction, timeRange, exportDate = new Date()) => {
    if (!productProduction) return;

    const timestamp = format(exportDate, 'yyyy-MM-dd_HH-mm-ss');
    const filename = `product_comparison_${timeRange}_${timestamp}.csv`;

    // Prepare product data
    const productData = Object.entries(productProduction).map(([productName, data]) => ({
        ProductName: productName,
        TotalProduced: data.total || 0,
        Orders: data.orders || 0,
        AveragePerOrder: data.orders > 0 ? (data.total / data.orders).toFixed(2) : 0,
        TopTimeSlot: Object.entries(data.timeSlots || {})
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A',
        TimeRange: timeRange,
        ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
    }));

    const csv = convertToCSV(productData, [
        'ProductName',
        'TotalProduced',
        'Orders',
        'AveragePerOrder',
        'TopTimeSlot',
        'TimeRange',
        'ExportDate'
    ]);

    downloadCSV(csv, filename);
};

/**
 * Export time slot analysis to CSV
 * @param {Object} timeSlotAnalysis - Time slot analysis data
 * @param {string} timeRange - Time range string
 * @param {Date} exportDate - Export date
 */
export const exportTimeSlotAnalysis = (timeSlotAnalysis, timeRange, exportDate = new Date()) => {
    if (!timeSlotAnalysis) return;

    const timestamp = format(exportDate, 'yyyy-MM-dd_HH-mm-ss');
    const filename = `time_slot_analysis_${timeRange}_${timestamp}.csv`;

    // Prepare time slot data
    const slotData = Object.entries(timeSlotAnalysis).map(([timeSlot, data]) => {
        const topProduct = Object.entries(data.topProducts || {})[0];
        return {
            TimeSlot: timeSlot,
            TotalCakes: data.totalCakes || 0,
            OrderCount: data.orderCount || 0,
            UniqueTimeSlots: data.uniqueSlotCount || 0,
            TopProduct: topProduct?.[0] || 'N/A',
            TopProductCount: topProduct?.[1] || 0,
            TimeRange: timeRange,
            ExportDate: format(exportDate, 'yyyy-MM-dd HH:mm:ss')
        };
    });

    const csv = convertToCSV(slotData, [
        'TimeSlot',
        'TotalCakes',
        'OrderCount',
        'UniqueTimeSlots',
        'TopProduct',
        'TopProductCount',
        'TimeRange',
        'ExportDate'
    ]);

    downloadCSV(csv, filename);
};

/**
 * Export all analytics data to a single CSV file
 * @param {Object} analyticsData - Complete analytics data
 * @param {string} timeRange - Time range string
 * @param {Date} exportDate - Export date
 */
export const exportAllAnalytics = (analyticsData, timeRange, exportDate = new Date()) => {
    const timestamp = format(exportDate, 'yyyy-MM-dd_HH-mm-ss');
    const filename = `analytics_export_${timeRange}_${timestamp}.csv`;

    let fullCSV = '';

    // Production Summary
    if (analyticsData.productionMetrics) {
        fullCSV += 'PRODUCTION SUMMARY\n';
        const summaryData = [
            { Metric: 'Total Production', Value: analyticsData.productionMetrics.totalProduction || 0 },
            { Metric: 'Today Production', Value: analyticsData.productionMetrics.summary?.today || 0 },
            { Metric: 'Weekly Production', Value: analyticsData.productionMetrics.summary?.thisWeek || 0 },
            { Metric: 'Monthly Production', Value: analyticsData.productionMetrics.summary?.thisMonth || 0 }
        ];
        fullCSV += convertToCSV(summaryData);
        fullCSV += '\n\n';
    }

    // Product Comparison
    if (analyticsData.productProduction) {
        fullCSV += 'PRODUCT PRODUCTION\n';
        const productData = Object.entries(analyticsData.productProduction).map(([name, data]) => ({
            Product: name,
            Total: data.total || 0,
            Orders: data.orders || 0
        }));
        fullCSV += convertToCSV(productData);
        fullCSV += '\n\n';
    }

    // Time Slot Distribution
    if (analyticsData.timeSlotDistribution) {
        fullCSV += 'TIME SLOT DISTRIBUTION\n';
        const slotData = Object.entries(analyticsData.timeSlotDistribution).map(([slot, count]) => ({
            TimeSlot: slot,
            Count: count
        }));
        fullCSV += convertToCSV(slotData);
        fullCSV += '\n\n';
    }

    fullCSV += `Export Generated: ${format(exportDate, 'yyyy-MM-dd HH:mm:ss')}\n`;
    fullCSV += `Time Range: ${timeRange}\n`;

    downloadCSV(fullCSV, filename);
};