// tests/helpers/testDatabase.js - Test Database Helper for PostgreSQL
const { Sequelize } = require('sequelize');

// Create in-memory SQLite database for testing
const testSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  define: {
    timestamps: true,
    underscored: false
  }
});

// Mock models for testing
const createTestModels = () => {
  // Car model mock
  const Car = testSequelize.define('Car', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    brand: {
      type: Sequelize.STRING,
      allowNull: false
    },
    model: {
      type: Sequelize.STRING,
      allowNull: false
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    category: {
      type: Sequelize.ENUM('Economy', 'Compact', 'Standard', 'Full Size', 'Premium', 'Luxury', 'SUV', 'Van'),
      allowNull: false
    },
    pricing: {
      type: Sequelize.JSON,
      allowNull: false
    },
    seats: {
      type: Sequelize.INTEGER,
      defaultValue: 5
    },
    doors: {
      type: Sequelize.INTEGER,
      defaultValue: 4
    },
    transmission: {
      type: Sequelize.ENUM('Manual', 'Automatic', 'CVT'),
      defaultValue: 'Manual'
    },
    fuelType: {
      type: Sequelize.ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid'),
      defaultValue: 'Petrol'
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active'
    },
    isAvailable: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  });

  // Booking model mock
  const Booking = testSequelize.define('Booking', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    serviceType: {
      type: Sequelize.ENUM('car_rental', 'transfer'),
      allowNull: false,
      defaultValue: 'car_rental'
    },
    carId: {
      type: Sequelize.UUID,
      allowNull: true
    },
    transferId: {
      type: Sequelize.UUID,
      allowNull: true
    },
    drivers: {
      type: Sequelize.JSON,
      allowNull: false
    },
    pickupLocation: {
      type: Sequelize.STRING,
      allowNull: false
    },
    dropoffLocation: {
      type: Sequelize.STRING,
      allowNull: false
    },
    pickupTime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    dropoffTime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    pricing: {
      type: Sequelize.JSON,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    bookingReference: {
      type: Sequelize.STRING,
      unique: true
    }
  });

  // Blog model mock
  const Blog = testSequelize.define('Blog', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft'
    }
  });

  return { Car, Booking, Blog };
};

// Setup test database
const setupTestDatabase = async () => {
  const models = createTestModels();
  
  // Sync all models
  await testSequelize.sync({ force: true });
  
  return { testSequelize, ...models };
};

// Cleanup test database
const cleanupTestDatabase = async () => {
  await testSequelize.close();
};

// Create test data
const createTestData = async (models) => {
  const { Car, Booking, Blog } = models;
  
  // Create test cars
  const testCars = await Car.bulkCreate([
    {
      title: 'Toyota Corolla 2024',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      category: 'Economy',
      pricing: { daily: 50, weekly: 300, monthly: 1200, currency: 'EUR' },
      seats: 5,
      doors: 4,
      transmission: 'Manual',
      fuelType: 'Petrol'
    },
    {
      title: 'BMW X5 2024',
      brand: 'BMW',
      model: 'X5',
      year: 2024,
      category: 'Luxury',
      pricing: { daily: 150, weekly: 900, monthly: 3600, currency: 'EUR' },
      seats: 7,
      doors: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol'
    }
  ]);

  // Create test bookings
  const testBookings = await Booking.bulkCreate([
    {
      serviceType: 'car_rental',
      carId: testCars[0].id,
      drivers: [{ name: 'John Doe', email: 'john@example.com', age: 30 }],
      pickupLocation: 'Airport Terminal 1',
      dropoffLocation: 'Hotel Paradise',
      pickupTime: new Date('2024-12-25T10:00:00Z'),
      dropoffTime: new Date('2024-12-30T10:00:00Z'),
      pricing: { total: 250, currency: 'EUR' },
      bookingReference: 'BK123456'
    }
  ]);

  // Create test blogs
  const testBlogs = await Blog.bulkCreate([
    {
      title: 'Car Rental Tips',
      content: 'Here are some useful tips for car rental...',
      status: 'published'
    }
  ]);

  return { testCars, testBookings, testBlogs };
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  createTestData,
  testSequelize
};