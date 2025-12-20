import React, { useState, useCallback, useRef } from 'react';
import {
    X,
    Upload,
    File,
    Image,
    FileText,
    AlertCircle,
    CheckCircle,
    Settings,
    Trash2,
    UploadCloud,
    XCircle,
    Loader2
} from 'lucide-react';
import documentService from '../../../services/documentService';

const DocumentUploader = ({
    onUploadSuccess,
    onUploadError,
    maxFiles = 5,
    allowedFolders = ['documents', 'profiles', 'contracts', 'reports', 'images'],
    disabled = false,
    showFolderSelection = true,
    multiple = true
}) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [dragOver, setDragOver] = useState(false);
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [uploadSettings, setUploadSettings] = useState({
        folder: 'documents',
        description: ''
    });

    const fileInputRef = useRef(null);

    /**
     * Handle file selection
     */
    const handleFileSelect = useCallback((selectedFiles) => {
        if (disabled) return;

        const fileArray = Array.from(selectedFiles);
        const validFiles = [];
        const newErrors = [];

        // Check file count limit
        if (files.length + fileArray.length > maxFiles) {
            newErrors.push(`Maximum ${maxFiles} files allowed`);
            setErrors(prev => [...prev, ...newErrors]);
            return;
        }

        // Validate each file
        fileArray.forEach(file => {
            const validation = documentService.validateFile(file);
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                newErrors.push(`${file.name}: ${validation.errors.join(', ')}`);
            }
        });

        // Add valid files to state
        setFiles(prev => [...prev, ...validFiles]);

        // Show errors
        if (newErrors.length > 0) {
            setErrors(prev => [...prev, ...newErrors]);
        }
    }, [disabled, files.length, maxFiles]);

    /**
     * Handle drag events
     */
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        if (!disabled && e.dataTransfer.files) {
            handleFileSelect(multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]]);
        }
    }, [disabled, handleFileSelect, multiple]);

    /**
     * Handle file input change
     */
    const handleFileInputChange = useCallback((e) => {
        if (e.target.files) {
            handleFileSelect(multiple ? e.target.files : [e.target.files[0]]);
        }
    }, [handleFileSelect, multiple]);

    /**
     * Remove file from list
     */
    const removeFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    /**
     * Clear all files
     */
    const clearFiles = useCallback(() => {
        setFiles([]);
        setUploadProgress({});
        setErrors([]);
        setSuccessMessage('');
    }, []);

    /**
     * Upload all files
     */
    const uploadFiles = useCallback(async () => {
        if (files.length === 0) return;

        setUploading(true);
        setErrors([]);

        try {
            const uploadPromises = files.map(async (file, index) => {
                const onProgress = (progress) => {
                    setUploadProgress(prev => ({
                        ...prev,
                        [index]: progress
                    }));
                };

                try {
                    const result = await documentService.uploadDocument(
                        file,
                        uploadSettings,
                        onProgress
                    );

                    return {
                        success: true,
                        file: result.file,
                        originalFile: file
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        originalFile: file
                    };
                }
            });

            const results = await Promise.all(uploadPromises);

            // Process results
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            // Show success message
            if (successful.length > 0) {
                const message = successful.length === files.length
                    ? 'All files uploaded successfully'
                    : `${successful.length} of ${files.length} files uploaded successfully`;
                setSuccessMessage(message);

                // Call success callback
                if (onUploadSuccess) {
                    onUploadSuccess(successful.map(r => r.file));
                }
            }

            // Show errors
            if (failed.length > 0) {
                const errorMessages = failed.map(f => `${f.originalFile.name}: ${f.error}`);
                setErrors(errorMessages);

                if (onUploadError) {
                    onUploadError(failed);
                }
            }

            // Clear successful uploads
            if (successful.length === files.length) {
                clearFiles();
            } else {
                // Remove only successful files
                const successfulFiles = successful.map(s => s.originalFile);
                setFiles(prev => prev.filter(f => !successfulFiles.includes(f)));
            }

        } catch (error) {
            const errorMessage = `Upload failed: ${error.message}`;
            setErrors([errorMessage]);

            if (onUploadError) {
                onUploadError([{ error: errorMessage }]);
            }
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    }, [files, uploadSettings, onUploadSuccess, onUploadError, clearFiles]);

    /**
     * Get file icon based on MIME type
     */
    const getFileIcon = (file) => {
        const iconMap = {
            'application/pdf': <FileText className="text-red-500" size={24} />,
            'image/jpeg': <Image className="text-blue-500" size={24} />,
            'image/jpg': <Image className="text-blue-500" size={24} />,
            'image/png': <Image className="text-blue-500" size={24} />,
            'image/gif': <Image className="text-blue-500" size={24} />,
            'image/webp': <Image className="text-blue-500" size={24} />,
            'application/msword': <FileText className="text-blue-600" size={24} />,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileText className="text-blue-600" size={24} />
        };

        return iconMap[file.type] || <File className="text-gray-500" size={24} />;
    };

    /**
     * Calculate overall progress
     */
    const getOverallProgress = useCallback(() => {
        if (files.length === 0) return 0;

        const totalProgress = Object.values(uploadProgress).reduce(
            (sum, progress) => sum + progress.percentCompleted, 0
        );

        return Math.round(totalProgress / files.length);
    }, [files.length, uploadProgress]);

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                className={`relative border-2 rounded-lg p-8 text-center transition-all cursor-pointer
                    ${dragOver
                        ? 'border-primary bg-primary/10'
                        : 'border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }
                    ${disabled || uploading ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    onChange={handleFileInputChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                    className="hidden"
                    disabled={disabled || uploading}
                />

                <UploadCloud
                    className={`mx-auto mb-4 ${uploading ? 'animate-pulse' : ''}`}
                    size={64}
                    color={dragOver ? '#3b82f6' : '#9ca3af'}
                />

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {uploading ? 'Uploading files...' : 'Drop files here or click to browse'}
                </h3>

                <p className="text-sm text-gray-500">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, WebP (Max 10MB per file)
                </p>

                {showFolderSelection && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(true);
                        }}
                        disabled={disabled || uploading}
                        className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Settings size={16} className="inline mr-2" />
                        Upload Settings
                    </button>
                )}
            </div>

            {/* Upload Progress */}
            {uploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Overall Progress</span>
                        <span className="font-medium">{getOverallProgress()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getOverallProgress()}%` }}
                        />
                    </div>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">
                            Files to Upload ({files.length})
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={uploadFiles}
                                disabled={uploading || files.length === 0}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Upload
                                    </>
                                )}
                            </button>
                            <button
                                onClick={clearFiles}
                                disabled={uploading}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <XCircle size={20} />
                                Clear
                            </button>
                        </div>
                    </div>

                    {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                                {getFileIcon(file)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {documentService.formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {uploadProgress[index] && (
                                    <div className="w-24">
                                        <div className="w-full bg-gray-200 rounded-full h-1">
                                            <div
                                                className="bg-primary h-1 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress[index].percentCompleted}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeFile(index)}
                                    disabled={uploading}
                                    className="p-1 text-gray-400 hover:text-red-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Settings</h3>

                        <div className="space-y-4">
                            {showFolderSelection && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Folder
                                    </label>
                                    <select
                                        value={uploadSettings.folder}
                                        onChange={(e) => setUploadSettings(prev => ({
                                            ...prev,
                                            folder: e.target.value
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        {allowedFolders.map(folder => (
                                            <option key={folder} value={folder}>
                                                {folder.charAt(0).toUpperCase() + folder.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={uploadSettings.description}
                                    onChange={(e) => setUploadSettings(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                    placeholder="Add a description for these files"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Add a description for these files
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
                    <CheckCircle size={20} />
                    <span>{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage('')}
                        className="ml-4 text-green-600 hover:text-green-800"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="space-y-2">
                    {errors.map((error, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <span className="flex-1 text-sm">{error}</span>
                            <button
                                onClick={() => setErrors(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-800"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentUploader;