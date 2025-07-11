// src/controllers/authController.js - Authentication Controller
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../models/Admin");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Send token response
const sendTokenResponse = (admin, statusCode, res, message = "") => {
  const token = generateToken(admin._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          avatar: admin.avatar,
          permissions: admin.permissions,
          preferences: admin.preferences,
        },
      },
      message,
    });
};

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide username and password",
      });
    }

    // Check for admin (include password in result)
    const admin = await Admin.findByLogin(username);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        error:
          "Account is temporarily locked due to too many failed login attempts",
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      // Increment failed login attempts
      await admin.incLoginAttempts();

      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Successful login
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    await admin.handleSuccessfulLogin(ip, userAgent);

    sendTokenResponse(admin, 200, res, "Login successful");
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      preferences: req.body.preferences,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const admin = await Admin.findByIdAndUpdate(req.admin.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    await admin.logActivity(
      "update",
      "profile",
      "Updated profile information",
      req
    );

    res.json({
      success: true,
      data: admin,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Please provide current and new password",
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin.id).select("+password");

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    await admin.logActivity("update", "password", "Changed password", req);

    sendTokenResponse(admin, 200, res, "Password changed successfully");
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Please provide email address",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "No admin found with that email address",
      });
    }

    // Generate reset token
    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/reset-password/${resetToken}`;

    try {
      // Here you would send email with reset link
      // For now, we'll just return the token (REMOVE IN PRODUCTION)

      res.json({
        success: true,
        message: "Password reset token sent to email",
        resetToken: resetToken, // REMOVE THIS IN PRODUCTION
        resetUrl: resetUrl, // REMOVE THIS IN PRODUCTION
      });
    } catch (error) {
      admin.passwordResetToken = undefined;
      admin.passwordResetExpires = undefined;
      await admin.save({ validateBeforeSave: false });

      res.status(500).json({
        success: false,
        error: "Email could not be sent",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Please provide new password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const admin = await Admin.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Set new password
    admin.password = password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    await admin.logActivity(
      "update",
      "password",
      "Reset password via email",
      req
    );

    sendTokenResponse(admin, 200, res, "Password reset successful");
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Logout admin / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    await req.admin.logActivity("logout", "auth", "Admin logged out", req);

    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Check if admin exists (for setup)
// @route   GET /api/auth/check-setup
// @access  Public
exports.checkSetup = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();

    res.json({
      success: true,
      data: {
        hasAdmin: adminCount > 0,
        needsSetup: adminCount === 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Initial admin setup
// @route   POST /api/auth/setup
// @access  Public (only if no admin exists)
exports.initialSetup = async (req, res) => {
  try {
    // Check if any admin already exists
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Admin already exists. Setup not required.",
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields",
      });
    }

    // Create first admin
    const admin = await Admin.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: "super_admin",
      isActive: true,
      isEmailVerified: true,
      permissions: [
        {
          module: "cars",
          actions: ["create", "read", "update", "delete", "export"],
        },
        {
          module: "locations",
          actions: ["create", "read", "update", "delete", "export"],
        },
        { module: "settings", actions: ["create", "read", "update", "delete"] },
        { module: "content", actions: ["create", "read", "update", "delete"] },
        { module: "messages", actions: ["read", "update", "delete"] },
        { module: "analytics", actions: ["read"] },
      ],
    });

    sendTokenResponse(
      admin,
      201,
      res,
      "Initial admin setup completed successfully"
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Upload admin avatar
// @route   POST /api/auth/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file.path, "rentaly/avatars");

    // Delete old avatar if exists
    if (req.admin.avatar && req.admin.avatar.publicId) {
      await deleteImage(req.admin.avatar.publicId);
    }

    // Update admin avatar
    req.admin.avatar = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      filename: req.file.filename,
    };

    await req.admin.save();
    await req.admin.logActivity(
      "update",
      "avatar",
      "Updated profile avatar",
      req
    );

    res.json({
      success: true,
      data: {
        avatar: req.admin.avatar,
      },
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete admin avatar
// @route   DELETE /api/auth/avatar
// @access  Private
exports.deleteAvatar = async (req, res) => {
  try {
    if (req.admin.avatar && req.admin.avatar.publicId) {
      await deleteImage(req.admin.avatar.publicId);
    }

    req.admin.avatar = undefined;
    await req.admin.save();
    await req.admin.logActivity(
      "delete",
      "avatar",
      "Deleted profile avatar",
      req
    );

    res.json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get admin activity log
// @route   GET /api/auth/activity
// @access  Private
exports.getActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const admin = await Admin.findById(req.admin.id);

    const activities = admin.activity.lastActions.slice(
      skip,
      skip + Number(limit)
    );

    res.json({
      success: true,
      data: {
        activities,
        totalActivities: admin.activity.lastActions.length,
        totalLogins: admin.activity.totalLogins,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Verify admin token
// @route   GET /api/auth/verify
// @access  Public
exports.verifyToken = async (req, res) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        admin: {
          id: admin._id,
          username: admin.username,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};
