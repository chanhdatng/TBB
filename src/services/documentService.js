import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../firebase';
import { encrypt, decrypt } from '../utils/encryption';

// Helper function to generate a unique file path
const generateFilePath = (file, folder, userId = null) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomString}_${file.name}`;
    const basePath = userId ? `users/${userId}` : 'global';

    return `${basePath}/${folder}/${fileName}`;
};

// Helper function to get file metadata
const getFileMetadata = (file, options = {}) => {
    return {
        contentType: file.type,
        customMetadata: {
            originalName: file.name,
            size: file.size.toString(),
            uploadedAt: new Date().toISOString(),
            folder: options.folder || 'documents',
            description: options.description || '',
            ...(options.userId && { uploadedBy: options.userId })
        }
    };
};

/**
 * Document Service Class
 * Handles all document-related API calls
 */
class DocumentService {
    /**
     * Upload a document with progress tracking
     * @param {File} file - The file to upload
     * @param {Object} options - Upload options
     * @param {Function} onProgress - Progress callback function
     * @returns {Promise} Upload promise
     */
    async uploadDocument(file, options = {}, onProgress = null) {
        try {
            // Validate file first
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Get current user ID from auth context or localStorage
            const userId = options.userId || localStorage.getItem('userId') || null;

            // Generate unique file path
            const filePath = generateFilePath(file, options.folder || 'documents', userId);
            const storageRef = ref(storage, filePath);
            const metadata = getFileMetadata(file, { ...options, userId });

            // Upload file with resumable upload for progress tracking
            const uploadTask = uploadBytesResumable(storageRef, file, metadata);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        if (onProgress && typeof onProgress === 'function') {
                            const percentCompleted = Math.round(
                                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                            );
                            onProgress({
                                percentCompleted,
                                loaded: snapshot.bytesTransferred,
                                total: snapshot.totalBytes
                            });
                        }
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        reject(new Error(this.getFirebaseErrorMessage(error)));
                    },
                    async () => {
                        try {
                            // Get download URL
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                            // Encrypt sensitive metadata if needed
                            const encryptedMetadata = {
                                ...metadata.customMetadata,
                                // Encrypt description if it contains sensitive information
                                ...(metadata.customMetadata.description && {
                                    descriptionEncrypted: encrypt(metadata.customMetadata.description)
                                })
                            };

                            // Return success response
                            resolve({
                                success: true,
                                file: {
                                    id: uploadTask.snapshot.ref.fullPath,
                                    name: metadata.customMetadata.originalName,
                                    size: parseInt(metadata.customMetadata.size),
                                    type: metadata.contentType,
                                    fullPath: uploadTask.snapshot.ref.fullPath,
                                    downloadURL,
                                    metadata: encryptedMetadata,
                                    createdAt: metadata.customMetadata.uploadedAt,
                                    folder: options.folder || 'documents'
                                }
                            });
                        } catch (error) {
                            console.error('Error getting download URL:', error);
                            reject(new Error('Upload completed but failed to get download URL'));
                        }
                    }
                );
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * List documents with pagination and filtering
     * @param {Object} params - Query parameters
     * @returns {Promise} List promise
     */
    async listDocuments(params = {}) {
        try {
            const {
                folder = 'documents',
                userId = null,
                page = 1,
                limit = 20
            } = params;

            // Get current user ID if not provided
            const currentUserId = userId || localStorage.getItem('userId') || null;
            const basePath = currentUserId ? `users/${currentUserId}` : 'global';
            const folderPath = `${basePath}/${folder}`;

            // List all files in the folder
            const storageRef = ref(storage, folderPath);
            const result = await listAll(storageRef);

            // Process each item to get download URL and metadata
            const documents = await Promise.all(
                result.items.map(async (itemRef) => {
                    try {
                        const downloadURL = await getDownloadURL(itemRef);
                        const metadata = itemRef.metadata || {};

                        // Decrypt description if encrypted
                        const description = metadata.customMetadata?.descriptionEncrypted
                            ? decrypt(metadata.customMetadata.descriptionEncrypted)
                            : metadata.customMetadata?.description || '';

                        return {
                            id: itemRef.fullPath,
                            name: metadata.customMetadata?.originalName || itemRef.name,
                            size: parseInt(metadata.size || '0'),
                            type: metadata.contentType || '',
                            fullPath: itemRef.fullPath,
                            downloadURL,
                            metadata: {
                                ...metadata.customMetadata,
                                description
                            },
                            createdAt: metadata.customMetadata?.uploadedAt || metadata.timeCreated,
                            folder: folder
                        };
                    } catch (error) {
                        console.error('Error processing file:', itemRef.fullPath, error);
                        return null;
                    }
                })
            );

            // Filter out null results and apply pagination
            const validDocuments = documents.filter(doc => doc !== null);
            const startIndex = (page - 1) * limit;
            const paginatedDocuments = validDocuments.slice(startIndex, startIndex + limit);

            return {
                success: true,
                documents: paginatedDocuments,
                count: validDocuments.length,
                page,
                limit,
                totalPages: Math.ceil(validDocuments.length / limit)
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get a signed URL for document access
     * @param {string} fileId - The file ID or path
     * @param {number} expiresIn - Expiration time in milliseconds (not used with Firebase Storage URLs)
     * @returns {Promise} Signed URL promise
     */
    async getDocumentUrl(fileId, expiresIn = 24 * 60 * 60 * 1000) {
        try {
            const storageRef = ref(storage, fileId);
            const downloadURL = await getDownloadURL(storageRef);

            return {
                success: true,
                signedUrl: downloadURL,
                expiresAt: new Date(Date.now() + expiresIn).toISOString()
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Delete a document
     * @param {string} fileId - The file ID or path
     * @returns {Promise} Delete promise
     */
    async deleteDocument(fileId) {
        try {
            const storageRef = ref(storage, fileId);
            await deleteObject(storageRef);

            return {
                success: true,
                fileId,
                message: 'Document deleted successfully'
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Generate thumbnail for an image
     * @param {string} fileId - The file ID or path
     * @returns {Promise} Thumbnail promise
     */
    async generateThumbnail(fileId) {
        try {
            // Firebase Storage doesn't automatically generate thumbnails
            // This would require a Cloud Function or client-side thumbnail generation
            // For now, return the original image URL
            const result = await this.getDocumentUrl(fileId);
            return {
                success: true,
                thumbnailUrl: result.signedUrl,
                message: 'Thumbnail generation not implemented. Returning original image.'
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get document statistics
     * @param {Object} params - Query parameters
     * @returns {Promise} Stats promise
     */
    async getDocumentStats(params = {}) {
        try {
            const { userId = null } = params;

            // Get all folders for stats
            const folders = ['documents', 'profiles', 'contracts', 'reports', 'images'];
            let totalFiles = 0;
            let totalSize = 0;
            const statsByFolder = {};

            for (const folder of folders) {
                const result = await this.listDocuments({ folder, userId, limit: 1000 });
                if (result.success) {
                    statsByFolder[folder] = result.documents.length;
                    totalFiles += result.documents.length;
                    totalSize += result.documents.reduce((sum, doc) => sum + doc.size, 0);
                } else {
                    statsByFolder[folder] = 0;
                }
            }

            return {
                success: true,
                stats: {
                    totalFiles,
                    totalSize,
                    averageFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
                    filesByFolder: statsByFolder,
                    folders: folders.length
                }
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Validate file before upload
     * @param {File} file - The file to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const allowedMimeTypes = [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const maxNameLength = 255;

        const validation = {
            isValid: true,
            errors: []
        };

        // Check file size
        if (file.size > maxSize) {
            validation.isValid = false;
            validation.errors.push(`File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // Check MIME type
        if (!allowedMimeTypes.includes(file.type)) {
            validation.isValid = false;
            validation.errors.push(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
        }

        // Check file extension
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            validation.isValid = false;
            validation.errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
        }

        // Check file name length
        if (file.name.length > maxNameLength) {
            validation.isValid = false;
            validation.errors.push(`File name too long. Maximum ${maxNameLength} characters`);
        }

        // Check for special characters in filename
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(file.name)) {
            validation.isValid = false;
            validation.errors.push('File name contains invalid characters');
        }

        // Check if file is empty
        if (file.size === 0) {
            validation.isValid = false;
            validation.errors.push('File is empty');
        }

        return validation;
    }

    /**
     * Get file icon based on MIME type
     * @param {string} mimeType - The file MIME type
     * @returns {string} Icon name or path
     */
    getFileIcon(mimeType) {
        const iconMap = {
            // Documents
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            // Images
            'image/jpeg': 'image',
            'image/jpg': 'image',
            'image/png': 'image',
            'image/gif': 'image',
            'image/webp': 'image'
        };

        return iconMap[mimeType] || 'file';
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format date
     * @param {string|Date} date - The date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Check if file is an image
     * @param {string} mimeType - The file MIME type
     * @returns {boolean} True if image
     */
    isImage(mimeType) {
        return mimeType.startsWith('image/');
    }

    /**
     * Check if file is a document
     * @param {string} mimeType - The file MIME type
     * @returns {boolean} True if document
     */
    isDocument(mimeType) {
        return [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ].includes(mimeType);
    }

    /**
     * Generate preview URL for file
     * @param {Object} file - File object
     * @returns {string} Preview URL
     */
    getPreviewUrl(file) {
        if (this.isImage(file.mimeType)) {
            return file.signedUrl || file.publicUrl;
        }

        // For PDFs, we can use the signed URL directly
        if (file.mimeType === 'application/pdf') {
            return file.signedUrl || file.publicUrl;
        }

        // For other documents, return null (no preview available)
        return null;
    }

    /**
     * Download file
     * @param {string} fileId - The file ID or path
     * @param {string} filename - The filename for download
     * @returns {Promise} Download promise
     */
    async downloadDocument(fileId, filename) {
        try {
            const urlResult = await this.getDocumentUrl(fileId);

            // Create download link
            const link = document.createElement('a');
            link.href = urlResult.signedUrl;
            link.download = filename || 'document';
            link.target = '_blank';

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return { success: true };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Handle Firebase Storage errors
     * @param {Error} error - The error object
     * @returns {Error} Processed error
     */
    handleError(error) {
        // Handle Firebase Storage errors
        if (error.code) {
            switch (error.code) {
                case 'storage/unauthorized':
                    return new Error('You do not have permission to access this file.');
                case 'storage/canceled':
                    return new Error('Upload was cancelled.');
                case 'storage/unknown':
                    return new Error('An unknown error occurred. Please try again.');
                case 'storage/object-not-found':
                    return new Error('File not found.');
                case 'storage/quota-exceeded':
                    return new Error('Storage quota exceeded. Please contact support.');
                case 'storage/unauthenticated':
                    return new Error('Authentication required. Please log in again.');
                case 'storage/retry-limit-exceeded':
                    return new Error('Maximum retry time exceeded. Please check your connection.');
                case 'storage/invalid-checksum':
                    return new Error('File corrupted during upload. Please try again.');
                case 'storage/invalid-event-type':
                    return new Error('Invalid event type.');
                case 'storage/invalid-url':
                    return new Error('Invalid URL provided.');
                default:
                    return new Error(`Storage error: ${error.message || 'Unknown error occurred.'}`);
            }
        }

        // Handle API errors (if any API calls remain)
        if (error.response) {
            const { data, status } = error.response;

            switch (status) {
                case 400:
                    return new Error(data.message || 'Bad request');
                case 401:
                    return new Error(data.message || 'Unauthorized');
                case 403:
                    return new Error(data.message || 'Forbidden');
                case 404:
                    return new Error(data.message || 'File not found');
                case 413:
                    return new Error(data.message || 'File too large');
                case 500:
                    return new Error(data.message || 'Server error');
                default:
                    return new Error(data.message || 'An error occurred');
            }
        } else if (error.request) {
            // Network error
            return new Error('Network error. Please check your connection.');
        } else {
            // Other error
            return new Error(error.message || 'An unexpected error occurred');
        }
    }

    /**
     * Get Firebase Storage error message
     * @param {Error} error - Firebase error object
     * @returns {string} User-friendly error message
     */
    getFirebaseErrorMessage(error) {
        if (!error) return 'Unknown error occurred';

        const errorCode = error.code || error.serverResponse?.errorCode;
        const errorMessage = error.message || error.serverResponse?.message || '';

        switch (errorCode) {
            case 'storage/unauthorized':
                return 'You do not have permission to upload this file.';
            case 'storage/canceled':
                return 'Upload was cancelled.';
            case 'storage/unknown':
                return 'An unknown error occurred during upload.';
            case 'storage/quota-exceeded':
                return 'Storage quota exceeded. Please contact support.';
            case 'storage/unauthenticated':
                return 'Please log in to upload files.';
            case 'storage/retry-limit-exceeded':
                return 'Upload timeout. Please check your connection and try again.';
            case 'storage/invalid-checksum':
                return 'File appears to be corrupted. Please try again.';
            case 'storage/file-size-limit-exceeded':
                return 'File size exceeds the limit of 10MB.';
            default:
                return errorMessage || `Upload failed: ${errorCode || 'Unknown error'}`;
        }
    }

    /**
     * Get upload progress percentage
     * @param {Object} progress - Progress object
     * @returns {number} Percentage
     */
    getUploadProgress(progress) {
        return Math.round((progress.loaded * 100) / progress.total);
    }

    /**
     * Cancel upload (not implemented with current setup)
     * Would require AbortController implementation
     */
    cancelUpload() {
        // TODO: Implement upload cancellation
        console.warn('Upload cancellation not implemented');
    }
}

// Create singleton instance
const documentService = new DocumentService();

export default documentService;