import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { TrendingUp, TrendingDown, Package, ShoppingBag, Gift } from 'lucide-react';

const ProductStatsCard = ({ data = [], totalSales = 0, totalTrend = 0, timeRangeLabel = 'Today' }) => {
    // Colors for the chart rings (Outer to Inner)
    const COLORS = ['#3B82F6', '#6366F1', '#EF4444', '#10B981'];

    // Prepare data for chart (reverse to make the first item outer)
    const chartData = data.slice(0, 3).map((item, index) => ({
        name: item.name,
        value: item.count,
        fill: COLORS[index % COLORS.length]
    })).reverse();

    // Helper to get icon based on index/name (Mock logic for variety)
    const getIcon = (index) => {
        switch (index) {
            case 0: return <Package size={18} />;
            case 1: return <ShoppingBag size={18} />;
            default: return <Gift size={18} />;
        }
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Product Statistic</h3>
                    <p className="text-sm text-gray-500">Track your product sales</p>
                </div>
                <div className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-100">
                    {timeRangeLabel}
                </div>
            </div>

            <div className="relative flex-1 min-h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        innerRadius="40%"
                        outerRadius="100%"
                        barSize={10}
                        data={chartData}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <RadialBar
                            background
                            clockWise
                            dataKey="value"
                            cornerRadius={10}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">{totalSales}</span>
                    <span className="text-xs text-gray-500 mb-1">Products Sales</span>
                    {totalTrend !== 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalTrend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                            {totalTrend > 0 ? '+' : ''}{totalTrend.toFixed(1)}%
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4 mt-4">
                {data.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-600 bg-gray-50`}>
                                {getIcon(index)}
                            </div>
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]" title={item.name}>
                                {item.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">{item.count}</span>
                            {item.trend !== undefined && (
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${item.trend >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductStatsCard;
