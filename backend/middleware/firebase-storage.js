const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Storage service instance (initialized lazily)
let storage = null;
let bucket = null;
let storageInitialized = false;

/**
 * Initialize Firebase Storage with proper error handling
 */
const initializeStorage = () => {
    if (storageInitialized) {
        return true;
    }

    try {
        // Check if Firebase is already initialized
        if (admin.apps.length === 0) {
            console.error('Firebase Admin not initialized. Initialize Firebase first.');
            return false;
        }

        // Initialize Storage service
        storage = admin.storage();

        // Get bucket reference
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            console.error('FIREBASE_STORAGE_BUCKET environment variable not set');
            return false;
        }

        bucket = storage.bucket(bucketName);

        storageInitialized = true;
        console.log('Firebase Storage initialized successfully');
        console.log(`Using bucket: ${bucketName}`);
        return true;

    } catch (error) {
        console.error('Error initializing Firebase Storage:', error);
        storageInitialized = false;
        return false;
    }
};

/**
 * Get Firebase Storage service instance (initializes if needed)
 */
const getStorageService = () => {
    if (!storageInitialized) {
        const success = initializeStorage();
        if (!success) {
            throw new Error('Failed to initialize Firebase Storage');
        }
    }
    return { storage, bucket };
};

/**
 * Generate unique filename with timestamp and random hash
 */
const generateUniqueFilename = (originalname, userId = 'anonymous') => {
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalname).toLowerCase();
    const basename = path.basename(originalname, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

    return `${userId}/${timestamp}_${randomHash}_${sanitized}${ext}`;
};

/**
 * Validate file type and size
 */
