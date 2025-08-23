const request = require('supertest');
const express = require('express');
const adminController = require('../../src/controllers/adminController');

// Mock models
jest.mock('../../src/models', () => ({
  Car: {
    count: jest.fn(),
    findAll: jest.fn()
  },
  Booking: {
    count: jest.fn(),
    findAll: jest.fn(),
    sum: jest.fn()
  },
  Blog: {
    count: jest.fn()
  }
}));

const { Car, Booking, Blog } = require('../../src/models');

// Mock auth middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
};

// Create test app
const app = express();
app.use(express.json());
app.get('/admin/dashboard', mockAuthMiddleware, adminController.getDashboardStats);

describe('Admin Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /admin/dashboard - getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      // Mock data
      Car.count.mockResolvedValueOnce(25); // totalCars
      Car.count.mockResolvedValueOnce(20); // activeCars
      Booking.count.mockResolvedValueOnce(150); // totalBookings
      Booking.count.mockResolvedValueOnce(120); // completedBookings
      Booking.sum.mockResolvedValue(25000); // totalRevenue
      Blog.count.mockResolvedValue(8); // totalBlogs
      Booking.findAll.mockResolvedValue([
        {
          id: 1,
          customerName: 'John Doe',
          carTitle: 'Toyota Corolla',
          pickupDate: '2024-08-20',
          totalAmount: 300,
          status: 'confirmed',
          createdAt: new Date('2024-08-15')
        },
        {
          id: 2,
          customerName: 'Jane Smith',
          carTitle: 'Honda Civic',
          pickupDate: '2024-08-22',
          totalAmount: 450,
          status: 'pending',
          createdAt: new Date('2024-08-16')
        }
      ]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalCars: 25,
        activeCars: 20,
        totalBookings: 150,
        completedBookings: 120,
        totalRevenue: '25000.00',
        totalBlogs: 8
      });
      expect(response.body.data.recentBookings).toHaveLength(2);
    });

    it('should handle case when no data exists', async () => {
      // Mock empty data
      Car.count.mockResolvedValue(0);
      Booking.count.mockResolvedValue(0);
      Booking.sum.mockResolvedValue(0);
      Blog.count.mockResolvedValue(0);
      Booking.findAll.mockResolvedValue([]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalCars: 0,
        activeCars: 0,
        totalBookings: 0,
        completedBookings: 0,
        totalRevenue: '0.00',
        totalBlogs: 0,
        recentBookings: []
      });
    });

    it('should handle database errors gracefully', async () => {
      Car.count.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch dashboard statistics');
    });

    it('should handle partial database failures', async () => {
      // Some queries succeed, some fail
      Car.count.mockResolvedValueOnce(10); // totalCars succeeds
      Car.count.mockRejectedValueOnce(new Error('Failed')); // activeCars fails
      Booking.count.mockResolvedValue(5); // bookings succeed
      Booking.sum.mockResolvedValue(1000);
      Blog.count.mockResolvedValue(3);
      Booking.findAll.mockResolvedValue([]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle null/undefined values from database', async () => {
      Car.count.mockResolvedValue(null);
      Booking.count.mockResolvedValue(undefined);
      Booking.sum.mockResolvedValue(null);
      Blog.count.mockResolvedValue(0);
      Booking.findAll.mockResolvedValue([]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.data.totalCars).toBe(0);
      expect(response.body.data.totalBookings).toBe(0);
      expect(response.body.data.totalRevenue).toBe('0.00');
    });

    it('should format revenue correctly', async () => {
      Car.count.mockResolvedValue(1);
      Booking.count.mockResolvedValue(1);
      Booking.sum.mockResolvedValue(1234.56);
      Blog.count.mockResolvedValue(1);
      Booking.findAll.mockResolvedValue([]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.data.totalRevenue).toBe('1234.56');
    });

    it('should limit recent bookings to reasonable number', async () => {
      Car.count.mockResolvedValue(1);
      Booking.count.mockResolvedValue(1);
      Booking.sum.mockResolvedValue(1000);
      Blog.count.mockResolvedValue(1);

      // Mock large number of recent bookings
      const manyBookings = Array(50).fill(null).map((_, index) => ({
        id: index + 1,
        customerName: `Customer ${index + 1}`,
        carTitle: `Car ${index + 1}`,
        pickupDate: '2024-08-20',
        totalAmount: 100,
        status: 'confirmed',
        createdAt: new Date()
      }));

      Booking.findAll.mockResolvedValue(manyBookings);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.data.recentBookings.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Dashboard Statistics Edge Cases', () => {
    it('should handle very large numbers', async () => {
      Car.count.mockResolvedValue(999999);
      Booking.count.mockResolvedValue(1000000);
      Booking.sum.mockResolvedValue(99999999.99);
      Blog.count.mockResolvedValue(10000);
      Booking.findAll.mockResolvedValue([]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.data.totalCars).toBe(999999);
      expect(response.body.data.totalBookings).toBe(1000000);
      expect(response.body.data.totalRevenue).toBe('99999999.99');
    });

    it('should handle floating point precision in revenue', async () => {
      Car.count.mockResolvedValue(1);
      Booking.count.mockResolvedValue(1);
      Booking.sum.mockResolvedValue(123.456789);
      Blog.count.mockResolvedValue(1);
      Booking.findAll.mockResolvedValue([]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.data.totalRevenue).toBe('123.46'); // Should round to 2 decimal places
    });

    it('should handle concurrent dashboard requests', async () => {
      Car.count.mockResolvedValue(10);
      Booking.count.mockResolvedValue(20);
      Booking.sum.mockResolvedValue(5000);
      Blog.count.mockResolvedValue(5);
      Booking.findAll.mockResolvedValue([]);

      const requests = Array(5).fill().map(() =>
        request(app).get('/admin/dashboard')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle database timeout scenarios', async () => {
      Car.count.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(10), 35000))
      );

      const response = await request(app).get('/admin/dashboard');

      // Should timeout and return error
      expect(response.status).toBe(500);
    });

    it('should validate response data structure', async () => {
      Car.count.mockResolvedValue(5);
      Booking.count.mockResolvedValue(10);
      Booking.sum.mockResolvedValue(2000);
      Blog.count.mockResolvedValue(3);
      Booking.findAll.mockResolvedValue([
        {
          id: 1,
          customerName: 'Test User',
          carTitle: 'Test Car',
          pickupDate: '2024-08-20',
          totalAmount: 300,
          status: 'confirmed',
          createdAt: new Date()
        }
      ]);

      const response = await request(app).get('/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalCars');
      expect(response.body.data).toHaveProperty('activeCars');
      expect(response.body.data).toHaveProperty('totalBookings');
      expect(response.body.data).toHaveProperty('completedBookings');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('totalBlogs');
      expect(response.body.data).toHaveProperty('recentBookings');
      expect(Array.isArray(response.body.data.recentBookings)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should complete dashboard request within reasonable time', async () => {
      Car.count.mockResolvedValue(100);
      Booking.count.mockResolvedValue(500);
      Booking.sum.mockResolvedValue(50000);
      Blog.count.mockResolvedValue(25);
      Booking.findAll.mockResolvedValue([]);

      const startTime = Date.now();
      const response = await request(app).get('/admin/dashboard');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple simultaneous requests efficiently', async () => {
      Car.count.mockResolvedValue(50);
      Booking.count.mockResolvedValue(200);
      Booking.sum.mockResolvedValue(20000);
      Blog.count.mockResolvedValue(10);
      Booking.findAll.mockResolvedValue([]);

      const startTime = Date.now();
      const requests = Array(10).fill().map(() =>
        request(app).get('/admin/dashboard')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(endTime - startTime).toBeLessThan(10000); // All requests should complete within 10 seconds
    });
  });
});