import React from 'react';
import { TrendingUp, Clock, Calendar, Package } from 'lucide-react';
import GrowthIndicator from './GrowthIndicator';

const ProductionOverviewCards = ({
    productionMetrics,
    previousMetrics,
    growthRates,
    loading = false
}) => {
    const cards = [
        {
            title: 'Today\'s Production',
            value: productionMetrics?.summary?.today || 0,
            icon: Clock,
            color: 'blue',
            growth: growthRates?.today || 0,
            description: 'Cakes produced today'
        },
        {
            title: 'Weekly Production',
            value: productionMetrics?.summary?.thisWeek || 0,
            icon: Calendar,
            color: 'green',
            growth: growthRates?.thisWeek || 0,
            description: 'Cakes produced this week'
        },
        {
            title: 'Monthly Production',
            value: productionMetrics?.summary?.thisMonth || 0,
            icon: Package,
            color: 'purple',
            growth: growthRates?.thisMonth || 0,
            description: 'Cakes produced this month'
        },
        {
            title: 'Daily Average',
            value: productionMetrics?.summary?.averagePerDay || 0,
            icon: TrendingUp,
            color: 'orange',
            growth: growthRates?.totalProduction || 0,
            description: 'Average cakes per day'
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: {
                bg: 'bg-blue-50',
                iconBg: 'bg-blue-100',
                icon: 'text-blue-600',
                title: 'text-blue-900',
                value: 'text-blue-700'
            },
            green: {
                bg: 'bg-emerald-50',
                iconBg: 'bg-emerald-100',
                icon: 'text-emerald-600',
                title: 'text-emerald-900',
                value: 'text-emerald-700'
            },
            purple: {
                bg: 'bg-violet-50',
                iconBg: 'bg-violet-100',
                icon: 'text-violet-600',
                title: 'text-violet-900',
                value: 'text-violet-700'
            },
            orange: {
                bg: 'bg-amber-50',
                iconBg: 'bg-amber-100',
                icon: 'text-amber-600',
                title: 'text-amber-900',
                value: 'text-amber-700'
            }
        };
        return colors[color] || colors.blue;
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            </div>
                            <div className="w-32 h-8 bg-gray-200 rounded mb-2"></div>
                            <div className="w-20 h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, index) => {
                    const colors = getColorClasses(card.color);
                    const Icon = card.icon;

                    return (
                        <div
                            key={index}
                            className={`${colors.bg} p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className={`text-sm font-medium ${colors.title}`}>
                                        {card.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {card.description}
                                    </p>
                                </div>
                                <div className={`p-3 ${colors.iconBg} rounded-lg`}>
                                    <Icon size={20} className={colors.icon} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className={`text-2xl font-bold ${colors.value}`}>
                                    {card.value.toLocaleString()}
                                </div>
                                <GrowthIndicator
                                    value={card.growth}
                                    size="sm"
                                    className="w-fit"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Production Stats */}
            {productionMetrics && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Top Time Slot */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Peak Production Time</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                                {Object.entries(productionMetrics.timeSlotDistribution || {})
                                    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                            </span>
                            <span className="text-sm text-gray-500">
                                {Object.entries(productionMetrics.timeSlotDistribution || {})
                                    .sort(([,a], [,b]) => b - a)[0]?.[1] || 0} cakes
                            </span>
                        </div>
                    </div>

                    {/* Total Products */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Unique Products</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                                {Object.keys(productionMetrics.productProduction || {}).length}
                            </span>
                            <span className="text-sm text-gray-500">different cake types</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionOverviewCards;