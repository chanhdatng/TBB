import React, { useState } from 'react';
import { X, Key, CheckCircle, ArrowRight, AlertTriangle, RefreshCw, AlertCircle as Alert } from 'lucide-react';
import { database } from '../../firebase';
import { ref, set, remove } from 'firebase/database';

const RenameOrderKeysModal = ({ isOpen, onClose, orders }) => {
    const [selectedOrders, setSelectedOrders] = useState({});
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameProgress, setRenameProgress] = useState({ processed: 0, total: 0, failed: 0 });
    const [renameResult, setRenameResult] = useState(null);
    const [confirmText, setConfirmText] = useState('');

    if (!isOpen) return null;

    const handleSelectAll = () => {
        const newSelection = {};
        orders.forEach(order => {
            newSelection[order.firebaseKey] = true;
        });
        setSelectedOrders(newSelection);
    };

    const handleDeselectAll = () => {
        setSelectedOrders({});
    };

    const handleToggleOrder = (firebaseKey) => {
        setSelectedOrders(prev => ({
            ...prev,
            [firebaseKey]: !prev[firebaseKey]
        }));
    };

    const getSelectedOrders = () => {
        return orders.filter(order => selectedOrders[order.firebaseKey]);
    };

    const executeRename = async () => {
        const selected = getSelectedOrders();
        if (selected.length === 0) {
            alert('Please select at least one order to rename');
            return;
        }

        if (confirmText !== 'RENAME') {
            alert('Please type "RENAME" to confirm this dangerous operation');
            return;
        }

        setIsRenaming(true);
        setRenameProgress({ processed: 0, total: selected.length, failed: 0 });

        const BATCH_SIZE = 1; // Process one at a time for maximum speed
        const DELAY_MS = 50; // Short delay between operations
        let processed = 0;
        let failed = 0;

        for (let i = 0; i < selected.length; i += BATCH_SIZE) {
            const batch = selected.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async (order) => {
                try {
                    // Step 1: Create new node with correct ID
                    await set(ref(database, 'orders/' + order.actualId), order.rawData);
                    
                    // Step 2: Delete old node with wrong key
                    await remove(ref(database, 'orders/' + order.firebaseKey));
                    
                    return { success: true, firebaseKey: order.firebaseKey, actualId: order.actualId };
                } catch (error) {
                    console.error(`Failed to rename ${order.firebaseKey} to ${order.actualId}:`, error);
                    return { success: false, firebaseKey: order.firebaseKey, error };
                }
            });

            const results = await Promise.all(promises);
            processed += batch.length;
            failed += results.filter(r => !r.success).length;

            setRenameProgress({ processed, total: selected.length, failed });

            // Delay between batches
            if (i + BATCH_SIZE < selected.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        setIsRenaming(false);
        setRenameResult({
            total: selected.length,
            success: processed - failed,
            failed: failed
        });

        // Clear selections and confirm text
        setSelectedOrders({});
        setConfirmText('');

        // Auto close after 5 seconds if all successful
        if (failed === 0) {
            setTimeout(() => {
                setRenameResult(null);
                onClose();
            }, 5000);
        }
    };

    const selectedCount = Object.values(selectedOrders).filter(Boolean).length;

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
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-rose-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                            <Key className="text-rose-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Rename Firebase Keys</h2>
                            <p className="text-sm text-rose-600 font-medium">⚠️ Dangerous Operation - Cannot be undone!</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isRenaming}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Warning Banner */}
                <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                    <div className="flex items-start gap-3">
                        <Alert className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Important Warning:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>This will rename Firebase order nodes from "name_id" format to actual ID</li>
                                <li>The old nodes will be deleted after creating new ones</li>
                                <li>This operation cannot be undone</li>
                                <li>Make sure you have a backup before proceeding</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Rename Result */}
                {renameResult && (
                    <div className={`mx-6 mt-4 p-4 rounded-xl border ${
                        renameResult.failed > 0 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : 'bg-green-50 border-green-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            {renameResult.failed > 0 ? (
                                <AlertTriangle className="text-yellow-600" size={20} />
                            ) : (
                                <CheckCircle className="text-green-600" size={20} />
                            )}
                            <p className={renameResult.failed > 0 ? 'text-yellow-800' : 'text-green-800'}>
                                Rename completed: {renameResult.success} successful
                                {renameResult.failed > 0 && `, ${renameResult.failed} failed`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Summary */}
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <strong>{orders.length}</strong> orders with wrong Firebase keys
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSelectAll}
                                disabled={isRenaming}
                                className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                disabled={isRenaming}
                                className="text-sm text-gray-600 hover:underline font-medium disabled:opacity-50"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Key size={48} className="mx-auto text-gray-300 mb-3" />
                            <p>All orders have correct Firebase keys</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <div
                                    key={order.firebaseKey}
                                    className={`
                                        bg-gray-50 rounded-xl p-4 border transition-all cursor-pointer
                                        ${selectedOrders[order.firebaseKey] 
                                            ? 'border-primary bg-primary/5' 
                                            : 'border-gray-100 hover:border-gray-200'
                                        }
                                    `}
                                    onClick={() => handleToggleOrder(order.firebaseKey)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <div className="mt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders[order.firebaseKey] || false}
                                                onChange={() => handleToggleOrder(order.firebaseKey)}
                                                className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                <span className="font-medium text-gray-900">{order.customerName}</span>
                                                <span className={`
                                                    px-2 py-0.5 rounded text-xs font-medium
                                                    ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : ''}
                                                    ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                    ${order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : ''}
                                                `}>
                                                    {order.status}
                                                </span>
                                                <span className="text-xs text-gray-500">{order.orderDate}</span>
                                            </div>

                                            {/* Key Change */}
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 mb-1">Current Firebase Key:</p>
                                                    <p className="text-red-600 font-mono text-xs truncate">{order.firebaseKey}</p>
                                                </div>
                                                
                                                <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 mb-1">Will become:</p>
                                                    <p className="text-green-600 font-mono font-medium text-xs truncate">{order.actualId}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirmation Input */}
                {selectedCount > 0 && (
                    <div className="px-6 pb-4 border-b border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type <span className="font-bold text-rose-600">RENAME</span> to confirm this operation:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type RENAME"
                            disabled={isRenaming}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:opacity-50"
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertTriangle size={16} className="text-rose-600" />
                        <span>
                            This will rename {selectedCount} order node{selectedCount !== 1 ? 's' : ''} in Firebase
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isRenaming}
                            className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={executeRename}
                            disabled={isRenaming || selectedCount === 0 || confirmText !== 'RENAME'}
                            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRenaming ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    <span>Renaming... ({renameProgress.processed}/{renameProgress.total})</span>
                                </>
                            ) : (
                                <>
                                    <Key size={20} />
                                    <span>Rename Selected ({selectedCount})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RenameOrderKeysModal;
