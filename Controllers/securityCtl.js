const Security = require("../models/Security");
const Visitor = require("../models/Visitor");
const Student = require("../models/Student");
const bcryptjs = require("bcryptjs");

module.exports.registerSecurity = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        const existingSecurity = await Security.findOne({
            $or: [{ email }, { phone }]
        });
        if (existingSecurity) {
            return res.status(400).json({ message: "Security personnel already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const security = await Security.create({
            fullName, email, phone, password: hashedPassword
        });

        res.status(201).json({ message: "Security personnel registered successfully", security });
    } catch (error) {
        console.error("Error in registerSecurity:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.loginSecurity = async (req, res) => {
    try {
        const { email, password } = req.body;

        const security = await Security.findOne({ email });
        if (!security) {
            return res.status(404).json({ message: "Security personnel not found" });
        }

        const isMatch = await bcryptjs.compare(password, security.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token (you'll need to add this method to Security model)
        const token = security.generateAuthToken();
        res.status(200).json({
            token,
            security: {
                id: security._id,
                fullName: security.fullName,
                email: security.email,
                role: security.role
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.checkInVisitor = async (req, res) => {
    try {
        const { visitorName, visitorPhone, studentId, purpose } = req.body;

        // Verify student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const visitor = await Visitor.create({
            visitorName,
            visitorPhone,
            studentId,
            purpose,
            approvedBy: req.user.id
        });

        await visitor.populate('studentId', 'fullName studentId roomId');

        res.status(201).json({ message: "Visitor checked in successfully", visitor });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.checkOutVisitor = async (req, res) => {
    try {
        const { visitorId } = req.params;

        const visitor = await Visitor.findByIdAndUpdate(
            visitorId,
            {
                checkOutTime: new Date(),
                status: 'checked-out'
            },
            { new: true }
        ).populate('studentId', 'fullName studentId');

        if (!visitor) {
            return res.status(404).json({ message: "Visitor not found" });
        }

        res.status(200).json({ message: "Visitor checked out successfully", visitor });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.getAllVisitors = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const visitors = await Visitor.find(filter)
            .populate('studentId', 'fullName studentId roomId')
            .populate('approvedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ visitors });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.searchStudent = async (req, res) => {
    try {
        const { query } = req.query;

        const students = await Student.find({
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { studentId: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).populate('roomId', 'roomNumber').select('-password').limit(10);

        res.status(200).json({ students });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};