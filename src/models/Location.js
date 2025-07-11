// src/models/Location.js - Lokasyon Modeli
const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    // Temel Bilgiler
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      unique: true,
    },

    // Şehir ve Ülke
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    country: {
      type: String,
      default: "Turkey",
      trim: true,
    },

    // Koordinatlar (Harita için)
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      longitude: {
        type: Number,
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },

    // Adres Bilgileri
    address: {
      street: String,
      district: String,
      postalCode: String,
      fullAddress: String,
    },

    // Lokasyon Türü
    type: {
      type: String,
      required: [true, "Location type is required"],
      enum: [
        "Airport",
        "City Center",
        "Hotel",
        "Train Station",
        "Bus Terminal",
        "Port",
        "Office",
        "Other",
      ],
      default: "City Center",
    },

    // İletişim Bilgileri
    contact: {
      phone: String,
      email: String,
      manager: String,
    },

    // Çalışma Saatleri
    workingHours: {
      monday: {
        open: String,
        close: String,
        is24Hours: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
      },
      tuesday: {
        open: String,
        close: String,
        is24Hours: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
      },
      wednesday: {
        open: String,
        close: String,
        is24Hours: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
      },
      thursday: {
        open: String,
        close: String,
        is24Hours: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
      },
      friday: {
        open: String,
        close: String,
        is24Hours: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
      },
      saturday: {
        open: String,
        close: String,
        is24Hours: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
      },
      sunday: {
        open: String,
        close: String,
        is24Hours: { type: Boolean, default: false },
        isClosed: { type: Boolean, default: false },
      },
    },

    // Özellikler
    features: [
      {
        type: String,
        enum: [
          "Free Wifi",
          "Parking Available",
          "Car Wash",
          "Fuel Service",
          "Waiting Area",
          "Coffee Service",
          "Restroom",
          "Disabled Access",
          "24/7 Service",
          "Shuttle Service",
          "Valet Service",
        ],
      },
    ],

    // Ücret Bilgileri (Delivery/Pickup için)
    pricing: {
      deliveryFee: {
        type: Number,
        default: 0,
        min: [0, "Delivery fee cannot be negative"],
      },
      pickupFee: {
        type: Number,
        default: 0,
        min: [0, "Pickup fee cannot be negative"],
      },
      freeDeliveryRadius: {
        type: Number,
        default: 0, // km
        min: [0, "Free delivery radius cannot be negative"],
      },
    },

    // Durum
    status: {
      type: Boolean,
      default: true,
    },

    // Öncelik/Sıralama
    order: {
      type: Number,
      default: 0,
      index: true,
    },

    // Popülerlik
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Resim
    image: {
      url: String,
      publicId: String,
      filename: String,
    },

    // Açıklama
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // SEO
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Çok Dilli Destek
    translations: {
      en: {
        name: String,
        description: String,
        address: String,
      },
      tr: {
        name: String,
        description: String,
        address: String,
      },
    },

    // İstatistikler
    stats: {
      totalBookings: {
        type: Number,
        default: 0,
      },
      activeBookings: {
        type: Number,
        default: 0,
      },
      lastBookingDate: Date,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
locationSchema.index({ city: 1, status: 1 });
locationSchema.index({ type: 1, status: 1 });
locationSchema.index({ isPopular: -1, order: 1 });
locationSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });

// Virtual for full address
locationSchema.virtual("fullAddress").get(function () {
  if (this.address && this.address.fullAddress) {
    return this.address.fullAddress;
  }

  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.district) parts.push(this.address.district);
  if (this.city) parts.push(this.city);
  if (this.country) parts.push(this.country);

  return parts.join(", ");
});

// Virtual for Google Maps link
locationSchema.virtual("googleMapsLink").get(function () {
  if (this.coordinates.latitude && this.coordinates.longitude) {
    return `https://www.google.com/maps?q=${this.coordinates.latitude},${this.coordinates.longitude}`;
  }

  const address = encodeURIComponent(this.fullAddress);
  return `https://www.google.com/maps/search/?api=1&query=${address}`;
});

