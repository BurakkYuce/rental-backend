// src/models/Car.js - Genişletilmiş Araç Modeli
const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    // Temel Bilgiler
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Car title is required"],
      trim: true,
    },

    // Kategori (Admin panelden görülen kategoriler)
    category: {
      type: String,
      required: [true, "Car category is required"],
      enum: ["Ekonomik", "Orta Sınıf", "Üst Sınıf", "SUV", "Geniş", "Lüks"],
      default: "Ekonomik",
    },

    // Marka ve Model
    brand: {
      type: String,
      required: [true, "Car brand is required"],
      trim: true,
      enum: [
        "Alfa Romeo",
        "Aston Martin",
        "Audi",
        "Bentley",
        "BMW",
        "Chery",
        "Chevrolet",
        "Chrysler",
        "Citroën",
        "Dacia",
        "Daihatsu",
        "Dodge",
        "DS Automobiles",
        "Eagle",
        "Ferrari",
        "Fiat",
        "Ford",
        "GAZ",
        "Geely",
        "Honda",
        "Hyundai",
        "Ikco",
        "Infiniti",
        "Jaguar",
        "Kia",
        "Lada",
        "Lamborghini",
        "Lancia",
        "Lexus",
        "Mazda",
        "Mercedes - Benz",
        "MG",
        "Mini",
        "Mitsubishi",
        "Moskwitsch",
        "Nissan",
        "Opel",
        "Peugeot",
        "Plymouth",
        "Pontiac",
        "Porsche",
        "Proton",
        "Renault",
        "Rover",
        "Saab",
        "Seat",
        "Skoda",
        "Subaru",
        "Suzuki",
        "Tata",
        "Tesla",
        "Tofas",
        "Toyota",
        "Volkswagen",
        "Volvo",
        "Acura",
        "DFM",
        "GMC",
        "Hummer",
        "Isuzu",
        "Jeep",
        "Land Rover",
        "Mahindra",
        "Ssangyong",
        "BMC",
        "Ford - Otosan",
        "Iveco - Otoyol",
        "Karsan",
        "Magirus",
        "Temsa",
        "Iveco",
        "Bedford",
        "DAF",
        "DFSK",
        "FAW",
        "HFKanuni",
        "Mitsubishi - Temsa",
        "Scania",
      ],
    },
    model: {
      type: String,
      required: [true, "Car model is required"],
      trim: true,
    },

    // Model Yılı
    year: {
      type: Number,
      required: [true, "Car year is required"],
      min: [1979, "Year must be after 1979"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },

    // Teknik Özellikler
    fuelType: {
      type: String,
      required: [true, "Fuel type is required"],
      enum: [
        "Belirtilmemiş",
        "Benzin",
        "Dizel",
        "Benzin+LPG",
        "Elektrikli",
        "Hibrit",
      ],
      default: "Belirtilmemiş",
    },
    transmission: {
      type: String,
      required: [true, "Transmission type is required"],
      enum: ["Belirtilmemiş", "Manuel", "Yarı Otomatik", "Otomatik"],
      default: "Belirtilmemiş",
    },
    bodyType: {
      type: String,
      required: [true, "Body type is required"],
      enum: [
        "Belirtilmemiş",
        "Sedan",
        "Hatchback",
        "Suv",
        "Station Wagon",
        "Kombi",
        "Panelvan",
        "Minivan",
        "Minivan & Panelvan",
        "Pickup",
        "Otobüs",
        "Kamyonet",
        "Kamyon",
      ],
      default: "Belirtilmemiş",
    },

    // Yaş ve Ehliyet Gereksinimleri
    minDriverAge: {
      type: Number,
      default: 21,
      min: [18, "Minimum driver age cannot be less than 18"],
    },
    minLicenseYear: {
      type: Number,
      default: 1,
      min: [0, "Minimum license year cannot be negative"],
    },

    // Resimler
    images: {
      // Ana listeleme görseli
      main: {
        url: String,
        publicId: String,
        filename: String,
      },
      // Galeri resimleri
      gallery: [
        {
          url: String,
          publicId: String,
          filename: String,
          caption: String,
          order: {
            type: Number,
            default: 0,
          },
        },
      ],
    },

    // Durum Bilgileri
    status: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    showInCampaigns: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Fiyatlandırma - Genel
    pricing: {
      daily: {
        type: Number,
        required: [true, "Daily price is required"],
        min: [0, "Price cannot be negative"],
      },
      weekly: {
        type: Number,
        min: [0, "Price cannot be negative"],
      },
      monthly: {
        type: Number,
        min: [0, "Price cannot be negative"],
      },
    },

    // Dönemsel Fiyatlandırma
    seasonalPricing: [
      {
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        daily: {
          type: Number,
          min: [0, "Price cannot be negative"],
        },
        weekly: {
          type: Number,
          min: [0, "Price cannot be negative"],
        },
        monthly: {
          type: Number,
          min: [0, "Price cannot be negative"],
        },
        name: {
          type: String,
          trim: true,
        },
      },
    ],

    // Km Limitleri
    kmLimits: {
      daily: {
        type: Number,
        default: 300,
        min: [0, "Km limit cannot be negative"],
      },
      weekly: {
        type: Number,
        default: 2100,
        min: [0, "Km limit cannot be negative"],
      },
      monthly: {
        type: Number,
        default: 9000,
        min: [0, "Km limit cannot be negative"],
      },
    },

    // Para Birimi
    currency: {
      type: String,
      default: "TRY",
      enum: ["TRY", "USD", "EUR"],
    },

    // Özellikler ve Donanımlar
    features: [
      {
        name: String,
        icon: String,
        category: {
          type: String,
          enum: ["safety", "comfort", "technology", "performance"],
        },
      },
    ],

    // Açıklama
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Konum ve Teslim
    availableLocations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
      },
    ],

    // WhatsApp Contact Info
    whatsappNumber: {
      type: String,
      default: process.env.DEFAULT_WHATSAPP || "+905366039907",
      trim: true,
    },
    whatsappMessage: {
      type: String,
      default: function () {
        return `Merhaba! ${this.brand} ${this.model} (${this.year}) aracını kiralamak istiyorum. Detaylı bilgi alabilir miyim?`;
      },
    },

    // SEO
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },
    keywords: [String],

    // Çok Dilli Destek
    translations: {
      en: {
        title: String,
        description: String,
        metaDescription: String,
      },
      tr: {
        title: String,
        description: String,
        metaDescription: String,
      },
    },

    // İstatistikler
    stats: {
      viewCount: {
        type: Number,
        default: 0,
      },
      reservationCount: {
        type: Number,
        default: 0,
      },
      rating: {
        average: {
          type: Number,
          default: 0,
          min: 0,
          max: 5,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
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

// Indexes for performance
carSchema.index({ category: 1, status: 1 });
carSchema.index({ brand: 1, model: 1 });
carSchema.index({ "pricing.daily": 1 });
carSchema.index({ featured: -1, order: 1 });
carSchema.index({ availableLocations: 1 });
carSchema.index({ createdAt: -1 });
carSchema.index({ "stats.rating.average": -1 });

// Virtual for full car name
carSchema.virtual("fullName").get(function () {
  return `${this.brand} ${this.model} (${this.year})`;
});

// Virtual for WhatsApp link
carSchema.virtual("whatsappLink").get(function () {
  const message = encodeURIComponent(this.whatsappMessage);
  const cleanNumber = this.whatsappNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanNumber}?text=${message}`;
});

// Virtual for current price (seasonal check)
carSchema.virtual("currentPrice").get(function () {
  const now = new Date();

  // Check for seasonal pricing
  const activeSeasonal = this.seasonalPricing.find(
    (season) => season.startDate <= now && season.endDate >= now
  );

  if (activeSeasonal) {
    return {
      daily: activeSeasonal.daily || this.pricing.daily,
      weekly: activeSeasonal.weekly || this.pricing.weekly,
      monthly: activeSeasonal.monthly || this.pricing.monthly,
      seasonal: true,
      seasonName: activeSeasonal.name,
    };
  }

  return {
    daily: this.pricing.daily,
    weekly: this.pricing.weekly,
    monthly: this.pricing.monthly,
    seasonal: false,
  };
});

// Pre-save middleware
carSchema.pre("save", function (next) {
  // Generate slug if not exists or if title/brand/model changed
  if (
    this.isModified("title") ||
    this.isModified("brand") ||
    this.isModified("model") ||
    !this.slug
  ) {
    const slugBase = this.title || `${this.brand}-${this.model}-${this.year}`;
    this.slug = slugBase
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Update timestamp
  this.updatedAt = Date.now();

  // Calculate weekly/monthly prices if not set
  if (this.pricing.daily && !this.pricing.weekly) {
    this.pricing.weekly = this.pricing.daily * 6; // 6 day discount for weekly
  }
  if (this.pricing.daily && !this.pricing.monthly) {
    this.pricing.monthly = this.pricing.daily * 25; // 25 day discount for monthly
  }

  next();
});

// Static method to search cars with filters
carSchema.statics.searchCars = function (query) {
  const {
    category,
    brand,
    model,
    minPrice,
    maxPrice,
    transmission,
    fuelType,
    bodyType,
    location,
    featured,
    year,
    page = 1,
    limit = 12,
    sortBy = "order",
  } = query;

  let filter = { status: true };

  // Category filter
  if (category && category !== "all") {
    filter.category = category;
  }

  // Brand filter
  if (brand && brand !== "all") {
    filter.brand = brand;
  }

  // Model filter
  if (model && model !== "all") {
    filter.model = model;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter["pricing.daily"] = {};
    if (minPrice) filter["pricing.daily"].$gte = Number(minPrice);
    if (maxPrice) filter["pricing.daily"].$lte = Number(maxPrice);
  }

  // Technical specs filters
  if (transmission && transmission !== "all")
    filter.transmission = transmission;
  if (fuelType && fuelType !== "all") filter.fuelType = fuelType;
  if (bodyType && bodyType !== "all") filter.bodyType = bodyType;
  if (year) filter.year = Number(year);

  // Location filter
  if (location) {
    filter.availableLocations = location;
  }

  // Featured filter
  if (featured === "true") {
    filter.featured = true;
  }

  // Sorting options
  let sort = {};
  switch (sortBy) {
    case "price-low":
      sort = { "pricing.daily": 1, order: 1 };
      break;
    case "price-high":
      sort = { "pricing.daily": -1, order: 1 };
      break;
    case "newest":
      sort = { createdAt: -1 };
      break;
    case "rating":
      sort = { "stats.rating.average": -1, order: 1 };
      break;
    case "popular":
      sort = { "stats.viewCount": -1, order: 1 };
      break;
    default:
      sort = { featured: -1, order: 1, createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  return this.find(filter)
    .populate("availableLocations", "name")
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));
};

// Static method to get available filters
carSchema.statics.getFilters = function () {
  return Promise.all([
    this.distinct("category", { status: true }),
    this.distinct("brand", { status: true }),
    this.distinct("transmission", { status: true }),
    this.distinct("fuelType", { status: true }),
    this.distinct("bodyType", { status: true }),
    this.aggregate([
      { $match: { status: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$pricing.daily" },
          maxPrice: { $max: "$pricing.daily" },
        },
      },
    ]),
  ]).then(
    ([
      categories,
      brands,
      transmissions,
      fuelTypes,
      bodyTypes,
      priceRange,
    ]) => ({
      categories: categories.sort(),
      brands: brands.sort(),
      transmissions: transmissions.filter((t) => t !== "Belirtilmemiş").sort(),
      fuelTypes: fuelTypes.filter((f) => f !== "Belirtilmemiş").sort(),
      bodyTypes: bodyTypes.filter((b) => b !== "Belirtilmemiş").sort(),
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 },
    })
  );
};

// Instance method to get formatted price
carSchema.methods.getFormattedPrice = function (period = "daily") {
  const currencySymbols = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
  };

  const currentPrice = this.currentPrice;
  const price = currentPrice[period];
  const symbol = currencySymbols[this.currency] || "₺";

  return `${symbol}${price}/${
    period === "daily" ? "gün" : period === "weekly" ? "hafta" : "ay"
  }`;
};

// Instance method to increment view count
carSchema.methods.incrementViewCount = function () {
  this.stats.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model("Car", carSchema);
