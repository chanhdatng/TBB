const { getYesterdayRange, getCurrentMonth, parseCFTime } = require('../utils/date-helpers');

/**
 * Write yesterday's sales data to time-series
 */
async function writeTimeSeries(db, orders, products) {
  const yesterday = getYesterdayRange();
  const currentMonth = getCurrentMonth();

  const dailyData = {};

  // Initialize all products
  Object.keys(products).forEach(productId => {
    dailyData[productId] = { s: 0, r: 0, o: 0 };
  });

  // Aggregate yesterday's orders
  Object.values(orders).forEach(order => {
    const orderDate = parseCFTime(order.orderDate);
    const orderTime = orderDate.getTime();

    // Only process yesterday's orders
    if (orderTime < yesterday.start || orderTime > yesterday.end) {
      return;
    }

    // Skip cancelled
    if (order.state && order.state.toLowerCase().includes('hủy')) {
      return;
    }

    const cakes = order.cakes || [];
    cakes.forEach(cake => {
      const productId = Object.keys(products).find(id =>
        products[id].name.toLowerCase() === cake.name.toLowerCase()
      );

      if (!productId || !dailyData[productId]) return;

      const quantity = Number(cake.amount) || 0;
      const revenue = quantity * Number(cake.price || 0);

      dailyData[productId].s += quantity;
      dailyData[productId].r += revenue;
      dailyData[productId].o += 1;
    });
  });

  // Write to Firebase
  const timeSeriesRef = db.ref('productTimeSeries');
  const dayOfMonth = yesterday.dateStr.split('-')[2]; // "08" from "2025-12-08"

  // Batch read all existing months to avoid N+1 queries
  const existingMonthsSnapshot = await timeSeriesRef.once('value');
  const existingMonths = existingMonthsSnapshot.val() || {};

  const updates = {};

  for (const [productId, data] of Object.entries(dailyData)) {
    const monthPath = `productTimeSeries/${productId}/${currentMonth}`;
    updates[`${monthPath}/daily/${dayOfMonth}`] = data;
    updates[`${monthPath}/lastUpdated`] = Date.now();

    // Check if month structure exists in batched data
    const monthExists = existingMonths[productId]?.[currentMonth];

    if (!monthExists) {
      updates[`${monthPath}/productId`] = productId;
      updates[`${monthPath}/month`] = currentMonth;
      updates[`${monthPath}/year`] = parseInt(currentMonth.split('-')[0]);

      // Initialize all days in month
      const year = parseInt(currentMonth.split('-')[0]);
      const month = parseInt(currentMonth.split('-')[1]);
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day.toString().padStart(2, '0');
        if (!updates[`${monthPath}/daily/${dayStr}`]) {
          updates[`${monthPath}/daily/${dayStr}`] = { s: 0, r: 0, o: 0 };
        }
      }

      // Initialize month totals
      updates[`${monthPath}/monthTotal`] = { sold: 0, revenue: 0, orders: 0, avgDaily: 0 };
    }
  }

  try {
    await db.ref().update(updates);
  } catch (error) {
    throw new Error(`Failed to write time-series: ${error.message}`);
  }

  return { date: yesterday.dateStr, productsUpdated: Object.keys(dailyData).length };
}

module.exports = { writeTimeSeries };
