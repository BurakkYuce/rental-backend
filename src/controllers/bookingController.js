// src/controllers/bookingController.js - Booking management for admin panel
const { validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Car = require("../models/cars");

/**
 * Get all bookings with filters (Admin only)
 */
const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      carId,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      carId,
      dateFrom,
      dateTo,
      search,
      sortBy,
      sortOrder
    };

    const result = await Booking.getBookingsWithFilters(filters);

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: result
    });
  } catch (error) {
    console.error("Error getting bookings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve bookings"
    });
  }
};

/**
 * Get booking by ID (Admin only)
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('car', 'brand model year type dailyRate images currentPrice pricing')
      .populate('createdBy', 'username email')
      .populate('lastModifiedBy', 'username email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: { booking }
    });
  } catch (error) {
    console.error("Error getting booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve booking"
    });
  }
};

/**
 * Create new booking (Admin only)
 */
const createBooking = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array()
      });
    }

    const {
      carId,
      drivers,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      dropoffTime,
      specialRequests,
      adminNotes,
      additionalServices = []
    } = req.body;

    // Verify car exists and get pricing
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Selected car not found"
      });
    }

    // Validate dates
    const pickup = new Date(pickupTime);
    const dropoff = new Date(dropoffTime);
    const now = new Date();

    if (pickup <= now) {
      return res.status(400).json({
        success: false,
        error: "Pickup time must be in the future"
      });
    }

    if (dropoff <= pickup) {
      return res.status(400).json({
        success: false,
        error: "Drop-off time must be after pickup time"
      });
    }

    // Calculate duration and pricing
    const diffTime = Math.abs(dropoff - pickup);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dailyRate = car.pricing?.daily || car.currentPrice?.daily || car.dailyRate || 0;

    // Create booking
    const bookingData = {
      car: carId,
      drivers,
      pickupLocation: pickupLocation.trim(),
      dropoffLocation: dropoffLocation.trim(),
      pickupTime: pickup,
      dropoffTime: dropoff,
      pricing: {
        dailyRate,
        totalDays,
        subtotal: dailyRate * totalDays,
        taxes: 0, // Can be calculated based on business rules
        totalAmount: dailyRate * totalDays,
        currency: car.currency || 'EUR'
      },
      additionalServices,
      specialRequests: specialRequests?.trim(),
      adminNotes: adminNotes?.trim(),
      createdBy: req.admin.id || req.admin._id,
      status: 'pending'
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Populate the created booking
    await booking.populate([
      { path: 'car', select: 'brand model year type dailyRate images' },
      { path: 'createdBy', select: 'username email' }
    ]);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking }
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create booking"
    });
  }
};

/**
 * Update booking (Admin only)
 */
const updateBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    // Check if booking can be modified
    if (!booking.canBeModified()) {
      return res.status(400).json({
        success: false,
        error: "Booking cannot be modified. Only pending or confirmed bookings that haven't started can be modified."
      });
    }

    // If car is being changed, validate new car
    if (updateData.carId && updateData.carId !== booking.car.toString()) {
      const newCar = await Car.findById(updateData.carId);
      if (!newCar) {
        return res.status(404).json({
          success: false,
          error: "Selected car not found"
        });
      }
      
      // Update pricing for new car
      const dailyRate = newCar.pricing?.daily || newCar.currentPrice?.daily || newCar.dailyRate || 0;
      updateData.car = updateData.carId;
      
      if (updateData.pickupTime && updateData.dropoffTime) {
        const pickup = new Date(updateData.pickupTime);
        const dropoff = new Date(updateData.dropoffTime);
        const diffTime = Math.abs(dropoff - pickup);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        updateData.pricing = {
          dailyRate,
          totalDays,
          subtotal: dailyRate * totalDays,
          taxes: booking.pricing.taxes || 0,
          totalAmount: dailyRate * totalDays + (booking.pricing.taxes || 0),
          currency: newCar.currency || 'EUR'
        };
      }
    }

    // Set last modified by
    updateData.lastModifiedBy = req.admin.id || req.admin._id;

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'car', select: 'brand model year type dailyRate images' },
      { path: 'createdBy', select: 'username email' },
      { path: 'lastModifiedBy', select: 'username email' }
    ]);

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: { booking: updatedBooking }
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update booking"
    });
  }
};

/**
 * Update booking status (Admin only)
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
      completed: [], // Final state
      cancelled: [] // Final state
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    booking.status = status;
    booking.lastModifiedBy = req.admin.id || req.admin._id;
    
    if (notes) {
      booking.adminNotes = booking.adminNotes ? 
        `${booking.adminNotes}\n\n[${new Date().toISOString()}] ${notes}` : 
        `[${new Date().toISOString()}] ${notes}`;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: { booking }
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update booking status"
    });
  }
};

/**
 * Delete booking (Admin only)
 */
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    // Only allow deletion of pending or cancelled bookings
    if (!['pending', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: "Only pending or cancelled bookings can be deleted"
      });
    }

    await Booking.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete booking"
    });
  }
};

/**
 * Get booking statistics (Admin only)
 */
const getBookingStatistics = async (req, res) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'active' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { status: { $in: ['completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ])
    ]);

    const statistics = {
      totalBookings,
      statusCounts: {
        pending: pendingBookings,
        confirmed: confirmedBookings,
        active: activeBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      },
      totalRevenue: totalRevenue[0]?.total || 0
    };

    res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: statistics
    });
  } catch (error) {
    console.error("Error getting booking statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve statistics"
    });
  }
};

// Legacy functions for backward compatibility
const getAdminBookings = getAllBookings;
const getAdminRecentBookings = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const result = await Booking.getBookingsWithFilters({
      page: 1,
      limit: parseInt(limit),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    res.status(200).json({
      success: true,
      data: result.bookings
    });
  } catch (error) {
    console.error("Error getting recent bookings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve recent bookings"
    });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  getBookingStatistics,
  // Legacy exports
  getAdminBookings,
  getAdminRecentBookings
};