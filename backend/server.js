require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const history = require('connect-history-api-fallback');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Analytics scheduler, order listener and routes
const { initScheduler } = require('./jobs/scheduler');
const { initOrderListener } = require('./jobs/order-listener');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Trust proxy - required for express-rate-limit to work correctly behind reverse proxies
// This enables Express to trust the X-Forwarded-For header for accurate client IP detection
app.set('trust proxy', 1);

// Configuration from environment variables with fallbacks
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Pre-hash the admin password for comparison (in production, store hashed passwords)
// This is a simple implementation - in production, use a proper user database
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// Simple user database with roles (in production, use a proper database)
const users = [
    {
        id: 1,
        username: 'admin',
        passwordHash: ADMIN_PASSWORD_HASH,
        role: 'admin',
        email: 'admin@butterbake.com',
        fullName: 'System Administrator',
        active: true
    },
    {
        id: 2,
        username: 'manager',
        passwordHash: bcrypt.hashSync('manager123', 10),
        role: 'manager',
        email: 'manager@butterbake.com',
        fullName: 'Store Manager',
        active: true
    },
    {
        id: 3,
        username: 'baker',
        passwordHash: bcrypt.hashSync('baker123', 10),
        role: 'baker',
        email: 'baker@butterbake.com',
        fullName: 'Head Baker',
        active: true
    },
    {
        id: 4,
        username: 'sales',
        passwordHash: bcrypt.hashSync('sales123', 10),
        role: 'sales',
        email: 'sales@butterbake.com',
        fullName: 'Sales Staff',
        active: true
    },
    {
        id: 5,
        username: 'delivery',
        passwordHash: bcrypt.hashSync('delivery123', 10),
        role: 'delivery',
        email: 'delivery@butterbake.com',
        fullName: 'Delivery Staff',
        active: true
    },
    {
        id: 6,
        username: 'staff',
        passwordHash: bcrypt.hashSync('123123', 10),
        role: 'staff',
        email: 'staff@butterbake.com',
        fullName: 'Staff Member',
        active: true
    }
];

// CORS Configuration - restrict to specific origins in production
const corsOptions = {
    origin: process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Rate limiting for login endpoint to prevent brute force attacks
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // 5 attempts per window
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
        retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again after 15 minutes.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// General rate limiting for all API routes
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    }
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Import authentication middleware
const {
    authenticateToken,
    requireAdmin,
    requireMinimumRole,
    requireAnyRole,
    requirePermission
} = require('./middleware/auth');

// Analytics routes (must be BEFORE history middleware)
app.use('/api/analytics', analyticsRoutes);

// Secure employee management routes with Firebase authentication
const employeeRoutes = require('./routes/employees');
app.use('/api/employees', employeeRoutes);

// Document management routes with Firebase authentication
const documentRoutes = require('./routes/documents');
app.use('/api/documents', documentRoutes);

// Department routes (add as needed)
app.get('/api/departments', authenticateToken, async (req, res) => {
    try {
        // For now, return mock departments - implement as needed
        const departments = [
            { id: 'dept-001', name: 'Kitchen', description: 'Kitchen staff' },
            { id: 'dept-002', name: 'Front Desk', description: 'Customer service' },
            { id: 'dept-003', name: 'Delivery', description: 'Delivery team' }
        ];

        res.json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch departments'
        });
    }
});

