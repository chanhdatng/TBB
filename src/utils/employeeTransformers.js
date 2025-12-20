/**
 * Employee Data Transformation Utilities
 * Handles conversion between frontend format and Firebase storage format
 */

/**
 * Transform employee data from Firebase format to frontend format
 * @param {Object} firebaseData - Employee data from Firebase
 * @returns {Object} Transformed employee data for frontend use
 */
export const transformEmployeeFromFirebase = (firebaseData) => {
    if (!firebaseData) return null;

    // Handle different timestamp formats
    const parseTimestamp = (timestamp) => {
        if (!timestamp) return null;

        // If it's a string (ISO)
        if (typeof timestamp === 'string') {
            return new Date(timestamp);
        }

        // If it's a number (Unix timestamp in milliseconds)
        if (typeof timestamp === 'number') {
            return new Date(timestamp);
        }

        // Fallback
        return new Date();
    };

    const employee = {
        id: firebaseData.id || firebaseData.employeeId || null,
        employeeId: firebaseData.employeeId || firebaseData.id || null,
        firstName: firebaseData.firstName || '',
        lastName: firebaseData.lastName || '',
        email: firebaseData.email || '',
        phone: firebaseData.phone || '',
        position: firebaseData.position || '',
        departmentId: firebaseData.departmentId || null,
        department: firebaseData.department || '',
        status: firebaseData.status || 'active',
        hireDate: parseTimestamp(firebaseData.hireDate),
        terminationDate: parseTimestamp(firebaseData.terminationDate),
        salary: firebaseData.salary || 0,
        address: firebaseData.address || '',
        city: firebaseData.city || '',
        state: firebaseData.state || '',
        zipCode: firebaseData.zipCode || '',
        country: firebaseData.country || '',
        emergencyContact: {
            name: firebaseData.emergencyContact?.name || '',
            relationship: firebaseData.emergencyContact?.relationship || '',
            phone: firebaseData.emergencyContact?.phone || ''
        },
        emergencyContacts: Array.isArray(firebaseData.emergencyContacts) ? firebaseData.emergencyContacts : [],
        skills: Array.isArray(firebaseData.skills) ? firebaseData.skills : [],
        certifications: Array.isArray(firebaseData.certifications)
            ? firebaseData.certifications
            : (firebaseData.certifications ? [firebaseData.certifications] : []),
        notes: firebaseData.notes || '',
        managerId: firebaseData.managerId || null,
        profilePicture: firebaseData.profilePicture || '',
        workSchedule: {
            monday: firebaseData.workSchedule?.monday || { start: '', end: '', off: false },
            tuesday: firebaseData.workSchedule?.tuesday || { start: '', end: '', off: false },
            wednesday: firebaseData.workSchedule?.wednesday || { start: '', end: '', off: false },
            thursday: firebaseData.workSchedule?.thursday || { start: '', end: '', off: false },
            friday: firebaseData.workSchedule?.friday || { start: '', end: '', off: false },
            saturday: firebaseData.workSchedule?.saturday || { start: '', end: '', off: true },
            sunday: firebaseData.workSchedule?.sunday || { start: '', end: '', off: true }
        },
        benefits: {
            healthInsurance: firebaseData.benefits?.healthInsurance || false,
            dentalInsurance: firebaseData.benefits?.dentalInsurance || false,
            visionInsurance: firebaseData.benefits?.visionInsurance || false,
            retirement401k: firebaseData.benefits?.retirement401k || false,
            paidTimeOff: firebaseData.benefits?.paidTimeOff || 0,
            sickLeave: firebaseData.benefits?.sickLeave || 0
        },
        performance: {
            lastReview: parseTimestamp(firebaseData.performance?.lastReview),
            nextReview: parseTimestamp(firebaseData.performance?.nextReview),
            rating: firebaseData.performance?.rating || 0,
            goals: Array.isArray(firebaseData.performance?.goals)
                ? firebaseData.performance.goals
                : []
        },
        createdAt: parseTimestamp(firebaseData.createdAt),
        updatedAt: parseTimestamp(firebaseData.updatedAt),
        userId: firebaseData.userId || null,
        onboarding: firebaseData.onboarding ? {
            status: firebaseData.onboarding.status || 'not_started',
            progress: firebaseData.onboarding.progress || 0,
            startDate: parseTimestamp(firebaseData.onboarding.startDate),
            completedDate: parseTimestamp(firebaseData.onboarding.completedDate),
            assignedTasks: firebaseData.onboarding.assignedTasks || {}
        } : {
            status: 'not_started',
            progress: 0,
            startDate: null,
            completedDate: null,
            assignedTasks: {}
        },
        bankingInfo: firebaseData.bankingInfo ? {
            accountNumber: firebaseData.bankingInfo.accountNumber || '',
            routingNumber: firebaseData.bankingInfo.routingNumber || '',
            bankName: firebaseData.bankingInfo.bankName || '',
            accountType: firebaseData.bankingInfo.accountType || 'checking',
            encrypted: firebaseData.bankingInfo.encrypted || false
        } : null,
        taxInfo: firebaseData.taxInfo ? {
            ssn: firebaseData.taxInfo.ssn || '',
            filingStatus: firebaseData.taxInfo.filingStatus || 'single',
            allowances: firebaseData.taxInfo.allowances || 0,
            additionalWithholding: firebaseData.taxInfo.additionalWithholding || 0,
            encrypted: firebaseData.taxInfo.encrypted || false
        } : null,
        documents: firebaseData.documents ? Object.keys(firebaseData.documents).map(docId => ({
            id: docId,
            ...firebaseData.documents[docId]
        })) : [],
        phoneNumber: firebaseData.phoneNumber || firebaseData.phone || '',
        startDate: parseTimestamp(firebaseData.startDate || firebaseData.hireDate)
    };

    // Computed properties
    employee.fullName = `${employee.firstName} ${employee.lastName}`.trim();
    employee.workStatus = getWorkStatus(employee.status);
    employee.yearsOfService = calculateYearsOfService(employee.hireDate);
    employee.displayName = employee.fullName || employee.email || 'Unknown Employee';

    return employee;
};

