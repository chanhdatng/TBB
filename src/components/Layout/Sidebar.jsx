import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, BarChart3, Settings, LogOut, X, Package, ClipboardList } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: ShoppingBag, label: 'Orders', path: '/orders', badge: '20' },
        { icon: ClipboardList, label: 'Pre-Orders', path: '/pre-orders', badge: '4' },
        { icon: Package, label: 'Products', path: '/products' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: Settings, label: 'Settings', path: '/settings' },
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
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">B</span>
                            </div>
                            <span className="text-xl font-bold text-gray-800">BakeryAdmin</span>
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
                            <NavLink
                                to="/settings"
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
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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
