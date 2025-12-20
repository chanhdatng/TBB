import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

const TimeSlotDistribution = ({
    data,
    height = 400,
    loading = false
}) => {
    const colors = [
        '#3b82f6', // blue
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#84cc16', // lime
    ];

    // Transform data for chart and sort by time - include percentage calculation
    const chartData = React.useMemo(() => {
        if (!data) return [];

        const timeOrder = [
            'Early Morning (6-9)',
            'Morning (9-12)',
            'Afternoon (12-15)',
            'Late Afternoon (15-18)',
            'Evening (18-21)',
            'Night (21-6)',
            'Unknown'
        ];

        const transformedData = Object.entries(data)
            .map(([timeSlot, count]) => ({
                timeSlot,
                count,
                percentage: 0 // Will calculate below
            }))
            .sort((a, b) => {
                const aIndex = timeOrder.indexOf(a.timeSlot);
                const bIndex = timeOrder.indexOf(b.timeSlot);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });

        // Calculate percentages without mutation
        const total = transformedData.reduce((sum, item) => sum + item.count, 0);
        return transformedData.map(item => ({
            ...item,
            percentage: total > 0 ? (item.count / total * 100).toFixed(1) : 0
        }));
    }, [data]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 mb-2">{data.timeSlot}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            Cakes: <span className="font-medium text-gray-900">{data.count}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                            Share: <span className="font-medium text-gray-900">{data.percentage}%</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const findPeakTime = () => {
        if (chartData.length === 0) return null;
        return chartData.reduce((max, item) => item.count > max.count ? item : max, chartData[0]);
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-[400px] bg-gray-100 rounded-lg"></div>
            </div>
        );
    }

    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <Clock size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No time slot data</p>
                    <p className="text-sm">Time slot distribution will appear once orders with delivery times are available</p>
                </div>
            </div>
        );
    }

    const peakTime = findPeakTime();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Time Slot Distribution</h3>
                    <p className="text-sm text-gray-500">Production by delivery time slot</p>
                </div>
                {peakTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                        <TrendingUp size={16} className="text-blue-600" />
                        <span>Peak: <strong>{peakTime.timeSlot}</strong> ({peakTime.count} cakes)</span>
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={chartData}
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        type="category"
                        dataKey="timeSlot"
                        tick={{ fontSize: 12 }}
                        width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Total Slots</p>
                    <p className="text-lg font-semibold text-gray-900">{chartData.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Peak Slot</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                        {peakTime ? peakTime.timeSlot : 'N/A'}
                    </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Peak Volume</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {peakTime ? peakTime.count : 0}
                    </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Avg per Slot</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {chartData.length > 0
                            ? Math.round(chartData.reduce((sum, item) => sum + item.count, 0) / chartData.length)
                            : 0}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TimeSlotDistribution;