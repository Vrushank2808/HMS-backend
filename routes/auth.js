const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import models
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Security = require('../models/Security');
const OTP = require('../models/OTP');

// Import email service
const { generateOTP, sendOTPEmail, sendCredentialsEmail } = require('../utils/emailService');

// Role-to-model mapping
const roleModels = {
    admin: Admin,
    student: Student,
    warden: Warden,
    security: Security
};

// Helper: find user by email + role
const findUserByEmailAndRole = async (email, role) => {
    const Model = roleModels[role];
    if (!Model) return null;
    return await Model.findOne({ email: email.toLowerCase() });
};

// Test endpoint for auth routes
router.get('/test', (req, res) => {
    res.status(200).json({
        message: "Auth routes are working!",
        timestamp: new Date().toISOString(),
        availableModels: Object.keys(roleModels)
    });
});

// ✅ Check if user exists

router.post('/check-user', async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required' });
        }

        const user = await findUserByEmailAndRole(email, role);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            exists: true,
            fullName: user.fullName,
            email: user.email,
            role: user.role || role
        });
    } catch (error) {
        console.error('Error in check-user (POST):', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.get('/check-user', async (req, res) => {
    try {
        const { email, role } = req.query;
        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required' });
        }

        const user = await findUserByEmailAndRole(email, role);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            exists: true,
            fullName: user.fullName,
            email: user.email,
            role: user.role || role
        });
    } catch (error) {
        console.error('Error in check-user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Step 1: Request OTP
router.post('/request-otp', async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required' });
        }

        const user = await findUserByEmailAndRole(email, role);
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email and role' });
        }

        // Generate OTP
        const otp = generateOTP();

        // Remove any existing OTP for this user
        await OTP.findOneAndDelete({ email: email.toLowerCase(), role });

        // Save OTP
        const otpRecord = new OTP({
            email: email.toLowerCase(),
            otp,
            role,
            userId: user._id
        });
        await otpRecord.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, user.fullName);
        if (!emailResult.success) {
            return res.status(500).json({ message: 'Failed to send OTP', error: emailResult.error });
        }

        res.status(200).json({ message: 'OTP sent successfully', email: email.toLowerCase() });

    } catch (error) {
        console.error('Error in request-otp:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Step 2: Verify OTP & Login
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, password, role } = req.body;
        if (!email || !otp || !password || !role) {
            return res.status(400).json({ message: 'Email, OTP, password, and role are required' });
        }

        // Find and verify OTP
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            otp,
            role,
            verified: false
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Find user
        const user = await findUserByEmailAndRole(email, role);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Mark OTP as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Create JWT
        const token = jwt.sign(
            { id: user._id, role: user.role || role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Clean response (remove password)
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({ message: 'Login successful', token, user: userResponse });

    } catch (error) {
        console.error('Error in verify-otp:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ✅ Send credentials email (for new accounts)
router.post('/send-credentials', async (req, res) => {
    try {
        const { email, role, credentials } = req.body;
        if (!email || !role || !credentials) {
            return res.status(400).json({ message: 'Email, role, and credentials are required' });
        }

        const emailResult = await sendCredentialsEmail(email, credentials, role);
        if (!emailResult.success) {
            return res.status(500).json({ message: 'Failed to send credentials', error: emailResult.error });
        }

        res.status(200).json({ message: 'Credentials sent successfully', messageId: emailResult.messageId });

    } catch (error) {
        console.error('Error in send-credentials:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