const validateFile = (file) => {
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

    // Check file size
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        };
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
            valid: false,
            error: `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
        };
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        return {
            valid: false,
            error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
        };
    }

    return { valid: true };
};

/**
 * Get file metadata for storage
 */
const getFileMetadata = (file, userId, folder = 'documents') => {
    const metadata = {
        metadata: {
            originalName: file.originalname,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            mimeType: file.mimetype,
            size: file.size,
            folder: folder
        },
        contentType: file.mimetype
    };

    // Add custom metadata for different file types
    if (file.mimetype.startsWith('image/')) {
        metadata.metadata.fileType = 'image';
    } else if (file.mimetype.includes('pdf')) {
        metadata.metadata.fileType = 'pdf';
    } else if (file.mimetype.includes('word')) {
        metadata.metadata.fileType = 'document';
    }

    return metadata;
};

/**
 * Upload file to Firebase Storage with progress tracking
 */
const uploadFile = async (file, userId, folder = 'documents', onProgress = null) => {
    try {
        if (!storageInitialized) {
            initializeStorage();
        }

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Generate unique filename
        const uniqueFilename = generateUniqueFilename(file.originalname, userId);
        const filePath = `${folder}/${uniqueFilename}`;

        // Get file metadata
        const metadata = getFileMetadata(file, userId, folder);

        // Create upload stream
        const blob = bucket.file(filePath);
        const blobStream = blob.createWriteStream({
            metadata: metadata,
            resumable: false
        });

        // Return promise that resolves with file info
        return new Promise((resolve, reject) => {
            let bytesUploaded = 0;
            const totalBytes = file.size;

            blobStream.on('error', (error) => {
                console.error('Upload stream error:', error);
                reject(error);
            });

            blobStream.on('finish', async () => {
                try {
                    // Get file info
                    const [fileMetadata] = await blob.getMetadata();

                    // Generate signed URL
                    const signedUrlOptions = {
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
                    };

                    const [signedUrl] = await blob.getSignedUrl(signedUrlOptions);

                    // Generate download URL (public URL)
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

                    resolve({
                        success: true,
                        file: {
                            id: fileMetadata.id,
                            name: file.originalname,
                            filename: uniqueFilename,
                            path: filePath,
                            publicUrl: publicUrl,
                            signedUrl: signedUrl,
                            mimeType: file.mimetype,
                            size: file.size,
                            uploadedBy: userId,
                            uploadedAt: new Date().toISOString(),
                            folder: folder,
                            metadata: fileMetadata.metadata
                        }
                    });
                } catch (error) {
                    console.error('Error getting file metadata:', error);
                    reject(error);
                }
            });

            // Track progress if callback provided
            if (onProgress && typeof onProgress === 'function') {
                blobStream.on('progress', (progress) => {
                    const percentCompleted = Math.round((progress.bytesWritten / totalBytes) * 100);
                    onProgress({
                        bytesWritten: progress.bytesWritten,
                        totalBytes: totalBytes,
                        percentCompleted: percentCompleted
                    });
                });
            }

            // Write file buffer to stream
            blobStream.end(file.buffer);
        });

    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

/**
 * Generate signed URL for file access
 */
const getSignedUrl = async (filePath, expiresIn = 24 * 60 * 60 * 1000) => {
    try {
        if (!storageInitialized) {
            initializeStorage();
        }

        const file = bucket.file(filePath);
        const exists = await file.exists();

        if (!exists[0]) {
            throw new Error('File not found');
        }

        const signedUrlOptions = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresIn
        };

        const [signedUrl] = await file.getSignedUrl(signedUrlOptions);
        return signedUrl;

    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
};

/**
 * Delete file from Firebase Storage
 */
const deleteFile = async (filePath) => {
    try {
        if (!storageInitialized) {
            initializeStorage();
        }

        const file = bucket.file(filePath);
        const exists = await file.exists();

        if (!exists[0]) {
            throw new Error('File not found');
        }

        await file.delete();
        return { success: true, message: 'File deleted successfully' };

    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

/**
 * List files in a folder with optional filtering
 */
const listFiles = async (folder = 'documents', userId = null, options = {}) => {
    try {
        if (!storageInitialized) {
            initializeStorage();
        }

        let prefix = folder;
        if (userId) {
            prefix = `${folder}/${userId}`;
        }

        const [files, _, apiResponse] = await bucket.getFiles({
            prefix: prefix,
            delimiter: '/',
            ...options
        });

        const fileList = await Promise.all(files.map(async (file) => {
            const [metadata] = await file.getMetadata();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

            return {
                id: metadata.id,
                name: metadata.metadata.originalName || file.name,
                path: file.name,
                publicUrl: publicUrl,
                mimeType: metadata.contentType,
                size: parseInt(metadata.size),
                uploadedBy: metadata.metadata.uploadedBy,
                uploadedAt: metadata.metadata.uploadedAt || metadata.timeCreated,
                folder: metadata.metadata.folder,
                metadata: metadata.metadata
            };
        }));

        return {
            success: true,
            files: fileList,
            totalCount: fileList.length
        };

    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
};

/**
 * Generate thumbnail for images
 */
const generateThumbnail = async (filePath, thumbnailPath = null) => {
    try {
        if (!storageInitialized) {
            initializeStorage();
        }

        const file = bucket.file(filePath);
        const [metadata] = await file.getMetadata();

        // Only generate thumbnails for images
        if (!metadata.contentType.startsWith('image/')) {
            throw new Error('Thumbnail generation only supported for images');
        }

        // Generate thumbnail path if not provided
        if (!thumbnailPath) {
            const pathParts = filePath.split('/');
            const filename = pathParts.pop();
            const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
            thumbnailPath = `${pathParts.join('/')}/thumbnails/${nameWithoutExt}_thumb.jpg`;
        }

        // For now, return the original file path
        // In a real implementation, you would use ImageMagick or similar service
        // to generate actual thumbnails
        return {
            success: true,
            thumbnailPath: thumbnailPath,
            thumbnailUrl: `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`
        };

    } catch (error) {
        console.error('Error generating thumbnail:', error);
        throw error;
    }
};

module.exports = {
    initializeStorage,
    getStorageService,
    validateFile,
    uploadFile,
    getSignedUrl,
    deleteFile,
    listFiles,
    generateThumbnail,
    generateUniqueFilename,
    getFileMetadata
};