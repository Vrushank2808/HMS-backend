const router = require("express").Router();
const securityController = require("../Controllers/securityCtl");
const { auth, authorize } = require("../middlewares/auth");

router.post("/register", securityController.registerSecurity);
router.post("/login", securityController.loginSecurity);
router.post("/visitors/checkin", auth, authorize('security'), securityController.checkInVisitor);
router.put("/visitors/:visitorId/checkout", auth, authorize('security'), securityController.checkOutVisitor);
router.get("/visitors", auth, authorize('security', 'admin'), securityController.getAllVisitors);
router.get("/students/search", auth, authorize('security'), securityController.searchStudent);

module.exports = router;