/**
 * Transform employee data from frontend format to Firebase format
 * @param {Object} frontendData - Employee data from frontend
 * @returns {Object} Transformed employee data for Firebase storage
 */
export const transformEmployeeToFirebase = (frontendData) => {
    if (!frontendData) return null;

    const firebaseData = {
        firstName: frontendData.firstName || '',
        lastName: frontendData.lastName || '',
        email: frontendData.email || '',
        phone: frontendData.phone || '',
        position: frontendData.position || '',
        departmentId: frontendData.departmentId || null,
        department: frontendData.department || '',
        status: frontendData.status || 'active',
        salary: Number(frontendData.salary) || 0,
        address: frontendData.address || '',
        city: frontendData.city || '',
        state: frontendData.state || '',
        zipCode: frontendData.zipCode || '',
        country: frontendData.country || '',
        emergencyContact: {
            name: frontendData.emergencyContact?.name || '',
            relationship: frontendData.emergencyContact?.relationship || '',
            phone: frontendData.emergencyContact?.phone || ''
        },
        emergencyContacts: Array.isArray(frontendData.emergencyContacts) ? frontendData.emergencyContacts : [],
        skills: Array.isArray(frontendData.skills) ? frontendData.skills : [],
        certifications: Array.isArray(frontendData.certifications) ? frontendData.certifications : [],
        notes: frontendData.notes || '',
        managerId: frontendData.managerId || null,
        profilePicture: frontendData.profilePicture || '',
        workSchedule: {
            monday: frontendData.workSchedule?.monday || { start: '', end: '', off: false },
            tuesday: frontendData.workSchedule?.tuesday || { start: '', end: '', off: false },
            wednesday: frontendData.workSchedule?.wednesday || { start: '', end: '', off: false },
            thursday: frontendData.workSchedule?.thursday || { start: '', end: '', off: false },
            friday: frontendData.workSchedule?.friday || { start: '', end: '', off: false },
            saturday: frontendData.workSchedule?.saturday || { start: '', end: '', off: true },
            sunday: frontendData.workSchedule?.sunday || { start: '', end: '', off: true }
        },
        benefits: {
            healthInsurance: Boolean(frontendData.benefits?.healthInsurance),
            dentalInsurance: Boolean(frontendData.benefits?.dentalInsurance),
            visionInsurance: Boolean(frontendData.benefits?.visionInsurance),
            retirement401k: Boolean(frontendData.benefits?.retirement401k),
            paidTimeOff: Number(frontendData.benefits?.paidTimeOff) || 0,
            sickLeave: Number(frontendData.benefits?.sickLeave) || 0
        },
        performance: {
            lastReview: frontendData.performance?.lastReview || null,
            nextReview: frontendData.performance?.nextReview || null,
            rating: Number(frontendData.performance?.rating) || 0,
            goals: Array.isArray(frontendData.performance?.goals) ? frontendData.performance.goals : []
        },
        updatedAt: new Date().toISOString(),
        userId: frontendData.userId || null,
        phoneNumber: frontendData.phoneNumber || frontendData.phone || ''
    };

    // Handle onboarding information
    if (frontendData.onboarding) {
        firebaseData.onboarding = {
            status: frontendData.onboarding.status || 'not_started',
            progress: Number(frontendData.onboarding.progress) || 0,
            startDate: frontendData.onboarding.startDate instanceof Date
                ? frontendData.onboarding.startDate.toISOString()
                : (frontendData.onboarding.startDate ? new Date(frontendData.onboarding.startDate).toISOString() : null),
            completedDate: frontendData.onboarding.completedDate instanceof Date
                ? frontendData.onboarding.completedDate.toISOString()
                : (frontendData.onboarding.completedDate ? new Date(frontendData.onboarding.completedDate).toISOString() : null),
            assignedTasks: frontendData.onboarding.assignedTasks || {}
        };
    }

    // Handle banking information (should be encrypted before sending)
    if (frontendData.bankingInfo) {
        firebaseData.bankingInfo = {
            accountNumber: frontendData.bankingInfo.accountNumber || '',
            routingNumber: frontendData.bankingInfo.routingNumber || '',
            bankName: frontendData.bankingInfo.bankName || '',
            accountType: frontendData.bankingInfo.accountType || 'checking',
            encrypted: Boolean(frontendData.bankingInfo.encrypted)
        };
    }

    // Handle tax information (should be encrypted before sending)
    if (frontendData.taxInfo) {
        firebaseData.taxInfo = {
            ssn: frontendData.taxInfo.ssn || '',
            filingStatus: frontendData.taxInfo.filingStatus || 'single',
            allowances: Number(frontendData.taxInfo.allowances) || 0,
            additionalWithholding: Number(frontendData.taxInfo.additionalWithholding) || 0,
            encrypted: Boolean(frontendData.taxInfo.encrypted)
        };
    }

    // Convert documents array to object format for Firebase
    if (Array.isArray(frontendData.documents)) {
        firebaseData.documents = {};
        frontendData.documents.forEach((doc, index) => {
            if (doc && doc.id) {
                firebaseData.documents[doc.id] = {
                    type: doc.type || 'other',
                    name: doc.name || '',
                    url: doc.url || '',
                    uploadDate: doc.uploadDate || new Date().toISOString(),
                    status: doc.status || 'pending',
                    uploadedBy: doc.uploadedBy || ''
                };
            }
        });
    }

    // Add start date if provided
    if (frontendData.startDate) {
        firebaseData.startDate = frontendData.startDate instanceof Date
            ? frontendData.startDate.toISOString()
            : new Date(frontendData.startDate).toISOString();
    }

    // Handle dates
    if (frontendData.hireDate) {
        firebaseData.hireDate = frontendData.hireDate instanceof Date
            ? frontendData.hireDate.toISOString()
            : new Date(frontendData.hireDate).toISOString();
    }

    if (frontendData.terminationDate) {
        firebaseData.terminationDate = frontendData.terminationDate instanceof Date
            ? frontendData.terminationDate.toISOString()
            : new Date(frontendData.terminationDate).toISOString();
    }

    // Add employeeId if provided
    if (frontendData.employeeId) {
        firebaseData.employeeId = frontendData.employeeId;
    }

    // Add createdAt if it's a new employee
    if (!frontendData.id && !frontendData.createdAt) {
        firebaseData.createdAt = new Date().toISOString();
    }

    return firebaseData;
};

