import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, User, ShoppingBag, Receipt, MapPin, Phone, Save, Globe } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const CreateOrderModal = ({ isOpen, onClose, onCreateOrder, editingOrder, onUpdateOrder, initialData, onDraftSaved }) => {
    const { products, customers } = useData();

    // Fallback if products are not loaded yet
    const displayProducts = products.length > 0 ? products : [
        { name: 'Loading...', price: 0 }
    ];

    // Form State
    const initialCustomer = { name: '', phone: '', address: '', socialLink: '' };
    const initialItems = [{ id: Date.now(), name: '', quantity: 1, price: 0 }];
    const initialFees = { ship: 0, discount: 0, other: 0, note: '' };

    const [customer, setCustomer] = useState(initialCustomer);
    const [items, setItems] = useState(initialItems);
    const [fees, setFees] = useState(initialFees);
    const [showConfirm, setShowConfirm] = useState(false);
    const [activeSearchId, setActiveSearchId] = useState(null);

    // Date & Time State
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [orderTime, setOrderTime] = useState(new Date().toTimeString().slice(0, 5));
    const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');

    const TIME_SLOTS = [
        "10:00 - 12:00",
        "12:00 - 14:00",
        "14:00 - 16:00",
        "16:00 - 18:00",
        "18:00 - 20:00"
    ];

    // Validation State
    const [isShake, setIsShake] = useState(false);
    const [showValidation, setShowValidation] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setShowValidation(false);
            setIsShake(false);

            if (editingOrder) {
                // Populate form with existing order data
                setCustomer({
                    name: editingOrder.customer.name,
                    phone: editingOrder.customer.phone,
                    address: editingOrder.customer.address,
                    socialLink: editingOrder.customer.socialLink || ''
                });

                // Map items
                const mappedItems = editingOrder.items.map(item => ({
                    id: Date.now() + Math.random(), // New temp ID for UI
                    name: item.name,
                    quantity: item.amount,
                    price: item.price
                }));
                setItems(mappedItems);

                // Map fees
                setFees({
                    ship: editingOrder.originalData?.shipFee || 0,

                    discount: editingOrder.originalData?.discount || 0,
                    other: editingOrder.originalData?.otherFee || 0,
                    note: editingOrder.originalData?.note || ''
                });

                // Map Date & Time
                // editingOrder.timeline.received.raw is a Date object
                const dateObj = editingOrder.timeline.received.raw;
                setOrderDate(dateObj.toLocaleDateString('en-CA')); // YYYY-MM-DD
                setOrderTime(dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

                // Set time slot if available, otherwise try to match or leave empty
                if (editingOrder.originalData?.deliveryTimeSlot) {
                    setDeliveryTimeSlot(editingOrder.originalData.deliveryTimeSlot);
                } else {
                    setDeliveryTimeSlot('');
                }

            } else if (initialData) {
                // Restore from Draft
                setCustomer(initialData.customer);
                setItems(initialData.items);
                setFees(initialData.fees);
                setOrderDate(initialData.orderDate);
                setDeliveryTimeSlot(initialData.deliveryTimeSlot);
            } else {
                // Reset to initial state
                setCustomer(initialCustomer);
                setItems([{ id: Date.now(), name: '', quantity: 1, price: 0 }]);
                setFees(initialFees);
                setOrderDate(new Date().toISOString().split('T')[0]);
                setOrderTime(new Date().toTimeString().slice(0, 5));
                setDeliveryTimeSlot('');
            }
            setShowConfirm(false);
        }
    }, [isOpen, editingOrder, initialData]);

    const handleSaveDraft = () => {
        const draftData = {
            id: Date.now(), // Unique ID for the draft
            savedAt: new Date().toISOString(),
            customer,
            items,
            fees,
            orderDate,
            deliveryTimeSlot
        };

        // Get existing drafts
        const existingDrafts = JSON.parse(localStorage.getItem('order_drafts') || '[]');

        // If we are editing a draft (initialData exists), we might want to update it instead of creating new?
        // For simplicity, let's just add new one for now, or replace if ID matches.
        // But initialData might not have ID if it was just passed as props. 
        // Let's just append for now to be safe.

        const newDrafts = [draftData, ...existingDrafts];
        localStorage.setItem('order_drafts', JSON.stringify(newDrafts));

        if (onDraftSaved) onDraftSaved();
        alert("Đã lưu nháp thành công!");
        onClose();
    };

    if (!isOpen) return null;

    // Handlers
    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), name: '', quantity: 1, price: 0 }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'name') {
                    const product = displayProducts.find(p => p.name === value);
                    if (product) {
                        updatedItem.price = product.price;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return itemsTotal + Number(fees.ship) - Number(fees.discount);
    };

    const isDirty = () => {
        // Simplified dirty check for now, or implement deep comparison if critical
        return false;
    };

    const handleCloseAttempt = () => {
        if (isDirty()) {
            setShowConfirm(true);
        } else {
            onClose();
        }
    };

    // Helper: Generate MongoDB-style ObjectId (24 hex chars)
    const generateObjectId = () => {
        const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
        const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        return timestamp + machineId + processId + counter;
    };

    // Helper: Convert Date to CFAbsoluteTime (seconds since 2001-01-01 00:00:00 UTC)
    const toCFAbsoluteTime = (date) => {
        const time2001 = 978307200000; // Milliseconds
        return (date.getTime() - time2001) / 1000;
    };

    // Helper: Generate UUID for customer (if needed)
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const validItems = items.filter(item => item.name && item.name.trim() !== '');

        // Validation
        if (!deliveryTimeSlot || validItems.length === 0) {
            setShowValidation(true);
            setIsShake(true);
            setTimeout(() => setIsShake(false), 500);
            return;
        }

        const now = new Date();

        // Determine time to use: either start of slot or manual time (if we kept manual time as fallback, but here we enforce slots mostly)
        // If a slot is selected, use the start time of the slot for the timestamp
        let finalTime = orderTime;
        if (deliveryTimeSlot) {
            // Extract start time from slot string "10:00 - 12:00" -> "10:00"
            finalTime = deliveryTimeSlot.split(' - ')[0];
        }

        // Combine selected date and time
        const selectedDateTime = new Date(`${orderDate}T${finalTime}`);

        // Construct order object
        const orderData = {
            id: editingOrder ? editingOrder.id : generateObjectId(), // Keep ID if editing
            address: customer.address,
            cakes: items.map(item => ({
                amount: item.quantity,
                id: generateObjectId(), // Generate ID for items too
                name: item.name,
                price: item.price
            })),
            createDate: editingOrder ? editingOrder.originalData.createDate : toCFAbsoluteTime(now), // Keep createDate if editing
            customer: {
                address: customer.address,
                id: customer.id || (editingOrder?.customer?.id) || generateUUID(),
                name: customer.name,
                phone: customer.phone,
                socialLink: customer.socialLink
            },
            customerPhone: customer.phone,
            discount: Number(fees.discount),
            orderDate: toCFAbsoluteTime(selectedDateTime), // Use selected date/time
            deliveryTimeSlot: deliveryTimeSlot, // Save the slot string
            otherFee: Number(fees.other),
            payMethod: "Bank", // Default value
            shipFee: Number(fees.ship),
            social: "Instagram", // Default value
            state: editingOrder ? editingOrder.originalData.state : "Đặt trước" // Keep state if editing
        };

        if (editingOrder) {
            onUpdateOrder(orderData);
        } else {
            onCreateOrder(orderData);
            // If this was a draft (initialData exists), we should probably delete it?
            // For now, let's leave it to the user to delete from the list, or we can pass a callback to delete it.
            // But since we don't pass the draft ID back easily, let's keep it simple.
            // The user can delete drafts manually from the list.
        }
        onClose();
    };

    // Derived state for validation check (to style button)
    const isValid = deliveryTimeSlot && items.some(item => item.name && item.name.trim() !== '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={handleCloseAttempt}>
            <div className="bg-white rounded-2xl w-full max-w-2xl lg:max-w-6xl shadow-xl animate-in fade-in zoom-in-95 duration-300 ease-out max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">{editingOrder ? 'Edit Order' : 'Create New Order'}</h2>
                    <div className="flex items-center gap-2">
                        {!editingOrder && (
                            <button
                                onClick={handleSaveDraft}
                                className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                                title="Save Draft"
                            >
                                <Save size={20} />
                                <span className="hidden sm:inline">Save Draft</span>
                            </button>
                        )}
                        <button onClick={handleCloseAttempt} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">

                    {/* Left Column: Customer & Items */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Section 1: Customer */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                                <User size={20} />
                                <h3>Customer Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={customer.name}
                                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Customer Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="tel"
                                            required
                                            value={customer.phone}
                                            onChange={(e) => {
                                                const newPhone = e.target.value;
                                                const foundCustomer = customers.find(c => c.phone === newPhone);
                                                setCustomer({
                                                    ...customer,
                                                    phone: newPhone,
                                                    name: foundCustomer ? foundCustomer.name : customer.name,
                                                    address: foundCustomer ? foundCustomer.address : customer.address,
                                                    socialLink: foundCustomer ? (foundCustomer.socialLink || '') : customer.socialLink,
                                                    id: foundCustomer ? foundCustomer.id : null
                                                });
                                            }}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={customer.address}
                                            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Delivery Address"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Social Link <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <div className="relative">
                                        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={customer.socialLink}
                                            onChange={(e) => setCustomer({ ...customer, socialLink: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Facebook/Instagram URL"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <ShoppingBag size={20} />
                                    <h3>Order Items</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="text-sm text-primary font-medium hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>

                            <div className={`space-y-3 p-2 rounded-xl transition-all lg:max-h-[400px] lg:overflow-y-auto lg:custom-scrollbar ${showValidation && items.every(i => !i.name) ? 'border-2 border-red-500 bg-red-50' : ''} ${isShake && items.every(i => !i.name) ? 'animate-shake' : ''}`}>
                                {items.map((item, index) => (
                                    <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex-1 w-full relative">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                onFocus={() => setActiveSearchId(item.id)}
                                                onBlur={() => setTimeout(() => setActiveSearchId(null), 200)}
                                                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${showValidation && !item.name ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="Select or type cake name"
                                            />
                                            {activeSearchId === item.id && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {displayProducts
                                                        .filter(p => p.name.toLowerCase().includes((item.name || '').toLowerCase()))
                                                        .map(p => (
                                                            <div
                                                                key={p.id || p.name}
                                                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center"
                                                                onMouseDown={() => {
                                                                    handleItemChange(item.id, 'name', p.name);
                                                                    setActiveSearchId(null);
                                                                }}
                                                            >
                                                                <span className="font-medium text-gray-900">{p.name}</span>
                                                                <span className="text-gray-500 text-xs">
                                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                                                                </span>
                                                            </div>
                                                        ))
                                                    }
                                                    {displayProducts.filter(p => p.name.toLowerCase().includes((item.name || '').toLowerCase())).length === 0 && (
                                                        <div className="px-3 py-2 text-sm text-gray-500 text-center">No items found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentVal = parseInt(item.quantity) || 0;
                                                        if (currentVal > 1) {
                                                            handleItemChange(item.id, 'quantity', currentVal - 1);
                                                        }
                                                    }}
                                                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors border-r border-gray-200"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            handleItemChange(item.id, 'quantity', '');
                                                        } else {
                                                            const num = parseInt(val);
                                                            if (!isNaN(num) && num > 0) {
                                                                handleItemChange(item.id, 'quantity', num);
                                                            }
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (!item.quantity || parseInt(item.quantity) < 1) {
                                                            handleItemChange(item.id, 'quantity', 1);
                                                        }
                                                    }}
                                                    className="w-12 py-2 text-center focus:outline-none text-sm font-medium"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentVal = parseInt(item.quantity) || 0;
                                                        handleItemChange(item.id, 'quantity', currentVal + 1);
                                                    }}
                                                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors border-l border-gray-200"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-right"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className={`p-2 rounded-lg transition-colors ${items.length > 1 ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
                                                disabled={items.length <= 1}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Fees & Total & Action */}
                    <div className="lg:col-span-4 space-y-8 lg:space-y-6">
                        {/* Section 3: Fees & Total */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                                <Receipt size={20} />
                                <h3>Payment & Notes</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    {/* Date & Time Selection */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={orderDate}
                                                onChange={(e) => setOrderDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                                            <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-lg transition-all ${showValidation && !deliveryTimeSlot ? 'border-2 border-red-500 bg-red-50' : ''} ${isShake && !deliveryTimeSlot ? 'animate-shake' : ''}`}>
                                                {TIME_SLOTS.map(slot => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setDeliveryTimeSlot(slot)}
                                                        className={`px-1 py-1.5 text-[10px] sm:text-xs font-medium rounded-md border transition-all ${deliveryTimeSlot === slot
                                                            ? 'bg-primary text-white border-primary shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                                                            }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                        <textarea
                                            rows="2"
                                            value={fees.note}
                                            onChange={(e) => setFees({ ...fees, note: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                            placeholder="Order notes..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-600">Ship Fee</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={fees.ship}
                                            onChange={(e) => setFees({ ...fees, ship: e.target.value })}
                                            className="w-32 px-2 py-1 bg-white border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-600">Discount</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={fees.discount}
                                            onChange={(e) => setFees({ ...fees, discount: e.target.value })}
                                            className="w-32 px-2 py-1 bg-white border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-primary text-red-500"
                                        />
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                                        <span className="font-bold text-gray-900">Total</span>
                                        <span className="font-bold text-xl text-primary">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 lg:border-t-0 lg:pt-0">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98]"
                            >
                                <Plus size={20} />
                                {editingOrder ? 'Update Order' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Confirm Discard Modal */}
                {showConfirm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-3">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Discard Changes?</h3>
                                <p className="text-sm text-gray-500 mb-4">You have unsaved changes. Are you sure you want to close?</p>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/30"
                                    >
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateOrderModal;
