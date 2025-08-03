// src/routes/imageUpload.js - Image Upload Routes
const express = require('express');
const router = express.Router();
const { uploadConfigs, handleUploadError } = require('../middleware/upload');
const { uploadImage, uploadMultipleImages, deleteImage } = require('../config/cloudinary');

/**
 * @swagger
 * /api/upload/single:
 *   post:
 *     summary: Upload single image
 *     tags: [Upload]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post('/single', uploadConfigs.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select an image file to upload'
      });
    }

    console.log('📤 Uploading single image to Cloudinary...');
    const result = await uploadImage(req.file.buffer, {
      original_filename: req.file.originalname
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.url,
        publicId: result.publicId,
        originalName: req.file.originalname,
        format: result.format,
        size: result.bytes
      }
    });

  } catch (error) {
    console.error('❌ Single image upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload image to cloud storage'
    });
  }
});

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple images
 *     tags: [Upload]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: images
 *         type: file
 *         required: true
 *         description: Image files to upload (max 10)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post('/multiple', uploadConfigs.multiple('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select image files to upload'
      });
    }

    console.log(`📤 Uploading ${req.files.length} images to Cloudinary...`);
    const results = await uploadMultipleImages(req.files);

    const uploadedImages = results.map((result, index) => ({
      url: result.url,
      publicId: result.publicId,
      originalName: req.files[index].originalname,
      format: result.format,
      size: result.bytes
    }));

    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages
    });

  } catch (error) {
    console.error('❌ Multiple images upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload images to cloud storage'
    });
  }
});

/**
 * @swagger
 * /api/upload/car-listing:
 *   post:
 *     summary: Upload images for car listing (main + gallery)
 *     tags: [Upload]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: mainImage
 *         type: file
 *         required: false
 *         description: Main listing image
 *       - in: formData
 *         name: galleryImages
 *         type: file
 *         required: false
 *         description: Gallery images (max 9)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Bad request
 */
router.post('/car-listing', uploadConfigs.mixed, async (req, res) => {
  try {
    const uploadedImages = {
      main: null,
      gallery: []
    };

    // Upload main image if provided
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      console.log('📤 Uploading main image...');
      const mainResult = await uploadImage(req.files.mainImage[0].buffer, {
        original_filename: req.files.mainImage[0].originalname,
        folder: 'rentaly/cars/main'
      });

      uploadedImages.main = {
        url: mainResult.url,
        publicId: mainResult.publicId,
        filename: req.files.mainImage[0].originalname
      };
    }

    // Upload gallery images if provided
    if (req.files && req.files.galleryImages && req.files.galleryImages.length > 0) {
      console.log(`📤 Uploading ${req.files.galleryImages.length} gallery images...`);
      const galleryResults = await uploadMultipleImages(req.files.galleryImages, {
        folder: 'rentaly/cars/gallery'
      });

      uploadedImages.gallery = galleryResults.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        filename: req.files.galleryImages[index].originalname,
        order: index
      }));
    }

    // Check if at least one image was uploaded
    if (!uploadedImages.main && uploadedImages.gallery.length === 0) {
      return res.status(400).json({
        error: 'No images uploaded',
        message: 'Please upload at least one image (main or gallery)'
      });
    }

    res.json({
      success: true,
      message: 'Car listing images uploaded successfully',
      data: uploadedImages
    });

  } catch (error) {
    console.error('❌ Car listing images upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload car listing images'
    });
  }
});

/**
 * @swagger
 * /api/upload/delete:
 *   delete:
 *     summary: Delete image from Cloudinary
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publicId:
 *                 type: string
 *                 description: Cloudinary public ID of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       400:
 *         description: Bad request
 */
router.delete('/delete', async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        error: 'Missing publicId',
        message: 'Please provide the publicId of the image to delete'
      });
    }

    console.log('🗑️ Deleting image from Cloudinary:', publicId);
    const result = await deleteImage(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully',
        publicId: publicId
      });
    } else {
      res.status(400).json({
        error: 'Delete failed',
        message: 'Image not found or already deleted'
      });
    }

  } catch (error) {
    console.error('❌ Image delete error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: 'Failed to delete image from cloud storage'
    });
  }
});

// Apply error handling middleware
router.use(handleUploadError);

module.exports = router;