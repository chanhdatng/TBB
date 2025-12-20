const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');
const he = require('he');

/**
 * Sanitize and validate input data
 */
class InputValidator {
    /**
     * Sanitize string input
     */
    static sanitizeString(input, options = {}) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Decode HTML entities
        let sanitized = he.decode(input);

        // Remove any HTML tags
        sanitized = DOMPurify.sanitize(sanitized, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
        });

        // Trim whitespace
        sanitized = sanitized.trim();

        // Apply length limits
        if (options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }

        return sanitized;
    }

    /**
     * Validate and sanitize email
     */
    static sanitizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return null;
        }

        const sanitized = this.sanitizeString(email.toLowerCase().trim());

        if (validator.isEmail(sanitized)) {
            return sanitized;
        }

        return null;
    }

    /**
     * Validate and sanitize phone number
     */
    static sanitizePhone(phone) {
        if (!phone) {
            return null;
        }

        // Remove all non-digit characters except + for international numbers
        const sanitized = phone.toString().replace(/[^\d+]/g, '');

        // Validate phone number format
        if (validator.isMobilePhone(sanitized, 'any', { strictMode: false })) {
            return sanitized;
        }

        return null;
    }

    /**
     * Validate role
     */
    static validateRole(role) {
        const validRoles = ['admin', 'manager', 'staff'];
        return validRoles.includes(role) ? role : null;
    }

    /**
     * Validate status
     */
    static validateStatus(status) {
        const validStatuses = ['active', 'inactive', 'onLeave'];
        return validStatuses.includes(status) ? status : 'active';
    }

    /**
     * Validate UUID
     */
    static validateUUID(uuid) {
        if (typeof uuid !== 'string') {
            return null;
        }

        const sanitized = this.sanitizeString(uuid);
        return validator.isUUID(sanitized, 4) ? sanitized : null;
    }

    /**
     * Validate and sanitize employee data
     */
    static validateEmployeeData(data) {
        const errors = [];
        const sanitized = {};

        // First name
        if (data.firstName) {
            sanitized.firstName = this.sanitizeString(data.firstName, { maxLength: 50 });
            if (!sanitized.firstName || sanitized.firstName.length < 1) {
                errors.push('First name is required');
            }
        } else {
            errors.push('First name is required');
        }

        // Last name
        if (data.lastName) {
            sanitized.lastName = this.sanitizeString(data.lastName, { maxLength: 50 });
            if (!sanitized.lastName || sanitized.lastName.length < 1) {
                errors.push('Last name is required');
            }
        } else {
            errors.push('Last name is required');
        }

        // Email
        if (data.email) {
            sanitized.email = this.sanitizeEmail(data.email);
            if (!sanitized.email) {
                errors.push('Valid email is required');
            }
        } else {
            errors.push('Email is required');
        }

        // Role
        if (data.role) {
            sanitized.role = this.validateRole(data.role);
            if (!sanitized.role) {
                errors.push('Valid role is required (admin, manager, or staff)');
            }
        } else {
            errors.push('Role is required');
        }

        // Department ID
        if (data.departmentId) {
            sanitized.departmentId = this.validateUUID(data.departmentId);
            if (!sanitized.departmentId) {
                errors.push('Valid department ID is required');
            }
        } else {
            errors.push('Department ID is required');
        }

        // Status (optional)
        if (data.status) {
            sanitized.status = this.validateStatus(data.status);
        } else {
            sanitized.status = 'active';
        }

        // Phone number (optional)
        if (data.phoneNumber) {
            const sanitizedPhone = this.sanitizePhone(data.phoneNumber);
            if (sanitizedPhone) {
                sanitized.phoneNumber = sanitizedPhone;
            } else {
                errors.push('Invalid phone number format');
            }
        }

        // Address (optional)
        if (data.address) {
            sanitized.address = this.sanitizeString(data.address, { maxLength: 200 });
        }

        // Emergency contact (optional)
        if (data.emergencyContact) {
            sanitized.emergencyContact = {
                name: this.sanitizeString(data.emergencyContact.name, { maxLength: 100 }),
                phone: this.sanitizePhone(data.emergencyContact.phone),
                relationship: this.sanitizeString(data.emergencyContact.relationship, { maxLength: 50 })
            };

            // Validate emergency contact
            if (!sanitized.emergencyContact.name || !sanitized.emergencyContact.phone) {
                errors.push('Emergency contact name and phone are required');
            }
        }

        // Salary (only for admins)
        if (data.salary !== undefined) {
            const salary = parseFloat(data.salary);
            if (isNaN(salary) || salary < 0) {
                errors.push('Salary must be a valid positive number');
            } else {
                sanitized.salary = salary;
            }
        }

        // Start date (optional)
        if (data.startDate) {
            if (validator.isISO8601(data.startDate, { strict: true })) {
                sanitized.startDate = data.startDate;
            } else {
                errors.push('Invalid start date format');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: sanitized
        };
    }

    /**
     * Sanitize query parameters
     */
    static sanitizeQueryParams(query) {
        const sanitized = {};

        if (query.search) {
            sanitized.search = this.sanitizeString(query.search, { maxLength: 100 });
        }

        if (query.role) {
            sanitized.role = this.validateRole(query.role);
        }

        if (query.status) {
            sanitized.status = this.validateStatus(query.status);
        }

        if (query.departmentId) {
            sanitized.departmentId = this.validateUUID(query.departmentId);
        }

        if (query.limit) {
            const limit = parseInt(query.limit);
            sanitized.limit = (!isNaN(limit) && limit > 0 && limit <= 100) ? limit : 20;
        }

        if (query.offset) {
            const offset = parseInt(query.offset);
            sanitized.offset = (!isNaN(offset) && offset >= 0) ? offset : 0;
        }

        if (query.sortBy) {
            const allowedSortFields = ['firstName', 'lastName', 'email', 'role', 'createdAt', 'status'];
            sanitized.sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        }

        if (query.sortOrder) {
            sanitized.sortOrder = ['asc', 'desc'].includes(query.sortOrder.toLowerCase())
                ? query.sortOrder.toLowerCase()
                : 'desc';
        }

        return sanitized;
    }

    /**
     * Check for SQL injection patterns
     */
    static detectSQLInjection(input) {
        if (!input || typeof input !== 'string') {
            return false;
        }

        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
            /(--|\/\*|\*\/|;|'|"/),
            /(\bOR\b.*=.*\bOR\b)/i,
            /(\bAND\b.*=.*\bAND\b)/i,
            /(\bWHERE\b.*\b1\s*=\s*1)/i
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Check for XSS patterns
     */
    static detectXSS(input) {
        if (!input || typeof input !== 'string') {
            return false;
        }

        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<img[^>]*src[^>]*javascript:/gi,
            /eval\s*\(/gi,
            /setTimeout\s*\(/gi,
            /setInterval\s*\(/gi
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Comprehensive security check
     */
    static securityCheck(input) {
        if (!input || typeof input !== 'string') {
            return { safe: true, issues: [] };
        }

        const issues = [];

        if (this.detectSQLInjection(input)) {
            issues.push('SQL injection detected');
        }

        if (this.detectXSS(input)) {
            issues.push('XSS pattern detected');
        }

        if (input.length > 10000) {
            issues.push('Input too long');
        }

        return {
            safe: issues.length === 0,
            issues
        };
    }
}

module.exports = InputValidator;