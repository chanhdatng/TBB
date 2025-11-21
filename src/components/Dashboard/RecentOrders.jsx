import React from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

const RecentOrders = ({ orders = [] }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-100">
                            <th className="pb-4 pl-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Activity</th>
                            <th className="pb-4 pl-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Activity</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Price</th>
                            <th className="pb-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="pb-4"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {orders.slice(0, 5).map((order, index) => (
                            <tr key={index} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-4 text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{order.customer.name}</span>
                                        <span className="text-xs text-gray-400 truncate max-w-[150px]" title={order.customer.address}>
                                            {order.customer.address}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 font-medium text-gray-900">
                                    {order.items.length > 1
                                        ? `${order.items[0].name} +${order.items.length - 1} more`
                                        : order.items[0]?.name || 'Unknown Item'}
                                </td>
                                <td className="py-4 text-gray-500">
                                    <div className="flex flex-col">
                                        <span>{order.timeline.received.date}</span>
                                        <span className="text-xs text-gray-400">{order.timeline.received.time}</span>
                                    </div>
                                </td>
                                <td className="py-4 font-medium text-gray-900">{order.price}</td>
                                <td className="py-4">
                                    <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}
                  `}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${order.status === 'Completed' ? 'bg-green-600' :
                                            order.status === 'Pending' ? 'bg-yellow-600' :
                                                'bg-red-600'
                                            }`}></span>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-4 pr-4 text-right">
                                    <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentOrders;
