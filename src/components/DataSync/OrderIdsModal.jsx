import React, { useState, useRef } from 'react';
import { X, Calendar, CheckCircle, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { database } from '../../firebase';
import { ref, update } from 'firebase/database';
import { useVirtualizer } from '@tanstack/react-virtual';

const OrderIdsModal = ({ isOpen, onClose, customers }) => {
    const [selectedCustomers, setSelectedCustomers] = useState({});
    const [isFixing, setIsFixing] = useState(false);
    const [fixProgress, setFixProgress] = useState({ processed: 0, total: 0, failed: 0 });
    const [fixResult, setFixResult] = useState(null);

    /**
     * PERFORMANCE OPTIMIZATION: Virtualization for customer list
     */
    const parentRef = useRef(null);

    const virtualizer = useVirtualizer({
        count: customers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 180, // Taller cards due to first/last order ID display
        overscan: 5
    });

    if (!isOpen) return null;

    const handleSelectAll = () => {
        const newSelection = {};
        customers.forEach(customer => {
            newSelection[customer.phone] = true;
        });
        setSelectedCustomers(newSelection);
    };

    const handleDeselectAll = () => {
        setSelectedCustomers({});
    };

    const handleToggleCustomer = (phone) => {
        setSelectedCustomers(prev => ({
            ...prev,
            [phone]: !prev[phone]
        }));
    };

    const getSelectedCustomers = () => {
        return customers.filter(customer => selectedCustomers[customer.phone]);
    };

    const executeOrderIdsFix = async () => {
        const selected = getSelectedCustomers();
        if (selected.length === 0) {
            alert('Please select at least one customer to fix');
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

            const promises = batch.map(async (customer) => {
                try {
                    const updates = {
                        firstOrderId: customer.correctFirstOrderId,
                        lastOrderId: customer.correctLastOrderId
                    };

                    await update(ref(database, 'newCustomers/' + customer.phone), updates);
                    
                    return { success: true, phone: customer.phone };
                } catch (error) {
                    console.error(`Failed to fix order IDs for ${customer.phone}:`, error);
                    return { success: false, phone: customer.phone, error };
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
        setSelectedCustomers({});

        // Auto close after 3 seconds if all successful
        if (failed === 0) {
            setTimeout(() => {
                setFixResult(null);
                onClose();
            }, 3000);
        }
    };

    const selectedCount = Object.values(selectedCustomers).filter(Boolean).length;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Calendar className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Sync Order IDs</h2>
                            <p className="text-sm text-gray-500">Update firstOrderId and lastOrderId for customers</p>
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
                                Sync completed: {fixResult.success} successful
                                {fixResult.failed > 0 && `, ${fixResult.failed} failed`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Summary */}
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <strong>{customers.length}</strong> customers need order ID sync
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

                {/* Customers List with Virtualization */}
                <div ref={parentRef} className="p-6 overflow-y-auto max-h-96">
                    {customers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                            <p>All customers have correct order IDs</p>
                        </div>
                    ) : (
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative'
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualItem) => {
                                const customer = customers[virtualItem.index];

                                return (
                                    <div
                                        key={customer.phone}
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
                                                ${selectedCustomers[customer.phone]
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-100 hover:border-gray-200'
                                                }
                                            `}
                                            onClick={() => handleToggleCustomer(customer.phone)}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox */}
                                                <div className="mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCustomers[customer.phone] || false}
                                                        onChange={() => handleToggleCustomer(customer.phone)}
                                                        className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>

                                                {/* Customer Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                        <span className="font-medium text-gray-900">{customer.name}</span>
                                                        <span className="text-xs text-gray-500">({customer.phone})</span>
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            {customer.totalOrders} orders
                                                        </span>
                                                        {customer.issues.map((issue, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                                                {issue}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* First Order ID */}
                                                    <div className="mb-3 pb-3 border-b border-gray-200">
                                                        <p className="text-xs font-semibold text-gray-700 mb-2">First Order ID:</p>
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-500 mb-1">Current:</p>
                                                                {customer.currentFirstOrderId ? (
                                                                    <p className="text-gray-600 font-mono text-xs truncate">{customer.currentFirstOrderId}</p>
                                                                ) : (
                                                                    <p className="text-red-600 italic text-xs">Missing</p>
                                                                )}
                                                            </div>

                                                            <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />

                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-500 mb-1">Correct:</p>
                                                                <p className="text-green-600 font-mono font-medium text-xs truncate">{customer.correctFirstOrderId}</p>
                                                            </div>

                                                            <div className="text-xs text-gray-500">
                                                                {customer.firstOrderDate}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Last Order ID */}
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-700 mb-2">Last Order ID:</p>
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-500 mb-1">Current:</p>
                                                                {customer.currentLastOrderId ? (
                                                                    <p className="text-gray-600 font-mono text-xs truncate">{customer.currentLastOrderId}</p>
                                                                ) : (
                                                                    <p className="text-red-600 italic text-xs">Missing</p>
                                                                )}
                                                            </div>

                                                            <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />

                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-500 mb-1">Correct:</p>
                                                                <p className="text-green-600 font-mono font-medium text-xs truncate">{customer.correctLastOrderId}</p>
                                                            </div>

                                                            <div className="text-xs text-gray-500">
                                                                {customer.lastOrderDate}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertTriangle size={16} className="text-indigo-600" />
                        <span>
                            This will update {selectedCount} customer{selectedCount !== 1 ? 's' : ''} in Firebase
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
                            onClick={executeOrderIdsFix}
                            disabled={isFixing || selectedCount === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFixing ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    <span>Syncing... ({fixProgress.processed}/{fixProgress.total})</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    <span>Sync Selected ({selectedCount})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderIdsModal;
