import React, { useState, useMemo } from 'react';
import { Search, Mail, Phone, MoreHorizontal, ChevronLeft, ChevronRight, Filter, ArrowUp, ArrowDown, Calendar, LayoutGrid, List, RotateCcw, Award, Gem, Star, Sparkles, AlertTriangle, Moon, AlertCircle, HeartCrack, Snowflake, UserX, UserPlus, HelpCircle, Users, TrendingUp, DollarSign, ShoppingBag, MapPin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CustomerDetailsModal from '../components/Customers/CustomerDetailsModal';
import SkeletonCard from '../components/Common/SkeletonCard';
import SkeletonTable from '../components/Common/SkeletonTable';
import { calculateRFMScore, getSegmentColor, getSegmentIcon, getSegmentDescription } from '../utils/rfm';

const Customers = () => {
    const { customers, orders, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'lastOrder', direction: 'desc' });
    const [filters, setFilters] = useState({ minOrders: '', minSpent: '', lastOrderDate: 'all', segment: 'all' });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [itemsPerPage, setItemsPerPage] = useState(10);

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

    // Enrich customers with order data and RFM analytics
    const enrichedCustomers = useMemo(() => {
        if (!customers || !orders) return [];

        // Step 1: Enrich with basic metrics
        const withBasicMetrics = customers.map(customer => {
            const customerOrders = orders.filter(order =>
                order.customer.phone === customer.phone
            );

            const totalOrders = customerOrders.length;
            const totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.rawPrice) || 0), 0);

            // Find last order date
            let lastOrderDate = '-';
            let rawLastOrder = 0;
            if (customerOrders.length > 0) {
                // Sort by date descending
                const sortedOrders = [...customerOrders].sort((a, b) => {
                    const dateA = a.timeline?.received?.raw || new Date(0);
                    const dateB = b.timeline?.received?.raw || new Date(0);
                    return dateB - dateA;
                });
                lastOrderDate = sortedOrders[0]?.timeline?.received?.date || '-';
                rawLastOrder = sortedOrders[0]?.timeline?.received?.raw || 0;
            }

            // Calculate AOV (Average Order Value)
            const aov = totalOrders > 0 ? totalSpent / totalOrders : 0;

            return {
                ...customer,
                orders: totalOrders,
                totalSpent: totalSpent,
                lastOrder: lastOrderDate,
                rawLastOrder: rawLastOrder,
                aov: aov
            };
        });

        // Step 2: Calculate RFM scores for all customers
        const withRFM = withBasicMetrics.map(customer => ({
            ...customer,
            rfm: calculateRFMScore(customer, withBasicMetrics)
        }));

        return withRFM;
    }, [customers, orders]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const totalCustomers = enrichedCustomers.length;
        const totalRevenue = enrichedCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        const avgOrderValue = totalCustomers > 0 ? enrichedCustomers.reduce((sum, c) => sum + (c.aov || 0), 0) / totalCustomers : 0;
        const totalOrders = enrichedCustomers.reduce((sum, c) => sum + (c.orders || 0), 0);

        // Calculate active customers (ordered in last 90 days)
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const activeCustomers = enrichedCustomers.filter(c =>
            c.rawLastOrder && new Date(c.rawLastOrder) >= cutoffDate
        ).length;

        return {
            totalCustomers,
            totalRevenue,
            avgOrderValue,
            totalOrders,
            activeCustomers,
            activeRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0
        };
    }, [enrichedCustomers]);

    const filteredCustomers = useMemo(() => {
        let result = enrichedCustomers.filter(customer =>
            (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone || '').includes(searchTerm) ||
            (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                result = result.filter(c => {
                    if (!c.rawLastOrder) return false;
                    return new Date(c.rawLastOrder) >= cutoff;
                });
            }
        }
        if (filters.segment !== 'all') {
            result = result.filter(c => c.rfm?.segment === filters.segment);
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
                default:
                    comparison = 0;
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [enrichedCustomers, searchTerm, filters, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const currentCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search or itemsPerPage changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    if (loading) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                            <Users size={24} className="text-white" />
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-blue-700">Active Rate</p>
                            <p className="text-lg font-bold text-blue-900">{summaryStats.activeRate.toFixed(0)}%</p>
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-blue-900 mb-1">{summaryStats.totalCustomers}</h3>
                    <p className="text-sm text-blue-700 font-medium">Total Customers</p>
                    <p className="text-xs text-blue-600 mt-2">{summaryStats.activeCustomers} active in last 90 days</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500 rounded-lg shadow-md">
                            <DollarSign size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-green-900 mb-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(summaryStats.totalRevenue)}
                    </h3>
                    <p className="text-sm text-green-700 font-medium">Total Revenue</p>
                    <p className="text-xs text-green-600 mt-2">From all customer purchases</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500 rounded-lg shadow-md">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-purple-900 mb-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(summaryStats.avgOrderValue)}
                    </h3>
                    <p className="text-sm text-purple-700 font-medium">Average Order Value</p>
                    <p className="text-xs text-purple-600 mt-2">Across all customers</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-xl border border-orange-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-500 rounded-lg shadow-md">
                            <ShoppingBag size={24} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-orange-900 mb-1">{summaryStats.totalOrders}</h3>
                    <p className="text-sm text-orange-700 font-medium">Total Orders</p>
                    <p className="text-xs text-orange-600 mt-2">
                        Avg {summaryStats.totalCustomers > 0 ? (summaryStats.totalOrders / summaryStats.totalCustomers).toFixed(1) : 0} orders/customer
                    </p>
                </div>
            </div>

            {/* Persistent Filter Bar */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
                {/* Search Row */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm transition-all placeholder:text-gray-400"
                    />
                </div>

                <div className="flex flex-wrap gap-3 items-end justify-between">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Sort By</label>
                        <div className="flex gap-2">
                            <select
                                value={sortConfig.key}
                                onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                            >
                                <option value="totalSpent">Total Spent</option>
                                <option value="orders">Total Orders</option>
                                <option value="lastOrder">Last Order</option>
                                <option value="name">Name</option>
                            </select>
                            <button
                                onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                title={`Sort ${sortConfig.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                {sortConfig.direction === 'asc' ? <ArrowUp size={18} className="text-gray-600" /> : <ArrowDown size={18} className="text-gray-600" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Last Order</label>
                        <select
                            value={filters.lastOrderDate}
                            onChange={(e) => setFilters({ ...filters, lastOrderDate: e.target.value })}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">All Time</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="3months">Last 3 Months</option>
                            <option value="year">Last Year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Min Orders</label>
                        <input
                            type="number"
                            min="0"
                            value={filters.minOrders}
                            onChange={(e) => setFilters({ ...filters, minOrders: e.target.value })}
                            className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all hover:bg-gray-100"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Min Spent</label>
                        <input
                            type="number"
                            min="0"
                            value={filters.minSpent}
                            onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                            className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all hover:bg-gray-100"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Segment</label>
                        <select
                            value={filters.segment}
                            onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
                            className="min-w-[140px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">All Segments</option>
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
                    <button
                        onClick={() => {
                            setFilters({ minOrders: '', minSpent: '', lastOrderDate: 'all', segment: 'all' });
                            setSortConfig({ key: 'lastOrder', direction: 'desc' });
                            setSearchTerm('');
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        title="Reset All Filters"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>
            </div>

            {/* List Controls Toolbar */}
            <div className="flex justify-end mb-4">
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
                            // Calculate customer tenure
                            const tenureDays = customer.createdAt ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            const tenureMonths = Math.floor(tenureDays / 30);

                            return (
                                <div
                                    key={customer.id}
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-xl font-heading flex-shrink-0">
                                                {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 font-heading text-lg mb-1.5 truncate">{customer.name || 'Unknown'}</h3>
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
                                        {customer.address && (
                                            <div className="flex items-start gap-2.5 text-sm text-gray-600">
                                                <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                <span className="line-clamp-2 text-xs leading-relaxed">{customer.address}</span>
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
                                    <th className="px-5 py-3.5 font-semibold text-xs text-gray-600 uppercase tracking-wider">Address</th>
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
                                        const tenureDays = customer.createdAt ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                        const tenureMonths = Math.floor(tenureDays / 30);

                                        return (
                                            <tr
                                                key={customer.id}
                                                onClick={() => setSelectedCustomer(customer)}
                                                className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold font-heading flex-shrink-0">
                                                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-gray-900 truncate">{customer.name || 'Unknown'}</div>
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
                                                <td className="px-5 py-4 max-w-[200px]">
                                                    {customer.address ? (
                                                        <div className="flex items-start gap-2 text-gray-600 text-sm">
                                                            <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                            <span className="line-clamp-2 text-xs">{customer.address}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No address</span>
                                                    )}
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
                                        <td colSpan="10" className="px-5 py-16 text-center text-gray-500">
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
