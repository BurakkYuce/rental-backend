// src/routes/exchangeRates.js - Exchange Rate Routes
const express = require("express");
const { body, query } = require("express-validator");
const {
  getCurrentRates,
  convertCurrency,
  getRateHistory,
  updateExchangeRates,
  getSupportedCurrencies,
  initializeDefaultRates,
} = require("../controllers/exchangeRateController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Exchange Rates
 *   description: Exchange rate management endpoints
 */

router.get("/current", getCurrentRates);
router.get("/currencies", getSupportedCurrencies);

router.post("/convert", [
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("fromCurrency")
    .isIn(["EUR", "TRY", "USD"])
    .withMessage("Invalid source currency"),
  body("toCurrency")
    .isIn(["EUR", "TRY", "USD"])
    .withMessage("Invalid target currency"),
], convertCurrency);

router.use(protect);
router.use(restrictTo("admin", "super_admin"));

router.get("/history", [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
], getRateHistory);

router.put("/", [
  body("rates.TRY")
    .isFloat({ min: 0.01 })
    .withMessage("TRY rate must be a positive number"),
  body("rates.USD")
    .isFloat({ min: 0.01 })
    .withMessage("USD rate must be a positive number"),
  body("updateNotes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Update notes cannot exceed 500 characters")
    .trim(),
], updateExchangeRates);

/**
 * @swagger
 * /api/exchange-rates/initialize:
 *   post:
 *     summary: Initialize default exchange rates
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default exchange rates initialized successfully
 *       200:
 *         description: Exchange rates already initialized
 *       401:
 *         description: Unauthorized
 */
router.post("/initialize", initializeDefaultRates);

module.exports = router;