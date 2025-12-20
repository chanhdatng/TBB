import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  minimumRole = null,
  allowedRoles = null,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, loading, user, hasRole, hasPermission, hasMinimumRole, hasAnyRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check for specific role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/admin" replace />;
  }

  // Check for minimum role requirement
  if (minimumRole && !hasMinimumRole(minimumRole)) {
    return <Navigate to="/admin" replace />;
  }

  // Check for allowed roles
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/admin" replace />;
  }

  // Check for specific permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;