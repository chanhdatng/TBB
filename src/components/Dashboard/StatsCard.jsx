import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, TrendingUp } from 'lucide-react';
import { hoverScaleVariants } from '../../utils/animations';
import { useHoverScale, useReducedMotion } from '../../hooks/useAnimations';

const StatsCard = memo(({ title, value, subValue, trend, trendValue, icon: Icon, color, gradient }) => {
    const isPositive = trend === 'up';
    const hoverProps = useHoverScale(1.02);
    const reducedMotion = useReducedMotion();

    return (
        <motion.div
            className={`bg-white p-4 lg:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow ${gradient ? 'bg-gradient-to-br ' + gradient : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={reducedMotion ? {} : { y: -6, scale: 1.02, transition: { duration: 0.2 } }}
        >
            <div className="flex items-start justify-between mb-4">
                <motion.div
                    className={`p-2 lg:p-3 rounded-xl ${color} shadow-lg`}
                    whileHover={reducedMotion ? {} : { rotate: [0, -10, 10, 0], scale: 1.1, transition: { duration: 0.4 } }}
                >
                    <Icon size={20} className="text-white lg:w-[22px] lg:h-[22px]" />
                </motion.div>
                <motion.button
                    className="text-gray-400 hover:text-gray-600 p-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <MoreHorizontal size={20} />
                </motion.button>
            </div>

            <div>
                <p className={`text-xs lg:text-sm font-semibold mb-1 lg:mb-2 ${gradient ? 'text-gray-600' : 'text-gray-500'}`}>{title}</p>
                <motion.h3
                    className={`text-xl lg:text-3xl font-bold mb-1 lg:mb-2 ${gradient ? 'text-gray-800' : 'text-gray-900'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                >
                    {value}
                </motion.h3>
                {subValue && (
                    <motion.p
                        className="text-sm text-gray-500 mb-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                    >
                        {subValue}
                    </motion.p>
                )}
                <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                >
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
                </motion.div>
            </div>
        </motion.div>
    );
});

export default StatsCard;
