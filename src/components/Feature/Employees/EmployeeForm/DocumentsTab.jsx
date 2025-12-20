import React, { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    Check,
    X,
    AlertCircle,
    Download,
    Eye,
    Trash2,
    FolderOpen,
    Shield,
    Clock,
    Calendar
} from 'lucide-react';
import DocumentUploader from '../../../Documents/DocumentUploader';

const DocumentsTab = ({
    formData,
    onChange,
    errors,
    setErrors,
    touched,
    setTouched,
    disabled = false,
    employeeId = null
}) => {
    // Initialize documents data
    const documentsData = formData.documents || {
        required: [],
        uploaded: [],
        pending: []
    };

    const [documents, setDocuments] = useState(documentsData);
    const [uploadProgress, setUploadProgress] = useState({});
    const [showDocumentPreview, setShowDocumentPreview] = useState(null);

    // Required document types
    const requiredDocumentTypes = [
        {
            id: 'id_proof',
            name: 'ID Proof',
            description: 'National ID card or passport',
            category: 'identification',
            required: true,
            formats: ['PDF', 'JPG', 'PNG'],
            maxSize: '5MB'
        },
        {
            id: 'address_proof',
            name: 'Address Proof',
            description: 'Utility bill or rental agreement',
            category: 'identification',
            required: true,
            formats: ['PDF', 'JPG', 'PNG'],
            maxSize: '5MB'
        },
        {
            id: 'education_certificate',
            name: 'Education Certificate',
            description: 'Highest qualification certificate',
            category: 'education',
            required: false,
            formats: ['PDF', 'JPG', 'PNG'],
            maxSize: '5MB'
        },
        {
            id: 'experience_certificate',
            name: 'Experience Certificate',
            description: 'Previous work experience certificates',
            category: 'experience',
            required: false,
            formats: ['PDF', 'JPG', 'PNG'],
            maxSize: '10MB'
        },
        {
            id: 'bank_details',
            name: 'Bank Details Form',
            description: 'Completed bank account details form',
            category: 'banking',
            required: true,
            formats: ['PDF'],
            maxSize: '2MB'
        },
        {
            id: 'tax_form',
            name: 'Tax Form',
            description: 'Tax declaration and withholding form',
            category: 'tax',
            required: true,
            formats: ['PDF'],
            maxSize: '2MB'
        },
        {
            id: 'employment_contract',
            name: 'Employment Contract',
            description: 'Signed employment agreement',
            category: 'contract',
            required: true,
            formats: ['PDF'],
            maxSize: '5MB'
        },
        {
            id: 'nda',
            name: 'NDA Agreement',
            description: 'Non-disclosure agreement',
            category: 'contract',
            required: true,
            formats: ['PDF'],
            maxSize: '2MB'
        },
        {
            id: 'emergency_contacts',
            name: 'Emergency Contact Form',
            description: 'Emergency contact information form',
            category: 'forms',
            required: true,
            formats: ['PDF'],
            maxSize: '1MB'
        },
        {
            id: 'profile_photo',
            name: 'Profile Photo',
            description: 'Professional photograph for ID card',
            category: 'identification',
            required: true,
            formats: ['JPG', 'PNG'],
            maxSize: '2MB'
        }
    ];

    // Update documents when formData changes
    useEffect(() => {
        setDocuments(formData.documents || documentsData);
    }, [formData.documents]);

    // Handle document upload success
    const handleUploadSuccess = (uploadedFiles, documentType) => {
        const updatedDocuments = { ...documents };

        uploadedFiles.forEach(file => {
            const documentRecord = {
                id: file.id || Date.now().toString(),
                name: file.name,
                type: file.type,
                size: file.size,
                url: file.url,
                uploadedAt: new Date().toISOString(),
                category: documentType?.category || 'general',
                documentTypeId: documentType?.id || 'general',
                status: 'uploaded'
            };

            updatedDocuments.uploaded.push(documentRecord);

            // Remove from pending if it was there
            updatedDocuments.pending = updatedDocuments.pending.filter(
                doc => doc.documentTypeId !== documentType?.id
            );
        });

        setDocuments(updatedDocuments);
        onChange('documents', updatedDocuments);
        setUploadProgress({});
    };

    // Handle document upload error
    const handleUploadError = (errors) => {
        console.error('Document upload errors:', errors);
        // Could show error notifications here
    };

    // Handle document deletion
    const handleDeleteDocument = (documentId) => {
        if (disabled) return;

        const updatedDocuments = {
            ...documents,
            uploaded: documents.uploaded.filter(doc => doc.id !== documentId)
        };

        setDocuments(updatedDocuments);
        onChange('documents', updatedDocuments);
    };

    // Get document status for a type
    const getDocumentStatus = (typeId) => {
        const uploaded = documents.uploaded.filter(doc => doc.documentTypeId === typeId);
        const pending = documents.pending.filter(doc => doc.documentTypeId === typeId);

        if (uploaded.length > 0) return 'uploaded';
        if (pending.length > 0) return 'pending';
        return 'missing';
    };

    // Get uploaded documents for a type
    const getUploadedDocuments = (typeId) => {
        return documents.uploaded.filter(doc => doc.documentTypeId === typeId);
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Group documents by category
    const documentsByCategory = requiredDocumentTypes.reduce((acc, doc) => {
        if (!acc[doc.category]) {
            acc[doc.category] = [];
        }
        acc[doc.category].push(doc);
        return acc;
    }, {});

    // Calculate completion percentage
    const calculateCompletion = () => {
        const requiredDocs = requiredDocumentTypes.filter(doc => doc.required);
        const completedRequired = requiredDocs.filter(doc =>
            getDocumentStatus(doc.id) === 'uploaded'
        ).length;

        return requiredDocs.length > 0 ? Math.round((completedRequired / requiredDocs.length) * 100) : 0;
    };

    const completionPercentage = calculateCompletion();

    const categoryIcons = {
        identification: <Shield size={16} className="text-blue-600" />,
        education: <FileText size={16} className="text-purple-600" />,
        experience: <FileText size={16} className="text-green-600" />,
        banking: <Shield size={16} className="text-yellow-600" />,
        tax: <FileText size={16} className="text-red-600" />,
        contract: <FileText size={16} className="text-indigo-600" />,
        forms: <FileText size={16} className="text-gray-600" />,
        general: <FolderOpen size={16} className="text-gray-600" />
    };

    const categoryLabels = {
        identification: 'Identification Documents',
        education: 'Education & Qualifications',
        experience: 'Work Experience',
        banking: 'Banking Information',
        tax: 'Tax Documents',
        contract: 'Legal & Contracts',
        forms: 'Forms & Declarations',
        general: 'Other Documents'
    };

    return (
        <div className="space-y-6">
            {/* Header with Progress */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText size={20} />
                            Document Management
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Upload and manage employee documents
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>

                <div className="mt-2 text-xs text-gray-500">
                    {requiredDocumentTypes.filter(d => d.required && getDocumentStatus(d.id) === 'uploaded').length} of {requiredDocumentTypes.filter(d => d.required).length} required documents uploaded
                </div>
            </div>

            {/* Document Upload Section */}
            {!disabled && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Upload New Documents</h4>
                    <DocumentUploader
                        onUploadSuccess={(files) => handleUploadSuccess(files)}
                        onUploadError={handleUploadError}
                        maxFiles={5}
                        allowedFolders={['documents', 'contracts', 'identification', 'forms']}
                        multiple={true}
                    />
                </div>
            )}

            {/* Documents by Category */}
            <div className="space-y-6">
                {Object.entries(documentsByCategory).map(([category, categoryDocs]) => (
                    <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                            {categoryIcons[category]}
                            <h4 className="font-semibold text-gray-900">
                                {categoryLabels[category]}
                            </h4>
                            <span className="text-sm text-gray-500">
                                ({categoryDocs.filter(d => getDocumentStatus(d.id) === 'uploaded').length}/{categoryDocs.length} uploaded)
                            </span>
                        </div>

                        <div className="space-y-2">
                            {categoryDocs.map(docType => {
                                const status = getDocumentStatus(docType.id);
                                const uploadedDocs = getUploadedDocuments(docType.id);

                                return (
                                    <div
                                        key={docType.id}
                                        className={`border rounded-lg p-4 ${
                                            status === 'uploaded' ? 'border-green-200 bg-green-50' :
                                            status === 'pending' ? 'border-amber-200 bg-amber-50' :
                                            'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-medium text-gray-900">
                                                        {docType.name}
                                                    </h5>
                                                    {docType.required && (
                                                        <span className="text-red-500">*</span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        status === 'uploaded' ? 'bg-green-100 text-green-800' :
                                                        status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {status === 'uploaded' ? 'Uploaded' :
                                                         status === 'pending' ? 'Pending' : 'Missing'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {docType.description}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Formats: {docType.formats.join(', ')} • Max: {docType.maxSize}
                                                </p>

                                                {/* Uploaded Files */}
                                                {uploadedDocs.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        {uploadedDocs.map(doc => (
                                                            <div
                                                                key={doc.id}
                                                                className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <FileText size={16} className="text-gray-400" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            {doc.name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {formatFileSize(doc.size)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowDocumentPreview(doc)}
                                                                        className="p-1 text-blue-600 hover:text-blue-800"
                                                                        title="Preview"
                                                                    >
                                                                        <Eye size={16} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => window.open(doc.url, '_blank')}
                                                                        className="p-1 text-green-600 hover:text-green-800"
                                                                        title="Download"
                                                                    >
                                                                        <Download size={16} />
                                                                    </button>
                                                                    {!disabled && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteDocument(doc.id)}
                                                                            className="p-1 text-red-600 hover:text-red-800"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Document Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Total Required:</span>
                        <p className="font-medium">
                            {requiredDocumentTypes.filter(d => d.required).length}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Uploaded:</span>
                        <p className="font-medium text-green-600">
                            {documents.uploaded.filter(d =>
                                requiredDocumentTypes.find(rt => rt.id === d.documentTypeId)?.required
                            ).length}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Missing:</span>
                        <p className="font-medium text-red-600">
                            {requiredDocumentTypes.filter(d =>
                                d.required && getDocumentStatus(d.id) === 'missing'
                            ).length}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Total Files:</span>
                        <p className="font-medium">{documents.uploaded.length}</p>
                    </div>
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Shield size={20} className="text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-900">Document Security</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            All uploaded documents are encrypted and stored securely. Access is restricted to authorized personnel only.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsTab;