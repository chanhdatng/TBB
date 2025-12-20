import { startOfDay, subDays, subWeeks, subMonths, isWithinInterval, parseISO } from 'date-fns';

/**
 * Safe date parsing helper
 * @param {string|Date|number} dateValue - Date value to parse
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
const safeParseDate = (dateValue) => {
    if (!dateValue) return null;

    try {
        // If it's already a Date object
        if (dateValue instanceof Date) {
            return isNaN(dateValue.getTime()) ? null : dateValue;
        }

        // If it's a number (timestamp)
        if (typeof dateValue === 'number') {
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? null : date;
        }

        // If it's a string
        if (typeof dateValue === 'string') {
            // Try parseISO first for YYYY-MM-DD format
            if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
                const date = parseISO(dateValue);
                return isNaN(date.getTime()) ? null : date;
            }

            // Fallback to regular Date constructor
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? null : date;
        }

        return null;
    } catch (error) {
        console.warn('Date parsing error:', error, 'for value:', dateValue);
        return null;
    }
};

/**
 * Parse various time slot formats into a normalized format
 * @param {string} timeSlot - Time slot string (e.g., "10:00-12:00", "10:00 - 12:00")
 * @returns {Object} - Normalized time slot object { start: "10:00", end: "12:00", label: "10:00-12:00" }
 */
export const parseTimeSlot = (timeSlot) => {
    if (!timeSlot || typeof timeSlot !== 'string') {
        return { start: null, end: null, label: 'Unknown' };
    }

    try {
        // Normalize the string - remove spaces and convert to lowercase
        const normalized = timeSlot.replace(/\s+/g, '').toLowerCase();

        // Match patterns like "10:00-12:00" or "10:00am-12:00pm"
        const match = normalized.match(/^(\d{1,2}:?\d{0,2})(?:am|pm)?[-–](\d{1,2}:?\d{0,2})(?:am|pm)?$/);

        if (match) {
            let [_, start, end] = match;

            // Normalize times
            start = start.includes(':') ? start : `${start}:00`;
            end = end.includes(':') ? end : `${end}:00`;

            // Ensure proper format
            start = start.padStart(5, '0');
            end = end.padStart(5, '0');

            return {
                start,
                end,
                label: `${start}-${end}`
            };
        }

        // Fallback for single times or other formats
        const singleTimeMatch = normalized.match(/^(\d{1,2}:?\d{0,2})/);
        if (singleTimeMatch) {
            let time = singleTimeMatch[1];
            time = time.includes(':') ? time : `${time}:00`;
            time = time.padStart(5, '0');
            return {
                start: time,
                end: null,
                label: time
            };
        }

        return { start: null, end: null, label: 'Unknown' };
    } catch (error) {
        console.warn('TimeSlot parsing error:', error, 'for value:', timeSlot);
        return { start: null, end: null, label: 'Unknown' };
    }
};

/**
 * Group time slots into broader categories
 * @param {Object} timeSlot - Time slot object from parseTimeSlot
 * @returns {string} - Time slot category
 */
export const categorizeTimeSlot = (timeSlot) => {
    if (!timeSlot.start) return 'Unknown';

    const hour = parseInt(timeSlot.start.split(':')[0]);

    if (hour >= 6 && hour < 9) return 'Early Morning (6-9)';
    if (hour >= 9 && hour < 12) return 'Morning (9-12)';
    if (hour >= 12 && hour < 15) return 'Afternoon (12-15)';
    if (hour >= 15 && hour < 18) return 'Late Afternoon (15-18)';
    if (hour >= 18 && hour < 21) return 'Evening (18-21)';
    if (hour >= 21 || hour < 6) return 'Night (21-6)';

    return 'Unknown';
};

/**
 * Calculate production metrics from orders
 * @param {Array} orders - Array of order objects
 * @param {string} timeRange - '7d', '30d', or 'lifetime'
 * @returns {Object} - Production metrics
 */
export const createProductionMetrics = (orders, timeRange = '7d') => {
    // Early return for empty data
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        return {
            totalProduction: 0,
            dailyProduction: {},
            timeSlotDistribution: {},
            productProduction: {},
            summary: {
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                averagePerDay: 0
            }
        };
    }

    const now = new Date();
    let startDate;

    // Calculate start date based on time range
    switch (timeRange) {
        case '7d':
            startDate = subDays(now, 7);
            break;
        case '30d':
            startDate = subDays(now, 30);
            break;
        case 'lifetime':
            startDate = new Date(0); // Beginning of time
            break;
        default:
            startDate = subDays(now, 7);
    }

    // Filter orders within time range using safe date parsing
    const filteredOrders = orders.filter(order => {
        if (!order.date) return false;
        const orderDate = safeParseDate(order.date);
        if (!orderDate) return false;
        return isWithinInterval(orderDate, { start: startDate, end: now });
    });

    const dailyProduction = {};
    const timeSlotDistribution = {};
    const productProduction = {};
    let totalProduction = 0;

    // Process each order
    filteredOrders.forEach(order => {
        // Process each cake in the order
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const productName = item.name || 'Unknown';
                const quantity = parseInt(item.amount) || 1;

                // Update daily production
                if (order.date) {
                    if (!dailyProduction[order.date]) {
                        dailyProduction[order.date] = 0;
                    }
                    dailyProduction[order.date] += quantity;
                }

                // Update product production
                if (!productProduction[productName]) {
                    productProduction[productName] = {
                        total: 0,
                        orders: 0,
                        timeSlots: {}
                    };
                }
                productProduction[productName].total += quantity;
                productProduction[productName].orders += 1;

                // Update time slot distribution
                const timeSlot = parseTimeSlot(order.timeline?.received?.time || order.deliveryTimeSlot);
                const timeSlotCategory = categorizeTimeSlot(timeSlot);

                if (!timeSlotDistribution[timeSlotCategory]) {
                    timeSlotDistribution[timeSlotCategory] = 0;
                }
                timeSlotDistribution[timeSlotCategory] += quantity;

                // Track time slots per product
                if (!productProduction[productName].timeSlots[timeSlotCategory]) {
                    productProduction[productName].timeSlots[timeSlotCategory] = 0;
                }
                productProduction[productName].timeSlots[timeSlotCategory] += quantity;

                totalProduction += quantity;
            });
        }
    });

    // Calculate summary metrics
    const today = formatLocalDate(now);
    const todayProduction = dailyProduction[today] || 0;

    const weekStart = startOfDay(subDays(now, now.getDay()));
    const thisWeekProduction = Object.entries(dailyProduction)
        .filter(([date]) => {
            const dateObj = parseISO(date);
            return isWithinInterval(dateObj, { start: weekStart, end: now });
        })
        .reduce((sum, [, production]) => sum + production, 0);

    const monthStart = startOfDay(subDays(now, now.getDate() - 1));
    const thisMonthProduction = Object.entries(dailyProduction)
        .filter(([date]) => {
            const dateObj = parseISO(date);
            return isWithinInterval(dateObj, { start: monthStart, end: now });
        })
        .reduce((sum, [, production]) => sum + production, 0);

    const daysWithProduction = Object.keys(dailyProduction).length;
    const averagePerDay = daysWithProduction > 0 ? Math.round(totalProduction / daysWithProduction) : 0;

    return {
        totalProduction,
        dailyProduction,
        timeSlotDistribution,
        productProduction,
        summary: {
            today: todayProduction,
            thisWeek: thisWeekProduction,
            thisMonth: thisMonthProduction,
            averagePerDay
        }
    };
};

/**
 * Calculate daily production for the last N days
 * @param {Array} orders - Array of order objects
 * @param {number} days - Number of days to calculate
 * @returns {Array} - Array of daily production data
 */
export const calculateDailyProduction = (orders, days = 7) => {
    const dailyData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = formatLocalDate(subDays(now, i));
        dailyData.push({
            date,
            production: 0,
            sold: 0
        });
    }

    // Calculate production from orders
    orders.forEach(order => {
        if (order.date && order.items) {
            const dayIndex = dailyData.findIndex(d => d.date === order.date);
            if (dayIndex !== -1) {
                order.items.forEach(item => {
                    const quantity = parseInt(item.amount) || 1;
                    dailyData[dayIndex].production += quantity;
                    dailyData[dayIndex].sold += quantity; // For now, production = sold
                });
            }
        }
    });

    return dailyData;
};

/**
 * Analyze time slot distribution
 * @param {Array} orders - Array of order objects
 * @returns {Object} - Time slot analysis
 */
export const analyzeTimeSlots = (orders) => {
    const timeSlotAnalysis = {};
    const timeSlotOrderCount = {};

    orders.forEach(order => {
        const timeSlot = parseTimeSlot(order.timeline?.received?.time || order.deliveryTimeSlot);
        const category = categorizeTimeSlot(timeSlot);

        // Initialize if not exists
        if (!timeSlotAnalysis[category]) {
            timeSlotAnalysis[category] = {
                totalCakes: 0,
                orderCount: 0,
                topProducts: {},
                uniqueSlots: new Set()
            };
        }

        // Count cakes and orders
        if (order.items) {
            order.items.forEach(item => {
                const quantity = parseInt(item.amount) || 1;
                timeSlotAnalysis[category].totalCakes += quantity;

                // Track products
                const productName = item.name || 'Unknown';
                if (!timeSlotAnalysis[category].topProducts[productName]) {
                    timeSlotAnalysis[category].topProducts[productName] = 0;
                }
                timeSlotAnalysis[category].topProducts[productName] += quantity;
            });
        }

        timeSlotAnalysis[category].orderCount += 1;
        timeSlotAnalysis[category].uniqueSlots.add(timeSlot.label);
    });

    // Convert Sets to counts and sort top products
    Object.keys(timeSlotAnalysis).forEach(category => {
        timeSlotAnalysis[category].uniqueSlotCount = timeSlotAnalysis[category].uniqueSlots.size;
        delete timeSlotAnalysis[category].uniqueSlots;

        // Sort and limit top products
        const sortedProducts = Object.entries(timeSlotAnalysis[category].topProducts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        timeSlotAnalysis[category].topProducts = Object.fromEntries(sortedProducts);
    });

    return timeSlotAnalysis;
};

/**
 * Calculate growth rates between current and previous period
 * @param {Object} current - Current period metrics
 * @param {Object} previous - Previous period metrics
 * @returns {Object} - Growth rates
 */
export const calculateGrowthRates = (current, previous) => {
    const growth = {};

    // Calculate growth for each metric
    const metrics = ['totalProduction', 'today', 'thisWeek', 'thisMonth'];

    metrics.forEach(metric => {
        const currentValue = current[metric] || 0;
        const previousValue = previous[metric] || 0;

        if (previousValue === 0) {
            growth[metric] = currentValue > 0 ? 100 : 0;
        } else {
            growth[metric] = ((currentValue - previousValue) / previousValue * 100);
        }
    });

    return growth;
};

/**
 * Format date as YYYY-MM-DD in local time
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get previous period data for comparison
 * @param {Array} orders - Array of order objects
 * @param {string} timeRange - '7d' or '30d'
 * @returns {Object} - Previous period metrics
 */
export const getPreviousPeriodData = (orders, timeRange) => {
    const now = new Date();
    let daysOffset = 0;
    let periodDays = 0;

    if (timeRange === '7d') {
        daysOffset = 7;
        periodDays = 7;
    } else if (timeRange === '30d') {
        daysOffset = 30;
        periodDays = 30;
    }

    // Get dates for previous period
    const startDate = subDays(now, daysOffset + periodDays);
    const endDate = subDays(now, daysOffset);

    // Filter orders for previous period
    const previousPeriodOrders = orders.filter(order => {
        if (!order.date) return false;
        try {
            const orderDate = parseISO(order.date);
            return isWithinInterval(orderDate, { start: startDate, end: endDate });
        } catch {
            return false;
        }
    });

    return createProductionMetrics(previousPeriodOrders, `${periodDays}d`);
};