import React, { useState } from 'react';
import { Search, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Customers = () => {
    const { customers, orders } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    // Enrich customers with order data
    const enrichedCustomers = customers.map(customer => {
        const customerOrders = orders.filter(order =>
            order.customer.phone === customer.phone
        );

        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.rawPrice || 0), 0);

        // Find last order date
        let lastOrderDate = '-';
        if (customerOrders.length > 0) {
            // Sort by date descending
            const sortedOrders = [...customerOrders].sort((a, b) => {
                const dateA = a.timeline?.received?.raw || new Date(0);
                const dateB = b.timeline?.received?.raw || new Date(0);
                return dateB - dateA;
            });
            lastOrderDate = sortedOrders[0].timeline.received.date;
        }

        return {
            ...customer,
            orders: totalOrders,
            totalSpent: totalSpent,
            lastOrder: lastOrderDate
        };
    });

    const filteredCustomers = enrichedCustomers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 mt-1">View and manage your customer base</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{customer.name || 'Unknown'}</h3>
                                        <p className="text-xs text-gray-500">
                                            Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                {customer.email && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        {customer.email}
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone size={16} className="text-gray-400" />
                                    {customer.phone || 'N/A'}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Orders</p>
                                    <p className="font-bold text-gray-900">{customer.orders}</p>
                                </div>
                                <div className="text-center border-l border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Spent</p>
                                    <p className="font-bold text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent)}
                                    </p>
                                </div>
                                <div className="text-center border-l border-gray-100">
                                    <p className="text-xs text-gray-500 mb-1">Last Order</p>
                                    <p className="font-bold text-gray-900">{customer.lastOrder}</p>
                                </div>
                            </div>

                            <button className="w-full mt-4 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
                                View Profile
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No customers found
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;
