import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Search, Filter, Eye, MapPin, Clock, MessageSquare, Layers, Facebook, Instagram, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { database } from '../firebase';
import { ref, update } from "firebase/database";
import { useData } from '../contexts/DataContext';
import DateSelector from '../components/Orders/DateSelector';
import AdvancedFilterModal from '../components/Orders/AdvancedFilterModal';
import ConfirmPreOrderModal from '../components/Orders/ConfirmPreOrderModal';
import OrderDetailsModal from '../components/Orders/OrderDetailsModal';

const PreOrders = () => {
    // Helper to format date as YYYY-MM-DD in local time
    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const { preOrders } = useData();
    const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [advancedFilters, setAdvancedFilters] = useState({
        cakeTypes: [],
        status: [],
        minPrice: '',
        maxPrice: ''
    });

    // Confirm Modal State
    const [selectedOrderForConfirm, setSelectedOrderForConfirm] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedOrderIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedOrderIds(newExpanded);
    };

    const handleAction = (order, action) => {
        if (action === 'reject') {
            if (window.confirm('Bạn có chắc chắn muốn từ chối đơn hàng này không?')) {
                update(ref(database, 'preorders/' + order.id), {
                    state: 'cancelled'
                });
            }
        } else if (action === 'confirm') {
            setSelectedOrderForConfirm(order);
            setIsConfirmModalOpen(true);
        }
    };

    const handleConfirmOrder = (id, data) => {
        update(ref(database, 'preorders/' + id), {
            state: 'accepted',
            shipFee: data.shipFee,
            discount: data.discount,
            total: data.total
        });
        setIsConfirmModalOpen(false);
    };

    // --- Filtering Logic ---

    // Calculate order counts per date
    const orderCounts = useMemo(() => {
        const counts = {};
        preOrders.forEach(order => {
            if (order.filterDate) {
                counts[order.filterDate] = (counts[order.filterDate] || 0) + 1;
            }
        });
        return counts;
    }, [preOrders]);

    // Extract available cake types for filter
    const availableCakeTypes = useMemo(() => {
        const types = new Set();
        const ordersToConsider = selectedDate
            ? preOrders.filter(order => order.filterDate === selectedDate)
            : preOrders;

        ordersToConsider.forEach(order => {
            order.items.forEach(item => types.add(item.name));
        });
        return Array.from(types).sort();
    }, [preOrders, selectedDate]);

    // Calculate max price for filter
    const maxOrderPrice = useMemo(() => {
        if (preOrders.length === 0) return 1000000;
        return Math.max(...preOrders.map(o => o.rawTotal || 0), 1000000);
    }, [preOrders]);

    const filteredAndSortedPreOrders = useMemo(() => {
        let result = preOrders;

        // 1. Date Filter
        if (selectedDate) {
            result = result.filter(order => order.filterDate === selectedDate);
        }

        // 2. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(order =>
                (order.customer?.name || '').toLowerCase().includes(query) ||
                (order.customer?.phone || '').includes(query) ||
                (order.customer?.address || '').toLowerCase().includes(query) ||
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
            result = result.filter(order => (order.rawTotal || 0) >= Number(advancedFilters.minPrice));
        }

        if (advancedFilters.maxPrice) {
            result = result.filter(order => (order.rawTotal || 0) <= Number(advancedFilters.maxPrice));
        }

        return result;
    }, [preOrders, selectedDate, searchQuery, advancedFilters]);

    const handleRowClick = (order) => {
        if (['pending', 'waiting'].includes(order.status.toLowerCase())) {
            setSelectedOrderForConfirm({
                ...order,
                timeline: {
                    received: {
                        date: selectedDate,
                        time: order.time
                    }
                },
                price: order.total
            });
            setIsConfirmModalOpen(true);
        } else {
            setSelectedOrder({
                ...order,
                timeline: {
                    received: {
                        date: selectedDate,
                        time: order.time
                    }
                },
                price: order.total
            });
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pre-Orders</h1>
                <p className="text-gray-500 mt-1">Review and approve incoming customer orders</p>
            </div>

            <div className="mb-6">
                <DateSelector
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    orderCounts={orderCounts}
                />
            </div>

            <AdvancedFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={setAdvancedFilters}
                availableCakeTypes={availableCakeTypes}
                initialFilters={advancedFilters}
                maxPriceLimit={maxOrderPrice}
                statusOptions={[
                    { value: 'All', label: 'All', icon: Layers, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
                    { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                    { value: 'accepted', label: 'Accepted', icon: Check, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                    { value: 'cancelled', label: 'Cancelled', icon: X, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                ]}
            />

            <ConfirmPreOrderModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmOrder}
                onReject={(orderId) => handleAction({ id: orderId }, 'reject')}
                order={selectedOrderForConfirm}
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search pre-orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="List View"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            <Filter size={16} />
                            Filter
                            {(advancedFilters.status.length > 0 || advancedFilters.cakeTypes.length > 0 || advancedFilters.minPrice || advancedFilters.maxPrice) && (
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                            )}
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase bg-gray-50 rounded-tl-2xl pl-6">Customer</th>
                                    <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase bg-gray-50">Address</th>
                                    <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase bg-gray-50">Time</th>
                                    <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase bg-gray-50">Items</th>
                                    <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase bg-gray-50">Total</th>
                                    <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase bg-gray-50 rounded-tr-2xl text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAndSortedPreOrders.length > 0 ? (
                                    filteredAndSortedPreOrders.map((order) => {
                                        const isExpanded = expandedOrderIds.has(order.id);
                                        const totalItems = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.amount), 0) : 0;

                                        return (
                                            <React.Fragment key={order.id}>
                                                <tr
                                                    className={`hover:bg-gray-50 transition-colors group cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                                                    onClick={() => handleRowClick(order)}
                                                >
                                                    <td className="px-4 py-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            {order.customer?.socialLink && (
                                                                <a
                                                                    href={order.customer.socialLink}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
                                                                >
                                                                    {order.customer.socialLink.includes('instagram') ? <Instagram size={14} /> : <Facebook size={14} />}
                                                                </a>
                                                            )}
                                                            <div>
                                                                <div className="font-medium text-gray-900">{order.customer?.name || 'Unknown'}</div>
                                                                <div className="text-xs text-gray-500">{order.customer?.phone}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-xs text-gray-600 max-w-[200px]">
                                                            <span className="line-clamp-2" title={order.customer?.address}>{order.customer?.address || 'No address'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md w-fit">
                                                            <span>{order.time}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleRow(order.id); }}
                                                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                                                        >
                                                            <span>{totalItems} items</span>
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-bold text-gray-900 text-sm">{order.total}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center pr-6">
                                                        <div className="flex justify-center">
                                                            {order.status === 'accepted' ? (
                                                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center" title="Accepted">
                                                                    <Check size={16} />
                                                                </div>
                                                            ) : order.status === 'cancelled' ? (
                                                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center" title="Cancelled">
                                                                    <X size={16} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center" title="Pending">
                                                                    <Clock size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-gray-50/50">
                                                        <td colSpan="6" className="px-6 py-4 border-t border-gray-100">
                                                            <div className="pl-4 border-l-2 border-primary/20">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Order Details</h4>
                                                                    <span className="font-mono text-xs text-gray-400">#{order.id}</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {Array.isArray(order.items) && order.items.length > 0 ? (
                                                                        order.items.map((item, idx) => (
                                                                            <div key={idx} className="flex items-center justify-between text-sm max-w-md">
                                                                                <span className="text-gray-700">
                                                                                    <span className="font-bold text-gray-900 mr-2">{item.amount}x</span>
                                                                                    {item.name}
                                                                                </span>
                                                                                <span className="text-gray-500">
                                                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.amount)}
                                                                                </span>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400 italic">No items</span>
                                                                    )}

                                                                    {order.customer?.note && (
                                                                        <div className="mt-3 pt-3 border-t border-gray-200 max-w-md">
                                                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                                                <MessageSquare size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
                                                                                <span className="italic">"{order.customer.note}"</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Search size={32} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">No pre-orders found</h3>
                                            <p className="text-gray-500">Try adjusting your search or check back later.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6">
                        {filteredAndSortedPreOrders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredAndSortedPreOrders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                                        {/* Header */}
                                        <div className="p-6 pb-4 flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg">
                                                    {order.customer?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{order.customer?.name || 'Unknown'}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span className="font-mono">#{order.id.slice(-6)}</span>
                                                        <span>•</span>
                                                        <span>{order.customer?.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`
                                                px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${order.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}
                                            `}>
                                                {order.status}
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="px-6 py-2 space-y-3 flex-1">
                                            {/* Address */}
                                            <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                                                <MapPin size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
                                                <span className="line-clamp-2">{order.customer?.address || 'No address'}</span>
                                            </div>

                                            {/* Time & Note */}
                                            <div className="flex gap-3">
                                                <div className="flex-1 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-xl font-medium">
                                                    <Clock size={16} className="text-blue-500" />
                                                    {order.time}
                                                </div>
                                                {order.customer?.note && (
                                                    <div className="flex-1 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl" title={order.customer.note}>
                                                        <MessageSquare size={16} className="text-gray-400" />
                                                        <span className="truncate italic">Note</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Items */}
                                            <div className="pt-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {Array.isArray(order.items) && order.items.slice(0, 3).map((item, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                                                            <span className="font-bold text-gray-900">{item.amount}x</span>
                                                            <span className="max-w-[100px] truncate">{item.name}</span>
                                                        </span>
                                                    ))}
                                                    {Array.isArray(order.items) && order.items.length > 3 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-medium">
                                                            +{order.items.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="p-6 pt-4 mt-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                            <div>
                                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</div>
                                                <div className="text-xl font-bold text-gray-900">{order.total}</div>
                                            </div>

                                            {['pending', 'waiting'].includes(order.status.toLowerCase()) && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAction(order, 'reject')}
                                                        className="p-3 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(order, 'confirm')}
                                                        className="px-6 py-3 rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold flex items-center gap-2"
                                                    >
                                                        <Check size={20} />
                                                        Confirm
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No pre-orders found</h3>
                                <p className="text-gray-500">Try adjusting your search or check back later.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <OrderDetailsModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
        </div>
    );
};

export default PreOrders;
