const mongoose = require('mongoose');
const moment = require('moment')

const adminSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'warden', 'security', 'student'],
        default: 'admin'
    },
    department: {
        type: String,
        enum: ['Administration', 'Finance', 'Operations', 'IT', 'HR', 'Academic'],
        default: 'Administration'
    },
    joinDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true }); // 👈 auto-adds createdAt, updatedAt as Date

const bcryptjs = require("bcryptjs");
adminSchema.methods.comparePassword = async function (password) {
    return await bcryptjs.compare(password, this.password);
};

const jwt = require('jsonwebtoken');

adminSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { id: this._id, email: this.email, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);