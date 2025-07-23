// src/routes/blog.js - Blog Routes
const express = require("express");
const router = express.Router();
const { query, body } = require("express-validator");
const { protect } = require("../middleware/auth");

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

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog management endpoints
 */

// ===== PUBLIC ROUTES =====

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all published blogs with pagination and filters
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, content, and excerpt
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
 */
router.get(
  "/",
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
      .withMessage("Category must be a string"),
    query("tag")
      .optional()
      .isString()
      .withMessage("Tag must be a string"),
    query("search")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Search query cannot be empty"),
    query("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
  ],
  getBlogs
);

/**
 * @swagger
 * /api/blogs/featured:
 *   get:
 *     summary: Get featured blogs
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of featured blogs to return
 *     responses:
 *       200:
 *         description: Featured blogs retrieved successfully
 */
router.get(
  "/featured",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limit must be between 1 and 20"),
  ],
  getFeaturedBlogs
);

/**
 * @swagger
 * /api/blogs/categories:
 *   get:
 *     summary: Get blog categories with post counts
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get("/categories", getCategories);

/**
 * @swagger
 * /api/blogs/tags:
 *   get:
 *     summary: Get popular tags
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of tags to return
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 */
router.get(
  "/tags",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  getPopularTags
);

/**
 * @swagger
 * /api/blogs/search:
 *   get:
 *     summary: Search blogs
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get(
  "/search",
  [
    query("q")
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Search query is required"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  searchBlogs
);

/**
 * @swagger
 * /api/blogs/{slug}:
 *   get:
 *     summary: Get single blog post by slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post slug
 *     responses:
 *       200:
 *         description: Blog post retrieved successfully
 *       404:
 *         description: Blog post not found
 */
router.get("/:slug", getBlog);

// ===== ADMIN ROUTES (Protected) =====

/**
 * @swagger
 * /api/admin/blogs:
 *   get:
 *     summary: Get all blogs for admin (including drafts)
 *     tags: [Admin - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and excerpt
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
 */

/**
 * @swagger
 * /api/admin/blogs/{id}:
 *   get:
 *     summary: Get single blog for admin editing
 *     tags: [Admin - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *       404:
 *         description: Blog not found
 */
router.get("/admin/blogs/:id", protect, getAdminBlog);

/**
 * @swagger
 * /api/admin/blogs:
 *   post:
 *     summary: Create new blog post
 *     tags: [Admin - Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - excerpt
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               excerpt:
 *                 type: string
 *                 maxLength: 300
 *               content:
 *                 type: string
 *               featuredImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   alt:
 *                     type: string
 *                   publicId:
 *                     type: string
 *               author:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   avatar:
 *                     type: string
 *               category:
 *                 type: string
 *                 enum: [Car Reviews, Travel Tips, Maintenance, Insurance, Road Safety, Car Tech, Company News, Industry News]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *               featured:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Blog post created successfully
 */
router.post(
  "/admin/blogs",
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

/**
 * @swagger
 * /api/admin/blogs/{id}:
 *   put:
 *     summary: Update blog post
 *     tags: [Admin - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       404:
 *         description: Blog post not found
 */
router.put(
  "/admin/blogs/:id",
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

/**
 * @swagger
 * /api/admin/blogs/{id}:
 *   delete:
 *     summary: Delete blog post
 *     tags: [Admin - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       404:
 *         description: Blog post not found
 */
router.delete("/admin/blogs/:id", protect, deleteBlog);

/**
 * @swagger
 * /api/admin/blogs/{id}/featured:
 *   patch:
 *     summary: Toggle blog featured status
 *     tags: [Admin - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Featured status toggled successfully
 *       404:
 *         description: Blog post not found
 */
router.patch("/admin/blogs/:id/featured", protect, toggleFeatured);

/**
 * @swagger
 * /api/admin/blogs/{id}/status:
 *   patch:
 *     summary: Update blog status
 *     tags: [Admin - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Blog status updated successfully
 *       404:
 *         description: Blog post not found
 */
router.patch(
  "/admin/blogs/:id/status",
  protect,
  [
    body("status")
      .notEmpty()
      .isIn(["draft", "published", "archived"])
      .withMessage("Status must be draft, published, or archived"),
  ],
  updateBlogStatus
);

module.exports = router;