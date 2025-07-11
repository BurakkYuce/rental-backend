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
