const router = require("express").Router();
const adminRoutes = require("./admin");
const wardenRoutes = require("./warden");
const securityRoutes = require("./security");
const studentRoutes = require("./student");
const roomRoutes = require("./room");
const authRoutes = require("./auth");
const testEmailRoutes = require("./test-email");
const passwordResetRoutes = require("./passwordReset");

router.use("/admin", adminRoutes);
router.use("/warden", wardenRoutes);
router.use("/security", securityRoutes);
router.use("/student", studentRoutes);
router.use("/rooms", roomRoutes);
router.use("/auth", authRoutes);
router.use("/test-email", testEmailRoutes);
router.use("/password-reset", passwordResetRoutes);

module.exports = router;