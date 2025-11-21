import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, User, ShoppingBag, Receipt, MapPin, Phone } from 'lucide-react';

const CreateOrderModal = ({ isOpen, onClose, onCreateOrder }) => {
    // Initial State
    const initialCustomer = { name: '', phone: '', address: '' };
    const initialItems = [{ id: Date.now(), name: 'Wedding Cake Deluxe', quantity: 1, price: 255000 }];
    const initialFees = { ship: 0, other: 0, discount: 0, note: '' };

    const [customer, setCustomer] = useState(initialCustomer);
    const [items, setItems] = useState(initialItems);
    const [fees, setFees] = useState(initialFees);
    const [showConfirm, setShowConfirm] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCustomer(initialCustomer);
            setItems(initialItems);
            setFees(initialFees);
            setShowConfirm(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Mock Product List
    const products = [
        { name: 'Wedding Cake Deluxe', price: 255000 },
        { name: 'Assorted Pastries Box', price: 42500 },
        { name: 'Sourdough Bread', price: 7000 },
        { name: 'Custom Birthday Cupcakes', price: 85000 },
        { name: 'Chocolate Croissants', price: 4000 },
        { name: 'Strawberry Tart', price: 28000 }
    ];

    // Handlers
    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), name: products[0].name, quantity: 1, price: products[0].price }]);
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
                    const product = products.find(p => p.name === value);
                    updatedItem.price = product ? product.price : 0;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return itemsTotal + Number(fees.ship) + Number(fees.other) - Number(fees.discount);
    };

    const isDirty = () => {
        return JSON.stringify(customer) !== JSON.stringify(initialCustomer) ||
            JSON.stringify(items) !== JSON.stringify(initialItems) ||
            JSON.stringify(fees) !== JSON.stringify(initialFees);
    };

    const handleCloseAttempt = () => {
        if (isDirty()) {
            setShowConfirm(true);
        } else {
            onClose();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newOrder = {
            id: `INV_${Math.floor(Math.random() * 1000000)}`,
            customer: customer,
            items: items,
            fees: fees,
            total: calculateTotal(),
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'Pending'
        };

        onCreateOrder(newOrder);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={handleCloseAttempt}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in fade-in zoom-in-95 duration-300 ease-out max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
                    <button onClick={handleCloseAttempt} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">

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
                                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
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

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex-1 w-full">
                                        <select
                                            value={item.name}
                                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                        >
                                            {products.map(p => (
                                                <option key={p.name} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                        />
                                        <div className="w-32 text-right font-medium text-gray-900 text-sm">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
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

                    {/* Section 3: Fees & Total */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                            <Receipt size={20} />
                            <h3>Payment & Notes</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                    <textarea
                                        rows="4"
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
                                    <label className="text-sm text-gray-600">Other Fee</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={fees.other}
                                        onChange={(e) => setFees({ ...fees, other: e.target.value })}
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

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98]"
                        >
                            <Plus size={20} />
                            Create Order
                        </button>
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
