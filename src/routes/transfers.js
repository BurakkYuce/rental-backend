// src/routes/transfers.js - Transfer Routes
const express = require('express');
const router = express.Router();
const {
  getAllTransfers,
  getTransfer
} = require('../controllers/transferController');

// @desc    Get all transfer zones
// @route   GET /api/transfers
// @access  Public
router.get('/', getAllTransfers);

// @desc    Get single transfer zone
// @route   GET /api/transfers/:id
// @access  Public
router.get('/:id', getTransfer);

module.exports = router;