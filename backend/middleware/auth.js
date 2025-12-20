const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches user info to req.user if valid
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Invalid token: ' + err.message,
        code: 'INVALID_TOKEN'
      });
    }
    req.user = user;
    next();
  });
};

/**
 * Role hierarchy levels
 */
const ROLE_LEVELS = {
  'admin': 4,
  'manager': 3,
  'baker': 2,
  'sales': 2,
  'delivery': 2,
  'staff': 1
};

/**
 * Admin Role Check Middleware
 * Must be used after authenticateToken
 * Verifies user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

/**
 * Minimum Role Check Middleware
 * Must be used after authenticateToken
 * Verifies user has minimum role level
 */
const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not found',
        code: 'NO_ROLE'
      });
    }

    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const requiredLevel = ROLE_LEVELS[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Minimum role '${minimumRole}' required`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Specific Role Check Middleware
 * Must be used after authenticateToken
 * Verifies user has one of the specified roles
 */
const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not found',
        code: 'NO_ROLE'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `One of the following roles required: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Permission Check Middleware
 * Must be used after authenticateToken
 * Verifies user has specific permission based on role
 */
const requirePermission = (permission) => {
  // Permission mapping to required role levels
  const PERMISSION_LEVELS = {
    'user:read': 1,
    'user:create': 4,
    'user:update': 4,
    'user:delete': 4,
    'system:settings': 4,
    'analytics:view': 3,
    'reports:view': 3,
    'inventory:manage': 3,
    'orders:manage': 3,
    'customers:manage': 3,
    'products:manage': 3,
    'staff:manage': 3,
    'orders:create': 2,
    'orders:update': 2,
    'orders:view': 1,
    'products:view': 1,
    'customers:view': 1,
    'delivery:manage': 2
  };

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not found',
        code: 'NO_ROLE'
      });
    }

    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const requiredLevel = PERMISSION_LEVELS[permission] || 4;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions for '${permission}'`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireMinimumRole,
  requireAnyRole,
  requirePermission,
  ROLE_LEVELS
};
