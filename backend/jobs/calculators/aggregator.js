const { parseCFTime, getLastNDaysRange } = require('../utils/date-helpers');

/**
 * Aggregate order data by product
 */
function aggregateOrdersByProduct(orders, products) {
  const aggregated = {};

  // Initialize all products with zero values
  Object.keys(products).forEach(productId => {
    aggregated[productId] = {
      productId,
      name: products[productId].name,
      type: products[productId].type || '',
      price: products[productId].price,
      cost: products[productId].cost || 0,
      targetMargin: products[productId].targetMargin || 40,
      lifetime: {
        totalSold: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgOrderSize: 0,
        firstSoldAt: null,
        lastSoldAt: null
      },
      recent30Days: { sold: 0, orders: 0, revenue: 0, profit: 0, avgDaily: 0 },
      recent7Days: { sold: 0, orders: 0, revenue: 0, avgDaily: 0 },
      orderDates: [] // For trend calculation
    };
  });

  // Get date ranges
  const range30d = getLastNDaysRange(30);
  const range7d = getLastNDaysRange(7);

  // Aggregate orders
  Object.values(orders).forEach(order => {
    // Parse order date (delivery date)
    const orderDate = parseCFTime(order.orderDate);
    const orderTime = orderDate.getTime();

    // Skip cancelled orders
    if (order.state && order.state.toLowerCase().includes('hủy')) {
      return;
    }

    // Process each cake in the order
    const cakes = order.cakes || [];
    cakes.forEach(cake => {
      // Find matching product (normalize name for comparison)
      const productId = Object.keys(products).find(id =>
        products[id].name.toLowerCase() === cake.name.toLowerCase()
      );

      if (!productId || !aggregated[productId]) return;

      const product = aggregated[productId];

      // Input validation
      const quantity = Number(cake.amount) || 0;
      const price = Number(cake.price) || 0;

      // Skip invalid data
      if (quantity <= 0 || price < 0) return;

      const revenue = quantity * price;
      const profit = quantity * (price - product.cost);

      // Lifetime stats
      product.lifetime.totalSold += quantity;
      product.lifetime.totalOrders += 1;
      product.lifetime.totalRevenue += revenue;
      product.lifetime.totalProfit += profit;

      // Track dates
      product.orderDates.push(orderTime);

      if (!product.lifetime.firstSoldAt || orderTime < new Date(product.lifetime.firstSoldAt).getTime()) {
        product.lifetime.firstSoldAt = orderDate.toISOString();
      }
      if (!product.lifetime.lastSoldAt || orderTime > new Date(product.lifetime.lastSoldAt).getTime()) {
        product.lifetime.lastSoldAt = orderDate.toISOString();
      }

      // Recent 30 days
      if (orderTime >= range30d.start) {
        product.recent30Days.sold += quantity;
        product.recent30Days.orders += 1;
        product.recent30Days.revenue += revenue;
        product.recent30Days.profit += profit;
      }

      // Recent 7 days
      if (orderTime >= range7d.start) {
        product.recent7Days.sold += quantity;
        product.recent7Days.orders += 1;
        product.recent7Days.revenue += revenue;
      }
    });
  });

  // Calculate averages
  Object.values(aggregated).forEach(product => {
    if (product.lifetime.totalOrders > 0) {
      product.lifetime.avgOrderSize = product.lifetime.totalSold / product.lifetime.totalOrders;
    }
    product.recent30Days.avgDaily = product.recent30Days.sold / 30;
    product.recent7Days.avgDaily = product.recent7Days.sold / 7;
  });

  return aggregated;
}

module.exports = { aggregateOrdersByProduct };
