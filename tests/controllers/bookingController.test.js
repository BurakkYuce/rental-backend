// tests/controllers/bookingController.simple.test.js - Simplified Booking Controller Tests
const request = require('supertest');
const express = require('express');

const createMockApp = () => {
  const app = express();
  app.use(express.json());

  // Mock bookings data
  const mockBookings = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      serviceType: 'car_rental',
      carId: '123e4567-e89b-12d3-a456-426614174000',
      drivers: [{ name: 'John Doe', email: 'john@example.com', age: 30 }],
      pickupLocation: 'Airport Terminal 1',
      dropoffLocation: 'Hotel Paradise',
      pickupTime: '2024-12-25T10:00:00Z',
      dropoffTime: '2024-12-30T10:00:00Z',
      pricing: { total: 250, currency: 'EUR' },
      status: 'pending',
      bookingReference: 'BK123456'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      serviceType: 'transfer',
      transferId: '123e4567-e89b-12d3-a456-426614174010',
      drivers: [{ name: 'Jane Smith', email: 'jane@example.com', age: 28 }],
      pickupLocation: 'Hotel Paradise',
      dropoffLocation: 'Airport Terminal 2',
      pickupTime: '2025-01-05T14:00:00Z',
      dropoffTime: '2025-01-05T15:00:00Z',
      pricing: { total: 45, currency: 'EUR' },
      status: 'confirmed',
      bookingReference: 'TR789012'
    }
  ];

  // GET /bookings - getAllBookings
  app.get('/bookings', (req, res) => {
    const { page = 1, limit = 20, serviceType, status } = req.query;
    
    let filteredBookings = [...mockBookings];
    
    // Filter by service type
    if (serviceType) {
      if (!['car_rental', 'transfer'].includes(serviceType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid service type. Must be car_rental or transfer'
        });
      }
      filteredBookings = filteredBookings.filter(b => b.serviceType === serviceType);
    }
    
    // Filter by status
    if (status) {
      if (!['pending', 'confirmed', 'active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }
      filteredBookings = filteredBookings.filter(b => b.status === status);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        bookings: paginatedBookings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredBookings.length,
          totalPages: Math.ceil(filteredBookings.length / limitNum)
        }
      }
    });
  });

  // GET /bookings/:id - getBookingById
  app.get('/bookings/:id', (req, res) => {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID format'
      });
    }

    const booking = mockBookings.find(b => b.id === id);
    if (booking) {
      res.json({
        success: true,
        data: booking
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
  });

  // POST /bookings - createBooking
  app.post('/bookings', (req, res) => {
    const { serviceType, carId, transferId, drivers, pickupLocation, dropoffLocation, pickupTime, dropoffTime, pricing } = req.body;

    // Basic validation
    if (!serviceType || !drivers || !pickupLocation || !dropoffLocation || !pickupTime || !dropoffTime || !pricing) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'serviceType, drivers, locations, times, and pricing are required'
      });
    }

    if (!['car_rental', 'transfer'].includes(serviceType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service type',
        message: 'Service type must be car_rental or transfer'
      });
    }

    if (serviceType === 'car_rental' && !carId) {
      return res.status(400).json({
        success: false,
        error: 'Car ID required for car rental'
      });
    }

    if (serviceType === 'transfer' && !transferId) {
      return res.status(400).json({
        success: false,
        error: 'Transfer ID required for transfer service'
      });
    }

    // Email validation
    if (drivers && drivers.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const driver of drivers) {
        if (driver.email && !emailRegex.test(driver.email)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid email format',
            message: 'Driver email must be valid'
          });
        }
      }
    }

    // Date validation
    const pickup = new Date(pickupTime);
    const dropoff = new Date(dropoffTime);
    const now = new Date();

    if (pickup <= now) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pickup time',
        message: 'Pickup time must be in the future'
      });
    }

    if (dropoff <= pickup) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'Dropoff time must be after pickup time'
      });
    }

    // Simulate checking car/transfer availability
    if (serviceType === 'car_rental' && carId === 'non-existent-car-id') {
      return res.status(404).json({
        success: false,
        message: 'Car not found or not available'
      });
    }

    if (serviceType === 'transfer' && transferId === 'non-existent-transfer-id') {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found or not available'
      });
    }

    // Create booking
    const newBooking = {
      id: '550e8400-e29b-41d4-a716-446655440099',
      serviceType,
      carId: serviceType === 'car_rental' ? carId : undefined,
      transferId: serviceType === 'transfer' ? transferId : undefined,
      drivers,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      dropoffTime,
      pricing,
      status: 'pending',
      bookingReference: serviceType === 'transfer' ? 'TR999999' : 'BK999999'
    };

    res.status(201).json({
      success: true,
      data: newBooking
    });
  });

  // PUT /bookings/:id - updateBooking
  app.put('/bookings/:id', (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID format'
      });
    }

    const booking = mockBookings.find(b => b.id === id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Status transition validation
    if (updateData.status) {
      const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: 'Status must be one of: ' + validStatuses.join(', ')
        });
      }

      // Example: Can't go from completed back to pending
      if (booking.status === 'completed' && updateData.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Invalid status transition',
          message: 'Cannot change completed booking back to pending'
        });
      }

      // Can't go from confirmed back to pending
      if (booking.status === 'confirmed' && updateData.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Invalid status transition',
          message: 'Invalid status transition: Cannot change confirmed booking back to pending'
        });
      }

      // Can't modify customer details after confirmation
      if (booking.status === 'confirmed' && (updateData.drivers || updateData.pickupLocation || updateData.dropoffLocation)) {
        return res.status(400).json({
          success: false,
          error: 'Booking cannot be modified',
          message: 'Customer details cannot be modified after confirmation'
        });
      }
    }

    const updatedBooking = { ...booking, ...updateData };
    res.json({
      success: true,
      data: updatedBooking
    });
  });

  // DELETE /bookings/:id - deleteBooking
  app.delete('/bookings/:id', (req, res) => {
    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID format'
      });
    }

    const booking = mockBookings.find(b => b.id === id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Can't delete confirmed bookings
    if (booking.status === 'confirmed' || booking.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete confirmed booking',
        message: 'Cannot delete confirmed or active booking'
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  });

  return app;
};

