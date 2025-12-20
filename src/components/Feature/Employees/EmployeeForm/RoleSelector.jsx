import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Briefcase, Shield, Eye, Settings, Users, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';

// Available positions/roles in the bakery
const POSITIONS = [
    {
        id: 'baker',
        title: 'Baker',
        department: 'production',
        level: 'staff',
        description: 'Responsible for baking bread, cakes, and pastries'
    },
    {
        id: 'pastry_chef',
        title: 'Pastry Chef',
        department: 'production',
        level: 'staff',
        description: 'Specializes in creating pastries, desserts, and decorative items'
    },
    {
        id: 'cake_decorator',
        title: 'Cake Decorator',
        department: 'production',
        level: 'staff',
        description: 'Focuses on cake decoration and custom cake designs'
    },
    {
        id: 'shift_supervisor',
        title: 'Shift Supervisor',
        department: 'operations',
        level: 'supervisor',
        description: 'Oversees daily operations and staff during assigned shifts'
    },
    {
        id: 'assistant_manager',
        title: 'Assistant Manager',
        department: 'management',
        level: 'management',
        description: 'Assists in managing store operations and staff'
    },
    {
        id: 'store_manager',
        title: 'Store Manager',
        department: 'management',
        level: 'management',
        description: 'Manages all aspects of store operations'
    },
    {
        id: 'cashier',
        title: 'Cashier',
        department: 'sales',
        level: 'staff',
        description: 'Handles customer transactions and orders'
    },
    {
        id: 'sales_associate',
        title: 'Sales Associate',
        department: 'sales',
        level: 'staff',
        description: 'Assists customers and manages product displays'
    },
    {
        id: 'delivery_driver',
        title: 'Delivery Driver',
        department: 'logistics',
        level: 'staff',
        description: 'Delivers orders to customers'
    },
    {
        id: 'cleaning_staff',
        title: 'Cleaning Staff',
        department: 'operations',
        level: 'staff',
        description: 'Maintains cleanliness and hygiene of the bakery'
    }
];

// Role-based permissions
const ROLE_PERMISSIONS = {
    staff: {
        label: 'Staff Permissions',
        icon: Users,
        color: 'blue',
        permissions: [
            {
                category: 'Basic Operations',
                items: [
                    { id: 'view_own_schedule', name: 'View own schedule', granted: true },
                    { id: 'clock_in_out', name: 'Clock in/out', granted: true },
                    { id: 'view_own_profile', name: 'View own profile', granted: true },
                    { id: 'request_time_off', name: 'Request time off', granted: true }
                ]
            },
            {
                category: 'Sales & Orders',
                items: [
                    { id: 'create_orders', name: 'Create customer orders', granted: true },
                    { id: 'process_payments', name: 'Process payments', granted: true },
                    { id: 'view_orders', name: 'View orders', granted: true },
                    { id: 'update_order_status', name: 'Update order status', granted: false }
                ]
            },
            {
                category: 'Inventory',
                items: [
                    { id: 'view_inventory', name: 'View inventory levels', granted: true },
                    { id: 'update_stock_count', name: 'Update stock count', granted: false },
                    { id: 'manage_products', name: 'Manage products', granted: false }
                ]
            },
            {
                category: 'Reports',
                items: [
                    { id: 'view_sales_reports', name: 'View sales reports', granted: false },
                    { id: 'export_reports', name: 'Export reports', granted: false }
                ]
            }
        ]
    },
    supervisor: {
        label: 'Supervisor Permissions',
        icon: Shield,
        color: 'green',
        permissions: [
            {
                category: 'Staff Management',
                items: [
                    { id: 'view_team_schedule', name: 'View team schedule', granted: true },
                    { id: 'approve_time_off', name: 'Approve time off requests', granted: true },
                    { id: 'edit_schedule', name: 'Edit team schedule', granted: true },
                    { id: 'view_staff_performance', name: 'View staff performance', granted: true }
                ]
            },
            {
                category: 'Operations',
                items: [
                    { id: 'manage_shifts', name: 'Manage shifts', granted: true },
                    { id: 'override_prices', name: 'Override prices (with limit)', granted: true },
                    { id: 'process_refunds', name: 'Process refunds', granted: true },
                    { id: 'handle_complaints', name: 'Handle customer complaints', granted: true }
                ]
            },
            {
                category: 'Inventory',
                items: [
                    { id: 'view_inventory', name: 'View inventory levels', granted: true },
                    { id: 'update_stock_count', name: 'Update stock count', granted: true },
                    { id: 'place_inventory_orders', name: 'Place inventory orders', granted: false }
                ]
            },
            {
                category: 'Reports',
                items: [
                    { id: 'view_sales_reports', name: 'View sales reports', granted: true },
                    { id: 'view_performance_reports', name: 'View performance reports', granted: true },
                    { id: 'export_reports', name: 'Export reports', granted: true }
                ]
            }
        ]
    },
    management: {
        label: 'Management Permissions',
        icon: Settings,
        color: 'purple',
        permissions: [
            {
                category: 'Full Staff Management',
                items: [
                    { id: 'hire_employees', name: 'Hire employees', granted: true },
                    { id: 'terminate_employees', name: 'Terminate employees', granted: true },
                    { id: 'edit_employee_data', name: 'Edit employee data', granted: true },
                    { id: 'set_salaries', name: 'Set salaries', granted: true },
                    { id: 'manage_permissions', name: 'Manage permissions', granted: false }
                ]
            },
            {
                category: 'Financial Operations',
                items: [
                    { id: 'view_all_financials', name: 'View all financial data', granted: true },
                    { id: 'approve_expenses', name: 'Approve expenses', granted: true },
                    { id: 'manage_payroll', name: 'Manage payroll', granted: true },
                    { id: 'access_bank_info', name: 'Access banking information', granted: false }
                ]
            },
            {
                category: 'System Configuration',
                items: [
                    { id: 'manage_store_settings', name: 'Manage store settings', granted: true },
                    { id: 'configure_system', name: 'Configure system options', granted: false },
                    { id: 'manage_integrations', name: 'Manage third-party integrations', granted: false },
                    { id: 'access_system_logs', name: 'Access system logs', granted: true }
                ]
            },
            {
                category: 'Advanced Reports',
                items: [
                    { id: 'view_all_reports', name: 'View all reports', granted: true },
                    { id: 'create_custom_reports', name: 'Create custom reports', granted: true },
                    { id: 'export_all_data', name: 'Export all data', granted: true },
                    { id: 'view_analytics', name: 'View advanced analytics', granted: true }
                ]
            }
        ]
    }
};

