const express = require('express');
const router = express.Router();
const { sendOTPEmail, sendCredentialsEmail } = require('../utils/emailService');

// Test OTP email
router.post('/test-otp', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const testOTP = '123456';
        const result = await sendOTPEmail(email, testOTP, name || 'Test User');

        if (result.success) {
            res.status(200).json({
                message: 'Test OTP email sent successfully',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Test credentials email
router.post('/test-credentials', async (req, res) => {
    try {
        const { email, name, role } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const testCredentials = {
            fullName: name || 'Test User',
            email: email,
            password: 'TestPassword123',
            studentId: role === 'student' ? 'STU2025001' : undefined
        };

        const result = await sendCredentialsEmail(email, testCredentials, role || 'admin');

        if (result.success) {
            res.status(200).json({
                message: 'Test credentials email sent successfully',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Check email configuration
router.get('/check-config', (req, res) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const frontendUrl = process.env.FRONTEND_URL;

    res.status(200).json({
        configured: !!(emailUser && emailPass),
        emailUser: emailUser ? emailUser.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not configured',
        emailPass: emailPass ? '***configured***' : 'Not configured',
        frontendUrl: frontendUrl || 'http://localhost:5174 (default)'
    });
});

module.exports = router;