// src/models/Booking.js - Booking Model for Manual Admin Management
const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Driver name is required"],
    trim: true,
    maxLength: [100, "Name cannot exceed 100 characters"]
  },
  surname: {
    type: String,
    required: [true, "Driver surname is required"],
    trim: true,
    maxLength: [100, "Surname cannot exceed 100 characters"]
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function(v) {
        return /^[\+]?[(]?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: "Please enter a valid phone number"
    }
  }
}, { _id: true });

const bookingSchema = new mongoose.Schema({
  // Booking reference number (auto-generated)
  bookingReference: {
    type: String,
    unique: true,
    required: true,
  },

  // Car details
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: [true, "Car selection is required"]
  },

  // Driver information (multiple drivers allowed)
  drivers: {
    type: [driverSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0 && v.length <= 5;
      },
      message: "At least one driver is required (maximum 5 drivers allowed)"
    }
  },

  // Primary driver (first driver in the array)
  primaryDriver: {
    type: driverSchema,
    required: true
  },

  // Location details
  pickupLocation: {
    type: String,
    required: [true, "Pickup location is required"],
    trim: true,
    maxLength: [200, "Pickup location cannot exceed 200 characters"]
  },

  dropoffLocation: {
    type: String,
    required: [true, "Drop-off location is required"],
    trim: true,
    maxLength: [200, "Drop-off location cannot exceed 200 characters"]
  },

  // Time details
  pickupTime: {
    type: Date,
    required: [true, "Pickup time is required"],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: "Pickup time must be in the future"
    }
  },

  dropoffTime: {
    type: Date,
    required: [true, "Drop-off time is required"],
    validate: {
      validator: function(v) {
        return v > this.pickupTime;
      },
      message: "Drop-off time must be after pickup time"
    }
  },

  // Booking status
  status: {
    type: String,
    enum: {
      values: ["pending", "confirmed", "active", "completed", "cancelled"],
      message: "Status must be one of: pending, confirmed, active, completed, cancelled"
    },
    default: "pending"
  },

  // Pricing information
  pricing: {
    dailyRate: {
      type: Number,
      required: true,
      min: [0, "Daily rate cannot be negative"]
    },
    totalDays: {
      type: Number,
      required: true,
      min: [1, "Booking must be for at least 1 day"]
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"]
    },
    taxes: {
      type: Number,
      default: 0,
      min: [0, "Taxes cannot be negative"]
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"]
    },
    currency: {
      type: String,
      enum: ["EUR", "TRY", "USD"],
      default: "EUR"
    }
  },

  // Additional options/services
  additionalServices: [{
    name: String,
    price: Number,
    currency: {
      type: String,
      enum: ["EUR", "TRY", "USD"],
      default: "EUR"
    }
  }],

  // Special requests or notes
  specialRequests: {
    type: String,
    maxLength: [1000, "Special requests cannot exceed 1000 characters"]
  },

  // Administrative notes (internal use)
  adminNotes: {
    type: String,
    maxLength: [1000, "Admin notes cannot exceed 1000 characters"]
  },

  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,  // This will automatically manage createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ car: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ pickupTime: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ "primaryDriver.phoneNumber": 1 });

// Virtual for booking duration in days
bookingSchema.virtual("durationDays").get(function() {
  if (this.pickupTime && this.dropoffTime) {
    const diffTime = Math.abs(this.dropoffTime - this.pickupTime);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for formatted booking reference
bookingSchema.virtual("formattedReference").get(function() {
  return `BK-${this.bookingReference}`;
});

// Pre-save middleware to generate booking reference
bookingSchema.pre("save", async function(next) {
  // Generate booking reference if it's a new booking
  if (this.isNew && !this.bookingReference) {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingReference = `${timestamp.slice(-6)}${randomNum}`;
  }

  // Set primary driver from first driver in array
  if (this.drivers && this.drivers.length > 0) {
    this.primaryDriver = this.drivers[0];
  }

  // Calculate total days and pricing
  if (this.pickupTime && this.dropoffTime) {
    const diffTime = Math.abs(this.dropoffTime - this.pickupTime);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (this.pricing && this.pricing.dailyRate) {
      this.pricing.totalDays = totalDays;
      this.pricing.subtotal = this.pricing.dailyRate * totalDays;
      
      // Add additional services to total
      let additionalServicesTotal = 0;
      if (this.additionalServices && this.additionalServices.length > 0) {
        additionalServicesTotal = this.additionalServices.reduce((sum, service) => sum + (service.price || 0), 0);
      }
      
      this.pricing.totalAmount = this.pricing.subtotal + (this.pricing.taxes || 0) + additionalServicesTotal;
    }
  }

  // Update lastModifiedBy and updatedAt
  this.updatedAt = new Date();
  
  next();
});

// Static method to get bookings with filters
bookingSchema.statics.getBookingsWithFilters = async function(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    carId,
    dateFrom,
    dateTo,
    search
  } = { ...filters, ...options };

  const query = {};

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Car filter
  if (carId) {
    query.car = carId;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    query.pickupTime = {};
    if (dateFrom) query.pickupTime.$gte = new Date(dateFrom);
    if (dateTo) query.pickupTime.$lte = new Date(dateTo);
  }

  // Search filter (booking reference, driver name, phone)
  if (search) {
    query.$or = [
      { bookingReference: { $regex: search, $options: 'i' } },
      { "primaryDriver.name": { $regex: search, $options: 'i' } },
      { "primaryDriver.surname": { $regex: search, $options: 'i' } },
      { "primaryDriver.phoneNumber": { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [bookings, total] = await Promise.all([
    this.find(query)
      .populate('car', 'brand model year type dailyRate images')
      .populate('createdBy', 'username email')
      .populate('lastModifiedBy', 'username email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Instance method to calculate total cost
bookingSchema.methods.calculateTotalCost = function() {
  let total = this.pricing.subtotal || 0;
  total += this.pricing.taxes || 0;
  
  if (this.additionalServices && this.additionalServices.length > 0) {
    total += this.additionalServices.reduce((sum, service) => sum + (service.price || 0), 0);
  }
  
  return total;
};

// Instance method to check if booking can be modified
bookingSchema.methods.canBeModified = function() {
  return ['pending', 'confirmed'].includes(this.status) && new Date() < this.pickupTime;
};

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

module.exports = mongoose.model("Booking", bookingSchema);