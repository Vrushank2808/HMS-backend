const router = require("express").Router();
const studentController = require("../Controllers/studentCtl");
const { auth, authorize } = require("../middlewares/auth");

router.post("/register", studentController.registerStudent);
router.post("/login", studentController.loginStudent);
router.get("/profile", auth, authorize('student'), studentController.getProfile);
router.post("/complaints", auth, authorize('student'), studentController.submitComplaint);
router.get("/complaints", auth, authorize('student'), studentController.getMyComplaints);
router.get("/visitors", auth, authorize('student'), studentController.getMyVisitors);
router.get("/fees", auth, authorize('student'), studentController.getMyFees);
router.post("/fees/pay", auth, authorize('student'), studentController.payFees);

module.exports = router;