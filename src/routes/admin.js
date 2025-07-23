// src/routes/admin.js - Admin Dashboard Routes (maintaining original /api/admin/* structure)
const express = require("express");
const router = express.Router();
const { query, body } = require("express-validator");
const { protect } = require("../middleware/auth");

// Import admin functions from various controllers
const {
  getAdminRecentBookings,
  getAdminBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");

const {
  getAdminUsers,
} = require("../controllers/userController");

const {
  getAdminDashboardStats,
  getDbStats,
  getAllCars,
  getAllCollections,
  getLocations,
  adminLogin,
  createAdmin,
} = require("../controllers/adminController");

const {
  getAdminCars,
  getAdminCarDetails,
  createAdminCar,
  updateAdminCar,
  deleteAdminCar,
  getCarScheduledPricing,
  addCarScheduledPricing,
  deleteCarScheduledPricing,
  updateCarInventory,
} = require("../controllers/carController");

const {
  getAdminNews,
  getAdminNewsDetails,
  createAdminNews,
  updateAdminNews,
  deleteAdminNews,
  updateNewsStatus,
} = require("../controllers/contentController");

const {
  getAdminBlogs,
  getAdminBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  updateBlogStatus,
} = require("../controllers/blogController");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard and management endpoints
 */

// Apply auth middleware to all admin routes
router.use(protect);

// ===== DASHBOARD ROUTES =====

// Get admin dashboard statistics
router.get("/dashboard/stats", getAdminDashboardStats);

// Get recent bookings for admin dashboard
router.get(
  "/dashboard/recent-bookings",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limit must be between 1 and 20"),
  ],
  getAdminRecentBookings
);

// ===== BOOKING MANAGEMENT ROUTES =====

// Get all bookings for admin management
router.get(
  "/bookings",
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
      .isIn(["Pending", "Active", "Completed", "Cancelled"])
      .withMessage("Invalid booking status"),
    query("search")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Search query cannot be empty"),
  ],
  getAdminBookings
);

// Update booking status
router.put(
  "/bookings/:id/status",
  [
    body("status")
      .notEmpty()
      .isIn(["Pending", "Active", "Completed", "Cancelled"])
      .withMessage("Valid booking status is required"),
  ],
  updateBookingStatus
);

// ===== CAR MANAGEMENT ROUTES =====

// Get all cars for admin with pagination and search
router.get(
  "/cars",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("search")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Search query cannot be empty"),
    query("status")
      .optional()
      .isIn(["Available", "Rented", "Maintenance", "Out of Service"])
      .withMessage("Invalid status"),
  ],
  getAdminCars
);

// Get single car for admin editing
router.get("/cars/:id", getAdminCarDetails);

// Create new car
router.post(
  "/cars",
  [
    body("title")
      .notEmpty()
      .isLength({ min: 2, max: 200 })
      .withMessage("Car title must be between 2 and 200 characters"),
    body("pricing.daily")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("Daily price is required and must be a positive number"),
    body("category")
      .optional()
      .isIn([
        "Ekonomik",
        "Orta Sınıf", 
        "Üst Sınıf",
        "SUV",
        "Geniş",
        "Lüks",
      ])
      .withMessage("Invalid car category"),
    body("status")
      .optional()
      .isBoolean()
      .withMessage("Status must be a boolean"),
    body("seats")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("Seats must be between 1 and 12"),
    body("doors")
      .optional()
      .isInt({ min: 2, max: 5 })
      .withMessage("Doors must be between 2 and 5"),
    body("year")
      .optional()
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage("Invalid year"),
    body("transmission")
      .optional()
      .isIn(["Otomatik", "Manuel", "Yarı Otomatik"])
      .withMessage("Invalid transmission type"),
    body("fuelType")
      .optional()
      .isIn(["Benzin", "Dizel", "Elektrikli", "Hibrit"])
      .withMessage("Invalid fuel type"),
    body("features")
      .optional()
      .isArray()
      .withMessage("Features must be an array"),
  ],
  createAdminCar
);

// Update existing car
router.put(
  "/cars/:id",
  [
    body("title")
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage("Car title must be between 2 and 200 characters"),
    body("pricing.daily")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Daily price must be a positive number"),
    body("category")
      .optional()
      .isIn([
        "Ekonomik",
        "Orta Sınıf",
        "Üst Sınıf", 
        "SUV",
        "Geniş",
        "Lüks",
      ])
      .withMessage("Invalid car category"),
    body("status")
      .optional()
      .isBoolean()
      .withMessage("Status must be a boolean"),
    body("seats")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("Seats must be between 1 and 12"),
    body("doors")
      .optional()
      .isInt({ min: 2, max: 5 })
      .withMessage("Doors must be between 2 and 5"),
    body("year")
      .optional()
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage("Invalid year"),
    body("transmission")
      .optional()
      .isIn(["Otomatik", "Manuel", "Yarı Otomatik"])
      .withMessage("Invalid transmission type"),
    body("fuelType")
      .optional()
      .isIn(["Benzin", "Dizel", "Elektrikli", "Hibrit"])
      .withMessage("Invalid fuel type"),
    body("features")
      .optional()
      .isArray()
      .withMessage("Features must be an array"),
  ],
  updateAdminCar
);

// Delete car
router.delete("/cars/:id", deleteAdminCar);

// Get scheduled pricing for a car
router.get("/cars/:id/scheduled-pricing", getCarScheduledPricing);

// Add scheduled pricing for a car
router.post(
  "/cars/:id/scheduled-pricing",
  [
    body("name")
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage("Pricing name must be between 2 and 100 characters"),
    body("startDate")
      .notEmpty()
      .isISO8601()
      .withMessage("Valid start date is required"),
    body("endDate")
      .notEmpty()
      .isISO8601()
      .withMessage("Valid end date is required"),
    body("prices.USD")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("USD price must be a positive number"),
    body("prices.EUR")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("EUR price must be a positive number"),
    body("prices.TRY")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("TRY price must be a positive number"),
  ],
  addCarScheduledPricing
);

