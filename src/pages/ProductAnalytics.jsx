import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Package, TrendingUp, TrendingDown, Award, AlertTriangle,
    BarChart3, DollarSign, Zap, Clock, Loader2, Calendar
} from 'lucide-react';
import ProductionOverviewCards from '../components/Analytics/ProductionOverviewCards';
import DailyProductionChart from '../components/Analytics/DailyProductionChart';
import TimeSlotDistribution from '../components/Analytics/TimeSlotDistribution';
import ProductComparisonTable from '../components/Analytics/ProductComparisonTable';
import ExportButton from '../components/Analytics/ExportButton';
import ErrorBoundary from '../components/Analytics/ErrorBoundary';
import VelocityIcon from '../components/Analytics/VelocityIcon';
import {
    createProductionMetrics,
    getPreviousPeriodData,
    calculateGrowthRates,
    calculateDailyProduction,
    analyzeTimeSlots
} from '../utils/productionAnalytics';

const ProductAnalytics = () => {
    const {
        orders,
        globalRankings,
        productAnalytics,
        analyticsLoading,
        getTopSellers,
        getSlowMovers,
        getTrending,
        getTopRevenue
    } = useData();

    const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', 'lifetime'

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    // Compute summary based on time range
    const summary = useMemo(() => {
        console.log('ProductAnalytics - productAnalytics:', productAnalytics);
        console.log('ProductAnalytics - keys count:', Object.keys(productAnalytics || {}).length);
        
        // Debug: log first product data
        const firstKey = Object.keys(productAnalytics || {})[0];
        if (firstKey) {
            const firstProduct = productAnalytics[firstKey];
            console.log('Sample product:', firstKey, {
                name: firstProduct?.name,
                type: firstProduct?.type,
                recent30Days: firstProduct?.recent30Days,
                lifetime: firstProduct?.lifetime
            });
        }
        
        if (!productAnalytics || Object.keys(productAnalytics).length === 0) {
            return globalRankings?.summary || {};
        }

        const products = Object.values(productAnalytics);
        let totalRevenue = 0;
        let totalSold = 0;
        const categoryRevenue = {};

        products.forEach(p => {
            let revenue = 0, sold = 0;
            
            if (timeRange === '7d') {
                revenue = p.recent7Days?.revenue || 0;
                sold = p.recent7Days?.sold || 0;
            } else if (timeRange === '30d') {
                revenue = p.recent30Days?.revenue || 0;
                sold = p.recent30Days?.sold || 0;
            } else {
                revenue = p.lifetime?.totalRevenue || 0;
                sold = p.lifetime?.totalSold || 0;
            }
            
            totalRevenue += revenue;
            totalSold += sold;
            
            // Track category revenue
            const category = p.type || 'Unknown';
            categoryRevenue[category] = (categoryRevenue[category] || 0) + revenue;
        });

        // Find top category
        let topCategory = 'N/A';
        let maxCategoryRevenue = 0;
        Object.entries(categoryRevenue).forEach(([cat, rev]) => {
            if (rev > maxCategoryRevenue) {
                maxCategoryRevenue = rev;
                topCategory = cat;
            }
        });

        return {
            totalProducts: products.length,
            totalRevenue,
            totalSold,
            avgProductRevenue: products.length > 0 ? totalRevenue / products.length : 0,
            topCategory: topCategory || 'N/A'
        };
    }, [productAnalytics, globalRankings, timeRange]);

    // Compute rankings based on time range
    const computedRankings = useMemo(() => {
        if (!productAnalytics || Object.keys(productAnalytics).length === 0) {
            return { topSellers: [], slowMovers: [], trending: [], topRevenue: [] };
        }

        const products = Object.values(productAnalytics).map(p => {
            let sold = 0, revenue = 0;
            
            if (timeRange === '7d') {
                sold = p.recent7Days?.sold || 0;
                revenue = p.recent7Days?.revenue || 0;
            } else if (timeRange === '30d') {
                sold = p.recent30Days?.sold || 0;
                revenue = p.recent30Days?.revenue || 0;
            } else { // lifetime
                sold = p.lifetime?.totalSold || 0;
                revenue = p.lifetime?.totalRevenue || 0;
            }

            return {
                id: p.productId,
                name: p.name || p.productId,
                type: p.type || '',
                sold,
                revenue,
                growth: p.trend?.growthRate || 0,
                velocity: p.trend?.velocity || '',
                daysSinceLastSale: p.lifetime?.lastSoldAt 
                    ? Math.floor((Date.now() - new Date(p.lifetime.lastSoldAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 999,
                alertLevel: sold === 0 ? 'high' : sold < 5 ? 'medium' : 'low'
            };
        });

        // Top Sellers - by units sold
        const topSellers = [...products]
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10)
            .map((p, i) => ({ ...p, badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '' }));

        // Top Revenue
        const topRevenue = [...products]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Trending - by growth rate (only positive growth)
        const trending = [...products]
            .filter(p => p.growth > 0)
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 10);

        // Debug log for trending data
        if (process.env.NODE_ENV === 'development' && trending.length > 0) {
            console.log('Trending products:', trending.map(p => ({
                name: p.name,
                velocity: p.velocity,
                growth: p.growth
            })));
        }

        // Slow Movers - lowest sales
        const slowMovers = [...products]
            .filter(p => p.sold < 10) // threshold for slow
            .sort((a, b) => a.sold - b.sold)
            .slice(0, 10);

        return { topSellers, slowMovers, trending, topRevenue };
    }, [productAnalytics, timeRange]);

    // Calculate production metrics from orders
    const { productionMetrics, previousMetrics, growthRates } = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                productionMetrics: null,
                previousMetrics: null,
                growthRates: {}
            };
        }

        // Calculate current period metrics
        const currentMetrics = createProductionMetrics(orders, timeRange);

        // Calculate previous period metrics for comparison
        const prevMetrics = getPreviousPeriodData(orders, timeRange);

        // Calculate growth rates
        const growth = calculateGrowthRates(
            currentMetrics.summary,
            prevMetrics.summary
        );

        return {
            productionMetrics: currentMetrics,
            previousMetrics: prevMetrics,
            growthRates: growth
        };
    }, [orders, timeRange]);

    // Calculate chart data
    const { dailyChartData, timeSlotData } = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                dailyChartData: [],
                timeSlotData: null
            };
        }

        // Calculate daily production data for the last 7 days
        const dailyData = calculateDailyProduction(orders, 7);

        // Analyze time slot distribution
        const timeSlotAnalysis = analyzeTimeSlots(orders);

        // Transform time slot data for chart
        const timeSlotChartData = {};
        Object.values(timeSlotAnalysis).forEach(slot => {
            const category = Object.keys(slot.topProducts)[0] || 'Unknown';
            timeSlotChartData[category] = (timeSlotChartData[category] || 0) + slot.totalCakes;
        });

        return {
            dailyChartData: dailyData,
            timeSlotData: timeSlotChartData
        };
    }, [orders]);

    const timeRangeLabels = {
        '7d': '7 ngày',
        '30d': '30 ngày',
        'lifetime': 'Tất cả'
    };

    if (analyticsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const { topSellers, slowMovers, trending, topRevenue } = computedRankings;

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Page Header with Time Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
                    <p className="text-gray-500 mt-1">
                        Số liệu {timeRangeLabels[timeRange]}
                        {globalRankings?.date && (
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                Updated: {globalRankings.date}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton
                        productionMetrics={productionMetrics}
                        timeRange={timeRange}
                        disabled={!productionMetrics}
                    />
                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
                        {['7d', '30d', 'lifetime'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                    timeRange === range
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Calendar size={14} />
                                {timeRangeLabels[range]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Package size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Products</p>
                    <h3 className="text-2xl font-bold text-gray-900">{summary.totalProducts || 0}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-xl text-green-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Doanh thu ({timeRangeLabels[timeRange]})</p>
                    <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                            <BarChart3 size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Avg. Revenue/Product</p>
                    <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avgProductRevenue)}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                            <Award size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Top Category</p>
                    <h3 className="text-2xl font-bold text-gray-900">{summary.topCategory || 'N/A'}</h3>
                </div>
            </div>

            {/* Production Metrics Section */}
            <ErrorBoundary>
                <ProductionOverviewCards
                    productionMetrics={productionMetrics}
                    previousMetrics={previousMetrics}
                    growthRates={growthRates}
                    loading={!productionMetrics && !analyticsLoading}
                />
            </ErrorBoundary>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Top Sellers */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <Award size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Top Sellers</h2>
                                <p className="text-xs text-gray-500">By units sold (30 days)</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {topSellers.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No data available</div>
                        ) : (
                            topSellers.map((product, index) => (
                                <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-gray-100 text-gray-600' :
                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-50 text-gray-500'
                                    }`}>
                                        {product.badge || index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{product.sold} sold</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(product.revenue)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Trending Products */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Trending</h2>
                                <p className="text-xs text-gray-500">By growth rate</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {trending.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No trending products</div>
                        ) : (
                            trending.map((product, index) => (
                                <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                        <VelocityIcon velocity={product.velocity} size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                                        <TrendingUp size={16} />
                                        {product.growth > 0 ? '+' : ''}{product.growth?.toFixed(1)}%
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Revenue */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Top Revenue</h2>
                                <p className="text-xs text-gray-500">Highest earning products</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {topRevenue.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No data available</div>
                        ) : (
                            topRevenue.map((product, index) => (
                                <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-sm font-bold text-purple-600">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.sold} units</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-purple-600">{formatCurrency(product.revenue)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Slow Movers */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Slow Movers</h2>
                                <p className="text-xs text-gray-500">Products needing attention</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {slowMovers.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">All products performing well!</div>
                        ) : (
                            slowMovers.map((product) => (
                                <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className={`w-3 h-3 rounded-full ${
                                        product.alertLevel === 'high' ? 'bg-red-500' :
                                        product.alertLevel === 'medium' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                        <p className="text-xs text-gray-500">
                                            <Clock size={12} className="inline mr-1" />
                                            {product.daysSinceLastSale} days since last sale
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-red-600">
                                        <TrendingDown size={16} />
                                        <span className="font-semibold">{product.sold} sold</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Production Analytics Charts */}
            <ErrorBoundary>
                <div className="mt-8 space-y-6">
                    {/* Daily Production Chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <DailyProductionChart
                            data={dailyChartData}
                            loading={!dailyChartData.length && !analyticsLoading}
                        />
                    </div>

                    {/* Time Slot Distribution and Product Comparison */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <TimeSlotDistribution
                                data={productionMetrics?.timeSlotDistribution}
                                loading={!productionMetrics && analyticsLoading}
                            />
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <ProductComparisonTable
                                data={productionMetrics?.productProduction}
                                loading={!productionMetrics && analyticsLoading}
                            />
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </div>
    );
};

export default ProductAnalytics;
