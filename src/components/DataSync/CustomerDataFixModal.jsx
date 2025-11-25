import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, CheckCircle, Loader, User, Phone, MapPin, Calendar, Package } from 'lucide-react';
import { database } from '../../firebase';
import { ref, update } from 'firebase/database';

const CustomerDataFixModal = ({ isOpen, onClose, customers, orders }) => {
    const [isFixing, setIsFixing] = useState(false);
    const [progress, setProgress] = useState({ processed: 0, total: 0, fixed: 0 });
    const [result, setResult] = useState(null);

    // Normalize phone number
    const normalizePhone = (phone) => phone?.replace(/\D/g, '') || '';

    // Find customers with missing data
    const customersNeedingFix = useMemo(() => {
        if (!customers || !orders) return [];

        const result = [];
        const processedPhones = new Set(); // Track processed customers to avoid duplicates

        customers.forEach(customer => {
            // Skip if already processed this phone number
            const normalizedPhone = normalizePhone(customer.phone);
            if (processedPhones.has(normalizedPhone)) return;
            processedPhones.add(normalizedPhone);

            const issues = [];
            const fixes = {};

            // Find all orders for this customer
            const customerOrders = orders.filter(order => {
                const orderPhone = order.customer?.phone || order.customerPhone;
                return normalizePhone(orderPhone) === normalizedPhone;
            });

            if (customerOrders.length === 0) return; // Skip if no orders

            // Sort orders by date
            const sortedOrders = [...customerOrders].sort((a, b) => {
                const dateA = a.timeline?.received?.raw || a.createDate || 0;
                const dateB = b.timeline?.received?.raw || b.createDate || 0;
                return new Date(dateA) - new Date(dateB);
            });

            const firstOrder = sortedOrders[0];
            const lastOrder = sortedOrders[sortedOrders.length - 1];

            // Check missing fields
            if (!customer.name || customer.name.trim() === '') {
                issues.push('Missing name');
                fixes.name = firstOrder.customer?.name || lastOrder.customer?.name || 'Unknown';
            }

            if (!customer.phone || customer.phone.trim() === '') {
                issues.push('Missing phone');
                fixes.phone = firstOrder.customer?.phone || firstOrder.customerPhone || '';
            }

            if (!customer.address || customer.address.trim() === '') {
                issues.push('Missing address');
                // Try to get address from addresses array first, then from orders
                const addressFromArray = customer.addresses && customer.addresses.length > 0 
                    ? customer.addresses[0] 
                    : null;
                fixes.address = addressFromArray || firstOrder.customer?.address || firstOrder.address || '';
            }

            if (!customer.firstOrderId) {
                issues.push('Missing firstOrderId');
                fixes.firstOrderId = firstOrder.originalData?.id || firstOrder.id;
            }

            if (!customer.lastOrderId) {
                issues.push('Missing lastOrderId');
                fixes.lastOrderId = lastOrder.originalData?.id || lastOrder.id;
            }

            if (!customer.lastOrderDate) {
                issues.push('Missing lastOrderDate');
                const lastDate = lastOrder.timeline?.received?.raw || lastOrder.createDate;
                if (lastDate) {
                    fixes.lastOrderDate = typeof lastDate === 'number' ? lastDate : new Date(lastDate).getTime() / 1000;
                }
            }

            if (issues.length > 0) {
                result.push({
                    customer,
                    issues,
                    fixes,
                    orderCount: customerOrders.length,
                    firstOrderDate: firstOrder.timeline?.received?.date || 'N/A',
                    lastOrderDate: lastOrder.timeline?.received?.date || 'N/A'
                });
            }
        });

        return result;
    }, [customers, orders]);

    const handleFix = async () => {
        if (customersNeedingFix.length === 0) return;

        setIsFixing(true);
        setProgress({ processed: 0, total: customersNeedingFix.length, fixed: 0 });

        const batchSize = 10;
        const delayBetweenBatches = 100;
        let fixed = 0;
        let failed = 0;

        for (let i = 0; i < customersNeedingFix.length; i += batchSize) {
            const batch = customersNeedingFix.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (item) => {
                try {
                    const customerRef = ref(database, `newCustomers/${item.customer.phone}`);
                    await update(customerRef, item.fixes);
                    fixed++;
                } catch (error) {
                    console.error(`Error fixing customer ${item.customer.phone}:`, error);
                    failed++;
                }
            }));

            setProgress({
                processed: Math.min(i + batchSize, customersNeedingFix.length),
                total: customersNeedingFix.length,
                fixed
            });

            if (i + batchSize < customersNeedingFix.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        setResult({
            fixed,
            failed,
            total: customersNeedingFix.length
        });
        setIsFixing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" size={24} />
                            Fix Customer Data
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Found {customersNeedingFix.length} customers with missing information
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {result ? (
                        <div className="text-center py-8">
                            <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Fix Complete!</h3>
                            <div className="text-gray-600 space-y-1">
                                <p>✅ Fixed: {result.fixed} customers</p>
                                {result.failed > 0 && <p className="text-red-600">❌ Failed: {result.failed} customers</p>}
                                <p>📊 Total: {result.total} customers</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                    <div className="text-orange-600 text-sm font-medium mb-1">Missing Name</div>
                                    <div className="text-2xl font-bold text-orange-700">
                                        {customersNeedingFix.filter(c => c.issues.includes('Missing name')).length}
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="text-blue-600 text-sm font-medium mb-1">Missing Order IDs</div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {customersNeedingFix.filter(c => 
                                            c.issues.includes('Missing firstOrderId') || 
                                            c.issues.includes('Missing lastOrderId')
                                        ).length}
                                    </div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                    <div className="text-purple-600 text-sm font-medium mb-1">Missing Address</div>
                                    <div className="text-2xl font-bold text-purple-700">
                                        {customersNeedingFix.filter(c => c.issues.includes('Missing address')).length}
                                    </div>
                                </div>
                            </div>

                            {/* Customer List */}
                            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                                {customersNeedingFix.slice(0, 50).map((item, index) => (
                                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <User size={20} className="text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">
                                                        {item.customer.name || 'Unknown'}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Phone size={14} />
                                                            {item.customer.phone}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Package size={14} />
                                                            {item.orderCount} orders
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {item.issues.map((issue, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                                                    >
                                                        {issue}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fixes Preview */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {Object.entries(item.fixes).map(([key, value]) => (
                                                <div key={key} className="bg-white p-2 rounded-lg border border-gray-200">
                                                    <div className="text-xs text-gray-500 mb-1 font-medium">
                                                        {key === 'firstOrderId' ? 'First Order' :
                                                         key === 'lastOrderId' ? 'Last Order' :
                                                         key === 'lastOrderDate' ? 'Last Date' :
                                                         key.charAt(0).toUpperCase() + key.slice(1)}
                                                    </div>
                                                    <div className="text-gray-900 truncate" title={String(value)}>
                                                        {key === 'lastOrderDate'
                                                            ? new Date(value * 1000).toLocaleDateString('vi-VN')
                                                            : String(value)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {customersNeedingFix.length > 50 && (
                                    <div className="text-center text-sm text-gray-500 py-4">
                                        ... and {customersNeedingFix.length - 50} more
                                    </div>
                                )}
                            </div>

                            {/* Progress */}
                            {isFixing && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-900">
                                            Fixing customer data...
                                        </span>
                                        <span className="text-sm font-bold text-blue-900">
                                            {progress.processed} / {progress.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-blue-700">
                                        Fixed: {progress.fixed} customers
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!result && (
                    <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            disabled={isFixing}
                            className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleFix}
                            disabled={isFixing || customersNeedingFix.length === 0}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isFixing ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    Fixing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Fix All ({customersNeedingFix.length})
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDataFixModal;
