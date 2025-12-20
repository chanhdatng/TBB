import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, User, Camera, AlertCircle } from 'lucide-react';
import { validateEmployeePhoto } from './ValidationSchema';

const PhotoUpload = ({
    value,
    onChange,
    onError,
    label = "Employee Photo",
    helperText = "Upload a professional photo (optional)",
    disabled = false,
    className = ""
}) => {
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    // Initialize preview with existing photo URL
    useEffect(() => {
        if (value && typeof value === 'string') {
            setPreview(value);
        } else if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [value]);

    // Handle file selection
    const handleFileSelect = (file) => {
        if (!file || disabled) return;

        // Validate file
        const validation = validateEmployeePhoto(file);
        if (!validation.isValid) {
            const errorMessage = validation.errors[0];
            setUploadError(errorMessage);
            onError?.(errorMessage);
            return;
        }

        // Clear any previous errors
        setUploadError('');
        onError?.('');

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        if (preview && preview !== value) {
            URL.revokeObjectURL(preview);
        }
        setPreview(objectUrl);

        // Notify parent component
        onChange?.(file);
    };

    // Handle file input change
    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Remove photo
    const handleRemove = () => {
        if (disabled) return;

        if (preview && preview !== value) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        onChange?.(null);
        setUploadError('');
        onError?.('');

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Click to upload
    const handleUploadClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Label */}
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            {/* Upload Area */}
            <div
                className={`
                    relative border-2 border-dashed rounded-lg transition-all duration-200
                    ${isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-gray-400'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${uploadError ? 'border-red-300 bg-red-50' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUploadClick();
                    }
                }}
                aria-label="Upload employee photo"
            >
                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleInputChange}
                    disabled={disabled}
                    aria-label="Choose photo file"
                />

                {/* Content */}
                <div className="p-6 text-center">
                    {preview ? (
                        // Photo Preview
                        <div className="relative inline-block">
                            <img
                                src={preview}
                                alt="Employee preview"
                                className="w-32 h-32 rounded-full object-cover mx-auto shadow-lg"
                            />
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                                    aria-label="Remove photo"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ) : (
                        // Upload Prompt
                        <div className="space-y-3">
                            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                <User size={40} className="text-gray-400" />
                            </div>
                            <div>
                                <Camera size={48} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-primary hover:text-primary-light">
                                        Click to upload
                                    </span>
                                    {' or drag and drop'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG, GIF up to 5MB
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Helper Text */}
            {helperText && !uploadError && (
                <p className="text-sm text-gray-500">{helperText}</p>
            )}

            {/* Error Message */}
            {uploadError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={16} />
                    <span>{uploadError}</span>
                </div>
            )}

            {/* Additional Options */}
            {preview && !disabled && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                        className="text-sm text-primary hover:text-primary-light font-medium"
                    >
                        Change Photo
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
};

export default PhotoUpload;