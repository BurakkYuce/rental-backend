// src/middleware/validation.js - Validation Middleware

// Car validation
exports.validateCar = (req, res, next) => {
  const { title, brand, model, year, category, pricing } = req.body;
  const errors = [];

  // Required fields
  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  }
  if (!brand) {
    errors.push("Brand is required");
  }
  if (!model) {
    errors.push("Model is required");
  }
  if (!year) {
    errors.push("Year is required");
  }
  if (!category) {
    errors.push("Category is required");
  }
  if (!pricing || !pricing.daily) {
    errors.push("Daily price is required");
  }

  // Validation rules
  if (year && (year < 1979 || year > new Date().getFullYear() + 1)) {
    errors.push("Year must be between 1979 and next year");
  }
  if (pricing && pricing.daily && pricing.daily < 0) {
    errors.push("Daily price cannot be negative");
  }
  if (title && title.length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

// Car update validation
exports.validateCarUpdate = (req, res, next) => {
  const { title, year, pricing } = req.body;
  const errors = [];

  // Optional field validation
  if (title && title.trim().length === 0) {
    errors.push("Title cannot be empty");
  }
  if (year && (year < 1979 || year > new Date().getFullYear() + 1)) {
    errors.push("Year must be between 1979 and next year");
  }
  if (pricing && pricing.daily && pricing.daily < 0) {
    errors.push("Daily price cannot be negative");
  }
  if (title && title.length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

// Location validation
exports.validateLocation = (req, res, next) => {
  const { name, city, type } = req.body;
  const errors = [];

  // Required fields
  if (!name || name.trim().length === 0) {
    errors.push("Location name is required");
  }
  if (!city || city.trim().length === 0) {
    errors.push("City is required");
  }
  if (!type) {
    errors.push("Location type is required");
  }

  // Validation rules
  if (name && name.length > 100) {
    errors.push("Location name cannot exceed 100 characters");
  }
  if (city && city.length > 50) {
    errors.push("City name cannot exceed 50 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

// Admin validation
exports.validateAdmin = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors = [];

  // Required fields
  if (!username || username.trim().length === 0) {
    errors.push("Username is required");
  }
  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  }
  if (!password) {
    errors.push("Password is required");
  }
  if (!firstName || firstName.trim().length === 0) {
    errors.push("First name is required");
  }
  if (!lastName || lastName.trim().length === 0) {
    errors.push("Last name is required");
  }

  // Validation rules
  if (username && (username.length < 3 || username.length > 20)) {
    errors.push("Username must be between 3 and 20 characters");
  }
  if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push("Please provide a valid email");
  }
  if (password && password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  if (firstName && firstName.length > 50) {
    errors.push("First name cannot exceed 50 characters");
  }
  if (lastName && lastName.length > 50) {
    errors.push("Last name cannot exceed 50 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

// Login validation
exports.validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push("Username is required");
  }
  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

// Message validation
exports.validateMessage = (req, res, next) => {
  const { sender, subject, message } = req.body;
  const errors = [];

  // Required fields
  if (!sender || !sender.name || sender.name.trim().length === 0) {
    errors.push("Sender name is required");
  }
  if (!sender || !sender.email || sender.email.trim().length === 0) {
    errors.push("Sender email is required");
  }
  if (!subject || subject.trim().length === 0) {
    errors.push("Subject is required");
  }
  if (!message || message.trim().length === 0) {
    errors.push("Message is required");
  }

  // Validation rules
  if (
    sender &&
    sender.email &&
    !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(sender.email)
  ) {
    errors.push("Please provide a valid email");
  }
  if (sender && sender.name && sender.name.length > 100) {
    errors.push("Name cannot exceed 100 characters");
  }
  if (subject && subject.length > 200) {
    errors.push("Subject cannot exceed 200 characters");
  }
  if (message && message.length > 5000) {
    errors.push("Message cannot exceed 5000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

// File upload validation
exports.validateFileUpload = (
  allowedTypes = ["image/jpeg", "image/jpg", "image/png"],
  maxSize = 5 * 1024 * 1024
) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const errors = [];

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      errors.push(
        `File type ${
          req.file.mimetype
        } is not allowed. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Check file size
    if (req.file.size > maxSize) {
      errors.push(
        `File size ${(req.file.size / (1024 * 1024)).toFixed(
          2
        )}MB exceeds maximum size ${(maxSize / (1024 * 1024)).toFixed(2)}MB`
      );
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "File validation failed",
        details: errors,
      });
    }

    next();
  };
};

// ID validation
exports.validateId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid ID format",
    });
  }

  next();
};

// Pagination validation
exports.validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({
      success: false,
      error: "Page must be a positive integer",
    });
  }

  if (
    limit &&
    (!Number.isInteger(Number(limit)) ||
      Number(limit) < 1 ||
      Number(limit) > 100)
  ) {
    return res.status(400).json({
      success: false,
      error: "Limit must be a positive integer between 1 and 100",
    });
  }

  next();
};
