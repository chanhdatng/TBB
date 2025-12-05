import React, { useState, useRef } from 'react';
import { X, Phone, CheckCircle, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { database } from '../../firebase';
import { ref, update } from 'firebase/database';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * PERFORMANCE OPTIMIZATION: Virtualized Orders List
 * Only renders visible items in viewport, dramatically reducing DOM nodes
 */
const OrdersList = ({ orders, selectedOrders, handleToggleOrder }) => {
    const parentRef = useRef(null);

    const virtualizer = useVirtualizer({
        count: orders.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140, // Estimated height of each order card
        overscan: 5 // Render 5 extra items above/below viewport
    });

    if (orders.length === 0) {
        return (
            <div className="p-6 overflow-y-auto max-h-96">
                <div className="text-center py-8 text-gray-500">
                    <Phone size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>No orders with phone format issues found</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={parentRef} className="p-6 overflow-y-auto max-h-96">
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative'
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const order = orders[virtualItem.index];

                    return (
                        <div
                            key={order.orderId}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                                padding: '6px 0'
                            }}
                        >
                            <div
                                className={`
                                    bg-gray-50 rounded-xl p-4 border transition-all cursor-pointer
                                    ${selectedOrders[order.orderId]
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-100 hover:border-gray-200'
                                    }
                                `}
                                onClick={() => handleToggleOrder(order.orderId)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <div className="mt-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders[order.orderId] || false}
                                            onChange={() => handleToggleOrder(order.orderId)}
                                            className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    {/* Order Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="font-medium text-gray-900">{order.customerName}</span>
                                            <span className="text-xs text-gray-500">
                                                Order: {order.orderId.substring(0, 8)}...
                                            </span>
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                {order.issueType}
                                            </span>
                                            <span className={`
                                                px-2 py-0.5 rounded text-xs font-medium
                                                ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : ''}
                                                ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                ${order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : ''}
                                            `}>
                                                {order.status}
                                            </span>
                                        </div>

                                        {/* Phone Change */}
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-500 mb-1">Current:</p>
                                                <p className="text-red-600 font-mono">{order.currentPhone}</p>
                                            </div>

                                            <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-500 mb-1">Will become:</p>
                                                <p className="text-green-600 font-mono font-medium">{order.suggestedPhone}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-2">
                                            Order date: {order.orderDate}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PhoneFormatModal = ({ isOpen, onClose, orders }) => {
    const [selectedOrders, setSelectedOrders] = useState({});
    const [isFixing, setIsFixing] = useState(false);
    const [fixProgress, setFixProgress] = useState({ processed: 0, total: 0, failed: 0 });
    const [fixResult, setFixResult] = useState(null);

    if (!isOpen) return null;

    const handleSelectAll = () => {
        const newSelection = {};
        orders.forEach(order => {
            newSelection[order.orderId] = true;
        });
        setSelectedOrders(newSelection);
    };

    const handleDeselectAll = () => {
        setSelectedOrders({});
    };

    const handleToggleOrder = (orderId) => {
        setSelectedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const getSelectedOrders = () => {
        return orders.filter(order => selectedOrders[order.orderId]);
    };

    const executePhoneFix = async () => {
        const selected = getSelectedOrders();
        if (selected.length === 0) {
            alert('Please select at least one order to fix');
            return;
        }

        setIsFixing(true);
        setFixProgress({ processed: 0, total: selected.length, failed: 0 });

        const BATCH_SIZE = 20;
        const DELAY_MS = 100;
        let processed = 0;
        let failed = 0;

        for (let i = 0; i < selected.length; i += BATCH_SIZE) {
            const batch = selected.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async (order) => {
                try {
                    const updates = {};
                    
                    // Update customer.phone if it exists
                    if (order.currentPhone) {
                        updates['customer/phone'] = order.suggestedPhone;
                    }
                    
                    // Also update customerPhone field if it exists at root level
                    updates['customerPhone'] = order.suggestedPhone;

                    await update(ref(database, 'orders/' + order.orderId), updates);
                    
                    return { success: true, orderId: order.orderId };
                } catch (error) {
                    console.error(`Failed to fix phone for order ${order.orderId}:`, error);
                    return { success: false, orderId: order.orderId, error };
                }
            });

            const results = await Promise.all(promises);
            processed += batch.length;
            failed += results.filter(r => !r.success).length;

            setFixProgress({ processed, total: selected.length, failed });

            // Delay between batches
            if (i + BATCH_SIZE < selected.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        setIsFixing(false);
        setFixResult({
            total: selected.length,
            success: processed - failed,
            failed: failed
        });

        // Clear selections after successful fix
        setSelectedOrders({});

        // Auto close after 3 seconds if all successful
        if (failed === 0) {
            setTimeout(() => {
                setFixResult(null);
                onClose();
            }, 3000);
        }
    };

    const selectedCount = Object.values(selectedOrders).filter(Boolean).length;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Phone className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Fix Phone Number Format</h2>
                            <p className="text-sm text-gray-500">Fix +84 format and remove whitespace</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isFixing}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Fix Result */}
                {fixResult && (
                    <div className={`mx-6 mt-4 p-4 rounded-xl border ${
                        fixResult.failed > 0 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : 'bg-green-50 border-green-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            {fixResult.failed > 0 ? (
                                <AlertTriangle className="text-yellow-600" size={20} />
                            ) : (
                                <CheckCircle className="text-green-600" size={20} />
                            )}
                            <p className={fixResult.failed > 0 ? 'text-yellow-800' : 'text-green-800'}>
                                Fix completed: {fixResult.success} successful
                                {fixResult.failed > 0 && `, ${fixResult.failed} failed`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Summary */}
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <strong>{orders.length}</strong> orders found with phone format issues
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSelectAll}
                                disabled={isFixing}
                                className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                disabled={isFixing}
                                className="text-sm text-gray-600 hover:underline font-medium disabled:opacity-50"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders List with Virtualization */}
                <OrdersList
                    orders={orders}
                    selectedOrders={selectedOrders}
                    handleToggleOrder={handleToggleOrder}
                />

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertTriangle size={16} className="text-orange-600" />
                        <span>
                            This will update {selectedCount} order{selectedCount !== 1 ? 's' : ''} in Firebase
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isFixing}
                            className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={executePhoneFix}
                            disabled={isFixing || selectedCount === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFixing ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    <span>Fixing... ({fixProgress.processed}/{fixProgress.total})</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    <span>Fix Selected ({selectedCount})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhoneFormatModal;
