import React from 'react';
import { X, CakeSlice, User, MapPin, Phone } from 'lucide-react';

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
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
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary shadow-sm">
                                <User size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{order.customer.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <Phone size={12} /> {order.customer.phone}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 flex items-start gap-2 pl-1">
                            <MapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                            <span>{order.customer.address}</span>
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
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Total Amount</span>
                    <span className="text-xl font-bold text-primary">{order.price}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
