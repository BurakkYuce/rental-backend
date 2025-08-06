// src/controllers/adminAuthController.js - Admin Authentication Controller
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { logAuth, logError } = require('../config/logger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Username and password are required'
      });
    }

    // Find admin by username or email
    const admin = await Admin.findByLogin(username);
    
    if (!admin) {
      logAuth('login', username, false, { reason: 'User not found', ip: req.ip });
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      return res.status(423).json({
        error: 'Account Locked',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      admin.loginAttempts = (admin.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts for 2 hours
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
      }
      
      await admin.save();
      
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        error: 'Account Disabled',
        message: 'Your account has been disabled'
      });
    }

    // Reset login attempts and update last login
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    admin.lastLogin = new Date();
    admin.lastLoginIP = req.ip || req.connection?.remoteAddress;
    
    // Update activity
    if (!admin.activity) admin.activity = { totalLogins: 0, lastActions: [] };
    admin.activity.totalLogins = (admin.activity.totalLogins || 0) + 1;
    
    await admin.save();

    // Log activity
    await admin.logActivity('login', 'auth', 'Admin logged in successfully', req);

    // Generate token
    const token = generateToken(admin.id);

    // Log successful login
    logAuth('login', admin.id, true, { 
      username: admin.username, 
      role: admin.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: admin.toJSON(),
        token
      }
    });

  } catch (error) {
    logError(error, { context: 'Admin login', username: req.body?.username, ip: req.ip });
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during login'
    });
  }
};

// @desc    Admin Register
// @route   POST /api/admin/register  
// @access  Private (Super Admin only)
const adminRegister = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'admin' } = req.body;

    // Validate input
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: {
        [Admin.sequelize.Sequelize.Op.or]: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (existingAdmin) {
      return res.status(409).json({
        error: 'Admin Exists',
        message: 'Admin with this username or email already exists'
      });
    }

    // Create new admin
    const newAdmin = await Admin.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role,
      isActive: true,
      emailVerified: true,
      permissions: getDefaultPermissions(role)
    });

    // Log activity
    if (req.admin) {
      await req.admin.logActivity('create', 'admin', `Created new admin: ${username}`, req);
    }

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: newAdmin.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Admin register error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during registration'
    });
  }
};

// @desc    Get Current Admin Profile
// @route   GET /api/auth/admin/me
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        admin: req.admin.toJSON()
      }
    });
  } catch (error) {
    console.error('❌ Get admin profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred while fetching profile'
    });
  }
};

// @desc    Update Admin Profile
// @route   PUT /api/auth/admin/profile
// @access  Private
const updateAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, preferences } = req.body;
    
    const admin = req.admin;
    
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (preferences) admin.preferences = { ...admin.preferences, ...preferences };
    
    await admin.save();
    
    await admin.logActivity('update', 'profile', 'Updated profile information', req);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: admin.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ Update admin profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred while updating profile'
    });
  }
};

// @desc    Change Admin Password
// @route   PUT /api/auth/admin/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required'
      });
    }

    const admin = req.admin;
    
    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid Password',
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    admin.password = newPassword;
    await admin.save();
    
    await admin.logActivity('update', 'security', 'Changed password', req);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred while changing password'
    });
  }
};

// Helper function to get default permissions based on role
const getDefaultPermissions = (role) => {
  const permissions = {
    super_admin: [
      { module: 'cars', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'locations', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'bookings', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'content', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'settings', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'admin', actions: ['create', 'read', 'update', 'delete'] }
    ],
    admin: [
      { module: 'cars', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'locations', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'bookings', actions: ['read', 'update'] },
      { module: 'content', actions: ['create', 'read', 'update', 'delete'] }
    ],
    manager: [
      { module: 'cars', actions: ['read', 'update'] },
      { module: 'locations', actions: ['read'] },
      { module: 'bookings', actions: ['read', 'update'] },
      { module: 'content', actions: ['read', 'update'] }
    ],
    editor: [
      { module: 'content', actions: ['create', 'read', 'update'] }
    ]
  };
  
  return permissions[role] || permissions.editor;
};

module.exports = {
  adminLogin,
  adminRegister,
  getAdminProfile,
  updateAdminProfile,
  changePassword
};