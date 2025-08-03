// src/middleware/upload.js - Multer Configuration for Image Upload
const multer = require('multer');
const path = require('path');

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed!'), false);
  }
};

// Storage configuration - using memory storage for Cloudinary
const storage = multer.memoryStorage();

// Upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files at once
  },
  fileFilter: fileFilter
});

// Different upload configurations
const uploadConfigs = {
  // Single image upload
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple images upload
  multiple: (fieldName, maxCount = 10) => upload.array(fieldName, maxCount),
  
  // Mixed upload (main image + gallery)
  mixed: upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 9 }
  ]),
  
  // User avatar upload
  avatar: upload.single('avatar')
};

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size cannot exceed 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Cannot upload more than 10 files at once'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        message: 'Unexpected file field in upload'
      });
    }
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  uploadConfigs,
  handleUploadError
};