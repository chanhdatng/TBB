import React, { useState, useMemo, useRef } from 'react';
import { X, PhoneOff, Phone, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { database } from '../../firebase';
import { ref, update, get, set, remove } from 'firebase/database';
import { useVirtualizer } from '@tanstack/react-virtual';

const InvalidPhonesModal = ({ isOpen, onClose, customers }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState({});
    const [isFixing, setIsFixing] = useState(false);
    const [fixProgress, setFixProgress] = useState({ processed: 0, total: 0, failed: 0 });
    const [fixResult, setFixResult] = useState(null);

    /**
     * PERFORMANCE OPTIMIZATION: Virtualization for long customer lists
     */
    const parentRef = useRef(null);

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        if (!customers) return [];
        if (!searchQuery) return customers;

        return customers.filter(customer =>
            customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.currentPhone?.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    // Virtualization setup
    const virtualizer = useVirtualizer({
        count: filteredCustomers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 120, // Slightly smaller cards than phone format modal
        overscan: 5
    });

    // Selection handlers
    const handleToggleSelect = (phone) => {
        console.log('Toggling selection for:', phone);
        setSelectedCustomers(prev => ({
            ...prev,
            [phone]: !prev[phone]
        }));
    };

    const handleSelectAll = () => {
        console.log('Selecting all fixable customers');
        const newSelected = {};
        filteredCustomers.forEach(c => {
            if (c.suggestedPhone && c.currentPhone) { // Only select fixable ones
                newSelected[c.currentPhone] = true;
            }
        });
        setSelectedCustomers(newSelected);
    };

    const handleDeselectAll = () => {
        console.log('Deselecting all');
        setSelectedCustomers({});
    };

    const getSelectedCount = () => Object.values(selectedCustomers).filter(Boolean).length;

    // Fix Logic
    const handleFixSelected = async () => {
        const selectedPhones = Object.keys(selectedCustomers).filter(phone => selectedCustomers[phone]);
        console.log('Starting fix for Phones:', selectedPhones);
        
        if (selectedPhones.length === 0) return;

        setIsFixing(true);
        setFixProgress({ processed: 0, total: selectedPhones.length, failed: 0 });

        const BATCH_SIZE = 5; // Smaller batch for heavier operations
        const DELAY_MS = 100;
        let processed = 0;
        let failed = 0;

        for (let i = 0; i < selectedPhones.length; i += BATCH_SIZE) {
            const batchPhones = selectedPhones.slice(i, i + BATCH_SIZE);
            console.log('Processing batch:', batchPhones);
            
            await Promise.all(batchPhones.map(async (phone) => {
                const customer = customers.find(c => c.currentPhone === phone);
                console.log(`Fixing customer record with Phone ${phone}:`, customer);
                
                if (!customer || !customer.suggestedPhone) return;

                try {
                    // We use the current Phone as the key to find the record in Firebase
                    const oldRef = ref(database, `newCustomers/${phone}`);
                    const newKey = customer.suggestedPhone;
                    const newRef = ref(database, `newCustomers/${newKey}`);

                    console.log(`Migrating data from Key ${phone} to Key ${newKey}`);

                    // If existing Key is NOT the correct phone number
                    if (phone !== newKey) {
                        const snapshot = await get(oldRef);
                        if (snapshot.exists()) {
                            const data = snapshot.val();
                            // Remove internal id if present
                            const { id, ...rest } = data;
                            
                            const newData = {
                                ...rest,
                                phone: newKey // Ensure phone field matches new key
                            };

                            console.log('Writing data to new Key:', newKey, newData);
                            // Write to new key first
                            await set(newRef, newData);
                            console.log('Removing old Key:', phone);
                            // Then delete old key
                            await remove(oldRef);
                        } else {
                            console.warn(`Snapshot not found for Key ${phone}`);
                        }
                    } else {
                        // Just update field if keys match (rare case in this context but possible)
                        console.log('Updating in-place for Key', phone);
                        await update(oldRef, {
                            phone: newKey
                        });
                    }
                } catch (error) {
                    console.error(`Failed to fix customer ${phone}:`, error);
                    failed++;
                }
            }));

            processed += batchPhones.length;
            setFixProgress({ processed, total: selectedPhones.length, failed });
            
            if (i + BATCH_SIZE < selectedPhones.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        setIsFixing(false);
        setFixResult({
            success: processed - failed,
            failed,
            total: selectedPhones.length
        });

        setSelectedCustomers({});
        
        // Auto clear result after 3s
        setTimeout(() => setFixResult(null), 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <PhoneOff className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Invalid Phone Numbers</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {filteredCustomers.length} customer(s) found
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Controls & Search */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleSelectAll}
                                disabled={isFixing}
                                className="text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                            >
                                Select All
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                onClick={handleDeselectAll}
                                disabled={isFixing}
                                className="text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>

                    {/* Fix Status */}
                    {fixResult && (
                        <div className={`mt-4 p-3 rounded-lg border flex items-center gap-2 ${
                            fixResult.failed > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'
                        }`}>
                            {fixResult.failed > 0 ? <AlertCircle size={18} /> : <Check size={18} />}
                            <span className="font-medium">
                                Fixed {fixResult.success} customers. {fixResult.failed > 0 && `${fixResult.failed} failed.`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content with Virtualization */}
                <div ref={parentRef} className="flex-1 overflow-y-auto p-6">
                    {filteredCustomers.length === 0 ? (
                        <div className="text-center py-12">
                            <PhoneOff className="text-gray-300 mx-auto mb-4" size={64} />
                            <p className="text-gray-500 font-medium">No invalid phone numbers found</p>
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
                                const customer = filteredCustomers[virtualItem.index];
                                const isSelected = selectedCustomers[customer.currentPhone] || false;

                                return (
                                    <div
                                        key={customer.currentPhone}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualItem.start}px)`,
                                            padding: '4px 0'
                                        }}
                                    >
                                        <div
                                            onClick={() => handleToggleSelect(customer.currentPhone)}
                                            className={`p-4 border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${
                                                isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-red-300'
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                                isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                                            }`}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>

                                            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Info */}
                                                <div>
                                                    <h3 className="font-bold text-gray-900 truncate">{customer.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span>Joined: {customer.createdAt}</span>
                                                    </div>
                                                </div>

                                                {/* Phone Status */}
                                                <div className="flex flex-col sm:items-end justify-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 line-through text-sm">{customer.currentPhone || 'N/A'}</span>
                                                        <ChevronRight size={16} className="text-gray-400" />
                                                        <span className="font-mono font-bold text-green-600">
                                                            {customer.suggestedPhone || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-red-500 mt-1">
                                                        {customer.issues}
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
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{getSelectedCount()}</span> customer(s) selected
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                            {getSelectedCount() > 0 && (
                                <button
                                    onClick={handleFixSelected}
                                    disabled={isFixing}
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isFixing ? 'Fixing...' : 'Fix Selected'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvalidPhonesModal;
