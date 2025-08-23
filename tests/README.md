# Rentaly Backend Test Suite

Comprehensive test suite for the Rentaly car rental backend API, covering all edge cases, error scenarios, and performance requirements.

## 📋 Test Coverage

### Unit Tests
- **Controllers**: Testing individual controller functions with mocked dependencies
- **Models**: Testing data validation, constraints, and business logic
- **Utilities**: Testing helper functions and utilities

### Integration Tests
- **API Endpoints**: End-to-end testing of complete API workflows
- **Database Operations**: Testing actual database interactions
- **Authentication**: Testing JWT and session management

### Load Tests
- **Performance Benchmarks**: Response time and throughput testing
- **Concurrency Tests**: Testing under high concurrent load
- **Memory Usage**: Monitoring memory consumption under stress
- **Error Rate Analysis**: Ensuring system stability under load

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:controllers
npm run test:models
npm run test:integration

# Run load tests
npm run test:load

# Watch mode for development
npm run test:watch
```

## 📊 Test Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests with Jest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:load` | Run performance/load tests |
| `npm run test:all` | Run custom test runner with detailed output |
| `npm run test:controllers` | Run only controller tests |
| `npm run test:models` | Run only model tests |
| `npm run test:api` | Run only API integration tests |

## 🧪 Test Structure

```
tests/
├── controllers/           # Controller unit tests
│   ├── carController.test.js
│   ├── adminController.test.js
│   └── bookingController.test.js
├── models/               # Model validation tests
│   ├── Car.test.js
│   └── Booking.test.js
├── integration/          # API integration tests
│   └── api.test.js
├── load/                 # Performance tests
│   └── loadTest.test.js
├── helpers/              # Test utilities
│   └── testUtils.js
├── setup.js              # Test configuration
└── runTests.js           # Custom test runner
```

## 🔧 Test Configuration

### Environment Variables
```bash
# Test environment
NODE_ENV=test
JWT_SECRET=test-secret-key
PORT=3001

# Test database
DB_NAME=rentaly_test
DB_USER=test_user
DB_PASSWORD=test_password
DB_HOST=localhost
DB_PORT=5432
```

### Jest Configuration
- **Test Environment**: Node.js
- **Test Match**: `**/*.test.js`
- **Coverage**: All source files except config and utils
- **Timeout**: 30 seconds for integration tests
- **Setup**: Mock database and external services

## 📈 Test Categories

### 1. Controller Tests
- **Functionality**: All CRUD operations
- **Validation**: Input validation and sanitization
- **Error Handling**: Database errors, validation errors
- **Edge Cases**: Boundary values, null/undefined inputs
- **Security**: SQL injection, XSS prevention

### 2. Model Tests
- **Data Validation**: Required fields, data types
- **Constraints**: Unique constraints, foreign keys
- **Business Logic**: Pricing calculations, seasonal pricing
- **Edge Cases**: Extreme values, Unicode characters
- **Type Safety**: String to number conversions

### 3. API Integration Tests
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Success, client errors, server errors
- **Response Format**: JSON structure, pagination
- **Authentication**: JWT validation, role-based access
- **CORS**: Cross-origin request handling

### 4. Load Tests
- **Throughput**: Requests per second
- **Latency**: Response time percentiles
- **Concurrency**: Simultaneous user simulation
- **Resource Usage**: Memory, CPU utilization
- **Stress Testing**: Breaking point identification

## 🎯 Test Scenarios Covered

### Car Management
- ✅ List cars with pagination
- ✅ Filter cars by criteria
- ✅ Get car by ID
- ✅ Create new car
- ✅ Update car details
- ✅ Delete car (with constraints)
- ✅ Seasonal pricing calculations
- ✅ Currency conversion

### Booking Management
- ✅ Create car rental bookings
- ✅ Create transfer bookings
- ✅ Validate booking data
- ✅ Check availability
- ✅ Update booking status
- ✅ Cancel bookings
- ✅ Date validation
- ✅ Price calculations

### Admin Dashboard
- ✅ Dashboard statistics
- ✅ Recent bookings
- ✅ Revenue calculations
- ✅ Performance metrics

### Error Scenarios
- ✅ Invalid input data
- ✅ Missing required fields
- ✅ Database connection failures
- ✅ Network timeouts
- ✅ Malformed requests
- ✅ Security attacks

### Edge Cases
- ✅ Boundary values (min/max)
- ✅ Empty responses
- ✅ Large datasets
- ✅ Unicode characters
- ✅ Concurrent requests
- ✅ Memory leaks

## 📊 Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Controllers | 95%+ |
| Models | 90%+ |
| Routes | 85%+ |
| Utilities | 80%+ |
| Overall | 85%+ |

## 🔍 Running Specific Tests

### By Pattern
```bash
# Test specific controller
npx jest carController

# Test specific model
npx jest Car.test.js

# Test specific endpoint
npx jest --testNamePattern="GET /api/cars"
```

### By Tag
```bash
# Run only fast tests
npx jest --testPathPattern="unit"

# Run only slow tests
npx jest --testPathPattern="integration|load"
```

### Debug Mode
```bash
# Run with verbose output
npx jest --verbose

# Run with debug information
npx jest --detectOpenHandles

# Run single test file
npx jest tests/controllers/carController.test.js
```

## 🚨 Performance Benchmarks

### Response Time Targets
- **GET requests**: < 200ms average
- **POST requests**: < 500ms average
- **Complex queries**: < 1000ms average

### Throughput Targets
- **Read operations**: 1000+ req/sec
- **Write operations**: 200+ req/sec
- **Mixed workload**: 500+ req/sec

### Concurrency Targets
- **100 concurrent users**: < 2x response time
- **500 concurrent users**: < 5x response time
- **1000 concurrent users**: Graceful degradation

## 🛠️ Troubleshooting

### Common Issues

1. **Test Database Connection**
   ```bash
   # Check PostgreSQL connection
   psql -h localhost -U test_user -d rentaly_test
   ```

2. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm test
   ```

3. **Timeout Issues**
   ```bash
   # Increase Jest timeout
   jest --testTimeout=60000
   ```

### Debug Tips
- Use `console.log` in tests for debugging
- Check test setup in `setup.js`
- Verify mock configurations
- Use `--verbose` flag for detailed output

## 📝 Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add appropriate mocks for external dependencies
3. Include both positive and negative test cases
4. Update this README if adding new test categories
5. Ensure tests are deterministic and isolated

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest API](https://github.com/visionmedia/supertest)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)