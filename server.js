// server.js - Rentaly Backend Ana Dosyası
const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./src/config/swagger");
const { logger, logAPI, logError, logInfo } = require("./src/config/logger");
require("dotenv").config();

// Database connections
const { connectDB: connectPostgreSQL } = require("./src/config/database");

// Route imports - PostgreSQL routes
const listingRoutes = require("./src/routes/listings");
const imageUploadRoutes = require("./src/routes/imageUpload");
const adminAuthRoutes = require("./src/routes/adminAuth");
const blogRoutes = require("./src/routes/blog");

// Minimal compatibility routes for frontend
const minimalCompatRoutes = require("./src/routes/minimal-compat");

// Express app oluştur
const app = express();

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request/Response logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Store original res.json to intercept response
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - start;

    // Log to Winston
    logAPI(req.method, req.url, res.statusCode, duration, null, {
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection?.remoteAddress,
      headers: req.headers,
      body: req.body,
      response: body,
    });

    // Console log for development
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n🔵 ${req.method} ${req.url}`);
      console.log(`📤 Headers:`, JSON.stringify(req.headers, null, 2));
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📤 Body:`, JSON.stringify(req.body, null, 2));
      }
      console.log(
        `📥 Response [${res.statusCode}] (${duration}ms):`,
        JSON.stringify(body, null, 2)
      );
      console.log(`${"=".repeat(80)}`);
    }

    return originalJson.call(this, body);
  };

  next();
});

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Rentaly API Documentation",
  })
);

// API Routes - PostgreSQL routes
app.use("/api/listings", listingRoutes);
app.use("/api/images", imageUploadRoutes);
app.use("/api/auth", adminAuthRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api", blogRoutes);

// Use minimal compatibility routes for missing endpoints
app.use("/api", minimalCompatRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Rentaly API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((error, req, res, next) => {
  // Log error to Winston
  logError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("User-Agent"),
    body: req.body,
  });

  // Console log for development
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", error);
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: Object.values(error.errors).map((e) => e.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// Database connection ve server start
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Connect to PostgreSQL database
    await connectPostgreSQL();
    logInfo("PostgreSQL connected successfully");

    // Server'ı başlat
    app.listen(PORT, () => {
      logInfo(`Rentaly API started on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        healthCheck: `http://localhost:${PORT}/api/health`,
      });

      // Console log for development
      if (process.env.NODE_ENV !== "production") {
        console.log(`🚀 Rentaly API running on port ${PORT}`);
        console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`📁 Logs directory: ${path.join(__dirname, "logs")}`);
      }
    });
  } catch (error) {
    logError(error, { context: "Server startup" });
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
