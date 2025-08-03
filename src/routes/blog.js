// src/routes/blog.js - Fixed Imports
const express = require("express");
const router = express.Router();
const { query, body, param } = require("express-validator");
const { adminAuth: protect } = require("../middleware/auth");

// ✅ Doğru import - mevcut validation.js dosyasından
const { handleValidationErrors } = require("../middleware/validation");

const {
  getBlogs,
  getFeaturedBlogs,
  getBlog,
  getCategories,
  getPopularTags,
  searchBlogs,
  getAdminBlogs,
  getAdminBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  updateBlogStatus,
} = require("../controllers/blogController");

// ===== PUBLIC ROUTES =====

router.get(
  "/blogs",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("category")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Category must be a valid string"),
    query("tag")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Tag must be a valid string"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Search query must be between 1 and 200 characters"),
    query("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
  ],
  handleValidationErrors, // ✅ Mevcut validation middleware'i kullan
  getBlogs
);

router.get(
  "/blogs/featured",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limit must be between 1 and 20"),
  ],
  handleValidationErrors,
  getFeaturedBlogs
);

router.get("/blogs/categories", getCategories);

router.get(
  "/blogs/tags",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  getPopularTags
);

router.get(
  "/blogs/search",
  [
    query("q")
      .notEmpty()
      .isLength({ min: 1, max: 200 })
      .withMessage(
        "Search query is required and must be between 1-200 characters"
      ),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  searchBlogs
);

router.get(
  "/blogs/:slug",
  [
    param("slug")
      .isString()
      .isLength({ min: 1, max: 250 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid blog slug format"),
  ],
  handleValidationErrors,
  getBlog
);

// ===== ADMIN ROUTES (Protected) =====

router.get(
  "/admin/blogs",
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
      .withMessage("Status must be draft, published, or archived"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Search query must be between 1 and 200 characters"),
    query("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
    query("tag")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Tag must be a valid string"),
  ],
  handleValidationErrors,
  getAdminBlogs
);

router.get(
  "/admin/blogs/:id",
  protect,
  [
    param("id")
      .isString()
      .custom((value) => {
        // Allow 'new' or UUID format
        if (value === "new") return true;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          throw new Error('ID must be a valid UUID or "new"');
        }
        return true;
      }),
  ],
  handleValidationErrors,
  getAdminBlog
);

router.post(
  "/admin/blogs",
  protect,
  [
    body("title")
      .notEmpty()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    body("content")
      .notEmpty()
      .trim()
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters"),
    body("excerpt")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Excerpt must be less than 500 characters"),
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
      .isArray({ max: 10 })
      .withMessage("Tags must be an array with maximum 10 items"),
  ],
  handleValidationErrors,
  createBlog
);

router.put(
  "/admin/blogs/:id",
  protect,
  [
    param("id").isUUID().withMessage("Invalid blog ID format"),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be between 5 and 200 characters"),
    body("content")
      .optional()
      .trim()
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters"),
    body("excerpt")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Excerpt must be less than 500 characters"),
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
      .isArray({ max: 10 })
      .withMessage("Tags must be an array with maximum 10 items"),
  ],
  handleValidationErrors,
  updateBlog
);

router.delete(
  "/admin/blogs/:id",
  protect,
  [param("id").isUUID().withMessage("Invalid blog ID format")],
  handleValidationErrors,
  deleteBlog
);

router.patch(
  "/admin/blogs/:id/featured",
  protect,
  [param("id").isUUID().withMessage("Invalid blog ID format")],
  handleValidationErrors,
  toggleFeatured
);

router.patch(
  "/admin/blogs/:id/status",
  protect,
  [
    param("id").isUUID().withMessage("Invalid blog ID format"),
    body("status")
      .notEmpty()
      .isIn(["draft", "published", "archived"])
      .withMessage("Status must be draft, published, or archived"),
  ],
  handleValidationErrors,
  updateBlogStatus
);

module.exports = router;
