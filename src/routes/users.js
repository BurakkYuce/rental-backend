// src/routes/users.js - User Management Routes
const express = require("express");
const router = express.Router();
const { query } = require("express-validator");
const { protect } = require("../middleware/auth");

// Import user management functions from userController and adminController
const {
  getAdminUsers,
} = require("../controllers/userController");

const {
  getAdminDashboardStats,
  getDbStats,
  getAllCars,
  getAllCollections,
} = require("../controllers/adminController");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and admin dashboard endpoints
 */

// All routes require admin authentication
router.use(protect);

// ===== USER MANAGEMENT ROUTES =====

// Get all users for admin management
router.get(
  "/admin",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("status")
      .optional()
      .isIn(["Active", "Inactive"])
      .withMessage("Invalid user status"),
    query("search")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Search query cannot be empty"),
  ],
  getAdminUsers
);

// ===== ADMIN DASHBOARD ROUTES =====

// Get admin dashboard statistics
router.get("/admin/dashboard/stats", getAdminDashboardStats);

// ===== DATABASE MONITORING ROUTES =====

// Get database statistics
router.get("/admin/database/stats", getDbStats);

// Get all cars from database
router.get("/admin/database/cars", getAllCars);

// Get all documents from a specific collection
router.get("/admin/database/collections/:collectionName", getAllCollections);

module.exports = router;
