const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Security = require('../models/Security');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user;
        switch (decoded.role) {
            case 'admin':
                user = await Admin.findById(decoded.id).select('-password');
                break;
            case 'student':
                user = await Student.findById(decoded.id).select('-password');
                break;
            case 'warden':
                user = await Warden.findById(decoded.id).select('-password');
                break;
            case 'security':
                user = await Security.findById(decoded.id).select('-password');
                break;
            default:
                return res.status(401).json({ message: 'Invalid token' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Access denied. Insufficient permissions.'
            });
        }
        next();
    };
};

module.exports = { auth, authorize };