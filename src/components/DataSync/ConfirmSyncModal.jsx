import React from 'react';
import { X, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const ConfirmSyncModal = ({ isOpen, onClose, onConfirm, summary, isSyncing }) => {
    if (!isOpen) return null;

    const { updates, skips, keeps } = summary;

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
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-primary" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Confirm Sync Operation</h2>
                            <p className="text-sm text-gray-500">Review changes before applying</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSyncing}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-green-100">
                            <p className="text-sm text-gray-500 font-medium">Will Update</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{updates.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium">Will Skip</p>
                            <p className="text-2xl font-bold text-gray-600 mt-1">{skips.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-blue-100">
                            <p className="text-sm text-gray-500 font-medium">Keep Existing</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{keeps.length}</p>
                        </div>
                    </div>
                </div>

                {/* Changes List */}
                <div className="p-6 overflow-y-auto max-h-96">
                    {updates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <AlertTriangle size={48} className="mx-auto text-gray-300 mb-3" />
                            <p>No items selected for update</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
                                Changes to Apply ({updates.length})
                            </h3>

                            <div className="space-y-3">
                                {updates.map((item, index) => (
                                    <div
                                        key={item.phone}
                                        className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-medium text-gray-900">{item.name}</span>
                                                    <span className="text-xs text-gray-500">({item.phone})</span>
                                                    {item.conflictType === 'different' && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                            Conflict
                                                        </span>
                                                    )}
                                                    {item.conflictType === 'missing' && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                                            Missing
                                                        </span>
                                                    )}
                                                    {item.orderCount && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            {item.orderCount} orders
                                                        </span>
                                                    )}
                                                </div>

                                                {/* SocialLink changes */}
                                                {item.orderSocialLink && item.socialLinkStatus !== 'same' && (
                                                    <div className="mb-3">
                                                        <p className="text-xs font-semibold text-gray-700 mb-1">SocialLink:</p>
                                                        <div className="flex items-center gap-3 text-sm">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-500 mb-1">Current:</p>
                                                                {item.currentSocialLink ? (
                                                                    <p className="text-gray-600 truncate">{item.currentSocialLink}</p>
                                                                ) : (
                                                                    <p className="text-gray-400 italic">None</p>
                                                                )}
                                                            </div>
                                                            
                                                            <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-500 mb-1">New:</p>
                                                                <p className="text-green-600 font-medium truncate">{item.orderSocialLink}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Address changes */}
                                                {item.missingAddresses && item.missingAddresses.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-700 mb-1">Addresses to add:</p>
                                                        <div className="bg-purple-50 rounded-lg p-2 space-y-1">
                                                            {item.missingAddresses.map((addr, idx) => (
                                                                <p key={idx} className="text-xs text-purple-700">+ {addr}</p>
                                                            ))}
                                                        </div>
                                                        {item.currentAddresses && item.currentAddresses.length > 0 && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Will be merged with {item.currentAddresses.length} existing address{item.currentAddresses.length !== 1 ? 'es' : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Show skipped items if any */}
                            {skips.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-3">
                                        Will Skip ({skips.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {skips.map((item) => (
                                            <div key={item.phone} className="flex items-center gap-2 text-sm text-gray-500">
                                                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                                <span>{item.name}</span>
                                                <span className="text-xs">({item.phone})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Show kept items if any */}
                            {keeps.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-3">
                                        Keep Existing ({keeps.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {keeps.map((item) => (
                                            <div key={item.phone} className="flex items-center gap-2 text-sm text-gray-500">
                                                <span className="w-2 h-2 bg-blue-300 rounded-full"></span>
                                                <span>{item.name}</span>
                                                <span className="text-xs">({item.phone})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertTriangle size={16} className="text-yellow-600" />
                        <span>This action will update {updates.length} customer record{updates.length !== 1 ? 's' : ''} in Firebase</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSyncing}
                            className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isSyncing || updates.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSyncing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    <span>Confirm & Sync</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmSyncModal;
