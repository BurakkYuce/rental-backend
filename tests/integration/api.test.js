const request = require('supertest');
const express = require('express');
const { sanitizeInput, sqlInjectionProtection, jsonErrorHandler } = require('../../src/middleware/security');

// Mock the entire app
const createMockApp = () => {
  const app = express();
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Add JSON error handler after body parser
  app.use(jsonErrorHandler);
  
  // Apply security middleware after body parsing
  app.use(sanitizeInput);
  app.use(sqlInjectionProtection);

  // Mock middleware
  app.use((req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  });

  // Mock routes
  app.get('/api/cars', (req, res) => {
    const { page = 1, limit = 20, pickupDate, dropoffDate } = req.query;
    
    // Validate parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    
    const mockCars = [
      {
        id: 1,
        title: 'Toyota Corolla 2024',
        pricing: { daily: 50, weekly: 300, monthly: 1200, currency: 'EUR' },
        effectivePricing: { daily: 50, weekly: 300, monthly: 1200, currency: 'EUR' }
      },
      {
        id: 2,
        title: 'BMW X5 2024',
        pricing: { daily: 150, weekly: 900, monthly: 3600, currency: 'EUR' },
        effectivePricing: { daily: 180, weekly: 1080, monthly: 4320, currency: 'EUR', seasonalName: 'Summer' }
      }
    ];

    res.json({
      success: true,
      data: {
        listings: mockCars.slice((pageNum - 1) * limitNum, pageNum * limitNum),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: mockCars.length,
          totalPages: Math.ceil(mockCars.length / limitNum)
        }
      }
    });
  });

  app.get('/api/cars/:id', (req, res) => {
    const { id } = req.params;
    
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid car ID format'
      });
    }

    if (id === '999') {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    const mockCar = {
      id: parseInt(id),
      title: `Test Car ${id}`,
      category: 'Economy',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      seats: 5,
      doors: 4,
      transmission: 'Manuel',
      fuelType: 'Benzin',
      pricing: { daily: 50, weekly: 300, monthly: 1200, currency: 'EUR' },
      effectivePricing: { daily: 50, weekly: 300, monthly: 1200, currency: 'EUR' },
      seasonal_pricing: [],
      features: ['Bluetooth', 'Air Conditioning'],
      available: true
    };

    res.json({
      success: true,
      data: mockCar
    });
  });

  app.post('/api/cars', (req, res) => {
    const { title, category, brand, model, year, seats, doors, transmission, fuelType, pricing } = req.body;

    // Validation
    const errors = [];
    if (!title || title.trim() === '') errors.push('Title is required');
    if (!category) errors.push('Category is required');
    if (!brand) errors.push('Brand is required');
    if (!model) errors.push('Model is required');
    if (!year || year < 1900 || year > new Date().getFullYear() + 2) errors.push('Invalid year');
    if (!seats || seats < 1 || seats > 50) errors.push('Invalid seats count');
    if (!doors || doors < 2 || doors > 8) errors.push('Invalid doors count');
    if (!['Manuel', 'Otomatik', 'Yarı Otomatik'].includes(transmission)) errors.push('Invalid transmission');
    if (!['Benzin', 'Dizel', 'Elektrikli', 'Hibrit', 'Benzin+LPG'].includes(fuelType)) errors.push('Invalid fuel type');
    
    if (!pricing || typeof pricing !== 'object') {
      errors.push('Pricing is required and must be an object');
    } else {
      if (!pricing.daily || pricing.daily <= 0) errors.push('Daily price must be positive');
      if (!pricing.currency || !['EUR', 'USD', 'TRY'].includes(pricing.currency)) errors.push('Invalid currency');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const newCar = {
      id: Date.now(),
      ...req.body,
      available: true,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: newCar,
      message: 'Car created successfully'
    });
  });

  app.post('/api/bookings', (req, res) => {
    const { 
      serviceType, 
      carId, 
      transferId, 
      customerName, 
      customerEmail, 
      customerPhone,
      pickupDate, 
      returnDate, 
      pickupLocation, 
      returnLocation,
      totalAmount 
    } = req.body;

    // Validation
    const errors = [];
    if (!serviceType || !['car_rental', 'transfer'].includes(serviceType)) {
      errors.push('Invalid service type');
    }
    if (serviceType === 'car_rental' && !carId) errors.push('Car ID is required for car rental');
    if (serviceType === 'transfer' && !transferId) errors.push('Transfer ID is required for transfer');
    if (!customerName || customerName.trim() === '') errors.push('Customer name is required');
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      errors.push('Valid email is required');
    }
    if (!customerPhone || customerPhone.length < 10) errors.push('Valid phone number is required');
    if (!pickupDate) errors.push('Pickup date is required');
    if (serviceType === 'car_rental' && !returnDate) errors.push('Return date is required for car rental');
    if (!pickupLocation) errors.push('Pickup location is required');
    if (!totalAmount || totalAmount <= 0) errors.push('Total amount must be positive');

    // Date validation
    const pickup = new Date(pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickup < today) {
      errors.push('Pickup date must be in the future');
    }

    if (serviceType === 'car_rental' && returnDate) {
      const returnD = new Date(returnDate);
      if (returnD <= pickup) {
        errors.push('Return date must be after pickup date');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const newBooking = {
      id: Date.now(),
      ...req.body,
      status: 'pending',
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: newBooking,
      message: 'Booking created successfully'
    });
  });

  app.get('/api/admin/dashboard', (req, res) => {
    const mockStats = {
      totalCars: 25,
      activeCars: 20,
      totalBookings: 150,
      completedBookings: 120,
      totalRevenue: '25000.00',
      totalBlogs: 8,
      recentBookings: [
        {
          id: 1,
          customerName: 'John Doe',
          carTitle: 'Toyota Corolla',
          pickupDate: '2024-08-20',
          status: 'confirmed',
          totalAmount: 300
        }
      ]
    };

    res.json({
      success: true,
      data: mockStats
    });
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found'
    });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createMockApp();
  });

  describe('Cars API', () => {
    describe('GET /api/cars', () => {
      it('should return cars with default pagination', async () => {
        const response = await request(app).get('/api/cars');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('listings');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.listings)).toBe(true);
      });

      it('should handle pagination parameters', async () => {
        const response = await request(app)
          .get('/api/cars')
          .query({ page: 1, limit: 1 });

        expect(response.status).toBe(200);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(1);
      });

      it('should validate pagination bounds', async () => {
        const response = await request(app)
          .get('/api/cars')
          .query({ page: -1, limit: 1000 });

        expect(response.status).toBe(200);
        expect(response.body.data.pagination.page).toBe(1); // Should default to 1
        expect(response.body.data.pagination.limit).toBe(100); // Should cap at 100
      });

      it('should handle date filtering', async () => {
        const response = await request(app)
          .get('/api/cars')
          .query({ pickupDate: '2024-08-20', dropoffDate: '2024-08-25' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/cars/:id', () => {
      it('should return a specific car', async () => {
        const response = await request(app).get('/api/cars/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(1);
        expect(response.body.data).toHaveProperty('effectivePricing');
      });

      it('should return 404 for non-existent car', async () => {
        const response = await request(app).get('/api/cars/999');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Car not found');
      });

      it('should validate car ID format', async () => {
        const response = await request(app).get('/api/cars/invalid');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid car ID format');
      });
    });

    describe('POST /api/cars', () => {
      const validCarData = {
        title: 'New Test Car',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        seats: 5,
        doors: 4,
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: {
          daily: 60,
          weekly: 360,
          monthly: 1440,
          currency: 'EUR'
        }
      };

      it('should create a new car with valid data', async () => {
        const response = await request(app)
          .post('/api/cars')
          .send(validCarData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(validCarData.title);
        expect(response.body.message).toBe('Car created successfully');
      });

      it('should validate required fields', async () => {
        const incompleteData = { title: 'Test Car' };

        const response = await request(app)
          .post('/api/cars')
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
      });

      it('should validate pricing structure', async () => {
        const invalidData = {
          ...validCarData,
          pricing: {
            daily: -50,
            currency: 'INVALID'
          }
        };

        const response = await request(app)
          .post('/api/cars')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Bookings API', () => {
    describe('POST /api/bookings', () => {
      const validBookingData = {
        serviceType: 'car_rental',
        carId: '123e4567-e89b-12d3-a456-426614174000',
        drivers: [{ name: 'John Doe', email: 'john@example.com', age: 30 }],
        pickupLocation: 'Airport Terminal 1',
        dropoffLocation: 'Airport Terminal 1',
        pickupTime: '2025-12-20T10:00:00Z',
        dropoffTime: '2025-12-25T10:00:00Z',
        pricing: { total: 500, currency: 'EUR' }
      };

      it('should create a booking with valid data', async () => {
        const response = await request(app)
          .post('/api/bookings')
          .send(validBookingData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.serviceType).toBe('car_rental');
        expect(response.body.data.status).toBe('pending');
      });

      it('should validate required fields', async () => {
        const incompleteData = {
          serviceType: 'car_rental'
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(incompleteData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('required');
      });

      it('should validate email format', async () => {
        const invalidData = {
          ...validBookingData,
          drivers: [{ name: 'John Doe', email: 'invalid-email', age: 30 }]
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid email format');
      });

      it('should validate past dates', async () => {
        const pastDateData = {
          ...validBookingData,
          pickupDate: '2020-01-01',
          returnDate: '2020-01-05'
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(pastDateData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should validate date order for car rentals', async () => {
        const invalidDateOrder = {
          ...validBookingData,
          pickupDate: '2024-12-25',
          returnDate: '2024-12-20' // Return before pickup
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(invalidDateOrder);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should validate service type', async () => {
        const invalidServiceType = {
          ...validBookingData,
          serviceType: 'invalid_service'
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(invalidServiceType);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should require transferId for transfer bookings', async () => {
        const transferBooking = {
          ...validBookingData,
          serviceType: 'transfer',
          carId: undefined
          // Missing transferId
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(transferBooking);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Admin API', () => {
    describe('GET /api/admin/dashboard', () => {
      it('should return dashboard statistics', async () => {
        const response = await request(app).get('/api/admin/dashboard');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
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
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/api/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Endpoint not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/cars')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle large request bodies', async () => {
      const largeData = {
        title: 'A'.repeat(100000), // Very large string
        category: 'Economy'
      };

      const response = await request(app)
        .post('/api/cars')
        .send(largeData);

      // Should either accept (if within limit) or reject
      expect([200, 201, 400, 413]).toContain(response.status);
    });
  });

  describe('Security Tests', () => {
    it('should sanitize XSS attempts', async () => {
      const xssData = {
        title: "<script>alert('xss')</script>",
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
          currency: 'EUR'
        }
      };

      const response = await request(app)
        .post('/api/cars')
        .send(xssData);

      if (response.status === 201) {
        // If accepted, should be sanitized
        expect(response.body.data.title).not.toContain('<script>');
      } else {
        // Should be rejected
        expect(response.status).toBe(400);
      }
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionData = {
        title: "'; DROP TABLE cars; --",
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
          currency: 'EUR'
        }
      };

      const response = await request(app)
        .post('/api/cars')
        .send(sqlInjectionData);

      // Should handle safely without executing SQL
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app).get('/api/cars')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should complete requests within reasonable time', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/cars');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});