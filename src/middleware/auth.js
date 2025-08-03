// src/middleware/auth.js - Admin Authentication Middleware
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const admin = await Admin.findByPk(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token or inactive account'
      });
    }

    // Check if account is locked
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({
      error: 'Access denied',
      message: 'Invalid token'
    });
  }
};

// Permission middleware
const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login first'
      });
    }

    if (!req.admin.hasPermission(module, action)) {
      return res.status(403).json({
        error: 'Permission denied',
        message: `You don't have permission to ${action} ${module}`
      });
    }

    next();
  };
};

// Role middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login first'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        error: 'Role required',
        message: `This action requires one of these roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  adminAuth,
  requirePermission,
  requireRole,
  // Backward compatibility
  auth: adminAuth
};