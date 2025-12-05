import React, { useState, useMemo } from 'react';
import { database } from '../../firebase';
import { ref, update } from 'firebase/database';
import { RefreshCw, Database, Search, Filter, X, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import ConfirmSyncModal from './ConfirmSyncModal';

const SyncDataModal = ({ isOpen, onClose, syncData }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'missing', 'conflict', 'synced'
    const [syncType, setSyncType] = useState('socialLink'); // 'socialLink', 'addresses', 'both'
    const [selectedItems, setSelectedItems] = useState({}); // { phone: 'keep' | 'update' | 'skip' }
    const [isSyncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ processed: 0, total: 0, failed: 0 });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    // Filter and search
    const filteredData = useMemo(() => {
        let filtered = syncData;

        // Filter by sync type
        if (syncType === 'socialLink') {
            filtered = filtered.filter(item => item.socialLinkStatus !== 'none');
        } else if (syncType === 'addresses') {
            filtered = filtered.filter(item => item.addressesStatus !== 'none');
        }
        // 'both' shows all

        // Filter by type
        if (filterType !== 'all') {
            if (filterType === 'missing') {
                filtered = filtered.filter(item => item.conflictType === 'missing');
            } else if (filterType === 'conflict') {
                filtered = filtered.filter(item => item.conflictType === 'different');
            } else if (filterType === 'synced') {
                filtered = filtered.filter(item => item.conflictType === 'same');
            }
        }

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(query) ||
                item.phone?.includes(query) ||
                item.orderSocialLink?.toLowerCase().includes(query) ||
                item.orderAddresses?.some(addr => addr.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [syncData, filterType, searchQuery, syncType]);

    // Handle selection change
    const handleActionChange = (phone, action) => {
        setSelectedItems(prev => ({
            ...prev,
            [phone]: action
        }));
    };

    // Handle select all for filtered items
    const handleSelectAll = (action) => {
        const newSelections = {};
        filteredData.forEach(item => {
            if (item.conflictType !== 'same') {
                newSelections[item.phone] = action;
            }
        });
        setSelectedItems(prev => ({
            ...prev,
            ...newSelections
        }));
    };

    // Prepare sync summary
    const getSyncSummary = () => {
        const updates = [];
        const skips = [];
        const keeps = [];

        filteredData.forEach(item => {
            const action = selectedItems[item.phone];
            if (action === 'update') {
                updates.push(item);
            } else if (action === 'skip') {
                skips.push(item);
            } else if (action === 'keep') {
                keeps.push(item);
            }
        });

        return { updates, skips, keeps };
    };

    // Execute sync
    const executeSync = async () => {
        const { updates } = getSyncSummary();
        if (updates.length === 0) {
            alert('No items selected for update');
            return;
        }

        setSyncing(true);
        setSyncProgress({ processed: 0, total: updates.length, failed: 0 });

        const BATCH_SIZE = 50;
        const DELAY_MS = 100;
        let processed = 0;
        let failed = 0;

        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);

            const promises = batch.map(async (item) => {
                try {
                    const updateData = {};

                    // Sync socialLink if needed and selected
                    if (syncType === 'socialLink' || syncType === 'both') {
                        if (item.orderSocialLink && item.socialLinkStatus !== 'same') {
                            updateData.socialLink = item.orderSocialLink;
                        }
                    }

                    // Sync addresses if needed and selected
                    if (syncType === 'addresses' || syncType === 'both') {
                        if (item.missingAddresses && item.missingAddresses.length > 0) {
                            // Merge current addresses with missing ones
                            const mergedAddresses = [
                                ...new Set([
                                    ...(item.currentAddresses || []),
                                    ...item.missingAddresses
                                ])
                            ];
                            updateData.addresses = mergedAddresses;
                        }
                    }

                    if (Object.keys(updateData).length > 0) {
                        await update(ref(database, 'newCustomers/' + item.phone), updateData);
                    }

                    return { success: true, phone: item.phone };
                } catch (error) {
                    console.error(`Failed to sync ${item.phone}:`, error);
                    return { success: false, phone: item.phone, error };
                }
            });

            const results = await Promise.all(promises);
            processed += batch.length;
            failed += results.filter(r => !r.success).length;

            setSyncProgress({ processed, total: updates.length, failed });

            // Delay between batches
            if (i + BATCH_SIZE < updates.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        setSyncing(false);
        setSyncResult({
            total: updates.length,
            success: processed - failed,
            failed: failed
        });

        // Clear selections after successful sync
        setSelectedItems({});
        setShowConfirmModal(false);

        // Show result notification
        setTimeout(() => setSyncResult(null), 5000);
    };

    const openConfirmModal = () => {
        const { updates } = getSyncSummary();
        if (updates.length === 0) {
            alert('Please select at least one item to update');
            return;
        }
        setShowConfirmModal(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-zoom-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Review Data Sync</h2>
                        <p className="text-sm text-gray-500">Select items to synchronize with Firebase</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Filters and Actions */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, phone, address, or social link..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {/* Sync Type Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">Sync:</span>
                            <select
                                value={syncType}
                                onChange={(e) => setSyncType(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="both">Both</option>
                                <option value="socialLink">SocialLink Only</option>
                                <option value="addresses">Addresses Only</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">All ({syncData.length})</option>
                                <option value="missing">Missing</option>
                                <option value="conflict">Conflicts</option>
                                <option value="synced">Synced</option>
                            </select>
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleSelectAll('update')}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Select All to Update
                            </button>
                            <button
                                onClick={openConfirmModal}
                                disabled={isSyncing || Object.keys(selectedItems).length === 0}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSyncing ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} />
                                        Syncing... ({syncProgress.processed}/{syncProgress.total})
                                    </>
                                ) : (
                                    <>
                                        <Database size={20} />
                                        Sync Selected ({Object.values(selectedItems).filter(a => a === 'update').length})
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sync Result Notification */}
                {syncResult && (
                    <div className="px-6 pt-6">
                        <div className={`p-4 rounded-xl border ${syncResult.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                            }`}>
                            <div className="flex items-center gap-3">
                                {syncResult.failed > 0 ? (
                                    <AlertTriangle className="text-yellow-600" size={20} />
                                ) : (
                                    <CheckCircle className="text-green-600" size={20} />
                                )}
                                <p className={syncResult.failed > 0 ? 'text-yellow-800' : 'text-green-800'}>
                                    Sync completed: {syncResult.success} successful
                                    {syncResult.failed > 0 && `, ${syncResult.failed} failed`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">SocialLink Status</th>
                                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Addresses Status</th>
                                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                                            No data found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.phone} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4">
                                                {item.conflictType === 'missing' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Missing
                                                    </span>
                                                )}
                                                {item.conflictType === 'different' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Conflict
                                                    </span>
                                                )}
                                                {item.conflictType === 'same' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Synced
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.name}</div>
                                                    <div className="text-sm text-gray-500">{item.phone}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{item.orderCount} orders</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.socialLinkStatus === 'none' ? (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 w-16">Current:</span>
                                                            <span className="text-gray-900 truncate max-w-[150px]" title={item.currentSocialLink}>
                                                                {item.currentSocialLink || <span className="text-gray-400 italic">None</span>}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 w-16">Order:</span>
                                                            <span className="text-blue-600 font-medium truncate max-w-[150px]" title={item.orderSocialLink}>
                                                                {item.orderSocialLink}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.addressesStatus === 'none' ? (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500">Current:</span>
                                                            <span className="text-gray-900">{item.currentAddresses?.length || 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500">New:</span>
                                                            <span className="text-purple-600 font-medium">+{item.missingAddresses?.length || 0}</span>
                                                        </div>
                                                        {item.missingAddresses?.length > 0 && (
                                                            <div className="text-xs text-purple-600 truncate max-w-[200px]">
                                                                {item.missingAddresses.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {item.conflictType !== 'same' && (
                                                    <div className="flex items-center gap-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`action-${item.phone}`}
                                                                checked={selectedItems[item.phone] === 'update'}
                                                                onChange={() => handleActionChange(item.phone, 'update')}
                                                                className="text-primary focus:ring-primary"
                                                            />
                                                            <span className="text-sm text-gray-700">Update</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`action-${item.phone}`}
                                                                checked={selectedItems[item.phone] === 'skip'}
                                                                onChange={() => handleActionChange(item.phone, 'skip')}
                                                                className="text-gray-400 focus:ring-gray-400"
                                                            />
                                                            <span className="text-sm text-gray-500">Skip</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmSyncModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={executeSync}
                summary={getSyncSummary()}
                isSyncing={isSyncing}
            />
        </div>
    );
};

export default SyncDataModal;
