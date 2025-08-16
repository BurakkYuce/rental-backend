// src/controllers/transferController.js - Transfer Controller
const { Transfer } = require('../models');

// @desc    Get all transfer zones (public)
// @route   GET /api/transfers
// @access  Public
const getAllTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.findAll({
      where: { status: 'active' },
      order: [['displayOrder', 'ASC'], ['zoneName', 'ASC']],
      attributes: ['id', 'zoneName', 'description', 'pricing', 'displayOrder']
    });

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    console.error('❌ Get transfers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transfer zones',
      message: error.message
    });
  }
};

// @desc    Get single transfer zone
// @route   GET /api/transfers/:id
// @access  Public
const getTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transfer = await Transfer.findOne({
      where: { id, status: 'active' },
      attributes: ['id', 'zoneName', 'description', 'pricing', 'displayOrder']
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer zone not found'
      });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('❌ Get transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transfer zone',
      message: error.message
    });
  }
};

// @desc    Create transfer zone (admin only)
// @route   POST /api/admin/transfers
// @access  Admin
const createTransfer = async (req, res) => {
  try {
    const {
      zoneName,
      description,
      pricing,
      displayOrder
    } = req.body;

    // Validate required fields
    if (!zoneName) {
      return res.status(400).json({
        success: false,
        error: 'Zone name is required'
      });
    }

    // Validate pricing structure
    if (!pricing || !pricing.capacity_1_4 || !pricing.capacity_1_6 || !pricing.capacity_1_16) {
      return res.status(400).json({
        success: false,
        error: 'All capacity pricing (1-4, 1-6, 1-16) are required'
      });
    }

    // Ensure pricing values are numbers
    const validatedPricing = {
      capacity_1_4: parseFloat(pricing.capacity_1_4),
      capacity_1_6: parseFloat(pricing.capacity_1_6),
      capacity_1_16: parseFloat(pricing.capacity_1_16),
      currency: 'EUR'
    };

    const transfer = await Transfer.create({
      zoneName,
      description,
      pricing: validatedPricing,
      displayOrder: displayOrder || 0,
      userId: req.admin.id
    });

    res.status(201).json({
      success: true,
      data: transfer,
      message: 'Transfer zone created successfully'
    });
  } catch (error) {
    console.error('❌ Create transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transfer zone',
      message: error.message
    });
  }
};

// @desc    Update transfer zone (admin only)
// @route   PUT /api/admin/transfers/:id
// @access  Admin
const updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      zoneName,
      description,
      pricing,
      displayOrder,
      status
    } = req.body;

    const transfer = await Transfer.findByPk(id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer zone not found'
      });
    }

    // Update fields
    const updateData = {};
    if (zoneName !== undefined) updateData.zoneName = zoneName;
    if (description !== undefined) updateData.description = description;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (status !== undefined) updateData.status = status;

    if (pricing) {
      // Validate and update pricing
      const validatedPricing = {
        capacity_1_4: parseFloat(pricing.capacity_1_4),
        capacity_1_6: parseFloat(pricing.capacity_1_6),
        capacity_1_16: parseFloat(pricing.capacity_1_16),
        currency: 'EUR'
      };
      updateData.pricing = validatedPricing;
    }

    await transfer.update(updateData);

    res.json({
      success: true,
      data: transfer,
      message: 'Transfer zone updated successfully'
    });
  } catch (error) {
    console.error('❌ Update transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transfer zone',
      message: error.message
    });
  }
};

// @desc    Delete transfer zone (admin only)
// @route   DELETE /api/admin/transfers/:id
// @access  Admin
const deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await Transfer.findByPk(id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer zone not found'
      });
    }

    await transfer.destroy();

    res.json({
      success: true,
      message: 'Transfer zone deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete transfer zone',
      message: error.message
    });
  }
};

// @desc    Get all transfers for admin (includes inactive)
// @route   GET /api/admin/transfers
// @access  Admin
const getAdminTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.findAll({
      order: [['displayOrder', 'ASC'], ['zoneName', 'ASC']]
    });

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    console.error('❌ Get admin transfers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transfer zones',
      message: error.message
    });
  }
};

module.exports = {
  getAllTransfers,
  getTransfer,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  getAdminTransfers
};