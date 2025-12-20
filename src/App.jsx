import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import PreOrders from './pages/PreOrders';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import DataSync from './pages/DataSync';
import LandingPage from './pages/LandingPage';
import CustomerPreOrder from './pages/CustomerPreOrder';
import MenuCreate from './pages/MenuCreate';

import OrderConfirmation from './pages/OrderConfirmation';
import ProductAnalytics from './pages/ProductAnalytics';
import EmployeesPage from './pages/EmployeesPage';
import StaffCakeCount from './pages/StaffCakeCount';
import { DataProvider } from './contexts/DataContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { StocksDataProvider } from './contexts/StocksDataContext';
import ToastProvider from './contexts/ToastContext';
import { Loader2 } from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import ErrorBoundary from './components/Analytics/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleProtectedRoute = ({ children, minimumRole = 'manager' }) => {
  const { isAuthenticated, loading, hasMinimumRole, user } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  if (!hasMinimumRole(minimumRole)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the Employee Management module.
            This area requires {minimumRole} role or higher.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your current role: <span className="font-medium">{user?.role || 'Unknown'}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const DashboardGuard = () => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (user?.role === 'staff') {
    return <Navigate to="/admin/orders" replace />;
  }
  
  // Also require strictly sales+ for dashboard if we want? 
  // But wait, if role is sales/baker/manager/admin, show Dashboard.
  // Assuming 'staff' is the only one we want to block.
  // Actually, 'staff' is Level 1. Sales/Baker is Level 2.
  // If we want to hide dashboard for everyone except manager, we can do that too.
  // But the request specifically mentioned 'staff'.
  
  return <Dashboard />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <EmployeeProvider>
            <ToastProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/orders" element={<CustomerPreOrder />} />

              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/staff/stocks" element={
                <StocksDataProvider>
                  <StaffCakeCount />
                </StocksDataProvider>
              } />
              <Route path="/menu-create" element={<MenuCreate />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardGuard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="pre-orders" element={
                  <RoleProtectedRoute minimumRole="sales">
                    <PreOrders />
                  </RoleProtectedRoute>
                } />
                <Route path="products" element={
                  <RoleProtectedRoute minimumRole="sales">
                    <Products />
                  </RoleProtectedRoute>
                } />
                <Route path="customers" element={
                  <RoleProtectedRoute minimumRole="sales">
                    <Customers />
                  </RoleProtectedRoute>
                } />
                <Route path="employees" element={
                  <RoleProtectedRoute minimumRole="manager">
                    <ErrorBoundary>
                      <EmployeesPage />
                    </ErrorBoundary>
                  </RoleProtectedRoute>
                } />
                <Route path="data-sync" element={
                  <RoleProtectedRoute minimumRole="manager">
                    <DataSync />
                  </RoleProtectedRoute>
                } />
                <Route path="analytics" element={
                  <RoleProtectedRoute minimumRole="manager">
                    <Analytics />
                  </RoleProtectedRoute>
                } />
                <Route path="product-analytics" element={
                  <RoleProtectedRoute minimumRole="manager">
                    <ProductAnalytics />
                  </RoleProtectedRoute>
                } />
                <Route path="settings" element={
                  <RoleProtectedRoute minimumRole="manager">
                    <Settings />
                  </RoleProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
            </ToastProvider>
          </EmployeeProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