// Menu merge endpoint (must be BEFORE history middleware)
app.post('/api/merge-menu', upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    let uploadedFiles = [];
    let outputFile = null;
    
    try {
        if (!req.files || !req.files.image1 || !req.files.image2) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload đủ 2 ảnh'
            });
        }

        const image1Path = req.files.image1[0].path;
        const image2Path = req.files.image2[0].path;
        uploadedFiles = [image1Path, image2Path];
        
        const direction = req.body.direction || 'vertical';
        outputFile = path.join(uploadDir, `merged-${Date.now()}.jpg`);
        
        const pythonScript = path.join(__dirname, 'scripts', 'merge_menu.py');
        
        // Check if Python script exists
        if (!fs.existsSync(pythonScript)) {
            throw new Error('Script ghép ảnh không tìm thấy');
        }

        // Run Python script
        const pythonProcess = spawn('/usr/bin/python3', [
            pythonScript,
            image1Path,
            image2Path,
            outputFile,
            direction
        ]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(stderr || 'Lỗi khi ghép ảnh'));
                }
            });
            pythonProcess.on('error', (err) => {
                reject(new Error(`Không thể chạy Python: ${err.message}`));
            });
        });

        // Check if output file exists
        if (!fs.existsSync(outputFile)) {
            throw new Error('Không tạo được ảnh ghép');
        }

        // Send the merged image
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', 'attachment; filename="merged-menu.jpg"');
        
        const fileStream = fs.createReadStream(outputFile);
        fileStream.pipe(res);
        
        // Cleanup after sending
        fileStream.on('end', () => {
            // Delete uploaded and output files
            uploadedFiles.forEach(file => {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            });
            if (outputFile && fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        });

    } catch (error) {
        console.error('Merge menu error:', error);
        
        // Cleanup on error
        uploadedFiles.forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
        if (outputFile && fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi ghép ảnh'
        });
    }
});

// Update menu.jpg endpoint (overwrite public/menu.jpg)
app.post('/api/update-menu', upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    let uploadedFiles = [];
    let tempOutput = null;
    
    try {
        if (!req.files || !req.files.image1 || !req.files.image2) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload đủ 2 ảnh'
            });
        }

        const image1Path = req.files.image1[0].path;
        const image2Path = req.files.image2[0].path;
        uploadedFiles = [image1Path, image2Path];
        
        const direction = req.body.direction || 'vertical';
        tempOutput = path.join(uploadDir, `temp-merged-${Date.now()}.jpg`);
        const finalOutput = path.join(__dirname, '../public/menu.jpg');
        
        const pythonScript = path.join(__dirname, 'scripts', 'merge_menu.py');
        
        if (!fs.existsSync(pythonScript)) {
            throw new Error('Script ghép ảnh không tìm thấy');
        }

        // Run Python script
        const pythonProcess = spawn('/usr/bin/python3', [
            pythonScript,
            image1Path,
            image2Path,
            tempOutput,
            direction
        ]);

        let stderr = '';

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(stderr || 'Lỗi khi ghép ảnh'));
                }
            });
            pythonProcess.on('error', (err) => {
                reject(new Error(`Không thể chạy Python: ${err.message}`));
            });
        });

        if (!fs.existsSync(tempOutput)) {
            throw new Error('Không tạo được ảnh ghép');
        }

        // Move to public/menu.jpg (primary source)
        fs.copyFileSync(tempOutput, finalOutput);

        // Also update dist/menu.jpg if the directory exists (for immediate reflection on served app)
        const distOutput = path.join(__dirname, '../dist/menu.jpg');
        if (fs.existsSync(path.dirname(distOutput))) {
            fs.copyFileSync(tempOutput, distOutput);
            console.log(`[${new Date().toISOString()}] Menu updated in dist: ${distOutput}`);
        }

        fs.unlinkSync(tempOutput);
        
        // Cleanup uploaded files
        uploadedFiles.forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });

        console.log(`[${new Date().toISOString()}] Menu updated in public: ${finalOutput}`);

        res.json({
            success: true,
            message: 'Đã cập nhật menu.jpg thành công!',
            path: '/menu.jpg'
        });

    } catch (error) {
        console.error('Update menu error:', error);
        
        // Cleanup on error
        uploadedFiles.forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
        if (tempOutput && fs.existsSync(tempOutput)) {
            fs.unlinkSync(tempOutput);
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật menu'
        });
    }
});

// Product image upload endpoint
app.post('/api/upload-product-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Return the file URL (already saved by multer)
        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image'
        });
    }
});

// SPA fallback must be BEFORE static
app.use(history({
    verbose: false,
    rewrites: [
        { from: /^\/api\/.*$/, to: context => context.parsedUrl.path }
    ]
}));

// Serve static files AFTER fallback
app.use(express.static(path.join(__dirname, '../dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('menu.jpg')) {
            // Prevent caching for menu.jpg so updates are seen immediately
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.removeHeader('ETag');
        }
    }
}));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== API ROUTES ====================

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Login endpoint with rate limiting
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user in database
        const user = users.find(u => u.username === username && u.active);

        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            // Log failed attempt (in production, send to monitoring)
            console.log(`[${new Date().toISOString()}] Failed login attempt for username: ${username}`);

            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token with role claim
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
                iat: Math.floor(Date.now() / 1000)
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Log successful login
        console.log(`[${new Date().toISOString()}] Successful login for username: ${username} (${user.role})`);

        res.json({
            success: true,
            token: token,
            expiresIn: JWT_EXPIRES_IN,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
});

