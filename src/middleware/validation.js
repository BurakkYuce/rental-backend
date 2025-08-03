// src/middleware/validation.js - Enhanced Validation Middleware
const { body, query, param, validationResult } = require("express-validator");

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    console.log("❌ Validation errors:", formattedErrors);

    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: formattedErrors,
    });
  }
  next();
};

// ===== CAR VALIDATIONS =====

const carValidationRules = () => {
  const currentYear = new Date().getFullYear();
  return [
    body("title")
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be between 1-200 characters"),

    body("brand")
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Brand is required and must be between 1-50 characters"),

    body("model")
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Model is required and must be between 1-50 characters"),

    body("year")
      .isInt({ min: 1980, max: currentYear + 2 })
      .withMessage(`Year must be between 1980 and ${currentYear + 2}`),

    body("category")
      .notEmpty()
      .isIn([
        "Economy",
        "Compact",
        "Standard",
        "Full Size",
        "Premium",
        "Luxury",
        "SUV",
        "Van",
      ])
      .withMessage("Category must be a valid option"),

    body("pricing.daily")
      .isFloat({ min: 0 })
      .withMessage("Daily price must be a positive number"),

    body("pricing.weekly")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Weekly price must be a positive number"),

    body("pricing.monthly")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Monthly price must be a positive number"),

    body("seats")
      .optional()
      .isInt({ min: 1, max: 15 })
      .withMessage("Seats must be between 1 and 15"),

    body("doors")
      .optional()
      .isInt({ min: 2, max: 5 })
      .withMessage("Doors must be between 2 and 5"),

    body("transmission")
      .optional()
      .isIn(["Manual", "Automatic", "CVT"])
      .withMessage("Transmission must be Manual, Automatic, or CVT"),

    body("fuelType")
      .optional()
      .isIn(["Petrol", "Diesel", "Electric", "Hybrid"])
      .withMessage("Fuel type must be valid"),

    body("engineCapacity")
      .optional()
      .isInt({ min: 0, max: 10000 })
      .withMessage("Engine capacity must be between 0 and 10000cc"),
  ];
};

const carUpdateValidationRules = () => {
  const currentYear = new Date().getFullYear();
  return [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be between 1-200 characters"),

    body("brand")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Brand must be between 1-50 characters"),

    body("model")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Model must be between 1-50 characters"),

    body("year")
      .optional()
      .isInt({ min: 1980, max: currentYear + 2 })
      .withMessage(`Year must be between 1980 and ${currentYear + 2}`),

    body("category")
      .optional()
      .isIn([
        "Economy",
        "Compact",
        "Standard",
        "Full Size",
        "Premium",
        "Luxury",
        "SUV",
        "Van",
      ])
      .withMessage("Category must be a valid option"),

    body("pricing.daily")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Daily price must be a positive number"),

    body("seats")
      .optional()
      .isInt({ min: 1, max: 15 })
      .withMessage("Seats must be between 1 and 15"),

    body("doors")
      .optional()
      .isInt({ min: 2, max: 5 })
      .withMessage("Doors must be between 2 and 5"),
  ];
};

// ===== BLOG VALIDATIONS =====

const blogValidationRules = () => [
  body("title")
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5-200 characters"),

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
    .withMessage("Status must be draft, published, or archived"),

  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Tags must be an array with maximum 10 items"),

  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each tag must be 1-50 characters"),
];

const blogUpdateValidationRules = () => [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5-200 characters"),

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

  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Status must be draft, published, or archived"),

  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Tags must be an array with maximum 10 items"),
];

// ===== LOCATION VALIDATIONS =====

const locationValidationRules = () => [
  body("name")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Location name is required and must be 1-100 characters"),

  body("city")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("City is required and must be 1-50 characters"),

  body("type")
    .notEmpty()
    .isIn(["Airport", "Hotel", "City Center", "Train Station"])
    .withMessage("Location type must be valid"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Address must be less than 200 characters"),

  body("coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
];

// ===== ADMIN VALIDATIONS =====

const adminValidationRules = () => [
  body("username")
    .notEmpty()
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Username must be 3-20 characters and contain only letters, numbers, and underscores"
    ),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must be at least 6 characters with uppercase, lowercase and number"
    ),

  body("firstName")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage("First name is required and must contain only letters"),

  body("lastName")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage("Last name is required and must contain only letters"),

  body("role")
    .optional()
    .isIn(["admin", "super_admin", "moderator"])
    .withMessage("Role must be valid"),
];

