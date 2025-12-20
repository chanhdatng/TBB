import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, BarChart3, Settings, LogOut, X, Package, ClipboardList, Database, UserCheck } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { orders } = useData();
    const { logout, hasMinimumRole, user } = useAuth();
    const isStaff = user?.role === 'staff';

    // Calculate pending orders for today
    const pendingOrdersCount = orders.filter(order => {
        if (order.status !== 'Pending' || !order.timeline?.received?.raw) return false;
        const orderDate = new Date(order.timeline.received.raw);
        const today = new Date();
        return orderDate.getDate() === today.getDate() &&
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear() === today.getFullYear();
    }).length;

    const menuItems = [
        ...(!isStaff ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/admin' }] : []),
        { icon: ShoppingBag, label: 'Orders', path: '/admin/orders', badge: pendingOrdersCount > 0 ? pendingOrdersCount.toString() : null },
        ...(!isStaff ? [
            { icon: ClipboardList, label: 'Pre-Orders', path: '/admin/pre-orders', badge: '4' },
            { icon: Package, label: 'Products', path: '/admin/products' },
            { icon: Users, label: 'Customers', path: '/admin/customers' },
            ...(hasMinimumRole('manager') ? [
                { icon: UserCheck, label: 'Employees', path: '/admin/employees' }
            ] : []),
            { icon: Database, label: 'Data Sync', path: '/admin/data-sync' },
            { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
            // Settings removed from this list if it was here, but in original it was at line 32. 
            // Wait, I should verify what I replace. 
            // Original line 32: { icon: Settings, label: 'Settings', path: '/admin/settings' },
            // I will exclude it here if isStaff.
            { icon: Settings, label: 'Settings', path: '/admin/settings' },
        ] : []),
    ];


    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-none'}
      `}>
                <div className="h-full flex flex-col w-64">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">T</span>
                            </div>
                            <span className="text-xl font-bold text-gray-800">TheButterBake</span>
                        </div>
                        <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        <div className="mb-6">
                            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Main Menu</p>
                            {menuItems.map((item, index) => (
                                <NavLink
                                    key={index}
                                    to={item.path}
                                    end={item.path === '/admin'}
                                    className={({ isActive }) => `
                    flex items-center justify-between px-4 py-3 rounded-xl transition-colors
                    ${isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <item.icon size={20} />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span className={`
                          text-xs font-bold px-2 py-0.5 rounded-full
                          ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}
                        `}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        <div>
                            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">General</p>
                            {!isStaff && (
                                <NavLink
                                    to="/admin/settings"
                                    className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                  ${isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                                >
                                    <Settings size={20} />
                                    <span className="font-medium">Settings</span>
                                </NavLink>
                            )}
                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                <LogOut size={20} />
                                <span className="font-medium">Log out</span>
                            </button>
                        </div>
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <img
                                src="https://ui-avatars.com/api/?name=Admin+User&background=0F5132&color=fff"
                                alt="User"
                                className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">Admin User</p>
                                <p className="text-xs text-gray-500 truncate">admin@bakery.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
