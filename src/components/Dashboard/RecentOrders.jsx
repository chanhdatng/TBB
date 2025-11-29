import React from 'react';
import { Search, Filter, MoreHorizontal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const RecentOrders = ({ orders = [] }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white p-4 lg:p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl">
                        <Activity className="text-blue-600" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <motion.div
                        whileFocus={{ scale: 1.02 }}
                        className="relative w-full sm:w-auto"
                    >
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 w-full sm:w-64 transition-all"
                        />
                    </motion.div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all w-full sm:w-auto"
                    >
                        <Filter size={16} />
                        Filter
                    </motion.button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-100">
                            <th className="pb-4 pl-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Activity</th>
                            <th className="pb-4 pl-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Activity</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Price</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="pb-4"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {orders.slice(0, 5).map((order, index) => (
                            <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all border-b border-gray-50 last:border-0"
                            >
                                <td className="py-4 pl-4 text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{order.customer.name}</span>
                                        <span className="text-xs text-gray-400 truncate max-w-[150px]" title={order.customer.address}>
                                            {order.customer.address}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 font-medium text-gray-800 hidden sm:table-cell">
                                    {order.items.length > 1
                                        ? `${order.items[0].name} +${order.items.length - 1} more`
                                        : order.items[0]?.name || 'Unknown Item'}
                                </td>
                                <td className="py-4 text-gray-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{order.timeline.received.date}</span>
                                        <span className="text-xs text-gray-400">{order.timeline.received.time}</span>
                                    </div>
                                </td>
                                <td className="py-4 font-bold text-gray-900">{order.price}</td>
                                <td className="py-4">
                                    <span className={`
                    inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold shadow-sm
                    ${order.status === 'Completed' ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200' :
                                            order.status === 'Pending' ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200' :
                                                'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'}
                  `}>
                                        <span className={`w-2 h-2 rounded-full mr-2 ${order.status === 'Completed' ? 'bg-green-600 animate-pulse' :
                                            order.status === 'Pending' ? 'bg-yellow-600 animate-pulse' :
                                                'bg-red-600'
                                            }`}></span>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-4 pr-4 text-right">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-gray-100 rounded-lg"
                                    >
                                        <MoreHorizontal size={18} />
                                    </motion.button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default RecentOrders;
