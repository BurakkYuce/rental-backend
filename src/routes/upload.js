// src/routes/upload.js
const express = require("express");
const { upload } = require("../utils/cloudinary");
const router = express.Router();

// Test upload endpoint
router.post("/test", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      success: true,
      message: "Image uploaded successfully",
      image: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
