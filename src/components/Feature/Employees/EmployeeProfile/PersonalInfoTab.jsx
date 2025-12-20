import React from 'react';
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Shield,
    Globe,
    Users,
    AlertCircle
} from 'lucide-react';

const PersonalInfoTab = ({ employee }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="text-primary" size={20} />
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Mail size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Email Address</p>
                            <p className="font-medium text-gray-900">{employee.email || 'Not specified'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Phone size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Phone Number</p>
                            <p className="font-medium text-gray-900">{employee.phone || 'Not specified'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="text-primary" size={20} />
                    Address Information
                </h3>
                <div className="space-y-3">
                    {employee.address && (
                        <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Street Address</p>
                                <p className="font-medium text-gray-900">{employee.address}</p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {employee.city && (
                            <div>
                                <p className="text-sm text-gray-500">City</p>
                                <p className="font-medium text-gray-900">{employee.city}</p>
                            </div>
                        )}
                        {employee.state && (
                            <div>
                                <p className="text-sm text-gray-500">State/Province</p>
                                <p className="font-medium text-gray-900">{employee.state}</p>
                            </div>
                        )}
                        {employee.zipCode && (
                            <div>
                                <p className="text-sm text-gray-500">Postal Code</p>
                                <p className="font-medium text-gray-900">{employee.zipCode}</p>
                            </div>
                        )}
                    </div>
                    {employee.country && (
                        <div className="flex items-start gap-3">
                            <Globe size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Country</p>
                                <p className="font-medium text-gray-900">{employee.country}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Personal Details */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="text-primary" size={20} />
                    Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.dateOfBirth && (
                        <div className="flex items-start gap-3">
                            <Calendar size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="font-medium text-gray-900">{formatDate(employee.dateOfBirth)}</p>
                                {calculateAge(employee.dateOfBirth) && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {calculateAge(employee.dateOfBirth)} years old
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {employee.gender && (
                        <div className="flex items-start gap-3">
                            <User size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Gender</p>
                                <p className="font-medium text-gray-900 capitalize">{employee.gender}</p>
                            </div>
                        </div>
                    )}
                    {employee.nationality && (
                        <div className="flex items-start gap-3">
                            <Globe size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Nationality</p>
                                <p className="font-medium text-gray-900">{employee.nationality}</p>
                            </div>
                        </div>
                    )}
                    {employee.maritalStatus && (
                        <div className="flex items-start gap-3">
                            <Users size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Marital Status</p>
                                <p className="font-medium text-gray-900 capitalize">{employee.maritalStatus.replace('_', ' ')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="text-yellow-600" size={20} />
                    Emergency Contact
                </h3>
                {employee.emergencyContact ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Contact Name</p>
                                <p className="font-medium text-gray-900">{employee.emergencyContact.name || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Relationship</p>
                                <p className="font-medium text-gray-900">{employee.emergencyContact.relationship || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Emergency Phone</p>
                                <p className="font-medium text-gray-900">{employee.emergencyContact.phone || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No emergency contact information available</p>
                )}
            </div>

            {/* Additional Information */}
            {employee.notes && (
                <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{employee.notes}</p>
                </div>
            )}

            {/* Identification Documents */}
            {(employee.idNumber || employee.passportNumber || employee.taxId) && (
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="text-primary" size={20} />
                        Identification Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employee.idNumber && (
                            <div>
                                <p className="text-sm text-gray-500">ID Number</p>
                                <p className="font-medium text-gray-900">{employee.idNumber}</p>
                            </div>
                        )}
                        {employee.passportNumber && (
                            <div>
                                <p className="text-sm text-gray-500">Passport Number</p>
                                <p className="font-medium text-gray-900">{employee.passportNumber}</p>
                            </div>
                        )}
                        {employee.taxId && (
                            <div>
                                <p className="text-sm text-gray-500">Tax ID</p>
                                <p className="font-medium text-gray-900">{employee.taxId}</p>
                            </div>
                        )}
                        {employee.socialSecurityNumber && (
                            <div>
                                <p className="text-sm text-gray-500">Social Security Number</p>
                                <p className="font-medium text-gray-900">***-**-{employee.socialSecurityNumber.slice(-4)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalInfoTab;