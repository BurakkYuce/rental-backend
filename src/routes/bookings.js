// src/routes/bookings.js - Booking Routes (Geçici)
const express = require("express");
const router = express.Router();

// Geçici route
router.get("/", (req, res) => {
  res.json({ message: "Booking routes - Coming soon" });
});

module.exports = router;
