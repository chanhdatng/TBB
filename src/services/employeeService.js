import {
    ref,
    push,
    update,
    remove,
    get,
    set
} from 'firebase/database';
import { database } from '../firebase';
import { auth } from '../firebase';
import {
    transformEmployeeFromFirebase,
    transformEmployeeToFirebase,
    transformEmployeesList
} from '../utils/employeeTransformers';

class EmployeeService {
    constructor() {
        this.database = database;
    }

    // Create a new employee
    async createEmployee(employeeData) {
        try {
            const transformedData = transformEmployeeToFirebase(employeeData);

            // Use phone as ID if available, otherwise push a new ID
            let newEmployeeRef;
            if (employeeData.phone) {
                // Sanitize phone to ensure it's a valid key
                const phoneId = String(employeeData.phone).trim(); // Basic trimming
                newEmployeeRef = ref(this.database, `employees/${phoneId}`);
            } else {
                const employeesRef = ref(this.database, 'employees');
                newEmployeeRef = push(employeesRef);
            }
            
            await set(newEmployeeRef, transformedData);

            const employeeId = newEmployeeRef.key;

            // Return the new employee with ID
            return {
                success: true,
                employeeId,
                employee: {
                    id: employeeId,
                    ...transformEmployeeFromFirebase({
                        ...transformedData,
                        id: employeeId
                    })
                }
            };
        } catch (error) {
            console.error('Error creating employee:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create a new employee with Firebase Auth user account (backend version)
    async createEmployeeWithUser(employeeData) {
        try {
            // Get the current user's ID token
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No authenticated user found');
            }

            const idToken = await user.getIdToken();

            // Call backend endpoint
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/employees/create-with-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(employeeData)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create employee');
            }

            return {
                success: true,
                employeeId: data.data.id,
                employee: {
                    id: data.data.id,
                    ...data.data
                },
                password: data.data.password // Return password for display
            };
        } catch (error) {
            console.error('Error creating employee with user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get employee by ID
    async getEmployeeById(employeeId) {
        try {
            const employeeRef = ref(this.database, `employees/${employeeId}`);
            const snapshot = await get(employeeRef);

            if (snapshot.exists()) {
                return {
                    success: true,
                    employee: transformEmployeeFromFirebase({
                        id: employeeId,
                        ...snapshot.val()
                    })
                };
            } else {
                return {
                    success: false,
                    error: 'Employee not found'
                };
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all employees
    async getAllEmployees(options = {}) {
        try {
            const employeesRef = ref(this.database, 'employees');
            const snapshot = await get(employeesRef);
            const employeesData = snapshot.val() || {};

            let employees = Object.entries(employeesData).map(([id, data]) =>
                transformEmployeeFromFirebase({
                    id,
                    ...data
                })
            );

            // Apply filters if provided
            if (options.departmentId) {
                employees = employees.filter(emp => emp.departmentId === options.departmentId);
            }

            if (options.status) {
                employees = employees.filter(emp => emp.status === options.status);
            }

            if (options.position) {
                employees = employees.filter(emp => emp.position === options.position);
            }

            // Apply ordering
            if (options.orderBy) {
                const orderDirection = options.orderDirection || 'asc';
                employees.sort((a, b) => {
                    const aVal = a[options.orderBy] || '';
                    const bVal = b[options.orderBy] || '';
                    const comparison = aVal.localeCompare(bVal);
                    return orderDirection === 'desc' ? -comparison : comparison;
                });
            } else {
                // Default ordering by lastName, then firstName
                employees.sort((a, b) => {
                    const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '');
                    if (lastNameComparison !== 0) return lastNameComparison;
                    return (a.firstName || '').localeCompare(b.firstName || '');
                });
            }

            // Apply limit
            if (options.limit) {
                employees = employees.slice(0, options.limit);
            }

            return {
                success: true,
                employees,
                count: employees.length
            };
        } catch (error) {
            console.error('Error fetching employees:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update employee
    async updateEmployee(employeeId, updateData) {
        try {
            const transformedData = transformEmployeeToFirebase(updateData);

            const employeeRef = ref(this.database, `employees/${employeeId}`);
            await update(employeeRef, {
                ...transformedData,
                updatedAt: new Date().toISOString()
            });

            // Fetch and return updated employee
            const updatedSnapshot = await get(employeeRef);
            return {
                success: true,
                employee: transformEmployeeFromFirebase({
                    id: employeeId,
                    ...updatedSnapshot.val()
                })
            };
        } catch (error) {
            console.error('Error updating employee:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete employee
    async deleteEmployee(employeeId) {
        try {
            const employeeRef = ref(this.database, `employees/${employeeId}`);
            await remove(employeeRef);

            return {
                success: true,
                employeeId
            };
        } catch (error) {
            console.error('Error deleting employee:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Search employees
    async searchEmployees(searchTerm, options = {}) {
        try {
            // For Firestore, we need to implement search on the client side
            // or use a more advanced search solution like Algolia
            const allEmployeesResult = await this.getAllEmployees({
                departmentId: options.departmentId,
                status: options.status,
                orderBy: options.orderBy,
                orderDirection: options.orderDirection
            });

            if (!allEmployeesResult.success) {
                return allEmployeesResult;
            }

            const { employees } = allEmployeesResult;

            if (!searchTerm) {
                return {
                    success: true,
                    employees,
                    count: employees.length
                };
            }

            const lowerSearchTerm = searchTerm.toLowerCase();
            const filteredEmployees = employees.filter(emp =>
                emp.firstName.toLowerCase().includes(lowerSearchTerm) ||
                emp.lastName.toLowerCase().includes(lowerSearchTerm) ||
                emp.email.toLowerCase().includes(lowerSearchTerm) ||
                emp.position?.toLowerCase().includes(lowerSearchTerm) ||
                emp.employeeId?.toLowerCase().includes(lowerSearchTerm) ||
                emp.phone?.toLowerCase().includes(lowerSearchTerm)
            );

            return {
                success: true,
                employees: filteredEmployees,
                count: filteredEmployees.length
            };
        } catch (error) {
            console.error('Error searching employees:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get employees by department
    async getEmployeesByDepartment(departmentId) {
        return this.getAllEmployees({ departmentId });
    }

    // Get active employees
    async getActiveEmployees() {
        return this.getAllEmployees({ status: 'active' });
    }

    // Get employees by position
    async getEmployeesByPosition(position) {
        return this.getAllEmployees({ position });
    }

    // Bulk operations (simplified for Realtime Database)
    async bulkCreateEmployees(employeesData) {
        try {
            const results = await Promise.all(
                employeesData.map(employeeData => this.createEmployee(employeeData))
            );

            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            return {
                success: failed.length === 0,
                employees: successful.map(r => r.employee),
                count: successful.length,
                errors: failed.map(r => r.error)
            };
        } catch (error) {
            console.error('Error bulk creating employees:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async bulkUpdateEmployees(updates) {
        try {
            const results = await Promise.all(
                updates.map(({ employeeId, updateData }) => this.updateEmployee(employeeId, updateData))
            );

            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            return {
                success: failed.length === 0,
                updatedCount: successful.length,
                errors: failed.map(r => r.error)
            };
        } catch (error) {
            console.error('Error bulk updating employees:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async bulkDeleteEmployees(employeeIds) {
        try {
            const results = await Promise.all(
                employeeIds.map(employeeId => this.deleteEmployee(employeeId))
            );

            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            return {
                success: failed.length === 0,
                deletedCount: successful.length,
                errors: failed.map(r => r.error)
            };
        } catch (error) {
            console.error('Error bulk deleting employees:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Employee statistics
    async getEmployeeStats() {
        try {
            const allResult = await this.getAllEmployees();
            if (!allResult.success) {
                throw new Error(allResult.error);
            }

            const { employees } = allResult;

            const stats = {
                total: employees.length,
                active: employees.filter(emp => emp.status === 'active').length,
                inactive: employees.filter(emp => emp.status === 'inactive').length,
                onLeave: employees.filter(emp => emp.status === 'on_leave').length,
                terminated: employees.filter(emp => emp.status === 'terminated').length,
                byDepartment: {},
                byPosition: {},
                newThisMonth: employees.filter(emp => {
                    const hireDate = new Date(emp.hireDate);
                    const thisMonth = new Date();
                    return hireDate.getMonth() === thisMonth.getMonth() &&
                           hireDate.getFullYear() === thisMonth.getFullYear();
                }).length
            };

            // Count by department
            employees.forEach(emp => {
                if (emp.departmentId) {
                    stats.byDepartment[emp.departmentId] = (stats.byDepartment[emp.departmentId] || 0) + 1;
                }
            });

            // Count by position
            employees.forEach(emp => {
                if (emp.position) {
                    stats.byPosition[emp.position] = (stats.byPosition[emp.position] || 0) + 1;
                }
            });

            return {
                success: true,
                stats
            };
        } catch (error) {
            console.error('Error fetching employee stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
export const employeeService = new EmployeeService();

// Export class for testing or custom instances
export default EmployeeService;