// Delete scheduled pricing for a car
router.delete("/cars/:id/scheduled-pricing/:pricingId", deleteCarScheduledPricing);

// Update car inventory
router.put(
  "/cars/:id/inventory",
  [
    body("totalUnits")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Total units must be a non-negative integer"),
    body("rentedUnits")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Rented units must be a non-negative integer"),
    body("maintenanceUnits")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Maintenance units must be a non-negative integer"),
    body("outOfServiceUnits")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Out of service units must be a non-negative integer"),
  ],
  updateCarInventory
);

// ===== USER MANAGEMENT ROUTES =====

// Get all users for admin management
router.get(
  "/users",
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

// ===== NEWS MANAGEMENT ROUTES =====

// Get all news articles for admin management
router.get(
  "/news",
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
      .isIn(["published", "draft", "archived"])
      .withMessage("Invalid article status"),
    query("search")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Search query cannot be empty"),
  ],
  getAdminNews
);

// Get single news article for admin editing
router.get("/news/:id", getAdminNewsDetails);

// Create new news article
router.post(
  "/news",
  [
    body("title")
      .notEmpty()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    body("content")
      .notEmpty()
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters"),
    body("excerpt")
      .optional()
      .isLength({ max: 300 })
      .withMessage("Excerpt must be less than 300 characters"),
    body("image").optional().isURL().withMessage("Image must be a valid URL"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("author")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Author name must be between 2 and 100 characters"),
    body("status")
      .optional()
      .isIn(["draft", "published", "archived"])
      .withMessage("Invalid article status"),
    body("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
  ],
  createAdminNews
);

// Update existing news article
router.put(
  "/news/:id",
  [
    body("title")
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    body("content")
      .optional()
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters"),
    body("excerpt")
      .optional()
      .isLength({ max: 300 })
      .withMessage("Excerpt must be less than 300 characters"),
    body("image").optional().isURL().withMessage("Image must be a valid URL"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("author")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Author name must be between 2 and 100 characters"),
    body("status")
      .optional()
      .isIn(["draft", "published", "archived"])
      .withMessage("Invalid article status"),
    body("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
  ],
  updateAdminNews
);

// Delete news article
router.delete("/news/:id", deleteAdminNews);

// Update news article publication status
router.patch(
  "/news/:id/publish",
  [
    body("status")
      .notEmpty()
      .isIn(["published", "draft", "archived"])
      .withMessage("Valid article status is required"),
  ],
  updateNewsStatus
);

// ===== DATABASE MONITORING ROUTES =====

// Get database statistics
router.get("/database/stats", getDbStats);

// Get all cars from database
router.get("/database/cars", getAllCars);

// Get all documents from a specific collection
router.get("/database/collections/:collectionName", getAllCollections);

// ===== BLOG ROUTES =====

// Get all blogs for admin (including drafts)
router.get(
  "/blogs",
  protect,
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
      .isIn(["draft", "published", "archived"])
      .withMessage("Invalid status"),
    query("category")
      .optional()
      .isString()
      .withMessage("Category must be a string"),
    query("search")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Search query cannot be empty"),
  ],
  getAdminBlogs
);

// Get single blog for admin editing
router.get("/blogs/:id", protect, getAdminBlog);

// Create new blog post
router.post(
  "/blogs",
  protect,
  [
    body("title")
      .notEmpty()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    body("excerpt")
      .notEmpty()
      .isLength({ min: 10, max: 300 })
      .withMessage("Excerpt must be between 10 and 300 characters"),
    body("content")
      .notEmpty()
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters"),
    body("category")
      .optional()
      .isIn([
        "Car Reviews",
        "Travel Tips",
        "Maintenance",
        "Insurance",
        "Road Safety",
        "Car Tech",
        "Company News",
        "Industry News",
      ])
      .withMessage("Invalid category"),
    body("status")
      .optional()
      .isIn(["draft", "published", "archived"])
      .withMessage("Invalid status"),
    body("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
    body("tags")
      .optional()
      .isArray()
      .withMessage("Tags must be an array"),
  ],
  createBlog
);

// Update blog post
router.put(
  "/blogs/:id",
  protect,
  [
    body("title")
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    body("excerpt")
      .optional()
      .isLength({ min: 10, max: 300 })
      .withMessage("Excerpt must be between 10 and 300 characters"),
    body("content")
      .optional()
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters"),
    body("category")
      .optional()
      .isIn([
        "Car Reviews",
        "Travel Tips",
        "Maintenance",
        "Insurance",
        "Road Safety",
        "Car Tech",
        "Company News",
        "Industry News",
      ])
      .withMessage("Invalid category"),
    body("status")
      .optional()
      .isIn(["draft", "published", "archived"])
      .withMessage("Invalid status"),
    body("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
    body("tags")
      .optional()
      .isArray()
      .withMessage("Tags must be an array"),
  ],
  updateBlog
);

// Delete blog post
router.delete("/blogs/:id", protect, deleteBlog);

// Toggle blog featured status
router.patch("/blogs/:id/featured", protect, toggleFeatured);

// Update blog status
router.patch(
  "/blogs/:id/status",
  protect,
  [
    body("status")
      .notEmpty()
      .isIn(["draft", "published", "archived"])
      .withMessage("Status must be draft, published, or archived"),
  ],
  updateBlogStatus
);

// ===== LOCATION ROUTES =====

// Get all locations
router.get("/locations", getLocations);

module.exports = router;