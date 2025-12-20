import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import axios from 'axios';

const EmployeeContext = createContext();

export const useEmployees = () => useContext(EmployeeContext);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Axios interceptor for adding auth token
const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token expired or invalid - redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const EmployeeProviderSecure = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch employees with role-based filtering
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/employees');

            if (response.data.success) {
                setEmployees(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch employees');
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError(err.response?.data?.message || 'Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch departments
    const fetchDepartments = useCallback(async () => {
        try {
            const response = await api.get('/departments');

            if (response.data.success) {
                setDepartments(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    }, []);

    // Create employee with server-side validation
    const createEmployee = useCallback(async (employeeData) => {
        try {
            setError(null);

            // Sanitize input before sending
            const sanitizedData = {
                firstName: employeeData.firstName?.trim(),
                lastName: employeeData.lastName?.trim(),
                email: employeeData.email?.toLowerCase().trim(),
                role: employeeData.role,
                departmentId: employeeData.departmentId,
                status: employeeData.status || 'active',
                phoneNumber: employeeData.phoneNumber?.trim() || null,
                startDate: employeeData.startDate || new Date().toISOString().split('T')[0]
            };

            const response = await api.post('/employees', sanitizedData);

            if (response.data.success) {
                // Refresh employee list
                await fetchEmployees();
                return { success: true, id: response.data.data.id };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [fetchEmployees]);

    // Update employee with permission checks
    const updateEmployee = useCallback(async (employeeId, updateData) => {
        try {
            setError(null);

            // Sanitize input
            const sanitizedData = {
                ...updateData,
                firstName: updateData.firstName?.trim(),
                lastName: updateData.lastName?.trim(),
                email: updateData.email?.toLowerCase().trim(),
                phoneNumber: updateData.phoneNumber?.trim() || null
            };

            const response = await api.put(`/employees/${employeeId}`, sanitizedData);

            if (response.data.success) {
                // Update local state optimistically
                setEmployees(prev => prev.map(emp =>
                    emp.id === employeeId
                        ? { ...emp, ...sanitizedData }
                        : emp
                ));
                return { success: true };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            // Revert optimistic update
            await fetchEmployees();
            return { success: false, error: errorMessage };
        }
    }, [fetchEmployees]);

    // Delete employee (admin only)
    const deleteEmployee = useCallback(async (employeeId) => {
        try {
            setError(null);

            const response = await api.delete(`/employees/${employeeId}`);

            if (response.data.success) {
                // Remove from local state
                setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
                return { success: true };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(errorMessage);
            await fetchEmployees(); // Refresh to get correct state
            return { success: false, error: errorMessage };
        }
    }, [fetchEmployees]);

    // Get single employee
    const getEmployee = useCallback(async (employeeId) => {
        try {
            const response = await api.get(`/employees/${employeeId}`);

            if (response.data.success) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            return { success: false, error: errorMessage };
        }
    }, []);

    // Bulk operations
    const bulkUpdateEmployees = useCallback(async (updates) => {
        try {
            setLoading(true);
            setError(null);

            const results = await Promise.allSettled(
                updates.map(({ id, data }) => updateEmployee(id, data))
            );

            const failures = results.filter(r => r.status === 'rejected' || !r.value.success);

            if (failures.length > 0) {
                console.error('Some bulk updates failed:', failures);
                setError(`${failures.length} updates failed`);
                return { success: false, failed: failures.length };
            }

            setLoading(false);
            return { success: true, updated: updates.length };
        } catch (err) {
            console.error('Bulk update error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, [updateEmployee]);

    // Search and filter functionality
    const searchEmployees = useCallback(async (searchTerm, filters = {}) => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                search: searchTerm || '',
                ...filters
            });

            const response = await api.get(`/employees/search?${params}`);

            if (response.data.success) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, [fetchEmployees, fetchDepartments]);

    // Set up real-time updates via SSE or polling (alternative to RTDB)
    useEffect(() => {
        // Poll for updates every 30 seconds (adjust based on needs)
        const interval = setInterval(() => {
            fetchEmployees();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchEmployees]);

    const value = {
        employees,
        departments,
        loading,
        error,
        fetchEmployees,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployee,
        bulkUpdateEmployees,
        searchEmployees,
        refetch: () => {
            fetchEmployees();
            fetchDepartments();
        }
    };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
};