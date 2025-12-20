import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { database } from '../firebase';
import { ref, onValue, query, orderByChild, startAt, endAt } from "firebase/database";
import { useData } from './DataContext';
import { useEmployees } from './EmployeeContext';

const StocksDataContext = createContext();

export const useStocksData = () => useContext(StocksDataContext);

export const StocksDataProvider = ({ children }) => {
    // Phase 3: Use shared data from DataContext and EmployeeContext
    const { products: allProducts } = useData();
    const { employees: allEmployees } = useEmployees();

    const [todayOrders, setTodayOrders] = useState([]);
    const [stocks, setStocks] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Phase 3: Filter active employees from shared data
    const activeEmployees = useMemo(() =>
        allEmployees.filter(emp => emp.status === 'active'),
        [allEmployees]
    );

    useEffect(() => {
        let loadedCount = 0;
        const totalCollections = 2; // orders, stocks (products and employees from shared contexts)

        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount >= totalCollections) {
                setLoading(false);
                console.log('✅ StocksDataContext: All data loaded (Phase 3: using shared products & employees)');
            }
        };

        // Fallback timeout
        const loadingTimeout = setTimeout(() => {
            console.warn('⚠️ StocksDataContext loading timeout - forcing loading to false');
            setLoading(false);
        }, 10000);

        // Phase 3: Products listener removed - using shared data from DataContext

        // 2. Fetch TODAY's Orders only (optimized query)
        const todayStr = formatLocalDate(new Date());

        // Calculate today's date range in CFAbsoluteTime
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Convert to CFAbsoluteTime (seconds since 2001-01-01)
        const cfTimeStart = (todayStart.getTime() / 1000) - 978307200;
        const cfTimeEnd = (todayEnd.getTime() / 1000) - 978307200;

        const ordersRef = ref(database, 'orders');
        // Query orders with orderDate (receive date) within today's range
        const todayOrdersQuery = query(
            ordersRef,
            orderByChild('orderDate'),
            startAt(cfTimeStart),
            endAt(cfTimeEnd)
        );

        const ordersUnsubscribe = onValue(todayOrdersQuery, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const ordersList = Object.keys(data).map(key => {
                    const orderData = data[key];
                    const orderDateObj = parseCFTime(orderData.orderDate);

                    // Parse Items
                    const items = orderData.cakes ? orderData.cakes.map(cake => ({
                        name: cake.name,
                        amount: cake.amount,
                        price: cake.price
                    })) : [];

                    // Map Status
                    let status = 'Pending';
                    const stateLower = (orderData.state || '').toLowerCase();
                    if (stateLower.includes('hoàn thành')) status = 'Completed';
                    else if (stateLower.includes('hủy')) status = 'Cancelled';
                    else status = 'Pending';

                    return {
                        id: key,
                        items: items,
                        date: formatLocalDate(orderDateObj),
                        status: status
                    };
                });
                setTodayOrders(ordersList);
                console.log(`✅ Loaded ${ordersList.length} orders for today (${todayStr})`);
            } else {
                setTodayOrders([]);
                console.log(`✅ No orders found for today (${todayStr})`);
            }
            checkAllLoaded();
        }, (err) => {
            console.error('❌ Error fetching today\'s orders:', err);
            setError(err.message);
            checkAllLoaded();
        });

        // Phase 3: Employees listener removed - using shared data from EmployeeContext (filtered to active)

        // 4. Fetch Stocks
        const stocksRef = ref(database, 'stocks');
        const stocksUnsubscribe = onValue(stocksRef, (snapshot) => {
            const data = snapshot.val() || {};
            setStocks(data);
            console.log(`✅ Loaded stocks for ${Object.keys(data).length} products`);
            checkAllLoaded();
        }, (err) => {
            console.error('❌ Error fetching stocks:', err);
            setError(err.message);
            checkAllLoaded();
        });

        return () => {
            clearTimeout(loadingTimeout);
            // Phase 3: products and employees unsubscribes removed
            if (ordersUnsubscribe) ordersUnsubscribe();
            if (stocksUnsubscribe) stocksUnsubscribe();
        };
    }, []);

    return (
        <StocksDataContext.Provider value={{
            products: allProducts, // Phase 3: From DataContext
            orders: todayOrders, // Only today's orders (kept - already optimized)
            activeEmployees, // Phase 3: From EmployeeContext, filtered
            stocks,
            loading,
            error
        }}>
            {children}
        </StocksDataContext.Provider>
    );
};
