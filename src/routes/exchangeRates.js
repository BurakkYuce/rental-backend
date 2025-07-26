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

/**
 * @swagger
 * /api/exchange-rates/current:
 *   get:
 *     summary: Get current active exchange rates
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: Current exchange rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     rates:
 *                       type: object
 *                       properties:
 *                         EUR:
 *                           type: number
 *                         TRY:
 *                           type: number
 *                         USD:
 *                           type: number
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                     formattedRates:
 *                       type: object
 *                     supportedCurrencies:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get("/current", getCurrentRates);

/**
 * @swagger
 * /api/exchange-rates/currencies:
 *   get:
 *     summary: Get supported currencies
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: Supported currencies retrieved successfully
 */
router.get("/currencies", getSupportedCurrencies);

/**
 * @swagger
 * /api/exchange-rates/convert:
 *   post:
 *     summary: Convert currency amount
 *     tags: [Exchange Rates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - fromCurrency
 *               - toCurrency
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               fromCurrency:
 *                 type: string
 *                 enum: [EUR, TRY, USD]
 *               toCurrency:
 *                 type: string
 *                 enum: [EUR, TRY, USD]
 *     responses:
 *       200:
 *         description: Currency conversion successful
 *       400:
 *         description: Invalid input parameters
 */
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

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo("admin", "super_admin"));

/**
 * @swagger
 * /api/exchange-rates/history:
 *   get:
 *     summary: Get exchange rate update history
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Exchange rate history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/exchange-rates:
 *   put:
 *     summary: Update exchange rates
 *     tags: [Exchange Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rates
 *             properties:
 *               rates:
 *                 type: object
 *                 required:
 *                   - TRY
 *                   - USD
 *                 properties:
 *                   TRY:
 *                     type: number
 *                     minimum: 0.01
 *                   USD:
 *                     type: number
 *                     minimum: 0.01
 *               updateNotes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Exchange rates updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
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