const loginValidationRules = () => [
  body("username").notEmpty().trim().withMessage("Username is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

// ===== MESSAGE VALIDATIONS =====

const messageValidationRules = () => [
  body("sender.name")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage("Sender name is required and must contain only letters"),

  body("sender.email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("sender.phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  body("subject")
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Subject is required and must be 1-200 characters"),

  body("message")
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message is required and must be 10-5000 characters"),

  body("category")
    .optional()
    .isIn(["General", "Booking", "Support", "Complaint", "Suggestion"])
    .withMessage("Category must be valid"),
];

// ===== ID VALIDATIONS =====

const validateUUID = () => [
  param("id").custom((value) => {
    // Allow 'new' for creation endpoints
    if (value === "new") return true;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error("Invalid ID format - must be a valid UUID");
    }
    return true;
  }),
];

const validateSlug = () => [
  param("slug")
    .isString()
    .isLength({ min: 1, max: 250 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
      "Invalid slug format - must contain only lowercase letters, numbers, and hyphens"
    ),
];

// ===== PAGINATION VALIDATIONS =====

const paginationValidationRules = () => [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sortBy")
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage("Sort field must be valid"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),
];

// ===== SEARCH VALIDATIONS =====

const searchValidationRules = () => [
  query("q")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Search query must be 1-200 characters"),

  query("category")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category filter must be valid"),

  query("tag")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Tag filter must be valid"),

  query("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured filter must be boolean"),
];

// ===== FILE UPLOAD VALIDATIONS =====

const validateFileUpload = (options = {}) => {
  const {
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSize = 5 * 1024 * 1024, // 5MB
    required = false,
  } = options;

  return (req, res, next) => {
    // If file is required but not present
    if (required && !req.file) {
      return res.status(400).json({
        success: false,
        error: "File upload is required",
      });
    }

    // If file is not required and not present, skip validation
    if (!required && !req.file) {
      return next();
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

    // Check if file is actually an image
    if (req.file.mimetype.startsWith("image/") && !req.file.buffer) {
      errors.push("Invalid image file");
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

// ===== EXPORTS =====

module.exports = {
  // Generic handler
  handleValidationErrors,

  // Car validations
  validateCar: [...carValidationRules(), handleValidationErrors],
  validateCarUpdate: [...carUpdateValidationRules(), handleValidationErrors],

  // Blog validations
  validateBlog: [...blogValidationRules(), handleValidationErrors],
  validateBlogUpdate: [...blogUpdateValidationRules(), handleValidationErrors],

  // Location validations
  validateLocation: [...locationValidationRules(), handleValidationErrors],

  // Admin validations
  validateAdmin: [...adminValidationRules(), handleValidationErrors],
  validateLogin: [...loginValidationRules(), handleValidationErrors],

  // Message validations
  validateMessage: [...messageValidationRules(), handleValidationErrors],

  // ID validations
  validateUUID: [...validateUUID(), handleValidationErrors],
  validateSlug: [...validateSlug(), handleValidationErrors],

  // Pagination and search
  validatePagination: [...paginationValidationRules(), handleValidationErrors],
  validateSearch: [...searchValidationRules(), handleValidationErrors],

  // File upload
  validateFileUpload,

  // Individual rule sets (for custom combinations)
  rules: {
    car: carValidationRules,
    carUpdate: carUpdateValidationRules,
    blog: blogValidationRules,
    blogUpdate: blogUpdateValidationRules,
    location: locationValidationRules,
    admin: adminValidationRules,
    login: loginValidationRules,
    message: messageValidationRules,
    pagination: paginationValidationRules,
    search: searchValidationRules,
    uuid: validateUUID,
    slug: validateSlug,
  },
};
// src/middleware/validation.js dosyasının sonuna ekleyin:

// Enhanced validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    console.log("❌ Validation errors:", formattedErrors);

    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: formattedErrors,
    });
  }

  next();
};
