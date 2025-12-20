import React, { useState } from 'react';
import { parseTimeSlot, categorizeTimeSlot } from '../../utils/productionAnalytics';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

const TimeSlotHeatmap = ({
    orders,
    loading = false,
    height = 400
}) => {
    const [selectedCell, setSelectedCell] = useState(null);

    // Process data for heatmap
    const heatmapData = React.useMemo(() => {
        if (!orders || orders.length === 0) return [];

        // Define time slot categories in order
        const timeSlots = [
            'Early Morning (6-9)',
            'Morning (9-12)',
            'Afternoon (12-15)',
            'Late Afternoon (15-18)',
            'Evening (18-21)',
            'Night (21-6)',
            'Unknown'
        ];

        // Get unique products (limit to top 20 for readability)
        const productCount = {};
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const productName = item.name || 'Unknown';
                    productCount[productName] = (productCount[productName] || 0) + (parseInt(item.amount) || 1);
                });
            }
        });

        const topProducts = Object.entries(productCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([name]) => name);

        // Create matrix data
        const matrix = [];
        topProducts.forEach(product => {
            const row = { product };
            timeSlots.forEach(timeSlot => {
                let count = 0;
                orders.forEach(order => {
                    if (order.items) {
                        const item = order.items.find(i => i.name === product);
                        if (item) {
                            const orderTimeSlot = categorizeTimeSlot(
                                parseTimeSlot(order.timeline?.received?.time || order.deliveryTimeSlot)
                            );
                            if (orderTimeSlot === timeSlot) {
                                count += parseInt(item.amount) || 1;
                            }
                        }
                    }
                });
                row[timeSlot] = count;
            });
            matrix.push(row);
        });

        return { matrix, timeSlots };
    }, [orders]);

    // Find max value for color scaling
    const maxValue = React.useMemo(() => {
        if (!heatmapData.matrix.length) return 1;
        let max = 0;
        heatmapData.matrix.forEach(row => {
            heatmapData.timeSlots.forEach(slot => {
                max = Math.max(max, row[slot] || 0);
            });
        });
        return max || 1;
    }, [heatmapData]);

    const getColorIntensity = (value) => {
        if (value === 0) return 'bg-gray-100';
        const intensity = value / maxValue;
        if (intensity < 0.2) return 'bg-blue-100';
        if (intensity < 0.4) return 'bg-blue-200';
        if (intensity < 0.6) return 'bg-blue-300';
        if (intensity < 0.8) return 'bg-blue-400';
        return 'bg-blue-500';
    };

    const getTextColor = (value) => {
        if (value === 0) return 'text-gray-400';
        const intensity = value / maxValue;
        return intensity > 0.5 ? 'text-white' : 'text-gray-900';
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-[400px] bg-gray-100 rounded-lg"></div>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No data for heatmap</p>
                    <p className="text-sm">Production heatmap will appear once orders are available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Production Time Slot Heatmap</h3>
                    <p className="text-sm text-gray-500">Product production by time of day</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>Peak: <strong>{maxValue} cakes</strong></span>
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header row with time slots */}
                    <div className="flex border-b border-gray-200 pb-2 mb-2">
                        <div className="w-32 flex-shrink-0"></div>
                        {heatmapData.timeSlots.map(slot => (
                            <div
                                key={slot}
                                className="flex-1 text-xs font-medium text-gray-600 px-2 text-center"
                                style={{ minWidth: '100px' }}
                            >
                                {slot.replace(/\s*\([^)]*\)/g, '')}
                            </div>
                        ))}
                    </div>

                    {/* Data rows */}
                    <div className="space-y-1">
                        {heatmapData.matrix.map((row, rowIndex) => (
                            <div key={row.product} className="flex items-center">
                                {/* Product name */}
                                <div className="w-32 flex-shrink-0 pr-3 text-sm font-medium text-gray-900 truncate" title={row.product}>
                                    {row.product}
                                </div>

                                {/* Time slot cells */}
                                {heatmapData.timeSlots.map(slot => {
                                    const value = row[slot] || 0;
                                    const isSelected = selectedCell?.product === row.product && selectedCell?.slot === slot;

                                    return (
                                        <div
                                            key={slot}
                                            className={`flex-1 mx-px rounded cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 ${getColorIntensity(value)} ${isSelected ? 'ring-2 ring-blue-600' : ''}`}
                                            style={{ minWidth: '100px', height: '40px' }}
                                            onClick={() => setSelectedCell({ product: row.product, slot, value })}
                                        >
                                            <div className={`h-full flex items-center justify-center text-xs font-medium ${getTextColor(value)}`}>
                                                {value > 0 ? value : ''}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Low</span>
                    <div className="flex gap-1">
                        <div className="w-6 h-6 bg-gray-100 rounded"></div>
                        <div className="w-6 h-6 bg-blue-100 rounded"></div>
                        <div className="w-6 h-6 bg-blue-200 rounded"></div>
                        <div className="w-6 h-6 bg-blue-300 rounded"></div>
                        <div className="w-6 h-6 bg-blue-400 rounded"></div>
                        <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    </div>
                    <span className="text-sm text-gray-600">High</span>
                </div>

                {selectedCell && (
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <span className="font-medium">{selectedCell.product}</span>
                        {' at '}
                        <span className="font-medium">{selectedCell.slot}</span>
                        {': '}
                        <span className="font-bold text-gray-900">{selectedCell.value} cakes</span>
                    </div>
                )}
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Products Tracked</p>
                    <p className="text-lg font-semibold text-gray-900">{heatmapData.matrix.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Time Slots</p>
                    <p className="text-lg font-semibold text-gray-900">{heatmapData.timeSlots.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Peak Production</p>
                    <p className="text-lg font-semibold text-gray-900">{maxValue} cakes</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Total Cells</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {heatmapData.matrix.length * heatmapData.timeSlots.length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TimeSlotHeatmap;