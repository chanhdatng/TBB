import React, { useRef, useState } from 'react';
import { X, Printer, Download, Share2, ZoomIn, ZoomOut, Maximize, Copy } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '../../contexts/ToastContext';

const InvoiceModal = ({ isOpen, onClose, order }) => {
    const printRef = useRef();
    const qrRef = useRef();

    const [isSharing, setIsSharing] = useState(false);
    const [zoom, setZoom] = useState(0.8);
    const [qrBase64, setQrBase64] = useState(null);
    const [invoiceImage, setInvoiceImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrLoaded, setQrLoaded] = useState(false);
    const [qrLoadError, setQrLoadError] = useState(false);

    const { showToast } = useToast();

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
            setInvoiceImage(null); // Reset image on open
            setQrBase64(null); // Reset QR on open
            setQrLoaded(false); // Reset QR loaded state
            setQrLoadError(false); // Reset QR error state
            setIsGenerating(true); // Start generating
            return () => window.removeEventListener('resize', calculateZoom);
        }
    }, [isOpen]);

    // Calculate totals and QR URL safely using useMemo
    const { total, subtotal, shipping, otherFee, discount, qrUrl, bankId, accountNo } = React.useMemo(() => {
        if (!order) return { 
            total: 0, subtotal: 0, shipping: 0, otherFee: 0, discount: 0, 
            qrUrl: '', bankId: '', accountNo: '' 
        };

        const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.amount || 0)), 0);
        const shipping = Number(order.originalData?.shipFee || 0);
        const otherFee = Number(order.originalData?.otherFee || 0);
        const discount = Number(order.originalData?.discount || 0);
        const total = subtotal + shipping + otherFee - discount;

        // QR Code URL Generation
        const bankId = 'VCB';
        const accountNo = '1029443065';
        const template = 'compact';
        const addInfo = encodeURIComponent(`${order.customer.name} ${order.id} thanh toan`);
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${total}&addInfo=${addInfo}`;

        return { total, subtotal, shipping, otherFee, discount, qrUrl, bankId, accountNo };
    }, [order]);

    React.useEffect(() => {
        const generateQrBase64 = async (retries = 5) => {
            if (!qrUrl || !isOpen) return;
            
            setQrLoaded(false);
            setQrLoadError(false);
            
            for (let i = 0; i < retries; i++) {
                try {
                    // Add cache busting with random number
                    const urlWithCacheBust = `${qrUrl}&t=${Date.now()}&r=${Math.random()}`;
                    
                    // Use fetch with timeout for mobile
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                    
                    const response = await fetch(urlWithCacheBust, {
                        signal: controller.signal,
                        mode: 'cors',
                        cache: 'no-cache'
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    const blob = await response.blob();
                    
                    // Verify it's actually an image
                    if (!blob.type.startsWith('image/')) {
                        throw new Error('Response is not an image');
                    }
                    
                    const reader = new FileReader();
                    
                    await new Promise((resolve, reject) => {
                        reader.onloadend = () => {
                            if (reader.result) {
                                setQrBase64(reader.result);
                                setQrLoaded(true);
                                setQrLoadError(false);
                                resolve();
                            } else {
                                reject(new Error('Failed to read QR code'));
                            }
                        };
                        reader.onerror = () => reject(new Error('FileReader error'));
                        reader.readAsDataURL(blob);
                    });
                    
                    return; // Success, exit loop
                } catch (error) {
                    console.error(`Attempt ${i + 1} failed to generate QR Base64:`, error);
                    if (i === retries - 1) {
                        // Final attempt - use original URL as fallback
                        setQrBase64(qrUrl);
                        setQrLoadError(true);
                        setQrLoaded(true); // Still mark as loaded so invoice can generate
                    } else {
                        // Wait before retrying with exponential backoff
                        const delay = Math.min(1000 * Math.pow(2, i), 5000);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        };
        
        if (isOpen && qrUrl) {
            generateQrBase64();
        }
    }, [qrUrl, isOpen]);

    // Generate Invoice Image when QR is ready
    const generateInvoiceImage = React.useCallback(async () => {
        if (!printRef.current) return;

        try {
            // Wait for QR to be loaded (with timeout)
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds max wait
            while (!qrLoaded && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }

            // Wait a bit more for layout to stabilize and QR image to render
            await new Promise(resolve => setTimeout(resolve, 300));

            // Double check QR image is actually loaded in DOM
            if (qrRef.current && !qrRef.current.complete) {
                await new Promise((resolve) => {
                    let checkAttempts = 0;
                    const maxCheckAttempts = 30; // 3 seconds max
                    const checkComplete = () => {
                        if (qrRef.current && qrRef.current.complete) {
                            resolve();
                        } else if (checkAttempts < maxCheckAttempts) {
                            checkAttempts++;
                            setTimeout(checkComplete, 100);
                        } else {
                            resolve(); // Continue even if not complete
                        }
                    };
                    checkComplete();
                });
            }

            const dataUrl = await toPng(printRef.current, {
                cacheBust: false,
                backgroundColor: '#ffffff',
                pixelRatio: 3, // High quality
                style: {
                    transform: 'none',
                    boxShadow: 'none'
                }
            });
            setInvoiceImage(dataUrl);
            setIsGenerating(false);
        } catch (error) {
            console.error("Error generating invoice image:", error);
            setIsGenerating(false);
            showToast("Không thể tạo ảnh hóa đơn", "error");
        }
    }, [qrLoaded, showToast]);

    // Trigger generation when QR image loads
    const handleQrLoad = React.useCallback(() => {
        // Generate invoice after a short delay to ensure image is rendered
        setTimeout(() => {
            generateInvoiceImage();
        }, 300);
    }, [generateInvoiceImage]);

    // Also trigger generation when QR state changes to loaded
    React.useEffect(() => {
        if (qrLoaded && qrBase64 && isGenerating && !invoiceImage) {
            // Small delay to ensure DOM is updated
            const timer = setTimeout(() => {
                generateInvoiceImage();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [qrLoaded, qrBase64, isGenerating, invoiceImage, generateInvoiceImage]);

    const handlePrint = () => {
        if (invoiceImage) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Invoice</title>
                        <style>
                            body { margin: 0; display: flex; justify-content: center; align-items: center; }
                            img { max-width: 100%; height: auto; }
                            @media print {
                                body { display: block; }
                                img { width: 100%; }
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${invoiceImage}" onload="window.print();window.close()" />
                    </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            window.print(); // Fallback
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
    const handleFitWindow = () => calculateZoom();



    const handleShare = async () => {
        if (!invoiceImage || isSharing) return;

        setIsSharing(true);
        try {
            // Convert Base64 Data URL to Blob
            const res = await fetch(invoiceImage);
            const blob = await res.blob();
            const file = new File([blob], `invoice_${order.id}.png`, { type: 'image/png' });

            // Check if Web Share API is supported and can share files
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Hóa đơn #${order.id}`,
                        text: `Hóa đơn đơn hàng #${order.id} từ The Butter Bake`
                    });
                    showToast('Đã chia sẻ hóa đơn thành công', 'success');
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        console.error('Share failed:', shareError);
                        await copyToClipboardOrDownload(blob, invoiceImage);
                    }
                }
            } else {
                await copyToClipboardOrDownload(blob, invoiceImage);
            }

            setIsSharing(false);

        } catch (error) {
            console.error('Error sharing invoice:', error);
            setIsSharing(false);
            showToast('Không thể chia sẻ hóa đơn. Vui lòng thử lại.', 'error');
        }
    };

    const copyToClipboardOrDownload = async (blob, dataUrl) => {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
            showToast('Đã sao chép ảnh hóa đơn vào clipboard', 'success');
        } catch (clipboardError) {
            console.error('Clipboard write failed:', clipboardError);
            showToast('Không thể sao chép vào clipboard. Đang tải xuống...', 'warning');
            downloadImage(dataUrl);
        }
    };

    const downloadImage = (dataUrl) => {
        const link = document.createElement('a');
        link.download = `invoice_${order.id}.png`;
        link.href = dataUrl;
        link.click();
    };

    const handleCopy = async () => {
        if (!invoiceImage) return;
        try {
            const res = await fetch(invoiceImage);
            const blob = await res.blob();
            await copyToClipboardOrDownload(blob, invoiceImage);
        } catch (error) {
            console.error('Error copying invoice:', error);
            showToast('Không thể sao chép hóa đơn', 'error');
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col h-[90vh] print:shadow-none print:max-w-none print:max-h-none print:w-full print:h-full print:rounded-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 print:hidden bg-gray-50 z-10">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-gray-700">Invoice Preview</h3>
                        {/* Zoom Controls */}
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                            <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="Zoom Out"><ZoomOut size={16} /></button>
                            <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="Zoom In"><ZoomIn size={16} /></button>
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                            <button onClick={handleFitWindow} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors" title="Fit to Window"><Maximize size={16} /></button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            disabled={!invoiceImage || isSharing}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {isSharing ? <span className="animate-pulse">Sharing...</span> : <><Share2 size={18} /> Share</>}
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={!invoiceImage}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <Copy size={18} /> Copy
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!invoiceImage}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"><X size={20} /></button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center items-start relative">
                    {/* Loading State */}
                    {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-gray-500 font-medium">Đang tạo hóa đơn...</p>
                        </div>
                    )}

                    {/* Generated Image Display */}
                    {invoiceImage && (
                        <div 
                            className="bg-white shadow-xl transition-transform origin-top duration-200"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <img src={invoiceImage} alt="Invoice" className="max-w-none" style={{ width: '148mm', height: 'auto' }} />
                        </div>
                    )}

                    {/* Hidden Source Content for Generation */}
                    <div className="absolute left-[-9999px] top-0">
                        <div
                            ref={printRef}
                            id="invoice-content"
                            className="bg-white"
                            style={{
                                width: '148mm',
                                minHeight: '210mm',
                                padding: '24px'
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
                            <div className="mb-6 border border-gray-200 rounded-lg p-3 flex justify-between items-start gap-3">
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
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden w-20 text-center">
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
                                        <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700">
                                            {order.timeline.received.time}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-6">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-y border-gray-200">
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
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* QR Code */}
                                <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                                    {qrBase64 ? (
                                        <img
                                            ref={qrRef}
                                            src={qrBase64}
                                            alt="Payment QR Code"
                                            className="w-32 h-32 object-contain mb-2"
                                            crossOrigin="anonymous"
                                            onLoad={(e) => {
                                                // Ensure image is actually loaded
                                                if (e.target.complete && e.target.naturalWidth > 0) {
                                                    handleQrLoad();
                                                }
                                            }}
                                            onError={(e) => {
                                                console.error('QR image failed to load');
                                                // Still try to generate invoice without QR
                                                setTimeout(() => {
                                                    handleQrLoad();
                                                }, 500);
                                            }}
                                            loading="eager"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 flex items-center justify-center mb-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-500 text-center">Quét mã để thanh toán</p>
                                    <p className="text-[10px] font-mono text-gray-400 mt-1">{bankId} - {accountNo}</p>
                                </div>

                                {/* Totals */}
                                <div className="w-full md:w-1/2 space-y-2">
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
                                    {otherFee > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Phí khác:</span>
                                            <span className="font-medium text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(otherFee)}
                                            </span>
                                        </div>
                                    )}
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

                                    <div className="mt-6 text-center pt-6 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-900">Cảm ơn quý khách!</p>
                                        <p className="text-xs text-gray-500 mt-1">Hẹn gặp lại</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
