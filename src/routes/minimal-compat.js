// src/routes/minimal-compat.js - Minimal compatibility routes for frontend
const express = require("express");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Compatibility
 *   description: Temporary compatibility routes during MongoDB to PostgreSQL migration
 */

// Test route to verify minimal-compat routes are working
router.get("/test-route", (req, res) => {
  res.json({ success: true, message: "Minimal-compat routes are working!" });
});

// ===== PUBLIC BLOG ROUTES (Non-admin) =====
// These don't conflict with admin routes

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get blogs (empty during migration)
 *     tags: [Compatibility]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empty blog list
 */
router.get("/blogs", (req, res) => {
  res.json({
    success: true,
    data: {
      blogs: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    },
  });
});

/**
 * @swagger
 * /api/blogs/featured:
 *   get:
 *     summary: Get featured blogs (empty during migration)
 *     tags: [Compatibility]
 *     responses:
 *       200:
 *         description: Empty featured blogs list
 */
router.get("/blogs/featured", (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

/**
 * @swagger
 * /api/blogs/categories:
 *   get:
 *     summary: Get blog categories (empty during migration)
 *     tags: [Compatibility]
 *     responses:
 *       200:
 *         description: Empty categories list
 */
router.get("/blogs/categories", (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

/**
 * @swagger
 * /api/blogs/tags:
 *   get:
 *     summary: Get blog tags (empty during migration)
 *     tags: [Compatibility]
 *     responses:
 *       200:
 *         description: Empty tags list
 */
router.get("/blogs/tags", (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

/**
 * @swagger
 * /api/blogs/search:
 *   get:
 *     summary: Search blogs (empty during migration)
 *     tags: [Compatibility]
 *     responses:
 *       200:
 *         description: Empty search results
 */
router.get("/blogs/search", (req, res) => {
  res.json({
    success: true,
    data: {
      blogs: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    },
  });
});

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get blog by ID (empty during migration)
 *     tags: [Compatibility]
 *     responses:
 *       404:
 *         description: Blog not found during migration
 */
router.get("/blogs/:id", (req, res) => {
  res.status(404).json({
    error: "Blog not found",
    message: "Blog functionality is temporarily disabled during migration.",
  });
});

// ===== NEWS ROUTES =====

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get news (empty during migration)
 *     tags: [Compatibility]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empty news list
 */
router.get("/news", (req, res) => {
  res.json({
    success: true,
    data: {
      news: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    },
  });
});

// ===== CAR ROUTES (redirect to listings) =====

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get cars (redirects to listings)
 *     tags: [Compatibility]
 *     responses:
 *       302:
 *         description: Redirects to listings
 */
router.get("/cars", (req, res) => {
  res.redirect("/api/listings");
});

router.get("/cars/featured", (req, res) => {
  res.redirect("/api/listings?featured=true");
});

router.get("/cars/filtered", (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  res.redirect(`/api/listings?${queryString}`);
});

router.get("/cars/filter-options", (req, res) => {
  res.redirect("/api/listings/filters");
});

router.get("/cars/:id", (req, res) => {
  res.redirect(`/api/listings/${req.params.id}`);
});

router.post("/cars/:id/toggle-like", (req, res) => {
  res.status(503).json({
    error: "Feature temporarily disabled",
    message: "Like functionality will be implemented in PostgreSQL version.",
  });
});

router.get("/cars/:id/availability", (req, res) => {
  res.status(503).json({
    error: "Feature temporarily disabled",
    message: "Availability checking will be implemented in PostgreSQL version.",
  });
});

// ===== EXCHANGE RATES =====

/**
 * @swagger
 * /api/exchange-rates/current:
 *   get:
 *     summary: Get current exchange rates (mock data)
 *     tags: [Compatibility]
 *     responses:
 *       200:
 *         description: Mock exchange rates
 */
router.get("/exchange-rates/current", (req, res) => {
  res.json({
    success: true,
    data: {
      TRY: 1,
      EUR: 0.03,
      USD: 0.035,
      lastUpdated: new Date().toISOString(),
    },
  });
});

router.get("/exchange-rates/currencies", (req, res) => {
  res.json({
    success: true,
    data: ["TRY", "EUR", "USD"],
  });
});

router.post("/exchange-rates/convert", (req, res) => {
  const { amount = 0, fromCurrency = "TRY", toCurrency = "TRY" } = req.body;
  const mockRates = { TRY: 1, EUR: 0.03, USD: 0.035 };

  const convertedAmount =
    fromCurrency === toCurrency
      ? amount
      : (amount / mockRates[fromCurrency]) * mockRates[toCurrency];

  res.json({
    success: true,
    data: {
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      fromCurrency,
      toCurrency,
      rate: mockRates[toCurrency] / mockRates[fromCurrency],
    },
  });
});

// ===== DISABLED/REMOVED ADMIN BLOG ROUTES =====
// These routes have been removed to prevent conflicts with actual admin blog routes
// The real blog routes are handled by /api/admin/blogs in admin.js

// ===== SCHEDULED PRICING (Temporary disabled) =====

router.get("/admin/cars/:id/scheduled-pricing", (req, res) => {
  res.status(503).json({
    error: "Feature temporarily disabled",
    message: "Scheduled pricing will be implemented in PostgreSQL version.",
  });
});

router.post("/admin/cars/:id/scheduled-pricing", (req, res) => {
  res.status(503).json({
    error: "Feature temporarily disabled",
    message: "Scheduled pricing will be implemented in PostgreSQL version.",
  });
});

router.delete("/admin/cars/:id/scheduled-pricing/:pricingId", (req, res) => {
  res.status(503).json({
    error: "Feature temporarily disabled",
    message: "Scheduled pricing will be implemented in PostgreSQL version.",
  });
});

router.put("/admin/cars/:id/inventory", (req, res) => {
  res.status(503).json({
    error: "Feature temporarily disabled",
    message: "Inventory management will be implemented in PostgreSQL version.",
  });
});

// ===== UPLOAD ROUTES =====

/**
 * @swagger
 * /api/upload/single:
 *   post:
 *     summary: Upload single file
 *     tags: [Compatibility]
 *     responses:
 *       503:
 *         description: Service temporarily unavailable
 */
router.post("/upload/single", (req, res) => {
  res.status(503).json({
    error: "Upload temporarily disabled",
    message:
      "File upload will be implemented in PostgreSQL version. Use /api/images endpoints instead.",
  });
});

router.post("/upload/multiple", (req, res) => {
  res.status(503).json({
    error: "Upload temporarily disabled",
    message:
      "File upload will be implemented in PostgreSQL version. Use /api/images endpoints instead.",
  });
});

router.post("/upload/car-listing", (req, res) => {
  res.status(503).json({
    error: "Upload temporarily disabled",
    message:
      "File upload will be implemented in PostgreSQL version. Use /api/images endpoints instead.",
  });
});

router.delete("/upload/delete", (req, res) => {
  res.status(503).json({
    error: "Upload temporarily disabled",
    message:
      "File deletion will be implemented in PostgreSQL version. Use /api/images endpoints instead.",
  });
});

// ===== LOCATIONS =====

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get locations (empty during migration)
 *     tags: [Compatibility]
 *     responses:
 *       200:
 *         description: Empty locations list
 */
router.get("/locations", (req, res) => {
  res.json({
    success: true,
    data: {
      locations: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    },
  });
});

// ===== DASHBOARD STATS =====

router.get("/admin/dashboard/recent-bookings", (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

// ===== LEGACY BLOG REDIRECTS =====
// Redirect old blog admin endpoints to new structure

router.get("/blogs/admin", (req, res) => {
  res.redirect(
    301,
    `/api/admin/blogs${
      req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""
    }`
  );
});

router.post("/blogs/admin", (req, res) => {
  res.redirect(307, "/api/admin/blogs");
});

router.get("/blogs/admin/:id", (req, res) => {
  res.redirect(301, `/api/admin/blogs/${req.params.id}`);
});

router.put("/blogs/admin/:id", (req, res) => {
  res.redirect(307, `/api/admin/blogs/${req.params.id}`);
});

router.delete("/blogs/admin/:id", (req, res) => {
  res.redirect(307, `/api/admin/blogs/${req.params.id}`);
});

router.patch("/blogs/admin/:id/featured", (req, res) => {
  res.redirect(307, `/api/admin/blogs/${req.params.id}/featured`);
});

router.patch("/blogs/admin/:id/status", (req, res) => {
  res.redirect(307, `/api/admin/blogs/${req.params.id}/status`);
});

// ===== EXCHANGE RATES ENDPOINT =====

router.put("/admin/exchange-rates", (req, res) => {
  res.json({
    success: true,
    message: "Exchange rates updated successfully",
    data: {
      rates: req.body.rates,
      updateNotes: req.body.updateNotes,
      updatedAt: new Date().toISOString(),
    },
  });
});

// ===== ADMIN BOOKINGS ENDPOINT =====

router.get("/admin/bookings", (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  res.json({
    success: true,
    data: {
      bookings: [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: parseInt(limit),
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
  });
});

// ===== ADMIN LOCATIONS ENDPOINTS =====

router.get("/admin/locations", (req, res) => {
  res.json({
    success: true,
    data: {
      locations: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    },
  });
});

router.post("/admin/locations", (req, res) => {
  res.status(503).json({
    error: "Feature temporarily disabled",
    message: "Location creation will be implemented in PostgreSQL version.",
  });
});

// ===== ADMIN USERS/ADMINS ENDPOINTS =====

router.get("/admin/users", (req, res) => {
  res.json({
    success: true,
    data: {
      users: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    },
  });
});

router.get("/admin/admins", (req, res) => {
  res.json({
    success: true,
    data: {
      admins: [
        {
          id: "5cc0eaf6-faf4-4c8c-9c57-0e35f4a9e839",
          username: "admin",
          email: "admin@mitcarrental.com",
          firstName: "System",
          lastName: "Administrator",
          role: "super_admin",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 1 },
    },
  });
});

// ===== ADMIN CONTENT MANAGEMENT =====

router.get("/admin/content", (req, res) => {
  res.json({
    success: true,
    data: {
      content: [],
      pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
    },
  });
});

// ===== ADMIN SETTINGS =====

router.get("/admin/settings", (req, res) => {
  res.json({
    success: true,
    data: {
      settings: {
        siteName: "Rentaly",
        currency: "TRY",
        language: "tr",
        theme: "light",
        maintenance: false,
      },
    },
  });
});

router.put("/admin/settings", (req, res) => {
  res.json({
    success: true,
    message: "Settings updated successfully",
    data: {
      settings: req.body,
    },
  });
});

module.exports = router;
