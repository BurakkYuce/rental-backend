// src/controllers/listingController.js - Listing CRUD Operations
const { Car: Listing, Admin } = require('../models');
const { uploadImage, uploadMultipleImages, deleteImage } = require('../config/cloudinary');
const { Op } = require('sequelize');

// Create new listing
const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      brand,
      model,
      year,
      category,
      fuelType,
      transmission,
      bodyType,
      seats,
      doors,
      pricing,
      totalUnits,
      availableUnits,
      minDriverAge,
      minLicenseYear,
      whatsappNumber,
      metaDescription,
      keywords
    } = req.body;

    // Validate required fields
    if (!title || !brand || !model || !year || !pricing) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, brand, model, year, and pricing are required'
      });
    }

    // Parse pricing if it's a string
    let parsedPricing;
    try {
      parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid pricing format',
        message: 'Pricing must be a valid JSON object'
      });
    }

    // Handle image uploads
    let imageData = {
      main: null,
      gallery: []
    };

    if (req.files) {
      // Upload main image
      if (req.files.mainImage && req.files.mainImage[0]) {
        console.log('📤 Uploading main image...');
        const mainResult = await uploadImage(req.files.mainImage[0].buffer, {
          folder: 'rentaly/cars/main',
          original_filename: req.files.mainImage[0].originalname
        });

        imageData.main = {
          url: mainResult.url,
          publicId: mainResult.publicId,
          filename: req.files.mainImage[0].originalname
        };
      }

      // Upload gallery images
      if (req.files.galleryImages && req.files.galleryImages.length > 0) {
        console.log(`📤 Uploading ${req.files.galleryImages.length} gallery images...`);
        const galleryResults = await uploadMultipleImages(req.files.galleryImages, {
          folder: 'rentaly/cars/gallery'
        });

        imageData.gallery = galleryResults.map((result, index) => ({
          url: result.url,
          publicId: result.publicId,
          filename: req.files.galleryImages[index].originalname,
          order: index
        }));
      }
    }

    // Create listing
    const listing = await Listing.create({
      title,
      description,
      brand,
      model,
      year: parseInt(year),
      category,
      fuelType,
      transmission,
      bodyType,
      seats: parseInt(seats) || 5,
      doors: parseInt(doors) || 4,
      pricing: parsedPricing,
      images: imageData,
      totalUnits: parseInt(totalUnits) || 1,
      availableUnits: parseInt(availableUnits) || 1,
      minDriverAge: parseInt(minDriverAge) || 21,
      minLicenseYear: parseInt(minLicenseYear) || 1,
      whatsappNumber,
      metaDescription,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
      userId: req.admin.id // From admin auth middleware
    });

    // Fetch created listing with owner info
    const createdListing = await Listing.findByPk(listing.id, {
      include: [{
        model: Admin,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: createdListing
    });

  } catch (error) {
    console.error('❌ Create listing error:', error);
    
    // Clean up uploaded images if listing creation failed
    if (req.uploadedImages) {
      try {
        for (const image of req.uploadedImages) {
          await deleteImage(image.publicId);
        }
      } catch (cleanupError) {
        console.error('❌ Error cleaning up images:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to create listing',
      message: error.message || 'Internal server error'
    });
  }
};

// Get all listings with filters
const getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      model,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      bodyType,
      year,
      featured,
      status = 'active',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search
    } = req.query;

    // Build where clause
    const where = { status };

    if (category && category !== 'all') where.category = category;
    if (brand && brand !== 'all') where.brand = brand;
    if (model && model !== 'all') where.model = model;
    if (transmission && transmission !== 'all') where.transmission = transmission;
    if (fuelType && fuelType !== 'all') where.fuelType = fuelType;
    if (bodyType && bodyType !== 'all') where.bodyType = bodyType;
    if (year) where.year = parseInt(year);
    if (featured === 'true') where.featured = true;

    // Price range filter (JSON query)
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter[Op.gte] = parseFloat(minPrice);
      if (maxPrice) priceFilter[Op.lte] = parseFloat(maxPrice);
      where['pricing.daily'] = priceFilter;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Simple sorting - use raw DB column names
    let order = [[sortBy, sortOrder.toUpperCase()]];
    if (sortBy === 'price') {
      order = [['pricing', sortOrder.toUpperCase()]];
    }

    // Use raw query as fallback for testing
    const listings = await Listing.sequelize.query(
      'SELECT * FROM cars WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      {
        replacements: [status, parseInt(limit), offset],
        type: Listing.sequelize.QueryTypes.SELECT
      }
    );
    
    const countResult = await Listing.sequelize.query(
      'SELECT COUNT(*) as count FROM cars WHERE status = ?',
      {
        replacements: [status],
        type: Listing.sequelize.QueryTypes.SELECT
      }
    );
    
    const count = parseInt(countResult[0].count);

    // Calculate pagination info
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('❌ Get listings error:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      error: 'Failed to fetch listings',
      message: error.message
    });
  }
};

// Get single listing by ID or slug
const getListing = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    const where = isUUID ? { id } : { slug: id };

    const listing = await Listing.findOne({
      where,
      include: [{
        model: Admin,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }]
    });

    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found',
        message: 'The requested listing does not exist'
      });
    }

    // Increment view count in JSONB field
    const currentStats = listing.stats || { viewCount: 0, inquiries: 0, bookings: 0 };
    currentStats.viewCount = (currentStats.viewCount || 0) + 1;
    
    await listing.update({ 
      stats: currentStats 
    });

    res.json({
      success: true,
      data: listing
    });

  } catch (error) {
    console.error('❌ Get listing error:', error);
    res.status(500).json({
      error: 'Failed to fetch listing',
      message: error.message
    });
  }
};

