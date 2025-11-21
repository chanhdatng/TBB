import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, CheckCircle2, Clock, XCircle, Trash2, Edit2, User, CakeSlice, Layers } from 'lucide-react';
import CreateOrderModal from '../components/Orders/CreateOrderModal';
import DateSelector from '../components/Orders/DateSelector';
import AdvancedFilterModal from '../components/Orders/AdvancedFilterModal';
import OrderDetailsModal from '../components/Orders/OrderDetailsModal';
import { database } from '../firebase';
import { ref, set, update, remove } from "firebase/database";
import { useData } from '../contexts/DataContext';

const Orders = () => {
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

    const { orders } = useData();
    // Initialize with today's date in YYYY-MM-DD format (Local Time)
    const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Order Details Modal State
    const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Advanced Filter & Sort State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        cakeTypes: [],
        status: [],
        minPrice: '',
        maxPrice: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: 'receiveDate', direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');

    const handleCreateOrder = (newOrder) => {
        set(ref(database, 'orders/' + newOrder.id), newOrder);
    };

    const handleStatusChange = (id, currentStatus) => {
        const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
        update(ref(database, 'orders/' + id), {
            status: newStatus
        });
    };

    const handleDeleteOrder = (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            remove(ref(database, 'orders/' + id));
        }
    };

    const handleEditOrder = (id) => {
        console.log('Edit order:', id);
    };

    const handleOpenDetails = (order) => {
        setSelectedOrderForDetails(order);
        setIsDetailsModalOpen(true);
    };

    // Helper to highlight text
    const HighlightText = ({ text, highlight }) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? <span key={i} className="bg-yellow-200 text-gray-900">{part}</span> : part
                )}
            </span>
        );
    };

    // Extract available cake types for filter, based on selected date
    const availableCakeTypes = useMemo(() => {
        const types = new Set();
        const ordersToConsider = selectedDate
            ? orders.filter(order => order.date === selectedDate)
            : orders;

        ordersToConsider.forEach(order => {
            order.items.forEach(item => types.add(item.name));
        });
        return Array.from(types).sort();
    }, [orders, selectedDate]);

    // Calculate order counts per date
    const orderCounts = useMemo(() => {
        const counts = {};
        orders.forEach(order => {
            counts[order.date] = (counts[order.date] || 0) + 1;
        });
        return counts;
    }, [orders]);

    const filteredAndSortedOrders = useMemo(() => {
        let result = orders;

        // 1. Date Filter
        if (selectedDate) {
            result = result.filter(order => order.date === selectedDate);
        }

        // 2. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(order =>
                order.customer.name.toLowerCase().includes(query) ||
                order.customer.phone.includes(query) ||
                order.customer.address.toLowerCase().includes(query) ||
                order.id.toLowerCase().includes(query)
            );
        }

        // 3. Advanced Filters
        if (advancedFilters.status.length > 0) {
            result = result.filter(order => advancedFilters.status.includes(order.status));
        }

        if (advancedFilters.cakeTypes.length > 0) {
            result = result.filter(order =>
                order.items.some(item => advancedFilters.cakeTypes.includes(item.name))
            );
        }

        if (advancedFilters.minPrice) {
            result = result.filter(order => order.rawPrice >= Number(advancedFilters.minPrice));
        }

        if (advancedFilters.maxPrice) {
            result = result.filter(order => order.rawPrice <= Number(advancedFilters.maxPrice));
        }

        // 4. Sorting
        result.sort((a, b) => {
            let comparison = 0;
            if (sortConfig.key === 'receiveDate') {
                comparison = a.timeline.received.raw - b.timeline.received.raw;
            } else if (sortConfig.key === 'customerName') {
                comparison = a.customer.name.localeCompare(b.customer.name);
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [orders, selectedDate, searchQuery, advancedFilters, sortConfig]);

    // Calculate max price for filter
    const maxOrderPrice = useMemo(() => {
        return Math.max(...orders.map(o => o.rawPrice), 1000000); // Default to 1M if no orders
    }, [orders]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 mt-1">Manage and track your bakery orders</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Filter size={20} />
                        Filter
                        {(advancedFilters.status.length > 0 || advancedFilters.cakeTypes.length > 0 || advancedFilters.minPrice || advancedFilters.maxPrice) && (
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={20} />
                        Add Order
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <DateSelector
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    orderCounts={orderCounts}
                />
            </div>

            <CreateOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreateOrder={handleCreateOrder}
            />

            <AdvancedFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={setAdvancedFilters}
                availableCakeTypes={availableCakeTypes}
                initialFilters={advancedFilters}
                maxPriceLimit={maxOrderPrice}
                statusOptions={[
                    { value: 'All', label: 'Tất cả', icon: Layers, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
                    { value: 'Pending', label: 'Đặt trước', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                    { value: 'Completed', label: 'Hoàn thành', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                    { value: 'Cancelled', label: 'Đã hủy', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                ]}
            />

            <OrderDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                order={selectedOrderForDetails}
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, phone, address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Sort by:</span>
                        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <button
                                onClick={() => handleSort('receiveDate')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${sortConfig.key === 'receiveDate'
                                    ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Time
                                {sortConfig.key === 'receiveDate' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                )}
                            </button>
                            <button
                                onClick={() => handleSort('customerName')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${sortConfig.key === 'customerName'
                                    ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Name
                                {sortConfig.key === 'customerName' && (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[220px]">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">Order Details</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAndSortedOrders.length > 0 ? (
                                filteredAndSortedOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => handleOpenDetails(order)}
                                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                    >
                                        {/* Customer Info */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                    <User size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-gray-900 truncate">
                                                        <HighlightText text={order.customer.name} highlight={searchQuery} />
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">{order.customer.phone}</div>
                                                    <div className="text-xs text-gray-400 line-clamp-1" title={order.customer.address}>
                                                        <HighlightText text={order.customer.address} highlight={searchQuery} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Order Details */}
                                        <td className="px-4 py-4">
                                            {order.items.length > 1 ? (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 w-fit group-hover:bg-white group-hover:border-gray-200 transition-all" title={order.items.map(i => `${i.amount}x ${i.name}`).join(', ')}>
                                                    <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                        <Layers size={14} className="text-gray-400" />
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                                        {order.items.length} loại bánh
                                                    </div>
                                                </div>
                                            ) : order.items.length === 1 ? (
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 w-full max-w-[160px] group-hover:bg-white group-hover:border-gray-200 transition-all">
                                                    <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                        <CakeSlice size={14} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate" title={order.items[0].name}>
                                                            {order.items[0].name}
                                                        </div>
                                                    </div>
                                                    <div className="px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-sm flex-shrink-0">
                                                        x{order.items[0].amount}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">No items</span>
                                            )}
                                        </td>

                                        {/* Timeline */}
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                                {order.timeline.received.time}
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary">
                                            {order.price}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(order.id, order.status);
                                                }}
                                                className={`
                                                    inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors
                                                    ${order.status === 'Completed' ? 'bg-green-100 text-green-600 hover:bg-green-200' :
                                                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' :
                                                            'bg-red-100 text-red-600 hover:bg-red-200'
                                                    }
                                                `}
                                                title={`Status: ${order.status}`}
                                            >
                                                {order.status === 'Completed' ? <CheckCircle size={18} /> :
                                                    order.status === 'Pending' ? <Clock size={18} /> :
                                                        <XCircle size={18} />
                                                }
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditOrder(order.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Edit Order"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteOrder(order.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Search size={24} className="text-gray-400" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">No orders found</p>
                                            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Orders;
