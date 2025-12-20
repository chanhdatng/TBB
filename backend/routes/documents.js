const express = require('express');
const multer = require('multer');
const { verifyFirebaseToken, requireRole, requirePermission } = require('../middleware/firebase-auth');
const { uploadFile, getSignedUrl, deleteFile, listFiles, generateThumbnail, validateFile } = require('../middleware/firebase-storage');
const { body, param, query, validationResult } = require('express-validator');

const router = express.Router();

// Configure multer for memory storage (files will be uploaded to Firebase Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const validation = validateFile(file);
        if (validation.valid) {
            cb(null, true);
        } else {
            cb(new Error(validation.error), false);
        }
    }
});

/**
 * Middleware to check validation results
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

/**
 * Audit logging function
 */
const logAudit = async (action, userId, details, req) => {
    try {
        const auditEntry = {
            action: action,
            userId: userId,
            details: details,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl,
            method: req.method
        };

        // In a real implementation, you would save this to a database
        console.log('AUDIT:', JSON.stringify(auditEntry));

        // For now, just log to console
        // TODO: Implement proper audit logging to database
    } catch (error) {
        console.error('Error logging audit:', error);
    }
};

/**
 * POST /api/documents/upload
 * Upload a document to Firebase Storage
 *
 * Required permissions: document:upload or manager/admin role
 */
