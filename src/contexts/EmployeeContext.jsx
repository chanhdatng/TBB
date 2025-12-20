import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { database } from '../firebase';
import { ref, onValue, off, push, update, remove, get } from "firebase/database";
import {
    transformEmployeeFromFirebase,
    transformEmployeeToFirebase,
    transformEmployeesList
} from '../utils/employeeTransformers';

const EmployeeContext = createContext();

export const useEmployees = () => useContext(EmployeeContext);

export const EmployeeProvider = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastSync, setLastSync] = useState(null);

    // Real-time listener for employees
    useEffect(() => {
        setLoading(true);
        setError(null);

        // Fallback timeout
        const loadingTimeout = setTimeout(() => {
            console.warn('⚠️ Employee loading timeout - forcing loading to false');
            setLoading(false);
        }, 10000);

        const employeesRef = ref(database, 'employees');

        const handleEmployeeData = (snapshot) => {
            try {
                const data = snapshot.val();
                if (data) {
                    const transformedEmployees = transformEmployeesList(data);
                    setEmployees(transformedEmployees);
                    console.log(`✅ Loaded ${transformedEmployees.length} employees`);
                } else {
                    setEmployees([]);
                }
                setLastSync(new Date());
            } catch (err) {
                console.error('❌ Error transforming employee data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
                clearTimeout(loadingTimeout);
            }
        };

        const handleError = (error) => {
            console.error('❌ Error fetching employees:', error);
            setError(error.message);
            setLoading(false);
            clearTimeout(loadingTimeout);
        };

        // Set up real-time listener
        onValue(employeesRef, handleEmployeeData, handleError);

        return () => {
            clearTimeout(loadingTimeout);
            off(employeesRef);
        };
    }, []);

    // Load departments from Realtime Database
    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const departmentsRef = ref(database, 'departments');
                const snapshot = await get(departmentsRef);
                const departmentsData = snapshot.val() || {};

                const departmentsList = Object.entries(departmentsData).map(([id, data]) => ({
                    id,
                    ...data
                }));

                setDepartments(departmentsList);
            } catch (err) {
                console.error('❌ Error loading departments:', err);
            }
        };

        loadDepartments();
    }, []);

    // CRUD Operations
    const createEmployee = useCallback(async (employeeData) => {
        try {
            setLoading(true);
            const transformedData = transformEmployeeToFirebase(employeeData);

            // Add to Realtime Database
            const employeesRef = ref(database, 'employees');
            const newEmployeeRef = push(employeesRef);
            await newEmployeeRef.set({ ...transformedData, id: newEmployeeRef.key });

            setLoading(false);
            return { success: true, id: newEmployeeRef.key };
        } catch (error) {
            console.error('❌ Error creating employee:', error);
            setError(error.message);
            setLoading(false);
            return { success: false, error: error.message };
        }
    }, []);

    const updateEmployee = useCallback(async (employeeId, updateData) => {
        try {
            setLoading(true);
            const transformedData = transformEmployeeToFirebase(updateData);

            // Update in Realtime Database
            const employeeRef = ref(database, `employees/${employeeId}`);
            await update(employeeRef, { ...transformedData, updatedAt: Date.now() });

            setLoading(false);
            return { success: true };
        } catch (error) {
            console.error('❌ Error updating employee:', error);
            setError(error.message);
            setLoading(false);
            return { success: false, error: error.message };
        }
    }, []);

    const deleteEmployee = useCallback(async (employeeId) => {
        try {
            setLoading(true);

            // Delete from Realtime Database
            const employeeRef = ref(database, `employees/${employeeId}`);
            await remove(employeeRef);

            setLoading(false);
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting employee:', error);
            setError(error.message);
            setLoading(false);
            return { success: false, error: error.message };
        }
    }, []);

    const getEmployeeById = useCallback(async (employeeId) => {
        try {
            const employeeRef = ref(database, `employees/${employeeId}`);
            const snapshot = await get(employeeRef);

            if (snapshot.exists()) {
                return transformEmployeeFromFirebase({
                    id: employeeId,
                    ...snapshot.val()
                });
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching employee:', error);
            setError(error.message);
            return null;
        }
    }, []);

    // Query helpers
    const getActiveEmployees = useMemo(() => {
        return employees.filter(emp => emp.status === 'active');
    }, [employees]);

    const getEmployeesByDepartment = useCallback((departmentId) => {
        return employees.filter(emp => emp.departmentId === departmentId);
    }, [employees]);

    const searchEmployees = useCallback((searchTerm) => {
        if (!searchTerm) return employees;

        const lowerSearchTerm = searchTerm.toLowerCase();
        return employees.filter(emp =>
            emp.firstName.toLowerCase().includes(lowerSearchTerm) ||
            emp.lastName.toLowerCase().includes(lowerSearchTerm) ||
            emp.email.toLowerCase().includes(lowerSearchTerm) ||
            emp.position?.toLowerCase().includes(lowerSearchTerm) ||
            emp.employeeId?.toLowerCase().includes(lowerSearchTerm)
        );
    }, [employees]);

    // Department helpers
    const getDepartmentName = useCallback((departmentId) => {
        const department = departments.find(dept => dept.id === departmentId);
        return department?.name || 'Unknown Department';
    }, [departments]);

    // Refresh data (one-time fetch to avoid creating duplicate listeners)
    const refreshEmployees = useCallback(async () => {
        try {
            const employeesRef = ref(database, 'employees');
            const snapshot = await get(employeesRef);
            const data = snapshot.val();
            if (data) {
                const transformedEmployees = transformEmployeesList(data);
                setEmployees(transformedEmployees);
                setLastSync(new Date());
                console.log(`✅ Refreshed ${transformedEmployees.length} employees`);
            }
        } catch (error) {
            console.error('❌ Error refreshing employees:', error);
            setError(error.message);
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = {
        // Data
        employees,
        departments,
        loading,
        error,
        lastSync,

        // Computed values
        activeEmployees: getActiveEmployees,

        // CRUD operations
        createEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployeeById,

        // Query helpers
        getEmployeesByDepartment,
        searchEmployees,
        getDepartmentName,

        // Utilities
        refreshEmployees,
        clearError
    };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
};