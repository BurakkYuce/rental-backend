// src/routes/users.js - User Routes (Geçici)
const express = require("express");
const router = express.Router();

// Geçici route
router.get("/", (req, res) => {
  res.json({ message: "User routes - Coming soon" });
});

module.exports = router;
