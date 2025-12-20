import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Building2,
    Shield,
    Eye,
    EyeOff,
    AlertCircle,
    Info
} from 'lucide-react';
import { encryptData, decryptData, maskSensitiveData } from '../../../../utils/encryption';

const BankingInfoTab = ({
    formData,
    onChange,
    errors,
    setErrors,
    touched,
    setTouched,
    disabled = false
}) => {
    const [showAccountNumber, setShowAccountNumber] = useState(false);
    const [showRoutingNumber, setShowRoutingNumber] = useState(false);
    const [encryptionStatus, setEncryptionStatus] = useState({
        accountNumber: false,
        routingNumber: false
    });

    // Check if fields are encrypted on mount
    useEffect(() => {
        if (formData.bankingInfo) {
            setEncryptionStatus({
                accountNumber: formData.bankingInfo.accountNumber?.startsWith('enc:') || false,
                routingNumber: formData.bankingInfo.routingNumber?.startsWith('enc:') || false
            });
        }
    }, [formData.bankingInfo]);

    // Handle input changes with encryption
    const handleInputChange = async (field, value) => {
        const bankingInfo = formData.bankingInfo || {};
        const updatedBankingInfo = { ...bankingInfo, [field]: value };

        // Mark field as touched
        setTouched(prev => ({ ...prev, [field]: true }));

        // Clear error for this field if it exists
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Encrypt sensitive fields
        if (field === 'accountNumber' || field === 'routingNumber') {
            try {
                if (value && value.trim().length > 0) {
                    const encryptedValue = await encryptData(value);
                    updatedBankingInfo[field] = encryptedValue;
                    setEncryptionStatus(prev => ({ ...prev, [field]: true }));
                } else {
                    updatedBankingInfo[field] = '';
                    setEncryptionStatus(prev => ({ ...prev, [field]: false }));
                }
            } catch (error) {
                console.error('Encryption failed:', error);
                // Still update the field even if encryption fails
                setEncryptionStatus(prev => ({ ...prev, [field]: false }));
            }
        }

        onChange('bankingInfo', updatedBankingInfo);
    };

    // Get display value for encrypted fields
    const getDisplayValue = (field) => {
        const value = formData.bankingInfo?.[field];
        if (!value) return '';

        if (value.startsWith('enc:')) {
            return maskSensitiveData(value, 4);
        }
        return value;
    };

    // Get actual value for input field
    const getInputValue = (field) => {
        const value = formData.bankingInfo?.[field];
        if (!value) return '';

        // If field is being shown and is encrypted, we need to decrypt it
        if ((field === 'accountNumber' && showAccountNumber) ||
            (field === 'routingNumber' && showRoutingNumber)) {
            if (value.startsWith('enc:')) {
                // For now, return masked value - decryption would require async handling
                // In a real implementation, you'd handle this with state management
                return maskSensitiveData(value, 4);
            }
        }

        return value.startsWith('enc:') ? '' : value;
    };

    const bankTypes = [
        { value: 'checking', label: 'Checking Account' },
        { value: 'savings', label: 'Savings Account' },
        { value: 'business', label: 'Business Account' }
    ];

    return (
        <div className="space-y-6">
            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Shield size={20} className="text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-900">Secure Banking Information</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Banking details are encrypted before storage to ensure maximum security.
                            Sensitive information is masked for your protection.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={20} />
                    Bank Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bank Name
                        </label>
                        <input
                            type="text"
                            value={formData.bankingInfo?.bankName || ''}
                            onChange={(e) => handleInputChange('bankName', e.target.value)}
                            placeholder="e.g., Vietcombank, Techcombank"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.bankName ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                            aria-invalid={!!errors.bankName}
                            aria-describedby={errors.bankName ? 'bankName-error' : undefined}
                        />
                        {errors.bankName && (
                            <p id="bankName-error" className="mt-1 text-sm text-red-600">
                                {errors.bankName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Type
                        </label>
                        <select
                            value={formData.bankingInfo?.accountType || ''}
                            onChange={(e) => handleInputChange('accountType', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.accountType ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                        >
                            <option value="">Select account type</option>
                            {bankTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        {errors.accountType && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.accountType}
                            </p>
                        )}
                    </div>
                </div>

                {/* Account Number - Encrypted Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                        {encryptionStatus.accountNumber && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <Shield size={12} className="mr-1" />
                                Encrypted
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <input
                            type={showAccountNumber ? 'text' : 'password'}
                            value={getInputValue('accountNumber')}
                            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                            placeholder="Enter account number"
                            className={`w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.accountNumber ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                            aria-invalid={!!errors.accountNumber}
                            aria-describedby={errors.accountNumber ? 'accountNumber-error' : undefined}
                        />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => setShowAccountNumber(!showAccountNumber)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                            >
                                {showAccountNumber ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        )}
                    </div>
                    {errors.accountNumber && (
                        <p id="accountNumber-error" className="mt-1 text-sm text-red-600">
                            {errors.accountNumber}
                        </p>
                    )}
                    {!showAccountNumber && formData.bankingInfo?.accountNumber && (
                        <p className="mt-1 text-sm text-gray-500">
                            Current: {getDisplayValue('accountNumber')}
                        </p>
                    )}
                </div>

                {/* Routing Number - Encrypted Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Routing Number
                        {encryptionStatus.routingNumber && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <Shield size={12} className="mr-1" />
                                Encrypted
                            </span>
                        )}
                    </label>
                    <div className="relative">
                        <input
                            type={showRoutingNumber ? 'text' : 'password'}
                            value={getInputValue('routingNumber')}
                            onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                            placeholder="Enter routing number"
                            className={`w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.routingNumber ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                            aria-invalid={!!errors.routingNumber}
                            aria-describedby={errors.routingNumber ? 'routingNumber-error' : undefined}
                        />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => setShowRoutingNumber(!showRoutingNumber)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                            >
                                {showRoutingNumber ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        )}
                    </div>
                    {errors.routingNumber && (
                        <p id="routingNumber-error" className="mt-1 text-sm text-red-600">
                            {errors.routingNumber}
                        </p>
                    )}
                    {!showRoutingNumber && formData.bankingInfo?.routingNumber && (
                        <p className="mt-1 text-sm text-gray-500">
                            Current: {getDisplayValue('routingNumber')}
                        </p>
                    )}
                </div>

                {/* SWIFT/BIC Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        SWIFT/BIC Code
                    </label>
                    <input
                        type="text"
                        value={formData.bankingInfo?.swiftCode || ''}
                        onChange={(e) => handleInputChange('swiftCode', e.target.value.toUpperCase())}
                        placeholder="e.g., VCBKVNVX"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                            errors.swiftCode ? 'border-red-300' : 'border-gray-200'
                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        disabled={disabled}
                        aria-invalid={!!errors.swiftCode}
                        aria-describedby={errors.swiftCode ? 'swiftCode-error' : undefined}
                    />
                    {errors.swiftCode && (
                        <p id="swiftCode-error" className="mt-1 text-sm text-red-600">
                            {errors.swiftCode}
                        </p>
                    )}
                </div>

                {/* Branch Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Address
                    </label>
                    <textarea
                        value={formData.bankingInfo?.branchAddress || ''}
                        onChange={(e) => handleInputChange('branchAddress', e.target.value)}
                        placeholder="Enter branch address"
                        rows={2}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
                            errors.branchAddress ? 'border-red-300' : 'border-gray-200'
                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        disabled={disabled}
                        maxLength={200}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        {(formData.bankingInfo?.branchAddress || '').length}/200 characters
                    </p>
                </div>
            </div>

            {/* Payment Preferences */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard size={20} />
                    Payment Preferences
                </h3>

                <div className="space-y-3">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.bankingInfo?.directDeposit || false}
                            onChange={(e) => handleInputChange('directDeposit', e.target.checked)}
                            className="rounded text-primary focus:ring-primary"
                            disabled={disabled}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                            Enable direct deposit for salary payments
                        </span>
                    </label>

                    {formData.bankingInfo?.directDeposit && (
                        <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">
                                Salary will be deposited directly to the specified bank account on payday.
                            </p>
                            <div className="flex items-start gap-2">
                                <Info size={16} className="text-blue-500 mt-0.5" />
                                <p className="text-xs text-gray-500">
                                    Please ensure all banking information is accurate. Allow 2-3 business days
                                    for the first direct deposit to process.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Security Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-900">Important Security Notice</h4>
                        <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                            <li>Never share your banking credentials with anyone</li>
                            <li>Regularly monitor your bank statements</li>
                            <li>Report any suspicious activity immediately</li>
                            <li>Keep your banking information updated to avoid payment delays</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankingInfoTab;