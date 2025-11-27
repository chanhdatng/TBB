import React, { useState } from 'react';
import { X, CakeSlice, User, MapPin, Phone, Edit2, Trash2, Facebook, Instagram, Globe, UserPlus, Check, FileText } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';
import { useData } from '../../contexts/DataContext';
import { ref, set } from "firebase/database";
import { database } from '../../firebase';
import InvoiceModal from './InvoiceModal';

const OrderDetailsModal = ({ isOpen, onClose, order, onEdit, onDelete }) => {
    const { customers } = useData();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);

    if (!isOpen || !order) return null;

    // Helper to normalize phone (remove non-digits)
    const normalizePhone = (p) => p ? p.replace(/\D/g, '') : '';

    // Check if customer exists in newCustomers (by normalized phone)
    const customerExists = customers.some(c => normalizePhone(c.phone) === normalizePhone(order.customer.phone));

    const handleSyncCustomer = async () => {
        if (customerExists || isSyncing) return;

        setIsSyncing(true);
        try {
            // Logic aligned with Orders.jsx:
            // 1. Use phone number as the key
            // 2. Use existing ID if available
            // 3. Preserve createDate from original order if possible

            const customerKey = order.customer.phone; // Use phone as key like in Orders.jsx

            if (!customerKey) {
                throw new Error("Customer phone is missing");
            }

            const customerData = {
                id: order.customer.id || order.originalData?.customer?.id || `customer_${Date.now()}`,
                name: order.customer.name,
                phone: order.customer.phone,
                address: order.customer.address,
                // Include socialLink as it's useful, even if Orders.jsx might miss it sometimes
                socialLink: order.customer.socialLink || '',
                // Use original order createDate or current time
                createDate: order.originalData?.createDate || Math.floor(Date.now() / 1000)
            };

            await set(ref(database, 'newCustomers/' + customerKey), customerData);

            setSyncSuccess(true);
            setTimeout(() => setSyncSuccess(false), 3000);
        } catch (error) {
            console.error("Error syncing customer:", error);
            alert("Lỗi khi đồng bộ khách hàng: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            Order Details
                            <span className="text-xs font-normal text-gray-400">#{order.id}</span>
                        </h3>
                        <p className="text-sm text-gray-500">
                            {order.timeline.received.date} • {order.timeline.received.time}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Customer Info Summary */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                        {/* Sync Button */}
                        {!customerExists && (
                            <div className="absolute top-3 right-3">
                                <button
                                    onClick={handleSyncCustomer}
                                    disabled={isSyncing || syncSuccess}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all shadow-sm ${syncSuccess
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-white text-primary border border-primary/20 hover:bg-primary/5'
                                        }`}
                                    title="Add this customer to your database"
                                >
                                    {syncSuccess ? (
                                        <>
                                            <Check size={12} /> Synced
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={12} />
                                            {isSyncing ? 'Syncing...' : 'Sync'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            {order.customer.socialLink ? (
                                <a
                                    href={order.customer.socialLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary shadow-sm hover:bg-gray-50 transition-colors cursor-pointer flex-shrink-0"
                                    title="Open Social Link"
                                >
                                    <User size={16} />
                                </a>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                                    <User size={16} />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div
                                        className="font-bold text-gray-900 cursor-pointer hover:text-primary active:scale-95 transition-transform origin-left text-sm"
                                        onClick={() => copyToClipboard(order.customer.name)}
                                        title="Click to copy name"
                                    >
                                        {order.customer.name}
                                    </div>
                                    {order.customer.socialLink && (
                                        <a
                                            href={order.customer.socialLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-primary transition-colors"
                                            title="Open Social Link"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {order.customer.socialLink.includes('facebook') || order.customer.socialLink.includes('fb.com') ? (
                                                <Facebook size={14} />
                                            ) : order.customer.socialLink.includes('instagram') ? (
                                                <Instagram size={14} />
                                            ) : (
                                                <Globe size={14} />
                                            )}
                                        </a>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div
                                        className="text-xs text-gray-500 flex items-center gap-1.5 cursor-pointer hover:text-primary active:scale-95 transition-transform origin-left"
                                        onClick={() => copyToClipboard(order.customer.phone)}
                                        title="Click to copy phone"
                                    >
                                        <Phone size={10} /> {order.customer.phone}
                                    </div>
                                    <div
                                        className="text-xs text-gray-600 flex items-start gap-1.5 cursor-pointer hover:text-primary active:scale-95 transition-transform origin-left"
                                        onClick={() => copyToClipboard(order.customer.address)}
                                        title="Click to copy address"
                                    >
                                        <MapPin size={10} className="mt-0.5 text-gray-400 flex-shrink-0" />
                                        <span className="line-clamp-2">{order.customer.address}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Items ({order.items.length})</h4>
                    <div className="space-y-3">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                    <CakeSlice size={20} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate" title={item.name}>
                                        {item.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 font-bold text-gray-700">
                                    x{item.amount}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Details */}
                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping Fee</span>
                            <span className="font-medium text-gray-900">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.originalData?.shipFee || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Discount</span>
                            <span className="font-medium text-red-500">
                                -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.originalData?.discount || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 font-medium">Total Amount</span>
                        <span className="text-xl font-bold text-primary">{order.price}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowInvoice(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-medium hover:bg-blue-100 transition-colors"
                        >
                            <FileText size={18} /> Invoice
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Edit2 size={18} /> Edit
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 font-medium hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={18} /> Delete
                        </button>
                    </div>
                </div>
            </div>

            <InvoiceModal
                isOpen={showInvoice}
                onClose={() => setShowInvoice(false)}
                order={order}
            />
        </div>
    );
};

export default OrderDetailsModal;
