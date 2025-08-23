// Test setup and global configurations
require("dotenv").config({ path: ".env.test" });

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.PORT = "3001";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";

// Mock database connections
jest.mock("../src/config/database.js", () => ({
  connectDB: jest.fn().mockResolvedValue(true),
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    define: jest.fn().mockImplementation((modelName, attributes, options) => {
      // Return a mock model with common Sequelize methods
      const mockModel = {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
        sum: jest.fn(),
        bulkCreate: jest.fn(),
        upsert: jest.fn(),
        belongsTo: jest.fn(),
        hasMany: jest.fn(),
        belongsToMany: jest.fn(),
        hasOne: jest.fn(),
        beforeCreate: jest.fn(),
        beforeUpdate: jest.fn(),
        beforeDestroy: jest.fn(),
        afterCreate: jest.fn(),
        afterUpdate: jest.fn(),
        afterDestroy: jest.fn(),
        validate: jest.fn(),
        associations: {},
        rawAttributes: attributes,
      };
      return mockModel;
    }),
    transaction: jest.fn().mockImplementation((callback) => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true),
      };
      return callback(mockTransaction);
    }),
    DataTypes: {
      INTEGER: "INTEGER",
      STRING: "STRING",
      TEXT: "TEXT",
      BOOLEAN: "BOOLEAN",
      DATE: "DATE",
      DECIMAL: "DECIMAL",
      FLOAT: "FLOAT",
      DOUBLE: "DOUBLE",
      REAL: "REAL",
      JSON: "JSON",
      JSONB: "JSONB",
      ENUM: jest.fn(),
      UUID: "UUID",
      UUIDV4: "UUIDV4",
      NOW: "NOW",
    },
  },
}));
RUN_LOAD_TESTS = true;
// Mock Cloudinary
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: "https://test-cloudinary.com/test-image.jpg",
        public_id: "test-public-id",
      }),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

// Mock Winston logger
jest.mock("../src/config/logger.js", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
