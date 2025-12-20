import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { database } from '../firebase';
import { ref, onValue, get, query, orderByChild, startAt } from "firebase/database";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [preOrders, setPreOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Analytics State (Phase 4)
    const [productAnalytics, setProductAnalytics] = useState({});
    const [globalRankings, setGlobalRankings] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // Customer Analytics State (Phase 2)
    const [customerMetrics, setCustomerMetrics] = useState({});
    const [customerMetricsLoading, setCustomerMetricsLoading] = useState(true);

    // OrderCounts Metadata (Phase 4)
    const [orderCounts, setOrderCounts] = useState({});

    // Helper to format date as YYYY-MM-DD in local time
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper to parse CFAbsoluteTime
    const parseCFTime = (timestamp) => {
        return new Date((timestamp + 978307200) * 1000);
    };

    /**
     * Calculate timestamp for 90 days ago in CFAbsoluteTime format
     * CFAbsoluteTime = seconds since 2001-01-01 00:00:00 UTC
     * Fixed: Use UTC to avoid timezone offset issues (Phase 1 critical fix)
     */
    const getLast90DaysTimestamp = () => {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - 90);
        date.setUTCHours(0, 0, 0, 0);

        // Convert JavaScript timestamp (ms since 1970) to CFAbsoluteTime
        const jsTimestamp = date.getTime(); // milliseconds
        const cfAbsoluteTime = (jsTimestamp / 1000) - 978307200; // seconds since 2001

        return cfAbsoluteTime;
    };

    useEffect(() => {
        // Fallback timeout - if Firebase doesn't respond in 10 seconds, stop loading anyway
        const loadingTimeout = setTimeout(() => {
            console.warn('⚠️ Firebase loading timeout - forcing loading states to false');
            setLoading(false);
            setAnalyticsLoading(false);
            setCustomerMetricsLoading(false);
        }, 10000);

        const preOrdersRef = ref(database, 'preorders');

        let ordersUnsubscribe;
        let preOrdersUnsubscribe;

        // Fetch Orders (Limited to last 90 days for bandwidth optimization)
        const cfTime90Days = getLast90DaysTimestamp();
        const ordersQuery = query(
            ref(database, 'orders'),
            orderByChild('orderDate'),
            startAt(cfTime90Days)
        );

        ordersUnsubscribe = onValue(ordersQuery, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const ordersList = Object.keys(data).map(key => {
                    const orderData = data[key];

                    // Parse Dates
                    const orderDateObj = parseCFTime(orderData.orderDate); // Receive Date
                    const createDateObj = parseCFTime(orderData.createDate); // Order Date

                    const receiveDate = orderDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    // Use deliveryTimeSlot if available, otherwise format the time from timestamp
                    const receiveTime = orderData.deliveryTimeSlot || orderDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

                    const createDate = createDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const createTime = createDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                    // Parse Items
                    const items = orderData.cakes ? orderData.cakes.map(cake => ({
                        name: cake.name,
                        amount: cake.amount,
                        price: cake.price
                    })) : [];

                    // Calculate Price
                    const subtotal = orderData.cakes ? orderData.cakes.reduce((sum, cake) => sum + (Number(cake.price || 0) * Number(cake.amount || 0)), 0) : 0;
                    let total = subtotal;
                    total += Number(orderData.shipFee || 0);
                    total += Number(orderData.otherFee || 0);
                    
                    const discountVal = Number(orderData.discount || 0);
                    const discountAmount = discountVal <= 100 ? (subtotal * discountVal) / 100 : discountVal;
                    total -= discountAmount;

                    // Map Status (Loose matching)
                    let status = 'Pending';
                    const stateLower = (orderData.state || '').toLowerCase();
                    if (stateLower.includes('hoàn thành')) status = 'Completed';
                    else if (stateLower.includes('hủy')) status = 'Cancelled';
                    else status = 'Pending';

                    return {
                        id: key,
                        customer: {
                            name: orderData.customer?.name || 'Unknown',
                            phone: orderData.customer?.phone || orderData.customerPhone || 'N/A',
                            address: orderData.address || orderData.customer?.address || 'N/A',
                            socialLink: orderData.customer?.socialLink || ''
                        },
                        items: items,
                        timeline: {
                            ordered: { date: createDate, time: createTime },
                            received: { date: receiveDate, time: receiveTime, raw: orderDateObj }
                        },
                        date: formatLocalDate(orderDateObj), // Store as YYYY-MM-DD (Local Time) for filtering
                        rawPrice: total,
                        price: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total),
                        status: status,
                        originalData: orderData
                    };
                });
                setOrders(ordersList);
            } else {
                setOrders([]);
            }
        });

        // Fetch PreOrders
        preOrdersUnsubscribe = onValue(preOrdersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const preOrdersList = Object.keys(data).map(key => {
                    const orderData = data[key];
                    if (!orderData || typeof orderData !== 'object') return null;

                    // Map 'cakes' to 'items' and handle object/array structure
                    let items = orderData.cakes || orderData.items || [];
                    if (items && typeof items === 'object' && !Array.isArray(items)) {
                        items = Object.values(items);
                    }

                    // Calculate total if not present
                    let total = Number(orderData.total || 0);
                    if (!total && items.length > 0) {
                        const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.amount || 0)), 0);
                        const shipFee = Number(orderData.shipFee || 0);
                        const otherFee = Number(orderData.otherFee || 0);
                        const discountVal = Number(orderData.discount || 0);
                        const discount = discountVal <= 100 ? (subtotal * discountVal) / 100 : discountVal;
                        total = subtotal + shipFee + otherFee - discount;
                    }

                    // Format total as currency string
                    const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total || 0);

                    // Parse Date for filtering (assuming deliveryDate is YYYY-MM-DD)
                    // If deliveryDate is missing, fallback to createDate
                    let filterDate = '';
                    if (orderData.deliveryDate) {
                        filterDate = orderData.deliveryDate;
                    } else if (orderData.createDate) {
                        filterDate = formatLocalDate(new Date(orderData.createDate * 1000));
                    }

                    return {
                        id: key,
                        ...orderData,
                        items: items,
                        status: orderData.state || orderData.status || 'pending',
                        date: orderData.deliveryDate ? `${orderData.deliveryDate} ${orderData.deliveryTime || ''}` : new Date(orderData.createDate * 1000).toLocaleDateString('vi-VN'),
                        time: orderData.deliveryTime || 'Anytime',
                        filterDate: filterDate, // Used for date filtering
                        total: formattedTotal,
                        rawTotal: total // Keep raw number for sorting/calculations if needed
                    };
                }).filter(item => item !== null);
                setPreOrders(preOrdersList.reverse());
            } else {
                setPreOrders([]);
            }
        });

        // Fetch Customers
        const customersRef = ref(database, 'newCustomers');
        let customersUnsubscribe;
        customersUnsubscribe = onValue(customersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const customersList = Object.keys(data).map(key => {
                    const customerData = data[key];
                    // Assuming createDate is a CFAbsoluteTime or similar timestamp
                    // If it's standard unix timestamp (seconds), multiply by 1000
                    // If it's CFAbsoluteTime, use parseCFTime

                    // Trying to detect timestamp type or default to Date.now() if missing
                    let createdDateObj = new Date();
                    if (customerData.createDate) {
                        // Heuristic: Small numbers are likely CFAbsoluteTime (seconds since 2001)
                        // Large numbers are likely Unix timestamp (ms since 1970)
                        if (customerData.createDate < 2000000000) {
                            createdDateObj = parseCFTime(customerData.createDate);
                        } else {
                            createdDateObj = new Date(customerData.createDate);
                        }
                    }

                    return {
                        id: key,
                        ...customerData,
                        createdAt: createdDateObj
                    };
                });
                setCustomers(customersList);
            } else {
                setCustomers([]);
            }
        });

        // Fetch Products
        const productsRef = ref(database, 'cakes');
        let productsUnsubscribe;
        productsUnsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // If products is an array or object
                const productsList = Object.keys(data).map(key => {
                    const product = data[key];
                    return {
                        id: key,
                        ...product
                    };
                });
                setProducts(productsList);
            } else {
                setProducts([]);
            }
        });

        // Analytics converted to pull-based (Phase 2) - no more real-time listeners
        // Fetch functions defined below, called on mount

        setLoading(false);

        return () => {
            clearTimeout(loadingTimeout);
            if (ordersUnsubscribe) ordersUnsubscribe();
            if (preOrdersUnsubscribe) preOrdersUnsubscribe();
            if (customersUnsubscribe) customersUnsubscribe();
            if (productsUnsubscribe) productsUnsubscribe();
            // Analytics listeners removed - using fetch instead (Phase 2)
        };
    }, []);

    // Fetch Product Analytics (Phase 2: Pull-based)
    const fetchProductAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const snapshot = await get(ref(database, 'productAnalytics'));
            setProductAnalytics(snapshot.val() || {});
            console.log('✅ Loaded product analytics on-demand');
        } catch (error) {
            console.error('❌ Error fetching productAnalytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    // Fetch Global Rankings (Phase 2: Pull-based)
    const fetchGlobalRankings = useCallback(async () => {
        try {
            const snapshot = await get(ref(database, 'globalRankings/current'));
            setGlobalRankings(snapshot.val());
            console.log('✅ Loaded global rankings on-demand');
        } catch (error) {
            console.error('❌ Error fetching globalRankings:', error);
        }
    }, []);

    // Fetch Customer Metrics (Phase 2: Pull-based)
    const fetchCustomerMetrics = useCallback(async () => {
        setCustomerMetricsLoading(true);
        try {
            const snapshot = await get(ref(database, 'customerMetrics'));
            const data = snapshot.val();
            setCustomerMetrics(data || {});
            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Loaded metrics for ${Object.keys(data || {}).length} customers on-demand`);
            }
        } catch (error) {
            console.error('❌ Error fetching customerMetrics:', error);
        } finally {
            setCustomerMetricsLoading(false);
        }
    }, []);

    // Fetch OrderCounts metadata (Phase 4)
    const fetchOrderCounts = useCallback(async () => {
        try {
            const snapshot = await get(ref(database, 'metadata/orderCounts'));
            setOrderCounts(snapshot.val() || {});
            console.log('✅ Loaded orderCounts metadata');
        } catch (error) {
            console.error('❌ Error fetching orderCounts:', error);
        }
    }, []);

    // Call analytics fetch functions once on mount (Phase 2 + Phase 4)
    // Empty deps array - run only once, preventing potential infinite loop
    useEffect(() => {
        fetchProductAnalytics();
        fetchGlobalRankings();
        fetchCustomerMetrics();
        fetchOrderCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Analytics Helper Functions (Phase 4)
    const getProductAnalytics = (productId) => {
        return productAnalytics[productId] || null;
    };

    const getTopSellers = (limit = 10) => {
        return globalRankings?.topSellers?.slice(0, limit) || [];
    };

    const getSlowMovers = (limit = 10) => {
        return globalRankings?.slowMovers?.slice(0, limit) || [];
    };

    const getTrending = (limit = 10) => {
        return globalRankings?.trending?.slice(0, limit) || [];
    };

    const getTopRevenue = (limit = 10) => {
        return globalRankings?.topRevenue?.slice(0, limit) || [];
    };

    return (
        <DataContext.Provider value={{
            // Existing data
            orders, preOrders, customers, products, loading,
            // Analytics data (Phase 4)
            productAnalytics,
            globalRankings,
            analyticsLoading,
            // Customer analytics data (Phase 2)
            customerMetrics,
            customerMetricsLoading,
            // OrderCounts metadata (Phase 4)
            orderCounts,
            // Analytics helpers (Phase 4)
            getProductAnalytics,
            getTopSellers,
            getSlowMovers,
            getTrending,
            getTopRevenue,
            // Analytics fetch functions (Phase 2: Pull-based)
            fetchCustomerMetrics,
            fetchProductAnalytics,
            fetchGlobalRankings,
            fetchOrderCounts
        }}>
            {children}
        </DataContext.Provider>
    );
};
