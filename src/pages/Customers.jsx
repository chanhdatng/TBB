import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Search, Mail, Phone, MoreHorizontal, ChevronLeft, ChevronRight, Filter, ArrowUp, ArrowDown, Calendar, LayoutGrid, List, RotateCcw, Award, Gem, Star, Sparkles, AlertTriangle, Moon, AlertCircle, HeartCrack, Snowflake, UserX, UserPlus, HelpCircle, Users, TrendingUp, DollarSign, ShoppingBag, ShoppingCart, MapPin, BarChart3, Package } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CustomerDetailsModal from '../components/Customers/CustomerDetailsModal';
// Lazy load heavy analytics components for better initial load performance
const CohortAnalysisView = lazy(() => import('../components/Customers/CohortAnalysisView'));
const ProductAffinityView = lazy(() => import('../components/Customers/ProductAffinityView'));
const GeographicView = lazy(() => import('../components/Customers/GeographicView'));
import CustomerExport from '../components/Customers/CustomerExport';
import SkeletonCard from '../components/Common/SkeletonCard';
import SkeletonTable from '../components/Common/SkeletonTable';
import { calculateRFMScore, getSegmentColor, getSegmentIcon, getSegmentDescription } from '../utils/rfm';
import {
    calculateCLV,
    getCLVSegment,
    getCLVSegmentColor,
    calculateChurnRisk,
    calculateHealthScore,
    getLoyaltyStage,
    getCohortGroup,
    analyzeBehavioralPatterns,
    calculateProductAffinity
} from '../utils/customerMetrics';
import { parseAddress, getZoneColor } from '../utils/addressParser';

// Custom hook for debouncing search input to reduce re-renders
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

