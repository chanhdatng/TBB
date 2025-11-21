import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, TrendingUp } from 'lucide-react';

const StatsCard = ({ title, value, subValue, trend, trendValue, icon: Icon, color }) => {
    const isPositive = trend === 'up';

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
                {subValue && <p className="text-sm text-gray-500 mb-1">{subValue}</p>}
                <div className="flex items-center gap-2">
                    {trend !== 'neutral' && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            <TrendingUp size={12} className={`mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
                            {trendValue}
                        </span>
                    )}
                    {trend === 'neutral' && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {trendValue}
                        </span>
                    )}
                    {trend !== 'neutral' && <span className="text-xs text-gray-400">vs last period</span>}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
