import React, { useMemo, useState } from 'react';
import StatsCard from '../components/Dashboard/StatsCard';
import RevenueChart from '../components/Dashboard/RevenueChart';
import RecentOrders from '../components/Dashboard/RecentOrders';
import PasswordModal from '../components/Common/PasswordModal';
import ProductStatsCard from '../components/Dashboard/ProductStatsCard';
import { Wallet, PiggyBank, TrendingUp, Plus, MoreHorizontal, ShoppingBag, Eye, EyeOff, Users, Award, Globe } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Dashboard = () => {
    const { orders, customers } = useData(); // Destructure customers
    const [isRevenueVisible, setIsRevenueVisible] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [timeRange, setTimeRange] = useState('month'); // 'day', 'week', 'month', 'year'
    const [chartTimeRange, setChartTimeRange] = useState('year'); // 'week', 'month', 'year'

    // Helper to get date ranges
    const getDateRanges = (range) => {
        const now = new Date();
        let start, end, prevStart, prevEnd;

        switch (range) {
            case 'day':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                prevEnd = new Date(start);
                break;
            case 'week':
                start = new Date(now);
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Start of week (Monday)
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 7);

                prevStart = new Date(start);
                prevStart.setDate(prevStart.getDate() - 7);
                prevEnd = new Date(start);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

                prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEnd = new Date(start);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);

                prevStart = new Date(now.getFullYear() - 1, 0, 1);
                prevEnd = new Date(start);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEnd = new Date(start);
        }
        return { start, end, prevStart, prevEnd };
    };

    // Filter Orders by Time Range (Current and Previous)
    const { filteredOrders, previousOrders, dateRange } = useMemo(() => {
        const { start, end, prevStart, prevEnd } = getDateRanges(timeRange);

        const current = orders.filter(order => {
            if (!order.timeline?.received?.raw) return false;
            const orderDate = new Date(order.timeline.received.raw);
            return orderDate >= start && orderDate < end;
        });

        const previous = orders.filter(order => {
            if (!order.timeline?.received?.raw) return false;
            const orderDate = new Date(order.timeline.received.raw);
            return orderDate >= prevStart && orderDate < prevEnd;
        });

        return { filteredOrders: current, previousOrders: previous, dateRange: { start, end, prevStart, prevEnd } };
    }, [orders, timeRange]);

    // Calculate Stats based on filtered orders
    const stats = useMemo(() => {
        // Basic Stats
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.rawPrice || 0), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
        const completedOrders = filteredOrders.filter(o => o.status === 'Completed').length;
        const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;

        // Previous Period Stats for Comparison
        const prevRevenue = previousOrders.reduce((sum, order) => sum + (order.rawPrice || 0), 0);
        const prevOrdersCount = previousOrders.length;
        const prevAvgOrderValue = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

        // Calculate Trends
        const calculateTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const revenueTrend = calculateTrend(totalRevenue, prevRevenue);
        const ordersTrend = calculateTrend(totalOrders, prevOrdersCount);
        const avgOrderValueTrend = calculateTrend(avgOrderValue, prevAvgOrderValue);

        // New Customers (True Logic: First-time buyers in this period)
        const firstOrderDates = {};
        orders.forEach(order => {
            const phone = order.customer.phone;
            // Skip invalid phones if necessary, but assuming valid for now
            if (!order.timeline?.received?.raw) return;
            const date = new Date(order.timeline.received.raw);

            if (!firstOrderDates[phone] || date < firstOrderDates[phone]) {
                firstOrderDates[phone] = date;
            }
        });

        let newCustomersCount = 0;
        Object.values(firstOrderDates).forEach(date => {
            if (date >= dateRange.start && date < dateRange.end) {
                newCustomersCount++;
            }
        });

        let prevNewCustomersCount = 0;
        Object.values(firstOrderDates).forEach(date => {
            if (date >= dateRange.prevStart && date < dateRange.prevEnd) {
                prevNewCustomersCount++;
            }
        });

        const newCustomersTrend = calculateTrend(newCustomersCount, prevNewCustomersCount);

        // Top Product
        const productMap = {};
        const prevProductMap = {};

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                productMap[item.name] = (productMap[item.name] || 0) + (Number(item.amount) || 1);
            });
        });

        previousOrders.forEach(order => {
            order.items.forEach(item => {
                prevProductMap[item.name] = (prevProductMap[item.name] || 0) + (Number(item.amount) || 1);
            });
        });

        const productStats = Object.entries(productMap).map(([name, count]) => {
            const prevCount = prevProductMap[name] || 0;
            const trend = calculateTrend(count, prevCount);
            return { name, count, trend };
        }).sort((a, b) => b.count - a.count);

        let topProduct = { name: 'N/A', count: 0 };
        if (productStats.length > 0) {
            topProduct = productStats[0];
        }

        // Platform (Mock logic as data is missing, defaulting to random distribution for demo or 'Unknown')
        // In a real app, this would come from order.source or similar
        const platforms = { 'Facebook': 0, 'Instagram': 0, 'Zalo': 0, 'Other': 0 };
        filteredOrders.forEach(order => {
            // Mocking platform based on random hash of ID for consistency
            const hash = order.id.charCodeAt(order.id.length - 1) % 3;
            if (hash === 0) platforms['Facebook']++;
            else if (hash === 1) platforms['Instagram']++;
            else platforms['Zalo']++;
        });
        let topPlatform = { name: 'N/A', count: 0 };
        Object.entries(platforms).forEach(([name, count]) => {
            if (count > topPlatform.count) {
                topPlatform = { name, count };
            }
        });


        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            revenueTrend,
            ordersTrend,
            avgOrderValueTrend,
            newCustomersCount,
            newCustomersTrend,
            topProduct,
            topPlatform,
            productStats
        };
    }, [filteredOrders, previousOrders, customers, dateRange]);

    // Calculate Revenue for Chart based on Chart Time Range (Independent of Overview Filter)
    const chartData = useMemo(() => {
        const data = {};
        let labels = [];

        // Filter orders for chart based on chartTimeRange
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Start of week (Monday)
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const chartOrders = orders.filter(order => {
            if (!order.timeline?.received?.raw) return false;
            const orderDate = new Date(order.timeline.received.raw);

            switch (chartTimeRange) {
                case 'week': return orderDate >= startOfWeek;
                case 'month': return orderDate >= startOfMonth;
                case 'year': return orderDate >= startOfYear;
                default: return true;
            }
        });

        if (chartTimeRange === 'week') {
            // Daily breakdown (Mon - Sun)
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            chartOrders.forEach(order => {
                if (order.timeline?.received?.raw) {
                    const date = new Date(order.timeline.received.raw);
                    const dayName = days[date.getDay()];
                    data[dayName] = (data[dayName] || 0) + (order.rawPrice || 0);
                }
            });
        } else if (chartTimeRange === 'month') {
            // Daily breakdown (1 - 31)
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(`${i}`);
            }
            chartOrders.forEach(order => {
                if (order.timeline?.received?.raw) {
                    const date = new Date(order.timeline.received.raw);
                    const day = date.getDate();
                    const label = `${day}`;
                    data[label] = (data[label] || 0) + (order.rawPrice || 0);
                }
            });
        } else {
            // Monthly breakdown (Jan - Dec) for Year view
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            chartOrders.forEach(order => {
                if (order.timeline?.received?.raw) {
                    const date = new Date(order.timeline.received.raw);
                    const monthIndex = date.getMonth();
                    const label = labels[monthIndex];
                    data[label] = (data[label] || 0) + (order.rawPrice || 0);
                }
            });
        }

        return labels.map(label => ({
            name: label,
            value: data[label] || 0
        }));
    }, [orders, chartTimeRange]);

    // Sort Recent Orders (Filtered)
    const recentOrders = useMemo(() => {
        return [...filteredOrders].sort((a, b) => {
            const dateA = new Date(a.timeline.received.raw);
            const dateB = new Date(b.timeline.received.raw);
            return dateB - dateA;
        });
    }, [filteredOrders]);

    const handleToggleRevenue = () => {
        if (isRevenueVisible) {
            setIsRevenueVisible(false);
        } else {
            setIsPasswordModalOpen(true);
        }
    };

    const timeRangeLabels = {
        'day': 'Today',
        'week': 'This Week',
        'month': 'This Month',
        'year': 'This Year'
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={() => setIsRevenueVisible(true)}
            />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-gray-500 mt-1">Here is the summary of overall data</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    {['day', 'week', 'month', 'year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === range
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {/* Total Revenue */}
                <div className="bg-primary rounded-2xl p-4 text-white shadow-lg shadow-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Wallet size={20} />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleToggleRevenue}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {isRevenueVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                <button className="text-white/70 hover:text-white">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                        <p className="text-primary-100 text-sm font-medium mb-1">Total Revenue</p>
                        <h3 className="text-xl lg:text-3xl font-bold mb-2">
                            {isRevenueVisible
                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)
                                : '******'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center backdrop-blur-sm ${stats.revenueTrend >= 0 ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-100'}`}>
                                <TrendingUp size={12} className={`mr-1 ${stats.revenueTrend < 0 ? 'rotate-180' : ''}`} />
                                {stats.revenueTrend > 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
                            </span>
                            <span className="text-xs text-primary-100">vs last period</span>
                        </div>
                    </div>
                </div>

                <StatsCard
                    title="Total Orders"
                    value={stats.totalOrders.toLocaleString()}
                    trend={stats.ordersTrend >= 0 ? "up" : "down"}
                    trendValue={`${stats.ordersTrend > 0 ? '+' : ''}${stats.ordersTrend.toFixed(1)}%`}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />

                <StatsCard
                    title="Avg. Order Value"
                    value={isRevenueVisible
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.avgOrderValue)
                        : '******'}
                    trend={stats.avgOrderValueTrend >= 0 ? "up" : "down"}
                    trendValue={`${stats.avgOrderValueTrend > 0 ? '+' : ''}${stats.avgOrderValueTrend.toFixed(1)}%`}
                    icon={PiggyBank}
                    color="bg-purple-500"
                />

                {/* New Stats Row */}
                <StatsCard
                    title="New Customers"
                    value={stats.newCustomersCount.toLocaleString()}
                    trend={stats.newCustomersTrend >= 0 ? "up" : "down"}
                    trendValue={`${stats.newCustomersTrend > 0 ? '+' : ''}${stats.newCustomersTrend.toFixed(1)}%`}
                    icon={Users}
                    color="bg-orange-500"
                />

                <StatsCard
                    title="Best Seller"
                    value={stats.topProduct.name}
                    subValue={`${stats.topProduct.count} sold`}
                    trend="neutral"
                    trendValue="Top Product"
                    icon={Award}
                    color="bg-pink-500"
                />

                <StatsCard
                    title="Top Platform"
                    value={stats.topPlatform.name}
                    subValue={`${stats.topPlatform.count} orders`}
                    trend="neutral"
                    trendValue="Most Active"
                    icon={Globe}
                    color="bg-indigo-500"
                />
            </div>

            {/* Order Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
                        <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</h3>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600">
                        <ShoppingBag size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
                        <h3 className="text-2xl font-bold text-green-600">{stats.completedOrders}</h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl text-green-600">
                        <ShoppingBag size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Cancelled</p>
                        <h3 className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</h3>
                    </div>
                    <div className="p-3 bg-red-100 rounded-xl text-red-600">
                        <ShoppingBag size={24} />
                    </div>
                </div>
            </div>

            {/* Charts & Widgets Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                {/* Main Chart */}
                <div className="xl:col-span-2">
                    <RevenueChart
                        data={chartData}
                        isVisible={isRevenueVisible}
                        timeRange={chartTimeRange}
                        onTimeRangeChange={setChartTimeRange}
                    />
                </div>

                {/* Product Stats Card */}
                <div className="xl:col-span-1">
                    <ProductStatsCard
                        data={stats.productStats}
                        totalSales={stats.totalOrders} // Or total items sold if preferred
                        totalTrend={stats.ordersTrend}
                        timeRangeLabel={timeRangeLabels[timeRange]}
                    />
                </div>
            </div>

            {/* Recent Orders */}
            <RecentOrders orders={recentOrders} />
        </div>
    );
};

export default Dashboard;
