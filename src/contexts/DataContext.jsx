import React, { createContext, useContext, useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from "firebase/database";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [preOrders, setPreOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        const ordersRef = ref(database, 'orders');
        const preOrdersRef = ref(database, 'preorders');

        let ordersUnsubscribe;
        let preOrdersUnsubscribe;

        // Fetch Orders
        ordersUnsubscribe = onValue(ordersRef, (snapshot) => {
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
                    let total = 0;
                    if (orderData.cakes) {
                        total += orderData.cakes.reduce((sum, cake) => sum + (Number(cake.price || 0) * Number(cake.amount || 0)), 0);
                    }
                    total += Number(orderData.shipFee || 0);
                    total += Number(orderData.otherFee || 0);
                    total -= Number(orderData.discount || 0);

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
                            address: orderData.address || 'N/A',
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
                        const discount = Number(orderData.discount || 0);
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

        setLoading(false);

        return () => {
            if (ordersUnsubscribe) ordersUnsubscribe();
            if (preOrdersUnsubscribe) preOrdersUnsubscribe();
            if (customersUnsubscribe) customersUnsubscribe();
            if (productsUnsubscribe) productsUnsubscribe();
        };
    }, []);

    return (
        <DataContext.Provider value={{ orders, preOrders, customers, products, loading }}>
            {children}
        </DataContext.Provider>
    );
};
