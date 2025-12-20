import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const GrowthIndicator = ({
    value,
    showIcon = true,
    className = "",
    size = 'md',
    format = 'percentage'
}) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    const isNegative = value < 0;

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 16
    };

    const getColorClass = () => {
        if (isNeutral) return 'text-gray-500';
        if (isPositive) return 'text-emerald-600';
        return 'text-red-600';
    };

    const getBgClass = () => {
        if (isNeutral) return 'bg-gray-50';
        if (isPositive) return 'bg-emerald-50';
        return 'bg-red-50';
    };

    const formatValue = (val) => {
        if (format === 'percentage') {
            return `${Math.abs(val).toFixed(1)}%`;
        }
        return Math.abs(val).toString();
    };

    const getIcon = () => {
        if (isNeutral || !showIcon) return null;
        return isPositive ?
            <ArrowUp size={iconSizes[size]} className="mr-1" /> :
            <ArrowDown size={iconSizes[size]} className="mr-1" />;
    };

    return (
        <div className={`inline-flex items-center px-2 py-1 rounded-full ${getBgClass()} ${getColorClass()} ${sizeClasses[size]} ${className}`}>
            {getIcon()}
            <span className="font-medium">
                {formatValue(value)}
            </span>
        </div>
    );
};

export default GrowthIndicator;