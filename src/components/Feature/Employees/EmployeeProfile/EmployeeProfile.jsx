import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Briefcase,
    Shield,
    Edit3,
    Printer,
    Download,
    Calendar,
    Mail,
    Phone,
    MapPin,
    Clock,
    DollarSign,
    Award,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import PersonalInfoTab from './PersonalInfoTab';
import EmploymentTab from './EmploymentTab';
import PermissionTab from './PermissionTab';
import EmployeeForm from '../EmployeeForm/EmployeeForm';
import { slideInFromRight, backdropVariants } from '../../../../utils/animations';

const EmployeeProfile = ({
    isOpen,
    onClose,
    employeeId,
    addToast
}) => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Check if current user can edit this profile
    const canEdit = useCallback(() => {
        if (!currentUser || !employee) return false;

        // Admin can edit everyone
        if (currentUser.role === 'admin') return true;

        // Managers can edit all employees except admin
        if (currentUser.role === 'manager' && employee.level !== 'admin') return true;

        // Supervisors can edit staff members only
        if (currentUser.role === 'supervisor' && ['staff'].includes(employee.level)) return true;

        // Users can edit their own profile
        if (currentUser.id === employee.id) return true;

        return false;
    }, [currentUser, employee]);

    // Fetch employee data
    const fetchEmployee = useCallback(async () => {
        if (!employeeId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/employees/${employeeId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employee data');
            }

            const data = await response.json();
            setEmployee(data.employee);
        } catch (err) {
            setError(err.message);
            addToast?.('Failed to load employee profile', 'error');
        } finally {
            setLoading(false);
        }
    }, [employeeId, addToast]);

    // Handle employee update
    const handleEmployeeUpdate = async (updatedEmployee) => {
        setIsUpdating(true);

        try {
            const response = await fetch(`/api/employees/${employeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(updatedEmployee)
            });

            if (!response.ok) {
                throw new Error('Failed to update employee');
            }

            const data = await response.json();
            setEmployee(data.employee);
            setShowEditForm(false);
            addToast?.('Employee profile updated successfully', 'success');
        } catch (err) {
            setError(err.message);
            addToast?.('Failed to update employee profile', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle print profile
    const handlePrint = () => {
        const printContent = document.getElementById('employee-profile-content');
        const printWindow = window.open('', '', 'width=800,height=600');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Employee Profile - ${employee?.firstName} ${employee?.lastName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .section { margin-bottom: 20px; }
                        .section-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
                        .info-row { display: flex; margin-bottom: 8px; }
                        .info-label { font-weight: bold; width: 150px; }
                        .permission-item { margin-bottom: 5px; }
                        .granted { color: #16a34a; }
                        .denied { color: #dc2626; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    };

    // Handle export profile
    const handleExport = async () => {
        try {
            const response = await fetch(`/api/employees/${employeeId}/export`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export employee profile');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `employee-profile-${employee?.firstName}-${employee?.lastName}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            addToast?.('Employee profile exported successfully', 'success');
        } catch (err) {
            setError(err.message);
            addToast?.('Failed to export employee profile', 'error');
        }
    };

    // Load employee data when component opens
    useEffect(() => {
        if (isOpen && employeeId) {
            fetchEmployee();
        }
    }, [isOpen, employeeId, fetchEmployee]);

    // Reset state when closing
    const handleClose = () => {
        setActiveTab('personal');
        setEmployee(null);
        setError(null);
        setShowEditForm(false);
        onClose();
    };

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'employment', label: 'Employment', icon: Briefcase },
        { id: 'permissions', label: 'Permissions', icon: Shield }
    ];

    if (loading) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            variants={slideInFromRight}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl p-8"
                        >
                            <div className="flex flex-col items-center justify-center h-64">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-gray-600">Loading employee profile...</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    if (error) {
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
                            variants={slideInFromRight}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center text-center">
                                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Error Loading Profile</h3>
                                <p className="text-gray-600 mb-6">{error}</p>
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && employee && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        variants={slideInFromRight}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary-light/5">
                            <div className="flex items-center gap-4">
                                {/* Employee Avatar */}
                                <div className="relative">
                                    {employee.profilePicture ? (
                                        <img
                                            src={employee.profilePicture}
                                            alt={`${employee.firstName} ${employee.lastName}`}
                                            className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                                        </div>
                                    )}
                                    {/* Status Indicator */}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                                        employee.status === 'active' ? 'bg-green-500' :
                                        employee.status === 'on_leave' ? 'bg-yellow-500' :
                                        employee.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                                    }`} />
                                </div>

                                {/* Employee Info */}
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {employee.firstName} {employee.lastName}
                                    </h2>
                                    <p className="text-gray-600">{employee.position}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            employee.status === 'active' ? 'bg-green-100 text-green-800' :
                                            employee.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                                            employee.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {employee.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {employee.employeeId && (
                                            <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {canEdit() && (
                                    <button
                                        onClick={() => setShowEditForm(true)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Edit Profile"
                                    >
                                        <Edit3 size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={handlePrint}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Print Profile"
                                >
                                    <Printer size={20} />
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Export Profile"
                                >
                                    <Download size={20} />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-primary text-primary bg-white'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div id="employee-profile-content" className="flex-1 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'personal' && (
                                        <PersonalInfoTab employee={employee} />
                                    )}
                                    {activeTab === 'employment' && (
                                        <EmploymentTab employee={employee} />
                                    )}
                                    {activeTab === 'permissions' && (
                                        <PermissionTab employee={employee} />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Edit Form Modal */}
                        <AnimatePresence>
                            {showEditForm && (
                                <EmployeeForm
                                    isOpen={showEditForm}
                                    onClose={() => setShowEditForm(false)}
                                    onSave={handleEmployeeUpdate}
                                    editingEmployee={employee}
                                    addToast={addToast}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EmployeeProfile;