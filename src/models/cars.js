// src/models/Car.js - PostgreSQL Car Model (Simplified for Specified Fields Only)
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Car = sequelize.define(
  "Car",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Car Title (Required)
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Car title is required" },
        len: { args: [5, 200], msg: "Title must be between 5-200 characters" },
      },
    },

    // Year (Required)
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: 1980, msg: "Year must be after 1980" },
        max: {
          args: new Date().getFullYear() + 1,
          msg: "Year cannot be in the future",
        },
      },
    },

    // Brand (Required)
    brand: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Brand is required" },
      },
    },

    // Model (Required)
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Model is required" },
      },
    },

    // Category (Required)
    category: {
      type: DataTypes.ENUM(
        "Ekonomik",
        "Orta Sınıf",
        "Üst Sınıf",
        "SUV",
        "Geniş",
        "Lüks"
      ),
      allowNull: false,
      defaultValue: "Ekonomik",
    },

    // Body Type (Required)
    bodyType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Sedan",
    },

    // Seats (Required)
    seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: { args: 2, msg: "Seats cannot be less than 2" },
        max: { args: 50, msg: "Seats cannot be more than 50" },
      },
    },

    // Doors (Required)
    doors: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      validate: {
        min: { args: 2, msg: "Doors cannot be less than 2" },
        max: { args: 6, msg: "Doors cannot be more than 6" },
      },
    },

    // Engine (cc) (Optional)
    engineCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: 500, msg: "Engine capacity cannot be less than 500cc" },
        max: {
          args: 10000,
          msg: "Engine capacity cannot be more than 10000cc",
        },
      },
    },

    // Transmission (Required)
    transmission: {
      type: DataTypes.ENUM("Manuel", "Yarı Otomatik", "Otomatik"),
      allowNull: false,
      defaultValue: "Manuel",
    },

    // Fuel Type (Required)
    fuelType: {
      type: DataTypes.ENUM(
        "Benzin",
        "Dizel",
        "Benzin+LPG",
        "Elektrikli",
        "Hibrit"
      ),
      allowNull: false,
      defaultValue: "Benzin",
    },

    // Main Image (Optional) - Single image object
    mainImage: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      validate: {
        isValidImageStructure(value) {  
          if (value && typeof value === "object") {
            if (!value.url || !value.publicId) {
              throw new Error("Main image must have url and publicId");
            }
          }
        },
      },
    },

    // Description (Optional)
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: "Description cannot exceed 2000 characters",
        },
      },
    },

    // Daily/Weekly/Monthly Rate Pricing (Required)
    pricing: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        currency: "TRY",
      },
      validate: {
        isValidPricing(value) {
          if (!value || !value.daily || value.daily <= 0) {
            throw new Error("Daily price is required and must be positive");
          }
        },
      },
    },

    // System fields for basic functionality
    slug: {
      type: DataTypes.STRING(250),
      allowNull: false,
      unique: {
        msg: "Slug must be unique",
      },
      defaultValue: "temp-slug",
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "maintenance"),
      allowNull: false,
      defaultValue: "active",
    },

    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Foreign Key to Admin
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "admins",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "cars",
    indexes: [
      { fields: ["userId"] },
      { fields: ["status"] },
      { fields: ["featured"] },
      { fields: ["brand", "model"] },
      { fields: ["category"] },
      { fields: ["slug"] },
      { fields: ['"pricing"'], using: "gin" }, // JSONB index
      { fields: ['"mainImage"'], using: "gin" }, // JSONB index
    ],
    hooks: {
      beforeCreate: async (car) => {
        // Generate slug if not exists
        if (!car.slug) {
          const baseSlug = car.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

          const timestamp = Date.now().toString(36);
          car.slug = `${baseSlug}-${timestamp}`;
        }

        // Auto-calculate weekly/monthly prices if not set
        if (car.pricing && car.pricing.daily) {
          if (!car.pricing.weekly || car.pricing.weekly === 0) {
            car.pricing.weekly = car.pricing.daily * 6;
          }
          if (!car.pricing.monthly || car.pricing.monthly === 0) {
            car.pricing.monthly = car.pricing.daily * 25;
          }
        }
      },
      beforeUpdate: async (car) => {
        // Generate new slug if title changed
        if (car.changed("title")) {
          const baseSlug = car.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

          const timestamp = Date.now().toString(36);
          car.slug = `${baseSlug}-${timestamp}`;
        }

        // Auto-calculate weekly/monthly prices if not set
        if (car.pricing && car.pricing.daily) {
          if (!car.pricing.weekly || car.pricing.weekly === 0) {
            car.pricing.weekly = car.pricing.daily * 6;
          }
          if (!car.pricing.monthly || car.pricing.monthly === 0) {
            car.pricing.monthly = car.pricing.daily * 25;
          }
        }
      },
    },
  }
);

// Instance methods
Car.prototype.getMainImageUrl = function () {
  return this.mainImage?.url || null;
};

Car.prototype.getFormattedPrice = function (period = "daily") {
  const currencySymbols = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
  };

  const price = this.pricing[period];
  const symbol = currencySymbols[this.pricing.currency] || "₺";
  const periodText =
    period === "daily" ? "gün" : period === "weekly" ? "hafta" : "ay";

  return `${symbol}${price}/${periodText}`;
};

Car.prototype.getFullName = function () {
  return `${this.brand} ${this.model} (${this.year})`;
};

module.exports = Car;
