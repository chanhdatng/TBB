import React, { useState, useRef, useMemo } from 'react';
import { X, Clock, CheckCircle, ArrowRight, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getTimeSlotFromDate } from '../../utils/preOrderHelpers';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Virtualized Orders List for display only
 */
const OrdersList = ({ orders }) => {
    const parentRef = useRef(null);

    const virtualizer = useVirtualizer({
        count: orders.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 5
    });

    if (orders.length === 0) {
        return (
            <div className="p-6 overflow-y-auto max-h-80">
                <div className="text-center py-8 text-gray-500">
                    <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>No orders missing delivery time slot</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={parentRef} className="p-6 overflow-y-auto max-h-80">
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
                                padding: '4px 0'
                            }}
                        >
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="font-medium text-gray-900 truncate">{order.customerName}</span>
                                        <span className="text-xs text-gray-400">
                                            {order.orderId.substring(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm flex-shrink-0">
                                        <span className="text-gray-500">{order.orderTime}</span>
                                        <ArrowRight size={14} className="text-gray-400" />
                                        <span className="text-green-600 font-medium">{order.suggestedSlot}</span>
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

const DeliveryTimeSlotModal = ({ isOpen, onClose, orders }) => {
    // useAuth does not expose token directly, so we get it from localStorage
    const token = localStorage.getItem('authToken');
    const [isFixing, setIsFixing] = useState(false);
    const [fixResult, setFixResult] = useState(null);
    const [error, setError] = useState(null);

    // Process orders to get suggested time slots (for display only)
    const processedOrders = useMemo(() => {
        if (!orders) return [];
        
        return orders.slice(0, 100).map(order => { // Show first 100 for preview
            const orderDateRaw = order.timeline?.received?.raw;
            const suggestedSlot = getTimeSlotFromDate(orderDateRaw);
            const orderTime = orderDateRaw 
                ? new Date(orderDateRaw).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                : 'Unknown';
            
            return {
                orderId: order.id,
                customerName: order.customer?.name || 'Unknown',
                orderDate: order.timeline?.received?.date || 'N/A',
                orderTime,
                suggestedSlot,
                status: order.status || 'Unknown'
            };
        }).filter(o => o.suggestedSlot);
    }, [orders]);

    if (!isOpen) return null;

    const executeBackendFix = async () => {
        setIsFixing(true);
        setError(null);
        setFixResult(null);

        try {
            // Use relative path to leverage Vite proxy in development if VITE_API_URL is not set
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const apiUrl = `${API_BASE}/api/admin/fix-timeslots`;
            
            console.log('Fixing timeslots via API:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.');
                }
                throw new Error(result.message || 'Failed to fix time slots');
            }

            setFixResult(result.data);

            // Auto close after 3 seconds if successful
            setTimeout(() => {
                setFixResult(null);
                onClose();
            }, 3000);

        } catch (err) {
            console.error('Fix timeslots error:', err);
            setError(err.message);
        } finally {
            setIsFixing(false);
        }
    };

    const totalOrders = orders?.length || 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                            <Clock className="text-cyan-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Add Delivery Time Slots</h2>
                            <p className="text-sm text-gray-500">Batch update via backend server</p>
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

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-4 rounded-xl border bg-red-50 border-red-200">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-red-600" size={20} />
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Fix Result */}
                {fixResult && (
                    <div className="mx-6 mt-4 p-4 rounded-xl border bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-green-600" size={20} />
                            <div className="text-green-800">
                                <p className="font-medium">Update completed in {fixResult.duration}!</p>
                                <p className="text-sm">
                                    Updated: {fixResult.updated} | Already had slot: {fixResult.skipped}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary */}
                <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center">
                            <Zap className="text-cyan-600" size={32} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">orders sẽ được cập nhật deliveryTimeSlot</p>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                        Việc xử lý sẽ được thực hiện bởi server backend, nhanh chóng và hiệu quả.
                    </p>
                </div>

                {/* Preview List */}
                <div className="border-b border-gray-100">
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm text-gray-600 font-medium">
                            Preview (showing first {Math.min(100, processedOrders.length)} orders)
                        </p>
                    </div>
                    <OrdersList orders={processedOrders} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 p-6 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap size={16} className="text-cyan-600" />
                        <span>Server-side batch processing (~2-3 seconds)</span>
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
                            onClick={executeBackendFix}
                            disabled={isFixing || totalOrders === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFixing ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Zap size={20} />
                                    <span>Standardize All ({totalOrders.toLocaleString()})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTimeSlotModal;
