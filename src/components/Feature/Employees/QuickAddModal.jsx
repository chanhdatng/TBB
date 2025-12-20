import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    UserPlus,
    Loader2,
    AlertCircle,
    User,
    Mail,
    Phone,
    Briefcase,
    Building,
    Check
} from 'lucide-react';
import { scaleVariants, backdropVariants } from '../../../utils/animations';
import { useEmployees } from '../../../contexts/EmployeeContext';
import { useToast } from '../../../contexts/ToastContext';
import { employeeService } from '../../../services/employeeService';

const POSITIONS = [
    { value: 'admin', label: 'Admin', department: 'Management' },
    { value: 'manager', label: 'Manager', department: 'Management' },
    { value: 'baker', label: 'Baker', department: 'Kitchen' },
    { value: 'sales', label: 'Sales Staff', department: 'Sales' },
    { value: 'delivery', label: 'Delivery', department: 'Logistics' }
];

const DEPARTMENTS = [
    { value: 'management', label: 'Management' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'sales', label: 'Sales' },
    { value: 'logistics', label: 'Logistics' }
];

const QuickAddModal = ({ isOpen, onClose, onSuccess }) => {
    const { refreshEmployees } = useEmployees();
    const { showToast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        department: ''
    });

    // UI state
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);



    // Reset form
    const resetForm = useCallback(() => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            position: '',
            department: ''
        });
        setErrors({});
        setShowSuccess(false);
    }, []);

    // Handle input changes
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-select department based on position
        if (name === 'position') {
            const selectedPosition = POSITIONS.find(p => p.value === value);
            if (selectedPosition) {
                const departmentValue = selectedPosition.department.toLowerCase();
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    department: departmentValue
                }));
            }
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    // Validate form
    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        }

        if (!formData.position) {
            newErrors.position = 'Position is required';
        }

        if (!formData.department) {
            newErrors.department = 'Department is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);



    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare employee data
            const employeeData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                position: formData.position,
                positionId: formData.position,
                department: formData.department,
                departmentId: formData.department,
                status: 'active',
                hireDate: new Date().toISOString().split('T')[0]
            };

            // Create employee without user account
            const result = await employeeService.createEmployee(employeeData);

            if (result.success) {
                setShowSuccess(true);
                refreshEmployees();

                showToast(`Employee ${formData.firstName} ${formData.lastName} created successfully!`, 'success');

                // Notify parent component
                onSuccess?.(result.employee);

                // Auto-close modal after 2 seconds
                setTimeout(() => {
                    onClose();
                    resetForm();
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to create employee');
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            setErrors({ submit: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
        resetForm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        variants={scaleVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="bg-white rounded-2xl max-w-lg w-full shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <UserPlus className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Quick Add Employee</h2>
                                    <p className="text-sm text-gray-600">Add basic employee info in seconds</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                disabled={isSubmitting}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {showSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Employee Created Successfully!
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {formData.firstName} {formData.lastName} has been added to the employee list.
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        This window will close automatically in 2 seconds
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Error Message */}
                                    {errors.submit && (
                                        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
                                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                            <p className="text-sm">{errors.submit}</p>
                                        </div>
                                    )}

                                    {/* Name Fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    placeholder="John"
                                                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                                                        errors.firstName ? 'border-red-300' : 'border-gray-200'
                                                    }`}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            {errors.firstName && (
                                                <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    placeholder="Doe"
                                                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                                                        errors.lastName ? 'border-red-300' : 'border-gray-200'
                                                    }`}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            {errors.lastName && (
                                                <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="john@example.com"
                                                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                                                    errors.email ? 'border-red-300' : 'border-gray-200'
                                                }`}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Phone <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+84 123 456 789"
                                                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${
                                                    errors.phone ? 'border-red-300' : 'border-gray-200'
                                                }`}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                        )}
                                    </div>

                                    {/* Position */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Position <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <select
                                                name="position"
                                                value={formData.position}
                                                onChange={handleInputChange}
                                                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors appearance-none ${
                                                    errors.position ? 'border-red-300' : 'border-gray-200'
                                                }`}
                                                disabled={isSubmitting}
                                            >
                                                <option value="">Select Position</option>
                                                {POSITIONS.map(pos => (
                                                    <option key={pos.value} value={pos.value}>
                                                        {pos.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.position && (
                                            <p className="mt-1 text-xs text-red-600">{errors.position}</p>
                                        )}
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleInputChange}
                                                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors appearance-none ${
                                                    errors.department ? 'border-red-300' : 'border-gray-200'
                                                }`}
                                                disabled={isSubmitting}
                                            >
                                                <option value="">Select Department</option>
                                                {DEPARTMENTS.map(dept => (
                                                    <option key={dept.value} value={dept.value}>
                                                        {dept.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.department && (
                                            <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                                        )}
                                    </div>

                                    {/* Info Message */}
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                                            <div className="text-sm text-blue-800">
                                                <p className="font-medium mb-1">Quick Add Info:</p>
                                                <ul className="text-xs space-y-0.5">
                                                    <li>• Employee status will be set to "Active"</li>
                                                    <li>• Hire date will be set to today</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </form>

                        {/* Actions */}
                        {!showSuccess && (
                            <div className="flex gap-3 p-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium flex items-center justify-center gap-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Quick Add
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickAddModal;