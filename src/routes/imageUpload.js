// src/routes/imageUpload.js - Düzeltilmiş Versiyonu

const express = require("express");
const router = express.Router();
const { uploadConfigs, handleUploadError } = require("../middleware/upload");
const {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
} = require("../config/cloudinary");
const {
  uploadImageLocally,
  uploadMultipleImagesLocally,
  deleteImageLocally,
} = require("../utils/localFileUpload");

// 🔧 SORUN 1: Frontend API çağrılarınız /api/images/* kullanıyor ama rotalar /api/upload/*
// Bu yüzden 404 hatası alıyorsunuz!

/**
 * Frontend'den çağrılan endpoint: /api/images/upload
 * Eski rota: /api/upload/single
 * YENİ ROTA: Hem /upload/single hem de /images/upload destekleyelim
 */

// ✅ YENİ: Frontend ile uyumlu rotalar
router.post(
  "/upload",
  (req, res, next) => {
    console.log("📤 Pre-upload middleware - incoming request");
    uploadConfigs.single("image")(req, res, (err) => {
      if (err) {
        console.error("❌ Multer error:", err.message);
        console.error("❌ Error type:", err.constructor.name);
        return res.status(400).json({
          error: "File upload error",
          message: err.message,
          errorType: err.constructor.name
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log("📤 Image upload request received:");
      console.log("- File:", req.file ? "✅ Present" : "❌ Missing");
      console.log("- Body:", req.body);
      console.log("- Headers:", req.headers['content-type']);
      
      if (!req.file) {
        console.log("❌ No file found in request");
        return res.status(400).json({
          error: "No file uploaded",
          message: "Please select an image file to upload",
          debug: {
            hasFile: !!req.file,
            bodyKeys: Object.keys(req.body),
            contentType: req.headers['content-type']
          }
        });
      }

      let result;

      // Check if Cloudinary is configured
      const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here";

      if (isCloudinaryConfigured) {
        console.log("📤 Uploading single image to Cloudinary...");
        try {
          result = await uploadImage(req.file.buffer, {
            original_filename: req.file.originalname,
            folder: "rentaly/cars", // 🔧 SORUN 2: Klasör organizasyonu
          });
        } catch (cloudError) {
          console.log(
            "⚠️ Cloudinary upload failed, falling back to local storage..."
          );
          result = await uploadImageLocally(
            req.file.buffer,
            req.file.originalname
          );
        }
      } else {
        console.log(
          "📤 Uploading single image locally (Cloudinary not configured)..."
        );
        result = await uploadImageLocally(
          req.file.buffer,
          req.file.originalname
        );
      }

      // 🔧 SORUN 3: Frontend'in beklediği response formatı
      res.json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl: result.url, // ← Frontend bu alanı bekliyor
        data: {
          url: result.url,
          publicId: result.publicId,
          originalName: req.file.originalname,
          format: result.format,
          size: result.bytes,
        },
      });
    } catch (error) {
      console.error("❌ Single image upload error:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({
        error: "Upload failed",
        message: "Failed to upload image",
        details: error.message,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// ✅ Çoklu resim yükleme - frontend uyumlu
router.post(
  "/upload-multiple",
  uploadConfigs.multiple("images"),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "No files uploaded",
          message: "Please select image files to upload",
        });
      }

      let results;
      const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here";

      if (isCloudinaryConfigured) {
        console.log(`📤 Uploading ${req.files.length} images to Cloudinary...`);
        try {
          results = await uploadMultipleImages(req.files, {
            folder: "rentaly/cars",
          });
        } catch (cloudError) {
          console.log(
            "⚠️ Cloudinary upload failed, falling back to local storage..."
          );
          results = await uploadMultipleImagesLocally(req.files);
        }
      } else {
        console.log(`📤 Uploading ${req.files.length} images locally...`);
        results = await uploadMultipleImagesLocally(req.files);
      }

      const uploadedImages = results.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        originalName: req.files[index].originalname,
        format: result.format,
        size: result.bytes,
      }));

      res.json({
        success: true,
        message: `${uploadedImages.length} images uploaded successfully`,
        imageUrls: uploadedImages.map((img) => img.url), // Frontend için
        data: uploadedImages,
      });
    } catch (error) {
      console.error("❌ Multiple images upload error:", error);
      res.status(500).json({
        error: "Upload failed",
        message: "Failed to upload images",
        details: error.message,
      });
    }
  }
);

