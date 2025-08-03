// src/config/cloudinary.js - Cloudinary Configuration
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload options for different use cases
const uploadOptions = {
  // Car listing images
  carImages: {
    folder: 'rentaly/cars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'fill',
        gravity: 'center',
        quality: 'auto',
        format: 'webp'
      }
    ]
  },
  
  // Thumbnail images
  carThumbnails: {
    folder: 'rentaly/cars/thumbnails',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 400,
        height: 300,
        crop: 'fill',
        gravity: 'center',
        quality: 'auto',
        format: 'webp'
      }
    ]
  },
  
  // User avatars
  userAvatars: {
    folder: 'rentaly/users/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      {
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        format: 'webp'
      }
    ]
  }
};

// Upload function with error handling
const uploadImage = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          ...uploadOptions.carImages,
          ...options
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            });
          }
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('❌ Upload function error:', error);
    throw error;
  }
};

// Delete image function
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Image deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Multiple image upload function
const uploadMultipleImages = async (files, options = {}) => {
  try {
    const uploads = files.map(file => uploadImage(file.buffer, options));
    const results = await Promise.all(uploads);
    return results;
  } catch (error) {
    console.error('❌ Error uploading multiple images:', error);
    throw error;
  }
};

// Get optimized image URL
const getOptimizedImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    format: 'webp',
    ...transformations
  });
};

module.exports = {
  cloudinary,
  uploadOptions,
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  getOptimizedImageUrl
};