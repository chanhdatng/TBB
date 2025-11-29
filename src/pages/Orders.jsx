import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, CheckCircle2, Clock, XCircle, Trash2, Edit2, User, CakeSlice, Layers } from 'lucide-react';
import CreateOrderModal from '../components/Orders/CreateOrderModal';
import DateSelector from '../components/Orders/DateSelector';
import AdvancedFilterModal from '../components/Orders/AdvancedFilterModal';
import ShiftSummaryCards from '../components/Orders/ShiftSummaryCards';
import OrderDetailsModal from '../components/Orders/OrderDetailsModal';
import DraftListModal from '../components/Orders/DraftListModal';
import SkeletonTable from '../components/Common/SkeletonTable';
import SkeletonStats from '../components/Common/SkeletonStats';
import { database } from '../firebase';
import { ref, set, update, remove } from "firebase/database";
import { useData } from '../contexts/DataContext';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from '../contexts/ToastContext';

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

    const { orders, customers, loading } = useData();
    const { showToast } = useToast();
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
    const [activeStatusId, setActiveStatusId] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);

    // Drafts State
    const [drafts, setDrafts] = useState([]);
    const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);

    // Load drafts from localStorage
    const loadDrafts = () => {
        const savedDrafts = localStorage.getItem('order_drafts');
        if (savedDrafts) {
            setDrafts(JSON.parse(savedDrafts));
        }
    };

    useEffect(() => {
        loadDrafts();
        // Listen for storage events (in case drafts are updated in another tab/window)
        window.addEventListener('storage', loadDrafts);
        return () => window.removeEventListener('storage', loadDrafts);
    }, []);

    const handleDraftSaved = () => {
        loadDrafts();
    };

    const handleDeleteDraft = (id) => {
        if (window.confirm('Are you sure you want to delete this draft?')) {
            removeDraft(id);
        }
    };

    const removeDraft = (id) => {
        const newDrafts = drafts.filter(d => d.id !== id);
        setDrafts(newDrafts);
        localStorage.setItem('order_drafts', JSON.stringify(newDrafts));
    };

    const handleSelectDraft = (draft) => {
        setSelectedDraft(draft);
        setIsDraftModalOpen(false);
        setIsModalOpen(true);
    };

    const handleCreateOrder = async (newOrder) => {
        // 1. Show loading on button (handled in Modal)
        // 2. Wait a bit for visual feedback (handled here or in Modal? Let's do it here to simulate "background" start)

        // We return a promise so the modal can await it for the "loading" state on button
        return new Promise((resolve, reject) => {
            // Simulate a small delay for the "loading" spinner on the button
            setTimeout(async () => {
                try {
                    // Close modal first (handled by resolving, and Modal calls onClose)
                    // Actually, Modal calls this, awaits, then closes. 
                    // But we want "background" feel. 
                    // So we resolve immediately after the small delay?

                    // If we resolve, the Modal closes.
                    // Then we continue the work "in background".
                    resolve();

                    // Background work starts here
                    await set(ref(database, 'orders/' + newOrder.id), newOrder);

                    // Check if customer exists (normalize phone for comparison)
                    const normalizePhone = (p) => (p ? String(p).replace(/\D/g, '') : '');
                    const newPhoneNormalized = normalizePhone(newOrder.customer.phone);

                    const customerExists = customers.some(c => c && c.phone && normalizePhone(c.phone) === newPhoneNormalized);

                    if (!customerExists) {
                        console.log("Creating new customer:", newOrder.customer);
                        // Create new customer
                        const newCustomer = {
                            id: newOrder.customer.id,
                            name: newOrder.customer.name,
                            phone: newOrder.customer.phone,
                            address: newOrder.customer.address,
                            createDate: newOrder.createDate,
                            lastOrderId: newOrder.id, // Set lastOrderId for new customer
                            socialLink: newOrder.customer.socialLink || ''
                        };
                        await set(ref(database, 'newCustomers/' + newCustomer.phone), newCustomer);
                    } else {
                        // Update existing customer's lastOrderId
                        const existingCustomer = customers.find(c => c && c.phone && normalizePhone(c.phone) === newPhoneNormalized);
                        if (existingCustomer) {
                            console.log("Updating existing customer lastOrderId:", existingCustomer.phone);
                            await update(ref(database, 'newCustomers/' + existingCustomer.phone), {
                                lastOrderId: newOrder.id
                            });
                        }
                    }

                    // Success Toast
                    showToast('Tạo đơn thành công!', 'success');

                } catch (error) {
                    console.error("Error creating order:", error);
                    showToast('Tạo đơn thất bại: ' + error.message, 'error');
                    // Note: If we already resolved, the modal is closed. So the user sees the error toast on the main screen.
                    // If we failed BEFORE resolving, we should reject so modal stays open?
                    // But we want "background" feel. So usually we assume success for the UI close, then notify if fail.
                }
            }, 800); // 800ms delay for visual "processing" feedback
        });
    };

    const handleUpdateOrder = (updatedOrder) => {
        update(ref(database, 'orders/' + updatedOrder.id), updatedOrder);
        setEditingOrder(null);
    };

    const handleStatusChange = (id, newStatus) => {
        update(ref(database, 'orders/' + id), {
            state: newStatus
        });
        setActiveStatusId(null);
    };

    const handleDeleteOrder = (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            remove(ref(database, 'orders/' + id));
        }
    };

    const handleEditOrder = (id) => {
        const orderToEdit = orders.find(o => o.id === id);
        if (orderToEdit) {
            setEditingOrder(orderToEdit);
            setIsModalOpen(true);
        }
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
            result = result.filter(order => {
                const stateLower = (order.originalData?.state || '').toLowerCase();
                return advancedFilters.status.some(status => {
                    if (status === 'Pending') return stateLower.includes('đặt trước');
                    if (status === 'Completed') return stateLower.includes('hoàn thành');
                    if (status === 'Cancelled') return stateLower.includes('hủy') || stateLower.includes('huỷ');
                    return false;
                });
            });
        }

        if (advancedFilters.isPickupOnly) {
            result = result.filter(order => {
                const address = (order.customer.address || '').toLowerCase();
                return address.includes('pickup') || address.includes('pick up') || address.includes('bookship');
            });
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

    // Helper to get color for time slot
    const getTimeSlotColor = (slot) => {
        if (!slot) return 'bg-white';
        // Normalize slot string just in case
        const s = slot.trim();
        // Gradient of very light grays (increasing intensity)
        if (s.includes("10:00") && s.includes("12:00")) return 'bg-[#fcfcfc]'; // Almost white
        if (s.includes("12:00") && s.includes("14:00")) return 'bg-[#f7f7f7]'; // Very light gray
        if (s.includes("14:00") && s.includes("16:00")) return 'bg-[#f2f2f2]'; // Light gray
        if (s.includes("16:00") && s.includes("18:00")) return 'bg-[#ededed]'; // Visible gray
        if (s.includes("18:00") && s.includes("20:00")) return 'bg-[#e8e8e8]'; // Darkest but still light
        return 'bg-white';
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
                        onClick={() => setIsDraftModalOpen(true)}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors relative"
                    >
                        <Layers size={20} />
                        Drafts
                        {drafts.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                {drafts.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setEditingOrder(null);
                            setSelectedDraft(null);
                            setIsModalOpen(true);
                        }}
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

            {loading ? (
                <SkeletonStats count={3} className="mb-6" />
            ) : (
                <ShiftSummaryCards orders={filteredAndSortedOrders} />
            )}

            <CreateOrderModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingOrder(null);
                    setSelectedDraft(null);
                    loadDrafts(); // Reload drafts when modal closes (in case one was saved)
                }}
                onCreateOrder={handleCreateOrder}
                editingOrder={editingOrder}
                onUpdateOrder={handleUpdateOrder}
                initialData={selectedDraft}
                onDraftSaved={handleDraftSaved}
                onDeleteDraft={removeDraft}
            />

            <DraftListModal
                isOpen={isDraftModalOpen}
                onClose={() => setIsDraftModalOpen(false)}
                drafts={drafts}
                onSelectDraft={handleSelectDraft}
                onDeleteDraft={handleDeleteDraft}
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

            {isDetailsModalOpen && (
                <OrderDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    order={selectedOrderForDetails}
                    onEdit={() => {
                        handleEditOrder(selectedOrderForDetails.id);
                        setIsDetailsModalOpen(false);
                    }}
                    onDelete={() => {
                        handleDeleteOrder(selectedOrderForDetails.id);
                        setIsDetailsModalOpen(false);
                    }}
                />
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
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
                        <label className="flex items-center gap-2 cursor-pointer mr-4">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${advancedFilters.isPickupOnly ? 'bg-primary border-primary' : 'border-gray-300'
                                }`}>
                                {advancedFilters.isPickupOnly && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={advancedFilters.isPickupOnly || false}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, isPickupOnly: e.target.checked }))}
                            />
                            <span className="text-sm text-gray-600 font-medium">Pickup Only</span>
                        </label>
                        <div className="h-4 w-px bg-gray-200 mr-4"></div>
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

                {loading ? (
                    <SkeletonTable rows={8} columns={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[220px]">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">Order Details</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAndSortedOrders.length > 0 ? (
                                filteredAndSortedOrders.map((order, index) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => handleOpenDetails(order)}
                                        className={`transition-colors group cursor-pointer ${
                                            selectedOrderForDetails?.id === order.id
                                                ? 'bg-blue-100 hover:bg-blue-200'
                                                : `${getTimeSlotColor(order.deliveryTimeSlot || order.originalData?.deliveryTimeSlot)} hover:brightness-95`
                                        }`}
                                    >
                                        {/* Customer Info */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                    <User size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div
                                                        className="text-sm font-bold text-gray-900 break-words max-w-[150px]"
                                                        title={order.customer.name}
                                                    >
                                                        <HighlightText text={order.customer.name} highlight={searchQuery} />
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-500 truncate"
                                                        title={order.customer.phone}
                                                    >
                                                        {order.customer.phone}
                                                    </div>
                                                    <div
                                                        className="text-xs text-gray-400 line-clamp-1"
                                                        title={order.customer.address}
                                                    >
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
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (order.status === 'Pending') {
                                                            setActiveStatusId(activeStatusId === order.id ? null : order.id);
                                                        } else {
                                                            // Allow toggling back to Pending if needed, or just do nothing
                                                            // For now, let's allow toggling back to Pending for easy correction
                                                            handleStatusChange(order.id, 'Pending');
                                                        }
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

                                                {/* Status Dropdown for Pending */}
                                                {activeStatusId === order.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveStatusId(null);
                                                            }}
                                                        ></div>
                                                        <div className={`absolute right-0 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${index === filteredAndSortedOrders.length - 1 ? 'bottom-full mb-2' : 'top-full mt-2'
                                                            }`}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusChange(order.id, 'Hoàn Thành');
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-gray-700 hover:text-green-700 flex items-center gap-2"
                                                            >
                                                                <CheckCircle size={16} className="text-green-500" />
                                                                Hoàn thành
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusChange(order.id, 'Cancelled');
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-gray-700 hover:text-red-700 flex items-center gap-2"
                                                            >
                                                                <XCircle size={16} className="text-red-500" />
                                                                Đã hủy
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
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
                )}


                {/* Daily Summary Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
                    <div className="flex gap-4">
                        <span>Total Orders: <span className="font-medium text-gray-900">{filteredAndSortedOrders.length}</span></span>
                        <span>Total Items: <span className="font-medium text-gray-900">{filteredAndSortedOrders.reduce((sum, order) => sum + order.items.reduce((is, i) => is + (Number(i.amount) || 0), 0), 0)}</span></span>
                    </div>
                    <div>
                        Total Revenue: <span className="font-medium text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(filteredAndSortedOrders.reduce((sum, order) => sum + (order.rawPrice || 0), 0))}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orders;
