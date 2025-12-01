import React, { useState, useEffect } from 'react';
import { X, Calculator, Check, MapPin, Phone, User } from 'lucide-react';

const ConfirmPreOrderModal = ({ isOpen, onClose, onConfirm, onReject, order }) => {
    const [shipFee, setShipFee] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [subtotal, setSubtotal] = useState(0);

    useEffect(() => {
        if (order && isOpen) {
            // Calculate initial subtotal from items
            let initialSubtotal = 0;
            if (Array.isArray(order.items)) {
                initialSubtotal = order.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.amount)), 0);
            }
            setSubtotal(initialSubtotal);
            setShipFee(Number(order.shipFee) || 0);
            setDiscount(Number(order.discount) || 0);
        }
    }, [order, isOpen]);

    if (!isOpen || !order) return null;

    const discountAmount = discount <= 100 ? (subtotal * discount) / 100 : discount;
    const total = subtotal + shipFee - discountAmount;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const handleConfirm = () => {
        onConfirm(order.id, {
            shipFee,
            discount,
            total
        });
        onClose();
    };

    const handleReject = () => {
        if (window.confirm('Are you sure you want to reject this order?')) {
            onReject(order.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-300 ease-out flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Xác nhận đơn hàng</h2>
                        <p className="text-sm text-gray-500">#{order.id.slice(-6)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <User size={18} className="text-gray-400" />
                            <span className="font-medium text-gray-900">{order.customer?.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={18} className="text-gray-400" />
                            <span className="text-gray-600">{order.customer?.phone}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-gray-400 mt-0.5" />
                            <span className="text-gray-600 text-sm">{order.customer?.address}</span>
                        </div>
                    </div>

                    {/* Items List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Sản phẩm</h3>
                        <div className="space-y-2">
                            {Array.isArray(order.items) && order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-500">{formatCurrency(item.price)} x {item.amount}</div>
                                    </div>
                                    <div className="font-bold text-gray-900">
                                        {formatCurrency(item.price * item.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calculations */}
                    <div className="space-y-4 border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center text-gray-600">
                            <span>Tạm tính</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <label className="text-gray-700 font-medium">Giảm giá (%)</label>
                            <div className="relative w-32">
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 text-right bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-red-600"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                            </div>
                            <div className="text-sm text-red-500 font-medium min-w-[80px] text-right">
                                -{formatCurrency(discountAmount)}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <label className="text-gray-700 font-medium">Phí ship</label>
                            <div className="relative w-32">
                                <input
                                    type="number"
                                    value={shipFee}
                                    onChange={(e) => setShipFee(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 text-right bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₫</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200">
                            <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={handleReject}
                        className="px-4 py-3 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 font-bold transition-colors flex items-center gap-2"
                    >
                        <X size={20} />
                        Từ chối
                    </button>
                    <div className="flex-1"></div>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        Chốt đơn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPreOrderModal;
