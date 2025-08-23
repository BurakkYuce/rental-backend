const request = require('supertest');
const express = require('express');
const { measurePerformance, getMemoryUsage } = require('../helpers/testUtils');

// Create a more realistic mock app for load testing
const createLoadTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Simulate some processing delay
  const simulateProcessing = (ms = 10) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  // Mock database with some complexity
  let mockDatabase = {
    cars: Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      title: `Car ${i + 1}`,
      pricing: { daily: 50 + i, currency: 'EUR' },
      available: Math.random() > 0.1 // 90% available
    })),
    bookings: [],
    requestCount: 0
  };
  
  app.get('/api/cars', async (req, res) => {
    await simulateProcessing(Math.random() * 20); // 0-20ms delay
    mockDatabase.requestCount++;
    
    const { page = 1, limit = 20 } = req.query;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    
    const cars = mockDatabase.cars.slice(start, end);
    
    res.json({
      success: true,
      data: {
        listings: cars,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockDatabase.cars.length,
          totalPages: Math.ceil(mockDatabase.cars.length / limit)
        }
      }
    });
  });
  
  app.get('/api/cars/:id', async (req, res) => {
    await simulateProcessing(Math.random() * 15);
    mockDatabase.requestCount++;
    
    const { id } = req.params;
    const car = mockDatabase.cars.find(c => c.id === parseInt(id));
    
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }
    
    res.json({
      success: true,
      data: car
    });
  });
  
  app.post('/api/bookings', async (req, res) => {
    await simulateProcessing(Math.random() * 50); // Longer for write operations
    mockDatabase.requestCount++;
    
    const booking = {
      id: mockDatabase.bookings.length + 1,
      ...req.body,
      createdAt: new Date()
    };
    
    mockDatabase.bookings.push(booking);
    
    res.status(201).json({
      success: true,
      data: booking
    });
  });
  
  app.get('/api/stats', (req, res) => {
    res.json({
      requestCount: mockDatabase.requestCount,
      totalCars: mockDatabase.cars.length,
      totalBookings: mockDatabase.bookings.length,
      memoryUsage: getMemoryUsage()
    });
  });
  
  return app;
};

