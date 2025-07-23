// server.js - Rentaly Backend Ana Dosyası
const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./src/config/swagger");
require("dotenv").config();

// Database connection
const connectDB = require("./src/utils/database");

// Route imports
const authRoutes = require("./src/routes/auth");
const carRoutes = require("./src/routes/cars");
const bookingRoutes = require("./src/routes/bookings");
const userRoutes = require("./src/routes/users");
const contentRoutes = require("./src/routes/content");
const uploadRoutes = require("./src/routes/upload");
const adminRoutes = require("./src/routes/admin");
const blogRoutes = require("./src/routes/blog");

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

  // Log request
  console.log(`\n🔵 ${req.method} ${req.url}`);
  console.log(`📤 Headers:`, JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📤 Body:`, JSON.stringify(req.body, null, 2));
  }

  // Store original res.json to intercept response
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - start;
    console.log(
      `📥 Response [${res.statusCode}] (${duration}ms):`,
      JSON.stringify(body, null, 2)
    );
    console.log(`${"=".repeat(80)}`);
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api", contentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blogs", blogRoutes);

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
  console.error("Error:", error);

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
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Database'e bağlan
    await connectDB();
    console.log("✅ MongoDB connected");

    // Server'ı başlat
    app.listen(PORT, () => {
      console.log(`🚀 Rentaly API running on port ${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
