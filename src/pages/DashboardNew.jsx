import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import StatsCard from '../components/Dashboard/StatsCard';
import RevenueChart from '../components/Dashboard/RevenueChart';
import RecentOrders from '../components/Dashboard/RecentOrders';
import PasswordModal from '../components/Common/PasswordModal';
import ProductStatsCard from '../components/Dashboard/ProductStatsCard';
import SkeletonStats from '../components/Common/SkeletonStats';
import SkeletonCard from '../components/Common/SkeletonCard';
import SkeletonTable from '../components/Common/SkeletonTable';
import {
    Wallet, PiggyBank, TrendingUp, ShoppingBag, Eye, EyeOff, Users, Award, Globe,
    Package, Star, Calendar, ArrowUpRight, Activity, Zap
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { staggerChildrenVariants, itemVariants, fadeInVariants } from '../utils/animations';
import { useFormattedCountUp } from '../hooks/useAnimations';

const Dashboard = () => {
    const { orders, customers, loading } = useData();
    const [isRevenueVisible, setIsRevenueVisible] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [timeRange, setTimeRange] = useState('month');
    const [chartTimeRange, setChartTimeRange] = useState('year');

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
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
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

    // Filter Orders by Time Range
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

    // Calculate Stats
    const stats = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.rawPrice || 0), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const pendingOrders = filteredOrders.filter(o => o.status === 'Pending').length;
        const completedOrders = filteredOrders.filter(o => o.status === 'Completed').length;
        const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled').length;

        const prevRevenue = previousOrders.reduce((sum, order) => sum + (order.rawPrice || 0), 0);
        const prevOrdersCount = previousOrders.length;
        const prevAvgOrderValue = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

        const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const ordersTrend = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;
        const avgOrderValueTrend = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

        // New customers in this period
        const newCustomersInPeriod = customers?.filter(customer => {
            if (!customer.createdAt) return false;
            const createdDate = new Date(customer.createdAt);
            return createdDate >= dateRange.start && createdDate < dateRange.end;
        }).length || 0;

        const prevNewCustomers = customers?.filter(customer => {
            if (!customer.createdAt) return false;
            const createdDate = new Date(customer.createdAt);
            return createdDate >= dateRange.prevStart && createdDate < dateRange.prevEnd;
        }).length || 0;

        const newCustomersTrend = prevNewCustomers > 0 ? ((newCustomersInPeriod - prevNewCustomers) / prevNewCustomers) * 100 : 0;

        // Product stats
        const productCounts = {};
        filteredOrders.forEach(order => {
            order.items?.forEach(item => {
                const name = item.name || 'Unknown';
                productCounts[name] = (productCounts[name] || 0) + (item.amount || 0);
            });
        });

        const topProduct = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)[0] || ['No sales', 0];

        // Platform stats
        const platformCounts = {};
        filteredOrders.forEach(order => {
            const platform = order.customer?.socialLink
                ? order.customer.socialLink.includes('facebook') ? 'Facebook'
                    : order.customer.socialLink.includes('instagram') ? 'Instagram'
                        : order.customer.socialLink.includes('zalo') ? 'Zalo'
                            : 'Other'
                : 'Direct';

            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });

        const topPlatform = Object.entries(platformCounts)
            .sort(([, a], [, b]) => b - a)[0] || ['None', 0];

        const productStats = Object.entries(productCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

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
            newCustomersCount: newCustomersInPeriod,
            newCustomersTrend,
            topProduct: { name: topProduct[0], count: topProduct[1] },
            topPlatform: { name: topPlatform[0], count: topPlatform[1] },
            productStats
        };
    }, [filteredOrders, previousOrders, customers, dateRange]);

    // Chart data
    const chartData = useMemo(() => {
        const { start, end } = getDateRanges(chartTimeRange);
        const ordersInRange = orders.filter(order => {
            if (!order.timeline?.received?.raw) return false;
            const orderDate = new Date(order.timeline.received.raw);
            return orderDate >= start && orderDate < end;
        });

        const dataMap = new Map();
        ordersInRange.forEach(order => {
            const date = order.timeline.received.date;
            if (!dataMap.has(date)) {
                dataMap.set(date, { date, revenue: 0, orders: 0 });
            }
            const entry = dataMap.get(date);
            entry.revenue += order.rawPrice || 0;
            entry.orders += 1;
        });

        return Array.from(dataMap.values()).sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
    }, [orders, chartTimeRange]);

    const recentOrders = useMemo(() => {
        return [...filteredOrders]
            .sort((a, b) => {
                const dateA = a.timeline?.received?.raw || 0;
                const dateB = b.timeline?.received?.raw || 0;
                return new Date(dateB) - new Date(dateA);
            })
            .slice(0, 5);
    }, [filteredOrders]);

    const handleToggleRevenue = () => {
        if (!isRevenueVisible) {
            setIsPasswordModalOpen(true);
        } else {
            setIsRevenueVisible(false);
        }
    };

    const timeRangeLabels = {
        'day': 'Today',
        'week': 'This Week',
        'month': 'This Month',
        'year': 'This Year'
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <SkeletonStats count={6} className="mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <SkeletonCard lines={8} className="h-96" />
                    </div>
                    <div className="lg:col-span-1">
                        <SkeletonCard lines={10} />
                    </div>
                </div>
                <SkeletonTable rows={5} columns={4} />
            </div>
        );
    }

    return (
        <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={() => setIsRevenueVisible(true)}
            />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                            <Activity className="text-primary" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-500 text-xs lg:text-sm">Welcome back! Here's your business overview</p>
                        </div>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm overflow-x-auto">
                        <div className="flex gap-1 min-w-max">
                            {['day', 'week', 'month', 'year'].map((range) => (
                                <motion.button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                                        timeRange === range
                                            ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/30'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {range.charAt(0).toUpperCase() + range.slice(1)}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm w-fit">
                        <Calendar className="text-gray-400" size={18} />
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{timeRangeLabels[timeRange]}</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Stats Grid - Featured Revenue Card + Others */}
            <motion.div
                variants={staggerChildrenVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Featured Revenue Card - Larger */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="lg:col-span-1 bg-gradient-to-br from-primary via-primary to-primary-light rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-primary/40 relative overflow-hidden"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 right-10">
                            <Wallet size={200} strokeWidth={1} className="transform scale-75 lg:scale-100 origin-top-right" />
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl">
                                <Wallet size={32} />
                            </div>
                            <motion.button
                                onClick={handleToggleRevenue}
                                whileHover={{ scale: 1.1, rotate: 180 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                            >
                                {isRevenueVisible ? <EyeOff size={24} /> : <Eye size={24} />}
                            </motion.button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                                {isRevenueVisible
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)
                                    : '••••••••'}
                            </h3>

                            <div className="flex items-center gap-3 pt-2">
                                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center backdrop-blur-xl ${
                                    stats.revenueTrend >= 0 ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
                                }`}>
                                    <TrendingUp size={16} className={`mr-1.5 ${stats.revenueTrend < 0 ? 'rotate-180' : ''}`} />
                                    {stats.revenueTrend > 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
                                </span>
                                <span className="text-sm text-white/80">vs last period</span>
                            </div>
                        </div>

                        {/* Mini Sparkline Visual */}
                        <div className="mt-6 pt-6 border-t border-white/20">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/70">Avg. Order Value</span>
                                <span className="font-semibold">
                                    {isRevenueVisible
                                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.avgOrderValue)
                                        : '••••••'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Other Stats - 2 columns */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatsCard
                        title="Total Orders"
                        value={stats.totalOrders.toLocaleString()}
                        trend={stats.ordersTrend >= 0 ? "up" : "down"}
                        trendValue={`${stats.ordersTrend > 0 ? '+' : ''}${stats.ordersTrend.toFixed(1)}%`}
                        icon={ShoppingBag}
                        color="bg-gradient-to-br from-blue-500 to-blue-600"
                    />

                    <StatsCard
                        title="New Customers"
                        value={stats.newCustomersCount.toLocaleString()}
                        trend={stats.newCustomersTrend >= 0 ? "up" : "down"}
                        trendValue={`${stats.newCustomersTrend > 0 ? '+' : ''}${stats.newCustomersTrend.toFixed(1)}%`}
                        icon={Users}
                        color="bg-gradient-to-br from-orange-500 to-orange-600"
                    />

                    <StatsCard
                        title="Best Seller"
                        value={stats.topProduct.name}
                        subValue={`${stats.topProduct.count} sold`}
                        trend="neutral"
                        trendValue="Top Product"
                        icon={Award}
                        color="bg-gradient-to-br from-pink-500 to-pink-600"
                    />

                    <StatsCard
                        title="Top Platform"
                        value={stats.topPlatform.name}
                        subValue={`${stats.topPlatform.count} orders`}
                        trend="neutral"
                        trendValue="Most Active"
                        icon={Globe}
                        color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                    />
                </div>
            </motion.div>

            {/* Order Status Quick View */}
            {loading ? (
                <SkeletonStats count={3} className="mb-6" />
            ) : (
                <motion.div
                    variants={staggerChildrenVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg shadow-yellow-100"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wide mb-2">Pending</p>
                                <h3 className="text-4xl font-bold text-yellow-700">{stats.pendingOrders}</h3>
                            </div>
                            <div className="p-4 bg-yellow-200/50 rounded-2xl">
                                <Package size={32} className="text-yellow-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg shadow-green-100"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">Completed</p>
                                <h3 className="text-4xl font-bold text-green-700">{stats.completedOrders}</h3>
                            </div>
                            <div className="p-4 bg-green-200/50 rounded-2xl">
                                <Star size={32} className="text-green-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg shadow-red-100"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">Cancelled</p>
                                <h3 className="text-4xl font-bold text-red-700">{stats.cancelledOrders}</h3>
                            </div>
                            <div className="p-4 bg-red-200/50 rounded-2xl">
                                <Zap size={32} className="text-red-600" />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Charts & Widgets Section */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                        <SkeletonCard lines={8} className="h-96" />
                    </div>
                    <div className="lg:col-span-1">
                        <SkeletonCard lines={10} />
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
                >
                    {/* Main Chart */}
                    <div className="lg:col-span-2">
                        <RevenueChart
                            data={chartData}
                            isVisible={isRevenueVisible}
                            timeRange={chartTimeRange}
                            onTimeRangeChange={setChartTimeRange}
                        />
                    </div>

                    {/* Product Stats Card */}
                    <div className="lg:col-span-1">
                        <ProductStatsCard
                            data={stats.productStats}
                            totalSales={stats.totalOrders}
                            totalTrend={stats.ordersTrend}
                            timeRangeLabel={timeRangeLabels[timeRange]}
                        />
                    </div>
                </motion.div>
            )}

            {/* Recent Orders */}
            {loading ? (
                <SkeletonTable rows={5} columns={4} />
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <RecentOrders orders={recentOrders} />
                </motion.div>
            )}
        </motion.div>
    );
};

export default Dashboard;
