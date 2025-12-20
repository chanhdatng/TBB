import React, { useState, useMemo, memo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import GrowthIndicator from './GrowthIndicator';

const ProductComparisonTable = ({
    data,
    loading = false
}) => {
    const [sortConfig, setSortConfig] = useState({
        key: 'total',
        direction: 'desc'
    });

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedData = useMemo(() => {
        if (!data) return [];

        return Object.entries(data)
            .map(([productName, productData]) => ({
                name: productName,
                total: productData.total || 0,
                orders: productData.orders || 0,
                avgPerOrder: productData.orders > 0
                    ? (productData.total / productData.orders).toFixed(1)
                    : 0,
                topTimeSlot: productData.timeSlots
                    ? Object.entries(productData.timeSlots)
                        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
                    : 'N/A'
            }))
            .sort((a, b) => {
                const aValue = a[sortConfig.key] || 0;
                const bValue = b[sortConfig.key] || 0;

                if (sortConfig.direction === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });
    }, [data, sortConfig]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown size={14} className="text-gray-400" />;
        }
        return sortConfig.direction === 'desc'
            ? <ArrowDown size={14} className="text-blue-600" />
            : <ArrowUp size={14} className="text-blue-600" />;
    };

    const totalProduction = sortedData.reduce((sum, item) => sum + item.total, 0);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="text-center py-12">
                <MoreHorizontal size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-900 mb-2">No product data available</p>
                <p className="text-sm text-gray-500">Product comparison will appear once production data is available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Product Production Comparison</h3>
                <p className="text-sm text-gray-500">Compare production metrics across all cake types</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                Product Name
                            </th>
                            <th
                                className="px-4 py-3 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('total')}
                            >
                                <div className="flex items-center gap-1">
                                    Total Produced
                                    <SortIcon columnKey="total" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('orders')}
                            >
                                <div className="flex items-center gap-1">
                                    Orders
                                    <SortIcon columnKey="orders" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('avgPerOrder')}
                            >
                                <div className="flex items-center gap-1">
                                    Avg per Order
                                    <SortIcon columnKey="avgPerOrder" />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                Peak Time Slot
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">
                                Share of Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedData.map((product, index) => {
                            const sharePercentage = totalProduction > 0
                                ? (product.total / totalProduction * 100).toFixed(1)
                                : 0;

                            return (
                                <tr
                                    key={product.name}
                                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {product.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-gray-900">
                                            {product.total}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-700">{product.orders}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-700">{product.avgPerOrder}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                            {product.topTimeSlot}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${Math.min(sharePercentage, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 min-w-[50px] text-right">
                                                {sharePercentage}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Total Products</p>
                    <p className="text-2xl font-bold text-blue-600">{sortedData.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-1">Total Production</p>
                    <p className="text-2xl font-bold text-green-600">{totalProduction}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-900 mb-1">Avg per Product</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {sortedData.length > 0 ? Math.round(totalProduction / sortedData.length) : 0}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default memo(ProductComparisonTable);