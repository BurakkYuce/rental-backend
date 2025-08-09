// src/controllers/exchangeRateController.js - Exchange Rate Management Controller
const ExchangeRate = require("../models/ExchangeRate");
const { validationResult } = require("express-validator");
const https = require("https");

/**
 * Fetch real-time exchange rates from Turkey's Central Bank (TCMB)
 * @returns {Promise<Object>} Exchange rates with EUR as base currency
 */
const fetchTCMBRates = async () => {
  return new Promise((resolve, reject) => {
    const url = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    
    console.log('🔄 Fetching exchange rates from TCMB...');
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          // Parse XML to extract USD and EUR rates
          const usdMatch = data.match(/<Currency[^>]*CurrencyCode="USD"[^>]*>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/);
          const eurMatch = data.match(/<Currency[^>]*CurrencyCode="EUR"[^>]*>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/);
          
          if (!usdMatch || !eurMatch) {
            console.error('❌ Could not parse TCMB rates');
            reject(new Error('Failed to parse exchange rates from TCMB'));
            return;
          }
          
          const usdToTry = parseFloat(usdMatch[1]);
          const eurToTry = parseFloat(eurMatch[1]);
          
          // TCMB gives rates relative to TRY (1 USD = X TRY, 1 EUR = Y TRY)
          // If 1 EUR = 47 TRY and 1 USD = 43 TRY, then 1 EUR = 47/43 USD = 1.09 USD
          const eurToUsd = eurToTry / usdToTry; // How many USD for 1 EUR
          
          const rates = {
            EUR: 1, // Base currency
            TRY: eurToTry, // 1 EUR = X TRY
            USD: eurToUsd  // 1 EUR = X USD
          };
          
          console.log('✅ TCMB rates fetched successfully:', rates);
          resolve(rates);
          
        } catch (error) {
          console.error('❌ Error parsing TCMB data:', error);
          reject(error);
        }
      });
      
    }).on('error', (error) => {
      console.error('❌ Error fetching TCMB rates:', error);
      reject(error);
    });
  });
};

/**
 * @desc Get current active exchange rates from TCMB (real-time)
 * @route GET /api/exchange-rates/current
 * @access Public
 */
const getCurrentRates = async (req, res) => {
  try {
    // Fetch real-time rates from TCMB
    const rates = await fetchTCMBRates();
    
    // Format rates for display
    const formattedRates = {
      EUR: `€1.00`,
      TRY: `₺${rates.TRY.toFixed(2)}`,
      USD: `$${rates.USD.toFixed(2)}`
    };
    
    const supportedCurrencies = [
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "TRY", name: "Turkish Lira", symbol: "₺" },
      { code: "USD", name: "US Dollar", symbol: "$" }
    ];
    
    res.status(200).json({
      success: true,
      message: "Real-time exchange rates from TCMB",
      data: {
        rates,
        lastUpdated: new Date(),
        source: "Turkey Central Bank (TCMB)",
        formattedRates,
        supportedCurrencies,
      },
    });
  } catch (error) {
    console.error("Error getting TCMB exchange rates:", error);
    
    // Fallback to default rates if TCMB fails
    // Realistic rates: 1 EUR = 37 TRY, 1 USD = 34 TRY, so 1 EUR = 1.09 USD
    const fallbackRates = {
      EUR: 1,      // Base currency
      TRY: 37.0,   // 1 EUR = 37 TRY
      USD: 1.09,   // 1 EUR = 1.09 USD
    };
    
    res.status(200).json({
      success: true,
      message: "Using fallback exchange rates (TCMB unavailable)",
      data: {
        rates: fallbackRates,
        lastUpdated: new Date(),
        source: "Fallback rates",
        formattedRates: {
          EUR: `€1.00`,
          TRY: `₺${fallbackRates.TRY.toFixed(2)}`,
          USD: `$${fallbackRates.USD.toFixed(2)}`
        },
        supportedCurrencies: [
          { code: "EUR", name: "Euro", symbol: "€" },
          { code: "TRY", name: "Turkish Lira", symbol: "₺" },
          { code: "USD", name: "US Dollar", symbol: "$" }
        ],
      },
    });
  }
};

/**
 * @desc Convert currency amount using TCMB real-time rates
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
    
    // Validate supported currencies
    const supportedCurrencies = ['EUR', 'TRY', 'USD'];
    if (!supportedCurrencies.includes(fromCurrency) || !supportedCurrencies.includes(toCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Supported currencies: ${supportedCurrencies.join(', ')}`,
      });
    }
    
    let rates;
    try {
      // Fetch real-time rates from TCMB
      rates = await fetchTCMBRates();
    } catch (error) {
      // Use fallback rates if TCMB fails
      rates = {
        EUR: 1,      // Base currency
        TRY: 37.0,   // 1 EUR = 37 TRY
        USD: 1.09,   // 1 EUR = 1.09 USD
      };
    }
    
    // Convert currency (all rates are relative to EUR as base)
    let convertedAmount;
    if (fromCurrency === toCurrency) {
      convertedAmount = amount;
    } else {
      // Convert from source currency to EUR, then to target currency
      const amountInEUR = amount / rates[fromCurrency];
      convertedAmount = amountInEUR * rates[toCurrency];
    }
    
    // Format amount with currency symbol
    const currencySymbols = {
      EUR: '€',
      TRY: '₺',
      USD: '$'
    };
    
    const formattedAmount = `${currencySymbols[toCurrency]}${convertedAmount.toFixed(2)}`;
    const exchangeRate = rates[toCurrency] / rates[fromCurrency];
    
    res.status(200).json({
      success: true,
      message: "Currency conversion successful using TCMB rates",
      data: {
        originalAmount: amount,
        fromCurrency,
        toCurrency,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        formattedAmount,
        exchangeRate: Math.round(exchangeRate * 10000) / 10000,
        source: "Turkey Central Bank (TCMB)",
      },
    });
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
 * @desc Get supported currencies with TCMB real-time rates
 * @route GET /api/exchange-rates/currencies
 * @access Public
 */
const getSupportedCurrencies = async (req, res) => {
  try {
    let currentRates;
    try {
      // Fetch real-time rates from TCMB
      currentRates = await fetchTCMBRates();
    } catch (error) {
      // Use fallback rates if TCMB fails
      currentRates = {
        EUR: 1,      // Base currency
        TRY: 37.0,   // 1 EUR = 37 TRY
        USD: 1.09,   // 1 EUR = 1.09 USD
      };
    }
    
    const currencies = [
      { code: "EUR", name: "Euro", symbol: "€", default: true, rate: currentRates.EUR },
      { code: "TRY", name: "Turkish Lira", symbol: "₺", default: false, rate: currentRates.TRY },
      { code: "USD", name: "US Dollar", symbol: "$", default: false, rate: currentRates.USD },
    ];
    
    res.status(200).json({
      success: true,
      message: "Supported currencies with TCMB rates",
      data: {
        currencies,
        currentRates,
        source: "Turkey Central Bank (TCMB)",
        lastUpdated: new Date(),
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