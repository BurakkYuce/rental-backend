// src/controllers/bookingController.js - Booking management for admin panel
const { validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Car = require("../models/cars");
const { Transfer } = require("../models");

/**
 * Get all bookings with filters (Admin only)
 */
const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "all",
      carId,
      dateFrom,
      dateTo,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
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
      sortOrder,
    };

    const result = await Booking.getBookingsWithFilters(filters);

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error getting bookings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve bookings",
    });
  }
};

/**
 * Get booking by ID (Admin only)
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Error getting booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve booking",
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
        details: errors.array(),
      });
    }

    const {
      serviceType = 'car_rental',
      carId,
      transferId,
      transferData,
      drivers,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      dropoffTime,
      specialRequests,
      adminNotes,
      additionalServices = [],
      pricing
    } = req.body;

    // Validate service type
    if (!['car_rental', 'transfer'].includes(serviceType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid service type. Must be 'car_rental' or 'transfer'",
      });
    }

    // Validate based on service type
    if (serviceType === 'car_rental' && !carId) {
      return res.status(400).json({
        success: false,
        error: "Car ID is required for car rental bookings",
      });
    }

    if (serviceType === 'transfer' && !transferId) {
      // Transfer bookings can work without transferId for custom locations
      console.log('Transfer booking without specific zone');
    }

    // Verify car exists if car rental
    let car = null;
    if (serviceType === 'car_rental') {
      car = await Car.findByPk(carId);
      if (!car) {
        return res.status(404).json({
          success: false,
          error: "Selected car not found",
        });
      }
    }

    // Verify transfer zone exists if transfer
    let transfer = null;
    if (serviceType === 'transfer' && transferId) {
      transfer = await Transfer.findByPk(transferId);
      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: "Selected transfer zone not found",
        });
      }
    }

    // Validate dates
    const pickup = new Date(pickupTime);
    const dropoff = new Date(dropoffTime);

    if (dropoff <= pickup) {
      return res.status(400).json({
        success: false,
        error: "Drop-off time must be after pickup time",
      });
    }

    // Calculate pricing based on service type
    let calculatedPricing = {};
    
    if (serviceType === 'car_rental') {
      // Calculate duration and pricing for car rental
      const diffTime = Math.abs(dropoff - pickup);
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dailyRate = car.pricing?.daily || car.currentPrice?.daily || car.dailyRate || 0;
      
      calculatedPricing = {
        dailyRate,
        totalDays,
        subtotal: dailyRate * totalDays,
        currency: car.pricing?.currency || 'EUR',
        total: dailyRate * totalDays
      };
    } else {
      // Use provided pricing for transfer
      calculatedPricing = pricing || {
        total: 0,
        currency: 'EUR'
      };
    }

    // Create booking
    const bookingData = {
      serviceType,
      carId: serviceType === 'car_rental' ? carId : null,
      transferId: serviceType === 'transfer' ? transferId : null,
      transferData: serviceType === 'transfer' ? transferData : null,
      drivers,
      pickupLocation: pickupLocation.trim(),
      dropoffLocation: dropoffLocation.trim(),
      pickupTime: pickup,
      dropoffTime: dropoff,
      pricing: calculatedPricing,
      additionalServices,
      specialRequests: specialRequests?.trim(),
      adminNotes: adminNotes?.trim(),
      createdBy: req.admin?.id || null,
      status: "pending",
    };

    const booking = await Booking.create(bookingData);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking: booking },
    });
  } catch (error) {
    console.error("Error creating booking:", error);

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create booking",
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
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Check if booking can be modified
    if (!booking.canBeModified()) {
      return res.status(400).json({
        success: false,
        error:
          "Booking cannot be modified. Only pending or confirmed bookings that haven't started can be modified.",
      });
    }

    // If car is being changed, validate new car
    if (updateData.carId && updateData.carId !== booking.car.toString()) {
      const newCar = await Car.findByPk(updateData.carId);
      if (!newCar) {
        return res.status(404).json({
          success: false,
          error: "Selected car not found",
        });
      }

      // Update pricing for new car
      const dailyRate =
        newCar.pricing?.daily ||
        newCar.currentPrice?.daily ||
        newCar.dailyRate ||
        0;
      updateData.carId = updateData.carId;

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
          currency: newCar.currency || "EUR",
        };
      }
    }

    // Set last modified by
    updateData.lastModifiedBy = req.admin.id || req.admin._id;

    await booking.update(updateData);

    const updatedBooking = await Booking.findByPk(id);

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: { booking: updatedBooking },
    });
  } catch (error) {
    console.error("Error updating booking:", error);

    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update booking",
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

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["active", "cancelled"],
      active: ["completed", "cancelled"],
      completed: [], // Final state
      cancelled: [], // Final state
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${booking.status} to ${status}`,
      });
    }

    const updateData = {
      status: status,
      lastModifiedBy: req.admin.id || req.admin._id
    };

    if (notes) {
      updateData.adminNotes = booking.adminNotes
        ? `${booking.adminNotes}\n\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`;
    }

    await booking.update(updateData);

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: { booking },
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update booking status",
    });
  }
};

/**
 * Delete booking (Admin only)
 */
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Admin can delete any booking, but warn for active/completed bookings
    if (["active", "completed"].includes(booking.status)) {
      console.warn(`Admin deleting ${booking.status} booking ${booking.id}`);
    }

    await booking.destroy();

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete booking",
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
    ] = await Promise.all([
      Booking.count(),
      Booking.count({ where: { status: "pending" } }),
      Booking.count({ where: { status: "confirmed" } }),
      Booking.count({ where: { status: "active" } }),
      Booking.count({ where: { status: "completed" } }),
      Booking.count({ where: { status: "cancelled" } }),
    ]);

    // Calculate revenue from completed bookings
    const completedBookingsWithRevenue = await Booking.findAll({
      where: { status: 'completed' },
      attributes: ['pricing']
    });
    
    const totalRevenue = completedBookingsWithRevenue.reduce((sum, booking) => {
      return sum + (booking.pricing?.totalAmount || 0);
    }, 0);

    const statistics = {
      totalBookings,
      statusCounts: {
        pending: pendingBookings,
        confirmed: confirmedBookings,
        active: activeBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      totalRevenue: totalRevenue,
    };

    res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error getting booking statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve statistics",
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
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    res.status(200).json({
      success: true,
      data: result.bookings,
    });
  } catch (error) {
    console.error("Error getting recent bookings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve recent bookings",
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
  getAdminRecentBookings,
};
