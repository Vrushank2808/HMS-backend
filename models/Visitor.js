const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    visitorName: {
        type: String,
        required: true
    },
    visitorPhone: {
        type: String,
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    checkOutTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['checked-in', 'checked-out'],
        default: 'checked-in'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Security'
    }
}, { timestamps: true });

module.exports = mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);