import React, { useMemo } from 'react';
import { X, Package, Calendar, MapPin, Phone, Mail, TrendingUp, Clock, ShoppingCart, Star } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getSegmentColor, getSegmentIcon, getSegmentDescription, getScoreColor, getScoreLabel } from '../../utils/rfm';
import { getCLVSegmentColor } from '../../utils/customerMetrics';
import { getZoneColor, getDeliveryTier } from '../../utils/addressParser';

// Helper function to format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value || 0);
};

// RFM Score Bar Component - Moved outside to prevent recreation on every render
const RFMScoreBar = ({ label, score, maxScore = 5, explanation }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="text-gray-900 font-bold">
                {score}/{maxScore} - {getScoreLabel(score)}
            </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
                className={`h-3 rounded-full transition-all duration-300 ${getScoreColor(score)}`}
                style={{ width: `${(score / maxScore) * 100}%` }}
            />
        </div>
        {explanation && (
            <p className="text-xs text-gray-500">{explanation}</p>
        )}
    </div>
);

const CustomerDetailsModal = ({ isOpen, onClose, customer, orders }) => {
    if (!isOpen || !customer) return null;

    // Filter orders for this customer
    const customerOrders = orders.filter(order => order.customer.phone === customer.phone)
        .sort((a, b) => {
            const dateA = a.timeline?.received?.raw || 0;
            const dateB = b.timeline?.received?.raw || 0;
            return dateB - dateA;
        });

    // Calculate purchase frequency and trends
    const purchaseMetrics = useMemo(() => {
        if (customerOrders.length === 0) return null;

        // Calculate average days between orders
        const orderDates = customerOrders.map(o => o.timeline?.received?.raw || 0).filter(d => d > 0).sort();
        let avgDaysBetweenOrders = 0;
        if (orderDates.length > 1) {
            const intervals = [];
            for (let i = 1; i < orderDates.length; i++) {
                intervals.push((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24));
            }
            avgDaysBetweenOrders = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        }

        // Find favorite items
        const itemCount = {};
        customerOrders.forEach(order => {
            order.items?.forEach(item => {
                if (item.name) {
                    itemCount[item.name] = (itemCount[item.name] || 0) + (item.amount || 1);
                }
            });
        });

        const favoriteItems = Object.entries(itemCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Calculate last 3 months vs previous 3 months
        const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;

        const recentOrders = customerOrders.filter(o => (o.timeline?.received?.raw || 0) >= threeMonthsAgo);
        const previousOrders = customerOrders.filter(o => {
            const date = o.timeline?.received?.raw || 0;
            return date >= sixMonthsAgo && date < threeMonthsAgo;
        });

        const recentSpending = recentOrders.reduce((sum, o) => sum + (Number(o.rawPrice) || 0), 0);
        const previousSpending = previousOrders.reduce((sum, o) => sum + (Number(o.rawPrice) || 0), 0);

        const trend = previousSpending > 0
            ? ((recentSpending - previousSpending) / previousSpending) * 100
            : recentSpending > 0 ? 100 : 0;

        return {
            avgDaysBetweenOrders,
            favoriteItems,
            recentOrders: recentOrders.length,
            previousOrders: previousOrders.length,
            trend
        };
    }, [customerOrders]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gradient-to-br from-gray-50/50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-2xl font-heading shadow-sm">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 font-heading">{customer.name || 'Unknown Customer'}</h2>
                            <div className="flex flex-col gap-1.5 mt-2 text-sm text-gray-600">
                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        <span>{customer.phone}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>{customer.address}</span>
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-gray-400" />
                                        <span>{customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Top Summary Bar */}
                <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* CLV */}
                        <div>
                            <p className="text-xs text-gray-600 mb-1">CLV Dự kiến</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {formatCurrency(customer.clv)}
                            </p>
                            {customer.clvSegment && (
                                <span className={`text-xs px-2 py-0.5 rounded ${getCLVSegmentColor(customer.clvSegment)}`}>
                                    {customer.clvSegment}
                                </span>
                            )}
                        </div>

                        {/* Health Score */}
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Sức khỏe</p>
                            <p className="text-2xl font-bold">{customer.healthScore || 0}/100</p>
                            <div
                                className="w-full bg-gray-200 h-2 rounded-full mt-1"
                                role="progressbar"
                                aria-valuenow={customer.healthScore || 0}
                                aria-valuemin="0"
                                aria-valuemax="100"
                                aria-label="Customer health score"
                            >
                                <div
                                    style={{ width: `${customer.healthScore || 0}%` }}
                                    className="h-2 bg-green-500 rounded-full transition-all"
                                />
                            </div>
                        </div>

                        {/* Churn Risk */}
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Rủi ro</p>
                            {customer.churnRisk ? (
                                <>
                                    <span className={`inline-block px-3 py-1 rounded-full ${customer.churnRisk.color}`}>
                                        {customer.churnRisk.label}
                                    </span>
                                    <p className="text-xs text-gray-600 mt-1">Score: {customer.churnRisk.score}/100</p>
                                </>
                            ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                            )}
                        </div>

                        {/* Loyalty Stage */}
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Giai đoạn</p>
                            {customer.loyaltyStage ? (
                                <span className={`inline-block px-3 py-1 rounded-full ${customer.loyaltyStage.color}`}>
                                    {customer.loyaltyStage.label}
                                </span>
                            ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* RFM Scorecard */}
                {customer.rfm && (
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50/50 to-white">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-gray-900 font-heading">Customer Insights</h3>
                            {(() => {
                                const iconName = getSegmentIcon(customer.rfm.segment);
                                const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;
                                return (
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border shadow-sm ${getSegmentColor(customer.rfm.segment)}`}
                                        title={getSegmentDescription(customer.rfm.segment)}
                                    >
                                        <IconComponent size={14} />
                                        <span>{customer.rfm.segment}</span>
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Segment Description */}
                        <p className="text-sm text-gray-700 mb-5 p-4 bg-white rounded-lg border border-gray-200 leading-relaxed">
                            {getSegmentDescription(customer.rfm.segment)}
                        </p>

                        {/* RFM Scores */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <RFMScoreBar
                                label="Recency (R)"
                                score={customer.rfm.R || 0}
                                explanation={
                                    customer.rfm.daysSinceLastOrder !== undefined
                                        ? `Last order: ${customer.rfm.daysSinceLastOrder} days ago`
                                        : 'No orders yet'
                                }
                            />
                            <RFMScoreBar
                                label="Frequency (F)"
                                score={customer.rfm.F || 0}
                                explanation={`Total orders: ${customer.orders || 0}`}
                            />
                            <RFMScoreBar
                                label="Monetary (M)"
                                score={customer.rfm.M || 0}
                                explanation={`Spending level: ${customer.rfm.M === 5 ? 'Top 20%' : customer.rfm.M === 4 ? 'Above average' : customer.rfm.M === 3 ? 'Average' : customer.rfm.M === 2 ? 'Below average' : 'Bottom 20%'}`}
                            />
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 border-b border-gray-200 divide-x divide-gray-200 bg-gray-50/30">
                    <div className="p-5 text-center">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Total Orders</p>
                        <p className="text-3xl font-bold text-gray-900 font-heading">{customer.orders || 0}</p>
                    </div>
                    <div className="p-5 text-center">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Total Spent</p>
                        <p className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(customer.totalSpent || 0)}
                        </p>
                    </div>
                    <div className="p-5 text-center">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">AOV</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(customer.aov || 0)}
                        </p>
                    </div>
                </div>

                {/* Purchase Metrics */}
                {purchaseMetrics && (
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50/30 to-white">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg font-heading">
                            <TrendingUp size={20} className="text-primary" />
                            Purchase Patterns
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={16} className="text-blue-500" />
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {purchaseMetrics.avgDaysBetweenOrders > 0
                                        ? `${Math.round(purchaseMetrics.avgDaysBetweenOrders)}d`
                                        : 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Avg between orders</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingCart size={16} className="text-green-500" />
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {purchaseMetrics.recentOrders}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Orders in last 90 days</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={16} className={purchaseMetrics.trend >= 0 ? "text-green-500" : "text-red-500"} />
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</p>
                                </div>
                                <p className={`text-2xl font-bold ${purchaseMetrics.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {purchaseMetrics.trend >= 0 ? '+' : ''}{purchaseMetrics.trend.toFixed(0)}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">vs prev 90 days</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Behavioral Insights Card */}
                {customer.behavior && (
                    <div className="p-6 border-b bg-blue-50/30">
                        <h3 className="font-bold text-lg mb-4">Hành vi mua hàng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Ngày thường mua</p>
                                <p className="font-bold text-lg">{customer.behavior.peakDay || 'N/A'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Giờ thường mua</p>
                                <p className="font-bold text-lg">{customer.behavior.peakHour || 'N/A'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Khoảng cách đơn TB</p>
                                <p className="font-bold text-lg">
                                    {customer.behavior.avgDaysBetweenOrders
                                        ? `${customer.behavior.avgDaysBetweenOrders} ngày`
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Favorite Items */}
                {purchaseMetrics?.favoriteItems?.length > 0 && (
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-amber-50/30 to-white">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg font-heading">
                            <Star size={20} className="text-amber-500" />
                            Favorite Items
                        </h3>
                        <div className="space-y-2">
                            {purchaseMetrics.favoriteItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
                                            <span className="text-amber-600 font-bold text-sm">#{index + 1}</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                        {item.count}x ordered
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Location Info Card */}
                {customer.location && (
                    <div className="p-6 border-b">
                        <h3 className="font-bold text-lg mb-4">Thông tin địa lý</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Quận/Huyện</p>
                                <p className="font-bold">{customer.location.district || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Khu vực</p>
                                {customer.location.zone ? (
                                    <span className={`px-2 py-1 rounded ${getZoneColor(customer.location.zone)}`}>
                                        {customer.location.zone}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-400">N/A</span>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Tier giao hàng</p>
                                <p className="font-bold">
                                    {customer.location.district
                                        ? getDeliveryTier(customer.location.district).label
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order History */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg font-heading">
                        <Package size={22} className="text-primary" />
                        Order History
                    </h3>

                    {customerOrders.length > 0 ? (
                        <div className="space-y-3">
                            {customerOrders.map(order => (
                                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary/40 hover:shadow-md transition-all bg-white cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <Calendar size={13} className="flex-shrink-0" />
                                                <span>{order.timeline?.received?.date || 'Unknown Date'}</span>
                                            </div>
                                            <div className="font-semibold text-gray-900 text-sm">
                                                {order.items?.map(item => `${item.amount || 1}x ${item.name}`).join(', ')}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <div className="font-bold text-primary text-base mb-1.5">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(order.rawPrice || 0)}
                                            </div>
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    {order.note && (
                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-2 border border-gray-100">
                                            <span className="font-medium text-gray-700">Note:</span> {order.note}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Package size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="font-medium text-gray-600">No orders found</p>
                            <p className="text-sm text-gray-400 mt-1">This customer hasn't placed any orders yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;
