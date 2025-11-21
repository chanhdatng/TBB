import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
    { name: 'Jan', revenue: 4000, orders: 240 },
    { name: 'Feb', revenue: 3000, orders: 139 },
    { name: 'Mar', revenue: 2000, orders: 980 },
    { name: 'Apr', revenue: 2780, orders: 390 },
    { name: 'May', revenue: 1890, orders: 480 },
    { name: 'Jun', revenue: 2390, orders: 380 },
];

const categoryData = [
    { name: 'Cakes', value: 400 },
    { name: 'Pastries', value: 300 },
    { name: 'Breads', value: 300 },
    { name: 'Drinks', value: 200 },
];

const COLORS = ['#0F5132', '#198754', '#D1E7DD', '#FFBB28'];

const Analytics = () => {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-1">Deep dive into your bakery's performance</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue vs Orders */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue vs Orders</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#0F5132" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                                <Bar dataKey="orders" fill="#D1E7DD" radius={[4, 4, 0, 0]} name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales by Category */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm text-gray-600">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
