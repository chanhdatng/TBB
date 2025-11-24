import React from 'react';
import { X, Package, Calendar, DollarSign, MapPin, Phone, Mail } from 'lucide-react';

const CustomerDetailsModal = ({ isOpen, onClose, customer, orders }) => {
    if (!isOpen || !customer) return null;

    // Filter orders for this customer
    const customerOrders = orders.filter(order => order.customer.phone === customer.phone)
        .sort((a, b) => {
            const dateA = a.timeline?.received?.raw || 0;
            const dateB = b.timeline?.received?.raw || 0;
            return dateB - dateA;
        });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{customer.name || 'Unknown Customer'}</h2>
                            <div className="flex flex-col gap-1 mt-1 text-sm text-gray-500">
                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} />
                                        {customer.phone}
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} />
                                        {customer.address}
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} />
                                        {customer.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 border-b border-gray-100 divide-x divide-gray-100 bg-gray-50/50">
                    <div className="p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{customerOrders.length}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Total Spent</p>
                        <p className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent || 0)}
                        </p>
                    </div>
                </div>

                {/* Order History */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package size={20} className="text-primary" />
                        Order History
                    </h3>
                    
                    {customerOrders.length > 0 ? (
                        <div className="space-y-4">
                            {customerOrders.map(order => (
                                <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-primary/30 transition-colors bg-white shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                                <Calendar size={14} />
                                                {order.timeline?.received?.date || 'Unknown Date'}
                                            </div>
                                            <div className="font-medium text-gray-900">
                                                {order.items?.map(item => `${item.amount || 1}x ${item.name}`).join(', ')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.rawPrice || 0)}
                                            </div>
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    {order.note && (
                                        <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded-lg mt-2">
                                            Note: {order.note}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No orders found for this customer.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;
