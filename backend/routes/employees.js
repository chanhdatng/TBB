const express = require('express');
const { verifyFirebaseToken, requireRole, requireMinimumRole, requireDepartmentAccess, rtdb, admin } = require('../middleware/firebase-auth');
const { auditLog } = require('../middleware/audit-log');
const { body, validationResult } = require('express-validator');
const router = express.Router();

/**
 * Validation middleware
 */
const validateEmployeeInput = [
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name contains invalid characters'),

    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name contains invalid characters'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email required'),

    body('role')
        .isIn(['admin', 'manager', 'staff'])
        .withMessage('Role must be admin, manager, or staff'),

    body('departmentId')
        .isUUID(4)
        .withMessage('Valid department ID required'),

    body('status')
        .optional()
        .isIn(['active', 'inactive', 'onLeave'])
        .withMessage('Status must be active, inactive, or onLeave'),

    body('phoneNumber')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Invalid phone number format')
];

/**
 * GET /api/employees - List all employees (admin/manager only)
 */
router.get('/',
    verifyFirebaseToken,
    requireMinimumRole('manager'),
    auditLog('READ_EMPLOYEES', 'employees'),
    async (req, res) => {
        try {
            const employeesRef = rtdb.ref('employees');
            const snapshot = await employeesRef.get();
            const employeesData = snapshot.val() || {};

            let employees = Object.entries(employeesData).map(([id, data]) => ({
                id,
                ...data
            }));

            // Non-admin managers can only see their department
            if (req.user.role === 'manager') {
                employees = employees.filter(emp => emp.departmentId === req.user.departmentId);
            }

            // Remove sensitive data
            employees = employees.map(emp => ({
                ...emp,
                personalInfo: req.user.role === 'admin' ? emp.personalInfo : undefined
            }));

            res.json({
                success: true,
                data: employees
            });
        } catch (error) {
            console.error('Error fetching employees:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employees'
            });
        }
    }
);

/**
 * GET /api/employees/:id - Get specific employee
 */
router.get('/:id',
    verifyFirebaseToken,
    auditLog('READ_EMPLOYEE', 'employees'),
    async (req, res) => {
        try {
            const employeeRef = rtdb.ref(`employees/${req.params.id}`);
            const snapshot = await employeeRef.get();

            if (!snapshot.exists()) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            const employeeData = snapshot.val();

            // Check access permissions
            if (req.user.role === 'staff' && employeeData.userId !== req.user.uid) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            if (req.user.role === 'manager' && employeeData.departmentId !== req.user.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to other department'
                });
            }

            const employee = {
                id: req.params.id,
                ...employeeData
            };

            // Only show personal info to admins or the employee themselves
            if (req.user.role !== 'admin' && employeeData.userId !== req.user.uid) {
                delete employee.personalInfo;
                delete employee.salary;
                delete employee.ssn;
            }

            res.json({
                success: true,
                data: employee
            });
        } catch (error) {
            console.error('Error fetching employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employee'
            });
        }
    }
);

/**
 * POST /api/employees/create-with-user - Create new employee with Firebase Auth user
 * Simplified version for owners
 */