// Token verification endpoint
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Logout endpoint (client should discard the token)
app.post('/api/logout', authenticateToken, (req, res) => {
    // In a more advanced setup, you could blacklist the token
    console.log(`[${new Date().toISOString()}] User logged out: ${req.user.username}`);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Protected route example
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'This is a protected admin endpoint',
            user: req.user
        }
    });
});

// Fix delivery time slots endpoint
app.post('/api/admin/fix-timeslots', authenticateToken, async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Fix timeslots triggered by: ${req.user.username}`);
        
        const { fixDeliveryTimeSlots } = require('./jobs/fix-timeslots');
        const result = await fixDeliveryTimeSlots();
        
        console.log(`[${new Date().toISOString()}] Fix timeslots completed:`, result);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Fix timeslots error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fix delivery time slots',
            error: error.message
        });
    }
});

// ==================== ROLE-BASED ENDPOINTS ====================

// Users management - Admin only
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
    const activeUsers = users.filter(u => u.active).map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        email: u.email,
        fullName: u.fullName
    }));

    res.json({
        success: true,
        data: activeUsers
    });
});

// User management - requires user:read permission
app.get('/api/users/profile', authenticateToken, requirePermission('user:read'), (req, res) => {
    const userProfile = users.find(u => u.id === req.user.userId);
    if (!userProfile) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.json({
        success: true,
        data: {
            id: userProfile.id,
            username: userProfile.username,
            role: userProfile.role,
            email: userProfile.email,
            fullName: userProfile.fullName
        }
    });
});

// Analytics endpoint - Manager level or higher
app.get('/api/analytics/summary', authenticateToken, requireMinimumRole('manager'), (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'This endpoint requires manager role or higher',
            accessibleBy: ['manager', 'admin'],
            currentUser: req.user
        }
    });
});

// Production management - Production roles only
app.get('/api/production/orders', authenticateToken, requireAnyRole(['admin', 'manager', 'baker']), (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'Production orders endpoint',
            accessibleBy: ['admin', 'manager', 'baker'],
            currentUser: req.user
        }
    });
});

// Order creation - Staff level or higher
app.post('/api/orders', authenticateToken, requirePermission('orders:create'), (req, res) => {
    res.json({
        success: true,
        message: 'Order created successfully',
        data: {
            ...req.body,
            createdBy: req.user.username,
            userRole: req.user.role
        }
    });
});

// Inventory management - Manager level or higher
app.get('/api/inventory', authenticateToken, requirePermission('inventory:manage'), (req, res) => {
    res.json({
        success: true,
        data: {
            message: 'Inventory management endpoint',
            accessibleBy: ['manager', 'admin'],
            currentUser: req.user
        }
    });
});

// Current user info endpoint
app.get('/api/me', authenticateToken, (req, res) => {
    const userProfile = users.find(u => u.id === req.user.userId);
    res.json({
        success: true,
        data: {
            ...req.user,
            profile: userProfile ? {
                email: userProfile.email,
                fullName: userProfile.fullName
            } : null
        }
    });
});

// ==================== ERROR HANDLING ====================

// 404 handler for API routes (Express 5 compatible)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    next();
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 JWT Expiry: ${JWT_EXPIRES_IN}`);
    console.log(`⚡ Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 5} attempts per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`);
    
    // Initialize analytics scheduler
    if (process.env.ENABLE_SCHEDULER !== 'false') {
        try {
            initScheduler();
            console.log('📅 Analytics scheduler enabled (runs daily at 00:00 VN time)');
        } catch (error) {
            console.error('❌ Failed to initialize scheduler:', error.message);
        }
    } else {
        console.log('📅 Analytics scheduler disabled (ENABLE_SCHEDULER=false)');
    }
    
    // Initialize real-time order listener (replaces Firebase Cloud Functions)
    try {
        initOrderListener();
    } catch (error) {
        console.error('❌ Failed to initialize order listener:', error.message);
    }
    
    console.log('');
});