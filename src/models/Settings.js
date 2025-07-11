// src/models/Settings.js - Site Ayarları Modeli
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Ayar tipi (benzersiz)
    type: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "company",
        "currencies",
        "contact",
        "email",
        "seo",
        "social",
        "payment",
        "general",
      ],
    },

    // Genel ayarlar
    general: {
      siteName: String,
      siteDescription: String,
      logo: {
        url: String,
        publicId: String,
      },
      favicon: {
        url: String,
        publicId: String,
      },
      defaultLanguage: {
        type: String,
        default: "tr",
        enum: ["tr", "en"],
      },
      timezone: {
        type: String,
        default: "Europe/Istanbul",
      },
      dateFormat: {
        type: String,
        default: "DD/MM/YYYY",
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },

    // Firma bilgileri (admin panelden görülen)
    company: {
      name: {
        type: String,
        default: "Mit Car Rent A Car",
      },
      phone: {
        type: String,
        default: "0 (536) 603 9907",
      },
      fax: {
        type: String,
        default: "0 (000) 000 00 00",
      },
      whatsappNumber: {
        type: String,
        default: "0 (536) 603 9907",
      },
      email: {
        type: String,
        default: "info@mitcarrental.com",
      },
      address: {
        type: String,
        default: "Kızıltoprak Mah. 939 Sok. No.6/B MURATPAŞA / ANTALYA",
      },
      customerServiceNumber: {
        type: String,
        default: "000036609907",
      },
      taxNumber: String,
      taxOffice: String,
      tradeRegistryNumber: String,
      mersisNumber: String,
    },

    // Para birimleri
    currencies: [
      {
        code: {
          type: String,
          required: true,
          enum: ["EUR", "USD", "TRY"],
        },
        name: String,
        symbol: String,
        rate: {
          type: Number,
          default: 1,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        status: {
          type: Boolean,
          default: true,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    // E-posta ayarları
    email: {
      smtpHost: {
        type: String,
        default: "smtp-relay.brevo.com",
      },
      smtpPort: {
        type: Number,
        default: 465,
      },
      smtpSecurity: {
        type: String,
        enum: ["SSL", "TLS", "None"],
        default: "SSL",
      },
      smtpUsername: {
        type: String,
        default: "tamaydogar@gmail.com",
      },
      smtpPassword: String, // Encrypted
      senderEmail: {
        type: String,
        default: "info@mitcarrental.com",
      },
      senderName: {
        type: String,
        default: "Mit Car Rental",
      },
      replyToEmail: String,
      isActive: {
        type: Boolean,
        default: true,
      },
      // E-posta şablonları
      templates: {
        reservation: {
          subject: String,
          body: String,
        },
        confirmation: {
          subject: String,
          body: String,
        },
        cancellation: {
          subject: String,
          body: String,
        },
        reminder: {
          subject: String,
          body: String,
        },
      },
    },

    // SEO ayarları
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
      googleAnalyticsId: String,
      googleTagManagerId: String,
      facebookPixelId: String,
      googleSiteVerification: String,
      bingVerification: String,
      robots: {
        type: String,
        default: "index, follow",
      },
      canonicalUrl: String,
    },

    // Sosyal medya
    social: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
      linkedin: String,
      whatsapp: String,
      telegram: String,
    },

    // Ödeme ayarları
    payment: {
      stripe: {
        publishableKey: String,
        secretKey: String, // Encrypted
        webhookSecret: String, // Encrypted
        isActive: {
          type: Boolean,
          default: false,
        },
      },
      paypal: {
        clientId: String,
        clientSecret: String, // Encrypted
        isActive: {
          type: Boolean,
          default: false,
        },
      },
      iyzico: {
        apiKey: String,
        secretKey: String, // Encrypted
        baseUrl: String,
        isActive: {
          type: Boolean,
          default: false,
        },
      },
      acceptedCards: [
        {
          type: String,
          enum: ["visa", "mastercard", "amex", "discover"],
        },
      ],
      currency: {
        type: String,
        default: "TRY",
      },
      requireDeposit: {
        type: Boolean,
        default: true,
      },
      depositAmount: {
        type: Number,
        default: 500,
      },
    },

    // Rezervasyon ayarları
    booking: {
      minAdvanceBooking: {
        type: Number,
        default: 24, // hours
      },
      maxAdvanceBooking: {
        type: Number,
        default: 365, // days
      },
      minRentalDuration: {
        type: Number,
        default: 1, // days
      },
      maxRentalDuration: {
        type: Number,
        default: 30, // days
      },
      autoConfirmation: {
        type: Boolean,
        default: false,
      },
      requireDeposit: {
        type: Boolean,
        default: true,
      },
      cancellationPolicy: {
        freeUntil: {
          type: Number,
          default: 48, // hours before pickup
        },
        partialRefundUntil: {
          type: Number,
          default: 24, // hours before pickup
        },
        refundPercentage: {
          type: Number,
          default: 50, // percent
        },
      },
    },

    // Bildirim ayarları
    notifications: {
      email: {
        newBooking: {
          type: Boolean,
          default: true,
        },
        cancellation: {
          type: Boolean,
          default: true,
        },
        reminder: {
          type: Boolean,
          default: true,
        },
      },
      sms: {
        newBooking: {
          type: Boolean,
          default: false,
        },
        reminder: {
          type: Boolean,
          default: false,
        },
      },
      adminEmails: [String],
    },

    // API ayarları
    api: {
      rateLimit: {
        windowMs: {
          type: Number,
          default: 900000, // 15 minutes
        },
        maxRequests: {
          type: Number,
          default: 100,
        },
      },
      cors: {
        allowedOrigins: [String],
        allowCredentials: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Çok dilli içerik
    translations: {
      tr: {
        siteName: String,
        siteDescription: String,
        companyName: String,
        address: String,
      },
      en: {
        siteName: String,
        siteDescription: String,
        companyName: String,
        address: String,
      },
    },

    // Son güncelleme bilgileri
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
settingsSchema.index({ type: 1 });

// Pre-save middleware
settingsSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

// Static method to get settings by type
settingsSchema.statics.getByType = function (type) {
  return this.findOne({ type });
};

// Static method to update settings
settingsSchema.statics.updateSettings = function (
  type,
  data,
  updatedBy = null
) {
  return this.findOneAndUpdate(
    { type },
    {
      ...data,
      lastUpdated: Date.now(),
      updatedBy,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );
};

// Static method to get all settings for frontend
settingsSchema.statics.getPublicSettings = function () {
  return this.find(
    {},
    {
      "email.smtpPassword": 0,
      "payment.stripe.secretKey": 0,
      "payment.stripe.webhookSecret": 0,
      "payment.paypal.clientSecret": 0,
      "payment.iyzico.secretKey": 0,
    }
  );
};

// Static method to get company info
settingsSchema.statics.getCompanyInfo = function () {
  return this.findOne({ type: "company" }, "company general");
};

// Static method to get active currencies
settingsSchema.statics.getActiveCurrencies = function () {
  return this.findOne({ type: "currencies" }, "currencies").then((settings) => {
    if (!settings || !settings.currencies) return [];
    return settings.currencies
      .filter((currency) => currency.status)
      .sort((a, b) => a.order - b.order);
  });
};

// Instance method to get default currency
settingsSchema.methods.getDefaultCurrency = function () {
  if (this.type !== "currencies" || !this.currencies) return null;

  const defaultCurrency = this.currencies.find(
    (currency) => currency.isDefault && currency.status
  );

  return defaultCurrency || this.currencies.find((currency) => currency.status);
};

module.exports = mongoose.model("Settings", settingsSchema);
