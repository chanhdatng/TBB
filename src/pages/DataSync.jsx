import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { database } from '../firebase';
import { ref, update } from 'firebase/database';
import { RefreshCw, Users, AlertCircle, CheckCircle, Database, Search, Filter, Download, AlertTriangle, Phone, Calendar, Key, UserCheck } from 'lucide-react';
import ConfirmSyncModal from '../components/DataSync/ConfirmSyncModal';
import PhoneFormatModal from '../components/DataSync/PhoneFormatModal';
import OrderIdsModal from '../components/DataSync/OrderIdsModal';
import RenameOrderKeysModal from '../components/DataSync/RenameOrderKeysModal';
import CustomerFieldsModal from '../components/DataSync/CustomerFieldsModal';

const DataSync = () => {
    const { orders, customers, loading } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'missing', 'conflict', 'synced'
    const [syncType, setSyncType] = useState('socialLink'); // 'socialLink', 'addresses', 'both'
    const [selectedItems, setSelectedItems] = useState({}); // { phone: 'keep' | 'update' | 'skip' }
    const [isSyncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ processed: 0, total: 0, failed: 0 });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [showPhoneFormatModal, setShowPhoneFormatModal] = useState(false);
    const [showOrderIdsModal, setShowOrderIdsModal] = useState(false);
    const [showRenameKeysModal, setShowRenameKeysModal] = useState(false);
    const [showCustomerFieldsModal, setShowCustomerFieldsModal] = useState(false);

    // Normalize phone number for comparison
    const normalizePhone = (phone) => phone?.replace(/\D/g, '') || '';

    // Detect orders with phone format issues (+84 or whitespace)
    const ordersWithPhoneIssues = useMemo(() => {
        if (!orders) return [];
        
        return orders
            .filter(order => {
                const phone = order.customer?.phone || order.customerPhone;
                if (!phone) return false;
                
                // Check for +84 format or whitespace
                return phone.startsWith('+84') || phone.includes(' ');
            })
            .map(order => {
                const currentPhone = order.customer?.phone || order.customerPhone;
                let suggestedPhone = currentPhone;
                let issueType = [];
                
                // Fix +84 format
                if (currentPhone.startsWith('+84')) {
                    suggestedPhone = suggestedPhone.replace(/^\+84/, '0');
                    issueType.push('+84 format');
                }
                
                // Remove whitespace
                if (currentPhone.includes(' ')) {
                    suggestedPhone = suggestedPhone.replace(/\s+/g, '');
                    issueType.push('whitespace');
                }
                
                return {
                    orderId: order.id,
                    customerName: order.customer?.name || 'Unknown',
                    currentPhone,
                    suggestedPhone,
                    issueType: issueType.join(', '),
                    orderDate: order.timeline?.ordered?.date || 'N/A',
                    status: order.status || 'Unknown'
                };
            });
    }, [orders]);

    // Detect customers missing firstOrderId or lastOrderId
    const customersMissingOrderIds = useMemo(() => {
        if (!orders || !customers) return [];

        const customerMap = new Map();
        customers.forEach(customer => {
            customerMap.set(normalizePhone(customer.phone), customer);
        });

        // Group orders by customer
        const customerOrdersMap = new Map();
        orders.forEach(order => {
            const phone = order.customer?.phone || order.customerPhone;
            if (!phone) return;

            const normalizedPhone = normalizePhone(phone);
            if (!customerOrdersMap.has(normalizedPhone)) {
                customerOrdersMap.set(normalizedPhone, []);
            }
            customerOrdersMap.get(normalizedPhone).push(order);
        });

        const result = [];
        customerOrdersMap.forEach((customerOrders, normalizedPhone) => {
            const customer = customerMap.get(normalizedPhone);
            if (!customer) return; // Skip if customer not in newCustomers

            // Sort orders by date
            const sortedOrders = [...customerOrders].sort((a, b) => {
                const dateA = a.timeline?.received?.raw || a.createDate || 0;
                const dateB = b.timeline?.received?.raw || b.createDate || 0;
                return new Date(dateA) - new Date(dateB);
            });

            const firstOrder = sortedOrders[0];
            const lastOrder = sortedOrders[sortedOrders.length - 1];

            // Get actual IDs from originalData
            const firstOrderActualId = firstOrder.originalData?.id || firstOrder.id;
            const lastOrderActualId = lastOrder.originalData?.id || lastOrder.id;

            const missingFirstOrderId = !customer.firstOrderId;
            const missingLastOrderId = !customer.lastOrderId;
            const wrongFirstOrderId = customer.firstOrderId && customer.firstOrderId !== firstOrderActualId;
            const wrongLastOrderId = customer.lastOrderId && customer.lastOrderId !== lastOrderActualId;

            if (missingFirstOrderId || missingLastOrderId || wrongFirstOrderId || wrongLastOrderId) {
                result.push({
                    phone: customer.phone,
                    name: customer.name,
                    currentFirstOrderId: customer.firstOrderId || null,
                    currentLastOrderId: customer.lastOrderId || null,
                    correctFirstOrderId: firstOrderActualId,
                    correctLastOrderId: lastOrderActualId,
                    firstOrderDate: firstOrder.timeline?.ordered?.date || 'N/A',
                    lastOrderDate: lastOrder.timeline?.ordered?.date || 'N/A',
                    totalOrders: sortedOrders.length,
                    issues: [
                        missingFirstOrderId && 'Missing firstOrderId',
                        missingLastOrderId && 'Missing lastOrderId',
                        wrongFirstOrderId && 'Wrong firstOrderId',
                        wrongLastOrderId && 'Wrong lastOrderId'
                    ].filter(Boolean)
                });
            }
        });

        return result;
    }, [orders, customers]);

    // Detect orders with Firebase key different from internal ID
    const ordersWithWrongKeys = useMemo(() => {
        if (!orders) return [];

        return orders
            .filter(order => {
                const firebaseKey = order.id; // Firebase node key (name_id format)
                const actualId = order.originalData?.id; // ID inside data
                
                // Check if they're different
                return actualId && firebaseKey !== actualId;
            })
            .map(order => ({
                firebaseKey: order.id,
                actualId: order.originalData.id,
                customerName: order.customer?.name || 'Unknown',
                orderDate: order.timeline?.ordered?.date || 'N/A',
                status: order.status || 'Unknown',
                rawData: order.originalData
            }));
    }, [orders]);

    // Detect sync scenarios for all orders with socialLinks
    const syncData = useMemo(() => {
        if (!orders || !customers) return [];

        const customerMap = new Map();
        customers.forEach(customer => {
            customerMap.set(normalizePhone(customer.phone), customer);
        });

        const syncItems = [];
        const processedCustomers = new Set();

        // Group orders by customer phone to collect all addresses
        const customerOrdersMap = new Map();
        orders.forEach(order => {
            const { customer: orderCustomer, id: orderId } = order;
            if (!orderCustomer?.phone) return;

            const normalizedPhone = normalizePhone(orderCustomer.phone);
            if (!customerOrdersMap.has(normalizedPhone)) {
                customerOrdersMap.set(normalizedPhone, []);
            }
            customerOrdersMap.get(normalizedPhone).push(order);
        });

        // Process each customer
        customerOrdersMap.forEach((customerOrders, normalizedPhone) => {
            const firstOrder = customerOrders[0];
            const orderCustomer = firstOrder.customer;
            
            // Collect unique addresses from all orders
            const orderAddresses = [...new Set(
                customerOrders
                    .map(o => o.customer?.address || o.address)
                    .filter(addr => addr && addr.trim())
            )];

            const existingCustomer = customerMap.get(normalizedPhone);

            // Check socialLink sync status
            let socialLinkStatus = 'none';
            let currentSocialLink = null;
            let orderSocialLink = null;

            const ordersWithSocialLink = customerOrders.filter(o => o.customer?.socialLink);
            if (ordersWithSocialLink.length > 0) {
                orderSocialLink = ordersWithSocialLink[0].customer.socialLink;

                if (!existingCustomer) {
                    socialLinkStatus = 'missing';
                } else if (!existingCustomer.socialLink) {
                    socialLinkStatus = 'missing';
                    currentSocialLink = null;
                } else if (existingCustomer.socialLink !== orderSocialLink) {
                    socialLinkStatus = 'different';
                    currentSocialLink = existingCustomer.socialLink;
                } else {
                    socialLinkStatus = 'same';
                    currentSocialLink = existingCustomer.socialLink;
                }
            }

            // Check addresses sync status
            let addressesStatus = 'none';
            let currentAddresses = [];
            let missingAddresses = [];

            if (existingCustomer) {
                currentAddresses = existingCustomer.addresses || [];
                // Find addresses in orders that are not in customer's addresses array
                missingAddresses = orderAddresses.filter(addr => 
                    !currentAddresses.includes(addr)
                );
                
                if (missingAddresses.length > 0) {
                    addressesStatus = 'missing';
                } else if (currentAddresses.length > 0 && orderAddresses.length > 0) {
                    addressesStatus = 'same';
                }
            } else {
                // Customer not in newCustomers
                missingAddresses = orderAddresses;
                addressesStatus = orderAddresses.length > 0 ? 'missing' : 'none';
            }

            // Determine overall conflict type
            let conflictType = 'same';
            if (socialLinkStatus === 'missing' || addressesStatus === 'missing') {
                conflictType = 'missing';
            } else if (socialLinkStatus === 'different') {
                conflictType = 'different';
            }

            // Only add if there's something to sync
            if (socialLinkStatus !== 'none' || addressesStatus !== 'none') {
                syncItems.push({
                    phone: orderCustomer.phone,
                    name: existingCustomer?.name || orderCustomer.name,
                    address: existingCustomer?.address || orderCustomer.address,
                    
                    // SocialLink data
                    currentSocialLink,
                    orderSocialLink,
                    socialLinkStatus,
                    
                    // Addresses data
                    currentAddresses,
                    orderAddresses,
                    missingAddresses,
                    addressesStatus,
                    
                    conflictType,
                    orderId: firstOrder.id,
                    orderCount: customerOrders.length
                });
            }
        });

        return syncItems;
    }, [orders, customers]);

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

    // Calculate stats
    const stats = useMemo(() => {
        const missingCount = syncData.filter(item => item.conflictType === 'missing').length;
        const conflictCount = syncData.filter(item => item.conflictType === 'different').length;
        const syncedCount = syncData.filter(item => item.conflictType === 'same').length;
        const totalCustomers = customers?.length || 0;
        const totalOrders = orders?.length || 0;
        
        // Debug: Count orders with socialLink
        const ordersWithSocialLink = orders?.filter(order => order.customer?.socialLink).length || 0;
        
        // Count customers needing address sync
        const needsAddressSync = syncData.filter(item => item.addressesStatus === 'missing').length;
        const needsSocialLinkSync = syncData.filter(item => 
            item.socialLinkStatus === 'missing' || item.socialLinkStatus === 'different'
        ).length;
        
        // Count orders with phone format issues
        const ordersNeedPhoneFormat = ordersWithPhoneIssues.length;
        
        // Count customers missing order IDs
        const customersMissingOrderIdsCount = customersMissingOrderIds.length;
        
        // Count orders with wrong Firebase keys
        const ordersWithWrongKeysCount = ordersWithWrongKeys.length;
        
        // Count customers missing required fields (name, phone, firstOrderId, lastOrderId)
        const processedPhones = new Set();
        const customersMissingRequiredFields = customers?.filter(customer => {
            // Skip duplicates
            const normalizedPhone = normalizePhone(customer.phone);
            if (processedPhones.has(normalizedPhone)) return false;
            processedPhones.add(normalizedPhone);
            
            // Skip if no orders
            const hasOrders = orders?.some(order => {
                const orderPhone = order.customer?.phone || order.customerPhone;
                return normalizePhone(orderPhone) === normalizedPhone;
            });
            if (!hasOrders) return false;
            
            // Check required fields only
            return !customer.name || !customer.phone || !customer.firstOrderId || !customer.lastOrderId;
        }).length || 0;

        return {
            totalCustomers,
            totalOrders,
            ordersWithSocialLink,
            needsAddressSync,
            needsSocialLinkSync,
            ordersNeedPhoneFormat,
            customersMissingOrderIdsCount,
            ordersWithWrongKeysCount,
            customersMissingRequiredFields,
            missingCount,
            conflictCount,
            syncedCount,
            needsAction: missingCount + conflictCount
        };
    }, [syncData, customers, orders]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Data Synchronization</h1>
                <p className="text-gray-500 mt-1">Manage customer social links from orders to Firebase</p>
                <div className="mt-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <strong>Debug Info:</strong> Total Orders: {stats.totalOrders} | Orders with socialLink: {stats.ordersWithSocialLink} | Unique customers detected: {syncData.length}
                </div>
            </div>

            {/* Action Items Section */}
            <div className="space-y-4 mb-6">
                {/* Phone Format Fix Section */}
                {stats.ordersNeedPhoneFormat > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Phone className="text-orange-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        Phone Format Issue Detected
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Found <strong>{stats.ordersNeedPhoneFormat} orders</strong> with phone format issues (+84 format or whitespace). 
                                        These should be fixed for consistency.
                                    </p>
                                    <button
                                        onClick={() => setShowPhoneFormatModal(true)}
                                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-orange-600/30"
                                    >
                                        <Phone size={18} />
                                        Fix Phone Formats ({stats.ordersNeedPhoneFormat})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order IDs Fix Section */}
                {stats.customersMissingOrderIdsCount > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Calendar className="text-indigo-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        Missing Order IDs Detected
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Found <strong>{stats.customersMissingOrderIdsCount} customers</strong> missing firstOrderId or lastOrderId. 
                                        These should be synced for proper order tracking.
                                    </p>
                                    <button
                                        onClick={() => setShowOrderIdsModal(true)}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/30"
                                    >
                                        <Calendar size={18} />
                                        Sync Order IDs ({stats.customersMissingOrderIdsCount})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rename Firebase Keys Section */}
                {stats.ordersWithWrongKeysCount > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Key className="text-rose-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        Wrong Firebase Keys Detected
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Found <strong>{stats.ordersWithWrongKeysCount} orders</strong> with Firebase keys (name_id format) different from their actual IDs. 
                                        <br />
                                        <span className="text-rose-600 font-medium">⚠️ Warning: This operation will rename Firebase nodes and cannot be undone!</span>
                                    </p>
                                    <button
                                        onClick={() => setShowRenameKeysModal(true)}
                                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-rose-600/30"
                                    >
                                        <Key size={18} />
                                        Rename Keys ({stats.ordersWithWrongKeysCount})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Customers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Need SocialLink</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.needsSocialLinkSync}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <AlertCircle className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Need Addresses</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.needsAddressSync}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <AlertCircle className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Conflicts</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats.conflictCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Already Synced</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.syncedCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sync Result Notification */}
            {syncResult && (
                <div className={`mb-6 p-4 rounded-xl border ${syncResult.failed > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
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
            )}

            {/* Filters and Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
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
                            <option value="missing">Missing ({stats.missingCount})</option>
                            <option value="conflict">Conflicts ({stats.conflictCount})</option>
                            <option value="synced">Synced ({stats.syncedCount})</option>
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

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
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
                                    <tr
                                        key={item.phone}
                                        className={`
                                            hover:bg-gray-50 transition-colors
                                            ${item.conflictType === 'different' ? 'bg-red-50/30' : ''}
                                            ${item.conflictType === 'missing' ? 'bg-yellow-50/30' : ''}
                                            ${item.conflictType === 'same' ? 'bg-gray-50/30' : ''}
                                        `}
                                    >
                                        <td className="px-4 py-4">
                                            <span className={`
                                                px-2 py-1 rounded-full text-xs font-medium
                                                ${item.conflictType === 'different' ? 'bg-red-100 text-red-700' : ''}
                                                ${item.conflictType === 'missing' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                ${item.conflictType === 'same' ? 'bg-green-100 text-green-700' : ''}
                                            `}>
                                                {item.conflictType === 'different' && 'Conflict'}
                                                {item.conflictType === 'missing' && 'Missing'}
                                                {item.conflictType === 'same' && 'Synced'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-500">{item.phone}</p>
                                                <p className="text-xs text-gray-400 mt-1">{item.orderCount} orders</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.socialLinkStatus === 'none' ? (
                                                <span className="text-sm text-gray-400 italic">Not applicable</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Current:</p>
                                                        {item.currentSocialLink ? (
                                                            <a
                                                                href={item.currentSocialLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:underline break-all"
                                                            >
                                                                {item.currentSocialLink}
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">None</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">From orders:</p>
                                                        <a
                                                            href={item.orderSocialLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-green-600 hover:underline break-all"
                                                        >
                                                            {item.orderSocialLink}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.addressesStatus === 'none' ? (
                                                <span className="text-sm text-gray-400 italic">Not applicable</span>
                                            ) : (
                                                <div className="space-y-2">
                                                    {item.currentAddresses.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Current ({item.currentAddresses.length}):</p>
                                                            <div className="space-y-1">
                                                                {item.currentAddresses.slice(0, 2).map((addr, idx) => (
                                                                    <p key={idx} className="text-xs text-gray-600 truncate max-w-xs">• {addr}</p>
                                                                ))}
                                                                {item.currentAddresses.length > 2 && (
                                                                    <p className="text-xs text-gray-400 italic">+{item.currentAddresses.length - 2} more</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.missingAddresses.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-purple-600 font-medium mb-1">Missing ({item.missingAddresses.length}):</p>
                                                            <div className="space-y-1">
                                                                {item.missingAddresses.slice(0, 2).map((addr, idx) => (
                                                                    <p key={idx} className="text-xs text-purple-700 truncate max-w-xs">• {addr}</p>
                                                                ))}
                                                                {item.missingAddresses.length > 2 && (
                                                                    <p className="text-xs text-purple-400 italic">+{item.missingAddresses.length - 2} more</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.addressesStatus === 'same' && item.missingAddresses.length === 0 && (
                                                        <span className="text-sm text-green-600">✓ All synced</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.conflictType === 'same' && item.addressesStatus !== 'missing' ? (
                                                <span className="text-sm text-gray-400">No action needed</span>
                                            ) : (
                                                <select
                                                    value={selectedItems[item.phone] || ''}
                                                    onChange={(e) => handleActionChange(item.phone, e.target.value)}
                                                    className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                                >
                                                    <option value="">Choose action...</option>
                                                    {item.conflictType === 'different' && (
                                                        <option value="keep">Keep existing</option>
                                                    )}
                                                    <option value="update">Update from orders</option>
                                                    <option value="skip">Skip</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination info */}
                {filteredData.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                        Showing {filteredData.length} of {syncData.length} customers with social links in orders
                    </div>
                )}

                {/* Customer Required Fields Section */}
                {stats.customersMissingRequiredFields > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <UserCheck className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        Missing Required Customer Fields
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Found <strong>{stats.customersMissingRequiredFields} customers</strong> missing required fields (name, phone, firstOrderId, lastOrderId). 
                                        These can be filled from their order history.
                                    </p>
                                    <button
                                        onClick={() => setShowCustomerFieldsModal(true)}
                                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-600/30"
                                    >
                                        <UserCheck size={18} />
                                        Fix Required Fields ({stats.customersMissingRequiredFields})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmSyncModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={executeSync}
                summary={getSyncSummary()}
                isSyncing={isSyncing}
            />

            {/* Phone Format Modal */}
            <PhoneFormatModal
                isOpen={showPhoneFormatModal}
                onClose={() => setShowPhoneFormatModal(false)}
                orders={ordersWithPhoneIssues}
            />

            {/* Order IDs Modal */}
            <OrderIdsModal
                isOpen={showOrderIdsModal}
                onClose={() => setShowOrderIdsModal(false)}
                customers={customersMissingOrderIds}
            />

            {/* Rename Order Keys Modal */}
            <RenameOrderKeysModal
                isOpen={showRenameKeysModal}
                onClose={() => setShowRenameKeysModal(false)}
                orders={ordersWithWrongKeys}
            />

            {/* Customer Fields Modal */}
            <CustomerFieldsModal
                isOpen={showCustomerFieldsModal}
                onClose={() => setShowCustomerFieldsModal(false)}
                customers={customers}
                orders={orders}
            />
        </div>
    );
};

export default DataSync;
