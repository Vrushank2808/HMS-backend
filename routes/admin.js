const router = require("express").Router();
const adminController = require("../Controllers/adminCtl");


const { auth, authorize } = require("../middlewares/auth");

router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);
router.get("/dashboard", auth, authorize('admin'), adminController.getDashboardStats);
router.get("/staff", auth, authorize('admin'), adminController.getStaff);

// Admin Management Routes
router.get("/admins", auth, authorize('admin'), adminController.getAllAdmins);
router.post("/admins", auth, authorize('admin'), adminController.createAdmin);
router.put("/admins/:id", auth, authorize('admin'), adminController.updateAdmin);
router.delete("/admins/:id", auth, authorize('admin'), adminController.deleteAdmin);



module.exports = router;