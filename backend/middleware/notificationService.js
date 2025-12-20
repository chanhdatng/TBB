const nodemailer = require('nodemailer');
const cron = require('node-cron');
const EventEmitter = require('events');

class NotificationService extends EventEmitter {
    constructor() {
        super();
        this.emailTransporter = null;
        this.smsTransporter = null;
        this.realtimeConnections = new Map();
        this.notificationQueue = [];
        this.isProcessingQueue = false;
        this.db = null;

        this.initializeEmailTransporter();
        this.initializeRealtimeHandling();
        this.startQueueProcessor();
    }

    /**
     * Initialize database connection
     */
    async initializeDatabase() {
        try {
            const { MongoClient } = require('mongodb');
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/butterbake';
            const client = new MongoClient(mongoUri);
            await client.connect();
            this.db = client.db();

            // Create indexes for notifications collection
            await this.db.collection('notifications').createIndexes([
                { key: { userId: 1, createdAt: -1 } },
                { key: { type: 1, status: 1 } },
                { key: { scheduledFor: 1 } },
                { key: { expiresAt: 1 }, expireAfterSeconds: 0 }
            ]);

            console.log('✅ NotificationService: Database initialized successfully');
        } catch (error) {
            console.error('❌ NotificationService: Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize email transporter
     */
    initializeEmailTransporter() {
        try {
            this.emailTransporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                },
                tls: {
                    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false'
                }
            });

            // Verify connection
            this.emailTransporter.verify((error, success) => {
                if (error) {
                    console.warn('⚠️ Email transporter verification failed:', error.message);
                } else {
                    console.log('✅ Email transporter ready');
                }
            });
        } catch (error) {
            console.warn('⚠️ Failed to initialize email transporter:', error.message);
        }
    }