// Update listing
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Find listing
    const listing = await Listing.findByPk(id);
    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found',
        message: 'The requested listing does not exist'
      });
    }

    // Check ownership (assuming auth middleware sets req.admin)
    if (listing.userId !== req.admin.id && req.admin.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own listings'
      });
    }

    // Handle pricing update
    if (updateData.pricing && typeof updateData.pricing === 'string') {
      try {
        updateData.pricing = JSON.parse(updateData.pricing);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid pricing format',
          message: 'Pricing must be a valid JSON object'
        });
      }
    }

    // Handle new image uploads
    if (req.files) {
      const currentImages = listing.images || { main: null, gallery: [] };

      // Update main image
      if (req.files.mainImage && req.files.mainImage[0]) {
        // Delete old main image
        if (currentImages.main?.publicId) {
          await deleteImage(currentImages.main.publicId);
        }

        const mainResult = await uploadImage(req.files.mainImage[0].buffer, {
          folder: 'rentaly/cars/main',
          original_filename: req.files.mainImage[0].originalname
        });

        currentImages.main = {
          url: mainResult.url,
          publicId: mainResult.publicId,
          filename: req.files.mainImage[0].originalname
        };
      }

      // Add new gallery images
      if (req.files.galleryImages && req.files.galleryImages.length > 0) {
        const galleryResults = await uploadMultipleImages(req.files.galleryImages, {
          folder: 'rentaly/cars/gallery'
        });

        const newGalleryImages = galleryResults.map((result, index) => ({
          url: result.url,
          publicId: result.publicId,
          filename: req.files.galleryImages[index].originalname,
          order: currentImages.gallery.length + index
        }));

        currentImages.gallery = [...currentImages.gallery, ...newGalleryImages];
      }

      updateData.images = currentImages;
    }

    // Parse keywords
    if (updateData.keywords && typeof updateData.keywords === 'string') {
      updateData.keywords = updateData.keywords.split(',').map(k => k.trim());
    }

    // Update listing
    await listing.update(updateData);

    // Fetch updated listing with owner info
    const updatedListing = await Listing.findByPk(id, {
      include: [{
        model: Admin,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: updatedListing
    });

  } catch (error) {
    console.error('❌ Update listing error:', error);
    res.status(500).json({
      error: 'Failed to update listing',
      message: error.message
    });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findByPk(id);
    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found',
        message: 'The requested listing does not exist'
      });
    }

    // Check ownership
    if (listing.userId !== req.admin.id && req.admin.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own listings'
      });
    }

    // Delete images from Cloudinary
    const images = listing.images;
    if (images) {
      const imagesToDelete = [];
      
      if (images.main?.publicId) {
        imagesToDelete.push(images.main.publicId);
      }
      
      if (images.gallery && images.gallery.length > 0) {
        images.gallery.forEach(img => {
          if (img.publicId) {
            imagesToDelete.push(img.publicId);
          }
        });
      }

      // Delete all images concurrently
      if (imagesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${imagesToDelete.length} images from Cloudinary...`);
        await Promise.all(imagesToDelete.map(publicId => deleteImage(publicId)));
      }
    }

    // Delete listing from database
    await listing.destroy();

    res.json({
      success: true,
      message: 'Listing deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Delete listing error:', error);
    res.status(500).json({
      error: 'Failed to delete listing',
      message: error.message
    });
  }
};

// Get listing filters (for frontend filter dropdowns)
const getListingFilters = async (req, res) => {
  try {
    const [
      categories,
      brands,
      transmissions,
      fuelTypes,
      bodyTypes,
      priceRange
    ] = await Promise.all([
      Listing.findAll({
        attributes: ['category'],
        where: { status: 'active' },
        group: ['category'],
        raw: true
      }),
      Listing.findAll({
        attributes: ['brand'],
        where: { status: 'active' },
        group: ['brand'],
        order: [['brand', 'ASC']],
        raw: true
      }),
      Listing.findAll({
        attributes: ['transmission'],
        where: { status: 'active' },
        group: ['transmission'],
        raw: true
      }),
      Listing.findAll({
        attributes: ['fuelType'],
        where: { status: 'active' },
        group: ['fuelType'],
        raw: true
      }),
      Listing.findAll({
        attributes: ['bodyType'],
        where: { status: 'active' },
        group: ['bodyType'],
        raw: true
      }),
      Listing.findOne({
        attributes: [
          [Listing.sequelize.fn('MIN', Listing.sequelize.json('pricing.daily')), 'minPrice'],
          [Listing.sequelize.fn('MAX', Listing.sequelize.json('pricing.daily')), 'maxPrice']
        ],
        where: { status: 'active' },
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.category).sort(),
        brands: brands.map(b => b.brand).sort(),
        transmissions: transmissions.map(t => t.transmission).sort(),
        fuelTypes: fuelTypes.map(f => f.fuelType).sort(),
        bodyTypes: bodyTypes.map(bt => bt.bodyType).sort(),
        priceRange: priceRange || { minPrice: 0, maxPrice: 1000 }
      }
    });

  } catch (error) {
    console.error('❌ Get filters error:', error);
    res.status(500).json({
      error: 'Failed to fetch filters',
      message: error.message
    });
  }
};

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  getListingFilters
};