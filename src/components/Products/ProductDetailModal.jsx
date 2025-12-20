import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Calendar, BarChart2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const ProductDetailModal = ({ product, isOpen, onClose }) => {
    const { productAnalytics } = useData();

    // Find analytics by matching product name (name is now stored in productAnalytics)
    const analytics = useMemo(() => {
        if (!product || !productAnalytics) return null;
        
        // First try direct ID match
        if (productAnalytics[product.id]) {
            return productAnalytics[product.id];
        }
        
        // Match by name from productAnalytics (name is now stored in each entry)
        const searchName = product.name?.toLowerCase();
        const matchEntry = Object.values(productAnalytics).find(
            entry => entry.name?.toLowerCase() === searchName
        );
        
        return matchEntry || null;
    }, [product, productAnalytics]);

    if (!isOpen || !product) return null;

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const lifetime = analytics?.lifetime || {};
    const recent30 = analytics?.recent30Days || {};
    const recent7 = analytics?.recent7Days || {};
    const trend = analytics?.trend || {};
    const rankings = analytics?.rankings || {};

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package size={24} />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                            <p className="text-sm text-gray-500">{product.type}</p>
                            <p className="text-lg font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Analytics Content */}
                <div className="p-6 space-y-6">
                    {/* Trend Badge */}
                    {trend.direction && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            trend.direction === 'rising' ? 'bg-green-100 text-green-700' :
                            trend.direction === 'falling' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                            {trend.direction === 'rising' ? <TrendingUp size={16} /> : 
                             trend.direction === 'falling' ? <TrendingDown size={16} /> : null}
                            {trend.direction === 'rising' ? 'Đang tăng' : 
                             trend.direction === 'falling' ? 'Đang giảm' : 'Ổn định'}
                            {trend.growthRate && ` (${trend.growthRate > 0 ? '+' : ''}${trend.growthRate}%)`}
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Lifetime */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <Calendar size={16} />
                                <span className="text-xs font-medium">Tổng cộng</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{lifetime.totalSold || 0}</p>
                            <p className="text-xs text-gray-500">sản phẩm bán ra</p>
                            <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(lifetime.totalRevenue)}</p>
                        </div>

                        {/* 30 Days */}
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                <BarChart2 size={16} />
                                <span className="text-xs font-medium">30 ngày</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{recent30.sold || 0}</p>
                            <p className="text-xs text-gray-500">sản phẩm bán ra</p>
                            <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(recent30.revenue)}</p>
                        </div>

                        {/* 7 Days */}
                        <div className="bg-purple-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-purple-600 mb-2">
                                <ShoppingCart size={16} />
                                <span className="text-xs font-medium">7 ngày</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{recent7.sold || 0}</p>
                            <p className="text-xs text-gray-500">sản phẩm bán ra</p>
                            <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(recent7.revenue)}</p>
                        </div>

                        {/* Orders */}
                        <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-orange-600 mb-2">
                                <DollarSign size={16} />
                                <span className="text-xs font-medium">Số đơn hàng</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{lifetime.totalOrders || 0}</p>
                            <p className="text-xs text-gray-500">đơn hàng</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Trung bình: {((lifetime.totalSold || 0) / (lifetime.totalOrders || 1)).toFixed(1)}/đơn
                            </p>
                        </div>
                    </div>

                    {/* Rankings */}
                    {(rankings.popularity || rankings.revenue) && (
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Xếp hạng</h3>
                            <div className="flex flex-wrap gap-2">
                                {rankings.popularity && (
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                                        🏆 #{rankings.popularity} bán chạy
                                    </span>
                                )}
                                {rankings.revenue && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                        💰 #{rankings.revenue} doanh thu
                                    </span>
                                )}
                                {rankings.growth && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                        📈 #{rankings.growth} tăng trưởng
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No Analytics Data */}
                    {!analytics && (
                        <div className="text-center py-8 text-gray-500">
                            <Package size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Chưa có dữ liệu phân tích</p>
                            <p className="text-xs mt-1">Dữ liệu sẽ được cập nhật vào 00:00 hàng ngày</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;
