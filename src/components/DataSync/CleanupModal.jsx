import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const CleanupModal = ({ isOpen, onClose, onConfirm, type, data, loading }) => {
    const [selectedItems, setSelectedItems] = useState(new Set());

    const toggleItem = (id) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const toggleAll = () => {
        if (selectedItems.size === data.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(data.map((_, idx) => idx)));
        }
    };

    const handleConfirm = () => {
        const itemsToCleanup = data.filter((_, idx) => selectedItems.has(idx));
        onConfirm(itemsToCleanup);
        setSelectedItems(new Set());
    };

    const getTitle = () => {
        switch (type) {
            case 'duplicates':
                return 'Remove Duplicate Entries';
            case 'archive':
                return 'Archive Old Data';
            case 'export':
                return 'Export Data';
            default:
                return 'Cleanup';
        }
    };

    const getDescription = () => {
        switch (type) {
            case 'duplicates':
                return 'Select duplicate entries to remove. This action cannot be undone.';
            case 'archive':
                return 'Select orders to archive. Archived data will be moved to a separate storage.';
            case 'export':
                return 'Select data to export to JSON format.';
            default:
                return 'Select items to process.';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                type === 'duplicates' ? 'bg-yellow-100' :
                                type === 'archive' ? 'bg-blue-100' :
                                'bg-green-100'
                            }`}>
                                <Trash2 className={
                                    type === 'duplicates' ? 'text-yellow-600' :
                                    type === 'archive' ? 'text-blue-600' :
                                    'text-green-600'
                                } size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
                                <p className="text-sm text-gray-500 mt-1">{getDescription()}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Warning Banner */}
                    {type === 'duplicates' && (
                        <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-semibold text-yellow-900 text-sm mb-1">Warning: Permanent Action</h4>
                                <p className="text-sm text-yellow-700">
                                    This action cannot be undone. Make sure to review all selected items before confirming.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {data.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clean!</h3>
                                <p className="text-gray-500">No items found to {type === 'duplicates' ? 'clean up' : 'process'}.</p>
                            </div>
                        ) : (
                            <>
                                {/* Select All */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.size === data.length && data.length > 0}
                                            onChange={toggleAll}
                                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="font-semibold text-gray-900">
                                            Select All ({selectedItems.size}/{data.length})
                                        </span>
                                    </label>
                                    <span className="text-sm text-gray-500">
                                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                                    </span>
                                </div>

                                {/* Items List */}
                                <div className="space-y-3">
                                    {data.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`border rounded-lg p-4 transition-all ${
                                                selectedItems.has(idx)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(idx)}
                                                    onChange={() => toggleItem(idx)}
                                                    className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {item.name || item.customerName || `Item ${idx + 1}`}
                                                            </h4>
                                                            {item.phone && (
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Phone: {item.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {item.date && (
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                {item.date}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.details && (
                                                        <p className="text-sm text-gray-600">{item.details}</p>
                                                    )}
                                                    {item.reason && (
                                                        <p className="text-xs text-yellow-600 mt-2">
                                                            Reason: {item.reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {data.length > 0 && (
                        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-600">
                                {selectedItems.size} of {data.length} item{data.length !== 1 ? 's' : ''} selected
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={selectedItems.size === 0 || loading}
                                    className={`px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                        type === 'duplicates' ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-600/30' :
                                        type === 'archive' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30' :
                                        'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
                                    }`}
                                >
                                    {loading ? 'Processing...' :
                                     type === 'duplicates' ? 'Remove Selected' :
                                     type === 'archive' ? 'Archive Selected' :
                                     'Export Selected'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CleanupModal;
