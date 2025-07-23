const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Import required models
const Car = require("../models/cars");
const Admin = require("../models/Admin");
// const News = require("../models/News"); // News model not available yet

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all available pickup/dropoff locations
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
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
 *                     $ref: '#/components/schemas/Location'
 */
const getLocations = async (req, res) => {
  try {
    const Location = require("../models/Location");

    const locations = await Location.find({ status: true })
      .select("name city type address coordinates")
      .sort({ city: 1, name: 1 })
      .lean();

    // Transform locations for frontend
    const transformedLocations = locations.map((location) => ({
      id: location._id,
      name: location.name,
      city: location.city,
      type: location.type,
      fullAddress:
        location.address?.fullAddress || `${location.name}, ${location.city}`,
      coordinates: location.coordinates,
    }));

    res.status(200).json({ success: true, data: transformedLocations });
  } catch (error) {
    console.error("Error in getLocations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch locations",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars:
 *   get:
 *     summary: Get all cars for admin management
 *     tags: [Admin - Cars]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, Rented, Maintenance]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Cars retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cars:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           basePrice:
 *                             type: object
 *                             properties:
 *                               USD:
 *                                 type: string
 *                               EUR:
 *                                 type: string
 *                               TRY:
 *                                 type: string
 *                           year:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminCars = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    // Build filter object
    let filter = {};

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
      ];
    }

    // Status filter
    if (status) {
      filter.adminStatus = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get cars with full admin details
    const cars = await Car.find(filter)
      .select(
        "title brand model year category fuelType transmission pricing images adminStatus featured whatsappNumber slug seats doors engineCapacity description features"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const totalCars = await Car.countDocuments(filter);
    const totalPages = Math.ceil(totalCars / limitNum);

    // Transform cars for admin interface
    const transformedCars = cars.map((car) => ({
      id: car._id,
      name: car.title,
      type: car.category || "SUV",
      status: car.adminStatus || "Available",
      basePrice: {
        USD: car.pricing?.daily?.toString() || "",
        EUR: car.pricing?.dailyEUR?.toString() || "",
        TRY: car.pricing?.dailyTRY?.toString() || "",
      },
      image: car.images?.main?.url || "/placeholder-car.jpg",
      seats: car.seats || 5,
      transmission: car.transmission || "Automatic",
      fuelType: car.fuelType || "Petrol",
      year: car.year || new Date().getFullYear(),
      engineCapacity: car.engineCapacity || "",
      doors: car.doors || 4,
      description: car.description || "",
      features: car.features?.map((f) => f.name) || [],
      createdAt: car.createdAt || new Date(),
      slug: car.slug,
    }));

    res.status(200).json({
      success: true,
      data: {
        cars: transformedCars,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalCars,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminCars:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cars",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars/{id}:
 *   get:
 *     summary: Get single car for admin editing
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car details retrieved successfully
 *       404:
 *         description: Car not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminCarDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let car;
    if (id === "new") {
      // Return empty car template for new car creation
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          name: "",
          type: "SUV",
          status: "Available",
          basePrice: {
            USD: "",
            EUR: "",
            TRY: "",
          },
          image: "",
          seats: "",
          transmission: "Automatic",
          fuelType: "Petrol",
          year: new Date().getFullYear(),
          engineCapacity: "",
          doors: "",
          description: "",
          features: [],
          whatsappNumber: "",
          brand: "",
          model: "",
          category: "",
          featured: false,
          adminStatus: "Available",
        },
      });
    } else {
      car = await Car.findById(id).lean();
    }

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Transform car for admin form
    const transformedCar = {
      id: car._id,
      name: car.title,
      type: car.category || "SUV",
      status: car.adminStatus || "Available",
      basePrice: {
        USD: car.pricing?.daily?.toString() || "",
        EUR: car.pricing?.dailyEUR?.toString() || "",
        TRY: car.pricing?.dailyTRY?.toString() || "",
      },
      image: car.images?.main?.url || "",
      seats: car.seats || "",
      transmission: car.transmission || "Automatic",
      fuelType: car.fuelType || "Petrol",
      year: car.year || new Date().getFullYear(),
      engineCapacity: car.engineCapacity || "",
      doors: car.doors || "",
      description: car.description || "",
      features: car.features?.map((f) => f.name) || [],
      whatsappNumber: car.whatsappNumber || "",
      brand: car.brand || "",
      model: car.model || "",
      category: car.category || "",
      featured: car.featured || false,
      adminStatus: car.adminStatus || "Available",
    };

    res.status(200).json({ success: true, data: transformedCar });
  } catch (error) {
    console.error("Error in getAdminCarDetails:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch car details",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars:
 *   post:
 *     summary: Create a new car (Admin only)
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - basePrice
 *               - seats
 *               - transmission
 *               - fuelType
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *               basePrice:
 *                 type: object
 *                 properties:
 *                   USD:
 *                     type: string
 *                   EUR:
 *                     type: string
 *                   TRY:
 *                     type: string
 *               image:
 *                 type: string
 *               seats:
 *                 type: number
 *               transmission:
 *                 type: string
 *               fuelType:
 *                 type: string
 *               year:
 *                 type: number
 *               engineCapacity:
 *                 type: string
 *               doors:
 *                 type: number
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               whatsappNumber:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               featured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Car created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 */
const createAdminCar = async (req, res) => {
  try {
    const {
      name,
      type,
      status,
      basePrice,
      image,
      seats,
      transmission,
      fuelType,
      year,
      engineCapacity,
      doors,
      description,
      features,
      whatsappNumber,
      brand,
      model,
      featured,
    } = req.body;

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Convert features array to proper format
    const formattedFeatures = Array.isArray(features)
      ? features.map((feature) => ({
          name: feature,
          available: true,
        }))
      : [];

    // Create new car document
    const newCar = new Car({
      title: name,
      brand: brand || "",
      model: model || "",
      year: year || new Date().getFullYear(),
      category: type || "SUV",
      fuelType: fuelType || "Petrol",
      transmission: transmission || "Automatic",
      seats: parseInt(seats) || 5,
      doors: parseInt(doors) || 4,
      engineCapacity: engineCapacity || "",
      pricing: {
        daily: parseFloat(basePrice?.USD) || 0,
        dailyEUR: parseFloat(basePrice?.EUR) || 0,
        dailyTRY: parseFloat(basePrice?.TRY) || 0,
        weekly: parseFloat(basePrice?.USD) * 6.5 || 0,
        monthly: parseFloat(basePrice?.USD) * 25 || 0,
      },
      images: {
        main: {
          url: image || "/placeholder-car.jpg",
          alt: name,
        },
      },
      description: description || "",
      features: formattedFeatures,
      adminStatus: status || "Available",
      featured: featured || false,
      whatsappNumber: whatsappNumber || "",
      slug: slug,
      availabilityStatus: true,
      location: {
        pickup: "Antalya Airport",
        dropoff: "Antalya Airport",
      },
    });

    const savedCar = await newCar.save();

    res.status(201).json({
      success: true,
      message: "Car created successfully",
      data: {
        id: savedCar._id,
        name: savedCar.title,
        slug: savedCar.slug,
      },
    });
  } catch (error) {
    console.error("Error in createAdminCar:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create car",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars/{id}:
 *   put:
 *     summary: Update a car (Admin only)
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *               basePrice:
 *                 type: object
 *                 properties:
 *                   USD:
 *                     type: string
 *                   EUR:
 *                     type: string
 *                   TRY:
 *                     type: string
 *               image:
 *                 type: string
 *               seats:
 *                 type: number
 *               transmission:
 *                 type: string
 *               fuelType:
 *                 type: string
 *               year:
 *                 type: number
 *               engineCapacity:
 *                 type: string
 *               doors:
 *                 type: number
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               whatsappNumber:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       404:
 *         description: Car not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const updateAdminCar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      status,
      basePrice,
      image,
      seats,
      transmission,
      fuelType,
      year,
      engineCapacity,
      doors,
      description,
      features,
      whatsappNumber,
      brand,
      model,
      featured,
    } = req.body;

    // Find the car
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Update slug if name changed
    let slug = car.slug;
    if (name !== car.title) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    // Convert features array to proper format
    const formattedFeatures = Array.isArray(features)
      ? features.map((feature) => ({
          name: feature,
          available: true,
        }))
      : [];

    // Update car fields
    const updateData = {
      title: name || car.title,
      brand: brand || car.brand,
      model: model || car.model,
      year: year || car.year,
      category: type || car.category,
      fuelType: fuelType || car.fuelType,
      transmission: transmission || car.transmission,
      seats: parseInt(seats) || car.seats,
      doors: parseInt(doors) || car.doors,
      engineCapacity: engineCapacity || car.engineCapacity,
      pricing: {
        daily: parseFloat(basePrice?.USD) || car.pricing?.daily || 0,
        dailyEUR: parseFloat(basePrice?.EUR) || car.pricing?.dailyEUR || 0,
        dailyTRY: parseFloat(basePrice?.TRY) || car.pricing?.dailyTRY || 0,
        weekly:
          parseFloat(basePrice?.USD) * 6.5 || car.pricing?.weekly || 0,
        monthly:
          parseFloat(basePrice?.USD) * 25 || car.pricing?.monthly || 0,
      },
      description: description || car.description,
      features: formattedFeatures,
      adminStatus: status || car.adminStatus,
      featured: featured !== undefined ? featured : car.featured,
      whatsappNumber: whatsappNumber || car.whatsappNumber,
      slug: slug,
    };

    // Update image if provided
    if (image) {
      updateData.images = {
        ...car.images,
        main: {
          url: image,
          alt: name || car.title,
        },
      };
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Car updated successfully",
      data: {
        id: updatedCar._id,
        name: updatedCar.title,
        slug: updatedCar.slug,
      },
    });
  } catch (error) {
    console.error("Error in updateAdminCar:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update car",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars/{id}:
 *   delete:
 *     summary: Delete a car (Admin only)
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       404:
 *         description: Car not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const deleteAdminCar = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCar = await Car.findByIdAndDelete(id);

    if (!deletedCar) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Car deleted successfully",
      data: {
        id: deletedCar._id,
        name: deletedCar.title,
      },
    });
  } catch (error) {
    console.error("Error in deleteAdminCar:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete car",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics for admin panel
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCars:
 *                       type: number
 *                     availableCars:
 *                       type: number
 *                     rentedCars:
 *                       type: number
 *                     carsInMaintenance:
 *                       type: number
 *                     carsOutOfService:
 *                       type: number
 *                     activeBookings:
 *                       type: number
 *                     completedBookings:
 *                       type: number
 *                     pendingBookings:
 *                       type: number
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminDashboardStats = async (req, res) => {
  try {
    // In a real implementation, these would be database queries
    // Mock statistics based on the Admin.jsx dashboard

    const totalCars = await Car.countDocuments({});
    const availableCars = await Car.countDocuments({
      adminStatus: "Available",
    });
    const carsInMaintenance = await Car.countDocuments({
      adminStatus: "Maintenance",
    });

    // Mock booking data (in real implementation, these would be from Booking model)
    const mockBookingStats = {
      activeBookings: 3,
      completedBookings: 12,
      pendingBookings: 5,
      totalBookings: 25,
      monthlyRevenue: 15650,
    };

    // Mock user statistics
    const mockUserStats = {
      totalUsers: 156,
      activeUsers: 142,
      newUsersThisMonth: 23,
    };

    const dashboardStats = {
      // Car statistics
      totalCars: totalCars || 15,
      availableCars: availableCars || 8,
      rentedCars: 4,
      carsInMaintenance: carsInMaintenance || 2,
      carsOutOfService: 1,

      // Booking statistics
      activeBookings: mockBookingStats.activeBookings,
      completedBookings: mockBookingStats.completedBookings,
      pendingBookings: mockBookingStats.pendingBookings,
      totalBookings: mockBookingStats.totalBookings,
      monthlyRevenue: mockBookingStats.monthlyRevenue,

      // User statistics
      totalUsers: mockUserStats.totalUsers,
      activeUsers: mockUserStats.activeUsers,
      newUsersThisMonth: mockUserStats.newUsersThisMonth,

      // Performance metrics
      averageBookingValue: Math.round(
        mockBookingStats.monthlyRevenue / mockBookingStats.completedBookings
      ),
      occupancyRate: Math.round((4 / totalCars) * 100), // rentedCars / totalCars
      customerSatisfaction: 4.7,

      // Growth metrics
      revenueGrowth: 12.5, // percentage
      userGrowth: 8.3, // percentage
      bookingGrowth: 15.2, // percentage
    };

    res.status(200).json({ success: true, data: dashboardStats });
  } catch (error) {
    console.error("Error in getAdminDashboardStats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       customerName:
 *                         type: string
 *                       carName:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date
 *                       endDate:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminRecentBookings = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Mock recent bookings data
    // In a real implementation, this would query the Booking model
    const mockBookings = [
      {
        id: "booking_001",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        carName: "BMW X5",
        carId: "car_001",
        startDate: "2024-01-15",
        endDate: "2024-01-20",
        status: "Active",
        totalAmount: 850,
        currency: "USD",
        pickupLocation: "Antalya Airport",
        dropoffLocation: "Antalya Airport",
        createdAt: "2024-01-10T10:30:00Z",
        bookingNumber: "BK001",
      },
      {
        id: "booking_002",
        customerName: "Sarah Wilson",
        customerEmail: "sarah@example.com",
        carName: "Mercedes C-Class",
        carId: "car_002",
        startDate: "2024-01-12",
        endDate: "2024-01-15",
        status: "Completed",
        totalAmount: 450,
        currency: "USD",
        pickupLocation: "Antalya City Center",
        dropoffLocation: "Antalya Airport",
        createdAt: "2024-01-08T14:15:00Z",
        bookingNumber: "BK002",
      },
      {
        id: "booking_003",
        customerName: "Mike Johnson",
        customerEmail: "mike@example.com",
        carName: "Toyota Camry",
        carId: "car_003",
        startDate: "2024-01-18",
        endDate: "2024-01-22",
        status: "Pending",
        totalAmount: 320,
        currency: "USD",
        pickupLocation: "Antalya Airport",
        dropoffLocation: "Antalya Airport",
        createdAt: "2024-01-12T09:45:00Z",
        bookingNumber: "BK003",
      },
      {
        id: "booking_004",
        customerName: "Emma Brown",
        customerEmail: "emma@example.com",
        carName: "Audi A4",
        carId: "car_004",
        startDate: "2024-01-20",
        endDate: "2024-01-25",
        status: "Active",
        totalAmount: 750,
        currency: "USD",
        pickupLocation: "Antalya Hotel",
        dropoffLocation: "Antalya Airport",
        createdAt: "2024-01-13T16:20:00Z",
        bookingNumber: "BK004",
      },
      {
        id: "booking_005",
        customerName: "David Lee",
        customerEmail: "david@example.com",
        carName: "Volkswagen Golf",
        carId: "car_005",
        startDate: "2024-01-25",
        endDate: "2024-01-28",
        status: "Pending",
        totalAmount: 270,
        currency: "USD",
        pickupLocation: "Antalya Airport",
        dropoffLocation: "Antalya City Center",
        createdAt: "2024-01-14T11:10:00Z",
        bookingNumber: "BK005",
      },
    ];

    // Limit the results
    const limitedBookings = mockBookings.slice(0, parseInt(limit));

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
 *     summary: Get all bookings with pagination and filtering for admin
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
 *         description: Search by customer name, email, or booking number
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

    // Mock bookings data - in real implementation, this would be a database query
    const allMockBookings = [
      {
        id: "booking_001",
        bookingNumber: "BK001",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+1234567890",
        carName: "BMW X5",
        carId: "car_001",
        startDate: "2024-01-15",
        endDate: "2024-01-20",
        status: "Active",
        totalAmount: 850,
        currency: "USD",
        pickupLocation: "Antalya Airport",
        dropoffLocation: "Antalya Airport",
        createdAt: "2024-01-10T10:30:00Z",
        paymentStatus: "Paid",
        specialRequests: "Child seat required",
      },
      {
        id: "booking_002",
        bookingNumber: "BK002",
        customerName: "Sarah Wilson",
        customerEmail: "sarah@example.com",
        customerPhone: "+1234567891",
        carName: "Mercedes C-Class",
        carId: "car_002",
        startDate: "2024-01-12",
        endDate: "2024-01-15",
        status: "Completed",
        totalAmount: 450,
        currency: "USD",
        pickupLocation: "Antalya City Center",
        dropoffLocation: "Antalya Airport",
        createdAt: "2024-01-08T14:15:00Z",
        paymentStatus: "Paid",
        specialRequests: "",
      },
      {
        id: "booking_003",
        bookingNumber: "BK003",
        customerName: "Mike Johnson",
        customerEmail: "mike@example.com",
        customerPhone: "+1234567892",
        carName: "Toyota Camry",
        carId: "car_003",
        startDate: "2024-01-18",
        endDate: "2024-01-22",
        status: "Pending",
        totalAmount: 320,
        currency: "USD",
        pickupLocation: "Antalya Airport",
        dropoffLocation: "Antalya Airport",
        createdAt: "2024-01-12T09:45:00Z",
        paymentStatus: "Pending",
        specialRequests: "",
      },
    ];

    // Apply filters
    let filteredBookings = [...allMockBookings];

    // Status filter
    if (status) {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.status === status
      );
    }

    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredBookings = filteredBookings.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(searchTerm) ||
          booking.customerEmail.toLowerCase().includes(searchTerm) ||
          booking.bookingNumber.toLowerCase().includes(searchTerm) ||
          booking.carName.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
    const totalBookings = filteredBookings.length;
    const totalPages = Math.ceil(totalBookings / limitNum);

    res.status(200).json({
      success: true,
      data: {
        bookings: paginatedBookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalBookings,
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
 *     summary: Update booking status (Admin only)
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
 *               notes:
 *                 type: string
 *                 description: Optional notes for status change
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
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ["Pending", "Active", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // In a real implementation, this would update the booking in the database
    // For now, we'll just return a success response
    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: {
        id,
        status,
        notes: notes || "",
        updatedAt: new Date().toISOString(),
      },
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

/**
 * @swagger
 * /api/admin/news:
 *   get:
 *     summary: Get all news articles for admin management
 *     tags: [Admin - News]
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
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: News articles retrieved successfully
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminNews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    // Build filter object
    let filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [{ title: searchRegex }, { excerpt: searchRegex }];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get news articles
    const news = await News.find(filter)
      .select("title excerpt image tags status featured author createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const totalNews = await News.countDocuments(filter);
    const totalPages = Math.ceil(totalNews / limitNum);

    res.status(200).json({
      success: true,
      data: {
        news,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalNews,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news/{id}:
 *   get:
 *     summary: Get single news article for admin editing
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *       404:
 *         description: News article not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminNewsDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "new") {
      // Return empty news template for new article creation
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          title: "",
          content: "",
          excerpt: "",
          image: "",
          tags: [],
          author: "",
          status: "draft",
          featured: false,
        },
      });
    }

    const news = await News.findById(id).lean();

    if (!news) {
      return res.status(404).json({
        success: false,
        error: "News article not found",
      });
    }

    res.status(200).json({ success: true, data: news });
  } catch (error) {
    console.error("Error in getAdminNewsDetails:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news details",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news:
 *   post:
 *     summary: Create a new news article (Admin only)
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - excerpt
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               image:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               author:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               featured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: News article created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 */
const createAdminNews = async (req, res) => {
  try {
    const { title, content, excerpt, image, tags, author, status, featured } =
      req.body;

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Create new news article
    const newNews = new News({
      title,
      content,
      excerpt,
      image: image || "/placeholder-news.jpg",
      tags: Array.isArray(tags) ? tags : [],
      author: author || "Admin",
      status: status || "draft",
      featured: featured || false,
      slug,
      publishDate: status === "published" ? new Date() : null,
    });

    const savedNews = await newNews.save();

    res.status(201).json({
      success: true,
      message: "News article created successfully",
      data: {
        id: savedNews._id,
        title: savedNews.title,
        slug: savedNews.slug,
      },
    });
  } catch (error) {
    console.error("Error in createAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news/{id}:
 *   put:
 *     summary: Update a news article (Admin only)
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               image:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               author:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: News article updated successfully
 *       404:
 *         description: News article not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const updateAdminNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, image, tags, author, status, featured } =
      req.body;

    // Find the news article
    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        error: "News article not found",
      });
    }

    // Update slug if title changed
    let slug = news.slug;
    if (title !== news.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    // Update news fields
    const updateData = {
      title: title || news.title,
      content: content || news.content,
      excerpt: excerpt || news.excerpt,
      image: image || news.image,
      tags: Array.isArray(tags) ? tags : news.tags,
      author: author || news.author,
      status: status || news.status,
      featured: featured !== undefined ? featured : news.featured,
      slug,
      publishDate:
        status === "published" && news.status !== "published"
          ? new Date()
          : news.publishDate,
    };

    const updatedNews = await News.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "News article updated successfully",
      data: {
        id: updatedNews._id,
        title: updatedNews.title,
        slug: updatedNews.slug,
      },
    });
  } catch (error) {
    console.error("Error in updateAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news/{id}:
 *   delete:
 *     summary: Delete a news article (Admin only)
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: News article ID
 *     responses:
 *       200:
 *         description: News article deleted successfully
 *       404:
 *         description: News article not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const deleteAdminNews = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNews = await News.findByIdAndDelete(id);

    if (!deletedNews) {
      return res.status(404).json({
        success: false,
        error: "News article not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "News article deleted successfully",
      data: {
        id: deletedNews._id,
        title: deletedNews.title,
      },
    });
  } catch (error) {
    console.error("Error in deleteAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     token:
 *                       type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error("Error in adminLogin:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/create:
 *   post:
 *     summary: Create a new admin account (Super admin only)
 *     tags: [Admin - Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [admin, super_admin]
 *                 default: admin
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Validation error or admin already exists
 */
const createAdmin = async (req, res) => {
  try {
    // Check for validation errors first
    const { name, email, password, role = "admin" } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: "Admin with this email already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date(),
    });

    const savedAdmin = await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role,
      },
    });
  } catch (error) {
    console.error("Error in createAdmin:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create admin",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/database/stats:
 *   get:
 *     summary: Get database statistics and collections info
 *     tags: [Admin Database]
 *     responses:
 *       200:
 *         description: Database statistics retrieved successfully
 */
const getDbStats = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();

    const stats = {
      databaseName: db.databaseName,
      collections: [],
      totalDocuments: 0,
    };

    // Get document count for each collection
    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        stats.collections.push({
          name: collection.name,
          documentCount: count,
        });
        stats.totalDocuments += count;
      } catch (error) {
        stats.collections.push({
          name: collection.name,
          documentCount: 0,
          error: error.message,
        });
      }
    }

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Error in getDbStats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get database stats",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/database/cars:
 *   get:
 *     summary: Get all cars from database with full details
 *     tags: [Admin Database]
 *     responses:
 *       200:
 *         description: All cars retrieved successfully
 */
const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: cars.length, data: cars });
  } catch (error) {
    console.error("Error in getAllCars:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cars",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/database/collections/{collectionName}:
 *   get:
 *     summary: Get all documents from a specific collection
 *     tags: [Admin Database]
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection data retrieved successfully
 */
const getAllCollections = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const db = mongoose.connection.db;

    // Get all documents from the specified collection
    const documents = await db
      .collection(collectionName)
      .find({})
      .limit(100) // Limit to avoid overwhelming response
      .toArray();

    res.status(200).json({
      success: true,
      collectionName,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Error in getAllCollections:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get collection data",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

module.exports = {
  // Location APIs
  getLocations,
  
  // Admin car management
  getAdminCars,
  getAdminCarDetails,
  createAdminCar,
  updateAdminCar,
  deleteAdminCar,
  
  // Admin dashboard APIs
  getAdminDashboardStats,
  getAdminRecentBookings,
  getAdminBookings,
  updateBookingStatus,
  
  // Admin news management APIs
  getAdminNews,
  getAdminNewsDetails,
  createAdminNews,
  updateAdminNews,
  deleteAdminNews,
  
  // Admin auth APIs
  adminLogin,
  createAdmin,
  
  // Database monitoring APIs
  getDbStats,
  getAllCars,
  getAllCollections,
};