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

const { upload } = require("../utils/cloudinary");
const { protect } = require("../middleware/auth");
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
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.post("/logout", protect, logout);

// Avatar management
router.post(
  "/avatar",
  protect,
  upload.single("avatar"),
  validateFileUpload(["image/jpeg", "image/jpg", "image/png"], 2 * 1024 * 1024), // 2MB limit
  uploadAvatar
);
router.delete("/avatar", protect, deleteAvatar);

// Activity log
router.get("/activity", protect, getActivity);

module.exports = router;
