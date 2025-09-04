const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true
    },
    floor: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        default: 2
    },
    currentOccupancy: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['single', 'double', 'triple'],
        default: 'double'
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'maintenance', 'reserved'],
        default: 'available'
    },
    rent: {
        type: Number,
        required: true
    },
    facilities: [{
        type: String
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }]
}, { timestamps: true });

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);