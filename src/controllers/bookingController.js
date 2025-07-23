// src/controllers/bookingController.js - Booking-related API endpoints
const Car = require("../models/cars");
const { validationResult } = require("express-validator");

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking/reservation
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - carId
 *               - pickupLocation
 *               - dropoffLocation
 *               - pickupDate
 *               - pickupTime
 *               - returnDate
 *               - returnTime
 *             properties:
 *               carId:
 *                 type: string
 *                 description: Car ID
 *               pickupLocation:
 *                 type: string
 *                 description: Pickup location
 *               dropoffLocation:
 *                 type: string
 *                 description: Dropoff location
 *               pickupDate:
 *                 type: string
 *                 format: date
 *                 description: Pickup date
 *               pickupTime:
 *                 type: string
 *                 description: Pickup time (HH:MM format)
 *               returnDate:
 *                 type: string
 *                 format: date
 *                 description: Return date
 *               returnTime:
 *                 type: string
 *                 description: Return time (HH:MM format)
 *               customerInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     duration:
 *                       type: object
 *                       properties:
 *                         days:
 *                           type: number
 *                         hours:
 *                           type: number
 *       400:
 *         description: Invalid booking data
 *       404:
 *         description: Car not found
 */
const createBooking = async (req, res) => {
  try {
    const {
      carId,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      customerInfo,
    } = req.body;

    // Validate car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Calculate duration and total amount
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}`);

    if (returnDateTime <= pickupDateTime) {
      return res.status(400).json({
        success: false,
        error: "Return date must be after pickup date",
      });
    }

    const diffTime = Math.abs(returnDateTime - pickupDateTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    // Calculate total amount (simplified)
    let totalAmount = car.pricing.daily * diffDays;

    // Apply weekly/monthly discounts if applicable
    if (diffDays >= 30) {
      totalAmount = car.pricing.monthly || car.pricing.daily * 25;
    } else if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      totalAmount =
        weeks * (car.pricing.weekly || car.pricing.daily * 6) +
        remainingDays * car.pricing.daily;
    }

    // Create booking object (simplified - you might want to save to DB)
    const booking = {
      bookingId: `BK${Date.now()}`,
      carId: car._id,
      carDetails: {
        title: car.title,
        brand: car.brand,
        model: car.model,
        year: car.year,
      },
      pickupLocation,
      dropoffLocation,
      pickupDateTime,
      returnDateTime,
      duration: {
        days: diffDays,
        hours: diffHours,
      },
      totalAmount,
      currency: car.currency || "USD",
      status: "pending",
      customerInfo: customerInfo || {},
      createdAt: new Date(),
    };

    // In a real implementation, you would save this to a Booking model
    // For now, we'll just return the booking details

    res.status(201).json({
      success: true,
      data: booking,
      message: "Booking request created successfully",
    });
  } catch (error) {
    console.error("Error in createBooking:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create booking",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/dashboard/recent-bookings:
 *   get:
 *     summary: Get recent bookings for admin dashboard
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recent bookings to return
 *     responses:
 *       200:
 *         description: Recent bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       customerName:
 *                         type: string
 *                       customerEmail:
 *                         type: string
 *                       carName:
 *                         type: string
 *                       status:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       startDate:
 *                         type: string
 *                       endDate:
 *                         type: string
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminRecentBookings = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Mock recent bookings data matching Admin.jsx structure
    const recentBookings = [
      {
        id: "BK001",
        customerName: "John Smith",
        customerEmail: "john@example.com",
        customerPhone: "+1 234 567 8900",
        carName: "BMW M2 2020",
        carId: 1,
        startDate: "2025-07-25",
        endDate: "2025-07-30",
        status: "Active",
        totalAmount: 1325,
        pickupLocation: "Downtown Office",
        dropoffLocation: "Airport",
        createdAt: new Date("2025-07-20"),
      },
      {
        id: "BK002",
        customerName: "Sarah Johnson",
        customerEmail: "sarah@example.com",
        customerPhone: "+1 234 567 8901",
        carName: "Ferrari Enzo",
        carId: 2,
        startDate: "2025-07-22",
        endDate: "2025-07-24",
        status: "Completed",
        totalAmount: 3350,
        pickupLocation: "City Center",
        dropoffLocation: "City Center",
        createdAt: new Date("2025-07-18"),
      },
      {
        id: "BK003",
        customerName: "Mike Davis",
        customerEmail: "mike@example.com",
        customerPhone: "+1 234 567 8902",
        carName: "Ford Raptor",
        carId: 3,
        startDate: "2025-07-28",
        endDate: "2025-08-02",
        status: "Pending",
        totalAmount: 1735,
        pickupLocation: "Hotel District",
        dropoffLocation: "Airport",
        createdAt: new Date("2025-07-19"),
      },
      {
        id: "BK004",
        customerName: "Emily Wilson",
        customerEmail: "emily@example.com",
        customerPhone: "+1 234 567 8903",
        carName: "Range Rover Sport",
        carId: 4,
        startDate: "2025-07-26",
        endDate: "2025-07-29",
        status: "Active",
        totalAmount: 1368,
        pickupLocation: "Airport",
        dropoffLocation: "Downtown Office",
        createdAt: new Date("2025-07-17"),
      },
      {
        id: "BK005",
        customerName: "Robert Brown",
        customerEmail: "robert@example.com",
        customerPhone: "+1 234 567 8904",
        carName: "Tesla Model S",
        carId: 5,
        startDate: "2025-07-24",
        endDate: "2025-07-26",
        status: "Completed",
        totalAmount: 896,
        pickupLocation: "City Center",
        dropoffLocation: "City Center",
        createdAt: new Date("2025-07-16"),
      },
    ];

    // Sort by creation date and limit results
    const limitedBookings = recentBookings
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, parseInt(limit));

    res.status(200).json({ success: true, data: limitedBookings });
  } catch (error) {
    console.error("Error in getAdminRecentBookings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent bookings",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings for admin management
 *     tags: [Admin - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Active, Completed, Cancelled]
 *         description: Filter by booking status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in customer name or car name
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    // Mock bookings data
    let allBookings = [
      {
        id: 1,
        customerName: "John Smith",
        customerEmail: "john@example.com",
        customerPhone: "+1 234 567 8900",
        carName: "BMW M2 2020",
        carId: 1,
        startDate: "2025-07-25",
        endDate: "2025-07-30",
        status: "Active",
        totalAmount: 1325,
        pickupLocation: "Downtown Office",
        dropoffLocation: "Airport",
      },
      {
        id: 2,
        customerName: "Sarah Johnson",
        customerEmail: "sarah@example.com",
        customerPhone: "+1 234 567 8901",
        carName: "Ferrari Enzo",
        carId: 2,
        startDate: "2025-07-22",
        endDate: "2025-07-24",
        status: "Completed",
        totalAmount: 3350,
        pickupLocation: "City Center",
        dropoffLocation: "City Center",
      },
      {
        id: 3,
        customerName: "Mike Davis",
        customerEmail: "mike@example.com",
        customerPhone: "+1 234 567 8902",
        carName: "Ford Raptor",
        carId: 3,
        startDate: "2025-07-28",
        endDate: "2025-08-02",
        status: "Pending",
        totalAmount: 1735,
        pickupLocation: "Hotel District",
        dropoffLocation: "Airport",
      },
      {
        id: 4,
        customerName: "Emily Wilson",
        customerEmail: "emily@example.com",
        customerPhone: "+1 234 567 8903",
        carName: "Range Rover Sport",
        carId: 4,
        startDate: "2025-07-26",
        endDate: "2025-07-29",
        status: "Active",
        totalAmount: 1368,
        pickupLocation: "Airport",
        dropoffLocation: "Downtown Office",
      },
      {
        id: 5,
        customerName: "Robert Brown",
        customerEmail: "robert@example.com",
        customerPhone: "+1 234 567 8904",
        carName: "Tesla Model S",
        carId: 5,
        startDate: "2025-07-24",
        endDate: "2025-07-26",
        status: "Completed",
        totalAmount: 896,
        pickupLocation: "City Center",
        dropoffLocation: "City Center",
      },
    ];

    // Apply filters
    if (status) {
      allBookings = allBookings.filter((booking) => booking.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allBookings = allBookings.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(searchLower) ||
          booking.carName.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBookings = allBookings.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allBookings.length / limitNum);

    res.status(200).json({
      success: true,
      data: {
        bookings: paginatedBookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalBookings: allBookings.length,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminBookings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bookings",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/bookings/{id}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Admin - Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Active, Completed, Cancelled]
 *                 description: New booking status
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Pending", "Active", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid booking status",
      });
    }

    // In a real implementation, update booking in database
    // const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });

    // Mock response
    res.status(200).json({
      success: true,
      data: {
        bookingId: id,
        newStatus: status,
        updatedAt: new Date(),
      },
      message: "Booking status updated successfully",
    });
  } catch (error) {
    console.error("Error in updateBookingStatus:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update booking status",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

module.exports = {
  createBooking,
  getAdminRecentBookings,
  getAdminBookings,
  updateBookingStatus,
};