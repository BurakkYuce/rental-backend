// src/middleware/auth.js - Authentication Middleware
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log("🔑 Token extracted:", token ? "Present" : "Missing");
    } else {
      console.log("🚫 No Authorization header or doesn't start with Bearer");
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from token
    const admin = await Admin.findById(decoded.id).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Token is invalid. Admin not found.",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: "Admin account is deactivated.",
      });
    }

    // Check if admin account is locked
    if (admin.isLocked) {
      return res.status(401).json({
        success: false,
        error: "Admin account is temporarily locked.",
      });
    }

    // Check if password was changed after JWT was issued
    if (admin.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: "Password was recently changed. Please log in again.",
      });
    }

    // Grant access to protected route
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token.",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Authentication error.",
    });
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};

// Check specific permission
exports.requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.admin.hasPermission(module, action)) {
      return res.status(403).json({
        success: false,
        error: `You do not have permission to ${action} ${module}.`,
      });
    }
    next();
  };
};

// Optional authentication (for routes that work both with and without auth)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (admin && admin.isActive && !admin.isLocked) {
          req.admin = admin;
        }
      } catch (error) {
        // Token is invalid, but continue without authentication
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Rate limiting by IP
exports.rateLimitByIP = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Clean old entries
    for (const [key, value] of requests.entries()) {
      if (now - value.resetTime > windowMs) {
        requests.delete(key);
      }
    }

    // Get or create request info for this IP
    if (!requests.has(ip)) {
      requests.set(ip, {
        count: 0,
        resetTime: now,
      });
    }

    const requestInfo = requests.get(ip);

    // Reset count if window has passed
    if (now - requestInfo.resetTime > windowMs) {
      requestInfo.count = 0;
      requestInfo.resetTime = now;
    }

    // Check if limit exceeded
    if (requestInfo.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(
          (windowMs - (now - requestInfo.resetTime)) / 1000
        ),
      });
    }

    // Increment request count
    requestInfo.count++;

    // Add rate limit headers
    res.set({
      "X-RateLimit-Limit": maxRequests,
      "X-RateLimit-Remaining": maxRequests - requestInfo.count,
      "X-RateLimit-Reset": new Date(requestInfo.resetTime + windowMs),
    });

    next();
  };
};

// Log admin activity
exports.logActivity = (action, module) => {
  return async (req, res, next) => {
    if (req.admin) {
      try {
        await req.admin.logActivity(action, module, `${action} ${module}`, req);
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    }
    next();
  };
};

// Security headers
exports.securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader("X-Powered-By");

  // Set security headers
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  });

  next();
};

// CORS middleware
exports.corsMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "http://localhost:3001"];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Request logger
exports.requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    };

    if (req.admin) {
      logData.admin = req.admin.username;
    }

    console.log(JSON.stringify(logData));
  });

  next();
};
