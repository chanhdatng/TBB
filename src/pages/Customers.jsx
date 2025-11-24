import React, { useState, useMemo } from 'react';
import { Search, Mail, Phone, MoreHorizontal, ChevronLeft, ChevronRight, Filter, ArrowUp, ArrowDown, Calendar, LayoutGrid, List, RotateCcw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CustomerDetailsModal from '../components/Customers/CustomerDetailsModal';

const Customers = () => {
    const { customers, orders, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'lastOrder', direction: 'desc' });
    const [filters, setFilters] = useState({ minOrders: '', minSpent: '', lastOrderDate: 'all' });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Enrich customers with order data
    const enrichedCustomers = useMemo(() => {
        if (!customers || !orders) return [];
        return customers.map(customer => {
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

            return {
                ...customer,
                orders: totalOrders,
                totalSpent: totalSpent,
                lastOrder: lastOrderDate,
                rawLastOrder: rawLastOrder
            };
        });
    }, [customers, orders]);

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
            const now = new Date();
            const days = filters.lastOrderDate === '30days' ? 30 :
                         filters.lastOrderDate === '3months' ? 90 :
                         filters.lastOrderDate === 'year' ? 365 : 0;
            
            if (days > 0) {
                const cutoff = new Date(now.setDate(now.getDate() - days));
                result = result.filter(c => {
                    if (!c.rawLastOrder) return false;
                    return new Date(c.rawLastOrder) >= cutoff;
                });
            }
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
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 mt-1">View and manage your customer base</p>
                </div>
            </div>

            {/* Persistent Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 space-y-4">
                {/* Search Row */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-base"
                    />
                </div>

                <div className="flex flex-wrap gap-4 items-end justify-between">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <div className="flex gap-2">
                            <select
                                value={sortConfig.key}
                                onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="totalSpent">Total Spent</option>
                                <option value="orders">Total Orders</option>
                                <option value="lastOrder">Last Order</option>
                                <option value="name">Name</option>
                            </select>
                            <button
                                onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                            >
                                {sortConfig.direction === 'asc' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Order</label>
                        <select
                            value={filters.lastOrderDate}
                            onChange={(e) => setFilters({ ...filters, lastOrderDate: e.target.value })}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">All Time</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="3months">Last 3 Months</option>
                            <option value="year">Last Year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Orders</label>
                        <input
                            type="number"
                            min="0"
                            value={filters.minOrders}
                            onChange={(e) => setFilters({ ...filters, minOrders: e.target.value })}
                            className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Spent</label>
                        <input
                            type="number"
                            min="0"
                            value={filters.minSpent}
                            onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                            className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="0"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setFilters({ minOrders: '', minSpent: '', lastOrderDate: 'all' });
                            setSortConfig({ key: 'lastOrder', direction: 'desc' });
                            setSearchTerm('');
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Reset Filters"
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

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentCustomers.length > 0 ? (
                        currentCustomers.map((customer) => (
                            <div 
                                key={customer.id} 
                                onClick={() => setSelectedCustomer(customer)}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{customer.name || 'Unknown'}</h3>
                                            <p className="text-xs text-gray-500">
                                                Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {customer.email && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Mail size={16} className="text-gray-400" />
                                            {customer.email}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone size={16} className="text-gray-400" />
                                        {customer.phone || 'N/A'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Orders</p>
                                        <p className="font-bold text-gray-900">{customer.orders}</p>
                                    </div>
                                    <div className="text-center border-l border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Spent</p>
                                        <p className="font-bold text-gray-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(customer.totalSpent) || 0)}
                                        </p>
                                    </div>
                                    <div className="text-center border-l border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Last Order</p>
                                        <p className="font-bold text-gray-900">{customer.lastOrder}</p>
                                    </div>
                                </div>

                                <button className="w-full mt-4 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                                    View Profile
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No customers found
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-gray-500">Customer</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Contact</th>
                                    <th className="px-6 py-4 font-medium text-gray-500 text-center">Orders</th>
                                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Spent</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Last Order</th>
                                    <th className="px-6 py-4 font-medium text-gray-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentCustomers.length > 0 ? (
                                    currentCustomers.map((customer) => (
                                        <tr 
                                            key={customer.id}
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{customer.name || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">
                                                            Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Phone size={14} className="text-gray-400" />
                                                            {customer.phone}
                                                        </div>
                                                    )}
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Mail size={14} className="text-gray-400" />
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {customer.orders}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(customer.totalSpent) || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {customer.lastOrder}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No customers found
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