/**
 * Transform a list of employees from Firebase format
 * @param {Object} employeesObject - Object with employee IDs as keys
 * @returns {Array} Array of transformed employee objects
 */
export const transformEmployeesList = (employeesObject) => {
    if (!employeesObject || typeof employeesObject !== 'object') {
        return [];
    }

    return Object.entries(employeesObject)
        .map(([id, employeeData]) => {
            if (!employeeData || typeof employeeData !== 'object') {
                return null;
            }

            const employee = transformEmployeeFromFirebase({
                id,
                ...employeeData
            });

            return employee;
        })
        .filter(employee => employee !== null)
        .sort((a, b) => {
            // Sort by last name, then first name
            const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
            if (lastNameCompare !== 0) {
                return lastNameCompare;
            }
            return (a.firstName || '').localeCompare(b.firstName || '');
        });
};

/**
 * Get work status display text
 * @param {string} status - Employee status
 * @returns {Object} Status display info
 */
export const getWorkStatus = (status) => {
    const statusMap = {
        'active': { text: 'Active', color: 'success', icon: 'check-circle' },
        'inactive': { text: 'Inactive', color: 'warning', icon: 'pause-circle' },
        'on_leave': { text: 'On Leave', color: 'info', icon: 'clock' },
        'terminated': { text: 'Terminated', color: 'danger', icon: 'x-circle' }
    };

    return statusMap[status] || statusMap['active'];
};

