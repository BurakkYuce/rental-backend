// src/routes/auth.js - Authentication Routes
const express = require("express");
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  checkSetup,
  initialSetup,
  uploadAvatar,
  deleteAvatar,
  getActivity,
  verifyToken,
} = require("../controllers/authController");

// Import admin auth functions from authController
const {
  adminLogin,
  createAdmin,
} = require("../controllers/authController");

const { upload } = require("../utils/cloudinary");
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const {
  validateLogin,
  validateAdmin,
  validateFileUpload,
} = require("../middleware/validation");

const router = express.Router();

// Public routes
router.get("/check-setup", checkSetup);
router.post("/setup", validateAdmin, initialSetup);
router.post("/login", validateLogin, login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resettoken", resetPassword);
router.get("/verify", verifyToken);

// Protected routes
router.get("/me", auth, getMe);
router.put("/profile", auth, updateProfile);
router.put("/password", auth, changePassword);
router.post("/logout", auth, logout);

// Avatar management
router.post(
  "/avatar",
  auth,
  upload.single("avatar"),
  validateFileUpload(["image/jpeg", "image/jpg", "image/png"], 2 * 1024 * 1024), // 2MB limit
  uploadAvatar
);
router.delete("/avatar", auth, deleteAvatar);

// Activity log
router.get("/activity", auth, getActivity);

// ===== ADMIN AUTHENTICATION ROUTES =====

// Admin login
router.post(
  "/admin/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  adminLogin
);

// Create new admin
router.post(
  "/admin/register",
  [
    body("username")
      .notEmpty()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be 3-20 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("role")
      .optional()
      .isIn(["super_admin", "admin", "manager", "editor"])
      .withMessage("Invalid role"),
  ],
  createAdmin
);

module.exports = router;
