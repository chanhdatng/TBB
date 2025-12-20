import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for checking user permissions and roles
 */
export const usePermissions = () => {
  const { user, hasPermission, hasRole, hasAnyRole, hasMinimumRole } = useAuth();

  // Permission checking helpers
  const canCreateUsers = () => hasPermission('user:create');
  const canUpdateUsers = () => hasPermission('user:update');
  const canDeleteUsers = () => hasPermission('user:delete');
  const canReadUsers = () => hasPermission('user:read');
  const canAccessSystemSettings = () => hasPermission('system:settings');
  const canViewAnalytics = () => hasPermission('analytics:view');
  const canViewReports = () => hasPermission('reports:view');

  // Manager permissions
  const canManageInventory = () => hasPermission('inventory:manage');
  const canManageOrders = () => hasPermission('orders:manage');
  const canManageCustomers = () => hasPermission('customers:manage');
  const canManageProducts = () => hasPermission('products:manage');
  const canManageStaff = () => hasPermission('staff:manage');

  // Staff permissions
  const canCreateOrders = () => hasPermission('orders:create');
  const canUpdateOrders = () => hasPermission('orders:update');
  const canViewOrders = () => hasPermission('orders:view');
  const canViewProducts = () => hasPermission('products:view');
  const canViewCustomers = () => hasPermission('customers:view');
  const canManageDelivery = () => hasPermission('delivery:manage');

  // Role checking helpers
  const isAdmin = () => hasRole('admin');
  const isManager = () => hasRole('manager');
  const isBaker = () => hasRole('baker');
  const isSales = () => hasRole('sales');
  const isDelivery = () => hasRole('delivery');
  const isStaff = () => hasRole('staff');

  // Composite role checks
  const isManagement = () => hasAnyRole(['admin', 'manager']);
  const isProduction = () => hasAnyRole(['admin', 'manager', 'baker']);
  const isOperations = () => hasAnyRole(['admin', 'manager', 'sales', 'delivery']);

  return {
    // User info
    user,
    role: user?.role,

    // Raw permission checkers
    hasPermission,
    hasRole,
    hasAnyRole,
    hasMinimumRole,

    // Specific permission helpers
    canCreateUsers,
    canUpdateUsers,
    canDeleteUsers,
    canReadUsers,
    canAccessSystemSettings,
    canViewAnalytics,
    canViewReports,
    canManageInventory,
    canManageOrders,
    canManageCustomers,
    canManageProducts,
    canManageStaff,
    canCreateOrders,
    canUpdateOrders,
    canViewOrders,
    canViewProducts,
    canViewCustomers,
    canManageDelivery,

    // Role helpers
    isAdmin,
    isManager,
    isBaker,
    isSales,
    isDelivery,
    isStaff,

    // Composite role checks
    isManagement,
    isProduction,
    isOperations
  };
};

export default usePermissions;