router.post('/create-with-user',
    verifyFirebaseToken,
    requireMinimumRole('admin'), // Only admins can use this simplified endpoint
    auditLog('CREATE_EMPLOYEE_WITH_USER', 'employees'),
    async (req, res) => {
        try {
            const {
                firstName,
                lastName,
                email,
                phone,
                position,
                positionId,
                department,
                departmentId,
                status = 'active',
                hireDate,
                salary,
                createLoginAccount = false,
                password,
                profilePicture,
                documents,
                notes
            } = req.body;

            // Basic validation
            if (!firstName || !lastName || !email || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'First name, last name, email, and phone are required'
                });
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Check if employee email already exists
            const employeesRef = rtdb.ref('employees');
            const allEmployeesSnapshot = await employeesRef.get();
            const employeesData = allEmployeesSnapshot.val() || {};

            const existingEmployee = Object.entries(employeesData).find(([id, data]) => data.email === email);

            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee with this email already exists'
                });
            }

            let firebaseUser = null;
            let generatedPassword = null;

            // Create Firebase Auth user if requested
            if (createLoginAccount && password) {
                try {
                    const userCredential = await admin.auth().createUser({
                        email,
                        password,
                        displayName: `${firstName} ${lastName}`,
                        emailVerified: false
                    });

                    firebaseUser = userCredential.user;
                    generatedPassword = password;

                    // Set custom claims for role
                    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
                        role: 'staff',
                        departmentId: departmentId || null
                    });

                    // Store user data in database
                    const userRef = rtdb.ref(`users/${firebaseUser.uid}`);
                    await userRef.set({
                        uid: firebaseUser.uid,
                        email,
                        displayName: `${firstName} ${lastName}`,
                        role: 'staff',
                        departmentId: departmentId || null,
                        employeeId: null, // Will be set after employee creation
                        createdAt: admin.database.ServerValue.TIMESTAMP
                    });

                } catch (authError) {
                    console.error('Error creating Firebase user:', authError);
                    return res.status(400).json({
                        success: false,
                        message: `Failed to create user account: ${authError.message}`
                    });
                }
            }

            // Create employee document
            const employeeData = {
                firstName,
                lastName,
                email,
                phone,
                position,
                positionId,
                department,
                departmentId,
                status,
                hireDate: hireDate || new Date().toISOString().split('T')[0],
                salary: salary || null,
                profilePicture: profilePicture || null,
                documents: documents || { uploaded: [], required: [], pending: [] },
                notes: notes || '',
                firebaseUid: firebaseUser ? firebaseUser.uid : null,
                hasAccount: createLoginAccount || false,
                createdAt: admin.database.ServerValue.TIMESTAMP,
                createdBy: req.user.uid
            };

            const newEmployeeRef = rtdb.ref('employees').push();
            await newEmployeeRef.set(employeeData);
            const employeeId = newEmployeeRef.key;

            // Update user record with employeeId
            if (firebaseUser) {
                const userRef = rtdb.ref(`users/${firebaseUser.uid}`);
                await userRef.update({
                    employeeId
                });
            }

            res.status(201).json({
                success: true,
                message: 'Employee created successfully',
                data: {
                    id: employeeId,
                    ...employeeData,
                    password: generatedPassword // Return password only on creation
                }
            });

        } catch (error) {
            console.error('Error creating employee with user:', error);

            // Clean up Firebase user if employee creation failed
            if (firebaseUser) {
                try {
                    await admin.auth().deleteUser(firebaseUser.uid);
                } catch (cleanupError) {
                    console.error('Error cleaning up Firebase user:', cleanupError);
                }
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create employee'
            });
        }
    }
);

/**
 * POST /api/employees - Create new employee
 */
router.post('/',
    verifyFirebaseToken,
    requireMinimumRole('manager'),
    validateEmployeeInput,
    auditLog('CREATE_EMPLOYEE', 'employees'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const {
                firstName,
                lastName,
                email,
                role,
                departmentId,
                status = 'active',
                phoneNumber,
                startDate
            } = req.body;

            // Check if department exists
            const deptRef = rtdb.ref(`departments/${departmentId}`);
            const deptSnapshot = await deptRef.get();
            if (!deptSnapshot.exists()) {
                return res.status(400).json({
                    success: false,
                    message: 'Department does not exist'
                });
            }

            // Check manager permissions (can only create in their department)
            if (req.user.role === 'manager' && departmentId !== req.user.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot create employees in other departments'
                });
            }

            // Check if employee email already exists
            const employeesRef = rtdb.ref('employees');
            const allEmployeesSnapshot = await employeesRef.get();
            const employeesData = allEmployeesSnapshot.val() || {};

            const existingEmployee = Object.entries(employeesData).find(([id, data]) => data.email === email);

            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee with this email already exists'
                });
            }

            // Create employee document
            const employeeData = {
                firstName,
                lastName,
                email,
                role,
                departmentId,
                status,
                phoneNumber: phoneNumber || null,
                startDate: startDate || new Date().toISOString(),
                createdAt: admin.database.ServerValue.TIMESTAMP,
                createdBy: req.user.uid
            };

            const newEmployeeRef = rtdb.ref('employees').push();
            await newEmployeeRef.set(employeeData);
            const employeeId = newEmployeeRef.key;

            // Also create user account if it doesn't exist
            try {
                await admin.auth().createUser({
                    email,
                    emailVerified: false,
                    password: generateTemporaryPassword(),
                    displayName: `${firstName} ${lastName}`
                });

                // Set custom claims
                await admin.auth().setCustomUserClaims(employeeId, {
                    role,
                    departmentId
                });
            } catch (authError) {
                console.warn('Failed to create auth user:', authError.message);
            }

            res.status(201).json({
                success: true,
                message: 'Employee created successfully',
                data: {
                    id: employeeId,
                    ...employeeData
                }
            });
        } catch (error) {
            console.error('Error creating employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create employee'
            });
        }
    }
);

