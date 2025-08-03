// src/routes/content.js - Content functionality removed in simplified system
const express = require("express");
const router = express.Router();

// All content management functionality has been removed in the simplified car management system
// This includes news, testimonials, comments, company info, etc.

// Return empty responses for any content-related endpoints to maintain API compatibility
router.get("/news", (req, res) => {
  res.json({
    success: true,
    data: {
      news: [],
      pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 }
    }
  });
});

router.get("/news/:id", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Content functionality has been removed from the simplified system"
  });
});

router.get("/testimonials", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

router.get("/about", (req, res) => {
  res.json({
    success: true,
    data: {
      title: "Mitcar Rental",
      description: "Car rental management system",
      content: "This is a simplified car management system."
    }
  });
});

// Catch-all for any other content routes
router.use("*", (req, res) => {
  res.status(501).json({
    success: false,
    error: "Content functionality not implemented",
    message: "Content management has been removed in the simplified system"
  });
});

module.exports = router;