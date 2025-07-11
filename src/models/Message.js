// src/models/Message.js - Mesaj Modeli
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Gönderen Bilgileri
    sender: {
      name: {
        type: String,
        required: [true, "Sender name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"],
      },
      email: {
        type: String,
        required: [true, "Sender email is required"],
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please provide a valid email",
        ],
      },
      phone: {
        type: String,
        trim: true,
        maxlength: [20, "Phone cannot exceed 20 characters"],
      },
    },

    // Mesaj İçeriği
    subject: {
      type: String,
      required: [true, "Message subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    // Mesaj Türü
    type: {
      type: String,
      enum: [
        "contact",
        "quote_request",
        "complaint",
        "suggestion",
        "support",
        "reservation_inquiry",
      ],
      default: "contact",
    },

    // Araç İlgili Bilgiler (eğer araç hakkında mesaj ise)
    relatedCar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
    },

    // Rezervasyon Bilgileri (eğer rezervasyon talebi ise)
    reservationDetails: {
      pickupDate: Date,
      returnDate: Date,
      pickupLocation: String,
      dropoffLocation: String,
      preferredCar: String,
    },

    // Durum Bilgileri
    status: {
      type: String,
      enum: ["unread", "read", "replied", "resolved", "archived"],
      default: "unread",
      index: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },

    // Admin Yanıt Bilgileri
    adminResponse: {
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      respondedAt: Date,
      response: String,
      responseMethod: {
        type: String,
        enum: ["email", "phone", "internal_note"],
        default: "email",
      },
    },

    // İç Notlar (Admin için)
    internalNotes: [
      {
        note: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Etiketler
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Dosya Ekleri
    attachments: [
      {
        filename: String,
        originalName: String,
        url: String,
        publicId: String,
        fileSize: Number,
        mimeType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // IP ve Browser Bilgileri
    metadata: {
      ipAddress: String,
      userAgent: String,
      referrer: String,
      language: String,
      source: {
        type: String,
        enum: ["website", "mobile_app", "admin_panel", "api"],
        default: "website",
      },
    },

    // Takip Bilgileri
    tracking: {
      readAt: Date,
      readBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      assignedAt: Date,
      followUpDate: Date,
      estimatedResponseTime: Number, // minutes
    },

    // Spam Kontrolü
    spam: {
      isSpam: {
        type: Boolean,
        default: false,
        index: true,
      },
      spamScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      spamReason: String,
    },

    // Otomatik Kategorilendirme
    autoCategory: {
      detected: {
        type: String,
        enum: [
          "pricing",
          "availability",
          "location",
          "technical",
          "complaint",
          "compliment",
        ],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
messageSchema.index({ "sender.email": 1 });
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ type: 1, status: 1 });
messageSchema.index({ priority: 1, status: 1 });
messageSchema.index({ isStarred: 1, createdAt: -1 });
messageSchema.index({ "tracking.assignedTo": 1, status: 1 });
messageSchema.index({ "spam.isSpam": 1 });
messageSchema.index({ tags: 1 });

// Virtual for response time
messageSchema.virtual("responseTime").get(function () {
  if (this.adminResponse && this.adminResponse.respondedAt) {
    return this.adminResponse.respondedAt - this.createdAt;
  }
  return null;
});

// Virtual for age in hours
messageSchema.virtual("ageInHours").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for is overdue
messageSchema.virtual("isOverdue").get(function () {
  if (this.status === "resolved" || this.status === "archived") {
    return false;
  }

  const hoursOld = this.ageInHours;
  const urgentThreshold =
    this.priority === "urgent"
      ? 1
      : this.priority === "high"
      ? 4
      : this.priority === "normal"
      ? 24
      : 48;

  return hoursOld > urgentThreshold;
});

// Pre-save middleware
messageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Auto-detect spam
  if (this.isNew) {
    this.detectSpam();
  }

  // Auto-categorize
  if (this.isNew) {
    this.categorizeMessage();
  }

  next();
});

// Instance method to mark as read
messageSchema.methods.markAsRead = function (adminId) {
  if (this.status === "unread") {
    this.status = "read";
    this.tracking.readAt = new Date();
    this.tracking.readBy = adminId;
  }
  return this.save();
};

// Instance method to assign to admin
messageSchema.methods.assignTo = function (adminId) {
  this.tracking.assignedTo = adminId;
  this.tracking.assignedAt = new Date();
  return this.save();
};

// Instance method to add response
messageSchema.methods.addResponse = function (
  response,
  adminId,
  method = "email"
) {
  this.adminResponse = {
    respondedBy: adminId,
    respondedAt: new Date(),
    response: response,
    responseMethod: method,
  };
  this.status = "replied";
  return this.save();
};

// Instance method to add internal note
messageSchema.methods.addInternalNote = function (note, adminId) {
  this.internalNotes.push({
    note: note,
    addedBy: adminId,
    addedAt: new Date(),
  });
  return this.save();
};

// Instance method to detect spam
messageSchema.methods.detectSpam = function () {
  let spamScore = 0;
  const message = this.message.toLowerCase();
  const subject = this.subject.toLowerCase();

  // Simple spam indicators
  const spamKeywords = [
    "free",
    "win",
    "click here",
    "urgent",
    "limited time",
    "act now",
  ];
  const spamPatterns = [
    /\$\d+/g, // Money patterns
    /http[s]?:\/\//g, // URLs
    /[A-Z]{5,}/g, // All caps words
    /!{3,}/g, // Multiple exclamation marks
  ];

  // Check keywords
  spamKeywords.forEach((keyword) => {
    if (message.includes(keyword) || subject.includes(keyword)) {
      spamScore += 10;
    }
  });

  // Check patterns
  spamPatterns.forEach((pattern) => {
    const matches = (message + " " + subject).match(pattern);
    if (matches) {
      spamScore += matches.length * 5;
    }
  });

  // Check sender domain
  const domain = this.sender.email.split("@")[1];
  const suspiciousDomains = [
    "tempmail.org",
    "10minutemail.com",
    "guerrillamail.com",
  ];
  if (suspiciousDomains.includes(domain)) {
    spamScore += 30;
  }

  this.spam.spamScore = Math.min(spamScore, 100);
  this.spam.isSpam = spamScore > 50;

  if (this.spam.isSpam) {
    this.spam.spamReason = "Automatic detection based on content and sender";
  }
};

// Instance method to categorize message
messageSchema.methods.categorizeMessage = function () {
  const content = (this.message + " " + this.subject).toLowerCase();

  const categories = {
    pricing: ["price", "cost", "fee", "cheap", "expensive", "discount", "rate"],
    availability: ["available", "book", "reserve", "rental", "dates"],
    location: ["pickup", "location", "address", "where", "delivery"],
    technical: ["website", "error", "bug", "problem", "issue", "not working"],
    complaint: ["bad", "terrible", "awful", "disappointed", "angry", "refund"],
    compliment: ["good", "excellent", "amazing", "thank", "satisfied", "happy"],
  };

  let maxScore = 0;
  let detectedCategory = null;

  Object.entries(categories).forEach(([category, keywords]) => {
    let score = 0;
    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "gi");
      const matches = content.match(regex);
      if (matches) {
        score += matches.length;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  });

  if (detectedCategory && maxScore > 0) {
    this.autoCategory = {
      detected: detectedCategory,
      confidence: Math.min(maxScore / 10, 1),
    };
  }
};

// Static method to get message statistics
messageSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$count" },
        statuses: {
          $push: {
            status: "$_id",
            count: "$count",
          },
        },
      },
    },
  ]);
};

