// src/routes/cars.js - Araç Routes
const express = require("express");
const {
  getAllCars,
  getFeaturedCars,
  getCar,
  searchCars,
  getCarsByCategory,
  getFilters,
  createCar,
  updateCar,
  deleteCar,
  uploadCarImages,
  deleteCarImage,
  updateCarStatus,
  updateCarOrder,
  bulkUpdateCars,
  getCarStatistics,
  getSimilarCars,
  getPopularCars,
  generateWhatsAppLink,
  exportCars,
} = require("../controllers/carController");

const { upload } = require("../utils/cloudinary");
const { protect, restrictTo } = require("../middleware/auth");
const {
  validateCar,
  validateCarUpdate,
  validateId,
  validateFileUpload,
} = require("../middleware/validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Car management endpoints
 */

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars with filters
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of cars per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Car category
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Car brand
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum daily price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum daily price
 *     responses:
 *       200:
 *         description: List of cars with pagination
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Car'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/cars/featured:
 *   get:
 *     summary: Get featured cars
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of featured cars to return
 *     responses:
 *       200:
 *         description: List of featured cars
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Car'
 */

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get car by ID or slug
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID or slug
 *     responses:
 *       200:
 *         description: Car details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Car'
 *       404:
 *         description: Car not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Create a new car (Admin only)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       201:
 *         description: Car created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Car'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Public routes
router.get("/", getAllCars);
router.get("/featured", getFeaturedCars);
router.get("/popular", getPopularCars);
router.get("/filters", getFilters);
router.post("/search", searchCars);
router.get("/category/:category", getCarsByCategory);
router.get("/:id", validateId, getCar);
router.get("/:id/similar", validateId, getSimilarCars);
router.get("/:id/whatsapp", validateId, generateWhatsAppLink);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo("admin", "super_admin"));

// Admin car management
router.post("/", validateCar, createCar);
router.put("/:id", validateId, validateCarUpdate, updateCar);
router.delete("/:id", validateId, deleteCar);

// Image management
router.post(
  "/:id/images",
  validateId,
  upload.single("image"),
  validateFileUpload(["image/jpeg", "image/jpg", "image/png"], 5 * 1024 * 1024), // 5MB limit
  uploadCarImages
);
router.delete("/:id/images/:imageId", validateId, deleteCarImage);

// Status and order management
router.patch("/:id/status", validateId, updateCarStatus);
router.patch("/:id/order", validateId, updateCarOrder);
router.patch("/bulk", bulkUpdateCars);

// Statistics and export
router.get("/admin/stats", getCarStatistics);
router.get("/admin/export", exportCars);

module.exports = router;
