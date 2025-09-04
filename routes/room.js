const router = require("express").Router();
const Room = require("../models/Room");
const { auth, authorize } = require("../middlewares/auth");

// Create room
router.post("/", auth, authorize('admin'), async (req, res) => {
    try {
        const room = await Room.create(req.body);
        res.status(201).json({ message: "Room created successfully", room });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get all rooms
router.get("/", auth, async (req, res) => {
    try {
        const rooms = await Room.find().populate('students', 'fullName studentId');
        res.status(200).json({ rooms });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get available rooms
router.get("/available", auth, async (req, res) => {
    try {
        const rooms = await Room.find({
            $expr: { $lt: ["$currentOccupancy", "$capacity"] },
            status: 'available'
        });
        res.status(200).json({ rooms });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Update room
router.put("/:id", auth, authorize('admin'), async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json({ message: "Room updated successfully", room });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;