// Static method to search messages
messageSchema.statics.searchMessages = function (query) {
  const {
    search,
    status,
    type,
    priority,
    assignedTo,
    dateFrom,
    dateTo,
    isStarred,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  let filter = { "spam.isSpam": false };

  // Text search
  if (search) {
    filter.$or = [
      { "sender.name": new RegExp(search, "i") },
      { "sender.email": new RegExp(search, "i") },
      { subject: new RegExp(search, "i") },
      { message: new RegExp(search, "i") },
    ];
  }

  // Status filter
  if (status && status !== "all") {
    filter.status = status;
  }

  // Type filter
  if (type && type !== "all") {
    filter.type = type;
  }

  // Priority filter
  if (priority && priority !== "all") {
    filter.priority = priority;
  }

  // Assigned filter
  if (assignedTo && assignedTo !== "all") {
    filter["tracking.assignedTo"] = assignedTo;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Starred filter
  if (isStarred === "true") {
    filter.isStarred = true;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  return this.find(filter)
    .populate("relatedCar", "brand model year")
    .populate("tracking.assignedTo", "firstName lastName")
    .populate("tracking.readBy", "firstName lastName")
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function () {
  return this.countDocuments({
    status: "unread",
    "spam.isSpam": false,
  });
};

module.exports = mongoose.model("Message", messageSchema);
