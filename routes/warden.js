const router = require("express").Router();
const wardenController = require("../Controllers/wardenCtl");
const { auth, authorize } = require("../middlewares/auth");

router.post("/register", wardenController.registerWarden);
router.post("/login", wardenController.loginWarden);
router.get("/students", auth, authorize('warden', 'admin'), wardenController.getAllStudents);
router.get("/rooms", auth, authorize('warden', 'admin'), wardenController.getAllRooms);
router.post("/assign-room", auth, authorize('warden', 'admin'), wardenController.assignRoom);
router.get("/complaints", auth, authorize('warden', 'admin'), wardenController.getAllComplaints);
router.put("/complaints/:complaintId", auth, authorize('warden', 'admin'), wardenController.updateComplaintStatus);
router.post("/students", auth, authorize('warden', 'admin'), wardenController.addStudent);
router.post("/rooms", auth, authorize('warden', 'admin'), wardenController.addRoom);
router.put("/students/:studentId/fees", auth, authorize('warden', 'admin'), wardenController.updateStudentFeeStatus);

module.exports = router;