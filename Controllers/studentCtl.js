const Student = require("../models/Student");
const Room = require("../models/Room");
const Complaint = require("../models/Complaint");
const Visitor = require("../models/Visitor");
const bcryptjs = require("bcryptjs");

module.exports.registerStudent = async (req, res) => {
    try {
        const {
            fullName, email, phone, password, studentId, course, year,
            guardianName, guardianPhone, address, dateOfBirth
        } = req.body;

        const existingStudent = await Student.findOne({
            $or: [{ email }, { studentId }, { phone }]
        });
        if (existingStudent) {
            return res.status(400).json({ message: "Student already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const student = await Student.create({
            fullName, email, phone, password: hashedPassword, studentId,
            course, year, guardianName, guardianPhone, address, dateOfBirth
        });

        res.status(201).json({ message: "Student registered successfully", student });
    } catch (error) {
        console.error("Error in registerStudent:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        const student = await Student.findOne({ email }).populate('roomId');
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const isMatch = await student.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = student.generateAuthToken();
        res.status(200).json({
            token,
            student: {
                id: student._id,
                fullName: student.fullName,
                email: student.email,
                studentId: student.studentId,
                room: student.roomId
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate('roomId')
            .select('-password');

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json({ student });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.submitComplaint = async (req, res) => {
    try {
        const { title, description, category, priority, roomNumber } = req.body;

        const complaint = await Complaint.create({
            title,
            description,
            category,
            priority,
            roomNumber,
            studentId: req.user.id
        });

        res.status(201).json({ message: "Complaint submitted successfully", complaint });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ studentId: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({ complaints });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.getMyVisitors = async (req, res) => {
    try {
        const visitors = await Visitor.find({ studentId: req.user.id })
            .populate('approvedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ visitors });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.getMyFees = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate('roomId', 'roomNumber floor rent')
            .select('feeAmount feeStatus feeDueDate feePayments');

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const totalPaid = student.feePayments.reduce((sum, payment) => sum + payment.amount, 0);
        const feeAmount = student.feeAmount || student.roomId?.rent || 0;
        const remainingAmount = Math.max(0, feeAmount - totalPaid);

        // Recalculate status based on current payments (in case it's out of sync)
        let actualStatus = 'pending';
        if (totalPaid >= feeAmount && feeAmount > 0) {
            actualStatus = 'paid';
        } else if (totalPaid > 0) {
            actualStatus = 'partial';
        }

        // Update status if it's out of sync
        if (actualStatus !== student.feeStatus) {
            await Student.findByIdAndUpdate(req.user.id, { feeStatus: actualStatus });
        }

        res.status(200).json({
            fees: {
                amount: feeAmount,
                totalPaid: totalPaid,
                remainingAmount: remainingAmount,
                status: actualStatus,
                dueDate: student.feeDueDate,
                payments: student.feePayments || [],
                room: student.roomId
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports.payFees = async (req, res) => {
    try {
        const { amount, paymentMethod, transactionId } = req.body;

        const student = await Student.findById(req.user.id).populate('roomId', 'rent');
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Get the fee amount (from student record or room rent)
        const feeAmount = student.feeAmount || student.roomId?.rent || 0;

        // Calculate current total paid
        const currentTotalPaid = student.feePayments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingAmount = feeAmount - currentTotalPaid;

        // Validate payment amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Payment amount must be greater than 0" });
        }

        if (amount > remainingAmount) {
            return res.status(400).json({
                message: `Payment amount (₹${amount}) cannot exceed remaining amount (₹${remainingAmount})`
            });
        }

        if (remainingAmount <= 0) {
            return res.status(400).json({ message: "Fees are already fully paid" });
        }

        // Add payment record
        const payment = {
            amount: parseFloat(amount),
            paymentDate: new Date(),
            paymentMethod: paymentMethod || 'online',
            transactionId: transactionId || `TXN${Date.now()}`,
            status: 'completed'
        };

        // Calculate new total after this payment
        const newTotalPaid = currentTotalPaid + payment.amount;

        // Determine fee status based on total payments
        let newFeeStatus = 'pending';
        if (newTotalPaid >= feeAmount) {
            newFeeStatus = 'paid';
        } else if (newTotalPaid > 0) {
            newFeeStatus = 'partial';
        }

        // Update student fee status
        const updatedStudent = await Student.findByIdAndUpdate(
            req.user.id,
            {
                $push: { feePayments: payment },
                $set: {
                    feeStatus: newFeeStatus,
                    feeDueDate: newFeeStatus === 'paid' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : student.feeDueDate
                }
            },
            { new: true }
        ).populate('roomId', 'roomNumber floor');

        res.status(200).json({
            message: "Fee payment successful",
            payment,
            totalPaid: newTotalPaid,
            remainingAmount: feeAmount - newTotalPaid,
            feeStatus: newFeeStatus,
            student: updatedStudent
        });
    } catch (error) {
        console.error("Error in payFees:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};