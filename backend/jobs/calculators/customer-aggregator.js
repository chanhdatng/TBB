/**
 * Customer Data Aggregator
 * Aggregates orders per customer and calculates basic metrics
 */

const logger = require('../utils/logger');

/**
 * Parse CFAbsoluteTime to JavaScript timestamp
 * CFAbsoluteTime = seconds since 2001-01-01 00:00:00 UTC
 * @param {number} cfTime - CFAbsoluteTime timestamp
 * @returns {number} JavaScript timestamp (milliseconds since 1970-01-01)
 */
function parseCFAbsoluteTime(cfTime) {
  if (cfTime == null || typeof cfTime !== 'number') {
    // CFAbsoluteTime epoch: 2001-01-01 00:00:00 UTC = 978307200 seconds since Unix epoch
    // Return epoch time instead of current time for invalid/zero input
    return 978307200000; // 2001-01-01 in milliseconds
  }
  // CFAbsoluteTime epoch: 2001-01-01 00:00:00 UTC = 978307200 seconds since Unix epoch
  const unixTimestamp = (cfTime + 978307200) * 1000;
  return unixTimestamp;
}

/**
 * Aggregate orders per customer
 * @param {Object} customers - All customers from Firebase (newCustomers)
 * @param {Object} orders - All orders from Firebase
 * @returns {Map} Map<phone, {customer, customerOrders, totalOrders, totalSpent, lastOrderTimestamp, aov, rawLastOrder, createdAt}>
 */
function aggregateCustomerData(customers, orders) {
  const customerMap = new Map();

  // Initialize customer map
  Object.entries(customers).forEach(([id, customer]) => {
    if (!customer.phone) {
      // Skip customers without phone number
      return;
    }

    // Parse customer creation timestamp
    const createdAt = customer.createdAt
      ? parseCFAbsoluteTime(customer.createdAt)
      : Date.now();

    customerMap.set(customer.phone, {
      ...customer,
      id,
      customerOrders: [],
      totalOrders: 0,
      totalSpent: 0,
      lastOrderTimestamp: 0,
      rawLastOrder: 0,
      aov: 0,
      createdAt,
      orders: 0 // Alias for totalOrders (used in some calculations)
    });
  });

  logger.info(`Initialized ${customerMap.size} customers with phone numbers`);

  // Aggregate orders
  let matchedOrders = 0;
  let unmatchedOrders = 0;

  Object.values(orders).forEach(order => {
    const phone = order.customer?.phone;

    if (!phone) {
      unmatchedOrders++;
      return;
    }

    if (!customerMap.has(phone)) {
      unmatchedOrders++;
      return;
    }

    const customer = customerMap.get(phone);
    customer.customerOrders.push(order);
    matchedOrders++;
  });

  logger.info(`Matched ${matchedOrders} orders, ${unmatchedOrders} unmatched`);

  // Calculate basic metrics for each customer
  customerMap.forEach((customer, phone) => {
    const orders = customer.customerOrders;
    customer.totalOrders = orders.length;
    customer.orders = orders.length; // Alias

    // Calculate total spent
    customer.totalSpent = orders.reduce((sum, order) => {
      const orderTotal = (order.cakes || []).reduce((s, item) => {
        const price = item.price || 0;
        const amount = item.amount || 0;
        return s + (price * amount);
      }, 0);
      return sum + orderTotal;
    }, 0);

    // Find last order timestamp
    if (orders.length > 0) {
      const sortedOrders = [...orders].sort((a, b) =>
        (b.orderDate || 0) - (a.orderDate || 0)
      );

      const lastOrder = sortedOrders[0];
      const lastOrderCFTime = lastOrder?.orderDate || 0;

      // Store both raw (for RFM calculation) and parsed timestamp
      customer.rawLastOrder = parseCFAbsoluteTime(lastOrderCFTime);
      customer.lastOrderTimestamp = lastOrderCFTime;
    }

    // Calculate average order value
    customer.aov = customer.totalOrders > 0
      ? Math.round(customer.totalSpent / customer.totalOrders)
      : 0;
  });

  logger.info(`Calculated basic metrics for ${customerMap.size} customers`);

  return customerMap;
}

module.exports = { aggregateCustomerData, parseCFAbsoluteTime };
