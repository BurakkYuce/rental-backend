// src/controllers/carController.js - Araç Controller'ı
const Car = require("../models/cars");
const Location = require("../models/Location");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// @desc    Get all cars with filters
// @route   GET /api/cars
// @access  Public
exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.searchCars(req.query);

    // Get total count for pagination
    const totalQuery = { ...req.query };
    delete totalQuery.page;
    delete totalQuery.limit;
    const totalCars = await Car.countDocuments();

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const totalPages = Math.ceil(totalCars / limit);

    res.json({
      success: true,
      data: cars,
      pagination: {
        page,
        limit,
        totalPages,
        totalCars,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get popular cars (most viewed)
// @route   GET /api/cars/popular
// @access  Public
exports.getPopularCars = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 6;

    const cars = await Car.find({ status: true })
      .populate("availableLocations", "name city")
      .sort({ "stats.viewCount": -1, featured: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Generate WhatsApp link for car
// @route   GET /api/cars/:id/whatsapp
// @access  Public
exports.generateWhatsAppLink = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    const { pickupDate, returnDate, location, message } = req.query;

    let customMessage = message || car.whatsappMessage;

    if (pickupDate && returnDate) {
      customMessage += `\n\nRental Details:\n- Pickup: ${pickupDate}\n- Return: ${returnDate}`;
      if (location) {
        customMessage += `\n- Location: ${location}`;
      }
    }

    const encodedMessage = encodeURIComponent(customMessage);
    const cleanNumber = car.whatsappNumber.replace(/[^0-9]/g, "");
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    res.json({
      success: true,
      data: {
        whatsappUrl,
        phone: car.whatsappNumber,
        message: customMessage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Export cars data
// @route   GET /api/cars/export
// @access  Private/Admin
exports.exportCars = async (req, res) => {
  try {
    const { format = "json" } = req.query;

    const cars = await Car.find().populate("availableLocations", "name city");

    if (format === "csv") {
      // CSV export
      const csvFields = [
        "title",
        "brand",
        "model",
        "year",
        "category",
        "fuelType",
        "transmission",
        "pricing.daily",
        "status",
        "featured",
      ];

      let csvContent = csvFields.join(",") + "\n";

      cars.forEach((car) => {
        const row = csvFields.map((field) => {
          const value = field.includes(".")
            ? field.split(".").reduce((obj, key) => obj[key], car)
            : car[field];
          return `"${value || ""}"`;
        });
        csvContent += row.join(",") + "\n";
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=cars.csv");
      res.send(csvContent);
    } else {
      // JSON export
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=cars.json");
      res.json({
        success: true,
        data: cars,
        exportedAt: new Date().toISOString(),
        totalRecords: cars.length,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create new car (Admin only)
// @route   POST /api/cars
// @access  Private/Admin
exports.createCar = async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();

    res.status(201).json({
      success: true,
      data: car,
      message: "Car created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update car (Admin only)
// @route   PUT /api/cars/:id
// @access  Private/Admin
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    res.json({
      success: true,
      data: car,
      message: "Car updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete car (Admin only)
// @route   DELETE /api/cars/:id
// @access  Private/Admin
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Delete images from Cloudinary
    if (car.images.main && car.images.main.publicId) {
      await deleteImage(car.images.main.publicId);
    }

    if (car.images.gallery && car.images.gallery.length > 0) {
      for (const image of car.images.gallery) {
        if (image.publicId) {
          await deleteImage(image.publicId);
        }
      }
    }

    await car.deleteOne();

    res.json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Upload car images
// @route   POST /api/cars/:id/images
// @access  Private/Admin
exports.uploadCarImages = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    const { imageType } = req.body; // 'main' or 'gallery'

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(
      req.file.path,
      `rentaly/cars/${car._id}`
    );

    const imageData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      filename: req.file.filename,
    };

    if (imageType === "main") {
      // Delete old main image if exists
      if (car.images.main && car.images.main.publicId) {
        await deleteImage(car.images.main.publicId);
      }
      car.images.main = imageData;
    } else {
      // Add to gallery
      car.images.gallery.push({
        ...imageData,
        order: car.images.gallery.length,
      });
    }

    await car.save();

    res.json({
      success: true,
      data: imageData,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete car image
// @route   DELETE /api/cars/:id/images/:imageId
// @access  Private/Admin
exports.deleteCarImage = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    const { imageId } = req.params;
    const { imageType } = req.query; // 'main' or 'gallery'

    if (imageType === "main") {
      if (car.images.main && car.images.main.publicId) {
        await deleteImage(car.images.main.publicId);
        car.images.main = undefined;
      }
    } else {
      const imageIndex = car.images.gallery.findIndex(
        (img) => img._id.toString() === imageId || img.publicId === imageId
      );

      if (imageIndex > -1) {
        const image = car.images.gallery[imageIndex];
        if (image.publicId) {
          await deleteImage(image.publicId);
        }
        car.images.gallery.splice(imageIndex, 1);
      }
    }

    await car.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update car status
// @route   PATCH /api/cars/:id/status
// @access  Private/Admin
exports.updateCarStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    res.json({
      success: true,
      data: car,
      message: `Car ${status ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update car order
// @route   PATCH /api/cars/:id/order
// @access  Private/Admin
exports.updateCarOrder = async (req, res) => {
  try {
    const { order } = req.body;

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { order },
      { new: true }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    res.json({
      success: true,
      data: car,
      message: "Car order updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Bulk update cars
// @route   PATCH /api/cars/bulk
// @access  Private/Admin
exports.bulkUpdateCars = async (req, res) => {
  try {
    const { carIds, updates } = req.body;

    if (!carIds || !Array.isArray(carIds) || carIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Car IDs are required",
      });
    }

    const result = await Car.updateMany({ _id: { $in: carIds } }, updates, {
      runValidators: true,
    });

    res.json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} cars updated successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get car statistics
// @route   GET /api/cars/stats
// @access  Private/Admin
exports.getCarStatistics = async (req, res) => {
  try {
    const stats = await Car.aggregate([
      {
        $group: {
          _id: null,
          totalCars: { $sum: 1 },
          activeCars: {
            $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] },
          },
          featuredCars: {
            $sum: { $cond: [{ $eq: ["$featured", true] }, 1, 0] },
          },
          avgPrice: { $avg: "$pricing.daily" },
          totalViews: { $sum: "$stats.viewCount" },
        },
      },
    ]);

    const categoryStats = await Car.aggregate([
      { $match: { status: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$pricing.daily" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const brandStats = await Car.aggregate([
      { $match: { status: true } },
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        categories: categoryStats,
        topBrands: brandStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get similar cars
// @route   GET /api/cars/:id/similar
// @access  Public
exports.getSimilarCars = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    const limit = Number(req.query.limit) || 4;

    // Find similar cars based on category, price range, or brand
    const priceRange = car.pricing.daily * 0.3; // 30% price variance

    const similarCars = await Car.find({
      _id: { $ne: car._id },
      status: true,
      $or: [
        { category: car.category },
        { brand: car.brand },
        {
          "pricing.daily": {
            $gte: car.pricing.daily - priceRange,
            $lte: car.pricing.daily + priceRange,
          },
        },
      ],
    })
      .populate("availableLocations", "name city")
      .sort({ featured: -1, "stats.rating.average": -1 })
      .limit(limit);

    res.json({
      success: true,
      data: similarCars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get featured cars
// @route   GET /api/cars/featured
// @access  Public
exports.getFeaturedCars = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 6;

    const cars = await Car.find({
      status: true,
      featured: true,
    })
      .populate("availableLocations", "name city")
      .sort({ order: 1, createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
      status: true,
    }).populate("availableLocations", "name city address contact");

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Increment view count
    await car.incrementViewCount();

    res.json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Search cars with availability
// @route   POST /api/cars/search
// @access  Public
exports.searchCars = async (req, res) => {
  try {
    const { pickupDate, returnDate, location } = req.body;

    let query = { ...req.query };

    // Add location filter if provided
    if (location) {
      query.location = location;
    }

    const cars = await Car.searchCars(query);

    // Filter by availability if dates provided
    let availableCars = cars;
    if (pickupDate && returnDate) {
      // Here you would check against booking/reservation system
      // For now, return all cars
      availableCars = cars;
    }

    res.json({
      success: true,
      data: availableCars,
      searchParams: {
        pickupDate,
        returnDate,
        location,
        ...query,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get cars by category
// @route   GET /api/cars/category/:category
// @access  Public
exports.getCarsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const limit = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const cars = await Car.find({
      category: category,
      status: true,
    })
      .populate("availableLocations", "name city")
      .sort({ featured: -1, order: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Car.countDocuments({
      category: category,
      status: true,
    });

    res.json({
      success: true,
      data: cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get available filters
// @route   GET /api/cars/filters
// @access  Public
exports.getFilters = async (req, res) => {
  try {
    const filters = await Car.getFilters();

    res.json({
      success: true,
      data: filters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== ADDITIONAL CAR FUNCTIONS FROM allApis.js =====

/**
 * @swagger
 * /api/cars/filtered:
 *   get:
 *     summary: Get filtered cars with pagination (from allApis.js)
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Vehicle types to filter by
 *       - in: query
 *         name: carBodyType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Car body types to filter by
 *       - in: query
 *         name: carSeats
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Number of seats to filter by
 *       - in: query
 *         name: engineCapacity
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Engine capacity ranges to filter by
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
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
 *           default: 12
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Filtered cars retrieved successfully
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
 *                     cars:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Car'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
const getFilteredCars = async (req, res) => {
  try {
    const {
      vehicleType,
      carBodyType,
      carSeats,
      engineCapacity,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object
    let filter = { status: true }; // Only active cars

    // Vehicle type filter (map to category)
    if (vehicleType && vehicleType.length > 0) {
      const vehicleTypes = Array.isArray(vehicleType)
        ? vehicleType
        : [vehicleType];
      const categoryMap = {
        Car: ["Ekonomik", "Orta Sınıf", "Üst Sınıf"],
        Van: ["Geniş"],
        Minibus: ["Geniş"],
        Prestige: ["Lüks"],
      };

      const mappedCategories = vehicleTypes.flatMap(
        (type) => categoryMap[type] || []
      );
      if (mappedCategories.length > 0) {
        filter.category = { $in: mappedCategories };
      }
    }

    // Car body type filter
    if (carBodyType && carBodyType.length > 0) {
      const bodyTypes = Array.isArray(carBodyType)
        ? carBodyType
        : [carBodyType];
      filter.bodyType = { $in: bodyTypes };
    }

    // Car seats filter
    if (carSeats && carSeats.length > 0) {
      const seatRanges = Array.isArray(carSeats) ? carSeats : [carSeats];
      const seatFilters = [];

      seatRanges.forEach((range) => {
        switch (range) {
          case "2 seats":
            seatFilters.push({ seats: 2 });
            break;
          case "4 seats":
            seatFilters.push({ seats: 4 });
            break;
          case "6 seats":
            seatFilters.push({ seats: 6 });
            break;
          case "6+ seats":
            seatFilters.push({ seats: { $gte: 6 } });
            break;
        }
      });

      if (seatFilters.length > 0) {
        filter.$or = seatFilters;
      }
    }

    // Engine capacity filter
    if (engineCapacity && engineCapacity.length > 0) {
      const capacities = Array.isArray(engineCapacity)
        ? engineCapacity
        : [engineCapacity];
      const capacityFilters = [];

      capacities.forEach((capacity) => {
        switch (capacity) {
          case "1000 - 2000":
            capacityFilters.push({
              engineCapacity: { $gte: 1000, $lte: 2000 },
            });
            break;
          case "2000 - 4000":
            capacityFilters.push({
              engineCapacity: { $gte: 2000, $lte: 4000 },
            });
            break;
          case "4000 - 6000":
            capacityFilters.push({
              engineCapacity: { $gte: 4000, $lte: 6000 },
            });
            break;
          case "6000+":
            capacityFilters.push({ engineCapacity: { $gte: 6000 } });
            break;
        }
      });

      if (capacityFilters.length > 0) {
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: capacityFilters }];
          delete filter.$or;
        } else {
          filter.$or = capacityFilters;
        }
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter["pricing.daily"] = {};
      if (minPrice) filter["pricing.daily"].$gte = parseFloat(minPrice);
      if (maxPrice) filter["pricing.daily"].$lte = parseFloat(maxPrice);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get cars with pagination
    const cars = await Car.find(filter)
      .select(
        "title brand model year category fuelType transmission pricing images status featured whatsappNumber slug seats bodyType engineCapacity"
      )
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalCars = await Car.countDocuments(filter);
    const totalPages = Math.ceil(totalCars / limitNum);

    // Transform cars to match frontend format
    const transformedCars = cars.map((car) => ({
      id: car._id,
      name: car.title,
      image: car.images?.main?.url || "/placeholder-car.jpg",
      rating: 4.5, // Default rating - could be calculated from reviews
      reviews: Math.floor(Math.random() * 100) + 10, // Mock reviews count
      seats: car.seats || 5,
      transmission: car.transmission || "Automatic",
      doors: 4, // Default doors
      type: car.bodyType || car.category,
      dailyRate: car.pricing?.daily || 0,
      liked: false, // Would need user context to determine
      brand: car.brand,
      model: car.model,
      year: car.year,
      category: car.category,
      fuelType: car.fuelType,
      featured: car.featured,
      whatsappNumber: car.whatsappNumber,
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
    console.error("Error in getFilteredCars:", error);
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
 * /api/cars/filter-options:
 *   get:
 *     summary: Get all available filter options (from allApis.js)
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: Filter options retrieved successfully
 */
const getFilterOptions = async (req, res) => {
  try {
    // Static filter options as defined in frontend
    const filterOptions = {
      vehicleTypes: ["Car", "Van", "Minibus", "Prestige"],
      carBodyTypes: [
        "Convertible",
        "Coupe",
        "Exotic Cars",
        "Hatchback",
        "Minivan",
        "Truck",
        "Sedan",
        "Sports Car",
        "Station Wagon",
        "SUV",
      ],
      carSeats: ["2 seats", "4 seats", "6 seats", "6+ seats"],
      engineCapacities: ["1000 - 2000", "2000 - 4000", "4000 - 6000", "6000+"],
      priceRange: {
        min: 0,
        max: 2000,
      },
    };

    // Optionally get dynamic price range from database
    const priceStats = await Car.aggregate([
      { $match: { status: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$pricing.daily" },
          maxPrice: { $max: "$pricing.daily" },
        },
      },
    ]);

    if (priceStats.length > 0) {
      filterOptions.priceRange = {
        min: Math.floor(priceStats[0].minPrice || 0),
        max: Math.ceil(priceStats[0].maxPrice || 2000),
      };
    }

    res.status(200).json({ success: true, data: filterOptions });
  } catch (error) {
    console.error("Error in getFilterOptions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch filter options",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/cars/{carId}/toggle-like:
 *   post:
 *     summary: Toggle like status for a car
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Like status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Car not found
 */
const toggleCarLike = async (req, res) => {
  try {
    const { carId } = req.params;
    const userId = req.user?.id; // Assuming auth middleware sets req.user

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Check if car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // For now, just return success with mock data
    // In a real implementation, you'd have a UserFavorites model
    const liked = Math.random() > 0.5; // Mock toggle
    const likesCount = Math.floor(Math.random() * 50) + 1; // Mock count

    res.status(200).json({
      success: true,
      data: {
        liked,
        likesCount,
      },
      message: liked ? "Car added to favorites" : "Car removed from favorites",
    });
  } catch (error) {
    console.error("Error in toggleCarLike:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle like status",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/cars/{carId}/availability:
 *   get:
 *     summary: Check car availability for specific dates
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for availability check
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for availability check
 *     responses:
 *       200:
 *         description: Availability checked successfully
 *       404:
 *         description: Car not found
 */
const checkCarAvailability = async (req, res) => {
  try {
    const { carId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Start date and end date are required",
      });
    }

    // Check if car exists
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // In a real implementation, you would check against existing bookings
    // For now, we'll return mock availability data
    const available = Math.random() > 0.3; // 70% chance of being available
    const unavailableDates = available
      ? []
      : ["2024-01-15", "2024-01-16", "2024-01-17"];

    res.status(200).json({
      success: true,
      data: {
        available,
        unavailableDates,
        carId,
        checkedPeriod: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error) {
    console.error("Error in checkCarAvailability:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check availability",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// ===== ADMIN CAR MANAGEMENT FUNCTIONS =====

/**
 * @swagger
 * /api/admin/cars:
 *   get:
 *     summary: Get all cars for admin management with pagination
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
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

// Helper function to map car type to category
const mapTypeToCategory = (type) => {
  const typeMap = {
    "Sedan": "Orta Sınıf",
    "SUV": "SUV", 
    "Hatchback": "Ekonomik",
    "Sports Car": "Lüks",
    "Convertible": "Lüks",
    "Truck": "Geniş",
    "Exotic Cars": "Lüks"
  };
  return typeMap[type] || "Orta Sınıf";
};

/**
 * @swagger
 * /api/admin/cars/{id}:
 *   get:
 *     summary: Get single car for admin editing
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
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
          title: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          category: "Lüks",
          fuelType: "Benzin",
          transmission: "Otomatik",
          pricing: {
            daily: "",
            weekly: "",
            monthly: "",
          },
          images: {
            main: {
              url: "",
            },
            gallery: [],
          },
          status: true,
          featured: false,
          features: [],
          description: "",
          seats: "",
          doors: "",
          engineCapacity: "",
        },
      });
    }

    // Find existing car
    car = await Car.findById(id).lean();

    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Transform car data for admin editing in simplified format
    const transformedCar = {
      id: car._id,
      title: car.title || "",
      brand: car.brand || "",
      model: car.model || "",
      year: car.year || new Date().getFullYear(),
      category: car.category || "Lüks",
      fuelType: car.fuelType || "Benzin", 
      transmission: car.transmission || "Otomatik",
      pricing: {
        daily: car.pricing?.daily?.toString() || "",
        weekly: car.pricing?.weekly?.toString() || "",
        monthly: car.pricing?.monthly?.toString() || "",
      },
      images: {
        main: {
          url: car.images?.main?.url || "",
        },
        gallery: car.images?.gallery || [],
      },
      status: car.status !== undefined ? car.status : true,
      featured: car.featured || false,
      features: car.features || [],
      description: car.description || "",
      seats: car.seats?.toString() || "",
      doors: car.doors?.toString() || "",
      engineCapacity: car.engineCapacity || "",
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
 *     summary: Create new car
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 */
const createAdminCar = async (req, res) => {
  try {
    const {
      title,
      brand,
      model,
      year,
      category,
      fuelType,
      transmission,
      pricing,
      images,
      status,
      featured,
      features,
      description,
      seats,
      doors,
      engineCapacity,
      bodyType
    } = req.body;

    // Validate required fields
    if (!title || !pricing?.daily) {
      return res.status(400).json({
        success: false,
        error: "Car title and daily price are required",
      });
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-");

    // Map category to database enum values
    const mapCategoryToEnum = (cat) => {
      const categoryMap = {
        "Sports Car": "Lüks",
        "SUV": "SUV", 
        "Sedan": "Orta Sınıf",
        "Hatchback": "Ekonomik",
        "Convertible": "Lüks",
        "Coupe": "Üst Sınıf",
        "Truck": "Geniş",
        "Exotic Cars": "Lüks",
        "Station Wagon": "Orta Sınıf",
        "Minivan": "Geniş"
      };
      return categoryMap[cat] || cat || "Lüks";
    };

    // Create car object matching the simplified frontend structure
    const carData = {
      title: title,
      brand: brand || "BMW",
      model: model || "Model",
      year: year || new Date().getFullYear(),
      category: mapCategoryToEnum(category),
      bodyType: bodyType || "Sedan",
      fuelType: fuelType || "Benzin",
      transmission: transmission || "Otomatik",
      seats: seats ? parseInt(seats) : 5,
      doors: doors ? parseInt(doors) : 4,
      engineCapacity: engineCapacity && engineCapacity !== "" ? parseInt(engineCapacity) : 2000,
      description: description || "",

      // Pricing - simplified structure
      pricing: {
        daily: parseFloat(pricing.daily) || 0,
        weekly: parseFloat(pricing.weekly) || parseFloat(pricing.daily) * 6,
        monthly: parseFloat(pricing.monthly) || parseFloat(pricing.daily) * 25,
      },

      // Images - simplified structure
      images: {
        main: {
          url: images?.main?.url || "",
        },
        gallery: images?.gallery || [],
      },

      // Features - simplified to array of strings
      features: features || [],

      // Status and featured
      status: status !== undefined ? status : true,
      featured: featured || false,

      // SEO
      slug: slug,

      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    const newCar = await Car.create(carData);

    res.status(201).json({
      success: true,
      data: newCar,
      message: "Car created successfully",
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
 *     summary: Update existing car
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 */
const updateAdminCar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      brand,
      model,
      year,
      category,
      fuelType,
      transmission,
      pricing,
      images,
      status,
      featured,
      features,
      description,
      seats,
      doors,
      engineCapacity,
      bodyType
    } = req.body;

    // Find existing car
    const existingCar = await Car.findById(id);
    if (!existingCar) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Create updated car data
    const updateData = {};

    // Map category to database enum values
    const mapCategoryToEnum = (cat) => {
      const categoryMap = {
        "Sports Car": "Lüks",
        "SUV": "SUV", 
        "Sedan": "Orta Sınıf",
        "Hatchback": "Ekonomik",
        "Convertible": "Lüks",
        "Coupe": "Üst Sınıf",
        "Truck": "Geniş",
        "Exotic Cars": "Lüks",
        "Station Wagon": "Orta Sınıf",
        "Minivan": "Geniş"
      };
      return categoryMap[cat] || cat || "Lüks";
    };

    // Update basic fields
    if (title !== undefined) {
      updateData.title = title;
      // Update slug if title changed
      if (title) {
        updateData.slug = title
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, "-");
      }
    }

    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) updateData.year = year;
    if (category !== undefined) updateData.category = mapCategoryToEnum(category);
    if (bodyType !== undefined) updateData.bodyType = bodyType;
    if (fuelType !== undefined) updateData.fuelType = fuelType;
    if (transmission !== undefined) updateData.transmission = transmission;
    if (seats !== undefined) updateData.seats = parseInt(seats);
    if (doors !== undefined) updateData.doors = parseInt(doors);
    if (engineCapacity !== undefined && engineCapacity !== "") updateData.engineCapacity = parseInt(engineCapacity);
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;

    // Update pricing with simplified structure
    if (pricing) {
      updateData.pricing = {
        daily: pricing.daily ? parseFloat(pricing.daily) : existingCar.pricing?.daily || 0,
        weekly: pricing.weekly ? parseFloat(pricing.weekly) : (pricing.daily ? parseFloat(pricing.daily) * 6 : existingCar.pricing?.weekly || 0),
        monthly: pricing.monthly ? parseFloat(pricing.monthly) : (pricing.daily ? parseFloat(pricing.daily) * 25 : existingCar.pricing?.monthly || 0),
      };
    }

    // Update images with simplified structure
    if (images) {
      updateData.images = {
        main: {
          url: images.main?.url || existingCar.images?.main?.url || "",
        },
        gallery: images.gallery || existingCar.images?.gallery || [],
      };
    }

    // Update features as simple array of strings
    if (features !== undefined) {
      updateData.features = features || [];
    }

    updateData.updatedAt = new Date();

    // Update car in database
    const updatedCar = await Car.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCar,
      message: "Car updated successfully",
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
 *     summary: Delete car
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 */
const deleteAdminCar = async (req, res) => {
  try {
    const { id } = req.params;

    // Find existing car
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Delete images from Cloudinary if they exist
    try {
      if (car.images?.main?.publicId) {
        await deleteImage(car.images.main.publicId);
      }

      if (car.images?.gallery && car.images.gallery.length > 0) {
        for (const image of car.images.gallery) {
          if (image.publicId) {
            await deleteImage(image.publicId);
          }
        }
      }
    } catch (imageError) {
      console.warn("Error deleting images from Cloudinary:", imageError);
      // Continue with car deletion even if image deletion fails
    }

    // Delete the car
    await Car.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Car deleted successfully",
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
 * /api/admin/cars/{id}/scheduled-pricing:
 *   get:
 *     summary: Get scheduled pricing for a car
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 */
const getCarScheduledPricing = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id).select('scheduledPricing');
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    res.status(200).json({
      success: true,
      data: car.scheduledPricing || [],
    });
  } catch (error) {
    console.error("Error in getCarScheduledPricing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get scheduled pricing",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars/{id}/scheduled-pricing:
 *   post:
 *     summary: Add scheduled pricing for a car
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 */
const addCarScheduledPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, prices } = req.body;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    const newPricing = {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      prices: {
        USD: prices?.USD || 0,
        EUR: prices?.EUR || 0,
        TRY: prices?.TRY || 0,
      },
      createdAt: new Date(),
    };

    if (!car.scheduledPricing) {
      car.scheduledPricing = [];
    }
    car.scheduledPricing.push(newPricing);
    await car.save();

    res.status(201).json({
      success: true,
      data: newPricing,
      message: "Scheduled pricing added successfully",
    });
  } catch (error) {
    console.error("Error in addCarScheduledPricing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add scheduled pricing",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars/{id}/scheduled-pricing/{pricingId}:
 *   delete:
 *     summary: Delete scheduled pricing for a car
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 */
const deleteCarScheduledPricing = async (req, res) => {
  try {
    const { id, pricingId } = req.params;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    if (!car.scheduledPricing) {
      return res.status(404).json({
        success: false,
        error: "Scheduled pricing not found",
      });
    }

    const pricingIndex = car.scheduledPricing.findIndex(
      (pricing) => pricing._id.toString() === pricingId
    );

    if (pricingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Scheduled pricing not found",
      });
    }

    car.scheduledPricing.splice(pricingIndex, 1);
    await car.save();

    res.status(200).json({
      success: true,
      message: "Scheduled pricing deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCarScheduledPricing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete scheduled pricing",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/cars/{id}/inventory:
 *   put:
 *     summary: Update car inventory
 *     tags: [Admin - Cars]
 *     security:
 *       - bearerAuth: []
 */
const updateCarInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalUnits, rentedUnits, maintenanceUnits, outOfServiceUnits } = req.body;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    const updateData = {};
    if (totalUnits !== undefined) updateData['inventory.totalUnits'] = parseInt(totalUnits);
    if (rentedUnits !== undefined) updateData['inventory.rentedUnits'] = parseInt(rentedUnits);
    if (maintenanceUnits !== undefined) updateData['inventory.maintenanceUnits'] = parseInt(maintenanceUnits);
    if (outOfServiceUnits !== undefined) updateData['inventory.outOfServiceUnits'] = parseInt(outOfServiceUnits);

    const updatedCar = await Car.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCar.inventory,
      message: "Car inventory updated successfully",
    });
  } catch (error) {
    console.error("Error in updateCarInventory:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update car inventory",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Add the other admin functions as exports
exports.getFilteredCars = getFilteredCars;
exports.getFilterOptions = getFilterOptions;
exports.toggleCarLike = toggleCarLike;
exports.checkCarAvailability = checkCarAvailability;
exports.getAdminCars = getAdminCars;
exports.getAdminCarDetails = getAdminCarDetails;
exports.createAdminCar = createAdminCar;
exports.updateAdminCar = updateAdminCar;
exports.deleteAdminCar = deleteAdminCar;
exports.getCarScheduledPricing = getCarScheduledPricing;
exports.addCarScheduledPricing = addCarScheduledPricing;
exports.deleteCarScheduledPricing = deleteCarScheduledPricing;
exports.updateCarInventory = updateCarInventory;
