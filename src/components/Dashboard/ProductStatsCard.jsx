import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { TrendingUp, TrendingDown, Package, ShoppingBag, Gift, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white p-4 lg:p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl">
                            <BarChart3 className="text-purple-600" size={20} />
                        </div>
                        <h3 className="text-base lg:text-lg font-bold text-gray-900">Product Statistic</h3>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-500">Track your product sales</p>
                </div>
                <div className="px-2 py-1 lg:px-3 lg:py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full text-[10px] lg:text-xs font-semibold text-primary border border-primary/20">
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
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                    <span className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">{totalSales}</span>
                    <span className="text-xs text-gray-500 mb-1 font-medium">Products Sales</span>
                    {totalTrend !== 0 && (
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${totalTrend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                        >
                            {totalTrend > 0 ? '+' : ''}{totalTrend.toFixed(1)}%
                        </motion.span>
                    )}
                </motion.div>
            </div>

            <div className="space-y-3 mt-4">
                {data.slice(0, 3).map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ x: 4, transition: { duration: 0.2 } }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div style={{ backgroundColor: COLORS[index] + '20' }} className={`w-10 h-10 rounded-xl flex items-center justify-center`}>
                                <div style={{ color: COLORS[index] }}>
                                    {getIcon(index)}
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]" title={item.name}>
                                {item.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-gray-900">{item.count}</span>
                            {item.trend !== undefined && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ProductStatsCard;
