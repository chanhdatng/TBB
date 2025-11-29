import React, { useRef, useState } from 'react';
import { X, Printer, Download, Share2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '../../contexts/ToastContext';

const InvoiceModal = ({ isOpen, onClose, order }) => {
    const printRef = useRef();
    const [isSharing, setIsSharing] = useState(false);
    const [zoom, setZoom] = useState(0.8);

    const calculateZoom = () => {
        const invoiceHeightPx = 794; // Approx A5 height in pixels (at 96 DPI)
        const invoiceWidthPx = 560; // Approx A5 width in pixels
        
        const modalHeight = window.innerHeight * 0.9; // 90vh
        const modalWidth = Math.min(window.innerWidth - 32, 600); // Max width 600px, minus outer padding
        
        const headerHeight = 65; // Header height
        const padding = 40; // Content padding (p-4 = 16px * 2) + extra buffer
        
        const availableHeight = modalHeight - headerHeight - padding;
        const availableWidth = modalWidth - padding;
        
        const scaleHeight = availableHeight / invoiceHeightPx;
        const scaleWidth = availableWidth / invoiceWidthPx;
        
        // Use the smaller scale to ensure it fits both dimensions
        const optimalZoom = Math.min(scaleHeight, scaleWidth);
        
        // Clamp zoom between 0.3 and 1.0 (no need to zoom in > 100% by default)
        setZoom(Math.min(Math.max(optimalZoom, 0.3), 1.0));
    };

    // Auto-fit zoom on open
    React.useEffect(() => {
        if (isOpen) {
            calculateZoom();
            window.addEventListener('resize', calculateZoom);
            return () => window.removeEventListener('resize', calculateZoom);
        }
    }, [isOpen]);

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
        window.print();
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
    const handleFitWindow = () => calculateZoom();

    const { showToast } = useToast();

    const handleShare = async () => {
        if (!printRef.current || isSharing) return;

        setIsSharing(true);
        try {
            // Capture the invoice content using html-to-image
            const dataUrl = await toPng(printRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 3, // FHD quality (approx 1680x2380px for A5)
                style: {
                    transform: 'none', // Reset transform for capture
                    boxShadow: 'none'
                }
            });

            // Convert Base64 Data URL to Blob
            const res = await fetch(dataUrl);
            const blob = await res.blob();

            try {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                showToast('Đã sao chép ảnh hóa đơn vào clipboard', 'success');
            } catch (clipboardError) {
                console.error('Clipboard write failed:', clipboardError);
                // Fallback to download if clipboard fails
                showToast('Không thể sao chép vào clipboard. Đang tải xuống...', 'warning');
                downloadImage(dataUrl);
            }

            setIsSharing(false);

        } catch (error) {
            console.error('Error generating invoice image:', error);
            setIsSharing(false);
            showToast('Không thể tạo ảnh hóa đơn. Vui lòng thử lại.', 'error');
        }
    };

    const downloadImage = (dataUrl) => {
        const link = document.createElement('a');
        link.download = `invoice_${order.id}.png`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col h-[90vh] print:shadow-none print:max-w-none print:max-h-none print:w-full print:h-full print:rounded-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions - Hidden in Print */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 print:hidden bg-gray-50 z-10">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-gray-700">Invoice Preview</h3>
                        {/* Zoom Controls */}
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                            <button
                                onClick={handleZoomOut}
                                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <button
                                onClick={handleZoomIn}
                                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn size={16} />
                            </button>
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                            <button
                                onClick={handleFitWindow}
                                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                                title="Fit to Window"
                            >
                                <Maximize size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {isSharing ? (
                                <span className="animate-pulse">Generating...</span>
                            ) : (
                                <>
                                    <Share2 size={18} /> Share
                                </>
                            )}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Printer size={18} /> Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Printable Content Wrapper */}
                <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center items-start print:p-0 print:bg-white print:block">
                    <div
                        ref={printRef}
                        id="invoice-content"
                        className="bg-white shadow-xl transition-transform origin-top duration-200 print:shadow-none print:transform-none print:w-full print:m-0"
                        style={{
                            transform: `scale(${zoom})`,
                            width: '148mm', // A5 Width
                            minHeight: '210mm', // A5 Height
                            padding: '24px' // Reduced padding for A5
                        }}
                    >
                        {/* Invoice Header */}
                        <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-primary mb-1">HÓA ĐƠN</h1>
                                <p className="text-sm text-gray-500 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{order.timeline.ordered.date} • {order.timeline.ordered.time}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-bold text-gray-800">The Butter Bake</h2>
                                <p className="text-xs text-gray-600">32A Nguyễn Bá Huân, Thảo Điền</p>
                                <p className="text-xs text-gray-600">SĐT: 0868836165</p>
                            </div>
                        </div>

                        {/* Customer Info & Calendar */}
                        <div className="mb-6 border border-gray-200 rounded-lg p-3 print:border-gray-300 flex justify-between items-start gap-3">
                            {/* Left: Customer Info (Vertical) */}
                            <div className="flex-1 space-y-2">
                                <div>
                                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-0.5">Khách hàng</span>
                                    <p className="font-bold text-gray-900 text-base">{order.customer.name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-0.5">Điện thoại</span>
                                    <p className="font-semibold text-gray-900 font-mono text-sm">{order.customer.phone}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-0.5">Địa chỉ</span>
                                    <p className="font-medium text-gray-900 leading-tight text-sm">{order.customer.address}</p>
                                </div>
                            </div>

                            {/* Right: Calendar Component */}
                            <div className="flex flex-col items-center">
                                <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Thời gian nhận</span>
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden w-20 text-center print:border-gray-300">
                                    <div className="bg-red-500 text-white text-[10px] font-bold py-0.5 uppercase tracking-wide">
                                        {order.timeline.received.raw.toLocaleDateString('vi-VN', { month: 'long' })}
                                    </div>
                                    <div className="py-1">
                                        <span className="text-2xl font-bold text-gray-900 block leading-none">
                                            {order.timeline.received.raw.getDate()}
                                        </span>
                                        <span className="text-[10px] text-gray-500 uppercase font-medium mt-0.5 block">
                                            {order.timeline.received.raw.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-1 text-center">
                                    <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700 print:bg-transparent print:border print:border-gray-200">
                                        {order.timeline.received.time}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-6">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-50 border-y border-gray-200 print:bg-gray-100">
                                        <th className="py-2 px-2 text-left font-semibold text-gray-700">STT</th>
                                        <th className="py-2 px-2 text-left font-semibold text-gray-700">Tên món</th>
                                        <th className="py-2 px-2 text-center font-semibold text-gray-700">SL</th>
                                        <th className="py-2 px-2 text-right font-semibold text-gray-700">Đơn giá</th>
                                        <th className="py-2 px-2 text-right font-semibold text-gray-700">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                                            <td className="py-2 px-2 text-gray-900 font-medium">{item.name}</td>
                                            <td className="py-2 px-2 text-center text-gray-900">{item.amount}</td>
                                            <td className="py-2 px-2 text-right text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                            </td>
                                            <td className="py-2 px-2 text-right text-gray-900 font-medium">
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
                                    className="w-32 h-32 object-contain mb-2"
                                    crossOrigin="anonymous"
                                />
                                <p className="text-[10px] text-gray-500 text-center">Quét mã để thanh toán</p>
                                <p className="text-[10px] font-mono text-gray-400 mt-1">{bankId} - {accountNo}</p>
                            </div>

                            {/* Totals */}
                            <div className="w-full md:w-1/2 print:w-1/2 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Tạm tính:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Phí vận chuyển:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipping)}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Giảm giá:</span>
                                        <span className="font-medium text-red-500">
                                            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount)}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-gray-200 mt-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-gray-900">Tổng cộng:</span>
                                        <span className="text-xl font-bold text-primary">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 text-center pt-6 border-t border-gray-100 print:mt-8">
                                    <p className="text-sm font-medium text-gray-900">Cảm ơn quý khách!</p>
                                    <p className="text-xs text-gray-500 mt-1">Hẹn gặp lại</p>
                                </div>
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
                                width: 100% !important;
                                height: auto !important;
                                margin: 0 !important;
                                padding: 20px !important;
                                transform: none !important;
                                box-shadow: none !important;
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