// Virtual for current working status
locationSchema.virtual("isCurrentlyOpen").get(function () {
  const now = new Date();
  const currentDay = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const daySchedule = this.workingHours[currentDay];

  if (!daySchedule || daySchedule.isClosed) {
    return false;
  }

  if (daySchedule.is24Hours) {
    return true;
  }

  if (daySchedule.open && daySchedule.close) {
    return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
  }

  return false;
});

// Pre-save middleware
locationSchema.pre("save", function (next) {
  // Generate slug if not exists or if name changed
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Update timestamp
  this.updatedAt = Date.now();

  // Set full address if components provided
  if (this.address && (this.address.street || this.address.district)) {
    const parts = [];
    if (this.address.street) parts.push(this.address.street);
    if (this.address.district) parts.push(this.address.district);
    if (this.city) parts.push(this.city);
    if (this.country && this.country !== "Turkey") parts.push(this.country);

    this.address.fullAddress = parts.join(", ");
  }

  next();
});

// Static method to find popular locations
locationSchema.statics.findPopular = function (limit = 10) {
  return this.find({
    status: true,
    isPopular: true,
  })
    .sort({ order: 1, "stats.totalBookings": -1 })
    .limit(limit)
    .select("name city type image slug");
};

// Static method to find by city
locationSchema.statics.findByCity = function (cityName) {
  return this.find({
    city: new RegExp(cityName, "i"),
    status: true,
  }).sort({ isPopular: -1, order: 1 });
};

// Static method to find nearby locations
locationSchema.statics.findNearby = function (
  latitude,
  longitude,
  radiusKm = 50
) {
  const radiusRadians = radiusKm / 6371; // Earth's radius in km

  return this.find({
    status: true,
    "coordinates.latitude": { $exists: true },
    "coordinates.longitude": { $exists: true },
    $and: [
      {
        "coordinates.latitude": {
          $gte: latitude - radiusRadians,
          $lte: latitude + radiusRadians,
        },
      },
      {
        "coordinates.longitude": {
          $gte: longitude - radiusRadians,
          $lte: longitude + radiusRadians,
        },
      },
    ],
  }).sort({ isPopular: -1, order: 1 });
};

// Static method to search locations
locationSchema.statics.searchLocations = function (query) {
  const { search, city, type, isPopular, page = 1, limit = 20 } = query;

  let filter = { status: true };

  // Text search
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { city: new RegExp(search, "i") },
      { "address.district": new RegExp(search, "i") },
      { "address.fullAddress": new RegExp(search, "i") },
    ];
  }

  // City filter
  if (city && city !== "all") {
    filter.city = city;
  }

  // Type filter
  if (type && type !== "all") {
    filter.type = type;
  }

  // Popular filter
  if (isPopular === "true") {
    filter.isPopular = true;
  }

  const skip = (Number(page) - 1) * Number(limit);

  return this.find(filter)
    .sort({ isPopular: -1, order: 1, name: 1 })
    .skip(skip)
    .limit(Number(limit));
};

// Instance method to calculate delivery fee based on distance
locationSchema.methods.calculateDeliveryFee = function (
  destinationLat,
  destinationLng
) {
  if (!this.coordinates.latitude || !this.coordinates.longitude) {
    return this.pricing.deliveryFee;
  }

  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = ((destinationLat - this.coordinates.latitude) * Math.PI) / 180;
  const dLng = ((destinationLng - this.coordinates.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.coordinates.latitude * Math.PI) / 180) *
      Math.cos((destinationLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Free delivery within radius
  if (distance <= this.pricing.freeDeliveryRadius) {
    return 0;
  }

  return this.pricing.deliveryFee;
};

// Instance method to increment booking count
locationSchema.methods.incrementBookingCount = function () {
  this.stats.totalBookings += 1;
  this.stats.lastBookingDate = new Date();
  return this.save();
};

module.exports = mongoose.model("Location", locationSchema);
