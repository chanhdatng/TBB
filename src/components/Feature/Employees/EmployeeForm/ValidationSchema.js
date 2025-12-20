/**
 * Employee Form Validation Schema
 * Validation rules and error messages for employee form fields
 */

/**
 * Validate personal information
 * @param {Object} data - Personal info data
 * @returns {Object} Validation result with errors
 */
export const validatePersonalInfo = (data) => {
    const errors = {};

    // First Name validation
    if (!data.firstName || data.firstName.trim().length === 0) {
        errors.firstName = 'First name is required';
    } else if (data.firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
    } else if (data.firstName.trim().length > 50) {
        errors.firstName = 'First name must be less than 50 characters';
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s\-']+$/.test(data.firstName)) {
        errors.firstName = 'First name contains invalid characters';
    }

    // Last Name validation
    if (!data.lastName || data.lastName.trim().length === 0) {
        errors.lastName = 'Last name is required';
    } else if (data.lastName.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters';
    } else if (data.lastName.trim().length > 50) {
        errors.lastName = 'Last name must be less than 50 characters';
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s\-']+$/.test(data.lastName)) {
        errors.lastName = 'Last name contains invalid characters';
    }

    // Email validation
    if (!data.email || data.email.trim().length === 0) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Invalid email format';
    } else if (data.email.length > 100) {
        errors.email = 'Email must be less than 100 characters';
    }

    // Phone validation
    if (!data.phone || data.phone.trim().length === 0) {
        errors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
        errors.phone = 'Phone number can only contain digits, spaces, hyphens, and parentheses';
    } else if (data.phone.replace(/\D/g, '').length < 9) {
        errors.phone = 'Phone number must be at least 9 digits';
    } else if (data.phone.replace(/\D/g, '').length > 15) {
        errors.phone = 'Phone number cannot exceed 15 digits';
    }

    // Address validation (optional but if provided, must be valid)
    if (data.address && data.address.trim().length > 200) {
        errors.address = 'Address must be less than 200 characters';
    }

    // City validation (optional)
    if (data.city && data.city.trim().length > 50) {
        errors.city = 'City must be less than 50 characters';
    }

    // State/Province validation (optional)
    if (data.state && data.state.trim().length > 50) {
        errors.state = 'State must be less than 50 characters';
    }

    // Zip Code validation (optional)
    if (data.zipCode && !/^[\d\s\-\A-Z a-z]{0,10}$/.test(data.zipCode)) {
        errors.zipCode = 'Invalid zip code format';
    }

    // Country validation (optional)
    if (data.country && data.country.trim().length > 50) {
        errors.country = 'Country must be less than 50 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate employment information
 * @param {Object} data - Employment info data
 * @returns {Object} Validation result with errors
 */
export const validateEmploymentInfo = (data) => {
    const errors = {};

    // Employee ID validation
    if (data.employeeId && !/^[A-Z0-9]{3,20}$/i.test(data.employeeId)) {
        errors.employeeId = 'Employee ID must be 3-20 alphanumeric characters';
    }

    // Position validation
    if (!data.position || data.position.trim().length === 0) {
        errors.position = 'Position is required';
    } else if (data.position.trim().length > 100) {
        errors.position = 'Position must be less than 100 characters';
    }

    // Department validation
    if (!data.departmentId) {
        errors.departmentId = 'Department is required';
    }

    // Status validation
    if (!data.status || !['active', 'inactive', 'on_leave', 'terminated'].includes(data.status)) {
        errors.status = 'Please select a valid status';
    }

    // Hire Date validation
    if (!data.hireDate) {
        errors.hireDate = 'Hire date is required';
    } else {
        const hireDate = new Date(data.hireDate);
        const today = new Date();

        if (isNaN(hireDate.getTime())) {
            errors.hireDate = 'Invalid hire date';
        } else if (hireDate > today) {
            errors.hireDate = 'Hire date cannot be in the future';
        } else if (hireDate < new Date('1900-01-01')) {
            errors.hireDate = 'Hire date is too far in the past';
        }
    }

    // Termination Date validation (optional)
    if (data.terminationDate) {
        const terminationDate = new Date(data.terminationDate);
        const hireDate = new Date(data.hireDate);

        if (isNaN(terminationDate.getTime())) {
            errors.terminationDate = 'Invalid termination date';
        } else if (terminationDate <= hireDate) {
            errors.terminationDate = 'Termination date must be after hire date';
        }
    }

    // Salary/Hourly Rate validation
    if (data.salary !== undefined && data.salary !== '') {
        const salary = parseFloat(data.salary);
        if (isNaN(salary) || salary < 0) {
            errors.salary = 'Please enter a valid positive number';
        } else if (salary > 999999999) {
            errors.salary = 'Amount exceeds maximum limit';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate emergency contact information
 * @param {Object} data - Emergency contact data
 * @returns {Object} Validation result with errors
 */
export const validateEmergencyContact = (data) => {
    const errors = {};

    // Emergency Contact Name validation
    if (!data.name || data.name.trim().length === 0) {
        errors.emergencyContactName = 'Emergency contact name is required';
    } else if (data.name.trim().length < 2) {
        errors.emergencyContactName = 'Name must be at least 2 characters';
    } else if (data.name.trim().length > 100) {
        errors.emergencyContactName = 'Name must be less than 100 characters';
    }

    // Relationship validation
    if (!data.relationship || data.relationship.trim().length === 0) {
        errors.emergencyContactRelationship = 'Relationship is required';
    } else if (data.relationship.trim().length > 50) {
        errors.emergencyContactRelationship = 'Relationship must be less than 50 characters';
    }

    // Emergency Contact Phone validation
    if (!data.phone || data.phone.trim().length === 0) {
        errors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
        errors.emergencyContactPhone = 'Phone number can only contain digits, spaces, hyphens, and parentheses';
    } else if (data.phone.replace(/\D/g, '').length < 9) {
        errors.emergencyContactPhone = 'Phone number must be at least 9 digits';
    } else if (data.phone.replace(/\D/g, '').length > 15) {
        errors.emergencyContactPhone = 'Phone number cannot exceed 15 digits';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate work schedule
 * @param {Object} data - Work schedule data
 * @returns {Object} Validation result with errors
 */
export const validateWorkSchedule = (data) => {
    const errors = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
        const daySchedule = data[day];

        if (daySchedule && !daySchedule.off) {
            // If not off, both start and end times are required
            if (!daySchedule.start || daySchedule.start.trim().length === 0) {
                errors[`${day}Start`] = 'Start time is required';
            }

            if (!daySchedule.end || daySchedule.end.trim().length === 0) {
                errors[`${day}End`] = 'End time is required';
            }

            // Validate time format
            if (daySchedule.start && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(daySchedule.start)) {
                errors[`${day}Start`] = 'Invalid time format (HH:MM)';
            }

            if (daySchedule.end && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(daySchedule.end)) {
                errors[`${day}End`] = 'Invalid time format (HH:MM)';
            }

            // Validate that end time is after start time
            if (daySchedule.start && daySchedule.end &&
                /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(daySchedule.start) &&
                /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(daySchedule.end)) {

                const [startHour, startMin] = daySchedule.start.split(':').map(Number);
                const [endHour, endMin] = daySchedule.end.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                if (endMinutes <= startMinutes) {
                    errors[`${day}End`] = 'End time must be after start time';
                }
            }
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate password for login account creation
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
    const errors = {};

    if (!password || password.trim().length === 0) {
        errors.password = 'Password is required when creating login account';
    } else if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
        errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate simplified employee form (for owners)
 * @param {Object} employeeData - Simplified employee data
 * @param {Object} options - Validation options
 * @returns {Object} Comprehensive validation result
 */
export const validateEmployeeForm = (employeeData, options = {}) => {
    const personalValidation = validatePersonalInfo(employeeData);
    const employmentValidation = validateEmploymentInfo(employeeData);

    const allErrors = {
        ...personalValidation.errors,
        ...employmentValidation.errors
    };

    // Validate password if creating login account
    if (options.createLoginAccount && employeeData.password) {
        const passwordValidation = validatePassword(employeeData.password);
        allErrors.password = passwordValidation.errors.password;
    }

    // Custom validation: Check for duplicate email
    // This would typically be checked against the database
    // For now, we'll just validate the format

    return {
        isValid: Object.keys(allErrors).length === 0,
        errors: allErrors,
        sections: {
            personal: personalValidation.isValid,
            employment: employmentValidation.isValid
        }
    };
};

/**
 * Get field error message
 * @param {Object} errors - Errors object
 * @param {string} fieldName - Field name to get error for
 * @returns {string|null} Error message or null
 */
export const getFieldError = (errors, fieldName) => {
    return errors[fieldName] || null;
};

/**
 * Check if field has error
 * @param {Object} errors - Errors object
 * @param {string} fieldName - Field name to check
 * @returns {boolean} Whether field has error
 */
export const hasFieldError = (errors, fieldName) => {
    return !!errors[fieldName];
};

/**
 * Validate file upload for employee photo
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateEmployeePhoto = (file) => {
    const errors = [];

    if (!file) {
        return { isValid: true, errors: [] }; // Photo is optional
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        errors.push('Photo must be JPEG, PNG, GIF, or WebP format');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        errors.push('Photo size must be less than 5MB');
    }

    // Check minimum dimensions (optional)
    // This would require loading the image to check dimensions

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate banking information
 * @param {Object} data - Banking info data
 * @returns {Object} Validation result with errors
 */
export const validateBankingInfo = (data) => {
    const errors = {};

    // Bank Name validation (optional but if provided, must be valid)
    if (data.bankName && data.bankName.trim().length > 100) {
        errors.bankName = 'Bank name must be less than 100 characters';
    }

    // Account Type validation (optional)
    if (data.accountType && !['checking', 'savings', 'business'].includes(data.accountType)) {
        errors.accountType = 'Invalid account type';
    }

    // Account Number validation (if provided)
    if (data.accountNumber) {
        // Remove any non-digit characters for validation
        const accountDigits = data.accountNumber.replace(/\D/g, '');
        if (accountDigits.length < 8) {
            errors.accountNumber = 'Account number must be at least 8 digits';
        } else if (accountDigits.length > 20) {
            errors.accountNumber = 'Account number cannot exceed 20 digits';
        }
    }

    // Routing Number validation (if provided)
    if (data.routingNumber) {
        // Remove any non-digit characters for validation
        const routingDigits = data.routingNumber.replace(/\D/g, '');
        if (routingDigits.length !== 9) {
            errors.routingNumber = 'Routing number must be exactly 9 digits';
        }
    }

    // SWIFT Code validation (if provided)
    if (data.swiftCode) {
        // SWIFT codes are 8 or 11 characters, letters and digits
        if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(data.swiftCode)) {
            errors.swiftCode = 'Invalid SWIFT code format';
        }
    }

    // Branch Address validation (optional)
    if (data.branchAddress && data.branchAddress.trim().length > 200) {
        errors.branchAddress = 'Branch address must be less than 200 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate tax information
 * @param {Object} data - Tax info data
 * @returns {Object} Validation result with errors
 */
export const validateTaxInfo = (data) => {
    const errors = {};

    // SSN validation (if provided)
    if (data.ssn) {
        // Check if it's encrypted
        if (!data.ssn.startsWith('enc:')) {
            // Remove all non-digits for validation
            const ssnDigits = data.ssn.replace(/\D/g, '');
            if (ssnDigits.length !== 9) {
                errors.ssn = 'SSN must be 9 digits';
            } else {
                // Validate SSN format (XXX-XX-XXXX)
                const ssnPattern = /^(?!000|666|9)\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/;
                if (!ssnPattern.test(data.ssn)) {
                    errors.ssn = 'Invalid SSN format';
                }
            }
        }
    }

    // Tax ID validation (if provided)
    if (data.taxId) {
        if (!data.taxId.startsWith('enc:')) {
            // Remove all non-digits for validation
            const taxIdDigits = data.taxId.replace(/\D/g, '');
            if (taxIdDigits.length !== 9) {
                errors.taxId = 'Tax ID must be 9 digits';
            }
        }
    }

    // Filing Status validation (required if tax info is provided)
    if (data.filingStatus && !['single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_widow'].includes(data.filingStatus)) {
        errors.filingStatus = 'Invalid filing status';
    }

    // Allowances validation
    if (data.allowances !== undefined) {
        const allowances = parseInt(data.allowances);
        if (isNaN(allowances) || allowances < 0 || allowances > 99) {
            errors.allowances = 'Allowances must be between 0 and 99';
        }
    }

    // Additional Withholding validation
    if (data.additionalWithholding !== undefined && data.additionalWithholding !== '') {
        const withholding = parseFloat(data.additionalWithholding);
        if (isNaN(withholding) || withholding < 0) {
            errors.additionalWithholding = 'Additional withholding must be a positive number';
        } else if (withholding > 999999) {
            errors.additionalWithholding = 'Amount exceeds maximum limit';
        }
    }

    // State of Residence validation (optional)
    if (data.stateOfResidence && data.stateOfResidence.trim().length > 100) {
        errors.stateOfResidence = 'State of residence must be less than 100 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate emergency contacts
 * @param {Array} contacts - Array of emergency contact objects
 * @returns {Object} Validation result with errors
 */
export const validateEmergencyContacts = (contacts) => {
    const errors = {};

    if (!contacts || contacts.length === 0) {
        errors.emergencyContacts = 'At least one emergency contact is required';
        return { isValid: false, errors };
    }

    // Check if primary contact exists
    const hasPrimary = contacts.some(contact => contact.isPrimary);
    if (!hasPrimary) {
        errors.emergencyContacts = 'A primary emergency contact must be designated';
    }

    // Validate each contact
    contacts.forEach((contact, index) => {
        const prefix = `emergencyContacts[${index}]`;

        // Name validation
        if (!contact.name || contact.name.trim().length === 0) {
            errors[`${prefix}.name`] = 'Contact name is required';
        } else if (contact.name.trim().length < 2) {
            errors[`${prefix}.name`] = 'Name must be at least 2 characters';
        } else if (contact.name.trim().length > 100) {
            errors[`${prefix}.name`] = 'Name must be less than 100 characters';
        }

        // Relationship validation
        if (!contact.relationship || contact.relationship.trim().length === 0) {
            errors[`${prefix}.relationship`] = 'Relationship is required';
        }

        // Phone validation
        if (!contact.phone || contact.phone.trim().length === 0) {
            errors[`${prefix}.phone`] = 'Phone number is required';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(contact.phone)) {
            errors[`${prefix}.phone`] = 'Phone number can only contain digits, spaces, hyphens, and parentheses';
        } else if (contact.phone.replace(/\D/g, '').length < 9) {
            errors[`${prefix}.phone`] = 'Phone number must be at least 9 digits';
        } else if (contact.phone.replace(/\D/g, '').length > 15) {
            errors[`${prefix}.phone`] = 'Phone number cannot exceed 15 digits';
        }

        // Email validation (optional but if provided, must be valid)
        if (contact.email && contact.email.trim().length > 0) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
                errors[`${prefix}.email`] = 'Invalid email format';
            } else if (contact.email.length > 100) {
                errors[`${prefix}.email`] = 'Email must be less than 100 characters';
            }
        }

        // Address validation (optional)
        if (contact.address && contact.address.trim().length > 200) {
            errors[`${prefix}.address`] = 'Address must be less than 200 characters';
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate onboarding information
 * @param {Object} data - Onboarding info data
 * @returns {Object} Validation result with errors
 */
export const validateOnboardingInfo = (data) => {
    const errors = {};

    // Start Date validation (optional)
    if (data.startDate) {
        const startDate = new Date(data.startDate);
        if (isNaN(startDate.getTime())) {
            errors.startDate = 'Invalid start date';
        }
    }

    // Duration validation
    if (data.duration) {
        const duration = parseInt(data.duration);
        if (isNaN(duration) || duration < 1 || duration > 90) {
            errors.duration = 'Duration must be between 1 and 90 days';
        }
    }

    // Location validation (optional)
    if (data.location && !['office', 'remote', 'hybrid'].includes(data.location)) {
        errors.location = 'Invalid onboarding location';
    }

    // Buddy validation (optional but if provided, must have id)
    if (data.buddy && typeof data.buddy === 'object' && !data.buddy.id) {
        errors.buddy = 'Invalid buddy selection';
    }

    // Preferences validation (optional)
    if (data.preferences && !Array.isArray(data.preferences)) {
        errors.preferences = 'Preferences must be an array';
    }

    // Special Requirements validation (optional)
    if (data.specialRequirements && data.specialRequirements.trim().length > 500) {
        errors.specialRequirements = 'Special requirements must be less than 500 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate document requirements
 * @param {Object} documents - Documents object
 * @param {Array} requiredDocumentTypes - Array of required document types
 * @returns {Object} Validation result with errors
 */
export const validateDocumentRequirements = (documents, requiredDocumentTypes = []) => {
    const errors = {};
    const warnings = [];

    if (!documents) {
        errors.documents = 'No document information provided';
        return { isValid: false, errors, warnings };
    }

    // Check required documents
    const requiredDocs = requiredDocumentTypes.filter(doc => doc.required);
    const uploadedDocTypes = documents.uploaded?.map(doc => doc.documentTypeId) || [];

    requiredDocs.forEach(reqDoc => {
        if (!uploadedDocTypes.includes(reqDoc.id)) {
            warnings.push(`${reqDoc.name} is required but not uploaded`);
        }
    });

    // Validate uploaded documents
    if (documents.uploaded) {
        documents.uploaded.forEach((doc, index) => {
            // Check if document has required fields
            if (!doc.name) {
                errors[`documents.uploaded[${index}].name`] = 'Document name is required';
            }
            if (!doc.url) {
                errors[`documents.uploaded[${index}].url`] = 'Document URL is required';
            }
            if (!doc.documentTypeId) {
                errors[`documents.uploaded[${index}].type`] = 'Document type is required';
            }
        });
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
        completion: requiredDocs.length > 0 ? Math.round((uploadedDocTypes.filter(id =>
            requiredDocs.find(req => req.id === id)
        ).length / requiredDocs.length) * 100) : 100
    };
};

export default {
    validatePersonalInfo,
    validateEmploymentInfo,
    validateEmergencyContact,
    validateWorkSchedule,
    validateEmployeeForm,
    validatePassword,
    getFieldError,
    hasFieldError,
    validateEmployeePhoto,
    validateBankingInfo,
    validateTaxInfo,
    validateEmergencyContacts,
    validateOnboardingInfo,
    validateDocumentRequirements
};