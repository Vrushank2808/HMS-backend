const Admin = require("../models/Admin");
const bcryptjs = require("bcryptjs");
const moment = require("moment");
const { sendCredentialsEmail } = require("../utils/emailService");

module.exports.registerAdmin = async (req, res) => {
    console.log("Registering admin with data:", req.body);
    try {
        const { fullName, email, phone, password } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const admin = await Admin.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: "admin",
        });

        // Send credentials email asynchronously (non-blocking)
        setImmediate(async () => {
            try {
                console.log(`📧 Sending credentials email to ${email}...`);
                const emailResult = await sendCredentialsEmail(email, {
                    fullName,
                    email,
                    password // Send original password in email
                }, 'admin');

                if (emailResult.success) {
                    console.log(`✅ Credentials email sent successfully to ${email}`);
                } else {
                    console.error(`❌ Failed to send credentials email to ${email}:`, emailResult.error);
                }
            } catch (emailError) {
                console.error(`❌ Email sending error for ${email}:`, emailError.message);
            }
        });

        res.status(201).json({ message: "Admin registered successfully", admin });
    } catch (error) {
        console.error("Error in registerAdmin:", error);  // 👈 log the actual error
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = admin.generateAuthToken();
        res.status(200).json({
            token,
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports.getDashboardStats = async (req, res) => {
    try {
        const Student = require("../models/Student");
        const Room = require("../models/Room");
        const Complaint = require("../models/Complaint");
        const Visitor = require("../models/Visitor");

        const totalStudents = await Student.countDocuments();
        const totalRooms = await Room.countDocuments();
        const occupiedRooms = await Room.countDocuments({ currentOccupancy: { $gt: 0 } });
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
        const activeVisitors = await Visitor.countDocuments({ status: 'checked-in' });

        res.status(200).json({
            totalStudents,
            totalRooms,
            occupiedRooms,
            availableRooms: totalRooms - occupiedRooms,
            pendingComplaints,
            activeVisitors
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports.getStaff = async (req, res) => {
    try {
        const Warden = require("../models/Warden");
        const Security = require("../models/Security");

        const wardens = await Warden.find().select('-password').sort({ createdAt: -1 });
        const securities = await Security.find().select('-password').sort({ createdAt: -1 });

        res.status(200).json({ wardens, securities });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

// Admin Management Methods
module.exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ admins });
    } catch (error) {
        console.error("Error in getAllAdmins:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports.createAdmin = async (req, res) => {
    try {
        const { fullName, email, phone, password, department, joinDate } = req.body;

        // Validation
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create admin
        const admin = await Admin.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: "admin",
            department: department || 'Administration',
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            status: 'active'
        });

        // Send credentials email asynchronously (non-blocking)
        setImmediate(async () => {
            try {
                console.log(`📧 Sending credentials email to ${email}...`);
                const emailResult = await sendCredentialsEmail(email, {
                    fullName,
                    email,
                    password // Send original password in email
                }, 'admin');

                if (emailResult.success) {
                    console.log(`✅ Credentials email sent successfully to ${email}`);
                } else {
                    console.error(`❌ Failed to send credentials email to ${email}:`, emailResult.error);
                }
            } catch (emailError) {
                console.error(`❌ Email sending error for ${email}:`, emailError.message);
            }
        });

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            message: "Admin created successfully",
            admin: adminResponse
        });
    } catch (error) {
        console.error("Error in createAdmin:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, password, department, joinDate, status } = req.body;

        // Find admin
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== admin.email) {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ message: "Admin with this email already exists" });
            }
        }

        // Update fields
        if (fullName) admin.fullName = fullName;
        if (email) admin.email = email;
        if (phone) admin.phone = phone;
        if (department) admin.department = department;
        if (joinDate) admin.joinDate = new Date(joinDate);
        if (status) admin.status = status;
        if (password) {
            admin.password = await bcryptjs.hash(password, 10);
        }

        await admin.save();

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(200).json({
            message: "Admin updated successfully",
            admin: adminResponse
        });
    } catch (error) {
        console.error("Error in updateAdmin:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (req.user.id === id) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        // Find and delete admin
        const admin = await Admin.findByIdAndDelete(id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (error) {
        console.error("Error in deleteAdmin:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

