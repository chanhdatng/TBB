import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

const Header = ({ onMenuClick }) => {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                    <Menu size={24} />
                </button>

                <div className="hidden md:flex items-center text-sm text-gray-500">
                    <span className="hover:text-gray-900 cursor-pointer">BakeryAdmin</span>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 font-medium">Dashboard</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-600 placeholder-gray-400"
                    />
                </div>

                <button className="relative p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            </div>
        </header>
    );
};

export default Header;
