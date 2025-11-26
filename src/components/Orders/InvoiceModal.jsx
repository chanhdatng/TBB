import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, order }) => {
    const printRef = useRef();

    if (!isOpen || !order) return null;

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.amount), 0);
    const shipping = order.originalData?.shipFee || 0;
    const discount = order.originalData?.discount || 0;
    const total = subtotal + shipping - discount;

    // QR Code URL Generation
    // Format: https://img.vietqr.io/image/<BANK>-<ACCOUNT>-<TEMPLATE>.jpg?amount=<AMOUNT>&addInfo=<INFO>
    // Info: <Customer Name> <Order ID> thanh toan
    const bankId = 'VCB';
    const accountNo = '1029443065';
    const template = 'compact';
    const addInfo = encodeURIComponent(`${order.customer.name} ${order.id} thanh toan`);
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${total}&addInfo=${addInfo}`;

    const handlePrint = () => {
        const printContent = printRef.current;
        const originalContents = document.body.innerHTML;

        // Create a temporary container for printing to avoid messing up the main app state
        // However, a simpler approach for a modal is often to use a print-specific CSS or a new window.
        // For this context, let's try a print-specific style injection or just window.print() if the modal is isolated enough.
        // But usually replacing body content is destructive in SPA.
        // Better approach: Open a new window or use a hidden iframe. 
        // OR, use a CSS media query `@media print` that hides everything except the invoice.

        // Let's go with the @media print approach by adding a class to the modal content
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-w-none print:max-h-none print:w-full print:h-full print:rounded-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions - Hidden in Print */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 print:hidden bg-gray-50">
                    <h3 className="font-bold text-gray-700">Invoice Preview</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Printer size={18} /> Print Invoice
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible" ref={printRef} id="invoice-content">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-primary mb-2">HÓA ĐƠN</h1>
                            <p className="text-sm text-gray-500">Mã đơn: #{order.id}</p>
                            <p className="text-sm text-gray-500">Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-gray-800">Tiệm Bánh Bơ Bơ</h2>
                            <p className="text-sm text-gray-600">123 Đường ABC, Quận XYZ</p>
                            <p className="text-sm text-gray-600">TP. Hồ Chí Minh</p>
                            <p className="text-sm text-gray-600">Tel: 0909 123 456</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-8 bg-gray-50 p-6 rounded-xl print:bg-transparent print:p-0 print:border print:border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Thông Tin Khách Hàng</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Khách hàng:</p>
                                <p className="font-semibold text-gray-900">{order.customer.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Số điện thoại:</p>
                                <p className="font-semibold text-gray-900">{order.customer.phone}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-500 mb-1">Địa chỉ:</p>
                                <p className="font-semibold text-gray-900">{order.customer.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-y border-gray-200 print:bg-gray-100">
                                    <th className="py-3 px-4 text-left font-semibold text-gray-700">STT</th>
                                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Tên món</th>
                                    <th className="py-3 px-4 text-center font-semibold text-gray-700">SL</th>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-700">Đơn giá</th>
                                    <th className="py-3 px-4 text-right font-semibold text-gray-700">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                                        <td className="py-3 px-4 text-gray-900 font-medium">{item.name}</td>
                                        <td className="py-3 px-4 text-center text-gray-900">{item.amount}</td>
                                        <td className="py-3 px-4 text-right text-gray-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-900 font-medium">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Section: QR & Totals */}
                    <div className="flex flex-col md:flex-row gap-8 print:flex-row">
                        {/* QR Code */}
                        <div className="w-full md:w-1/2 print:w-1/2 flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl print:border-gray-300">
                            <img
                                src={qrUrl}
                                alt="Payment QR Code"
                                className="w-48 h-48 object-contain mb-2"
                            />
                            <p className="text-xs text-gray-500 text-center">Quét mã để thanh toán</p>
                            <p className="text-xs font-mono text-gray-400 mt-1">{bankId} - {accountNo}</p>
                        </div>

                        {/* Totals */}
                        <div className="w-full md:w-1/2 print:w-1/2 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tạm tính:</span>
                                <span className="font-medium text-gray-900">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phí vận chuyển:</span>
                                <span className="font-medium text-gray-900">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipping)}
                                </span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Giảm giá:</span>
                                    <span className="font-medium text-red-500">
                                        -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount)}
                                    </span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-gray-200 mt-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-base font-bold text-gray-900">Tổng cộng:</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 text-center pt-8 border-t border-gray-100 print:mt-12">
                                <p className="text-sm font-medium text-gray-900">Cảm ơn quý khách!</p>
                                <p className="text-xs text-gray-500 mt-1">Hẹn gặp lại</p>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    {`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #invoice-content, #invoice-content * {
                                visibility: visible;
                            }
                            #invoice-content {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                margin: 0;
                                padding: 20px;
                            }
                            /* Hide scrollbars in print */
                            ::-webkit-scrollbar {
                                display: none;
                            }
                        }
                    `}
                </style>
            </div>
        </div>
    );
};

export default InvoiceModal;