/**
 * PUT /api/employees/:id - Update employee
 */
router.put('/:id',
    verifyFirebaseToken,
    validateEmployeeInput,
    auditLog('UPDATE_EMPLOYEE', 'employees'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const employeeRef = rtdb.ref(`employees/${req.params.id}`);
            const snapshot = await employeeRef.get();

            if (!snapshot.exists()) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            const employeeData = snapshot.val();
            const updateData = { ...req.body };

            // Check permissions
            if (req.user.role === 'staff' && employeeData.userId !== req.user.uid) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot update other employees'
                });
            }

            // Staff can only update limited fields
            if (req.user.role === 'staff') {
                const allowedFields = ['phoneNumber', 'address', 'emergencyContact'];
                const attemptedFields = Object.keys(updateData);

                const hasDisallowedFields = attemptedFields.some(field => !allowedFields.includes(field));
                if (hasDisallowedFields) {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot update these fields'
                    });
                }
            }

            // Manager department restrictions
            if (req.user.role === 'manager') {
                if (employeeData.departmentId !== req.user.departmentId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot update employees in other departments'
                    });
                }

                // Managers cannot change roles to admin
                if (updateData.role === 'admin' && employeeData.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot assign admin role'
                    });
                }

                // Managers cannot change departments
                if (updateData.departmentId && updateData.departmentId !== employeeData.departmentId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Cannot change employee department'
                    });
                }
            }

            // Log role changes
            if (updateData.role && updateData.role !== employeeData.role) {
                updateData.oldRole = employeeData.role;
                updateData.roleChangedAt = admin.database.ServerValue.TIMESTAMP;
                updateData.roleChangedBy = req.user.uid;

                // Update Firebase Auth custom claims
                if (employeeData.userId) {
                    await admin.auth().setCustomUserClaims(employeeData.userId, {
                        role: updateData.role,
                        departmentId: updateData.departmentId || employeeData.departmentId
                    });
                }
            }

            updateData.updatedAt = admin.database.ServerValue.TIMESTAMP;
            updateData.updatedBy = req.user.uid;

            await employeeRef.update(updateData);

            res.json({
                success: true,
                message: 'Employee updated successfully'
            });
        } catch (error) {
            console.error('Error updating employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update employee'
            });
        }
    }
);

/**
 * DELETE /api/employees/:id - Delete employee (admin only)
 */
router.delete('/:id',
    verifyFirebaseToken,
    requireRole('admin'),
    auditLog('DELETE_EMPLOYEE', 'employees'),
    async (req, res) => {
        try {
            const employeeRef = rtdb.ref(`employees/${req.params.id}`);
            const snapshot = await employeeRef.get();

            if (!snapshot.exists()) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            const employeeData = snapshot.val();

            // Cannot delete admins
            if (employeeData.role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete admin users'
                });
            }

            // Soft delete by setting status to inactive
            await employeeRef.update({
                status: 'inactive',
                deletedAt: admin.database.ServerValue.TIMESTAMP,
                deletedBy: req.user.uid,
                isActive: false
            });

            // Disable Firebase Auth user
            if (employeeData.userId) {
                await admin.auth().updateUser(employeeData.userId, {
                    disabled: true
                });
            }

            res.json({
                success: true,
                message: 'Employee deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete employee'
            });
        }
    }
);

/**
 * Helper function to generate temporary password
 */
function generateTemporaryPassword() {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
}

module.exports = router;