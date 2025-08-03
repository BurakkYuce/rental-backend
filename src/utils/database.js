// src/utils/database.js - PostgreSQL Database Utilities
// This file is kept for compatibility but PostgreSQL connection is handled in src/config/database.js

const { connectDB } = require('../config/database');

// Re-export the PostgreSQL connection function for backward compatibility
module.exports = connectDB;