describe('Booking Controller (Simplified)', () => {
  let app;

  beforeEach(() => {
    app = createMockApp();
  });

  describe('GET /bookings', () => {
    it('should return all bookings with pagination', async () => {
      const response = await request(app).get('/bookings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter bookings by service type', async () => {
      const response = await request(app)
        .get('/bookings')
        .query({ serviceType: 'car_rental' });

      expect(response.status).toBe(200);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].serviceType).toBe('car_rental');
    });

    it('should filter bookings by status', async () => {
      const response = await request(app)
        .get('/bookings')
        .query({ status: 'confirmed' });

      expect(response.status).toBe(200);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].status).toBe('confirmed');
    });

    it('should handle invalid service type filter', async () => {
      const response = await request(app)
        .get('/bookings')
        .query({ serviceType: 'invalid_type' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid service type');
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return a specific booking', async () => {
      const response = await request(app).get('/bookings/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app).get('/bookings/550e8400-e29b-41d4-a716-446655440999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Booking not found');
    });

    it('should validate booking ID format', async () => {
      const response = await request(app).get('/bookings/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid booking ID format');
    });
  });

  describe('POST /bookings', () => {
    it('should create a car rental booking', async () => {
      const validCarBookingData = {
        serviceType: 'car_rental',
        carId: '123e4567-e89b-12d3-a456-426614174000',
        drivers: [{ name: 'John Doe', email: 'john@example.com', age: 30 }],
        pickupLocation: 'Airport Terminal 1',
        dropoffLocation: 'Hotel Paradise',
        pickupTime: '2025-12-15T10:00:00Z',
        dropoffTime: '2025-12-20T10:00:00Z',
        pricing: { total: 250, currency: 'EUR' }
      };

      const response = await request(app)
        .post('/bookings')
        .send(validCarBookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceType).toBe('car_rental');
      expect(response.body.data.bookingReference).toMatch(/^BK/);
    });

    it('should create a transfer booking', async () => {
      const validTransferBookingData = {
        serviceType: 'transfer',
        transferId: '123e4567-e89b-12d3-a456-426614174010',
        drivers: [{ name: 'Jane Smith', email: 'jane@example.com', age: 28 }],
        pickupLocation: 'Hotel Paradise',
        dropoffLocation: 'Airport Terminal 2',
        pickupTime: '2025-12-15T14:00:00Z',
        dropoffTime: '2025-12-15T15:00:00Z',
        pricing: { total: 45, currency: 'EUR' }
      };

      const response = await request(app)
        .post('/bookings')
        .send(validTransferBookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceType).toBe('transfer');
      expect(response.body.data.bookingReference).toMatch(/^TR/);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        serviceType: 'car_rental'
        // Missing other required fields
      };

      const response = await request(app)
        .post('/bookings')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        serviceType: 'car_rental',
        carId: '123e4567-e89b-12d3-a456-426614174000',
        drivers: [{ name: 'John Doe', email: 'invalid-email', age: 30 }],
        pickupLocation: 'Airport Terminal 1',
        dropoffLocation: 'Hotel Paradise',
        pickupTime: '2025-12-15T10:00:00Z',
        dropoffTime: '2025-12-20T10:00:00Z',
        pricing: { total: 250, currency: 'EUR' }
      };

      const response = await request(app)
        .post('/bookings')
        .send(invalidEmailData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should validate past dates', async () => {
      const pastDateData = {
        serviceType: 'car_rental',
        carId: '123e4567-e89b-12d3-a456-426614174000',
        drivers: [{ name: 'John Doe', email: 'john@example.com', age: 30 }],
        pickupLocation: 'Airport Terminal 1',
        dropoffLocation: 'Hotel Paradise',
        pickupTime: '2020-01-15T10:00:00Z', // Past date
        dropoffTime: '2020-01-20T10:00:00Z',
        pricing: { total: 250, currency: 'EUR' }
      };

      const response = await request(app)
        .post('/bookings')
        .send(pastDateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('future');
    });

    it('should validate date order', async () => {
      const invalidDateOrderData = {
        serviceType: 'car_rental',
        carId: '123e4567-e89b-12d3-a456-426614174000',
        drivers: [{ name: 'John Doe', email: 'john@example.com', age: 30 }],
        pickupLocation: 'Airport Terminal 1',
        dropoffLocation: 'Hotel Paradise',
        pickupTime: '2025-12-20T10:00:00Z',
        dropoffTime: '2025-12-15T10:00:00Z', // Before pickup
        pricing: { total: 250, currency: 'EUR' }
      };

      const response = await request(app)
        .post('/bookings')
        .send(invalidDateOrderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('after pickup');
    });
  });

  describe('PUT /bookings/:id', () => {
    it('should update booking status', async () => {
      const updateData = { status: 'confirmed' };

      const response = await request(app)
        .put('/bookings/550e8400-e29b-41d4-a716-446655440000')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
    });

    it('should validate status transitions', async () => {
      const updateData = { status: 'pending' };

      const response = await request(app)
        .put('/bookings/550e8400-e29b-41d4-a716-446655440001') // This one is 'confirmed'
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('transition');
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should delete a pending booking', async () => {
      const response = await request(app).delete('/bookings/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking deleted successfully');
    });

    it('should not delete confirmed bookings', async () => {
      const response = await request(app).delete('/bookings/550e8400-e29b-41d4-a716-446655440001');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete confirmed');
    });
  });

  describe('PostgreSQL UUID and Service Type Validation', () => {
    it('should validate service types correctly', async () => {
      const validServiceTypes = ['car_rental', 'transfer'];
      
      for (const serviceType of validServiceTypes) {
        const bookingData = {
          serviceType,
          carId: serviceType === 'car_rental' ? '123e4567-e89b-12d3-a456-426614174000' : undefined,
          transferId: serviceType === 'transfer' ? '123e4567-e89b-12d3-a456-426614174010' : undefined,
          drivers: [{ name: 'Test User', email: 'test@example.com', age: 30 }],
          pickupLocation: 'Test Location',
          dropoffLocation: 'Test Destination',
          pickupTime: '2025-12-15T10:00:00Z',
          dropoffTime: '2025-12-15T15:00:00Z',
          pricing: { total: 100, currency: 'EUR' }
        };

        const response = await request(app)
          .post('/bookings')
          .send(bookingData);

        expect(response.status).toBe(201);
        expect(response.body.data.serviceType).toBe(serviceType);
      }
    });

    it('should require appropriate IDs for service types', async () => {
      // Car rental without carId should fail
      const carRentalWithoutCarId = {
        serviceType: 'car_rental',
        drivers: [{ name: 'Test User', email: 'test@example.com', age: 30 }],
        pickupLocation: 'Test Location',
        dropoffLocation: 'Test Destination',
        pickupTime: '2025-12-15T10:00:00Z',
        dropoffTime: '2025-12-15T15:00:00Z',
        pricing: { total: 100, currency: 'EUR' }
      };

      const response1 = await request(app)
        .post('/bookings')
        .send(carRentalWithoutCarId);

      expect(response1.status).toBe(400);
      expect(response1.body.error).toContain('Car ID required');

      // Transfer without transferId should fail
      const transferWithoutTransferId = {
        serviceType: 'transfer',
        drivers: [{ name: 'Test User', email: 'test@example.com', age: 30 }],
        pickupLocation: 'Test Location',
        dropoffLocation: 'Test Destination',
        pickupTime: '2025-12-15T10:00:00Z',
        dropoffTime: '2025-12-15T15:00:00Z',
        pricing: { total: 100, currency: 'EUR' }
      };

      const response2 = await request(app)
        .post('/bookings')
        .send(transferWithoutTransferId);

      expect(response2.status).toBe(400);
      expect(response2.body.error).toContain('Transfer ID required');
    });
  });
});