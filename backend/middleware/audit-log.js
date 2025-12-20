const { rtdb } = require('./firebase-auth');
const admin = require('firebase-admin');
const crypto = require('crypto');

/**
 * Audit logging middleware for sensitive operations
 * Logs to Firebase Realtime Database auditLogs node
 */
const auditLog = (action, resource) => {
    return async (req, res, next) => {
        // Store original response methods
        const originalSend = res.send;
        const originalJson = res.json;

        let responseData = null;

        // Override response methods to capture response data
        res.send = function(data) {
            responseData = data;
            originalSend.call(this, data);
        };

        res.json = function(data) {
            responseData = data;
            originalJson.call(this, data);
        };

        // Continue with the request
        res.on('finish', async () => {
            try {
                // Only log successful operations
                if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                    const logEntry = {
                        timestamp: admin.database.ServerValue.TIMESTAMP,
                        userId: req.user.uid,
                        userEmail: req.user.email,
                        userRole: req.user.role,
                        action: action,
                        resource: resource,
                        resourceId: req.params.id || req.params.employeeId || req.body.id,
                        method: req.method,
                        endpoint: req.path,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('User-Agent'),
                        requestData: sanitizeRequestData(req, action),
                        responseStatus: res.statusCode,
                        success: true
                    };

                    // Add specific details based on action
                    switch (action) {
                        case 'CREATE_EMPLOYEE':
                        case 'UPDATE_EMPLOYEE':
                        case 'DELETE_EMPLOYEE':
                            logEntry.employeeData = extractEmployeeData(req.body);
                            break;
                        case 'LOGIN':
                            logEntry.loginMethod = 'firebase';
                            break;
                        case 'ROLE_CHANGE':
                            logEntry.oldRole = req.body.oldRole;
                            logEntry.newRole = req.body.newRole;
                            break;
                        case 'PERMISSION_CHANGE':
                            logEntry.oldPermissions = req.body.oldPermissions;
                            logEntry.newPermissions = req.body.newPermissions;
                            break;
                    }

                    // Write to audit log
                    const auditLogsRef = rtdb.ref('auditLogs').push();
                    await auditLogsRef.set(logEntry);

                    // Also write to security logs for critical operations
                    if (['DELETE_EMPLOYEE', 'ROLE_CHANGE', 'PERMISSION_CHANGE', 'BULK_DELETE'].includes(action)) {
                        const securityLogsRef = rtdb.ref('securityLogs').push();
                        await securityLogsRef.set({
                            ...logEntry,
                            severity: 'HIGH',
                            type: 'SECURITY_CRITICAL'
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to write audit log:', error);
                // Don't fail the request if audit logging fails
            }
        });

        next();
    };
};

/**
 * Sanitize request data to remove sensitive information
 */
const sanitizeRequestData = (req, action) => {
    const sanitized = {
        method: req.method,
        path: req.path,
        params: req.params
    };

    // Include relevant body data based on action
    switch (action) {
        case 'CREATE_EMPLOYEE':
        case 'UPDATE_EMPLOYEE':
            sanitized.body = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                role: req.body.role,
                departmentId: req.body.departmentId,
                status: req.body.status
            };
            break;
        case 'LOGIN':
            sanitized.body = {
                username: req.body.username
            };
            break;
        default:
            sanitized.body = '[REDACTED]';
    }

    return sanitized;
};

/**
 * Extract relevant employee data for audit
 */
const extractEmployeeData = (data) => {
    if (!data) return null;

    return {
        employeeId: data.id || data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        departmentId: data.departmentId,
        status: data.status,
        changes: data.changes || null
    };
};

/**
 * Log failed attempts
 */
const logFailure = async (req, error, action) => {
    try {
        const logEntry = {
            timestamp: admin.database.ServerValue.TIMESTAMP,
            userId: req.user ? req.user.uid : 'anonymous',
            userEmail: req.user ? req.user.email : null,
            userRole: req.user ? req.user.role : null,
            action: action || 'UNKNOWN',
            resource: 'UNKNOWN',
            method: req.method,
            endpoint: req.path,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            error: error.message,
            errorCode: error.code,
            errorStack: error.stack,
            requestData: sanitizeRequestData(req, 'FAILED_ATTEMPT'),
            responseStatus: res?.statusCode || 500,
            success: false,
            type: 'SECURITY_FAILURE'
        };

        // Write to security logs
        const securityLogsRef = rtdb.ref('securityLogs').push();
        await securityLogsRef.set(logEntry);

        // Write high-priority alerts for suspicious activities
        if (isSuspiciousActivity(error, req)) {
            const securityAlertsRef = rtdb.ref('securityAlerts').push();
            await securityAlertsRef.set({
                ...logEntry,
                severity: 'CRITICAL',
                alertType: detectAlertType(error, req),
                requiresAttention: true,
                createdAt: admin.database.ServerValue.TIMESTAMP
            });
        }
    } catch (auditError) {
        console.error('Failed to log failure:', auditError);
    }
};

/**
 * Check if activity is suspicious
 */
const isSuspiciousActivity = (error, req) => {
    const suspiciousPatterns = [
        'TOKEN_EXPIRED',
        'INVALID_TOKEN',
        'AUTH_REQUIRED',
        'INSUFFICIENT_ROLE',
        'DEPARTMENT_ACCESS_DENIED'
    ];

    return suspiciousPatterns.includes(error.code) ||
           error.message.includes('unauthorized') ||
           req.path.includes('/admin') && (!req.user || req.user.role !== 'admin');
};

/**
 * Detect alert type based on error and request
 */
const detectAlertType = (error, req) => {
    if (req.path.includes('/admin') && (!req.user || req.user.role !== 'admin')) {
        return 'UNAUTHORIZED_ADMIN_ACCESS';
    }

    if (error.code === 'INVALID_TOKEN') {
        return 'INVALID_AUTH_TOKEN';
    }

    if (error.code === 'INSUFFICIENT_ROLE') {
        return 'PRIVILEGE_ESCALATION_ATTEMPT';
    }

    if (error.code === 'DEPARTMENT_ACCESS_DENIED') {
        return 'CROSS_DEPARTMENT_ACCESS_ATTEMPT';
    }

    return 'SECURITY_VIOLATION';
};

/**
 * Middleware to check for brute force attempts
 */
const detectBruteForce = () => {
    const attempts = new Map();

    return async (req, res, next) => {
        const key = req.ip + ':' + (req.body.username || req.body.email || 'unknown');
        const now = Date.now();

        if (!attempts.has(key)) {
            attempts.set(key, []);
        }

        const userAttempts = attempts.get(key);

        // Clean old attempts (older than 15 minutes)
        const recentAttempts = userAttempts.filter(time => now - time < 15 * 60 * 1000);
        attempts.set(key, recentAttempts);

        // Add current attempt
        recentAttempts.push(now);

        // Check if threshold exceeded
        if (recentAttempts.length > 5) {
            await logFailure(req, {
                message: 'Too many attempts detected',
                code: 'BRUTE_FORCE_DETECTED'
            }, 'BRUTE_FORCE');

            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        next();
    };
};

module.exports = {
    auditLog,
    logFailure,
    detectBruteForce
};