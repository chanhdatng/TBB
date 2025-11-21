import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RevenueChart = ({ data = [], isVisible = true, timeRange = 'year', onTimeRangeChange }) => {
    const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Cash Flow</h3>
                    <h2 className="text-3xl font-bold text-gray-900 mt-1">
                        {isVisible
                            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)
                            : '******'}
                    </h2>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    {['week', 'month', 'year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
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
                            dataKey="name"
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
                                            <p className="font-bold mb-1">{payload[0].payload.name}</p>
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
                        <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === data.length - 1 ? '#0F5132' : '#E5E7EB'}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
