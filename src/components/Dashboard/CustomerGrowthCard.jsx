import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateGeographicStats, getZoneColor } from '../../utils/addressParser';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import { MapPin, ArrowRight, User } from 'lucide-react';

const CustomerGrowthCard = () => {
    const { customers, customerMetrics } = useData();

    const { stats, bubbles } = useMemo(() => {
        if (!customers || customers.length === 0) return { stats: [], bubbles: [] };

        // Enrich customers with analytics data (location, spread)
        const enrichedCustomers = customers.map(customer => {
            const metrics = customerMetrics[customer.phone] || {};
            return {
                ...customer,
                location: metrics.location || {},
                totalSpent: metrics.totalSpent || 0
            };
        });

        const geoStats = calculateGeographicStats(enrichedCustomers);
        const topDistricts = geoStats.topDistricts.slice(0, 4); // Limit to top 4 for the bubble design

        // Custom Bubble Positions to mimic the "Packed" look
        // We use a fixed layout for the top 1-4 items to make them look clustered.
        const positions = [
            { x: 35, y: 55, r: 8000, color: '#4f46e5' }, // Largest (Center-Left)
            { x: 65, y: 65, r: 5000, color: '#6366f1' }, // 2nd (Top-Right)
            { x: 55, y: 30, r: 4000, color: '#8b5cf6' }, // 3rd (Bottom-Right)
            { x: 25, y: 25, r: 2500, color: '#a78bfa' }, // 4th (Bottom-Left)
        ];

        const bubbleData = topDistricts.map((d, index) => ({
            name: d.district,
            value: d.count,
            x: positions[index]?.x || 50,
            y: positions[index]?.y || 50,
            z: positions[index]?.r || 1000, // Size priority
            fill: positions[index]?.color || '#cbd5e1'
        }));

        return { stats: topDistricts, bubbles: bubbleData };
    }, [customers, customerMetrics]);

    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/20 h-full flex flex-col justify-between relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-full blur-3xl -z-10 opacity-60"></div>

            <div className="flex justify-between items-start mb-8 z-10">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Customer Growth</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">Track customer by locations</p>
                </div>
                <div className="relative">
                    <select className="bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-full px-4 py-2 pr-8 appearance-none shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer">
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>This Year</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-center z-10 flex-1">
                {/* Bubble Chart Area */}
                <div className="w-full lg:w-5/12 h-64 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
                            <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
                            <ZAxis type="number" dataKey="z" range={[2000, 9000]} />
                            <Tooltip 
                                cursor={false}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-gray-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-xl text-xs">
                                                <p className="font-bold mb-0.5">{data.name}</p>
                                                <p className="text-gray-300">{data.value} Customers</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter data={bubbles} animationDuration={1000} animationEasing="ease-out">
                                {bubbles.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.fill} 
                                        stroke="white"
                                        strokeWidth={4} 
                                        className="opacity-90 hover:opacity-100 transition-opacity duration-300"
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                    
                    {/* Floating Labels Overlay */}
                     {bubbles.map((bubble, i) => (
                        <div 
                            key={i}
                            className="absolute pointer-events-none text-white text-center flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                            style={{ 
                                left: `${bubble.x}%`, 
                                bottom: `${bubble.y}%`, 
                                opacity: bubble.value > 0 ? 1 : 0
                            }}
                        >
                            <span className="font-bold text-2xl tracking-tight leading-none drop-shadow-md">{bubble.value}</span>
                            {bubble.z > 4000 && ( 
                                <span className="text-[10px] font-medium opacity-90 mt-0.5 uppercase tracking-wide drop-shadow-sm">{bubble.name.replace('Quận ', 'Q.')}</span>
                            )}
                        </div>
                     ))}
                </div>

                {/* List Area */}
                <div className="w-full lg:w-7/12 space-y-6">
                    {stats.map((district, index) => {
                        const maxVal = stats[0]?.count || 1;
                        const percent = (district.count / maxVal) * 100;
                        const colors = [
                            'from-indigo-500 to-blue-500',
                            'from-indigo-400 to-blue-400',
                            'from-purple-400 to-indigo-400',
                            'from-purple-300 to-indigo-300'
                        ];

                        return (
                            <div key={index} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-3">
                                        {/* Rank Badge */}
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{district.district}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{district.count}</span>
                                </div>
                                <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-100">
                                    <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${colors[index] || 'from-gray-400 to-gray-300'} shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-1000 ease-out`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {stats.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <MapPin className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm font-medium">Coming soon...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerGrowthCard;
