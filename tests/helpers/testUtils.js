// Test utilities and helpers

/**
 * Generate mock car data for testing
 */
function generateMockCar(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    title: 'Test Car',
    category: 'Economy',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    seats: 5,
    doors: 4,
    transmission: 'Manuel',
    fuelType: 'Benzin',
    pricing: {
      daily: 50,
      weekly: 300,
      monthly: 1200,
      currency: 'EUR'
    },
    seasonal_pricing: [],
    features: ['Bluetooth', 'Air Conditioning'],
    mainImage: {
      url: 'https://example.com/car.jpg',
      publicId: 'test_image'
    },
    gallery: [],
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Generate mock booking data for testing
 */
function generateMockBooking(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    serviceType: 'car_rental',
    carId: 1,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
    pickupDate: '2024-12-20',
    returnDate: '2024-12-25',
    pickupLocation: 'Airport',
    returnLocation: 'Airport',
    totalAmount: 500,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Generate mock transfer data for testing
 */
function generateMockTransfer(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Airport Transfer',
    description: 'Comfortable airport transfer service',
    pricing: {
      base: 50,
      perKm: 2,
      currency: 'EUR'
    },
    zones: ['Airport', 'City Center', 'Hotels'],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Generate mock seasonal pricing
 */
function generateMockSeasonalPricing(overrides = {}) {
  return {
    name: 'Summer',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    pricing: {
      daily: 80,
      weekly: 480,
      monthly: 1920,
      currency: 'EUR'
    },
    ...overrides
  };
}

/**
 * Generate mock admin user
 */
function generateMockAdmin(overrides = {}) {
  return {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Wait for a specified amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random string
 */
function randomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random email
 */
function randomEmail() {
  return `test.${randomString(8)}@example.com`.toLowerCase();
}

/**
 * Generate random phone number
 */
function randomPhone() {
  return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
}

/**
 * Generate future date
 */
function futureDate(daysFromNow = 7) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Generate past date
 */
function pastDate(daysAgo = 7) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
function isValidPhone(phone) {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}

/**
 * Mock database error
 */
function mockDatabaseError(message = 'Database error') {
  const error = new Error(message);
  error.name = 'DatabaseError';
  return error;
}

/**
 * Mock validation error
 */
function mockValidationError(message = 'Validation error') {
  const error = new Error(message);
  error.name = 'ValidationError';
  return error;
}

/**
 * Mock JWT token
 */
function mockJWTToken(payload = { id: 1, role: 'admin' }) {
  // This is a mock token, not a real JWT
  return `mock.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
}

/**
 * Generate test database configuration
 */
function getTestDatabaseConfig() {
  return {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rentaly_test',
    username: process.env.DB_USER || 'test_user',
    password: process.env.DB_PASSWORD || 'test_password',
    logging: false, // Disable logging in tests
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
}

/**
 * Clean database tables (mock implementation)
 */
async function cleanDatabase() {
  // In a real implementation, this would clean test database tables
  console.log('Cleaning test database...');
  return Promise.resolve();
}

/**
 * Setup test data (mock implementation)
 */
async function setupTestData() {
  // In a real implementation, this would setup test data
  console.log('Setting up test data...');
  return Promise.resolve();
}

/**
 * Test data validation helpers
 */
const validators = {
  car: (car) => {
    const errors = [];
    if (!car.title) errors.push('Title is required');
    if (!car.category) errors.push('Category is required');
    if (!car.brand) errors.push('Brand is required');
    if (!car.model) errors.push('Model is required');
    if (!car.year || car.year < 1900) errors.push('Invalid year');
    if (!car.seats || car.seats < 1) errors.push('Invalid seats');
    if (!car.doors || car.doors < 2) errors.push('Invalid doors');
    if (!car.pricing || !car.pricing.daily) errors.push('Invalid pricing');
    return errors;
  },
  
  booking: (booking) => {
    const errors = [];
    if (!booking.serviceType) errors.push('Service type is required');
    if (!booking.customerName) errors.push('Customer name is required');
    if (!booking.customerEmail || !isValidEmail(booking.customerEmail)) {
      errors.push('Valid email is required');
    }
    if (!booking.customerPhone || !isValidPhone(booking.customerPhone)) {
      errors.push('Valid phone is required');
    }
    if (!booking.pickupDate) errors.push('Pickup date is required');
    if (!booking.totalAmount || booking.totalAmount <= 0) {
      errors.push('Total amount must be positive');
    }
    return errors;
  }
};

/**
 * Performance testing helper
 */
async function measurePerformance(fn, iterations = 100) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1000000); // Convert to milliseconds
  }
  
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
  };
}

/**
 * Memory usage helper
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024) // MB
  };
}

module.exports = {
  generateMockCar,
  generateMockBooking,
  generateMockTransfer,
  generateMockSeasonalPricing,
  generateMockAdmin,
  wait,
  randomString,
  randomEmail,
  randomPhone,
  futureDate,
  pastDate,
  isValidEmail,
  isValidPhone,
  daysBetween,
  mockDatabaseError,
  mockValidationError,
  mockJWTToken,
  getTestDatabaseConfig,
  cleanDatabase,
  setupTestData,
  validators,
  measurePerformance,
  getMemoryUsage
};