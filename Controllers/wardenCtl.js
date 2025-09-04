const Warden = require("../models/Warden");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Complaint = require("../models/Complaint");
const bcryptjs = require("bcryptjs");

module.exports.registerWarden = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        const existingWarden = await Warden.findOne({
            $or: [{ email }, { phone }]
        });
        if (existingWarden) {
            return res.status(400).json({ message: "Warden already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const warden = await Warden.create({
            fullName, email, phone, password: hashedPassword
        });

        res.status(201).json({ message: "Warden registered successfully", warden });
    } catch (error) {
        console.error("Error in registerWarden:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.loginWarden = async (req, res) => {
    try {
        const { email, password } = req.body;

        const warden = await Warden.findOne({ email });
        if (!warden) {
            return res.status(404).json({ message: "Warden not found" });
        }

        const isMatch = await bcryptjs.compare(password, warden.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = warden.generateAuthToken();
        res.status(200).json({
            token,
            warden: {
                id: warden._id,
                fullName: warden.fullName,
                email: warden.email,
                role: warden.role
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .populate('roomId', 'roomNumber floor')
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({ students });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find()
            .populate('students', 'fullName studentId email')
            .sort({ roomNumber: 1 });

        res.status(200).json({ rooms });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.assignRoom = async (req, res) => {
    try {
        const { studentId, roomId } = req.body;

        const student = await Student.findById(studentId);
        const room = await Room.findById(roomId);

        if (!student || !room) {
            return res.status(404).json({ message: "Student or Room not found" });
        }

        if (room.currentOccupancy >= room.capacity) {
            return res.status(400).json({ message: "Room is at full capacity" });
        }

        // Remove student from previous room if any
        if (student.roomId) {
            await Room.findByIdAndUpdate(student.roomId, {
                $pull: { students: studentId },
                $inc: { currentOccupancy: -1 }
            });
        }

        // Assign to new room
        await Room.findByIdAndUpdate(roomId, {
            $push: { students: studentId },
            $inc: { currentOccupancy: 1 }
        });

        await Student.findByIdAndUpdate(studentId, { roomId });

        res.status(200).json({ message: "Room assigned successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('studentId', 'fullName studentId email')
            .populate('assignedTo', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ complaints });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.updateComplaintStatus = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status, adminResponse } = req.body;

        const updateData = { status };
        if (adminResponse) updateData.adminResponse = adminResponse;
        if (status === 'resolved') updateData.resolvedAt = new Date();

        const complaint = await Complaint.findByIdAndUpdate(
            complaintId,
            updateData,
            { new: true }
        ).populate('studentId', 'fullName studentId');

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        res.status(200).json({ message: "Complaint updated successfully", complaint });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.addStudent = async (req, res) => {
    try {
        const { fullName, email, phone, studentId, course, year, roomId, feeAmount, feeStatus, guardianName, guardianPhone, address, dateOfBirth } = req.body;

        // Check if student already exists
        const existingStudent = await Student.findOne({
            $or: [{ email }, { phone }, { studentId }]
        });
        if (existingStudent) {
            return res.status(400).json({ message: "Student already exists" });
        }

        // Generate default password
        const defaultPassword = studentId + "@123";
        const hashedPassword = await bcryptjs.hash(defaultPassword, 10);

        const studentData = {
            fullName,
            email,
            phone,
            password: hashedPassword,
            studentId,
            course,
            year,
            guardianName: guardianName || 'N/A',
            guardianPhone: guardianPhone || 'N/A',
            address: address || 'N/A',
            dateOfBirth: dateOfBirth || new Date(),
            feeAmount: feeAmount || 0,
            feeStatus: feeStatus || 'pending'
        };

        if (roomId) {
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({ message: "Room not found" });
            }
            if (room.currentOccupancy >= room.capacity) {
                return res.status(400).json({ message: "Room is at full capacity" });
            }
            studentData.roomId = roomId;
            studentData.feeAmount = studentData.feeAmount || room.rent;
        }

        const student = await Student.create(studentData);

        // Update room if assigned
        if (roomId) {
            await Room.findByIdAndUpdate(roomId, {
                $push: { students: student._id },
                $inc: { currentOccupancy: 1 }
            });
        }

        res.status(201).json({ message: "Student added successfully", student });
    } catch (error) {
        console.error("Error in addStudent:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.addRoom = async (req, res) => {
    try {
        const { roomNumber, floor, capacity, rent, status } = req.body;

        // Check if room already exists
        const existingRoom = await Room.findOne({ roomNumber });
        if (existingRoom) {
            return res.status(400).json({ message: "Room number already exists" });
        }

        const room = await Room.create({
            roomNumber,
            floor,
            capacity: capacity || 2,
            rent: rent || 0,
            status: status || 'available',
            currentOccupancy: 0,
            students: []
        });

        res.status(201).json({ message: "Room added successfully", room });
    } catch (error) {
        console.error("Error in addRoom:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.updateStudentFeeStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { feeStatus } = req.body;

        const student = await Student.findByIdAndUpdate(
            studentId,
            { feeStatus },
            { new: true }
        ).populate('roomId', 'roomNumber floor');

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json({ message: "Fee status updated successfully", student });
    } catch (error) {
        console.error("Error in updateStudentFeeStatus:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};