// src/routes/content.js - Content Management Routes (News, Testimonials, Comments, Company, Social)
const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const { protect } = require("../middleware/auth");

// Import content functions from contentController
const {
  getAllNews,
  getSingleNews,
  getRecentNews,
  getPopularTags,
  getTestimonials,
  getNewsComments,
  postNewsComment,
  getCompanyAbout,
  trackSocialShare,
  getAdminNews,
  getAdminNewsDetails,
  createAdminNews,
  updateAdminNews,
  deleteAdminNews,
  updateNewsStatus,
} = require("../controllers/contentController");

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Content management endpoints (News, Testimonials, Comments, Company, Social)
 */

// ===== NEWS ROUTES =====

// Get all news articles with pagination and filtering
router.get(
  "/news",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("tag")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Tag cannot be empty"),
    query("search")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Search query cannot be empty"),
  ],
  getAllNews
);

// Get recent news posts for sidebar
router.get(
  "/news/recent",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limit must be between 1 and 20"),
  ],
  getRecentNews
);

// Get popular tags
router.get("/news/tags", getPopularTags);

// Get single news article by ID or slug
router.get("/news/:id", getSingleNews);

// ===== TESTIMONIALS ROUTES =====

// Get testimonials
router.get(
  "/testimonials",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limit must be between 1 and 20"),
  ],
  getTestimonials
);

// ===== COMMENTS ROUTES =====

// Get comments for a news article
router.get(
  "/news/:articleId/comments",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  getNewsComments
);

// Post a comment on a news article
router.post(
  "/news/:articleId/comments",
  [
    body("name")
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("message")
      .notEmpty()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Message must be between 10 and 1000 characters"),
    body("parentId")
      .optional()
      .isMongoId()
      .withMessage("Invalid parent comment ID"),
  ],
  postNewsComment
);

// ===== COMPANY ROUTES =====

// Get company about information
router.get("/company/about", getCompanyAbout);

// ===== SOCIAL ROUTES =====

// Track social media shares
router.post(
  "/social/share",
  [
    body("platform")
      .isIn(["twitter", "facebook", "linkedin", "reddit", "pinterest", "email"])
      .withMessage("Invalid social media platform"),
    body("contentType")
      .isIn(["news", "car", "page"])
      .withMessage("Invalid content type"),
    body("contentId").notEmpty().withMessage("Content ID is required"),
    body("url").optional().isURL().withMessage("Invalid URL format"),
  ],
  trackSocialShare
);

// ===== ADMIN NEWS MANAGEMENT ROUTES =====
// All admin routes require authentication
router.use("/admin", protect);

// Get all news articles for admin management
router.get(
  "/admin/news",
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
router.get("/admin/news/:id", getAdminNewsDetails);

// Create new news article
router.post(
  "/admin/news",
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
  "/admin/news/:id",
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
router.delete("/admin/news/:id", deleteAdminNews);

// Update news article publication status
router.patch(
  "/admin/news/:id/publish",
  [
    body("status")
      .notEmpty()
      .isIn(["published", "draft", "archived"])
      .withMessage("Valid article status is required"),
  ],
  updateNewsStatus
);

module.exports = router;