/**
 * Calculate years of service
 * @param {Date} hireDate - Hire date
 * @returns {number} Years of service
 */
export const calculateYearsOfService = (hireDate) => {
    if (!hireDate || !(hireDate instanceof Date)) {
        return 0;
    }

    const now = new Date();
    const yearsDiff = now.getFullYear() - hireDate.getFullYear();
    const monthDiff = now.getMonth() - hireDate.getMonth();

    // Adjust if anniversary hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hireDate.getDate())) {
        return yearsDiff - 1;
    }

    return yearsDiff;
};

/**
 * Validate employee data
 * @param {Object} employeeData - Employee data to validate
 * @returns {Object} Validation result with errors
 */
export const validateEmployeeData = (employeeData) => {
    const errors = [];

    if (!employeeData.firstName || employeeData.firstName.trim().length === 0) {
        errors.push('First name is required');
    }

    if (!employeeData.lastName || employeeData.lastName.trim().length === 0) {
        errors.push('Last name is required');
    }

    if (!employeeData.email || employeeData.email.trim().length === 0) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeData.email)) {
        errors.push('Invalid email format');
    }

    if (!employeeData.position || employeeData.position.trim().length === 0) {
        errors.push('Position is required');
    }

    if (!employeeData.departmentId) {
        errors.push('Department is required');
    }

    if (employeeData.phone && !/^[\d\s\-\+\(\)]+$/.test(employeeData.phone)) {
        errors.push('Invalid phone number format');
    }

    if (employeeData.salary && (isNaN(employeeData.salary) || Number(employeeData.salary) < 0)) {
        errors.push('Salary must be a valid positive number');
    }

    if (employeeData.hireDate && !(employeeData.hireDate instanceof Date || !isNaN(Date.parse(employeeData.hireDate)))) {
        errors.push('Invalid hire date');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Format employee data for display in tables or lists
 * @param {Object} employee - Employee object
 * @returns {Object} Formatted employee data for display
 */
export const formatEmployeeForDisplay = (employee) => {
    if (!employee) return null;

    return {
        id: employee.id,
        name: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        status: employee.workStatus,
        hireDate: employee.hireDate?.toLocaleDateString(),
        yearsOfService: employee.yearsOfService,
        salary: employee.salary ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(employee.salary) : 'Not specified',
        profilePicture: employee.profilePicture
    };
};

/**
 * Generate unique employee ID
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Generated employee ID
 */
export const generateEmployeeId = (firstName, lastName) => {
    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `${initials}${timestamp}`;
};

// Export all functions for easy importing
export default {
    transformEmployeeFromFirebase,
    transformEmployeeToFirebase,
    transformEmployeesList,
    getWorkStatus,
    calculateYearsOfService,
    validateEmployeeData,
    formatEmployeeForDisplay,
    generateEmployeeId
};