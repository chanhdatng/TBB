import React, { useState } from 'react';
import {
    Phone,
    Plus,
    Trash2,
    User,
    Mail,
    MapPin,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

const EmergencyContactTab = ({
    formData,
    onChange,
    errors,
    setErrors,
    touched,
    setTouched,
    disabled = false
}) => {
    // Initialize with primary contact if not exists
    const emergencyContacts = formData.emergencyContacts || [
        {
            name: '',
            relationship: '',
            phone: '',
            email: '',
            address: '',
            isPrimary: true
        }
    ];

    const [contacts, setContacts] = useState(emergencyContacts);

    // Relationship options
    const relationshipOptions = [
        'Spouse',
        'Partner',
        'Parent',
        'Sibling',
        'Child',
        'Grandparent',
        'Grandchild',
        'Aunt/Uncle',
        'Niece/Nephew',
        'Cousin',
        'Friend',
        'Neighbor',
        'Colleague',
        'Other'
    ];

    // Add new contact
    const addContact = () => {
        if (disabled) return;

        const newContact = {
            name: '',
            relationship: '',
            phone: '',
            email: '',
            address: '',
            isPrimary: contacts.length === 0
        };

        const updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);
        onChange('emergencyContacts', updatedContacts);
    };

    // Remove contact
    const removeContact = (index) => {
        if (disabled || contacts.length <= 1) return;

        const updatedContacts = contacts.filter((_, i) => i !== index);

        // If removing primary contact, make the first remaining contact primary
        if (contacts[index].isPrimary && updatedContacts.length > 0) {
            updatedContacts[0].isPrimary = true;
        }

        setContacts(updatedContacts);
        onChange('emergencyContacts', updatedContacts);

        // Clear errors for removed contact
        const contactErrors = Object.keys(errors).filter(key =>
            key.startsWith(`emergencyContacts[${index}]`)
        );
        if (contactErrors.length > 0) {
            setErrors(prev => {
                const newErrors = { ...prev };
                contactErrors.forEach(key => delete newErrors[key]);
                return newErrors;
            });
        }
    };

    // Set primary contact
    const setPrimaryContact = (index) => {
        if (disabled) return;

        const updatedContacts = contacts.map((contact, i) => ({
            ...contact,
            isPrimary: i === index
        }));

        setContacts(updatedContacts);
        onChange('emergencyContacts', updatedContacts);
    };

    // Handle contact field change
    const handleContactChange = (index, field, value) => {
        if (disabled) return;

        const updatedContacts = contacts.map((contact, i) => {
            if (i === index) {
                return { ...contact, [field]: value };
            }
            return contact;
        });

        setContacts(updatedContacts);
        onChange('emergencyContacts', updatedContacts);

        // Mark field as touched
        setTouched(prev => ({ ...prev, [`emergencyContacts[${index}].${field}`]: true }));

        // Clear error for this field if it exists
        const errorKey = `emergencyContacts[${index}].${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    // Get error for a specific contact field
    const getError = (index, field) => {
        return errors[`emergencyContacts[${index}].${field}`] || '';
    };

    // Check if contact has error
    const hasError = (index, field) => {
        return !!errors[`emergencyContacts[${index}].${field}`];
    };

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Phone size={20} />
                        Emergency Contacts
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Add multiple emergency contacts. At least one primary contact is required.
                    </p>
                </div>
                {!disabled && (
                    <button
                        type="button"
                        onClick={addContact}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
                    >
                        <Plus size={20} />
                        Add Contact
                    </button>
                )}
            </div>

            {/* Contacts List */}
            <div className="space-y-4">
                {contacts.map((contact, index) => (
                    <div
                        key={index}
                        className={`relative bg-white border rounded-lg p-4 ${
                            contact.isPrimary ? 'border-primary bg-primary/5' : 'border-gray-200'
                        } ${disabled ? 'opacity-75' : ''}`}
                    >
                        {/* Contact Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                    Contact #{index + 1}
                                </span>
                                {contact.isPrimary && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                                        Primary
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {!contact.isPrimary && !disabled && (
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryContact(index)}
                                        className="text-sm text-primary hover:text-primary-light font-medium"
                                    >
                                        Set as Primary
                                    </button>
                                )}
                                {contacts.length > 1 && !disabled && (
                                    <button
                                        type="button"
                                        onClick={() => removeContact(index)}
                                        className="p-1 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={contact.name || ''}
                                        onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                        placeholder="Full name"
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                            hasError(index, 'name') ? 'border-red-300' : 'border-gray-200'
                                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                        disabled={disabled}
                                        aria-invalid={hasError(index, 'name')}
                                    />
                                </div>
                                {getError(index, 'name') && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {getError(index, 'name')}
                                    </p>
                                )}
                            </div>

                            {/* Relationship */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Relationship <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={contact.relationship || ''}
                                    onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                        hasError(index, 'relationship') ? 'border-red-300' : 'border-gray-200'
                                    } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                    disabled={disabled}
                                >
                                    <option value="">Select relationship</option>
                                    {relationshipOptions.map(option => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {getError(index, 'relationship') && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {getError(index, 'relationship')}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={contact.phone || ''}
                                        onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                        placeholder="+84 123 456 789"
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                            hasError(index, 'phone') ? 'border-red-300' : 'border-gray-200'
                                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                        disabled={disabled}
                                        aria-invalid={hasError(index, 'phone')}
                                    />
                                </div>
                                {getError(index, 'phone') && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {getError(index, 'phone')}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={contact.email || ''}
                                        onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                                        placeholder="contact@example.com"
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                            hasError(index, 'email') ? 'border-red-300' : 'border-gray-200'
                                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                        disabled={disabled}
                                    />
                                </div>
                                {getError(index, 'email') && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {getError(index, 'email')}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                                    <textarea
                                        value={contact.address || ''}
                                        onChange={(e) => handleContactChange(index, 'address', e.target.value)}
                                        placeholder="Emergency contact address"
                                        rows={2}
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
                                            hasError(index, 'address') ? 'border-red-300' : 'border-gray-200'
                                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                        disabled={disabled}
                                        maxLength={200}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-1 text-right">
                                    {(contact.address || '').length}/200 characters
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Validation Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Emergency Contacts Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-gray-700">
                            Total Contacts: <strong>{contacts.length}</strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-gray-700">
                            Primary Contact: <strong>{contacts.find(c => c.isPrimary)?.name || 'Not set'}</strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-blue-600" />
                        <span className="text-gray-700">
                            All Required Fields: <strong>
                                {contacts.every(c => c.name && c.relationship && c.phone) ? 'Complete' : 'Incomplete'}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-900">Important Notice</h4>
                        <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                            <li>Keep your emergency contact information up to date</li>
                            <li>Inform your contacts that they are listed as emergency contacts</li>
                            <li>Update this information whenever contact details change</li>
                            <li>These contacts will be notified only in case of emergency</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyContactTab;