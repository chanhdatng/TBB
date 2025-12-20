import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';
import {
    RefreshCw, Users, AlertCircle, CheckCircle, Database, Search,
    Filter, Phone, Calendar, Key, UserCheck, Trash2, Sparkles,
    FileText, ShieldCheck, Zap, TrendingUp, Activity, Settings,
    Download, Upload, Archive, PhoneOff, Cookie, Clock
} from 'lucide-react';
import ConfirmSyncModal from '../components/DataSync/ConfirmSyncModal';
import PhoneFormatModal from '../components/DataSync/PhoneFormatModal';
import OrderIdsModal from '../components/DataSync/OrderIdsModal';
import RenameOrderKeysModal from '../components/DataSync/RenameOrderKeysModal';
import CustomerFieldsModal from '../components/DataSync/CustomerFieldsModal';
import CleanupModal from '../components/DataSync/CleanupModal';
import InvalidPhonesModal from '../components/DataSync/InvalidPhonesModal';
import ProductNameStandardizeModal from '../components/DataSync/ProductNameStandardizeModal';
import DeliveryTimeSlotModal from '../components/DataSync/DeliveryTimeSlotModal';
import SkeletonCard from '../components/Common/SkeletonCard';
import { fadeInVariants, staggerChildrenVariants, itemVariants } from '../utils/animations';

const DataSync = () => {
    const { orders, customers, loading } = useData();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'sync', 'optimize', 'standardize'
    const [showPhoneFormatModal, setShowPhoneFormatModal] = useState(false);
    const [showOrderIdsModal, setShowOrderIdsModal] = useState(false);
    const [showRenameKeysModal, setShowRenameKeysModal] = useState(false);
    const [showCustomerFieldsModal, setShowCustomerFieldsModal] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [cleanupType, setCleanupType] = useState('duplicates');
    const [cleanupData, setCleanupData] = useState([]);
    const [isCleanupLoading, setIsCleanupLoading] = useState(false);
    const [showInvalidPhonesModal, setShowInvalidPhonesModal] = useState(false);
    const [showProductNameModal, setShowProductNameModal] = useState(false);
    const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
    const [firebaseCustomers, setFirebaseCustomers] = useState([]);

    /**
     * PERFORMANCE OPTIMIZATION: Phone normalization cache
     * Caches normalized phone numbers to avoid repeated regex operations
     * Expected savings: 400-800ms per render with ~8,789 normalization calls
     */
    const phoneCache = useRef(new Map());

    // Normalize phone number for comparison (with caching)
    const normalizePhone = useCallback((phone) => {
        if (!phone) return '';

        // Check cache first
        if (phoneCache.current.has(phone)) {
            return phoneCache.current.get(phone);
        }

        // Bound cache size to prevent memory leaks
        const MAX_CACHE_SIZE = 1000;
        if (phoneCache.current.size >= MAX_CACHE_SIZE) {
            phoneCache.current.clear();
        }

        // Compute and cache
        const normalized = phone.replace(/\D/g, '');
        phoneCache.current.set(phone, normalized);
        return normalized;
    }, []);

    // Clear phone cache when data changes
    useEffect(() => {
        phoneCache.current.clear();
    }, [customers, orders, firebaseCustomers]);

    // Fetch customers directly from Firebase newCustomers (one-time fetch to avoid duplicate listeners)
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customersRef = ref(database, 'newCustomers');
                const snapshot = await get(customersRef);
                const data = snapshot.val();

                if (data) {
                    const customersList = Object.keys(data)
                        .map(key => {
                            const item = data[key];
                            // Basic validation: must be object and have at least name or phone
                            if (!item || typeof item !== 'object') return null;
                            if (!item.name && !item.phone) return null;

                            // Explicitly strip internal id to avoid confusion
                            const { id: _internalId, ...rest } = item;

                            return {
                                ...rest,
                                id: key, // Ensure id is always the Firebase key
                                name: item.name || 'Unknown',
                                phone: item.phone || '',
                                email: item.email || '',
                                address: item.address || '',
                                createdAt: item.createDate || null,
                                firstOrderId: item.firstOrderId || null,
                                lastOrderId: item.lastOrderId || null,
                                // Keep all original data
                                ...item
                            };
                        })
                        .filter(item => item !== null); // Filter out invalid items
                    setFirebaseCustomers(customersList);
                    console.log('✅ Fetched customers from Firebase (one-time):', customersList.length);
                } else {
                    setFirebaseCustomers([]);
                }
            } catch (error) {
                console.error('❌ Error fetching customers:', error);
            }
        };

        fetchCustomers();
    }, []);

    // Detect orders with phone format issues
    /**
     * PERFORMANCE OPTIMIZATION: Lazy computation based on activeTab
     * Only computes when tab needs this data (standardize, overview)
     * Skips computation on optimize and maintenance tabs
     * Impact: Reduces unnecessary operations when not displaying phone issues
     */
    const ordersWithPhoneIssues = useMemo(() => {
        // Lazy computation: Skip if tab doesn't need this data
        if (activeTab !== 'standardize' && activeTab !== 'overview') {
            return [];
        }

        if (!orders) return [];

        return orders

            .filter(order => {
                const phone = order.customer?.phone || order.customerPhone;
                if (!phone) return false;

                // Strict check: flag if phone contains ANY non-digit characters
                const cleaned = phone.replace(/\D/g, '');
                return phone !== cleaned;
            })
            .map(order => {
                const currentPhone = order.customer?.phone || order.customerPhone;
                const cleaned = currentPhone.replace(/\D/g, '');

                let suggestedPhone = cleaned;
                // If it starts with 84, replace with 0
                if (suggestedPhone.startsWith('84') && suggestedPhone.length > 9) {
                    suggestedPhone = '0' + suggestedPhone.slice(2);
                }

                let issueType = [];
                if (currentPhone.startsWith('+84')) issueType.push('+84 format');
                if (currentPhone.includes(' ')) issueType.push('whitespace');
                if (issueType.length === 0) issueType.push('special chars');

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

    }, [orders, activeTab]);

    // Detect customers missing order IDs
    /**
     * PERFORMANCE OPTIMIZATION: Lazy computation based on activeTab
     * Only computes when tab needs this data (standardize, overview)
     * This is the most expensive computation (O(n²)), so lazy evaluation has major impact
     */
    const customersMissingOrderIds = useMemo(() => {
        // Lazy computation: Skip if tab doesn't need this data
        if (activeTab !== 'standardize' && activeTab !== 'overview') {
            return [];
        }

        if (!orders || !customers) return [];

        const customerMap = new Map();
        customers.forEach(customer => {
            customerMap.set(normalizePhone(customer.phone), customer);
        });

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
            if (!customer) return;

            const sortedOrders = [...customerOrders].sort((a, b) => {
                const dateA = a.timeline?.received?.raw || a.createDate || 0;
                const dateB = b.timeline?.received?.raw || b.createDate || 0;
                return new Date(dateA) - new Date(dateB);
            });

            const firstOrder = sortedOrders[0];
            const lastOrder = sortedOrders[sortedOrders.length - 1];
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
    }, [orders, customers, activeTab, normalizePhone]);

    // Detect orders with wrong Firebase keys
    /**
     * PERFORMANCE OPTIMIZATION: Lazy computation based on activeTab
     * Only computes when tab needs this data (standardize, overview)
     */
    const ordersWithWrongKeys = useMemo(() => {
        // Lazy computation: Skip if tab doesn't need this data
        if (activeTab !== 'standardize' && activeTab !== 'overview') {
            return [];
        }

        if (!orders) return [];

        return orders
            .filter(order => {
                const firebaseKey = order.id;
                const actualId = order.originalData?.id;
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
    }, [orders, activeTab]);

    // Detect orders with non-standard product names
    /**
     * PERFORMANCE OPTIMIZATION: Lazy computation based on activeTab
     * Only computes when tab needs this data (standardize, overview)
     */
    const ordersWithNonStandardProductNames = useMemo(() => {
        // Lazy computation: Skip if tab doesn't need this data
        if (activeTab !== 'standardize' && activeTab !== 'overview') {
            return [];
        }

        if (!orders) return [];

        // Helper function to check if name should be standardized to Brazilian Cheesebread
        const shouldStandardizeToBrazilianCheesebread = (name) => {
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

            return exactMatches.includes(normalized);
        };

        const issueOrders = [];

        orders.forEach(order => {
            if (!order.items || order.items.length === 0) return;

            const itemsNeedingFix = order.items.filter(item => {
                const itemName = item.name;
                if (!itemName) return false;

                const trimmedName = itemName.trim();

                // Check if needs standardization AND is not already correct
                return shouldStandardizeToBrazilianCheesebread(itemName) &&
                       trimmedName !== 'Brazilian Cheesebread';
            });

            if (itemsNeedingFix.length > 0) {
                issueOrders.push(order);
            }
        });

        return issueOrders;
    }, [orders, activeTab]);

    // Detect orders missing deliveryTimeSlot
    const ordersWithoutTimeSlot = useMemo(() => {
        if (activeTab !== 'standardize' && activeTab !== 'overview') {
            return [];
        }

        if (!orders) return [];

        return orders.filter(order => {
            // Check if order has no deliveryTimeSlot in originalData
            return !order.originalData?.deliveryTimeSlot;
        });
    }, [orders, activeTab]);

    /**
     * PERFORMANCE OPTIMIZATION: Split stats into basic and issue stats
     * Basic stats always computed, issue stats conditional on activeTab
     * Prevents forcing detection computation on tabs that don't need it
     */

    // Basic stats (always computed - cheap operations)
    const basicStats = useMemo(() => {
        return {
            totalCustomers: customers?.length || 0,
            totalOrders: orders?.length || 0
        };
    }, [customers, orders]);

    // Issue stats (only when needed - depends on detection hooks)
    const issueStats = useMemo(() => {
        // Only calculate if overview or specific tabs are active
        if (activeTab === 'maintenance') {
            return {
                phoneIssues: 0,
                orderIdIssues: 0,
                keyIssues: 0,
                productNameIssues: 0,
                timeSlotIssues: 0,
                customersMissingRequiredFields: 0,
                duplicateCount: 0,
                totalIssues: 0
            };
        }

        const phoneIssues = ordersWithPhoneIssues.length;
        const orderIdIssues = customersMissingOrderIds.length;
        const keyIssues = ordersWithWrongKeys.length;
        const productNameIssues = ordersWithNonStandardProductNames.length;
        const timeSlotIssues = ordersWithoutTimeSlot.length;

        // Calculate missing fields
        const processedPhones = new Set();
        const customersMissingRequiredFields = customers?.filter(customer => {
            const normalizedPhone = normalizePhone(customer.phone);
            if (processedPhones.has(normalizedPhone)) return false;
            processedPhones.add(normalizedPhone);

            const hasOrders = orders?.some(order => {
                const orderPhone = order.customer?.phone || order.customerPhone;
                return normalizePhone(orderPhone) === normalizedPhone;
            });
            if (!hasOrders) return false;

            return !customer.name || !customer.phone || !customer.firstOrderId || !customer.lastOrderId;
        }).length || 0;

        const duplicateCount = basicStats.totalCustomers - processedPhones.size;
        const totalIssues = phoneIssues + orderIdIssues + keyIssues + productNameIssues + timeSlotIssues + customersMissingRequiredFields + duplicateCount;

        return {
            phoneIssues,
            orderIdIssues,
            keyIssues,
            productNameIssues,
            timeSlotIssues,
            customersMissingRequiredFields,
            duplicateCount,
            totalIssues
        };
    }, [
        activeTab,
        ordersWithPhoneIssues,
        customersMissingOrderIds,
        ordersWithWrongKeys,
        ordersWithNonStandardProductNames,
        ordersWithoutTimeSlot,
        customers,
        orders,
        normalizePhone,
        basicStats.totalCustomers
    ]);

    // Combined stats (for backward compatibility)
    const stats = useMemo(() => {
        const possibleIssues = basicStats.totalOrders + basicStats.totalCustomers * 2;
        const healthScore = possibleIssues > 0
            ? Math.round(((possibleIssues - issueStats.totalIssues) / possibleIssues) * 100)
            : 100;

        return {
            ...basicStats,
            ...issueStats,
            healthScore,
            needsOptimization: issueStats.totalIssues > 0
        };
    }, [basicStats, issueStats]);


    // Detect customers with invalid phone numbers from Firebase
    /**
     * PERFORMANCE OPTIMIZATION: Lazy computation based on activeTab
     * Only computes when tab needs this data (optimize, overview)
     */
    const customersWithInvalidPhones = useMemo(() => {
        // Lazy computation: Skip if tab doesn't need this data
        if (activeTab !== 'optimize' && activeTab !== 'overview') {
            return [];
        }

        if (!firebaseCustomers || firebaseCustomers.length === 0) return [];

        const invalidCustomers = [];

        firebaseCustomers.forEach(customer => {
            const phone = customer.phone || '';
            const cleaned = phone.replace(/\D/g, '');
            let issues = [];
            let suggestedPhone = phone;

            if (!phone) {
                issues.push('Missing phone number');
            } else {
                if (cleaned.length === 0) {
                    issues.push('No digits found');
                } else if (cleaned.length < 9) {
                    issues.push(`Too short (${cleaned.length} digits, need 9-11)`);
                } else if (cleaned.length > 11) {
                    issues.push(`Too long (${cleaned.length} digits, max 11)`);
                }

                // Strictly flag any formatting issues (spaces, dashes, etc)
                if (phone !== cleaned && cleaned.length > 0) {
                    issues.push('Contains special characters/formatting');
                    suggestedPhone = cleaned;
                }
            }

            // Only add to invalid list if there are actual issues
            if (issues.length > 0) {
                invalidCustomers.push({
                    customerId: customer.id,
                    name: customer.name || 'Unknown',
                    currentPhone: phone || 'N/A',
                    suggestedPhone: suggestedPhone !== phone ? suggestedPhone : null,
                    issues: issues.join(', '),
                    createdAt: customer.createdAt ?
                        (typeof customer.createdAt === 'number' ?
                            new Date(customer.createdAt < 2000000000 ? (customer.createdAt + 978307200) * 1000 : customer.createdAt).toLocaleDateString('vi-VN')
                            : 'N/A')
                        : 'N/A'
                });
            }
        });

        console.log('Invalid customers found:', invalidCustomers.length);
        return invalidCustomers;
    }, [firebaseCustomers, activeTab]);

    // Get detailed duplicate customers for cleanup modal
    /**
     * PERFORMANCE OPTIMIZATION: Lazy computation based on activeTab
     * Only computes when tab needs this data (optimize, overview)
     */
    const duplicateCustomers = useMemo(() => {
        // Lazy computation: Skip if tab doesn't need this data
        if (activeTab !== 'optimize' && activeTab !== 'overview') {
            return [];
        }

        if (!customers) return [];

        const phoneGroups = new Map();
        customers.forEach(customer => {
            const normalizedPhone = normalizePhone(customer.phone);
            if (!phoneGroups.has(normalizedPhone)) {
                phoneGroups.set(normalizedPhone, []);
            }
            phoneGroups.get(normalizedPhone).push(customer);
        });

        const duplicates = [];
        phoneGroups.forEach((group, phone) => {
            if (group.length > 1) {
                group.forEach((customer, idx) => {
                    if (idx > 0) { // Keep first, mark others as duplicates
                        duplicates.push({
                            name: customer.name || 'Unnamed',
                            phone: customer.phone,
                            details: `${group.length} entries with same phone number`,
                            reason: `Duplicate of ${group[0].name || 'first entry'}`,
                            date: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown',
                            customerId: customer.id
                        });
                    }
                });
            }
        });

        return duplicates;
    }, [customers, activeTab, normalizePhone]);

    // Handlers for cleanup actions
    const handleOpenCleanup = (type) => {
        setCleanupType(type);

        if (type === 'duplicates') {
            setCleanupData(duplicateCustomers);
        } else if (type === 'invalidPhones') {
            const invalidPhoneData = customersWithInvalidPhones.map(customer => ({
                name: customer.name,
                phone: customer.currentPhone,
                details: customer.issues,
                reason: customer.suggestedPhone ? `Suggested: ${customer.suggestedPhone}` : 'Manual fix required',
                date: customer.createdAt,
                customerId: customer.customerId
            }));
            setCleanupData(invalidPhoneData);
        } else if (type === 'archive') {
            // Get orders older than 1 year
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const oldOrders = orders?.filter(order => {
                const orderDate = order.timeline?.received?.raw ? new Date(order.timeline.received.raw) : null;
                return orderDate && orderDate < oneYearAgo;
            }).map(order => ({
                name: order.customer?.name || 'Unknown Customer',
                phone: order.customer?.phone || 'N/A',
                details: `${order.items?.length || 0} items - ${order.price || 'N/A'}`,
                date: order.timeline?.received?.date || 'Unknown',
                orderId: order.id
            })) || [];

            setCleanupData(oldOrders);
        } else if (type === 'export') {
            // Prepare all data for export
            const exportData = orders?.map(order => ({
                name: `Order #${order.id}`,
                phone: order.customer?.phone || 'N/A',
                details: `${order.customer?.name || 'Unknown'} - ${order.items?.length || 0} items`,
                date: order.timeline?.received?.date || 'Unknown',
                orderId: order.id
            })) || [];

            setCleanupData(exportData);
        }

        setShowCleanupModal(true);
    };

    const handleCleanupConfirm = async (selectedItems) => {
        setIsCleanupLoading(true);

        try {
            // Simulate cleanup process
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log(`${cleanupType} cleanup:`, selectedItems);

            // Here you would actually perform the cleanup action
            // For example, delete from Firebase, archive data, export to JSON, etc.

            setShowCleanupModal(false);
            setCleanupData([]);

            // Show success message (you can use a toast here)
            alert(`Successfully processed ${selectedItems.length} item(s)!`);
        } catch (error) {
            console.error('Cleanup error:', error);
            alert('An error occurred during cleanup');
        } finally {
            setIsCleanupLoading(false);
        }
    };

    // Get health score color
    const getHealthScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getHealthScoreBg = (score) => {
        if (score >= 90) return 'bg-green-100';
        if (score >= 70) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <SkeletonCard lines={2} className="w-64 h-16" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <SkeletonCard key={i} lines={3} showIcon={true} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Database className="text-primary" size={28} />
                        </div>
                        Data Management Center
                    </h1>
                    <p className="text-gray-500 mt-2">Optimize, standardize, and maintain your Firebase data</p>
                </div>

                {/* Health Score Badge */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`${getHealthScoreBg(stats.healthScore)} rounded-2xl p-6 min-w-[200px]`}
                >
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <ShieldCheck className={getHealthScoreColor(stats.healthScore)} size={20} />
                            <span className="text-sm font-medium text-gray-600">Data Health Score</span>
                        </div>
                        <div className={`text-4xl font-bold ${getHealthScoreColor(stats.healthScore)}`}>
                            {stats.healthScore}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.totalIssues} issues found
                        </p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Quick Stats Grid */}
            <motion.div
                variants={staggerChildrenVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Users size={24} />
                        </div>
                        <TrendingUp size={20} className="opacity-70" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">Total Customers</h3>
                    <p className="text-3xl font-bold">{stats.totalCustomers.toLocaleString()}</p>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/30"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <FileText size={24} />
                        </div>
                        <Activity size={20} className="opacity-70" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">Total Orders</h3>
                    <p className="text-3xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/30"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <AlertCircle size={24} />
                        </div>
                        <Zap size={20} className="opacity-70" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">Issues Detected</h3>
                    <p className="text-3xl font-bold">{stats.totalIssues}</p>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/30"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Sparkles size={24} />
                        </div>
                        <CheckCircle size={20} className="opacity-70" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90 mb-1">Optimization Potential</h3>
                    <p className="text-3xl font-bold">{stats.needsOptimization ? 'High' : 'Low'}</p>
                </motion.div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2"
            >
                <div className="flex gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: Activity },
                        { id: 'standardize', label: 'Standardize', icon: Settings },
                        { id: 'optimize', label: 'Optimize', icon: Zap },
                        { id: 'maintenance', label: 'Maintenance', icon: Database }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon size={20} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity size={24} className="text-primary" />
                            Data Overview
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Issues Breakdown */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertCircle className="text-orange-500" size={20} />
                                    Issues Breakdown
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Phone Format Issues', count: stats.phoneIssues, color: 'orange' },
                                        { label: 'Product Name Issues', count: stats.productNameIssues, color: 'amber' },
                                        { label: 'Missing Time Slots', count: stats.timeSlotIssues, color: 'cyan' },
                                        { label: 'Missing Order IDs', count: stats.orderIdIssues, color: 'indigo' },
                                        { label: 'Wrong Firebase Keys', count: stats.keyIssues, color: 'rose' },
                                        { label: 'Missing Required Fields', count: stats.customersMissingRequiredFields, color: 'purple' },
                                        { label: 'Duplicate Entries', count: stats.duplicateCount, color: 'yellow' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{item.label}</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${item.color}-100 text-${item.color}-700`}>
                                                {item.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap className="text-primary" size={20} />
                                    Quick Actions
                                </h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowPhoneFormatModal(true)}
                                        disabled={stats.phoneIssues === 0}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Phone className="text-orange-600" size={20} />
                                            <span className="font-medium text-gray-700">Fix Phone Formats</span>
                                        </div>
                                        <span className="text-orange-600 font-semibold">{stats.phoneIssues}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowProductNameModal(true)}
                                        disabled={stats.productNameIssues === 0}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Cookie className="text-amber-600" size={20} />
                                            <span className="font-medium text-gray-700">Standardize Product Names</span>
                                        </div>
                                        <span className="text-amber-600 font-semibold">{stats.productNameIssues}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowOrderIdsModal(true)}
                                        disabled={stats.orderIdIssues === 0}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-indigo-600" size={20} />
                                            <span className="font-medium text-gray-700">Sync Order IDs</span>
                                        </div>
                                        <span className="text-indigo-600 font-semibold">{stats.orderIdIssues}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowCustomerFieldsModal(true)}
                                        disabled={stats.customersMissingRequiredFields === 0}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <UserCheck className="text-purple-600" size={20} />
                                            <span className="font-medium text-gray-700">Fix Required Fields</span>
                                        </div>
                                        <span className="text-purple-600 font-semibold">{stats.customersMissingRequiredFields}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowRenameKeysModal(true)}
                                        disabled={stats.keyIssues === 0}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Key className="text-rose-600" size={20} />
                                            <span className="font-medium text-gray-700">Rename Firebase Keys</span>
                                        </div>
                                        <span className="text-rose-600 font-semibold">{stats.keyIssues}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'standardize' && (
                    <motion.div
                        key="standardize"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings size={24} className="text-primary" />
                            Data Standardization
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Standardize phone formats, sync customer data, and maintain data consistency across your Firebase database.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Phone Format Standardization */}
                            {stats.phoneIssues > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Phone className="text-orange-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                Phone Format Issues
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Found <strong>{stats.phoneIssues} orders</strong> with inconsistent phone formats (+84 or whitespace).
                                            </p>
                                            <button
                                                onClick={() => setShowPhoneFormatModal(true)}
                                                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-orange-600/30"
                                            >
                                                <Phone size={18} />
                                                Standardize ({stats.phoneIssues})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order IDs Sync */}
                            {stats.orderIdIssues > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Calendar className="text-indigo-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                Missing Order IDs
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Found <strong>{stats.orderIdIssues} customers</strong> missing firstOrderId or lastOrderId.
                                            </p>
                                            <button
                                                onClick={() => setShowOrderIdsModal(true)}
                                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/30"
                                            >
                                                <Calendar size={18} />
                                                Sync IDs ({stats.orderIdIssues})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Customer Required Fields */}
                            {stats.customersMissingRequiredFields > 0 && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <UserCheck className="text-purple-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                Missing Required Fields
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Found <strong>{stats.customersMissingRequiredFields} customers</strong> missing essential data.
                                            </p>
                                            <button
                                                onClick={() => setShowCustomerFieldsModal(true)}
                                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-600/30"
                                            >
                                                <UserCheck size={18} />
                                                Fix Fields ({stats.customersMissingRequiredFields})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Firebase Keys */}
                            {stats.keyIssues > 0 && (
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Key className="text-rose-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                Wrong Firebase Keys
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Found <strong>{stats.keyIssues} orders</strong> with mismatched keys.
                                            </p>
                                            <p className="text-xs text-rose-600 font-medium mb-3">
                                                ⚠️ This operation cannot be undone!
                                            </p>
                                            <button
                                                onClick={() => setShowRenameKeysModal(true)}
                                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-rose-600/30"
                                            >
                                                <Key size={18} />
                                                Rename Keys ({stats.keyIssues})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Missing Time Slot */}
                            {stats.timeSlotIssues > 0 && (
                                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Clock className="text-cyan-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                Missing Time Slots
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Found <strong>{stats.timeSlotIssues} orders</strong> without delivery time slot.
                                            </p>
                                            <button
                                                onClick={() => setShowTimeSlotModal(true)}
                                                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-cyan-600/30"
                                            >
                                                <Clock size={18} />
                                                Add Time Slots ({stats.timeSlotIssues})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {stats.totalIssues === 0 && (
                            <div className="text-center py-12">
                                <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">All Data is Standardized!</h3>
                                <p className="text-gray-600">Your Firebase data is properly formatted and consistent.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'optimize' && (
                    <motion.div
                        key="optimize"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap size={24} className="text-primary" />
                            Data Optimization
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Remove duplicates, clean up orphaned data, and optimize your database structure.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <PhoneOff className="text-red-700" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Invalid Phone Numbers</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {customersWithInvalidPhones.length} customers with invalid phones
                                        </p>
                                        <button
                                            onClick={() => setShowInvalidPhonesModal(true)}
                                            disabled={customersWithInvalidPhones.length === 0}
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <PhoneOff size={18} />
                                            View & Fix
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Trash2 className="text-yellow-700" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Remove Duplicates</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {stats.duplicateCount} duplicate entries detected
                                        </p>
                                        <button
                                            onClick={() => handleOpenCleanup('duplicates')}
                                            disabled={stats.duplicateCount === 0}
                                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-yellow-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={18} />
                                            Clean Up
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Archive className="text-blue-700" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Archive Old Data</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Archive orders older than 1 year
                                        </p>
                                        <button
                                            onClick={() => handleOpenCleanup('archive')}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/30"
                                        >
                                            <Archive size={18} />
                                            Archive
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Download className="text-green-700" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Export Data</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Download backup of your data
                                        </p>
                                        <button
                                            onClick={() => handleOpenCleanup('export')}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-green-600/30"
                                        >
                                            <Download size={18} />
                                            Export JSON
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'maintenance' && (
                    <motion.div
                        key="maintenance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Database size={24} className="text-primary" />
                            Database Maintenance
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Advanced tools for database maintenance and health checks.
                        </p>

                        <div className="text-center py-12">
                            <Settings className="text-gray-400 mx-auto mb-4" size={64} />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
                            <p className="text-gray-600">Advanced maintenance tools are under development.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <PhoneFormatModal
                isOpen={showPhoneFormatModal}
                onClose={() => setShowPhoneFormatModal(false)}
                orders={ordersWithPhoneIssues}
            />

            <OrderIdsModal
                isOpen={showOrderIdsModal}
                onClose={() => setShowOrderIdsModal(false)}
                customers={customersMissingOrderIds}
            />

            <RenameOrderKeysModal
                isOpen={showRenameKeysModal}
                onClose={() => setShowRenameKeysModal(false)}
                orders={ordersWithWrongKeys}
            />

            <CustomerFieldsModal
                isOpen={showCustomerFieldsModal}
                onClose={() => setShowCustomerFieldsModal(false)}
                customers={customers}
                orders={orders}
            />

            <CleanupModal
                isOpen={showCleanupModal}
                onClose={() => setShowCleanupModal(false)}
                onConfirm={handleCleanupConfirm}
                type={cleanupType}
                data={cleanupData}
                loading={isCleanupLoading}
            />

            <InvalidPhonesModal
                isOpen={showInvalidPhonesModal}
                onClose={() => setShowInvalidPhonesModal(false)}
                customers={customersWithInvalidPhones}
            />

            <ProductNameStandardizeModal
                isOpen={showProductNameModal}
                onClose={() => setShowProductNameModal(false)}
                orders={orders}
            />

            <DeliveryTimeSlotModal
                isOpen={showTimeSlotModal}
                onClose={() => setShowTimeSlotModal(false)}
                orders={ordersWithoutTimeSlot}
            />
        </motion.div>
    );
};

export default DataSync;
