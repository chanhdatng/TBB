import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check, Loader, Cookie, ArrowRight } from 'lucide-react';
import { database } from '../../firebase';
import { ref, update } from 'firebase/database';

const ProductNameStandardizeModal = ({ isOpen, onClose, orders }) => {
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);

    // Product name mapping rules
    const nameStandardizationRules = {
        'Brazilian Cheesebread': {
            // Match function for flexible matching
            match: (name) => {
                const normalized = name.trim().toLowerCase();

                // Exact matches after normalization
                const exactMatches = [
                    'brazilian cheese bread',
                    'brazilian cheesebread',
                    'cheese bread',
                    'cheesebread',
                    'brazillian cheesebread', // common typo
                    'cheesebreead', // typo
                    'pão de queijo'
                ];

                if (exactMatches.includes(normalized)) {
                    return true;
                }

                // Check if it's only "cheese bread" without other words
                // (to avoid matching "chà bông cheese bread", etc.)
                if (normalized === 'cheese bread' ||
                    normalized === 'brazilian cheese bread' ||
                    normalized === 'brazilian cheesebread') {
                    return true;
                }

                return false;
            },
            correctName: 'Brazilian Cheesebread'
        }
        // Add more rules here for other products
    };

    // Find orders with non-standard product names
    const ordersWithNonStandardNames = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        const issueOrders = [];

        orders.forEach(order => {
            if (!order.items || order.items.length === 0) return;

            const itemsNeedingFix = [];

            order.items.forEach((item, itemIndex) => {
                const itemName = item.name;
                if (!itemName) return;

                // Skip if already correct
                const trimmedName = itemName.trim();

                // Check against all standardization rules
                Object.entries(nameStandardizationRules).forEach(([correctName, rule]) => {
                    // Use match function if available, otherwise fallback to variants
                    let needsStandardization = false;

                    if (rule.match && typeof rule.match === 'function') {
                        needsStandardization = rule.match(itemName);
                    } else if (rule.variants) {
                        needsStandardization = rule.variants.some(variant =>
                            trimmedName.toLowerCase() === variant.toLowerCase()
                        );
                    }

                    // Only fix if it matches AND is not already the correct name
                    if (needsStandardization && trimmedName !== correctName) {
                        itemsNeedingFix.push({
                            itemIndex,
                            currentName: itemName,
                            correctName: correctName,
                            amount: item.amount,
                            price: item.price
                        });
                    }
                });
            });

            if (itemsNeedingFix.length > 0) {
                issueOrders.push({
                    orderId: order.id,
                    customerName: order.customer?.name || 'Unknown',
                    orderDate: order.timeline?.ordered?.date || 'N/A',
                    itemsNeedingFix,
                    allItems: order.items
                });
            }
        });

        return issueOrders;
    }, [orders]);

    const handleSelectAll = () => {
        if (selectedOrders.length === ordersWithNonStandardNames.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(ordersWithNonStandardNames.map(o => o.orderId));
        }
    };

    const handleToggleOrder = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleStandardize = async () => {
        if (selectedOrders.length === 0) return;

        setIsProcessing(true);
        setProcessedCount(0);

        try {
            const updates = {};

            for (const orderData of ordersWithNonStandardNames) {
                if (!selectedOrders.includes(orderData.orderId)) continue;

                // Create a copy of all items
                const updatedItems = [...orderData.allItems];

                // Apply fixes to items that need standardization
                orderData.itemsNeedingFix.forEach(fix => {
                    updatedItems[fix.itemIndex] = {
                        ...updatedItems[fix.itemIndex],
                        name: fix.correctName
                    };
                });

                // Prepare update for Firebase
                updates[`orders/${orderData.orderId}/cakes`] = updatedItems;

                setProcessedCount(prev => prev + 1);
            }

            // Execute batch update
            await update(ref(database), updates);

            alert(`Successfully standardized ${selectedOrders.length} order(s)!`);
            setSelectedOrders([]);
            onClose();
        } catch (error) {
            console.error('Error standardizing product names:', error);
            alert('Failed to standardize product names. Please try again.');
        } finally {
            setIsProcessing(false);
            setProcessedCount(0);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <Cookie size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Standardize Product Names</h2>
                                    <p className="text-amber-100 text-sm mt-1">
                                        Fix inconsistent product naming across orders
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="text-amber-100 text-sm">Orders with Issues</div>
                                <div className="text-3xl font-bold mt-1">{ordersWithNonStandardNames.length}</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="text-amber-100 text-sm">Selected</div>
                                <div className="text-3xl font-bold mt-1">{selectedOrders.length}</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="text-amber-100 text-sm">Total Items to Fix</div>
                                <div className="text-3xl font-bold mt-1">
                                    {ordersWithNonStandardNames
                                        .filter(o => selectedOrders.includes(o.orderId))
                                        .reduce((sum, o) => sum + o.itemsNeedingFix.length, 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-400px)]">
                        {ordersWithNonStandardNames.length === 0 ? (
                            <div className="text-center py-12">
                                <Check className="text-green-500 mx-auto mb-4" size={64} />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">All Product Names are Standardized!</h3>
                                <p className="text-gray-600">No inconsistent product names found in your orders.</p>
                            </div>
                        ) : (
                            <>
                                {/* Info Banner */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                        <div className="text-sm text-blue-900">
                                            <p className="font-semibold mb-1">What will be standardized:</p>
                                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                                                <li>All variations of "brazilian cheese bread", "cheese bread", etc. → <strong>Brazilian Cheesebread</strong></li>
                                                <li>This will update the product name in Firebase while preserving all other order data</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Select All */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.length === ordersWithNonStandardNames.length}
                                            onChange={handleSelectAll}
                                            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        <span className="font-semibold text-gray-900">Select All Orders</span>
                                    </label>
                                    <span className="text-sm text-gray-500">
                                        {selectedOrders.length} of {ordersWithNonStandardNames.length} selected
                                    </span>
                                </div>

                                {/* Orders List */}
                                <div className="space-y-3">
                                    {ordersWithNonStandardNames.map((orderData) => (
                                        <div
                                            key={orderData.orderId}
                                            className={`border-2 rounded-xl p-4 transition-all ${
                                                selectedOrders.includes(orderData.orderId)
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <label className="flex items-start gap-4 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrders.includes(orderData.orderId)}
                                                    onChange={() => handleToggleOrder(orderData.orderId)}
                                                    className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 mt-1 flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">
                                                                {orderData.customerName}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                Order: {orderData.orderId} • {orderData.orderDate}
                                                            </p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                                                            {orderData.itemsNeedingFix.length} items to fix
                                                        </span>
                                                    </div>

                                                    {/* Items to Fix */}
                                                    <div className="space-y-2">
                                                        {orderData.itemsNeedingFix.map((fix, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-white border border-gray-200 rounded-lg p-3"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <span className="font-medium text-red-600 line-through">
                                                                                {fix.currentName}
                                                                            </span>
                                                                            <ArrowRight size={16} className="text-gray-400" />
                                                                            <span className="font-semibold text-green-600">
                                                                                {fix.correctName}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            Amount: {fix.amount} • Price: {fix.price?.toLocaleString('vi-VN')} VND
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {ordersWithNonStandardNames.length > 0 && (
                        <div className="bg-gray-50 border-t border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {isProcessing && (
                                        <span className="flex items-center gap-2">
                                            <Loader className="animate-spin" size={16} />
                                            Processing {processedCount} of {selectedOrders.length} orders...
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        disabled={isProcessing}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStandardize}
                                        disabled={selectedOrders.length === 0 || isProcessing}
                                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 flex items-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader className="animate-spin" size={18} />
                                                Standardizing...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                Standardize {selectedOrders.length} Order(s)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProductNameStandardizeModal;