describe('Load Testing', () => {
  let app;
  
  beforeAll(() => {
    app = createLoadTestApp();
  });
  
  describe('Single Endpoint Load Tests', () => {
    it('should handle 100 concurrent GET /api/cars requests', async () => {
      const concurrentRequests = 100;
      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app).get('/api/cars')
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;
      
      console.log(`\n📊 Load Test Results - GET /api/cars:`);
      console.log(`   Concurrent Requests: ${concurrentRequests}`);
      console.log(`   Total Time: ${totalTime}ms`);
      console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      // Performance assertions
      expect(avgResponseTime).toBeLessThan(500); // Average response should be under 500ms
      expect(totalTime).toBeLessThan(5000); // Total should be under 5 seconds
    });
    
    it('should handle 50 concurrent POST /api/bookings requests', async () => {
      const concurrentRequests = 50;
      const bookingData = {
        serviceType: 'car_rental',
        carId: 1,
        customerName: 'Load Test User',
        customerEmail: 'loadtest@example.com',
        customerPhone: '+1234567890',
        pickupDate: '2024-12-20',
        returnDate: '2024-12-25',
        pickupLocation: 'Airport',
        returnLocation: 'Airport',
        totalAmount: 500
      };
      
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/bookings')
          .send({
            ...bookingData,
            customerEmail: `loadtest${i}@example.com`
          })
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;
      
      console.log(`\n📊 Load Test Results - POST /api/bookings:`);
      console.log(`   Concurrent Requests: ${concurrentRequests}`);
      console.log(`   Total Time: ${totalTime}ms`);
      console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
      
      // Performance assertions
      expect(avgResponseTime).toBeLessThan(1000); // Average response should be under 1 second
      expect(totalTime).toBeLessThan(10000); // Total should be under 10 seconds
    });
  });
  
  describe('Mixed Load Tests', () => {
    it('should handle mixed read/write operations', async () => {
      const readRequests = 80;
      const writeRequests = 20;
      
      const reads = Array.from({ length: readRequests }, () =>
        request(app).get('/api/cars')
      );
      
      const writes = Array.from({ length: writeRequests }, (_, i) =>
        request(app)
          .post('/api/bookings')
          .send({
            serviceType: 'car_rental',
            carId: Math.floor(Math.random() * 100) + 1,
            customerName: `Mixed Test User ${i}`,
            customerEmail: `mixedtest${i}@example.com`,
            customerPhone: '+1234567890',
            pickupDate: '2024-12-20',
            returnDate: '2024-12-25',
            pickupLocation: 'Airport',
            returnLocation: 'Airport',
            totalAmount: 500
          })
      );
      
      const allRequests = [...reads, ...writes];
      
      const startTime = Date.now();
      const responses = await Promise.all(allRequests);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / allRequests.length;
      
      console.log(`\n📊 Mixed Load Test Results:`);
      console.log(`   Read Requests: ${readRequests}`);
      console.log(`   Write Requests: ${writeRequests}`);
      console.log(`   Total Time: ${totalTime}ms`);
      console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      
      // Check success rates
      const successfulReads = responses.slice(0, readRequests).filter(r => r.status === 200);
      const successfulWrites = responses.slice(readRequests).filter(r => r.status === 201);
      
      expect(successfulReads.length).toBe(readRequests);
      expect(successfulWrites.length).toBe(writeRequests);
      
      // Performance assertions
      expect(avgResponseTime).toBeLessThan(800);
    });
  });
  
  describe('Pagination Load Tests', () => {
    it('should handle pagination under load', async () => {
      const totalPages = 10;
      const requestsPerPage = 10;
      
      const requests = [];
      
      for (let page = 1; page <= totalPages; page++) {
        for (let i = 0; i < requestsPerPage; i++) {
          requests.push(
            request(app)
              .get('/api/cars')
              .query({ page, limit: 20 })
          );
        }
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      
      console.log(`\n📊 Pagination Load Test Results:`);
      console.log(`   Total Requests: ${requests.length}`);
      console.log(`   Pages Tested: ${totalPages}`);
      console.log(`   Requests per Page: ${requestsPerPage}`);
      console.log(`   Total Time: ${totalTime}ms`);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.pagination).toBeDefined();
      });
    });
  });
  
  describe('Performance Benchmarks', () => {
    it('should measure GET /api/cars performance', async () => {
      const performance = await measurePerformance(
        () => request(app).get('/api/cars'),
        50
      );
      
      console.log(`\n📈 Performance Benchmark - GET /api/cars:`);
      console.log(`   Min Response Time: ${performance.min.toFixed(2)}ms`);
      console.log(`   Max Response Time: ${performance.max.toFixed(2)}ms`);
      console.log(`   Average Response Time: ${performance.avg.toFixed(2)}ms`);
      console.log(`   Median Response Time: ${performance.median.toFixed(2)}ms`);
      
      // Performance thresholds
      expect(performance.avg).toBeLessThan(200);
      expect(performance.max).toBeLessThan(1000);
    });
    
    it('should measure POST /api/bookings performance', async () => {
      const bookingData = {
        serviceType: 'car_rental',
        carId: 1,
        customerName: 'Benchmark User',
        customerEmail: 'benchmark@example.com',
        customerPhone: '+1234567890',
        pickupDate: '2024-12-20',
        returnDate: '2024-12-25',
        pickupLocation: 'Airport',
        returnLocation: 'Airport',
        totalAmount: 500
      };
      
      const performance = await measurePerformance(
        () => request(app).post('/api/bookings').send({
          ...bookingData,
          customerEmail: `benchmark${Date.now()}@example.com`
        }),
        30
      );
      
      console.log(`\n📈 Performance Benchmark - POST /api/bookings:`);
      console.log(`   Min Response Time: ${performance.min.toFixed(2)}ms`);
      console.log(`   Max Response Time: ${performance.max.toFixed(2)}ms`);
      console.log(`   Average Response Time: ${performance.avg.toFixed(2)}ms`);
      console.log(`   Median Response Time: ${performance.median.toFixed(2)}ms`);
      
      // Performance thresholds for write operations
      expect(performance.avg).toBeLessThan(500);
      expect(performance.max).toBeLessThan(2000);
    });
  });
  
  describe('Memory Usage Tests', () => {
    it('should monitor memory usage under load', async () => {
      const initialMemory = getMemoryUsage();
      console.log(`\n🧠 Initial Memory Usage:`);
      console.log(`   RSS: ${initialMemory.rss}MB`);
      console.log(`   Heap Used: ${initialMemory.heapUsed}MB`);
      
      // Generate load
      const requests = Array.from({ length: 200 }, () =>
        request(app).get('/api/cars')
      );
      
      await Promise.all(requests);
      
      const finalMemory = getMemoryUsage();
      console.log(`\n🧠 Final Memory Usage:`);
      console.log(`   RSS: ${finalMemory.rss}MB`);
      console.log(`   Heap Used: ${finalMemory.heapUsed}MB`);
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      console.log(`   Memory Increase: ${memoryIncrease}MB`);
      
      // Memory should not increase dramatically
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });
  });
  
  describe('Error Rate Tests', () => {
    it('should maintain low error rate under stress', async () => {
      const totalRequests = 500;
      const requests = [];
      
      // Mix of valid and some potentially problematic requests
      for (let i = 0; i < totalRequests; i++) {
        if (i % 50 === 0) {
          // Occasionally request non-existent car
          requests.push(request(app).get(`/api/cars/999${i}`));
        } else {
          requests.push(request(app).get('/api/cars'));
        }
      }
      
      const responses = await Promise.all(requests.map(req => 
        req.catch(err => ({ status: 500, error: err }))
      ));
      
      const successfulResponses = responses.filter(r => r.status === 200);
      const notFoundResponses = responses.filter(r => r.status === 404);
      const errorResponses = responses.filter(r => r.status >= 500);
      
      const successRate = (successfulResponses.length / totalRequests) * 100;
      const errorRate = (errorResponses.length / totalRequests) * 100;
      
      console.log(`\n📊 Error Rate Test Results:`);
      console.log(`   Total Requests: ${totalRequests}`);
      console.log(`   Successful (200): ${successfulResponses.length}`);
      console.log(`   Not Found (404): ${notFoundResponses.length}`);
      console.log(`   Errors (5xx): ${errorResponses.length}`);
      console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`   Error Rate: ${errorRate.toFixed(2)}%`);
      
      // Error rate should be very low
      expect(errorRate).toBeLessThan(1); // Less than 1% error rate
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
    });
  });
});

// Optional: Run load tests only when specifically requested
if (process.env.RUN_LOAD_TESTS !== 'true') {
  describe.skip('Load Testing (Skipped)', () => {
    it('Load tests are skipped. Set RUN_LOAD_TESTS=true to run them.', () => {
      console.log('💡 To run load tests: RUN_LOAD_TESTS=true npm test');
    });
  });
}