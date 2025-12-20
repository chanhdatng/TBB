import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Eye,
    Settings,
    Users,
    DollarSign,
    Calendar,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Lock,
    Unlock,
    Key,
    Info
} from 'lucide-react';

const PermissionTab = ({ employee }) => {
    const [expandedCategories, setExpandedCategories] = useState(['all']);

    // Role-based permissions mapping
    const ROLE_PERMISSIONS = {
        staff: {
            label: 'Staff Permissions',
            icon: Users,
            color: 'blue',
            level: 1,
            permissions: [
                {
                    category: 'Basic Operations',
                    icon: Eye,
                    items: [
                        { id: 'view_own_schedule', name: 'View own schedule', granted: true, description: 'Can view their own work schedule' },
                        { id: 'clock_in_out', name: 'Clock in/out', granted: true, description: 'Can record time entries' },
                        { id: 'view_own_profile', name: 'View own profile', granted: true, description: 'Can view personal profile information' },
                        { id: 'request_time_off', name: 'Request time off', granted: true, description: 'Can submit time off requests' }
                    ]
                },
                {
                    category: 'Sales & Orders',
                    icon: DollarSign,
                    items: [
                        { id: 'create_orders', name: 'Create customer orders', granted: true, description: 'Can add new customer orders' },
                        { id: 'process_payments', name: 'Process payments', granted: true, description: 'Can handle customer payments' },
                        { id: 'view_orders', name: 'View orders', granted: true, description: 'Can view order information' },
                        { id: 'update_order_status', name: 'Update order status', granted: false, description: 'Cannot change order status' }
                    ]
                },
                {
                    category: 'Inventory',
                    icon: FileText,
                    items: [
                        { id: 'view_inventory', name: 'View inventory levels', granted: true, description: 'Can see inventory counts' },
                        { id: 'update_stock_count', name: 'Update stock count', granted: false, description: 'Cannot modify inventory' },
                        { id: 'manage_products', name: 'Manage products', granted: false, description: 'Cannot add/edit products' }
                    ]
                },
                {
                    category: 'Reports',
                    icon: FileText,
                    items: [
                        { id: 'view_sales_reports', name: 'View sales reports', granted: false, description: 'Cannot access reports' },
                        { id: 'export_reports', name: 'Export reports', granted: false, description: 'Cannot export data' }
                    ]
                }
            ]
        },
        supervisor: {
            label: 'Supervisor Permissions',
            icon: Shield,
            color: 'green',
            level: 2,
            permissions: [
                {
                    category: 'Staff Management',
                    icon: Users,
                    items: [
                        { id: 'view_team_schedule', name: 'View team schedule', granted: true, description: 'Can view entire team schedule' },
                        { id: 'approve_time_off', name: 'Approve time off requests', granted: true, description: 'Can approve/deny time off' },
                        { id: 'edit_schedule', name: 'Edit team schedule', granted: true, description: 'Can modify team schedules' },
                        { id: 'view_staff_performance', name: 'View staff performance', granted: true, description: 'Can access performance metrics' }
                    ]
                },
                {
                    category: 'Operations',
                    icon: Settings,
                    items: [
                        { id: 'manage_shifts', name: 'Manage shifts', granted: true, description: 'Can create and assign shifts' },
                        { id: 'override_prices', name: 'Override prices (with limit)', granted: true, description: 'Can apply discounts up to limit' },
                        { id: 'process_refunds', name: 'Process refunds', granted: true, description: 'Can handle customer refunds' },
                        { id: 'handle_complaints', name: 'Handle customer complaints', granted: true, description: 'Can resolve customer issues' }
                    ]
                },
                {
                    category: 'Inventory',
                    icon: FileText,
                    items: [
                        { id: 'view_inventory', name: 'View inventory levels', granted: true, description: 'Can see inventory counts' },
                        { id: 'update_stock_count', name: 'Update stock count', granted: true, description: 'Can adjust inventory levels' },
                        { id: 'place_inventory_orders', name: 'Place inventory orders', granted: false, description: 'Cannot order supplies' }
                    ]
                },
                {
                    category: 'Reports',
                    icon: FileText,
                    items: [
                        { id: 'view_sales_reports', name: 'View sales reports', granted: true, description: 'Can access sales data' },
                        { id: 'view_performance_reports', name: 'View performance reports', granted: true, description: 'Can view team performance' },
                        { id: 'export_reports', name: 'Export reports', granted: true, description: 'Can export report data' }
                    ]
                }
            ]
        },
        management: {
            label: 'Management Permissions',
            icon: Settings,
            color: 'purple',
            level: 3,
            permissions: [
                {
                    category: 'Full Staff Management',
                    icon: Users,
                    items: [
                        { id: 'hire_employees', name: 'Hire employees', granted: true, description: 'Can recruit and hire new staff' },
                        { id: 'terminate_employees', name: 'Terminate employees', granted: true, description: 'Can handle terminations' },
                        { id: 'edit_employee_data', name: 'Edit employee data', granted: true, description: 'Can modify employee information' },
                        { id: 'set_salaries', name: 'Set salaries', granted: true, description: 'Can determine compensation' },
                        { id: 'manage_permissions', name: 'Manage permissions', granted: false, description: 'Cannot alter system permissions' }
                    ]
                },
                {
                    category: 'Financial Operations',
                    icon: DollarSign,
                    items: [
                        { id: 'view_all_financials', name: 'View all financial data', granted: true, description: 'Full access to financial reports' },
                        { id: 'approve_expenses', name: 'Approve expenses', granted: true, description: 'Can approve expense claims' },
                        { id: 'manage_payroll', name: 'Manage payroll', granted: true, description: 'Can process payroll' },
                        { id: 'access_bank_info', name: 'Access banking information', granted: false, description: 'Cannot access bank details' }
                    ]
                },
                {
                    category: 'System Configuration',
                    icon: Settings,
                    items: [
                        { id: 'manage_store_settings', name: 'Manage store settings', granted: true, description: 'Can configure store options' },
                        { id: 'configure_system', name: 'Configure system options', granted: false, description: 'Cannot modify system core' },
                        { id: 'manage_integrations', name: 'Manage third-party integrations', granted: false, description: 'Cannot manage integrations' },
                        { id: 'access_system_logs', name: 'Access system logs', granted: true, description: 'Can view system activity' }
                    ]
                },
                {
                    category: 'Advanced Reports',
                    icon: FileText,
                    items: [
                        { id: 'view_all_reports', name: 'View all reports', granted: true, description: 'Access to all reports' },
                        { id: 'create_custom_reports', name: 'Create custom reports', granted: true, description: 'Can build custom reports' },
                        { id: 'export_all_data', name: 'Export all data', granted: true, description: 'Can export any data' },
                        { id: 'view_analytics', name: 'View advanced analytics', granted: true, description: 'Access to analytics dashboard' }
                    ]
                }
            ]
        }
    };

    // Get current role permissions
    const currentRolePermissions = ROLE_PERMISSIONS[employee.level] || ROLE_PERMISSIONS.staff;

    // Toggle category expansion
    const toggleCategory = (category) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Expand/Collapse all categories
    const toggleAllCategories = () => {
        if (expandedCategories.includes('all')) {
            setExpandedCategories([]);
        } else {
            setExpandedCategories(['all', ...currentRolePermissions.permissions.map(p => p.category)]);
        }
    };

    // Count permissions
    const grantedCount = currentRolePermissions.permissions.reduce(
        (total, category) => total + category.items.filter(item => item.granted).length,
        0
    );
    const totalCount = currentRolePermissions.permissions.reduce(
        (total, category) => total + category.items.length,
        0
    );

    return (
        <div className="p-6 space-y-6">
            {/* Role Overview */}
            <div className="bg-gradient-to-br from-purple-5 to-purple-light/5 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg bg-${currentRolePermissions.color}-100`}>
                            <currentRolePermissions.icon
                                size={24}
                                className={`text-${currentRolePermissions.color}-600`}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {currentRolePermissions.label}
                            </h3>
                            <p className="text-sm text-gray-600">
                                Access Level {currentRolePermissions.level} of 3
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                            {grantedCount}/{totalCount}
                        </p>
                        <p className="text-sm text-gray-600">Permissions Granted</p>
                    </div>
                </div>

                {/* Permission Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Permission Coverage</span>
                        <span className="font-medium text-gray-900">
                            {Math.round((grantedCount / totalCount) * 100)}%
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r from-${currentRolePermissions.color}-400 to-${currentRolePermissions.color}-600 transition-all duration-500`}
                            style={{ width: `${(grantedCount / totalCount) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Role Description */}
                <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-700">
                        {employee.level === 'staff' && 'Basic access for daily operations. Can manage own tasks and view essential information.'}
                        {employee.level === 'supervisor' && 'Enhanced access for team oversight. Can manage schedules, approve requests, and handle operations.'}
                        {employee.level === 'management' && 'Full access for business management. Can oversee all aspects of operations and make strategic decisions.'}
                    </p>
                </div>
            </div>

            {/* Permission Controls */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Permissions</h3>
                <button
                    onClick={toggleAllCategories}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                    {expandedCategories.includes('all') ? (
                        <>
                            <ChevronUp size={18} />
                            Collapse All
                        </>
                    ) : (
                        <>
                            <ChevronDown size={18} />
                            Expand All
                        </>
                    )}
                </button>
            </div>

            {/* Permission Categories */}
            <div className="space-y-4">
                {currentRolePermissions.permissions.map((category, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.category)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-${
                                    category.category === 'Basic Operations' ? 'blue' :
                                    category.category === 'Staff Management' ? 'green' :
                                    category.category === 'Financial Operations' ? 'yellow' :
                                    category.category === 'System Configuration' ? 'purple' :
                                    'gray'
                                }-100`}>
                                    <category.icon
                                        size={18}
                                        className={`text-${
                                            category.category === 'Basic Operations' ? 'blue' :
                                            category.category === 'Staff Management' ? 'green' :
                                            category.category === 'Financial Operations' ? 'yellow' :
                                            category.category === 'System Configuration' ? 'purple' :
                                            'gray'
                                        }-600`}
                                    />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-semibold text-gray-900">{category.category}</h4>
                                    <p className="text-sm text-gray-500">
                                        {category.items.filter(item => item.granted).length} of {category.items.length} granted
                                    </p>
                                </div>
                            </div>
                            {expandedCategories.includes(category.category) || expandedCategories.includes('all') ? (
                                <ChevronUp size={20} className="text-gray-400" />
                            ) : (
                                <ChevronDown size={20} className="text-gray-400" />
                            )}
                        </button>

                        {/* Permission Items */}
                        <AnimatePresence>
                            {(expandedCategories.includes(category.category) || expandedCategories.includes('all')) && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-6 pb-4 space-y-3">
                                        {category.items.map((permission, pIndex) => (
                                            <div
                                                key={pIndex}
                                                className={`p-3 rounded-lg border ${
                                                    permission.granted
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        {permission.granted ? (
                                                            <CheckCircle size={18} className="text-green-600" />
                                                        ) : (
                                                            <XCircle size={18} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`font-medium ${
                                                                permission.granted ? 'text-green-900' : 'text-gray-700'
                                                            }`}>
                                                                {permission.name}
                                                            </p>
                                                            {permission.granted ? (
                                                                <Unlock size={16} className="text-green-600" />
                                                            ) : (
                                                                <Lock size={16} className="text-gray-400" />
                                                            )}
                                                        </div>
                                                        <p className={`text-sm mt-1 ${
                                                            permission.granted ? 'text-green-700' : 'text-gray-500'
                                                        }`}>
                                                            {permission.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Security Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <Info className="text-amber-600 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Security Information</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                            <li>• Permissions are role-based and automatically assigned</li>
                            <li>• Some permissions require additional approvals or multi-factor authentication</li>
                            <li>• All access is logged and monitored for security purposes</li>
                            <li>• Contact administration for permission change requests</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionTab;