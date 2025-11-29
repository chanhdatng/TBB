import React, { useMemo, useState } from 'react';
import { Minus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import PasswordModal from '../components/Common/PasswordModal';

const DashboardSwiss = () => {
    const { orders, customers, loading } = useData();
    const [isRevenueVisible, setIsRevenueVisible] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [timeRange, setTimeRange] = useState('month');

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

    const dateRange = useMemo(() => getDateRanges(timeRange), [timeRange]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (!order.timeline?.received?.raw) return false;
            const orderDate = new Date(order.timeline.received.raw);
            return orderDate >= dateRange.start && orderDate < dateRange.end;
        });
    }, [orders, dateRange]);

    const previousOrders = useMemo(() => {
        return orders.filter(order => {
            if (!order.timeline?.received?.raw) return false;
            const orderDate = new Date(order.timeline.received.raw);
            return orderDate >= dateRange.prevStart && orderDate < dateRange.prevEnd;
        });
    }, [orders, dateRange]);

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

        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            revenueTrend,
            ordersTrend,
            avgOrderValueTrend
        };
    }, [filteredOrders, previousOrders]);

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
        'day': 'Day',
        'week': 'Week',
        'month': 'Month',
        'year': 'Year'
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-2 h-2 bg-black mb-4 mx-auto"></div>
                    <p className="text-sm font-mono text-black tracking-wider">LOADING</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-4 sm:p-8">
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={() => setIsRevenueVisible(true)}
            />

            {/* Swiss Grid Layout */}
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="border-b-2 border-black pb-8 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-black mb-2">
                                DASHBOARD
                            </h1>
                            <p className="text-sm font-mono tracking-wider text-black">
                                {new Date().toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="flex gap-0 border-2 border-black">
                            {['day', 'week', 'month', 'year'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-2 text-xs font-mono tracking-wider border-l-2 first:border-l-0 border-black transition-colors ${
                                        timeRange === range
                                            ? 'bg-black text-white'
                                            : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                                >
                                    {timeRangeLabels[range].toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid - Swiss Style with explicit grid lines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black mb-8">
                    {/* Revenue Card */}
                    <div className="border-b-2 sm:border-r-2 lg:border-b-0 border-black p-6 sm:p-8 relative group hover:bg-black hover:text-white transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <p className="text-xs font-mono tracking-widest">REVENUE</p>
                            <button
                                onClick={handleToggleRevenue}
                                className="w-4 h-4 border border-current flex items-center justify-center hover:bg-current hover:text-white transition-colors"
                            >
                                <Minus size={8} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">
                                {isRevenueVisible
                                    ? new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                        notation: 'compact',
                                        compactDisplay: 'short'
                                    }).format(stats.totalRevenue)
                                    : '***'}
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xs font-mono ${stats.revenueTrend >= 0 ? '' : 'opacity-50'}`}>
                                    {stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
                                </span>
                                <div className="flex-1 h-px bg-current"></div>
                            </div>
                        </div>
                    </div>

                    {/* Orders Card */}
                    <div className="border-b-2 lg:border-r-2 lg:border-b-0 border-black p-6 sm:p-8 relative group hover:bg-black hover:text-white transition-colors">
                        <p className="text-xs font-mono tracking-widest mb-4">ORDERS</p>
                        <div className="space-y-2">
                            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">
                                {stats.totalOrders}
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xs font-mono ${stats.ordersTrend >= 0 ? '' : 'opacity-50'}`}>
                                    {stats.ordersTrend >= 0 ? '+' : ''}{stats.ordersTrend.toFixed(1)}%
                                </span>
                                <div className="flex-1 h-px bg-current"></div>
                            </div>
                        </div>
                    </div>

                    {/* Avg Order Value Card */}
                    <div className="border-b-2 sm:border-r-2 sm:border-b-0 border-black p-6 sm:p-8 relative group hover:bg-black hover:text-white transition-colors">
                        <p className="text-xs font-mono tracking-widest mb-4">AVG VALUE</p>
                        <div className="space-y-2">
                            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">
                                {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(stats.avgOrderValue)}
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xs font-mono ${stats.avgOrderValueTrend >= 0 ? '' : 'opacity-50'}`}>
                                    {stats.avgOrderValueTrend >= 0 ? '+' : ''}{stats.avgOrderValueTrend.toFixed(1)}%
                                </span>
                                <div className="flex-1 h-px bg-current"></div>
                            </div>
                        </div>
                    </div>

                    {/* Customers Card */}
                    <div className="p-6 sm:p-8 relative group hover:bg-black hover:text-white transition-colors">
                        <p className="text-xs font-mono tracking-widest mb-4">CUSTOMERS</p>
                        <div className="space-y-2">
                            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">
                                {customers.length}
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-mono">TOTAL</span>
                                <div className="flex-1 h-px bg-current"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-3 gap-0 border-2 border-black mb-8">
                    <div className="border-r-2 border-black p-6 text-center hover:bg-black hover:text-white transition-colors">
                        <p className="text-xs font-mono tracking-widest mb-3">PENDING</p>
                        <p className="text-4xl font-bold font-mono">{stats.pendingOrders}</p>
                    </div>
                    <div className="border-r-2 border-black p-6 text-center hover:bg-black hover:text-white transition-colors">
                        <p className="text-xs font-mono tracking-widest mb-3">COMPLETED</p>
                        <p className="text-4xl font-bold font-mono">{stats.completedOrders}</p>
                    </div>
                    <div className="p-6 text-center hover:bg-black hover:text-white transition-colors">
                        <p className="text-xs font-mono tracking-widest mb-3">CANCELLED</p>
                        <p className="text-4xl font-bold font-mono">{stats.cancelledOrders}</p>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="border-2 border-black">
                    <div className="border-b-2 border-black p-6 bg-black text-white">
                        <h2 className="text-xl font-mono tracking-wider">RECENT ACTIVITY</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="text-left p-4 text-xs font-mono tracking-widest border-r-2 border-black">CUSTOMER</th>
                                    <th className="text-left p-4 text-xs font-mono tracking-widest border-r-2 border-black">ITEMS</th>
                                    <th className="text-left p-4 text-xs font-mono tracking-widest border-r-2 border-black">DATE</th>
                                    <th className="text-right p-4 text-xs font-mono tracking-widest border-r-2 border-black">AMOUNT</th>
                                    <th className="text-center p-4 text-xs font-mono tracking-widest">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.slice(0, 5).map((order, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-black last:border-0 hover:bg-black hover:text-white transition-colors"
                                    >
                                        <td className="p-4 font-mono text-sm border-r-2 border-black">
                                            {order.customer.name}
                                        </td>
                                        <td className="p-4 font-mono text-sm border-r-2 border-black">
                                            {order.items.length > 1
                                                ? `${order.items[0].name} +${order.items.length - 1}`
                                                : order.items[0]?.name || 'Unknown'}
                                        </td>
                                        <td className="p-4 font-mono text-sm border-r-2 border-black">
                                            {order.timeline.received.date}
                                        </td>
                                        <td className="p-4 font-mono text-sm text-right border-r-2 border-black">
                                            {order.price}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-xs font-mono tracking-wider border-2 ${
                                                order.status === 'Completed' ? 'border-black bg-black text-white' :
                                                order.status === 'Pending' ? 'border-black' :
                                                'border-black opacity-50'
                                            }`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSwiss;
