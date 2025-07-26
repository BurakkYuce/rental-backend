// src/models/ExchangeRate.js - Exchange Rate Management Model
const mongoose = require("mongoose");

const exchangeRateSchema = new mongoose.Schema(
  {
    // Base currency (always EUR in our system)
    baseCurrency: {
      type: String,
      default: "EUR",
      required: true,
      enum: ["EUR"],
    },
    
    // Target currency rates relative to EUR
    rates: {
      // EUR to Turkish Lira
      TRY: {
        type: Number,
        required: [true, "TRY exchange rate is required"],
        min: [0.01, "Exchange rate must be positive"],
        default: 35.4,
      },
      
      // EUR to US Dollar
      USD: {
        type: Number,
        required: [true, "USD exchange rate is required"],
        min: [0.01, "Exchange rate must be positive"],
        default: 1.09,
      },
      
      // EUR to EUR (always 1)
      EUR: {
        type: Number,
        default: 1,
        required: true,
      },
    },
    
    // Metadata
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false, // Allow null for system initialization
    },
    
    // Update notes/reason for the change
    updateNotes: {
      type: String,
      maxlength: [500, "Update notes cannot exceed 500 characters"],
      trim: true,
    },
    
    // Active status - only one exchange rate config can be active at a time
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Automatic expiry date (optional - for future use)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
exchangeRateSchema.index({ isActive: 1, createdAt: -1 });
exchangeRateSchema.index({ lastUpdatedBy: 1 });

// Virtual for formatted rates display
exchangeRateSchema.virtual("formattedRates").get(function () {
  return {
    EUR: `1 EUR = 1 EUR`,
    TRY: `1 EUR = ${this.rates.TRY} TRY`,
    USD: `1 EUR = ${this.rates.USD} USD`,
  };
});

// Virtual for all supported currencies
exchangeRateSchema.virtual("supportedCurrencies").get(function () {
  return Object.keys(this.rates);
});

// Pre-save middleware to ensure only one active exchange rate
exchangeRateSchema.pre("save", async function (next) {
  if (this.isNew && this.isActive) {
    // Deactivate all other exchange rates when creating a new active one
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  } else if (this.isModified("isActive") && this.isActive) {
    // Deactivate all other exchange rates when activating this one
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  
  // Ensure EUR rate is always 1
  this.rates.EUR = 1;
  
  next();
});

// Static method to get current active exchange rates
exchangeRateSchema.statics.getCurrentRates = function () {
  return this.findOne({ isActive: true })
    .sort({ createdAt: -1 });
};

// Static method to create or update exchange rates
exchangeRateSchema.statics.updateRates = async function (ratesData, userId, notes) {
  // Validate rates data
  if (!ratesData.TRY || !ratesData.USD) {
    throw new Error("Both TRY and USD rates are required");
  }
  
  if (ratesData.TRY <= 0 || ratesData.USD <= 0) {
    throw new Error("Exchange rates must be positive numbers");
  }
  
  // Create new exchange rate entry
  const newRates = new this({
    rates: {
      EUR: 1,
      TRY: ratesData.TRY,
      USD: ratesData.USD,
    },
    lastUpdatedBy: userId,
    updateNotes: notes,
    isActive: true,
  });
  
  return await newRates.save();
};

// Instance method to convert currency
exchangeRateSchema.methods.convertCurrency = function (amount, fromCurrency, toCurrency) {
  if (!amount || amount <= 0) {
    return 0;
  }
  
  // Validate currencies
  const supportedCurrencies = Object.keys(this.rates);
  if (!supportedCurrencies.includes(fromCurrency) || !supportedCurrencies.includes(toCurrency)) {
    throw new Error(`Unsupported currency. Supported: ${supportedCurrencies.join(", ")}`);
  }
  
  // Convert to EUR first (base currency), then to target currency
  let amountInEUR;
  if (fromCurrency === "EUR") {
    amountInEUR = amount;
  } else {
    // Convert from other currency to EUR
    amountInEUR = amount / this.rates[fromCurrency];
  }
  
  // Convert from EUR to target currency
  const convertedAmount = amountInEUR * this.rates[toCurrency];
  
  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
};

// Instance method to get currency symbol
exchangeRateSchema.methods.getCurrencySymbol = function (currency) {
  const symbols = {
    EUR: "€",
    TRY: "₺",
    USD: "$",
  };
  return symbols[currency] || currency;
};

// Instance method to format price with currency
exchangeRateSchema.methods.formatPrice = function (amount, currency) {
  const symbol = this.getCurrencySymbol(currency);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "TRY" ? 0 : 2,
    maximumFractionDigits: currency === "TRY" ? 0 : 2,
  }).format(amount);
  
  return `${symbol}${formattedAmount}`;
};

module.exports = mongoose.model("ExchangeRate", exchangeRateSchema);