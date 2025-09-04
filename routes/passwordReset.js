const express = require('express');
const bcrypt = require('bcryptjs');
const PasswordReset = require('../models/PasswordReset');
const Admin = require('../models/Admin');
const Warden = require('../models/Warden');
const Security = require('../models/Security');
const Student = require('../models/Student');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

const router = express.Router();

// Model mapping
const modelMap = {
    admin: { model: Admin, modelName: 'Admin' },
    warden: { model: Warden, modelName: 'Warden' },
    security: { model: Security, modelName: 'Security' },
    student: { model: Student, modelName: 'Student' }
};

// Step 1: Request password reset OTP
router.post('/request-otp', async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email and role are required'
            });
        }

        if (!modelMap[role]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Find user by email and role
        const UserModel = modelMap[role].model;
        const user = await UserModel.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, an OTP has been sent for password reset.'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Delete any existing reset records for this user
        await PasswordReset.deleteMany({
            email: email.toLowerCase(),
            role: role
        });

        // Create new password reset record with OTP
        const passwordReset = new PasswordReset({
            email: email.toLowerCase(),
            token: otp, // Store OTP as token
            role: role,
            userId: user._id,
            userModel: modelMap[role].modelName,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes for OTP
        });

        await passwordReset.save();

        // Send OTP email for password reset
        const emailResult = await sendOTPEmail(
            email,
            otp,
            user.name || user.username || 'User',
            'Password Reset'
        );

        if (!emailResult.success) {
            console.error('Failed to send password reset OTP:', emailResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset OTP. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, an OTP has been sent for password reset.',
            userInfo: {
                email: user.email,
                name: user.name || user.username || 'User',
                role: role
            }
        });

    } catch (error) {
        console.error('Password reset OTP request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again.'
        });
    }
});

// Step 2: Verify OTP and reset password
router.post('/verify-and-reset', async (req, res) => {
    try {
        const { email, role, otp, newPassword } = req.body;

        if (!email || !role || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find and validate OTP
        const resetRecord = await PasswordReset.findOne({
            token: otp,
            email: email.toLowerCase(),
            role: role,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Get user model and update password
        const UserModel = modelMap[role].model;
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await UserModel.findByIdAndUpdate(resetRecord.userId, {
            password: hashedPassword
        });

        // Mark OTP as used
        resetRecord.used = true;
        await resetRecord.save();

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again.'
        });
    }
});

// Verify OTP only (without resetting password)
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, role, otp } = req.body;

        if (!email || !role || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email, role, and OTP are required'
            });
        }

        // Find and validate OTP
        const resetRecord = await PasswordReset.findOne({
            token: otp,
            email: email.toLowerCase(),
            role: role,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                email: resetRecord.email,
                role: resetRecord.role
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get password reset history (Admin only)
router.get('/history', async (req, res) => {
    try {
        // Note: In a real app, you'd verify admin authentication here
        // For now, we'll return recent password reset records

        const resetHistory = await PasswordReset.find({
            used: true
        })
            .sort({ updatedAt: -1 })
            .limit(50)
            .select('email role updatedAt userModel')
            .lean();

        // Format the history for frontend
        const formattedHistory = resetHistory.map(reset => ({
            email: reset.email,
            role: reset.role,
            timestamp: reset.updatedAt,
            resetBy: 'Self' // In a real app, you'd track who performed the reset
        }));

        res.status(200).json({
            success: true,
            history: formattedHistory
        });

    } catch (error) {
        console.error('Password reset history error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;