const { getFirebaseServices } = require('../middleware/firebase-auth');
const logger = require('./utils/logger');

/**
 * Order Listener
 * replaces Cloud Function updateCustomerOrderTracking
 * Listens for new orders in Realtime Database and updates customer tracking
 */
async function initOrderListener() {
    try {
        const { rtdb } = getFirebaseServices();
        const ordersRef = rtdb.ref('orders');

        // Get current time in CFAbsoluteTime (seconds since 2001-01-01)
        const startTimeCF = (Date.now() - 978307200000) / 1000;

        console.log(`[OrderListener] Starting listener at CF Time: ${startTimeCF}`);

        // We listen for children added starting from now to avoid processing historical data on restart
        // Note: There's a small race condition if an order is added exactly when the server starts, 
        // but for this use case it's acceptable.
        ordersRef.orderByChild('createDate').startAt(startTimeCF).on('child_added', async (snapshot) => {
            const orderId = snapshot.key;
            const orderData = snapshot.val();

            // Skip if no order data
            if (!orderData) return;

            // Extract customer phone
            const customerPhone = orderData.customerPhone || (orderData.customer && orderData.customer.phone);
            if (!customerPhone) return;

            try {
                const customerRef = rtdb.ref(`newCustomers/${customerPhone}`);
                const customerSnapshot = await customerRef.once('value');

                const updates = {};
                updates.lastOrderId = orderId;

                if (!customerSnapshot.exists()) {
                    // Create new customer if not exists
                    const newCustomer = {
                        id: orderData.customer?.id || `cust_${Date.now()}`,
                        name: orderData.customer?.name || "Unknown",
                        phone: customerPhone,
                        address: orderData.customer?.address || orderData.address || "",
                        createDate: orderData.createDate || Math.floor(Date.now() / 1000),
                        lastOrderId: orderId,
                        socialLink: orderData.customer?.socialLink || ""
                    };
                    
                    await customerRef.set(newCustomer);
                    console.log(`- Added a new order of '${newCustomer.name}', updated lastOrderID of ${customerPhone}`);
                } else {
                    // Update existing customer
                    const customer = customerSnapshot.val();
                    
                    // Legacy support for firstOrderId
                    if (!customer.firstOrderId && !customer.firstOrderID) {
                        updates.firstOrderId = orderId;
                    }

                    await customerRef.update(updates);
                    console.log(`- Added a new order of '${customer.name}', updated lastOrderID of ${customerPhone}`);
                }
            } catch (error) {
                console.error(`[OrderListener] Error processing order ${orderId}:`, error);
            }
        });

        logger.info('🛰️ Order Listener active (replacing Cloud Function)');
    } catch (error) {
        console.error('❌ Failed to initialize Order Listener:', error.message);
    }
}

module.exports = { initOrderListener };
