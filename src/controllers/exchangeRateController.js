// src/controllers/exchangeRateController.js - Exchange Rate Management Controller
const ExchangeRate = require("../models/ExchangeRate");
const { validationResult } = require("express-validator");

/**
 * @desc Get current active exchange rates
 * @route GET /api/exchange-rates/current
 * @access Public
 */
const getCurrentRates = async (req, res) => {
  try {
    const currentRates = await ExchangeRate.getCurrentRates();
    
    if (!currentRates) {
      // Create default rates if none exist
      const defaultRates = new ExchangeRate({
        rates: {
          EUR: 1,
          TRY: 35.4,
          USD: 1.09,
        },
        lastUpdatedBy: null,
        updateNotes: "Default exchange rates",
        isActive: true,
      });
      
      await defaultRates.save();
      
      return res.status(200).json({
        success: true,
        message: "Default exchange rates created",
        data: {
          rates: defaultRates.rates,
          lastUpdated: defaultRates.createdAt,
          formattedRates: defaultRates.formattedRates,
          supportedCurrencies: defaultRates.supportedCurrencies,
        },
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Current exchange rates retrieved successfully",
      data: {
        rates: currentRates.rates,
        lastUpdated: currentRates.createdAt,
        lastUpdatedBy: currentRates.lastUpdatedBy,
        updateNotes: currentRates.updateNotes,
        formattedRates: currentRates.formattedRates,
        supportedCurrencies: currentRates.supportedCurrencies,
      },
    });
  } catch (error) {
    console.error("Error getting current exchange rates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve exchange rates",
    });
  }
};

/**
 * @desc Convert currency amount
 * @route POST /api/exchange-rates/convert
 * @access Public
 */
const convertCurrency = async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    // Validation
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: "Amount, fromCurrency, and toCurrency are required",
      });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be a positive number",
      });
    }
    
    const currentRates = await ExchangeRate.getCurrentRates();
    if (!currentRates) {
      return res.status(404).json({
        success: false,
        error: "Exchange rates not configured",
      });
    }
    
    try {
      const convertedAmount = currentRates.convertCurrency(amount, fromCurrency, toCurrency);
      const formattedAmount = currentRates.formatPrice(convertedAmount, toCurrency);
      
      res.status(200).json({
        success: true,
        message: "Currency conversion successful",
        data: {
          originalAmount: amount,
          fromCurrency,
          toCurrency,
          convertedAmount,
          formattedAmount,
          exchangeRate: currentRates.rates[toCurrency] / currentRates.rates[fromCurrency],
        },
      });
    } catch (conversionError) {
      res.status(400).json({
        success: false,
        error: conversionError.message,
      });
    }
  } catch (error) {
    console.error("Error converting currency:", error);
    res.status(500).json({
      success: false,
      error: "Failed to convert currency",
    });
  }
};

/**
 * @desc Get exchange rate history
 * @route GET /api/exchange-rates/history
 * @access Private (Admin only)
 */
const getRateHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const [history, total] = await Promise.all([
      ExchangeRate.find()
        .populate("lastUpdatedBy", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ExchangeRate.countDocuments(),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      message: "Exchange rate history retrieved successfully",
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting exchange rate history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve exchange rate history",
    });
  }
};

/**
 * @desc Update exchange rates
 * @route PUT /api/exchange-rates
 * @access Private (Admin only)
 */
const updateExchangeRates = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }
    
    const { rates, updateNotes } = req.body;
    const userId = req.admin.id || req.admin._id;
    
    // Validate required rates
    if (!rates || !rates.TRY || !rates.USD) {
      return res.status(400).json({
        success: false,
        error: "Both TRY and USD exchange rates are required",
      });
    }
    
    // Validate rate values
    if (rates.TRY <= 0 || rates.USD <= 0) {
      return res.status(400).json({
        success: false,
        error: "Exchange rates must be positive numbers",
      });
    }
    
    // Update rates using static method
    const newRates = await ExchangeRate.updateRates(rates, userId, updateNotes);
    
    // Populate the admin reference
    await newRates.populate("lastUpdatedBy", "username email");
    
    res.status(200).json({
      success: true,
      message: "Exchange rates updated successfully",
      data: {
        rates: newRates.rates,
        lastUpdated: newRates.createdAt,
        lastUpdatedBy: newRates.lastUpdatedBy,
        updateNotes: newRates.updateNotes,
        formattedRates: newRates.formattedRates,
      },
    });
  } catch (error) {
    console.error("Error updating exchange rates:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update exchange rates",
    });
  }
};

/**
 * @desc Get supported currencies
 * @route GET /api/exchange-rates/currencies
 * @access Public
 */
const getSupportedCurrencies = async (req, res) => {
  try {
    const currentRates = await ExchangeRate.getCurrentRates();
    
    const currencies = [
      { code: "EUR", name: "Euro", symbol: "€", default: true },
      { code: "TRY", name: "Turkish Lira", symbol: "₺", default: false },
      { code: "USD", name: "US Dollar", symbol: "$", default: false },
    ];
    
    res.status(200).json({
      success: true,
      message: "Supported currencies retrieved successfully",
      data: {
        currencies,
        currentRates: currentRates ? currentRates.rates : null,
      },
    });
  } catch (error) {
    console.error("Error getting supported currencies:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve supported currencies",
    });
  }
};

/**
 * @desc Initialize default exchange rates
 * @route POST /api/exchange-rates/initialize
 * @access Private (Admin only)
 */
const initializeDefaultRates = async (req, res) => {
  try {
    const existingRates = await ExchangeRate.getCurrentRates();
    
    if (existingRates) {
      return res.status(200).json({
        success: true,
        message: "Exchange rates already initialized",
        data: {
          rates: existingRates.rates,
          formattedRates: existingRates.formattedRates,
        },
      });
    }
    
    const defaultRates = new ExchangeRate({
      rates: {
        EUR: 1,
        TRY: 35.4,
        USD: 1.09,
      },
      lastUpdatedBy: req.admin.id || req.admin._id,
      updateNotes: "System initialization - default exchange rates",
      isActive: true,
    });
    
    await defaultRates.save();
    await defaultRates.populate("lastUpdatedBy", "username email");
    
    res.status(201).json({
      success: true,
      message: "Default exchange rates initialized successfully",
      data: {
        rates: defaultRates.rates,
        lastUpdated: defaultRates.createdAt,
        lastUpdatedBy: defaultRates.lastUpdatedBy,
        formattedRates: defaultRates.formattedRates,
      },
    });
  } catch (error) {
    console.error("Error initializing default rates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize default exchange rates",
    });
  }
};

module.exports = {
  getCurrentRates,
  convertCurrency,
  getRateHistory,
  updateExchangeRates,
  getSupportedCurrencies,
  initializeDefaultRates,
};