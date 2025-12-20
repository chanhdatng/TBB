import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Save,
    Loader2,
    AlertCircle,
    User,
    Briefcase,
    Phone,
    Mail,
    MapPin,
    Calendar,
    DollarSign,
    Clock,
    FileText,
    Upload,
    Eye,
    EyeOff,
    Check
} from 'lucide-react';
import { scaleVariants, backdropVariants } from '../../../utils/animations';
import { employeeService } from '../../../services/employeeService';

import {
    validateEmployeeForm,
    validatePassword,
    getFieldError,
    validateDocumentRequirements
} from './ValidationSchema';
import PhotoUpload from './PhotoUpload';
import RoleSelector from './RoleSelector';
import DocumentsTab from './DocumentsTab';

const EmployeeForm = ({
    isOpen,
    onClose,
    onSave,
    editingEmployee,
    addToast
}) => {
    // Form state
    const [formData, setFormData] = useState({
        // Personal Information
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Vietnam',

        // Employment Information
        employeeId: '',
        position: '',
        positionId: '',
        department: '',
        departmentId: '',
        status: 'active',
        hireDate: '',
        salary: '',

        // Documents
        documents: {
            uploaded: [],
            required: [],
            pending: []
        },

        // Other
        notes: '',
        profilePicture: null
    });

    // Login account creation state
    const [createLoginAccount, setCreateLoginAccount] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
    const [lastSaved, setLastSaved] = useState(null);
    const formRef = useRef(null);
    const autoSaveTimeoutRef = useRef(null);

    // Tab configuration - Simplified for owner use
    const tabs = [
        {
            id: 'personal',
            label: 'Personal Info',
            icon: User,
            description: 'Basic personal details',
            isRequired: true
        },
        {
            id: 'employment',
            label: 'Employment Details',
            icon: Briefcase,
            description: 'Job-related information',
            isRequired: true
        },
        {
            id: 'documents',
            label: 'Documents',
            icon: Upload,
            description: 'Upload documents (optional)',
            isRequired: false
        }
    ];

    // Status options
    const STATUS_OPTIONS = [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'yellow' },
        { value: 'on_leave', label: 'On Leave', color: 'blue' },
        { value: 'terminated', label: 'Terminated', color: 'red' }
    ];

    // Generate random password
    const generatePassword = useCallback(() => {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setGeneratedPassword(password);
        return password;
    }, []);

    // Generate password on component mount if creating new employee
    useEffect(() => {
        if (!editingEmployee && createLoginAccount && !generatedPassword) {
            generatePassword();
        }
    }, [editingEmployee, createLoginAccount, generatedPassword, generatePassword]);

    // Auto-save functionality
    const saveDraft = useCallback(async () => {
        if (!isOpen) return;

        setAutoSaveStatus('saving');
        try {
            // Save to localStorage for drafts
            const draftKey = editingEmployee
                ? `employee_draft_${editingEmployee.id}`
                : 'employee_draft_new';

            localStorage.setItem(draftKey, JSON.stringify({
                formData,
                lastSaved: new Date().toISOString()
            }));

            setLastSaved(new Date());
            setAutoSaveStatus('saved');
        } catch (error) {
            console.error('Error saving draft:', error);
            setAutoSaveStatus('error');
        }
    }, [formData, editingEmployee, isOpen]);

    // Debounced auto-save
    useEffect(() => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            saveDraft();
        }, 2000); // Save after 2 seconds of inactivity

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [formData, saveDraft]);

    // Load draft on mount
    useEffect(() => {
        if (!editingEmployee && isOpen) {
            try {
                const draft = localStorage.getItem('employee_draft_new');
                if (draft) {
                    const { formData: draftData, lastSaved: savedTime } = JSON.parse(draft);
                    setFormData(prev => ({ ...prev, ...draftData }));
                    setLastSaved(new Date(savedTime));
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }, [editingEmployee, isOpen]);

    // Initialize form with employee data if editing
    useEffect(() => {
        if (editingEmployee) {
            setFormData({
                firstName: editingEmployee.firstName || '',
                lastName: editingEmployee.lastName || '',
                email: editingEmployee.email || '',
                phone: editingEmployee.phone || '',
                address: editingEmployee.address || '',
                city: editingEmployee.city || '',
                state: editingEmployee.state || '',
                zipCode: editingEmployee.zipCode || '',
                country: editingEmployee.country || 'Vietnam',
                employeeId: editingEmployee.employeeId || '',
                position: editingEmployee.position || '',
                positionId: editingEmployee.positionId || '',
                department: editingEmployee.department || '',
                departmentId: editingEmployee.departmentId || '',
                status: editingEmployee.status || 'active',
                hireDate: editingEmployee.hireDate ?
                    new Date(editingEmployee.hireDate).toISOString().split('T')[0] : '',
                salary: editingEmployee.salary || '',
                documents: editingEmployee.documents || {
                    uploaded: [],
                    required: [],
                    pending: []
                },
                notes: editingEmployee.notes || '',
                profilePicture: editingEmployee.profilePicture || null
            });
        } else {
            // Reset form for new employee
            handleReset();
        }
    }, [editingEmployee, isOpen]);

    // Calculate section completion for progress indicator
    const getSectionCompletion = useCallback(() => {
        return tabs.map(tab => {
            let isComplete = false;
            let hasErrors = false;

            switch (tab.id) {
                case 'personal':
                    isComplete = !!(formData.firstName && formData.lastName && formData.email && formData.phone);
                    hasErrors = !!(errors.firstName || errors.lastName || errors.email || errors.phone);
                    break;
                case 'employment':
                    isComplete = !!(formData.position && formData.departmentId && formData.hireDate && formData.status);
                    hasErrors = !!(errors.position || errors.departmentId || errors.hireDate || errors.status);
                    break;
                case 'documents':
                    isComplete = true; // Documents are optional in simplified version
                    hasErrors = !!Object.keys(errors).filter(key => key.startsWith('document')).length;
                    break;
                default:
                    isComplete = false;
                    hasErrors = false;
            }

            return {
                ...tab,
                isComplete,
                hasErrors
            };
        });
    }, [formData, errors, tabs]);

    // Handle tab change
    const handleTabChange = (tabIndex) => {
        setActiveTab(tabIndex);
    };

    // Handle section click from progress indicator
    const handleSectionClick = (sectionId) => {
        const tabIndex = tabs.findIndex(tab => tab.id === sectionId);
        if (tabIndex !== -1) {
            setActiveTab(tabIndex);
        }
    };

    // Handle form reset
    const handleReset = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Vietnam',
            employeeId: '',
            position: '',
            positionId: '',
            department: '',
            departmentId: '',
            status: 'active',
            hireDate: '',
            salary: '',
            documents: {
                uploaded: [],
                required: [],
                pending: []
            },
            notes: '',
            profilePicture: null
        });
        setCreateLoginAccount(false);
        setGeneratedPassword('');
        setShowPassword(false);
        setErrors({});
        setTouched({});
        setShowValidationErrors(false);
        setActiveTab(0);
        setLastSaved(null);
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        // Handle nested objects
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? !prev[parent][child] : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error for this field if it exists
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    
    // Handle role change from RoleSelector
    const handleRoleChange = (roleData) => {
        setFormData(prev => ({
            ...prev,
            ...roleData
        }));

        // Clear position-related errors
        if (errors.position) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.position;
                return newErrors;
            });
        }
    };

    // Handle photo upload
    const handlePhotoUpload = (file) => {
        setFormData(prev => ({
            ...prev,
            profilePicture: file
        }));
    };

    // Handle photo error
    const handlePhotoError = (error) => {
        setErrors(prev => ({
            ...prev,
            profilePicture: error
        }));
    };

    // Validate form
    const validateForm = () => {
        const validation = validateEmployeeForm(formData, { createLoginAccount });
        setErrors(validation.errors);
        return validation.isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            setShowValidationErrors(true);
            // Scroll to first error
            if (formRef.current) {
                const firstErrorField = formRef.current.querySelector('[aria-invalid="true"]');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
            }
            return;
        }

        // Additional validation for password if creating login account
        if (createLoginAccount && !generatedPassword) {
            addToast?.('Please generate a password for the login account', 'error');
            return;
        }

        setIsSubmitting(true);
        setShowValidationErrors(false);

        try {
            let result;

            if (editingEmployee) {
                // Update existing employee
                result = await employeeService.updateEmployee(editingEmployee.id, formData);
                if (result.success) {
                    addToast?.('Employee updated successfully!', 'success');
                    onSave?.(result.employee);
                } else {
                    throw new Error(result.error);
                }
            } else {
                // Create new employee
                const createData = {
                    ...formData,
                    // No need for createLoginAccount or password as we are skipping auth for now
                };

                result = await employeeService.createEmployee(createData);
                if (result.success) {
                    addToast?.('Employee created successfully!', 'success');

                    onSave?.(result.employee);
                } else {
                    throw new Error(result.error);
                }
            }

            onClose();
            handleReset();
        } catch (error) {
            console.error('Error saving employee:', error);
            addToast?.(error.message || 'Failed to save employee', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
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
                        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl flex"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Left Sidebar - Progress Indicator */}
                        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    {editingEmployee ? 'Edit Employee' : 'Create New Employee'}
                                </h2>

                                {/* Auto-save Status */}
                                <div className="mb-6 p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Auto-save</span>
                                        <span className={`font-medium ${
                                            autoSaveStatus === 'saved' ? 'text-green-600' :
                                            autoSaveStatus === 'saving' ? 'text-blue-600' :
                                            'text-red-600'
                                        }`}>
                                            {autoSaveStatus === 'saved' ? 'Saved' :
                                             autoSaveStatus === 'saving' ? 'Saving...' :
                                             'Error'}
                                        </span>
                                    </div>
                                    {lastSaved && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Last saved: {lastSaved.toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>

                                {/* Progress Indicator */}
                                <ProgressIndicator
                                    sections={getSectionCompletion()}
                                    currentSection={tabs[activeTab]?.id}
                                    onSectionClick={handleSectionClick}
                                    errors={errors}
                                />
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Tab Navigation */}
                            <div className="bg-white border-b border-gray-200 px-6 pt-6">
                                <div className="flex gap-1 overflow-x-auto">
                                    {tabs.map((tab, index) => {
                                        const TabIcon = tab.icon;
                                        const isActive = activeTab === index;
                                        const hasErrors = Object.keys(errors).some(key =>
                                            key.startsWith(tab.id) ||
                                            (tab.errorFields && tab.errorFields.some(field => errors[field]))
                                        );

                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => handleTabChange(index)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm whitespace-nowrap transition-all ${
                                                    isActive
                                                        ? 'bg-primary text-white'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                } ${hasErrors && !isActive ? 'border-b-2 border-red-500' : ''}`}
                                            >
                                                <TabIcon size={18} />
                                                <span>{tab.label}</span>
                                                {hasErrors && (
                                                    <AlertCircle size={16} className="text-red-500" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto">
                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                                    {/* Validation Error Summary */}
                                    {showValidationErrors && Object.keys(errors).length > 0 && (
                                        <div className="flex items-start gap-2 p-4 bg-red-50 text-red-600 rounded-lg">
                                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium">Please correct the following errors:</p>
                                                <ul className="mt-1 text-sm list-disc list-inside">
                                                    {Object.entries(errors).slice(0, 5).map(([field, error]) => (
                                                        <li key={field}>{error}</li>
                                                    ))}
                                                    {Object.keys(errors).length > 5 && (
                                                        <li className="text-gray-600">
                                                            ... and {Object.keys(errors).length - 5} more errors
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab Content with Animations */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                            className="min-h-[400px]"
                                        >
                                            {/* Personal Information Tab */}
                                            {activeTab === 0 && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                First Name <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="firstName"
                                                                value={formData.firstName}
                                                                onChange={handleInputChange}
                                                                placeholder="Enter first name"
                                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                                                    errors.firstName ? 'border-red-300' : 'border-gray-200'
                                                                }`}
                                                                aria-invalid={!!errors.firstName}
                                                                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                                                            />
                                                            {errors.firstName && (
                                                                <p id="firstName-error" className="mt-1 text-sm text-red-600">
                                                                    {errors.firstName}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Last Name <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="lastName"
                                                                value={formData.lastName}
                                                                onChange={handleInputChange}
                                                                placeholder="Enter last name"
                                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                                                    errors.lastName ? 'border-red-300' : 'border-gray-200'
                                                                }`}
                                                                aria-invalid={!!errors.lastName}
                                                                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                                                            />
                                                            {errors.lastName && (
                                                                <p id="lastName-error" className="mt-1 text-sm text-red-600">
                                                                    {errors.lastName}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Email <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                                placeholder="employee@example.com"
                                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                                                    errors.email ? 'border-red-300' : 'border-gray-200'
                                                                }`}
                                                                aria-invalid={!!errors.email}
                                                                aria-describedby={errors.email ? 'email-error' : undefined}
                                                            />
                                                            {errors.email && (
                                                                <p id="email-error" className="mt-1 text-sm text-red-600">
                                                                    {errors.email}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Phone <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleInputChange}
                                                                placeholder="+84 123 456 789"
                                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                                                    errors.phone ? 'border-red-300' : 'border-gray-200'
                                                                }`}
                                                                aria-invalid={!!errors.phone}
                                                                aria-describedby={errors.phone ? 'phone-error' : undefined}
                                                            />
                                                            {errors.phone && (
                                                                <p id="phone-error" className="mt-1 text-sm text-red-600">
                                                                    {errors.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Address */}
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Address
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="address"
                                                                value={formData.address}
                                                                onChange={handleInputChange}
                                                                placeholder="Street address"
                                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    City
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="city"
                                                                    value={formData.city}
                                                                    onChange={handleInputChange}
                                                                    placeholder="City"
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    State/Province
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="state"
                                                                    value={formData.state}
                                                                    onChange={handleInputChange}
                                                                    placeholder="State"
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Postal Code
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    name="zipCode"
                                                                    value={formData.zipCode}
                                                                    onChange={handleInputChange}
                                                                    placeholder="Postal code"
                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Photo Upload */}
                                                    <div>
                                                        <PhotoUpload
                                                            value={formData.profilePicture}
                                                            onChange={handlePhotoUpload}
                                                            onError={handlePhotoError}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Employment Details Tab */}
                                            {activeTab === 1 && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Employee ID
                                                            </label>
                                                            <input
                                                                type="text"
                                                                name="employeeId"
                                                                value={formData.employeeId}
                                                                onChange={handleInputChange}
                                                                placeholder="e.g., EMP001"
                                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                aria-describedby={errors.employeeId ? 'employeeId-error' : undefined}
                                                            />
                                                            {errors.employeeId && (
                                                                <p id="employeeId-error" className="mt-1 text-sm text-red-600">
                                                                    {errors.employeeId}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Hire Date <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="date"
                                                                name="hireDate"
                                                                value={formData.hireDate}
                                                                onChange={handleInputChange}
                                                                max={new Date().toISOString().split('T')[0]}
                                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                                                    errors.hireDate ? 'border-red-300' : 'border-gray-200'
                                                                }`}
                                                                aria-invalid={!!errors.hireDate}
                                                                aria-describedby={errors.hireDate ? 'hireDate-error' : undefined}
                                                            />
                                                            {errors.hireDate && (
                                                                <p id="hireDate-error" className="mt-1 text-sm text-red-600">
                                                                    {errors.hireDate}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Role Selector */}
                                                    <RoleSelector
                                                        value={formData.positionId}
                                                        onChange={handleRoleChange}
                                                        error={errors.position}
                                                    />

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Status <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                name="status"
                                                                value={formData.status}
                                                                onChange={handleInputChange}
                                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                                                    errors.status ? 'border-red-300' : 'border-gray-200'
                                                                }`}
                                                                aria-invalid={!!errors.status}
                                                            >
                                                                {STATUS_OPTIONS.map(option => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Hourly Rate (VND)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                name="salary"
                                                                value={formData.salary}
                                                                onChange={handleInputChange}
                                                                placeholder="0"
                                                                min="0"
                                                                step="1000"
                                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                                                    errors.salary ? 'border-red-300' : 'border-gray-200'
                                                                }`}
                                                                aria-invalid={!!errors.salary}
                                                                aria-describedby={errors.salary ? 'salary-error' : undefined}
                                                            />
                                                            {errors.salary && (
                                                                <p id="salary-error" className="mt-1 text-sm text-red-600">
                                                                    {errors.salary}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                  </div>
                                            )}

                                            {/* Documents Tab */}
                                            {activeTab === 2 && (
                                                <DocumentsTab
                                                    documents={formData.documents}
                                                    onChange={(documents) => setFormData(prev => ({ ...prev, documents }))}
                                                    errors={errors}
                                                />
                                            )}

                                            {/* Notes Section - Show on all tabs */}
                                            <div className="space-y-4 pt-6 border-t border-gray-200">
                                                <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                                                    <FileText size={18} />
                                                    Additional Notes
                                                </h4>

                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    placeholder="Any additional notes about this employee..."
                                                    rows={4}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                                    maxLength={1000}
                                                />
                                                <p className="text-sm text-gray-500">
                                                    {formData.notes.length}/1000 characters
                                                </p>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Form Actions */}
                                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium flex items-center justify-center gap-2"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    {editingEmployee ? 'Updating...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={20} />
                                                    {editingEmployee ? 'Update Employee' : 'Create Employee'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EmployeeForm;