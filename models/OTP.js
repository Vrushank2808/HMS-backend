const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'student', 'warden', 'security']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    expiresAt: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for automatic cleanup - 10 minutes (600 seconds)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.models.OTP || mongoose.model('OTP', otpSchema);