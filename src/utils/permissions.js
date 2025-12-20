/**
 * Permission constants and utility functions
 */

// Permission constants
export const PERMISSIONS = {
  // Admin permissions
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_READ: 'user:read',
  SYSTEM_SETTINGS: 'system:settings',
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_VIEW: 'reports:view',

  // Manager permissions
  INVENTORY_MANAGE: 'inventory:manage',
  ORDERS_MANAGE: 'orders:manage',
  CUSTOMERS_MANAGE: 'customers:manage',
  PRODUCTS_MANAGE: 'products:manage',
  STAFF_MANAGE: 'staff:manage',

  // Staff permissions
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_VIEW: 'orders:view',
  PRODUCTS_VIEW: 'products:view',
  CUSTOMERS_VIEW: 'customers:view',
  DELIVERY_MANAGE: 'delivery:manage'
};

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  BAKER: 'baker',
  SALES: 'sales',
  DELIVERY: 'delivery',
  STAFF: 'staff'
};

// Role hierarchy levels
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.BAKER]: 2,
  [ROLES.SALES]: 2,
  [ROLES.DELIVERY]: 2,
  [ROLES.STAFF]: 1
};

// Permission mapping to required role level
export const PERMISSION_LEVELS = {
  [PERMISSIONS.USER_READ]: 1,
  [PERMISSIONS.USER_CREATE]: 4,
  [PERMISSIONS.USER_UPDATE]: 4,
  [PERMISSIONS.USER_DELETE]: 4,
  [PERMISSIONS.SYSTEM_SETTINGS]: 4,
  [PERMISSIONS.ANALYTICS_VIEW]: 3,
  [PERMISSIONS.REPORTS_VIEW]: 3,
  [PERMISSIONS.INVENTORY_MANAGE]: 3,
  [PERMISSIONS.ORDERS_MANAGE]: 3,
  [PERMISSIONS.CUSTOMERS_MANAGE]: 3,
  [PERMISSIONS.PRODUCTS_MANAGE]: 3,
  [PERMISSIONS.STAFF_MANAGE]: 3,
  [PERMISSIONS.ORDERS_CREATE]: 2,
  [PERMISSIONS.ORDERS_UPDATE]: 2,
  [PERMISSIONS.ORDERS_VIEW]: 1,
  [PERMISSIONS.PRODUCTS_VIEW]: 1,
  [PERMISSIONS.CUSTOMERS_VIEW]: 1,
  [PERMISSIONS.DELIVERY_MANAGE]: 2
};

// Role groups
export const ROLE_GROUPS = {
  MANAGEMENT: [ROLES.ADMIN, ROLES.MANAGER],
  PRODUCTION: [ROLES.ADMIN, ROLES.MANAGER, ROLES.BAKER],
  OPERATIONS: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.DELIVERY],
  ALL_ROLES: Object.values(ROLES)
};

// Utility functions
export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

export const getRequiredLevel = (permission) => {
  return PERMISSION_LEVELS[permission] || 4;
};

export const hasMinimumRole = (userRole, minimumRole) => {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
};

export const hasPermissionLevel = (userRole, permission) => {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRequiredLevel(permission);
  return userLevel >= requiredLevel;
};

export const isInRoleGroup = (userRole, roleGroup) => {
  return ROLE_GROUPS[roleGroup]?.includes(userRole) || false;
};

export const canAccessRoute = (userRole, routePermissions) => {
  if (!routePermissions || routePermissions.length === 0) {
    return true; // No permissions required
  }

  return routePermissions.every(permission =>
    hasPermissionLevel(userRole, permission)
  );
};

// Route permission mappings
export const ROUTE_PERMISSIONS = {
  '/admin/settings': [PERMISSIONS.SYSTEM_SETTINGS],
  '/admin/users': [PERMISSIONS.USER_READ],
  '/admin/users/create': [PERMISSIONS.USER_CREATE],
  '/admin/analytics': [PERMISSIONS.ANALYTICS_VIEW],
  '/admin/reports': [PERMISSIONS.REPORTS_VIEW],
  '/admin/products/manage': [PERMISSIONS.PRODUCTS_MANAGE],
  '/admin/inventory': [PERMISSIONS.INVENTORY_MANAGE],
  '/admin/customers/manage': [PERMISSIONS.CUSTOMERS_MANAGE],
  '/admin/orders/manage': [PERMISSIONS.ORDERS_MANAGE],
  '/admin/staff/manage': [PERMISSIONS.STAFF_MANAGE],
  '/admin/orders/create': [PERMISSIONS.ORDERS_CREATE],
  '/admin/delivery': [PERMISSIONS.DELIVERY_MANAGE]
};

export default {
  PERMISSIONS,
  ROLES,
  ROLE_HIERARCHY,
  PERMISSION_LEVELS,
  ROLE_GROUPS,
  getRoleLevel,
  getRequiredLevel,
  hasMinimumRole,
  hasPermissionLevel,
  isInRoleGroup,
  canAccessRoute,
  ROUTE_PERMISSIONS
};