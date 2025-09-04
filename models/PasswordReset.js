const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'warden', 'security', 'student']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Warden', 'Security', 'Student']
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes for OTP
        index: { expireAfterSeconds: 0 }
    },
    used: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
passwordResetSchema.index({ token: 1, used: 1 });
passwordResetSchema.index({ email: 1, role: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);