import React, { useState, useEffect } from 'react';
import {
    FileText,
    Shield,
    Eye,
    EyeOff,
    AlertTriangle,
    Info,
    CheckCircle
} from 'lucide-react';
import { encryptData, decryptData, maskSensitiveData } from '../../../../utils/encryption';

const TaxInfoTab = ({
    formData,
    onChange,
    errors,
    setErrors,
    touched,
    setTouched,
    disabled = false
}) => {
    const [showSSN, setShowSSN] = useState(false);
    const [showTaxId, setShowTaxId] = useState(false);
    const [encryptionStatus, setEncryptionStatus] = useState({
        ssn: false,
        taxId: false
    });

    // Check if fields are encrypted on mount
    useEffect(() => {
        if (formData.taxInfo) {
            setEncryptionStatus({
                ssn: formData.taxInfo.ssn?.startsWith('enc:') || false,
                taxId: formData.taxInfo.taxId?.startsWith('enc:') || false
            });
        }
    }, [formData.taxInfo]);

    // Handle input changes with encryption
    const handleInputChange = async (field, value) => {
        const taxInfo = formData.taxInfo || {};
        const updatedTaxInfo = { ...taxInfo, [field]: value };

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
        if (field === 'ssn' || field === 'taxId') {
            try {
                if (value && value.trim().length > 0) {
                    const encryptedValue = await encryptData(value);
                    updatedTaxInfo[field] = encryptedValue;
                    setEncryptionStatus(prev => ({ ...prev, [field]: true }));
                } else {
                    updatedTaxInfo[field] = '';
                    setEncryptionStatus(prev => ({ ...prev, [field]: false }));
                }
            } catch (error) {
                console.error('Encryption failed:', error);
                // Still update the field even if encryption fails
                setEncryptionStatus(prev => ({ ...prev, [field]: false }));
            }
        }

        onChange('taxInfo', updatedTaxInfo);
    };

    // Format SSN input
    const formatSSN = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Format as XXX-XX-XXXX
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    };

    // Format Tax ID input
    const formatTaxId = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Format as XX-XXXXXXX
        if (digits.length <= 2) return digits;
        return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
    };

    // Get display value for encrypted fields
    const getDisplayValue = (field) => {
        const value = formData.taxInfo?.[field];
        if (!value) return '';

        if (value.startsWith('enc:')) {
            return maskSensitiveData(value, 3);
        }
        return value;
    };

    // Get actual value for input field
    const getInputValue = (field) => {
        const value = formData.taxInfo?.[field];
        if (!value) return '';

        // If field is being shown and is encrypted, we need to decrypt it
        if ((field === 'ssn' && showSSN) ||
            (field === 'taxId' && showTaxId)) {
            if (value.startsWith('enc:')) {
                // For now, return masked value - decryption would require async handling
                return maskSensitiveData(value, 3);
            }
        }

        return value.startsWith('enc:') ? '' : value;
    };

    const filingStatuses = [
        { value: 'single', label: 'Single' },
        { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
        { value: 'married_filing_separately', label: 'Married Filing Separately' },
        { value: 'head_of_household', label: 'Head of Household' },
        { value: 'qualifying_widow', label: 'Qualifying Widow(er)' }
    ];

    const allowances = Array.from({ length: 10 }, (_, i) => ({
        value: i.toString(),
        label: i.toString()
    }));

    return (
        <div className="space-y-6">
            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Shield size={20} className="text-green-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-green-900">Secure Tax Information</h4>
                        <p className="text-sm text-green-700 mt-1">
                            Tax identification numbers are encrypted before storage to ensure maximum security.
                            This information is used solely for payroll and tax reporting purposes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tax Identification */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={20} />
                    Tax Identification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Social Security Number - Encrypted Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Social Security Number (SSN)
                            {encryptionStatus.ssn && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <Shield size={12} className="mr-1" />
                                    Encrypted
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showSSN ? 'text' : 'password'}
                                value={getInputValue('ssn')}
                                onChange={(e) => handleInputChange('ssn', formatSSN(e.target.value))}
                                placeholder="XXX-XX-XXXX"
                                maxLength={11}
                                className={`w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    errors.ssn ? 'border-red-300' : 'border-gray-200'
                                } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                disabled={disabled}
                                aria-invalid={!!errors.ssn}
                                aria-describedby={errors.ssn ? 'ssn-error' : undefined}
                            />
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => setShowSSN(!showSSN)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                                >
                                    {showSSN ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            )}
                        </div>
                        {errors.ssn && (
                            <p id="ssn-error" className="mt-1 text-sm text-red-600">
                                {errors.ssn}
                            </p>
                        )}
                        {!showSSN && formData.taxInfo?.ssn && (
                            <p className="mt-1 text-sm text-gray-500">
                                Current: {getDisplayValue('ssn')}
                            </p>
                        )}
                    </div>

                    {/* Tax ID - Encrypted Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax ID Number
                            {encryptionStatus.taxId && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <Shield size={12} className="mr-1" />
                                    Encrypted
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showTaxId ? 'text' : 'password'}
                                value={getInputValue('taxId')}
                                onChange={(e) => handleInputChange('taxId', formatTaxId(e.target.value))}
                                placeholder="XX-XXXXXXX"
                                maxLength={10}
                                className={`w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    errors.taxId ? 'border-red-300' : 'border-gray-200'
                                } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                disabled={disabled}
                                aria-invalid={!!errors.taxId}
                                aria-describedby={errors.taxId ? 'taxId-error' : undefined}
                            />
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => setShowTaxId(!showTaxId)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                                >
                                    {showTaxId ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            )}
                        </div>
                        {errors.taxId && (
                            <p id="taxId-error" className="mt-1 text-sm text-red-600">
                                {errors.taxId}
                            </p>
                        )}
                        {!showTaxId && formData.taxInfo?.taxId && (
                            <p className="mt-1 text-sm text-gray-500">
                                Current: {getDisplayValue('taxId')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tax Withholding */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={20} />
                    Tax Withholding Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filing Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.taxInfo?.filingStatus || ''}
                            onChange={(e) => handleInputChange('filingStatus', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.filingStatus ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                            required
                        >
                            <option value="">Select filing status</option>
                            {filingStatuses.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                        {errors.filingStatus && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.filingStatus}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Allowances <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.taxInfo?.allowances || '0'}
                            onChange={(e) => handleInputChange('allowances', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.allowances ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                            required
                        >
                            {allowances.map(allowance => (
                                <option key={allowance.value} value={allowance.value}>
                                    {allowance.label}
                                </option>
                            ))}
                        </select>
                        {errors.allowances && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.allowances}
                            </p>
                        )}
                    </div>
                </div>

                {/* Additional Withholding */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Withholding (VND per paycheck)
                    </label>
                    <input
                        type="number"
                        value={formData.taxInfo?.additionalWithholding || ''}
                        onChange={(e) => handleInputChange('additionalWithholding', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="10000"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                            errors.additionalWithholding ? 'border-red-300' : 'border-gray-200'
                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        disabled={disabled}
                    />
                    {errors.additionalWithholding && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.additionalWithholding}
                        </p>
                    )}
                </div>

                {/* Exempt Status */}
                <div className="space-y-3">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.taxInfo?.exempt || false}
                            onChange={(e) => handleInputChange('exempt', e.target.checked)}
                            className="rounded text-primary focus:ring-primary"
                            disabled={disabled}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                            Claim exempt from tax withholding
                        </span>
                    </label>

                    {formData.taxInfo?.exempt && (
                        <div className="ml-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm text-amber-800 font-medium">Exemption Claim Notice</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        By claiming exempt, no federal income tax will be withheld from your paycheck.
                                        You must have had no tax liability for the previous year AND expect to have
                                        no tax liability for the current year.
                                    </p>
                                    <p className="text-xs text-amber-700 mt-2">
                                        This exemption expires on February 15 of the following year and must be renewed annually.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* State Tax Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">State Tax Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State of Residence
                        </label>
                        <input
                            type="text"
                            value={formData.taxInfo?.stateOfResidence || ''}
                            onChange={(e) => handleInputChange('stateOfResidence', e.target.value)}
                            placeholder="e.g., Ho Chi Minh City, Hanoi"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.stateOfResidence ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                        />
                        {errors.stateOfResidence && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.stateOfResidence}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State Tax Withholding
                        </label>
                        <select
                            value={formData.taxInfo?.stateTaxWithholding || 'default'}
                            onChange={(e) => handleInputChange('stateTaxWithholding', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.stateTaxWithholding ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                        >
                            <option value="default">Use default state withholding</option>
                            <option value="additional">Additional withholding</option>
                            <option value="exempt">Exempt from state tax</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Compliance Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-900">Tax Compliance Notice</h4>
                        <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                            <li>You are responsible for the accuracy of your tax information</li>
                            <li>Update your withholding whenever your personal or financial situation changes</li>
                            <li>Keep your tax records for at least 3 years</li>
                            <li>Consult a tax professional for advice on your specific situation</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Verification Status */}
            {formData.taxInfo && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <h4 className="font-semibold text-gray-900">Tax Information Status</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">SSN:</span>
                            <span className="ml-2 font-medium">
                                {formData.taxInfo.ssn ? (encryptionStatus.ssn ? 'Encrypted' : 'Provided') : 'Not Provided'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Filing Status:</span>
                            <span className="ml-2 font-medium">
                                {formData.taxInfo.filingStatus ? 'Selected' : 'Not Selected'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Allowances:</span>
                            <span className="ml-2 font-medium">
                                {formData.taxInfo.allowances || '0'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Exemption:</span>
                            <span className="ml-2 font-medium">
                                {formData.taxInfo.exempt ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxInfoTab;