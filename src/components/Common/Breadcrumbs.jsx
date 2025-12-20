import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ items }) => {
  const location = useLocation();

  // If items not provided, generate from pathname
  if (!items) {
    const pathnames = location.pathname.split('/').filter(x => x);

    const breadcrumbMap = {
      admin: 'Dashboard',
      orders: 'Orders',
      'pre-orders': 'Pre-Orders',
      products: 'Products',
      customers: 'Customers',
      employees: 'Employees',
      'data-sync': 'Data Sync',
      analytics: 'Analytics',
      'product-analytics': 'Product Analytics',
      settings: 'Settings'
    };

    items = [
      { label: 'Dashboard', href: '/admin' },
      ...pathnames.slice(1).map((path, index) => ({
        label: breadcrumbMap[path] || path,
        href: '/' + pathnames.slice(0, index + 2).join('/')
      }))
    ];
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link to="/admin" className="hover:text-primary transition-colors">
        Home
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link
              to={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;