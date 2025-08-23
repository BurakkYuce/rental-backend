// tests/security/security.test.js - Security Middleware Tests
const request = require('supertest');
const express = require('express');
const { 
  sanitizeInput, 
  sqlInjectionProtection, 
  jsonErrorHandler,
  pathTraversalProtection,
  requestSizeLimit,
  securityHeaders,
  purify
} = require('../../src/middleware/security');

describe('Security Middleware Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Input Sanitization', () => {
    beforeEach(() => {
      app.use(sanitizeInput);
      app.post('/test', (req, res) => {
        res.json({ body: req.body, query: req.query, params: req.params });
      });
    });

    it('should sanitize XSS attempts in request body', async () => {
      const maliciousInput = {
        title: '<script>alert("xss")</script>Test Title',
        description: '<img src="x" onerror="alert(1)">Description'
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousInput);

      expect(response.status).toBe(200);
      expect(response.body.body.title).not.toContain('<script>');
      expect(response.body.body.title).toBe('Test Title');
      expect(response.body.body.description).not.toContain('<img');
      expect(response.body.body.description).toBe('Description');
    });

    it('should sanitize nested objects', async () => {
      const maliciousInput = {
        user: {
          name: '<script>alert("nested")</script>John',
          preferences: {
            theme: '<style>body{display:none}</style>dark'
          }
        }
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousInput);

      expect(response.status).toBe(200);
      expect(response.body.body.user.name).toBe('John');
      expect(response.body.body.user.preferences.theme).toBe('dark');
    });

    it('should sanitize arrays', async () => {
      const maliciousInput = {
        tags: ['<script>evil</script>tag1', 'normal-tag', '<iframe>bad</iframe>tag2']
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousInput);

      expect(response.status).toBe(200);
      expect(response.body.body.tags).toEqual(['tag1', 'normal-tag', 'tag2']);
    });

    it('should preserve valid content', async () => {
      const validInput = {
        title: 'Valid Car Title',
        price: 100,
        features: ['GPS', 'Air Conditioning'],
        metadata: {
          year: 2022,
          brand: 'Toyota'
        }
      };

      const response = await request(app)
        .post('/test')
        .send(validInput);

      expect(response.status).toBe(200);
      expect(response.body.body).toEqual(validInput);
    });
  });

  describe('SQL Injection Protection', () => {
    beforeEach(() => {
      app.use(sqlInjectionProtection);
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should block obvious SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        { query: "'; DROP TABLE users; --" },
        { search: "1' OR '1'='1" },
        { filter: "admin'; DELETE FROM cars; --" },
        { name: "test' UNION SELECT * FROM passwords --" }
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/test')
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid input detected');
      }
    });

    it('should allow safe input', async () => {
      const safeInput = {
        name: 'John Doe',
        email: 'john@example.com',
        search: 'Toyota Camry 2022',
        description: 'A reliable family car with great fuel efficiency.'
      };

      const response = await request(app)
        .post('/test')
        .send(safeInput);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should block nested SQL injection attempts', async () => {
      const nestedPayload = {
        user: {
          preferences: {
            filter: "category = 'SUV' OR '1'='1'"
          }
        }
      };

      const response = await request(app)
        .post('/test')
        .send(nestedPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input detected');
    });
  });

  describe('JSON Error Handling', () => {
    beforeEach(() => {
      app.use(jsonErrorHandler);
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid JSON format');
      expect(response.body.message).toBe('Request body contains malformed JSON');
    });
  });

  describe('Path Traversal Protection', () => {
    beforeEach(() => {
      app.use(pathTraversalProtection);
      app.get('*', (req, res) => {
        res.json({ path: req.path });
      });
    });

    it.skip('should block path traversal attempts', async () => {
      const maliciousPaths = [
        '/api/../../../etc/passwd',
        '/api/cars/..%2F..%2Fetc%2Fpasswd',
        '/api/uploads/../../config/database.js',
        '/api/files/..\\..\\windows\\system32'
      ];

      for (const path of maliciousPaths) {
        const response = await request(app).get(path);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid path');
      }
    });

    it('should allow safe paths', async () => {
      const safePaths = [
        '/api/cars',
        '/api/bookings/123',
        '/api/uploads/image.jpg',
        '/api/admin/dashboard'
      ];

      for (const path of safePaths) {
        const response = await request(app).get(path);
        
        expect(response.status).toBe(200);
        expect(response.body.path).toBe(path);
      }
    });
  });

  describe('Security Headers', () => {
    beforeEach(() => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    it('should set security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should set correct header values', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('DOMPurify Integration', () => {
    it('should sanitize HTML content', () => {
      const dirtyHTML = '<script>alert("xss")</script><p>Clean content</p><img src="x" onerror="alert(1)">';
      const cleanHTML = purify.sanitize(dirtyHTML, { 
        ALLOWED_TAGS: ['p'], 
        ALLOWED_ATTR: [] 
      });

      expect(cleanHTML).not.toContain('<script>');
      expect(cleanHTML).not.toContain('<img');
      expect(cleanHTML).toContain('<p>Clean content</p>');
    });

    it('should remove all HTML when no tags are allowed', () => {
      const dirtyHTML = '<div><span>Text with <strong>formatting</strong></span></div>';
      const cleanText = purify.sanitize(dirtyHTML, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });

      expect(cleanText).toBe('Text with formatting');
      expect(cleanText).not.toContain('<');
      expect(cleanText).not.toContain('>');
    });
  });

  describe('Request Size Limits', () => {
    beforeEach(() => {
      app.use(requestSizeLimit);
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it.skip('should reject requests with oversized content-length header', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Length', '11000000') // 11MB, over the 10MB limit
        .send({ data: 'test' });

      expect(response.status).toBe(413);
      expect(response.body.error).toBe('Request too large');
    }, 5000); // 5 second timeout

    it('should allow requests within size limits', async () => {
      const response = await request(app)
        .post('/test')
        .send({ data: 'normal sized request' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      // Apply all security middleware
      app.use(requestSizeLimit);
      app.use(pathTraversalProtection);
      app.use(express.json());
      app.use(jsonErrorHandler);
      app.use(sqlInjectionProtection);
      app.use(sanitizeInput);
      
      app.post('/api/cars', (req, res) => {
        res.json({ success: true, data: req.body });
      });
    });

    it('should handle multiple security threats in single request', async () => {
      const maliciousPayload = {
        title: '<script>alert("xss")</script>Malicious Car',
        query: "'; DROP TABLE cars; --",
        description: '<img src="x" onerror="fetch(\'/api/admin/delete-all\')">'
      };

      const response = await request(app)
        .post('/api/cars')
        .send(maliciousPayload);

      // Should be blocked by SQL injection protection
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input detected');
    });

    it('should allow clean requests through all security layers', async () => {
      const cleanPayload = {
        title: 'Toyota Camry 2023',
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        description: 'A reliable and fuel-efficient sedan perfect for families.',
        features: ['Air Conditioning', 'GPS Navigation', 'Bluetooth']
      };

      const response = await request(app)
        .post('/api/cars')
        .send(cleanPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(cleanPayload);
    });
  });

  describe('Performance Tests', () => {
    beforeEach(() => {
      app.use(sanitizeInput);
      app.use(sqlInjectionProtection);
      app.post('/test', (req, res) => {
        res.json({ processed: true });
      });
    });

    it('should process requests within reasonable time', async () => {
      const largePayload = {
        items: Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i} with some text content`
        }))
      };

      const startTime = Date.now();
      const response = await request(app)
        .post('/test')
        .send(largePayload);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(0).map(() => 
        request(app)
          .post('/test')
          .send({ data: 'concurrent test' })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(endTime - startTime).toBeLessThan(2000); // All 10 requests within 2 seconds
    });
  });
});