    /**
     * Initialize SMS transporter (using Twilio)
     */
    initializeSMSTransporter() {
        try {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                const twilio = require('twilio');
                this.smsTransporter = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                console.log('✅ SMS transporter initialized');
            }
        } catch (error) {
            console.warn('⚠️ Failed to initialize SMS transporter:', error.message);
        }
    }

    /**
     * Initialize real-time notification handling
     */
    initializeRealtimeHandling() {
        // This would integrate with WebSocket server
        // For now, we'll simulate real-time connections
        this.on('realtime:connect', (userId, connection) => {
            this.realtimeConnections.set(userId, connection);
            console.log(`🔗 User connected for real-time notifications: ${userId}`);
        });

        this.on('realtime:disconnect', (userId) => {
            this.realtimeConnections.delete(userId);
            console.log(`🔌 User disconnected from real-time notifications: ${userId}`);
        });
    }

    /**
     * Start notification queue processor
     */
    startQueueProcessor() {
        // Process queue every 5 seconds
        setInterval(() => {
            if (!this.isProcessingQueue && this.notificationQueue.length > 0) {
                this.processNotificationQueue();
            }
        }, 5000);

        // Clean up expired notifications every hour
        cron.schedule('0 * * * *', () => {
            this.cleanupExpiredNotifications();
        });
    }

    /**
     * Send notification (main entry point)
     */
    async sendNotification(recipient, notificationData) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        try {
            const notification = {
                id: this.generateNotificationId(),
                userId: recipient.userId || recipient.email || recipient.phone,
                type: notificationData.type,
                title: notificationData.title || this.getDefaultTitle(notificationData.type),
                message: notificationData.message || notificationData.description || '',
                data: notificationData.data || {},
                channels: this.determineChannels(recipient, notificationData),
                status: 'pending',
                priority: notificationData.priority || 'normal',
                createdAt: new Date(),
                scheduledFor: notificationData.scheduledFor || null,
                expiresAt: notificationData.expiresAt || this.calculateExpiry(notificationData.priority),
                attempts: 0,
                maxAttempts: notificationData.maxAttempts || 3,
                metadata: {
                    source: notificationData.source || 'approval_system',
                    category: notificationData.category || 'general',
                    tags: notificationData.tags || [],
                    relatedEntityId: notificationData.relatedEntityId || null,
                    relatedEntityType: notificationData.relatedEntityType || null
                }
            };

            // Save to database
            await this.db.collection('notifications').insertOne(notification);

            // If immediate, add to queue
            if (!notification.scheduledFor || notification.scheduledFor <= new Date()) {
                this.notificationQueue.push(notification);
            }

            console.log(`📬 Notification queued: ${notification.id} -> ${notification.userId}`);

            return {
                success: true,
                notificationId: notification.id,
                status: 'queued'
            };

        } catch (error) {
            console.error('❌ Error sending notification:', error);
            throw error;
        }
    }

    /**
     * Process notification queue
     */
    async processNotificationQueue() {
        if (this.isProcessingQueue) return;

        this.isProcessingQueue = true;

        try {
            while (this.notificationQueue.length > 0) {
                const notification = this.notificationQueue.shift();

                try {
                    await this.processNotification(notification);
                } catch (error) {
                    console.error(`❌ Error processing notification ${notification.id}:`, error);

                    // Update notification status
                    await this.updateNotificationStatus(notification.id, 'failed', error.message);
                }
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Process individual notification
     */
    async processNotification(notification) {
        const channels = notification.channels;
        const results = [];

        // Process each channel
        for (const channel of channels) {
            try {
                let result;

                switch (channel) {
                    case 'email':
                        result = await this.sendEmailNotification(notification);
                        break;
                    case 'sms':
                        result = await this.sendSMSNotification(notification);
                        break;
                    case 'realtime':
                        result = await this.sendRealtimeNotification(notification);
                        break;
                    case 'push':
                        result = await this.sendPushNotification(notification);
                        break;
                    default:
                        console.warn(`⚠️ Unknown notification channel: ${channel}`);
                        continue;
                }

                results.push({ channel, success: true, result });

            } catch (error) {
                console.error(`❌ Error sending ${channel} notification:`, error);
                results.push({ channel, success: false, error: error.message });
            }
        }

        // Determine overall status
        const hasSuccess = results.some(r => r.success);
        const status = hasSuccess ? 'sent' : 'failed';

        // Update notification in database
        await this.db.collection('notifications').updateOne(
            { id: notification.id },
            {
                $set: {
                    status,
                    channels: results,
                    sentAt: new Date(),
                    attempts: notification.attempts + 1
                }
            }
        );

        return results;
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(notification) {
        if (!this.emailTransporter) {
            throw new Error('Email transporter not configured');
        }

        const emailTemplate = this.generateEmailTemplate(notification);

        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@butterbake.com',
            to: notification.userId, // Assuming userId is email for email notifications
            subject: emailTemplate.subject,
            text: emailTemplate.text,
            html: emailTemplate.html,
            priority: notification.priority === 'urgent' ? 'high' : 'normal'
        };

        const result = await this.emailTransporter.sendMail(mailOptions);

        console.log(`📧 Email sent: ${notification.id} -> ${notification.userId}`);

        return {
            messageId: result.messageId,
            response: result.response
        };
    }

    /**
     * Send SMS notification
     */
    async sendSMSNotification(notification) {
        if (!this.smsTransporter) {
            throw new Error('SMS transporter not configured');
        }

        const message = this.generateSMSMessage(notification);

        const result = await this.smsTransporter.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: notification.userId // Assuming userId is phone for SMS
        });

        console.log(`📱 SMS sent: ${notification.id} -> ${notification.userId}`);

        return {
            sid: result.sid,
            status: result.status
        };
    }

    /**
     * Send real-time notification
     */
    async sendRealtimeNotification(notification) {
        const connection = this.realtimeConnections.get(notification.userId);

        if (connection) {
            // Send via WebSocket or similar real-time connection
            const payload = {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                timestamp: notification.createdAt
            };

            // This would integrate with your WebSocket server
            if (connection.send) {
                connection.send(JSON.stringify(payload));
            }

            console.log(`🔔 Real-time notification sent: ${notification.id} -> ${notification.userId}`);

            return { delivered: true };
        } else {
            // User not connected, will be delivered when they connect
            return { delivered: false, reason: 'user_not_connected' };
        }
    }

    /**
     * Send push notification (for mobile apps)
     */
    async sendPushNotification(notification) {
        // This would integrate with FCM or APNs
        console.log(`📲 Push notification sent: ${notification.id} -> ${notification.userId}`);

        return { delivered: true };
    }

    /**
     * Determine which channels to use for notification
     */
    determineChannels(recipient, notificationData) {
        const channels = [];

        // Default channels based on user preferences and notification type
        if (recipient.email && ['urgent', 'high'].includes(notificationData.priority)) {
            channels.push('email');
        }

        if (recipient.phone && notificationData.priority === 'urgent') {
            channels.push('sms');
        }

        // Always try real-time for connected users
        channels.push('realtime');

        // Add push for mobile users
        if (recipient.deviceToken) {
            channels.push('push');
        }

        // Respect user preferences
        if (recipient.notificationPreferences) {
            return channels.filter(channel =>
                recipient.notificationPreferences[channel] !== false
            );
        }

        return channels;
    }

    /**
     * Generate email template
     */
    generateEmailTemplate(notification) {
        const templates = {
            approval_required: {
                subject: `🔔 Approval Required: ${notification.data.title || 'New Request'}`,
                html: this.getApprovalRequiredTemplate(notification),
                text: `Please review and approve the request: ${notification.data.title || 'New Request'}`
            },
            request_approved: {
                subject: `✅ Request Approved: ${notification.data.title || 'Your Request'}`,
                html: this.getRequestApprovedTemplate(notification),
                text: `Your request has been approved: ${notification.data.title || 'Your Request'}`
            },
            request_rejected: {
                subject: `❌ Request Rejected: ${notification.data.title || 'Your Request'}`,
                html: this.getRequestRejectedTemplate(notification),
                text: `Your request has been rejected: ${notification.data.title || 'Your Request'}`
            },
            approval_reminder: {
                subject: `⏰ Reminder: Pending Approval Required`,
                html: this.getApprovalReminderTemplate(notification),
                text: 'You have pending approvals that require your attention'
            },
            request_cancelled: {
                subject: `🚫 Request Cancelled: ${notification.data.title || 'Request'}`,
                html: this.getRequestCancelledTemplate(notification),
                text: `Request has been cancelled: ${notification.data.title || 'Request'}`
            }
        };

        const template = templates[notification.type] || {
            subject: notification.title,
            html: `<p>${notification.message}</p>`,
            text: notification.message
        };

        return template;
    }

    /**
     * Generate SMS message
     */
    generateSMSMessage(notification) {
        const messages = {
            approval_required: `Approval Required: ${notification.data.title || 'New Request'}. Please review urgently.`,
            request_approved: `Your request "${notification.data.title || 'Request'}" has been approved.`,
            request_rejected: `Your request "${notification.data.title || 'Request'}" has been rejected.`,
            approval_reminder: 'Reminder: You have pending approvals requiring your attention.',
            request_cancelled: `Request "${notification.data.title || 'Request'}" has been cancelled.`
        };

        return messages[notification.type] || notification.message;
    }

    /**
     * Email templates
     */
    getApprovalRequiredTemplate(notification) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #ff6b6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 24px;">🔔 Approval Required</h2>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Request:</strong> ${notification.data.title || 'New Request'}
                    </p>
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Type:</strong> ${this.formatRequestType(notification.data.requestType)}
                    </p>
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Priority:</strong> <span style="color: ${this.getPriorityColor(notification.data.priority)}; font-weight: bold;">${notification.data.priority || 'normal'}</span>
                    </p>
                    ${notification.data.description ? `<p style="margin-bottom: 30px; font-size: 16px;">${notification.data.description}</p>` : ''}
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/approvals/${notification.data.requestId}"
                           style="background-color: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Review Request
                        </a>
                    </div>
                </div>
                <div style="padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
                    <p>This is an automated message. Please do not reply.</p>
                </div>
            </div>
        `;
    }

    getRequestApprovedTemplate(notification) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #51cf66; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 24px;">✅ Request Approved</h2>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Request:</strong> ${notification.data.title || 'Your Request'}
                    </p>
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        Your request has been approved and is now being processed.
                    </p>
                    ${notification.data.approvedBy ? `<p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Approved by:</strong> ${notification.data.approvedBy}
                    </p>` : ''}
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/approvals/${notification.data.requestId}"
                           style="background-color: #51cf66; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    getRequestRejectedTemplate(notification) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #ff6b6b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 24px;">❌ Request Rejected</h2>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Request:</strong> ${notification.data.title || 'Your Request'}
                    </p>
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        Your request has been rejected.
                    </p>
                    ${notification.data.comments ? `<p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Reason:</strong> ${notification.data.comments}
                    </p>` : ''}
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/approvals/${notification.data.requestId}"
                           style="background-color: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    getApprovalReminderTemplate(notification) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #ffd43b; color: #212529; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 24px;">⏰ Approval Reminder</h2>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        You have pending approvals that require your attention.
                    </p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/approvals"
                           style="background-color: #ffd43b; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Review Pending Approvals
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    getRequestCancelledTemplate(notification) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #868e96; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 24px;">🚫 Request Cancelled</h2>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Request:</strong> ${notification.data.title || 'Request'}
                    </p>
                    <p style="margin-bottom: 20px; font-size: 16px;">
                        This request has been cancelled.
                    </p>
                    ${notification.data.reason ? `<p style="margin-bottom: 20px; font-size: 16px;">
                        <strong>Reason:</strong> ${notification.data.reason}
                    </p>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Helper methods
     */
    generateNotificationId() {
        return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    getDefaultTitle(type) {
        const titles = {
            approval_required: 'Approval Required',
            request_approved: 'Request Approved',
            request_rejected: 'Request Rejected',
            approval_reminder: 'Approval Reminder',
            request_cancelled: 'Request Cancelled'
        };

        return titles[type] || 'Notification';
    }

    calculateExpiry(priority) {
        const expiryHours = {
            urgent: 24,
            high: 72,
            normal: 168, // 1 week
            low: 336    // 2 weeks
        };

        const hours = expiryHours[priority] || 168;
        return new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    formatRequestType(type) {
        return type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
    }

    getPriorityColor(priority) {
        const colors = {
            urgent: '#dc3545',
            high: '#fd7e14',
            normal: '#28a745',
            low: '#6c757d'
        };

        return colors[priority] || '#6c757d';
    }

    /**
     * Update notification status in database
     */
    async updateNotificationStatus(notificationId, status, errorMessage = null) {
        if (!this.db) return;

        try {
            const update = {
                status,
                updatedAt: new Date()
            };

            if (errorMessage) {
                update.lastError = errorMessage;
            }

            await this.db.collection('notifications').updateOne(
                { id: notificationId },
                { $set: update }
            );
        } catch (error) {
            console.error('❌ Error updating notification status:', error);
        }
    }

    /**
     * Clean up expired notifications
     */
    async cleanupExpiredNotifications() {
        if (!this.db) return;

        try {
            const result = await this.db.collection('notifications').deleteMany({
                expiresAt: { $lt: new Date() },
                status: { $ne: 'sent' }
            });

            if (result.deletedCount > 0) {
                console.log(`🧹 Cleaned up ${result.deletedCount} expired notifications`);
            }
        } catch (error) {
            console.error('❌ Error cleaning up expired notifications:', error);
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId, options = {}) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        try {
            const { limit = 50, offset = 0, type, status, unreadOnly = false } = options;

            const query = { userId };

            if (type) {
                query.type = type;
            }

            if (status) {
                query.status = status;
            }

            if (unreadOnly) {
                query.read = { $ne: true };
            }

            const notifications = await this.db
                .collection('notifications')
                .find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .toArray();

            const total = await this.db.collection('notifications').countDocuments(query);

            return {
                success: true,
                data: notifications,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + notifications.length < total
                }
            };

        } catch (error) {
            console.error('❌ Error fetching user notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        try {
            const result = await this.db.collection('notifications').updateOne(
                { id: notificationId, userId },
                { $set: { read: true, readAt: new Date() } }
            );

            return {
                success: true,
                modifiedCount: result.modifiedCount
            };

        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for user
     */
    async markAllAsRead(userId) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        try {
            const result = await this.db.collection('notifications').updateMany(
                { userId, read: { $ne: true } },
                { $set: { read: true, readAt: new Date() } }
            );

            return {
                success: true,
                modifiedCount: result.modifiedCount
            };

        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Get notification statistics
     */
    async getNotificationStatistics(userId = null) {
        if (!this.db) {
            await this.initializeDatabase();
        }

        try {
            const matchStage = userId ? { userId } : {};

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        unread: { $sum: { $cond: [{ $ne: ['$read', true] }, 1, 0] } }
                    }
                }
            ];

            const result = await this.db.collection('notifications').aggregate(pipeline).toArray();

            return {
                success: true,
                data: result[0] || {
                    total: 0,
                    sent: 0,
                    failed: 0,
                    pending: 0,
                    unread: 0
                }
            };

        } catch (error) {
            console.error('❌ Error fetching notification statistics:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;