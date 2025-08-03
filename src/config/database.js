// src/config/database.js - PostgreSQL Connection Configuration
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection options
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Database connection test
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
    console.log(`📦 Database: ${process.env.DATABASE_NAME}`);
    console.log(`🏠 Host: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`);
    
    // Sync database tables (be careful in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('🔄 Database tables synchronized');
    }
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    console.log('👋 PostgreSQL connection closed due to app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    process.exit(1);
  }
});

module.exports = { sequelize, connectDB };