const Customers = () => {
    const { customers, orders, loading, customerMetrics, customerMetricsLoading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'lastOrder', direction: 'desc' });

    // Capture timestamp once on mount to avoid impure Date.now() calls in render
    const [currentTimestamp] = useState(() => Date.now());
    const [filters, setFilters] = useState({
        // Existing
        minOrders: '',
        minSpent: '',
        lastOrderDate: 'all',
        segment: 'all',

        // NEW filters
        churnRisk: 'all',
        clvSegment: 'all',
        loyaltyStage: 'all',
        zone: 'all',
        district: 'all'
    });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState('overview');

    // Segment Badge Component
    const SegmentBadge = ({ segment, size = 'sm' }) => {
        if (!segment) return null;

        const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
        const iconSize = size === 'sm' ? 12 : 14;
        const iconName = getSegmentIcon(segment);
        const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;

        return (
            <span
                className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${getSegmentColor(segment)} ${sizeClasses}`}
                title={getSegmentDescription(segment)}
            >
                <IconComponent size={iconSize} />
                <span>{segment}</span>
            </span>
        );
    };

    // Enrich customers with pre-computed metrics from backend
    const enrichedCustomers = useMemo(() => {
        if (!customers) return [];

        return customers.map(customer => {
            const metrics = customerMetrics[customer.phone] || {};

            return {
                // Customer info from newCustomers
                ...customer,

                // Pre-computed metrics from customerMetrics
                orders: metrics.totalOrders || 0,
                totalOrders: metrics.totalOrders || 0,
                totalSpent: metrics.totalSpent || 0,
                lastOrder: metrics.lastOrderTimestamp
                    ? new Date(metrics.lastOrderTimestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : '-',
                rawLastOrder: metrics.lastOrderTimestamp || 0,
                aov: metrics.aov || 0,
                rfm: metrics.rfm || {},
                clv: metrics.clv || 0,
                clvSegment: metrics.clvSegment || 'Medium',
                churnRisk: metrics.churnRisk || { level: 'low', score: 0 },
                healthScore: metrics.healthScore || 0,
                loyaltyStage: metrics.loyaltyStage || {},
                location: metrics.location || {},
                trend: metrics.trend || 0,
                cohort: metrics.cohort || '',
                behavior: metrics.behavior || {},
                productAffinity: metrics.productAffinity || []
            };
        });
    }, [customers, customerMetrics]);


    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const totalCustomers = enrichedCustomers.length;
        const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        const totalOrders = enrichedCustomers.reduce((sum, c) => sum + (c.orders || 0), 0);

        // Active customers (90 days)
        const cutoffDate = new Date(currentTimestamp - 90 * 24 * 60 * 60 * 1000);
        const activeCustomers = enrichedCustomers.filter(c =>
            c.rawLastOrder && new Date(c.rawLastOrder) >= cutoffDate
        ).length;

        // Average CLV
        const avgCLV = totalCustomers > 0
            ? enrichedCustomers.reduce((sum, c) => sum + (c.clv || 0), 0) / totalCustomers
            : 0;

        // Repurchase Rate
        const customersWithOrders = enrichedCustomers.filter(c => (c.orders || 0) >= 1).length;
        const customersWithRepurchase = enrichedCustomers.filter(c => (c.orders || 0) >= 2).length;
        const repurchaseRate = customersWithOrders > 0
            ? (customersWithRepurchase / customersWithOrders) * 100
            : 0;

        // High Churn Risk Count
        const highChurnRiskCount = enrichedCustomers.filter(c =>
            c.churnRisk?.level === 'high'
        ).length;

        // Average Health Score
        const avgHealthScore = totalCustomers > 0
            ? enrichedCustomers.reduce((sum, c) => sum + (c.healthScore || 0), 0) / totalCustomers
            : 0;

        return {
            totalCustomers,
            totalRevenue,
            totalOrders,
            activeCustomers,
            activeRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
            avgCLV,
            repurchaseRate,
            highChurnRiskCount,
            avgHealthScore
        };
    }, [enrichedCustomers, currentTimestamp]);

    const filteredCustomers = useMemo(() => {
        let result = enrichedCustomers.filter(customer =>
            (customer.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (customer.phone || '').includes(debouncedSearch) ||
            (customer.email || '').toLowerCase().includes(debouncedSearch.toLowerCase())
        );

        // Apply Filters
        if (filters.minOrders) {
            result = result.filter(c => c.orders >= Number(filters.minOrders));
        }
        if (filters.minSpent) {
            result = result.filter(c => c.totalSpent >= Number(filters.minSpent));
        }
        if (filters.lastOrderDate !== 'all') {
            const days = filters.lastOrderDate === '30days' ? 30 :
                         filters.lastOrderDate === '3months' ? 90 :
                         filters.lastOrderDate === 'year' ? 365 : 0;

            if (days > 0) {
                const cutoff = new Date(currentTimestamp - days * 24 * 60 * 60 * 1000);
                result = result.filter(c => {
                    if (!c.rawLastOrder) return false;
                    return new Date(c.rawLastOrder) >= cutoff;
                });
            }
        }
        if (filters.segment !== 'all') {
            result = result.filter(c => c.rfm?.segment === filters.segment);
        }

        // ===== NEW FILTERS =====

        // Churn Risk
        if (filters.churnRisk !== 'all') {
            result = result.filter(c => c.churnRisk?.level === filters.churnRisk);
        }

        // CLV Segment
        if (filters.clvSegment !== 'all') {
            result = result.filter(c => c.clvSegment === filters.clvSegment);
        }

        // Loyalty Stage
        if (filters.loyaltyStage !== 'all') {
            result = result.filter(c => c.loyaltyStage?.stage === filters.loyaltyStage);
        }

        // Zone
        if (filters.zone !== 'all') {
            result = result.filter(c => c.location?.zone === filters.zone);
        }

        // District
        if (filters.district !== 'all') {
            result = result.filter(c => c.location?.district === filters.district);
        }

        // Apply Sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortConfig.key) {
                case 'totalSpent':
                    comparison = a.totalSpent - b.totalSpent;
                    break;
                case 'orders':
                    comparison = a.orders - b.orders;
                    break;
                case 'lastOrder':
                    comparison = (a.rawLastOrder || 0) - (b.rawLastOrder || 0);
                    break;
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;

                // NEW SORT OPTIONS
                case 'clv':
                    comparison = (a.clv || 0) - (b.clv || 0);
                    break;
                case 'healthScore':
                    comparison = (a.healthScore || 0) - (b.healthScore || 0);
                    break;
                case 'churnRisk':
                    // Higher risk = higher score = show first
                    comparison = (a.churnRisk?.score || 0) - (b.churnRisk?.score || 0);
                    break;

                default:
                    comparison = 0;
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [enrichedCustomers, debouncedSearch, filters, sortConfig, currentTimestamp]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    // Auto-adjust currentPage if it exceeds totalPages
    const safePage = Math.min(currentPage, Math.max(1, totalPages));
    const currentCustomers = filteredCustomers.slice(
        (safePage - 1) * itemsPerPage,
        safePage * itemsPerPage
    );

    if (loading || customerMetricsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-heading">Customers</h1>
                    <p className="text-gray-600 mt-1.5">View and manage your customer base with RFM analytics</p>
                </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Total Customers */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                            <Users size={24} className="text-white" />
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-blue-700">Tỷ lệ hoạt động</p>
                            <p className="text-lg font-bold text-blue-900">{summaryStats.activeRate.toFixed(0)}%</p>
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-blue-900 mb-1">{summaryStats.totalCustomers}</h3>
                    <p className="text-sm text-blue-700 font-medium">Tổng khách hàng</p>
                    <p className="text-xs text-blue-600 mt-2">{summaryStats.activeCustomers} hoạt động trong 90 ngày</p>
                </div>

                {/* Card 2: Total Orders */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500 rounded-lg shadow-md">
                            <ShoppingCart size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-green-900 mb-1">
                        {new Intl.NumberFormat('vi-VN').format(summaryStats.totalOrders)}
                    </h3>
                    <p className="text-sm text-green-700 font-medium">Tổng đơn hàng</p>
                    <p className="text-xs text-green-600 mt-2">Từ tất cả khách hàng</p>
                </div>

                {/* Card 3: Average CLV (NEW) */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500 rounded-lg shadow-md">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-purple-900 mb-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(summaryStats.avgCLV)}
                    </h3>
                    <p className="text-sm text-purple-700 font-medium">CLV Trung bình</p>
                    <p className="text-xs text-purple-600 mt-2">Giá trị trọn đời khách hàng</p>
                </div>

                {/* Card 4: Repurchase Rate (NEW) */}
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-6 rounded-xl border border-cyan-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-cyan-500 rounded-lg shadow-md">
                            <ShoppingBag size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-cyan-900 mb-1">{summaryStats.repurchaseRate.toFixed(1)}%</h3>
                    <p className="text-sm text-cyan-700 font-medium">Tỷ lệ mua lại</p>
                    <p className="text-xs text-cyan-600 mt-2">Khách hàng có 2+ đơn hàng</p>
                </div>

                {/* Card 5: High Churn Risk (NEW) */}
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500 rounded-lg shadow-md">
                            <AlertCircle size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-red-900 mb-1">{summaryStats.highChurnRiskCount}</h3>
                    <p className="text-sm text-red-700 font-medium">Nguy cơ cao</p>
                    <p className="text-xs text-red-600 mt-2">Khách hàng cần chú ý ngay</p>
                </div>

                {/* Card 6: Customer Health (NEW) */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-xl border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500 rounded-lg shadow-md">
                            <Award size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-amber-900 mb-1">{summaryStats.avgHealthScore.toFixed(0)}</h3>
                    <p className="text-sm text-amber-700 font-medium">Sức khỏe TB</p>
                    <p className="text-xs text-amber-600 mt-2">Điểm trung bình 0-100</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative ${
                            activeTab === 'overview'
                                ? 'text-primary bg-primary/5'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Users className="w-5 h-5" />
                        <span>Tổng quan</span>
                        {activeTab === 'overview' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('cohort')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative ${
                            activeTab === 'cohort'
                                ? 'text-primary bg-primary/5'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        <span>Phân tích Cohort</span>
                        {activeTab === 'cohort' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative ${
                            activeTab === 'products'
                                ? 'text-primary bg-primary/5'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Package className="w-5 h-5" />
                        <span>Sản phẩm</span>
                        {activeTab === 'products' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('geographic')}
                        className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative ${
                            activeTab === 'geographic'
                                ? 'text-primary bg-primary/5'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <MapPin className="w-5 h-5" />
                        <span>Địa lý</span>
                        {activeTab === 'geographic' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>
            </div>

            {/* Persistent Filter Bar - Only show on overview tab */}
            {activeTab === 'overview' && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
                {/* Search Row */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, SĐT, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Row 1: Core Filters */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Sắp xếp</label>
                        <div className="flex gap-2">
                            <select
                                value={sortConfig.key}
                                onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                            >
                                <option value="totalSpent">Tổng chi tiêu</option>
                                <option value="orders">Số đơn hàng</option>
                                <option value="lastOrder">Đơn cuối</option>
                                <option value="name">Tên</option>
                                <option value="clv">CLV</option>
                                <option value="healthScore">Điểm sức khỏe</option>
                                <option value="churnRisk">Rủi ro cao nhất</option>
                            </select>
                            <button
                                onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                title={`Sắp xếp ${sortConfig.direction === 'asc' ? 'Giảm dần' : 'Tăng dần'}`}
                            >
                                {sortConfig.direction === 'asc' ? <ArrowUp size={18} className="text-gray-600" /> : <ArrowDown size={18} className="text-gray-600" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Đơn cuối</label>
                        <select
                            value={filters.lastOrderDate}
                            onChange={(e) => setFilters({ ...filters, lastOrderDate: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="30days">30 ngày</option>
                            <option value="3months">3 tháng</option>
                            <option value="year">1 năm</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phân khúc RFM</label>
                        <select
                            value={filters.segment}
                            onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="Champions">Champions</option>
                            <option value="Loyal">Loyal</option>
                            <option value="Potential Loyalists">Potential Loyalists</option>
                            <option value="New Customers">New Customers</option>
                            <option value="Promising">Promising</option>
                            <option value="Need Attention">Need Attention</option>
                            <option value="About to Sleep">About to Sleep</option>
                            <option value="At Risk">At Risk</option>
                            <option value="Cannot Lose Them">Cannot Lose Them</option>
                            <option value="Hibernating">Hibernating</option>
                            <option value="Lost">Lost</option>
                        </select>
                    </div>

                    {/* NEW: Churn Risk */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Rủi ro mất khách</label>
                        <select
                            value={filters.churnRisk}
                            onChange={(e) => setFilters({ ...filters, churnRisk: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="high">Cao</option>
                            <option value="medium">Trung bình</option>
                            <option value="low">Thấp</option>
                        </select>
                    </div>

                    {/* Row 2: Advanced Filters */}
                    {/* NEW: CLV Segment */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phân khúc CLV</label>
                        <select
                            value={filters.clvSegment}
                            onChange={(e) => setFilters({ ...filters, clvSegment: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="VIP">VIP (Top 10%)</option>
                            <option value="High">High (10-30%)</option>
                            <option value="Medium">Medium (30-70%)</option>
                            <option value="Low">Low (70%+)</option>
                        </select>
                    </div>

                    {/* NEW: Loyalty Stage */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Giai đoạn</label>
                        <select
                            value={filters.loyaltyStage}
                            onChange={(e) => setFilters({ ...filters, loyaltyStage: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="champion">Champion</option>
                            <option value="loyal">Trung thành</option>
                            <option value="growing">Phát triển</option>
                            <option value="new">Mới</option>
                            <option value="at_risk">Nguy cơ</option>
                            <option value="lost">Đã mất</option>
                        </select>
                    </div>

                    {/* NEW: Zone */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Khu vực</label>
                        <select
                            value={filters.zone}
                            onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="Trung tâm">Trung tâm</option>
                            <option value="Đông">Đông</option>
                            <option value="Nam">Nam</option>
                            <option value="Tây">Tây</option>
                            <option value="Bắc">Bắc</option>
                            <option value="Ngoại thành">Ngoại thành</option>
                        </select>
                    </div>

                    {/* NEW: District */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Quận/Huyện</label>
                        <select
                            value={filters.district}
                            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="Quận 1">Quận 1</option>
                            <option value="Quận 2">Quận 2</option>
                            <option value="Quận 3">Quận 3</option>
                            <option value="Quận 4">Quận 4</option>
                            <option value="Quận 5">Quận 5</option>
                            <option value="Quận 6">Quận 6</option>
                            <option value="Quận 7">Quận 7</option>
                            <option value="Quận 8">Quận 8</option>
                            <option value="Quận 9">Quận 9</option>
                            <option value="Quận 10">Quận 10</option>
                            <option value="Quận 11">Quận 11</option>
                            <option value="Quận 12">Quận 12</option>
                            <option value="Thủ Đức">Thủ Đức</option>
                            <option value="Bình Thạnh">Bình Thạnh</option>
                            <option value="Tân Bình">Tân Bình</option>
                            <option value="Tân Phú">Tân Phú</option>
                            <option value="Phú Nhuận">Phú Nhuận</option>
                            <option value="Gò Vấp">Gò Vấp</option>
                            <option value="Bình Tân">Bình Tân</option>
                            <option value="Hóc Môn">Hóc Môn</option>
                            <option value="Củ Chi">Củ Chi</option>
                            <option value="Bình Chánh">Bình Chánh</option>
                            <option value="Nhà Bè">Nhà Bè</option>
                            <option value="Cần Giờ">Cần Giờ</option>
                        </select>
                    </div>

                    {/* Row 3: Numeric Filters */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Số đơn tối thiểu</label>
                        <input
                            type="number"
                            min="0"
                            value={filters.minOrders}
                            onChange={(e) => setFilters({ ...filters, minOrders: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all hover:bg-gray-100"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Chi tiêu tối thiểu</label>
                        <input
                            type="number"
                            min="0"
                            value={filters.minSpent}
                            onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all hover:bg-gray-100"
                            placeholder="0"
                        />
                    </div>

                    {/* Spacer + Reset */}
                    <div className="md:col-span-2 lg:col-span-2 flex items-end justify-between">
                        {/* Filtered count */}
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-semibold text-gray-900">{filteredCustomers.length}</span> / {enrichedCustomers.length} khách hàng
                        </div>

                        {/* Reset button */}
                        <button
                            onClick={() => {
                                setFilters({
                                    minOrders: '',
                                    minSpent: '',
                                    lastOrderDate: 'all',
                                    segment: 'all',
                                    churnRisk: 'all',
                                    clvSegment: 'all',
                                    loyaltyStage: 'all',
                                    zone: 'all',
                                    district: 'all'
                                });
                                setSortConfig({ key: 'lastOrder', direction: 'desc' });
                                setSearchTerm('');
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                            <RotateCcw size={16} />
                            <span>Đặt lại</span>
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* List Controls Toolbar - Only show on overview tab */}
            {activeTab === 'overview' && (
            <div className="flex justify-between items-center mb-4">
                {/* Export Button */}
                <CustomerExport customers={filteredCustomers} />

                {/* View Controls */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Show:</label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* Tab Content */}
            {activeTab === 'overview' && (
            <>
            {loading ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(9)].map((_, i) => (
                            <SkeletonCard key={i} lines={5} showIcon={true} />
                        ))}
                    </div>
                ) : (
                    <SkeletonTable rows={10} columns={6} />
                )
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentCustomers.length > 0 ? (
                        currentCustomers.map((customer) => {
                            // Calculate customer tenure using stable timestamp
                            const tenureDays = customer.createdAt ? Math.floor((currentTimestamp - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            const tenureMonths = Math.floor(tenureDays / 30);

                            // Get colors for new badges
                            const clvColors = getCLVSegmentColor(customer.clvSegment);
                            const zoneColors = getZoneColor(customer.location?.zone);
                            const churnColor = customer.churnRisk?.level === 'high' ? 'bg-red-500' :
                                             customer.churnRisk?.level === 'medium' ? 'bg-orange-500' : 'bg-green-500';

                            return (
                                <div
                                    key={customer.id}
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-xl font-heading flex-shrink-0 relative">
                                                {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                                                {/* Churn Risk Dot */}
                                                <div
                                                    className={`absolute -top-1 -right-1 w-4 h-4 ${churnColor} rounded-full border-2 border-white`}
                                                    title={`Rủi ro: ${customer.churnRisk?.label || 'N/A'}`}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {/* Name + CLV Badge */}
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-gray-900 font-heading text-lg truncate">{customer.name || 'Unknown'}</h3>
                                                    {/* CLV Segment Badge */}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${clvColors}`}>
                                                        {customer.clvSegment}
                                                    </span>
                                                </div>
                                                <SegmentBadge segment={customer.rfm?.segment} size="sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                            <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                            <span>{customer.phone || 'N/A'}</span>
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{customer.email}</span>
                                            </div>
                                        )}
                                        {/* Zone Label (NEW) */}
                                        {customer.location?.zone && customer.location.zone !== 'Unknown' && (
                                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${zoneColors.bg} ${zoneColors.text} ${zoneColors.border}`}>
                                                    {customer.location.zone}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-xs font-medium text-gray-500 mb-1">Customer Since</p>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {tenureMonths > 0 ? `${tenureMonths}mo` : `${tenureDays}d`}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-primary/5 p-3 rounded-lg">
                                            <p className="text-xs font-medium text-primary/70 mb-1">Lifetime Value</p>
                                            <p className="font-bold text-primary text-sm">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.totalSpent) || 0)}
                                            </p>
                                            <p className="text-xs text-primary/70 mt-0.5">{customer.orders} orders</p>
                                        </div>
                                    </div>

                                    {/* Health Score Bar (NEW) */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="font-medium text-gray-600">Sức khỏe</span>
                                            <span className="font-bold text-gray-900">{customer.healthScore || 0}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${
                                                    customer.healthScore >= 80 ? 'bg-green-500' :
                                                    customer.healthScore >= 60 ? 'bg-blue-500' :
                                                    customer.healthScore >= 40 ? 'bg-yellow-500' :
                                                    customer.healthScore >= 20 ? 'bg-orange-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${customer.healthScore || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
                                        <div className="text-center">
                                            <p className="text-xs font-medium text-gray-500 mb-1">Orders</p>
                                            <p className="font-bold text-gray-900 text-base">{customer.orders}</p>
                                        </div>
                                        <div className="text-center border-l border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 mb-1">AOV</p>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.aov) || 0)}
                                            </p>
                                        </div>
                                        <div className="text-center border-l border-gray-100">
                                            <p className="text-xs font-medium text-gray-500 mb-1">Last</p>
                                            <p className="font-bold text-gray-900 text-xs truncate">{customer.lastOrder}</p>
                                        </div>
                                    </div>

                                    <button className="w-full mt-3 py-2.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group-hover:bg-primary/10">
                                        View Full Profile
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No customers found
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/80 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Segment</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Location</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-center">Health</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-center">Tenure</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-center">Orders</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">AOV</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">LTV</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Last Order</th>
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentCustomers.length > 0 ? (
                                    currentCustomers.map((customer) => {
                                        const tenureDays = customer.createdAt ? Math.floor((currentTimestamp - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                        const tenureMonths = Math.floor(tenureDays / 30);

                                        // Get colors for new badges
                                        const clvColors = getCLVSegmentColor(customer.clvSegment);
                                        const zoneColors = getZoneColor(customer.location?.zone);
                                        const churnColor = customer.churnRisk?.level === 'high' ? 'bg-red-500' :
                                                         customer.churnRisk?.level === 'medium' ? 'bg-orange-500' : 'bg-green-500';

                                        return (
                                            <tr
                                                key={customer.id}
                                                onClick={() => setSelectedCustomer(customer)}
                                                className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold font-heading flex-shrink-0 relative">
                                                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                                                            {/* Churn Risk Dot */}
                                                            <div
                                                                className={`absolute -top-1 -right-1 w-3 h-3 ${churnColor} rounded-full border-2 border-white`}
                                                                title={`Rủi ro: ${customer.churnRisk?.label || 'N/A'}`}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="font-semibold text-gray-900 truncate">{customer.name || 'Unknown'}</div>
                                                                {/* CLV Badge */}
                                                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${clvColors}`}>
                                                                    {customer.clvSegment}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <SegmentBadge segment={customer.rfm?.segment} size="sm" />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                                                        {customer.phone && (
                                                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                                                <Phone size={13} className="text-gray-400 flex-shrink-0" />
                                                                <span>{customer.phone}</span>
                                                            </div>
                                                        )}
                                                        {customer.email && (
                                                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                                                <Mail size={13} className="text-gray-400 flex-shrink-0" />
                                                                <span className="truncate max-w-[180px]">{customer.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Location Column (NEW) */}
                                                <td className="px-5 py-4">
                                                    {customer.location?.zone && customer.location.zone !== 'Unknown' ? (
                                                        <div>
                                                            <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium border ${zoneColors.bg} ${zoneColors.text} ${zoneColors.border}`}>
                                                                {customer.location.zone}
                                                            </span>
                                                            {customer.location?.district && customer.location.district !== 'Unknown' && (
                                                                <div className="text-xs text-gray-500 mt-1">{customer.location.district}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Unknown</span>
                                                    )}
                                                </td>
                                                {/* Health Score Column (NEW) */}
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-semibold text-gray-900 text-sm mb-1">
                                                            {customer.healthScore || 0}
                                                        </span>
                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${
                                                                    customer.healthScore >= 80 ? 'bg-green-500' :
                                                                    customer.healthScore >= 60 ? 'bg-blue-500' :
                                                                    customer.healthScore >= 40 ? 'bg-yellow-500' :
                                                                    customer.healthScore >= 20 ? 'bg-orange-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${customer.healthScore || 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-semibold text-gray-900 text-sm">
                                                            {tenureMonths > 0 ? `${tenureMonths}mo` : `${tenureDays}d`}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                        {customer.orders}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-semibold text-gray-900">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.aov) || 0)}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-primary">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(Number(customer.totalSpent) || 0)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {customer.orders > 0 ? `${customer.orders} orders` : 'No orders'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-gray-600 text-sm">
                                                    {customer.lastOrder}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="px-5 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search size={40} className="text-gray-300" />
                                                <p className="font-medium">No customers found</p>
                                                <p className="text-sm text-gray-400">Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {filteredCustomers.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-8 border-t border-gray-100 pt-4">
                    <div className="text-sm text-gray-500">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-medium">{filteredCustomers.length}</span> customers
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                                ? 'bg-primary text-white'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
            </>
            )}

            {/* Cohort Analysis Tab */}
            {activeTab === 'cohort' && (
                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading cohort analysis...</p>
                        </div>
                    </div>
                }>
                    <CohortAnalysisView customers={enrichedCustomers} orders={orders} />
                </Suspense>
            )}

            {/* Product Affinity Tab */}
            {activeTab === 'products' && (
                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading product affinity...</p>
                        </div>
                    </div>
                }>
                    <ProductAffinityView customers={enrichedCustomers} orders={orders} />
                </Suspense>
            )}

            {/* Geographic View Tab */}
            {activeTab === 'geographic' && (
                <Suspense fallback={
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading geographic view...</p>
                        </div>
                    </div>
                }>
                    <GeographicView customers={enrichedCustomers} />
                </Suspense>
            )}

            {/* Customer Details Modal */}
            <CustomerDetailsModal
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                customer={selectedCustomer}
                orders={orders}
            />
        </div>
    );
};

export default Customers;
