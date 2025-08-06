// src/utils/localFileUpload.js - Local File Upload Utility
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/cars');

const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory:', uploadsDir);
    }
  }
};

// Generate unique filename
const generateFilename = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  return `${name}-${timestamp}-${hash}${ext}`;
};

// Upload single image locally
const uploadImageLocally = async (buffer, originalName) => {
  try {
    await ensureUploadsDir();
    
    const filename = generateFilename(originalName);
    const filepath = path.join(uploadsDir, filename);
    
    await fs.writeFile(filepath, buffer);
    
    const url = `/uploads/cars/${filename}`;
    const publicId = `local_${filename}`;
    
    console.log('✅ Image uploaded locally:', url);
    
    return {
      url: `http://localhost:4000${url}`,
      publicId,
      filename,
      originalName,
      bytes: buffer.length,
      format: path.extname(originalName).substring(1)
    };
  } catch (error) {
    console.error('❌ Local upload error:', error);
    throw error;
  }
};

// Upload multiple images locally
const uploadMultipleImagesLocally = async (files) => {
  try {
    const uploads = files.map(file => uploadImageLocally(file.buffer, file.originalname));
    const results = await Promise.all(uploads);
    return results;
  } catch (error) {
    console.error('❌ Error uploading multiple images locally:', error);
    throw error;
  }
};

// Delete local image
const deleteImageLocally = async (publicId) => {
  try {
    if (!publicId.startsWith('local_')) {
      throw new Error('Invalid local publicId');
    }
    
    const filename = publicId.replace('local_', '');
    const filepath = path.join(uploadsDir, filename);
    
    await fs.unlink(filepath);
    console.log('🗑️ Image deleted locally:', filename);
    
    return { result: 'ok' };
  } catch (error) {
    console.error('❌ Error deleting local image:', error);
    throw error;
  }
};

module.exports = {
  uploadImageLocally,
  uploadMultipleImagesLocally,
  deleteImageLocally,
  ensureUploadsDir
};