// src/models/Admin.js - Admin Modeli
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    // Temel Bilgiler
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },

    // Kişisel Bilgiler
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      trim: true,
    },

    // Profil Resmi
    avatar: {
      url: String,
      publicId: String,
      filename: String,
    },

    // Rol ve Yetkiler
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "editor"],
      default: "admin",
    },
    permissions: [
      {
        module: {
          type: String,
          enum: [
            "cars",
            "locations",
            "bookings",
            "users",
            "content",
            "settings",
            "analytics",
            "messages",
            "media",
            "seo",
          ],
        },
        actions: [
          {
            type: String,
            enum: ["create", "read", "update", "delete", "export"],
          },
        ],
      },
    ],

    // Güvenlik
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },

    // Login/Session Bilgileri
    lastLogin: Date,
    lastLoginIP: String,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    sessionToken: {
      type: String,
      select: false,
    },

    // Şifre Sıfırlama
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: Date,

    // Email Verification
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Preferences
    preferences: {
      language: {
        type: String,
        enum: ["tr", "en"],
        default: "tr",
      },
      timezone: {
        type: String,
        default: "Europe/Istanbul",
      },
      dateFormat: {
        type: String,
        enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
        default: "DD/MM/YYYY",
      },
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        browser: {
          type: Boolean,
          default: true,
        },
        newBookings: {
          type: Boolean,
          default: true,
        },
        messages: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Activity Tracking
    activity: {
      totalLogins: {
        type: Number,
        default: 0,
      },
      lastActions: [
        {
          action: String,
          module: String,
          description: String,
          ip: String,
          userAgent: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.twoFactorSecret;
        delete ret.sessionToken;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes

adminSchema.index({ isActive: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ lastLogin: -1 });

// Virtual for full name
adminSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
adminSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
adminSchema.pre("save", async function (next) {
  // Hash password if modified
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT is always created after password change
  }

  // Update timestamp
  this.updatedAt = Date.now();

  // Limit activity log to last 50 actions
  if (this.activity.lastActions && this.activity.lastActions.length > 50) {
    this.activity.lastActions = this.activity.lastActions.slice(-50);
  }

  next();
});

// Instance method to check password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password changed after JWT was issued
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to handle failed login attempts
adminSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // If we've reached max attempts and it's not locked already, lock account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock for 2 hours
  }

  return this.updateOne(updates);
};

// Instance method to handle successful login
adminSchema.methods.handleSuccessfulLogin = function (ip, userAgent) {
  const updates = {
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: {
      lastLogin: Date.now(),
      lastLoginIP: ip,
    },
    $inc: { "activity.totalLogins": 1 },
  };

  // Add login action to activity log
  this.activity.lastActions.unshift({
    action: "login",
    module: "auth",
    description: "Admin logged in",
    ip: ip,
    userAgent: userAgent,
    timestamp: new Date(),
  });

  return this.updateOne(updates);
};

// Instance method to log activity
adminSchema.methods.logActivity = function (
  action,
  module,
  description,
  req = null
) {
  const activityEntry = {
    action,
    module,
    description,
    timestamp: new Date(),
  };

  if (req) {
    activityEntry.ip = req.ip || req.connection.remoteAddress;
    activityEntry.userAgent = req.get("User-Agent");
  }

  this.activity.lastActions.unshift(activityEntry);

  // Keep only last 50 activities
  if (this.activity.lastActions.length > 50) {
    this.activity.lastActions = this.activity.lastActions.slice(0, 50);
  }

  return this.save();
};

// Instance method to check permission
adminSchema.methods.hasPermission = function (module, action) {
  // Super admin has all permissions
  if (this.role === "super_admin") {
    return true;
  }

  // Check specific permissions
  const modulePermission = this.permissions.find((p) => p.module === module);
  if (!modulePermission) {
    return false;
  }

  return modulePermission.actions.includes(action);
};

// Instance method to generate password reset token
adminSchema.methods.createPasswordResetToken = function () {
  const resetToken = require("crypto").randomBytes(32).toString("hex");

  this.passwordResetToken = require("crypto")
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to generate email verification token
adminSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = require("crypto").randomBytes(32).toString("hex");

  this.emailVerificationToken = require("crypto")
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Static method to find by username or email
adminSchema.statics.findByLogin = function (login) {
  return this.findOne({
    $or: [{ username: login.toLowerCase() }, { email: login.toLowerCase() }],
    isActive: true,
  }).select("+password");
};

// Static method to create default admin
adminSchema.statics.createDefaultAdmin = async function () {
  const adminExists = await this.countDocuments();

  if (adminExists === 0) {
    const defaultAdmin = new this({
      username: "admin",
      email: "admin@mitcarrental.com",
      password: "admin123",
      firstName: "System",
      lastName: "Administrator",
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
        {
          module: "bookings",
          actions: ["create", "read", "update", "delete", "export"],
        },
        {
          module: "settings",
          actions: ["create", "read", "update", "delete"],
        },
        {
          module: "content",
          actions: ["create", "read", "update", "delete"],
        },
        {
          module: "messages",
          actions: ["read", "update", "delete"],
        },
      ],
    });

    await defaultAdmin.save();
    console.log("✅ Default admin created: admin / admin123");
    return defaultAdmin;
  }

  return null;
};

// Static method to get admin statistics
adminSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalAdmins: { $sum: 1 },
        activeAdmins: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
        recentLogins: {
          $sum: {
            $cond: [
              {
                $gte: [
                  "$lastLogin",
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
};

module.exports = mongoose.model("Admin", adminSchema);
