// src/config/swagger.js - Swagger API Documentation
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rentaly Car Rental API",
      version: "1.0.0",
      description: "A comprehensive car rental management API",
      contact: {
        name: "Rentaly Support",
        email: "info@mitcarrental.com",
        url: "https://mitcarrental.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
      {
        url: "https://api.mitcarrental.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT Bearer token"
        },
      },
      schemas: {
        Car: {
          type: "object",
          required: ["title", "brand", "model", "year", "category", "pricing"],
          properties: {
            _id: {
              type: "string",
              description: "Car ID",
            },
            title: {
              type: "string",
              description: "Car title",
              example: "BMW 3 Series - Luxury Sedan",
            },
            brand: {
              type: "string",
              description: "Car brand",
              example: "BMW",
            },
            model: {
              type: "string",
              description: "Car model",
              example: "3 Series",
            },
            year: {
              type: "integer",
              description: "Car year",
              example: 2023,
            },
            category: {
              type: "string",
              enum: [
                "Ekonomik",
                "Orta Sınıf",
                "Üst Sınıf",
                "SUV",
                "Geniş",
                "Lüks",
              ],
              description: "Car category",
              example: "Lüks",
            },
            fuelType: {
              type: "string",
              enum: [
                "Belirtilmemiş",
                "Benzin",
                "Dizel",
                "Benzin+LPG",
                "Elektrikli",
                "Hibrit",
              ],
              example: "Benzin",
            },
            transmission: {
              type: "string",
              enum: ["Belirtilmemiş", "Manuel", "Yarı Otomatik", "Otomatik"],
              example: "Otomatik",
            },
            pricing: {
              type: "object",
              properties: {
                daily: {
                  type: "number",
                  description: "Daily rental price",
                  example: 150,
                },
                weekly: {
                  type: "number",
                  description: "Weekly rental price",
                  example: 900,
                },
                monthly: {
                  type: "number",
                  description: "Monthly rental price",
                  example: 3750,
                },
              },
            },
            images: {
              type: "object",
              properties: {
                main: {
                  type: "object",
                  properties: {
                    url: { type: "string" },
                    publicId: { type: "string" },
                  },
                },
                gallery: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                      publicId: { type: "string" },
                      caption: { type: "string" },
                    },
                  },
                },
              },
            },
            status: {
              type: "boolean",
              description: "Car availability status",
              example: true,
            },
            featured: {
              type: "boolean",
              description: "Is car featured",
              example: false,
            },
            whatsappNumber: {
              type: "string",
              description: "WhatsApp contact number",
              example: "+905366039907",
            },
            slug: {
              type: "string",
              description: "Car URL slug",
              example: "bmw-3-series-2023",
            },
          },
        },
        Admin: {
          type: "object",
          required: ["username", "email", "password", "firstName", "lastName"],
          properties: {
            _id: {
              type: "string",
              description: "Admin ID",
            },
            username: {
              type: "string",
              description: "Admin username",
              example: "admin",
            },
            email: {
              type: "string",
              format: "email",
              description: "Admin email",
              example: "admin@mitcarrental.com",
            },
            firstName: {
              type: "string",
              description: "Admin first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "Admin last name",
              example: "Doe",
            },
            role: {
              type: "string",
              enum: ["super_admin", "admin", "manager", "editor"],
              example: "admin",
            },
            isActive: {
              type: "boolean",
              description: "Admin account status",
              example: true,
            },
          },
        },
        Location: {
          type: "object",
          required: ["name", "city", "type"],
          properties: {
            _id: {
              type: "string",
              description: "Location ID",
            },
            name: {
              type: "string",
              description: "Location name",
              example: "Antalya Airport",
            },
            city: {
              type: "string",
              description: "City name",
              example: "Antalya",
            },
            type: {
              type: "string",
              enum: [
                "Airport",
                "City Center",
                "Hotel",
                "Train Station",
                "Bus Terminal",
                "Port",
                "Office",
                "Other",
              ],
              example: "Airport",
            },
            address: {
              type: "object",
              properties: {
                fullAddress: {
                  type: "string",
                  example: "Antalya Airport, Terminal 1, Antalya, Turkey",
                },
              },
            },
            coordinates: {
              type: "object",
              properties: {
                latitude: {
                  type: "number",
                  example: 36.8969,
                },
                longitude: {
                  type: "number",
                  example: 30.7133,
                },
              },
            },
            status: {
              type: "boolean",
              description: "Location availability",
              example: true,
            },
          },
        },
        Message: {
          type: "object",
          required: ["sender", "subject", "message"],
          properties: {
            _id: {
              type: "string",
              description: "Message ID",
            },
            sender: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  example: "John Doe",
                },
                email: {
                  type: "string",
                  format: "email",
                  example: "john@example.com",
                },
                phone: {
                  type: "string",
                  example: "+905551234567",
                },
              },
            },
            subject: {
              type: "string",
              description: "Message subject",
              example: "Car rental inquiry",
            },
            message: {
              type: "string",
              description: "Message content",
              example: "I would like to rent a car for my vacation...",
            },
            type: {
              type: "string",
              enum: [
                "contact",
                "quote_request",
                "complaint",
                "suggestion",
                "support",
                "reservation_inquiry",
              ],
              example: "contact",
            },
            status: {
              type: "string",
              enum: ["unread", "read", "replied", "resolved", "archived"],
              example: "unread",
            },
            priority: {
              type: "string",
              enum: ["low", "normal", "high", "urgent"],
              example: "normal",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
            details: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 12,
            },
            totalPages: {
              type: "integer",
              example: 5,
            },
            totalCars: {
              type: "integer",
              example: 58,
            },
            hasNext: {
              type: "boolean",
              example: true,
            },
            hasPrev: {
              type: "boolean",
              example: false,
            },
          },
        },
        News: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "News ID"
            },
            title: {
              type: "string",
              description: "News title",
              example: "New Car Model Available"
            },
            content: {
              type: "string",
              description: "News content"
            },
            excerpt: {
              type: "string",
              description: "News excerpt"
            },
            author: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" }
              }
            },
            status: {
              type: "string",
              enum: ["draft", "published", "archived"],
              example: "published"
            },
            publishedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        Booking: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Booking ID"
            },
            carId: {
              type: "string",
              description: "Car ID"
            },
            customerName: {
              type: "string",
              example: "John Doe"
            },
            customerEmail: {
              type: "string",
              example: "john@example.com"
            },
            startDate: {
              type: "string",
              format: "date",
              example: "2025-01-01"
            },
            endDate: {
              type: "string",
              format: "date",
              example: "2025-01-07"
            },
            totalAmount: {
              type: "number",
              example: 350
            },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "active", "completed", "cancelled"],
              example: "confirmed"
            }
          }
        },
      },
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    "./src/routes/*.js", 
    "./src/controllers/*.js",
    "./src/controllers/allApis.js"
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
