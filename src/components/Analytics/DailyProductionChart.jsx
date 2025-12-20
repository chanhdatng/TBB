import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';

const DailyProductionChart = ({
    data,
    height = 300,
    loading = false
}) => {
    const formatXAxisLabel = (value) => {
        try {
            return format(parseISO(value), 'MMM dd');
        } catch {
            return value;
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900 mb-2">
                        {format(parseISO(label), 'MMMM d, yyyy')}
                    </p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-gray-600">{entry.name}:</span>
                            <span className="font-medium text-gray-900">
                                {entry.value} cakes
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-[300px] bg-gray-100 rounded-lg"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <p className="text-lg font-medium mb-2">No production data</p>
                    <p className="text-sm">Production charts will appear once orders are available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatXAxisLabel}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Number of Cakes', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="production"
                        fill="#3b82f6"
                        name="Production"
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar
                        dataKey="sold"
                        fill="#10b981"
                        name="Sold"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DailyProductionChart;