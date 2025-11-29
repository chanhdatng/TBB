import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const RevenueChart = ({ data = [], isVisible = true, timeRange = 'year', onTimeRangeChange }) => {
    const totalRevenue = data.reduce((sum, item) => sum + (Number(item.revenue) || Number(item.value) || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white p-4 lg:p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow h-full"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                            <TrendingUp className="text-primary" size={20} />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Cash Flow</h3>
                    </div>
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 break-all"
                    >
                        {isVisible
                            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)
                            : '******'}
                    </motion.h2>
                </div>
                <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 w-full sm:w-auto overflow-x-auto">
                    {['week', 'month', 'year'].map((range) => (
                        <motion.button
                            key={range}
                            onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex-1 sm:flex-none px-3 py-1.5 lg:px-4 lg:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${timeRange === range
                                    ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg shadow-primary/30'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full relative">
                {!isVisible && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
                        <p className="text-gray-500 font-medium">Revenue Hidden</p>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(value) => isVisible ? `${value / 1000000}M` : '***'}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length && isVisible) {
                                    return (
                                        <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl text-xs">
                                            <p className="font-bold mb-1">{payload[0].payload.date}</p>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-400">Revenue</span>
                                                <span className="font-bold">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="revenue" radius={[8, 8, 8, 8]} barSize={40}>
                            {data.map((entry, index) => {
                                // Create gradient effect for bars
                                const isHighlighted = index === data.length - 1;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={isHighlighted ? 'url(#colorGradient)' : '#E5E7EB'}
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                );
                            })}
                        </Bar>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0F5132" stopOpacity={1} />
                                <stop offset="100%" stopColor="#198754" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default RevenueChart;
