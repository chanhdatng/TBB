import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Helper to parse JWT token
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

// Check if token is expired
const isTokenExpired = (token) => {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verify token on mount and set up expiry check
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                setLoading(false);
                return;
            }

            // Check if token is expired locally first
            if (isTokenExpired(token)) {
                localStorage.removeItem('authToken');
                setLoading(false);
                return;
            }

            // Verify with server
            try {
                const response = await fetch('/api/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsAuthenticated(true);
                    setUser(data.user);
                } else {
                    // Token invalid, remove it
                    localStorage.removeItem('authToken');
                }
            } catch (err) {
                // Network error, still allow if token seems valid locally
                const decoded = parseJwt(token);
                if (decoded && !isTokenExpired(token)) {
                    setIsAuthenticated(true);
                    setUser({ username: decoded.username, role: decoded.role });
                } else {
                    localStorage.removeItem('authToken');
                }
            }
            
            setLoading(false);
        };

        verifyToken();
    }, []);

    // Set up periodic token expiry check
    useEffect(() => {
        const checkInterval = setInterval(() => {
            const token = localStorage.getItem('authToken');
            if (token && isTokenExpired(token)) {
                logout();
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkInterval);
    }, []);

    const login = async (username, password) => {
        setError(null);
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.status === 429) {
                // Rate limited
                return {
                    success: false,
                    message: data.message || 'Too many login attempts. Please try again later.',
                    retryAfter: data.retryAfter
                };
            }

            if (data.success) {
                localStorage.setItem('authToken', data.token);
                setIsAuthenticated(true);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    const logout = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        
        // Try to notify server (optional, for logging purposes)
        if (token) {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (e) {
                // Ignore logout API errors
            }
        }
        
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    // Helper to get auth header for API calls
    const getAuthHeader = useCallback(() => {
        const token = localStorage.getItem('authToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }, []);

    // Role-based permission checking
    const hasPermission = useCallback((permission) => {
        if (!user || !user.role) return false;

        // Role hierarchy: admin > manager > staff/baker/sales/delivery
        const roleHierarchy = {
            'admin': 4,
            'manager': 3,
            'baker': 2,
            'sales': 2,
            'delivery': 2,
            'staff': 1
        };

        const userRoleLevel = roleHierarchy[user.role] || 0;

        // Permission definitions
        const permissions = {
            // Admin permissions
            'user:read': 1,
            'user:create': 4,
            'user:update': 4,
            'user:delete': 4,
            'system:settings': 4,
            'analytics:view': 3,
            'reports:view': 3,
            // Manager permissions
            'inventory:manage': 3,
            'orders:manage': 3,
            'customers:manage': 3,
            'products:manage': 3,
            'staff:manage': 3,
            // Staff permissions
            'orders:create': 2,
            'orders:update': 2,
            'orders:view': 1,
            'products:view': 1,
            'customers:view': 1,
            'delivery:manage': 2
        };

        const requiredLevel = permissions[permission] || 4;
        return userRoleLevel >= requiredLevel;
    }, [user]);

    const hasRole = useCallback((role) => {
        if (!user || !user.role) return false;
        return user.role === role;
    }, [user]);

    const hasAnyRole = useCallback((roles) => {
        if (!user || !user.role) return false;
        return roles.includes(user.role);
    }, [user]);

    const hasMinimumRole = useCallback((minimumRole) => {
        if (!user || !user.role) return false;

        const roleHierarchy = {
            'admin': 4,
            'manager': 3,
            'baker': 2,
            'sales': 2,
            'delivery': 2,
            'staff': 1
        };

        const userRoleLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[minimumRole] || 0;

        return userRoleLevel >= requiredLevel;
    }, [user]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            loading,
            error,
            getAuthHeader,
            hasPermission,
            hasRole,
            hasAnyRole,
            hasMinimumRole
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