const RoleSelector = ({
    value,
    onChange,
    error,
    disabled = false,
    showPermissions = true,
    className = ""
}) => {
    const [selectedPosition, setSelectedPosition] = useState(value || '');
    const [showPermissionDetails, setShowPermissionDetails] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState(null);

    // Update selected position when value changes
    useEffect(() => {
        if (value !== selectedPosition) {
            setSelectedPosition(value);
            const position = POSITIONS.find(p => p.id === value);
            setSelectedLevel(position?.level || null);
        }
    }, [value, selectedPosition]);

    // Handle position change
    const handlePositionChange = (positionId) => {
        const position = POSITIONS.find(p => p.id === positionId);
        setSelectedPosition(positionId);
        setSelectedLevel(position?.level || null);
        onChange?.({
            position: position?.title || '',
            positionId: positionId,
            department: position?.department || '',
            departmentId: position?.department || '',
            level: position?.level || 'staff'
        });
    };

    // Get current position details
    const currentPosition = POSITIONS.find(p => p.id === selectedPosition);
    const currentPermissions = selectedLevel ? ROLE_PERMISSIONS[selectedLevel] : null;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Position Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position/Role <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                    <select
                        value={selectedPosition}
                        onChange={(e) => handlePositionChange(e.target.value)}
                        disabled={disabled}
                        className={`
                            w-full px-4 py-2 border rounded-lg appearance-none
                            focus:outline-none focus:ring-2 focus:ring-primary/20
                            transition-colors pr-10
                            ${error
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        aria-label="Select position"
                        aria-describedby={error ? 'position-error' : undefined}
                    >
                        <option value="">Select a position...</option>
                        {POSITIONS.map((position) => (
                            <option key={position.id} value={position.id}>
                                {position.title} - {position.department}
                            </option>
                        ))}
                    </select>

                    {/* Dropdown Arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown size={20} className="text-gray-400" />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div id="position-error" className="flex items-center gap-2 mt-2 text-sm text-red-600">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Position Description */}
                {currentPosition && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Briefcase size={18} className="text-gray-500 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-700">{currentPosition.description}</p>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-xs text-gray-500">
                                        Department: <span className="font-medium capitalize">{currentPosition.department}</span>
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Level: <span className="font-medium capitalize">{currentPosition.level}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Permissions Preview */}
            {showPermissions && currentPermissions && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <button
                        type="button"
                        onClick={() => setShowPermissionDetails(!showPermissionDetails)}
                        className="w-full flex items-center justify-between text-left"
                        aria-expanded={showPermissionDetails}
                        aria-controls="permissions-details"
                    >
                        <div className="flex items-center gap-2">
                            <currentPermissions.icon
                                size={20}
                                className={`text-${currentPermissions.color}-600`}
                            />
                            <span className="font-medium text-gray-900">
                                {currentPermissions.label}
                            </span>
                        </div>
                        {showPermissionDetails ? (
                            <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                            <ChevronDown size={20} className="text-gray-400" />
                        )}
                    </button>

                    {showPermissionDetails && (
                        <div id="permissions-details" className="mt-4 space-y-4">
                            {currentPermissions.permissions.map((category, index) => (
                                <div key={index} className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                        {category.category === 'Basic Operations' && <Eye size={16} />}
                                        {category.category === 'Sales & Orders' && <DollarSign size={16} />}
                                        {category.category === 'Staff Management' && <Users size={16} />}
                                        {category.category === 'Financial Operations' && <DollarSign size={16} />}
                                        {category.category === 'System Configuration' && <Settings size={16} />}
                                        {category.category === 'Inventory' && <FileText size={16} />}
                                        {category.category === 'Reports' && <FileText size={16} />}
                                        {category.category === 'Operations' && <Settings size={16} />}
                                        {category.category === 'Full Staff Management' && <Users size={16} />}
                                        {category.category === 'Advanced Reports' && <FileText size={16} />}
                                        {category.category}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {category.items.map((permission, pIndex) => (
                                            <div
                                                key={pIndex}
                                                className={`
                                                    flex items-center gap-2 text-sm p-2 rounded
                                                    ${permission.granted
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                                                    ${permission.granted
                                                        ? 'bg-green-600 border-green-600'
                                                        : 'border-gray-300'
                                                    }
                                                `}>
                                                    {permission.granted && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className={permission.granted ? 'font-medium' : ''}>
                                                    {permission.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RoleSelector;