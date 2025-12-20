import React, { useRef, useState } from 'react';
import { X, Printer, Download, Share2, Copy } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '../../contexts/ToastContext';

const InvoiceModal = ({ isOpen, onClose, order, onReady }) => {
    const printRef = useRef();
    const qrRef = useRef();
    const timeoutRef = useRef(null);

    const [isSharing, setIsSharing] = useState(false);
    const [qrBase64, setQrBase64] = useState(null);
    const [invoiceImage, setInvoiceImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrLoaded, setQrLoaded] = useState(false);
    const [qrLoadError, setQrLoadError] = useState(false);

    const { showToast } = useToast();

    // Default fallback QR code - use a default vietqr.io QR code
    const defaultQrCode = React.useMemo(() => {
        if (!order) return '';
        const bankId = 'VCB';
        const accountNo = '1029443065';
        const template = 'compact';
        // Use default amount and info for fallback
        return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=0&addInfo=The%20Butter%20Bake`;
    }, [order]);

    // Reset states on open
    React.useEffect(() => {
        if (isOpen) {
            setInvoiceImage(null); // Reset image on open
            setQrBase64(null); // Reset QR on open
            setQrLoaded(false); // Reset QR loaded state
            setQrLoadError(false); // Reset QR error state
            setIsGenerating(true); // Start generating
        }
    }, [isOpen]);

    // Calculate totals and QR URL safely using useMemo
    const { total, subtotal, shipping, otherFee, discount, discountValue, qrUrl, bankId, accountNo } = React.useMemo(() => {
        if (!order) return { 
            total: 0, subtotal: 0, shipping: 0, otherFee: 0, discount: 0, discountValue: 0,
            qrUrl: '', bankId: '', accountNo: '' 
        };

        const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.amount || 0)), 0);
        const shipping = Number(order.originalData?.shipFee || 0);
        const otherFee = Number(order.originalData?.otherFee || 0);
        const discountValue = Number(order.originalData?.discount || 0);
        // Heuristic: if discount <= 100, treat as percentage. Else treat as amount.
        const discount = discountValue <= 100 
            ? (subtotal * discountValue) / 100 
            : discountValue;
        const total = subtotal + shipping + otherFee - discount;

        // QR Code URL Generation
        const bankId = 'VCB';
        const accountNo = '1029443065';
        const template = 'compact';
        const addInfo = encodeURIComponent(`${order.customer.name} ${order.id} thanh toan`);
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.jpg?amount=${total}&addInfo=${addInfo}`;

        return { total, subtotal, shipping, otherFee, discount, discountValue, qrUrl, bankId, accountNo };
    }, [order]);

    React.useEffect(() => {
        const generateQrBase64 = async (retries = 5) => {
            if (!qrUrl || !isOpen) return;
            
            setQrLoaded(false);
            setQrLoadError(false);
            
            // Set overall timeout of 10 seconds
            const overallTimeout = setTimeout(() => {
                console.warn('QR code load timeout after 10s, using fallback QR');
                setQrBase64(defaultQrCode);
                setQrLoaded(true);
                setQrLoadError(true);
            }, 10000);
            
            try {
                for (let i = 0; i < retries; i++) {
                    try {
                        // Add cache busting with random number
                        const urlWithCacheBust = `${qrUrl}&t=${Date.now()}&r=${Math.random()}`;
                        
                        // Use fetch with timeout for mobile
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout per request
                        
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
                                    clearTimeout(overallTimeout);
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
                            // Final attempt failed - use fallback QR
                            clearTimeout(overallTimeout);
                            setQrBase64(defaultQrCode);
                            setQrLoadError(true);
                            setQrLoaded(true); // Still mark as loaded so invoice can generate
                        } else {
                            // Wait before retrying with exponential backoff
                            const delay = Math.min(1000 * Math.pow(2, i), 3000);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                }
            } catch (error) {
                clearTimeout(overallTimeout);
                console.error('QR code generation failed completely, using fallback:', error);
                setQrBase64(defaultQrCode);
                setQrLoadError(true);
                setQrLoaded(true);
            }
        };
        
        if (isOpen && qrUrl) {
            generateQrBase64();
        }
        
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [qrUrl, isOpen, defaultQrCode]);

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
            // Notify parent that invoice is ready
            if (onReady) {
                onReady();
            }
        } catch (error) {
            console.error("Error generating invoice image:", error);
            setIsGenerating(false);
            showToast("Không thể tạo ảnh hóa đơn", "error");
            // Still notify parent even on error
            if (onReady) {
                onReady();
            }
        }
    }, [qrLoaded, showToast, onReady]);

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

    // Call onReady when invoiceImage is ready
    React.useEffect(() => {
        if (invoiceImage && onReady && isOpen) {
            // Small delay to ensure image is fully rendered
            const timer = setTimeout(() => {
                onReady();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [invoiceImage, onReady, isOpen]);

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
                        files: [file]
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
                className={`bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col ${invoiceImage ? 'max-h-[95vh]' : 'h-[90vh]'} md:h-[90vh] md:max-h-[90vh] print:shadow-none print:max-w-none print:max-h-none print:w-full print:h-full print:rounded-none`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 print:hidden bg-gray-50 z-10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-gray-700">Invoice Preview</h3>
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
                <div className={`${invoiceImage ? 'md:flex-1' : 'flex-1'} overflow-auto bg-gray-100 p-2 md:p-4 flex justify-center items-center relative min-h-0 max-h-full`}>
                    {/* Loading State */}
                    {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-gray-500 font-medium">Đang tạo hóa đơn...</p>
                        </div>
                    )}

                    {/* Generated Image Display */}
                    {invoiceImage && (
                        <div className="bg-white shadow-xl w-full h-full flex items-center justify-center p-2 box-border overflow-hidden">
                            <img 
                                src={invoiceImage} 
                                alt="Invoice" 
                                className="object-contain" 
                                style={{ 
                                    width: 'auto', 
                                    height: 'auto',
                                    maxWidth: 'calc(100% - 16px)',
                                    maxHeight: 'calc(100% - 16px)'
                                }}
                            />
                        </div>
                    )}

                    {/* Hidden Source Content for Generation */}
                    <div className="absolute left-[-9999px] top-0">
                        <div
                            ref={printRef}
                            id="invoice-content"
                            className="bg-white flex flex-col"
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
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <span className="text-gray-400 text-[11px] uppercase tracking-wider block mb-0.5 font-bold">Khách hàng</span>
                                        <p className="font-bold text-gray-900 text-lg">{order.customer.name}</p>
                                    </div>
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="text-gray-400 text-[11px] uppercase tracking-wider block mb-0.5 font-bold">Điện thoại</span>
                                            <p className="font-bold text-gray-900 font-mono text-base">{order.customer.phone}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 text-[11px] uppercase tracking-wider block mb-0.5 font-bold">Thời gian nhận</span>
                                            <p className="font-bold text-primary text-base uppercase">{order.timeline.received.time}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-[11px] uppercase tracking-wider block mb-0.5 font-bold">Địa chỉ</span>
                                        <p className="font-bold text-gray-900 leading-tight text-sm">{order.customer.address}</p>
                                    </div>
                                </div>

                                {/* Right: Calendar Component */}
                                <div className="flex flex-col items-center">
                                    <div className="bg-white border-2 border-gray-100 rounded-xl shadow-sm overflow-hidden w-24 text-center">
                                        <div className="bg-red-500 text-white text-[11px] font-bold py-1 uppercase tracking-widest">
                                            {order.timeline.received.raw.toLocaleDateString('vi-VN', { month: 'short' }).replace('.', '')}
                                        </div>
                                        <div className="py-2">
                                            <span className="text-4xl font-black text-gray-900 block leading-none tracking-tighter">
                                                {order.timeline.received.raw.getDate()}
                                            </span>
                                            <span className="text-[11px] text-gray-400 uppercase font-bold mt-1 block tracking-wider">
                                                {order.timeline.received.raw.toLocaleDateString('vi-VN', { weekday: 'long' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-y border-gray-200">
                                            <th className="py-2.5 px-2 text-left font-bold text-gray-700 text-[10px] uppercase tracking-wider">STT</th>
                                            <th className="py-2.5 px-2 text-left font-bold text-gray-700 text-[10px] uppercase tracking-wider">Tên món</th>
                                            <th className="py-2.5 px-2 text-center font-bold text-gray-700 text-[10px] uppercase tracking-wider">SL</th>
                                            <th className="py-2.5 px-2 text-right font-bold text-gray-700 text-[10px] uppercase tracking-wider">Đơn giá</th>
                                            <th className="py-2.5 px-2 text-right font-bold text-gray-700 text-[10px] uppercase tracking-wider">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {order.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-3 px-2 text-gray-500 text-xs">{index + 1}</td>
                                                <td className="py-3 px-2 text-gray-900 font-bold text-base">{item.name}</td>
                                                <td className="py-3 px-2 text-center text-gray-900 font-bold text-base">x{item.amount}</td>
                                                <td className="py-3 px-2 text-right text-gray-900 text-xs">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                                </td>
                                                <td className="py-3 px-2 text-right text-gray-900 font-bold">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Order Note - Important for cake specifications */}
                            {order.originalData?.orderNote && (
                                <div className="mb-6 p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                                    <span className="text-orange-600 text-[10px] font-bold uppercase tracking-wider block mb-1">Ghi chú / Thông số bánh</span>
                                    <p className="text-sm text-gray-800 font-medium leading-relaxed italic">
                                        "{order.originalData.orderNote}"
                                    </p>
                                </div>
                            )}

                            {/* Footer Section: QR & Totals */}
                            <div className="flex-1 flex flex-col space-y-4">
                                {/* QR Code & Main Totals Row - Always horizontal on mobile */}
                                <div className="flex flex-row justify-between items-start gap-4">
                                    {/* QR Code */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center p-3 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                                        {qrBase64 ? (
                                            <img
                                                ref={qrRef}
                                                src={qrBase64}
                                                alt="Payment QR Code"
                                                className="w-24 h-24 md:w-32 md:h-32 object-contain mb-1"
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
                                            <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-1">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                                            </div>
                                        )}
                                        <p className="text-[9px] md:text-[10px] text-gray-500 text-center">Quét mã để thanh toán</p>
                                        <p className="text-[9px] md:text-[10px] font-mono text-gray-400 mt-0.5">{bankId} - {accountNo}</p>
                                    </div>

                                    {/* Main Totals - Aligned with table columns */}
                                    <div className="flex-1">
                                        <table className="w-full text-xs">
                                            <tbody>
                                                <tr>
                                                    <td className="py-1.5 px-2 text-left text-gray-500 font-medium">Tạm tính:</td>
                                                    <td className="py-1.5 px-2 text-right font-bold text-gray-900">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-2 text-left text-gray-500 font-medium">
                                                        Giảm giá {discountValue <= 100 && discountValue > 0 ? `(${discountValue}%)` : ''}:
                                                    </td>
                                                    <td className={`py-1.5 px-2 text-right font-bold ${discount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                        -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-2 text-left text-gray-500 font-medium">Phí vận chuyển:</td>
                                                    <td className="py-1.5 px-2 text-right font-bold text-gray-900">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipping)}
                                                    </td>
                                                </tr>
                                                {otherFee > 0 && (
                                                    <tr>
                                                        <td className="py-1.5 px-2 text-left text-gray-500 font-medium">Phí khác:</td>
                                                        <td className="py-1.5 px-2 text-right font-bold text-gray-900">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(otherFee)}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td className="py-4 px-2 border-t-2 border-primary/20 text-left">
                                                        <span className="text-sm font-black text-gray-900 uppercase">Tổng cộng:</span>
                                                    </td>
                                                    <td className="py-4 px-2 border-t-2 border-primary/20 text-right">
                                                        <span className="text-2xl md:text-3xl font-black text-primary">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Thank you message - At the bottom of the page */}
                            <div className="text-center pt-4 mt-auto border-t border-gray-100 italic">
                                <p className="text-xs font-bold text-gray-800">Cảm ơn quý khách!</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">The Butter Bake - Chúc bạn một ngày ngọt ngào</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
