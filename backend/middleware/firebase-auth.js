const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Firebase service instances (initialized lazily)
let auth = null;
let rtdb = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK with proper error handling
 */
const initializeFirebase = () => {
    if (firebaseInitialized) {
        return true;
    }

    try {
        // Check if Firebase is already initialized
        if (admin.apps.length > 0) {
            auth = admin.auth();
            rtdb = admin.database();
            firebaseInitialized = true;
            return true;
        }

        // Validate required environment variables
        const requiredEnvVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_DATABASE_URL'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            console.error('Missing required Firebase environment variables:', missingVars);
            console.error('Please add these to your .env file');
            return false;
        }

        // Load service account key
        let serviceAccount;
        try {
            serviceAccount = require('../serviceAccountKey.json');
        } catch (error) {
            console.error('Error loading serviceAccountKey.json:', error.message);
            console.error('Make sure the service account file exists in the backend directory');
            return false;
        }

        // Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });

        // Initialize service instances
        auth = admin.auth();
        rtdb = admin.database();

        firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized successfully');
        return true;

    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        firebaseInitialized = false;
        return false;
    }
};

/**
 * Get Firebase service instances (initializes if needed)
 */
const getFirebaseServices = () => {
    if (!firebaseInitialized) {
        const success = initializeFirebase();
        if (!success) {
            throw new Error('Failed to initialize Firebase Admin SDK');
        }
    }
    return { auth, rtdb };
};

/**
 * Verify Firebase ID token and attach user info to request
 */
const verifyFirebaseToken = async (req, res, next) => {
    try {
        // Initialize Firebase if not already done
        if (!firebaseInitialized) {
            const success = initializeFirebase();
            if (!success) {
                return res.status(500).json({
                    success: false,
                    message: 'Firebase initialization failed',
                    code: 'FIREBASE_INIT_ERROR'
                });
            }
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token provided',
                code: 'NO_TOKEN'
            });
        }

        const idToken = authHeader.split(' ')[1];

        // Verify the ID token
        const decodedToken = await auth.verifyIdToken(idToken);

        // Get user role from Realtime Database
        const userRef = rtdb.ref(`users/${decodedToken.uid}`);
        const userSnapshot = await userRef.get();

        if (!userSnapshot.exists()) {
            return res.status(403).json({
                success: false,
                message: 'User not found in database',
                code: 'USER_NOT_FOUND'
            });
        }

        const userData = userSnapshot.val();

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: userData.role,
            departmentId: userData.departmentId,
            permissions: userData.permissions || [],
            emailVerified: decodedToken.email_verified
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                success: false,
                message: 'Token revoked',
                code: 'TOKEN_REVOKED'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Check if user has required role
 */
const requireRole = (role) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Admin can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check specific role
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `${role} role required`,
                code: 'INSUFFICIENT_ROLE'
            });
        }

        next();
    };
};

/**
 * Check if user has minimum role level
 */
const requireMinimumRole = (minimumRole) => {
    const roleHierarchy = {
        'staff': 1,
        'delivery': 2,
        'baker': 2,
        'sales': 2,
        'manager': 3,
        'admin': 4
    };

    return async (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        const userLevel = roleHierarchy[req.user.role] || 0;
        const requiredLevel = roleHierarchy[minimumRole] || 0;

        if (userLevel < requiredLevel) {
            return res.status(403).json({
                success: false,
                message: `${minimumRole} role or higher required`,
                code: 'INSUFFICIENT_ROLE'
            });
        }

        next();
    };
};

/**
 * Check department access for managers
 */
const requireDepartmentAccess = async (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
        return next();
    }

    // Manager must have department access
    if (req.user.role === 'manager') {
        const departmentId = req.params.departmentId || req.body.departmentId;

        if (!departmentId || req.user.departmentId !== departmentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this department',
                code: 'DEPARTMENT_ACCESS_DENIED'
            });
        }
    }

    next();
};

/**
 * Custom claims verification
 */
const verifyCustomClaims = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Ensure Firebase is initialized
        const { auth } = getFirebaseServices();

        // Get latest custom claims from Firebase Auth
        const user = await auth.getUser(req.user.uid);

        // Update request user with latest custom claims
        req.user.customClaims = user.customClaims || {};

        next();
    } catch (error) {
        console.error('Custom claims verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying custom claims',
            code: 'CLAIMS_ERROR'
        });
    }
};

/**
 * Check specific permission
 */
const requirePermission = (permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Admin has all permissions
        if (req.user.role === 'admin') {
            return next();
        }

        // Check permissions array
        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: `Permission '${permission}' required`,
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

// Export Firebase initialization function for external use
module.exports = {
    admin,
    initializeFirebase,
    getFirebaseServices,
    verifyFirebaseToken,
    requireRole,
    requireMinimumRole,
    requireDepartmentAccess,
    verifyCustomClaims,
    requirePermission,
    // Export service instances for backward compatibility
    get auth() { return getFirebaseServices().auth; },
    get rtdb() { return getFirebaseServices().rtdb; }
};