router.post('/upload', verifyFirebaseToken, requirePermission('document:upload'), upload.single('file'), [
    body('folder')
        .optional()
        .isIn(['documents', 'profiles', 'contracts', 'reports', 'images'])
        .withMessage('Invalid folder type'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters')
], handleValidationErrors, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided',
                code: 'NO_FILE'
            });
        }

        const { folder = 'documents', description } = req.body;
        const userId = req.user.uid;

        console.log(`[${new Date().toISOString()}] File upload started by user ${userId}: ${req.file.originalname}`);

        // Progress tracking
        let uploadProgress = 0;

        const onProgress = (progress) => {
            uploadProgress = progress.percentCompleted;
            console.log(`Upload progress for ${req.file.originalname}: ${uploadProgress}%`);
        };

        // Upload file to Firebase Storage
        const result = await uploadFile(req.file, userId, folder, onProgress);

        // Log audit
        await logAudit('document_upload', userId, {
            fileName: req.file.originalname,
            filePath: result.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            folder: folder,
            description: description
        }, req);

        console.log(`[${new Date().toISOString()}] File uploaded successfully: ${result.file.path}`);

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file: result.file,
            audit: {
                uploadedBy: userId,
                uploadedAt: result.file.uploadedAt
            }
        });

    } catch (error) {
        console.error('Upload error:', error);

        // Log audit for failed upload
        await logAudit('document_upload_failed', req.user.uid, {
            fileName: req.file ? req.file.originalname : 'unknown',
            error: error.message
        }, req);

        if (error.message.includes('File size exceeds')) {
            return res.status(413).json({
                success: false,
                message: error.message,
                code: 'FILE_TOO_LARGE'
            });
        }

        if (error.message.includes('File type not allowed')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                code: 'INVALID_FILE_TYPE'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            code: 'UPLOAD_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/documents
 * List documents with optional filtering
 *
 * Required permissions: document:read or manager/admin role
 */
router.get('/', verifyFirebaseToken, requirePermission('document:read'), [
    query('folder')
        .optional()
        .isIn(['documents', 'profiles', 'contracts', 'reports', 'images'])
        .withMessage('Invalid folder type'),
    query('userId')
        .optional()
        .isUUID()
        .withMessage('Invalid user ID format'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res) => {
    try {
        const { folder = 'documents', userId, page = 1, limit = 20 } = req.query;
        const currentUserId = req.user.uid;

        // Users can only see their own files unless they're admin/manager
        const targetUserId = req.user.role === 'admin' || req.user.role === 'manager'
            ? userId
            : currentUserId;

        console.log(`[${new Date().toISOString()}] Document list requested by user ${currentUserId}`);

        const result = await listFiles(folder, targetUserId);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedFiles = result.files.slice(startIndex, endIndex);

        // Log audit
        await logAudit('document_list', currentUserId, {
            folder: folder,
            userId: targetUserId,
            page: page,
            limit: limit,
            resultsCount: paginatedFiles.length
        }, req);

        res.json({
            success: true,
            files: paginatedFiles,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(result.files.length / limit),
                totalFiles: result.files.length,
                hasNext: endIndex < result.files.length,
                hasPrevious: page > 1
            }
        });

    } catch (error) {
        console.error('List files error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to list files',
            code: 'LIST_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/documents/:fileId/url
 * Get signed URL for a specific file
 *
 * Required permissions: document:read or manager/admin role
 */
router.get('/:fileId/url', verifyFirebaseToken, requirePermission('document:read'), [
    param('fileId')
        .notEmpty()
        .withMessage('File ID is required'),
    query('expiresIn')
        .optional()
        .isInt({ min: 60000, max: 604800000 }) // 1 minute to 7 days
        .withMessage('Expires in must be between 1 minute and 7 days')
], handleValidationErrors, async (req, res) => {
    try {
        const { fileId } = req.params;
        const { expiresIn = 24 * 60 * 60 * 1000 } = req.query; // Default 24 hours
        const userId = req.user.uid;

        // For now, we'll assume fileId is the file path
        // In a real implementation, you would map fileId to actual file path
        const filePath = decodeURIComponent(fileId);

        console.log(`[${new Date().toISOString()}] Signed URL requested for file: ${filePath}`);

        const signedUrl = await getSignedUrl(filePath, parseInt(expiresIn));

        // Log audit
        await logAudit('document_access', userId, {
            filePath: filePath,
            expiresIn: expiresIn
        }, req);

        res.json({
            success: true,
            signedUrl: signedUrl,
            expiresIn: expiresIn
        });

    } catch (error) {
        console.error('Get signed URL error:', error);

        if (error.message === 'File not found') {
            return res.status(404).json({
                success: false,
                message: 'File not found',
                code: 'FILE_NOT_FOUND'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate signed URL',
            code: 'URL_GENERATION_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * DELETE /api/documents/:fileId
 * Delete a specific file
 *
 * Required permissions: document:delete or manager/admin role
 */
router.delete('/:fileId', verifyFirebaseToken, requirePermission('document:delete'), [
    param('fileId')
        .notEmpty()
        .withMessage('File ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.uid;

        // For now, we'll assume fileId is the file path
        // In a real implementation, you would map fileId to actual file path
        const filePath = decodeURIComponent(fileId);

        console.log(`[${new Date().toISOString()}] File deletion requested: ${filePath}`);

        const result = await deleteFile(filePath);

        // Log audit
        await logAudit('document_delete', userId, {
            filePath: filePath
        }, req);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        console.error('Delete file error:', error);

        if (error.message === 'File not found') {
            return res.status(404).json({
                success: false,
                message: 'File not found',
                code: 'FILE_NOT_FOUND'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            code: 'DELETE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * POST /api/documents/:fileId/thumbnail
 * Generate thumbnail for an image file
 *
 * Required permissions: document:read or manager/admin role
 */
router.post('/:fileId/thumbnail', verifyFirebaseToken, requirePermission('document:read'), [
    param('fileId')
        .notEmpty()
        .withMessage('File ID is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.uid;

        // For now, we'll assume fileId is the file path
        const filePath = decodeURIComponent(fileId);

        console.log(`[${new Date().toISOString()}] Thumbnail generation requested: ${filePath}`);

        const result = await generateThumbnail(filePath);

        // Log audit
        await logAudit('document_thumbnail', userId, {
            filePath: filePath,
            thumbnailPath: result.thumbnailPath
        }, req);

        res.json({
            success: true,
            thumbnail: result
        });

    } catch (error) {
        console.error('Generate thumbnail error:', error);

        if (error.message === 'File not found') {
            return res.status(404).json({
                success: false,
                message: 'File not found',
                code: 'FILE_NOT_FOUND'
            });
        }

        if (error.message.includes('Thumbnail generation only supported for images')) {
            return res.status(400).json({
                success: false,
                message: 'Thumbnail generation only supported for image files',
                code: 'INVALID_FILE_TYPE'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate thumbnail',
            code: 'THUMBNAIL_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/documents/stats
 * Get document statistics
 *
 * Required permissions: document:read or manager/admin role
 */
router.get('/stats', verifyFirebaseToken, requirePermission('document:read'), async (req, res) => {
    try {
        const userId = req.user.uid;

        console.log(`[${new Date().toISOString()}] Document stats requested by user ${userId}`);

        // Get files from all folders
        const folders = ['documents', 'profiles', 'contracts', 'reports', 'images'];
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            filesByFolder: {},
            filesByType: {},
            recentUploads: []
        };

        for (const folder of folders) {
            try {
                const result = await listFiles(folder, userId);

                stats.filesByFolder[folder] = result.files.length;
                stats.totalFiles += result.files.length;

                result.files.forEach(file => {
                    // Count by file type
                    const fileType = file.metadata.fileType || 'unknown';
                    stats.filesByType[fileType] = (stats.filesByType[fileType] || 0) + 1;

                    // Calculate total size
                    stats.totalSize += file.size;
                });

                // Get recent uploads (last 5)
                const recentFiles = result.files
                    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
                    .slice(0, 5);

                stats.recentUploads.push(...recentFiles);

            } catch (error) {
                console.error(`Error getting stats for folder ${folder}:`, error);
            }
        }

        // Sort recent uploads
        stats.recentUploads = stats.recentUploads
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
            .slice(0, 10);

        // Format total size
        stats.formattedSize = formatFileSize(stats.totalSize);

        // Log audit
        await logAudit('document_stats', userId, {
            totalFiles: stats.totalFiles,
            totalSize: stats.totalSize
        }, req);

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('Get stats error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to get document statistics',
            code: 'STATS_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * Helper function to format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;