// ✅ Resim silme - frontend uyumlu
router.delete("/delete", async (req, res) => {
  try {
    const { publicId, imagePath } = req.body;

    if (!publicId && !imagePath) {
      return res.status(400).json({
        error: "Missing identifier",
        message: "Please provide publicId or imagePath of the image to delete",
      });
    }

    let result;

    // 🔧 SORUN 4: Hem Cloudinary hem local dosya silme desteği
    if (publicId) {
      console.log("🗑️ Deleting image from Cloudinary:", publicId);
      result = await deleteImage(publicId);
    } else if (imagePath) {
      console.log("🗑️ Deleting local image:", imagePath);
      result = await deleteImageLocally(imagePath);
    }

    if (result && (result.result === "ok" || result.success)) {
      res.json({
        success: true,
        message: "Image deleted successfully",
        publicId: publicId,
        imagePath: imagePath,
      });
    } else {
      res.status(400).json({
        error: "Delete failed",
        message: "Image not found or already deleted",
      });
    }
  } catch (error) {
    console.error("❌ Image delete error:", error);
    res.status(500).json({
      error: "Delete failed",
      message: "Failed to delete image",
      details: error.message,
    });
  }
});

// ✅ ESKI ROTALAR - Geriye dönük uyumluluk için
router.post("/single", uploadConfigs.single("image"), async (req, res) => {
  // Aynı mantığı /images/upload ile paylaş
  req.url = "/upload";
  return router.handle(req, res);
});

router.post("/multiple", uploadConfigs.multiple("images"), async (req, res) => {
  req.url = "/images/upload-multiple";
  return router.handle(req, res);
});

// ✅ Car listing endpoint (mevcut, düzeltildi)
router.post("/car-listing", uploadConfigs.mixed, async (req, res) => {
  try {
    const uploadedImages = {
      main: null,
      gallery: [],
    };

    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here";

    // Upload main image if provided
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      console.log("📤 Uploading main image...");

      let mainResult;
      if (isCloudinaryConfigured) {
        try {
          mainResult = await uploadImage(req.files.mainImage[0].buffer, {
            original_filename: req.files.mainImage[0].originalname,
            folder: "rentaly/cars/main",
          });
        } catch (cloudError) {
          console.log(
            "⚠️ Cloudinary upload failed, falling back to local storage..."
          );
          mainResult = await uploadImageLocally(
            req.files.mainImage[0].buffer,
            req.files.mainImage[0].originalname
          );
        }
      } else {
        console.log("📤 Using local storage (Cloudinary not configured)...");
        mainResult = await uploadImageLocally(
          req.files.mainImage[0].buffer,
          req.files.mainImage[0].originalname
        );
      }

      uploadedImages.main = {
        url: mainResult.url,
        publicId: mainResult.publicId,
        filename: req.files.mainImage[0].originalname,
      };
    }

    // Upload gallery images if provided
    if (
      req.files &&
      req.files.galleryImages &&
      req.files.galleryImages.length > 0
    ) {
      console.log(
        `📤 Uploading ${req.files.galleryImages.length} gallery images...`
      );

      let galleryResults;
      if (isCloudinaryConfigured) {
        try {
          galleryResults = await uploadMultipleImages(req.files.galleryImages, {
            folder: "rentaly/cars/gallery",
          });
        } catch (cloudError) {
          console.log(
            "⚠️ Cloudinary upload failed, falling back to local storage..."
          );
          galleryResults = await uploadMultipleImagesLocally(
            req.files.galleryImages
          );
        }
      } else {
        console.log("📤 Using local storage (Cloudinary not configured)...");
        galleryResults = await uploadMultipleImagesLocally(
          req.files.galleryImages
        );
      }

      uploadedImages.gallery = galleryResults.map((result, index) => ({
        url: result.url,
        publicId: result.publicId,
        filename: req.files.galleryImages[index].originalname,
        order: index,
      }));
    }

    if (!uploadedImages.main && uploadedImages.gallery.length === 0) {
      return res.status(400).json({
        error: "No images uploaded",
        message: "Please upload at least one image (main or gallery)",
      });
    }

    res.json({
      success: true,
      message: "Car listing images uploaded successfully",
      data: uploadedImages,
    });
  } catch (error) {
    console.error("❌ Car listing images upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      message: "Failed to upload car listing images",
      details: error.message,
    });
  }
});

// Apply error handling middleware
router.use(handleUploadError);

module.exports = router;

// 🚨 ÖNEMLİ NOTLAR:
// 1. Frontend API çağrıları /api/images/* kullanıyor
// 2. Backend rotaları /api/upload/* tanımlı
// 3. Bu yüzden 404 hatası alıyorsunuz!
// 4. Çözüm: Ya frontend'i değiştirin ya da backend'e yeni rotalar ekleyin
