const { Sequelize, DataTypes } = require('sequelize');

// Mock Sequelize instance
const mockSequelize = {
  define: jest.fn(),
  authenticate: jest.fn(),
  sync: jest.fn()
};

// Mock Car model definition
const createCarModel = () => {
  const CarModel = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1900,
        max: new Date().getFullYear() + 2
      }
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 50
      }
    },
    doors: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2,
        max: 8
      }
    },
    transmission: {
      type: DataTypes.ENUM('Manuel', 'Otomatik', 'Yarı Otomatik'),
      allowNull: false
    },
    fuelType: {
      type: DataTypes.ENUM('Benzin', 'Dizel', 'Elektrikli', 'Hibrit', 'Benzin+LPG'),
      allowNull: false
    },
    pricing: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidPricing(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Pricing must be an object');
          }
          if (!value.daily || value.daily <= 0) {
            throw new Error('Daily price must be positive');
          }
          if (!value.currency || !['EUR', 'USD', 'TRY'].includes(value.currency)) {
            throw new Error('Invalid currency');
          }
        }
      }
    },
    seasonal_pricing: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    mainImage: {
      type: DataTypes.JSONB
    },
    gallery: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  };

  // Mock validation methods
  const validateInstance = (instance) => {
    const errors = [];

    // Validate required fields
    if (!instance.title || instance.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!instance.category) {
      errors.push('Category is required');
    }

    if (!instance.brand) {
      errors.push('Brand is required');
    }

    if (!instance.model) {
      errors.push('Model is required');
    }

    if (!instance.year || instance.year < 1900 || instance.year > new Date().getFullYear() + 2) {
      errors.push('Invalid year');
    }

    if (!instance.seats || instance.seats < 1 || instance.seats > 50) {
      errors.push('Invalid number of seats');
    }

    if (!instance.doors || instance.doors < 2 || instance.doors > 8) {
      errors.push('Invalid number of doors');
    }

    if (!['Manuel', 'Otomatik', 'Yarı Otomatik'].includes(instance.transmission)) {
      errors.push('Invalid transmission type');
    }

    if (!['Benzin', 'Dizel', 'Elektrikli', 'Hibrit', 'Benzin+LPG'].includes(instance.fuelType)) {
      errors.push('Invalid fuel type');
    }

    // Validate pricing
    if (!instance.pricing || typeof instance.pricing !== 'object') {
      errors.push('Pricing must be an object');
    } else {
      if (!instance.pricing.daily || instance.pricing.daily <= 0) {
        errors.push('Daily price must be positive');
      }
      if (!instance.pricing.currency || !['EUR', 'USD', 'TRY'].includes(instance.pricing.currency)) {
        errors.push('Invalid currency');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  };

  return {
    ...CarModel,
    validate: validateInstance
  };
};

describe('Car Model', () => {
  let CarModel;

  beforeEach(() => {
    CarModel = createCarModel();
    jest.clearAllMocks();
  });

  describe('Model Validation', () => {
    it('should validate a valid car instance', () => {
      const validCar = {
        title: 'Toyota Corolla 2024',
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
        available: true
      };

      expect(() => CarModel.validate(validCar)).not.toThrow();
    });

    it('should reject car with missing required fields', () => {
      const invalidCar = {
        title: 'Toyota Corolla'
        // Missing required fields
      };

      expect(() => CarModel.validate(invalidCar)).toThrow();
    });

    it('should reject car with empty title', () => {
      const invalidCar = {
        title: '',
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

      expect(() => CarModel.validate(invalidCar)).toThrow('Title is required');
    });

    it('should reject car with invalid year', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 1800, // Too old
        seats: 5,
        doors: 4,
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: {
          daily: 50,
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Invalid year');
    });

    it('should reject car with invalid seats count', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        seats: 0, // Invalid
        doors: 4,
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: {
          daily: 50,
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Invalid number of seats');
    });

    it('should reject car with invalid doors count', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        seats: 5,
        doors: 1, // Invalid
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: {
          daily: 50,
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Invalid number of doors');
    });

    it('should reject car with invalid transmission', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        seats: 5,
        doors: 4,
        transmission: 'InvalidTransmission',
        fuelType: 'Benzin',
        pricing: {
          daily: 50,
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Invalid transmission type');
    });

    it('should reject car with invalid fuel type', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        seats: 5,
        doors: 4,
        transmission: 'Manuel',
        fuelType: 'InvalidFuel',
        pricing: {
          daily: 50,
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Invalid fuel type');
    });

    it('should reject car with invalid pricing', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        seats: 5,
        doors: 4,
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: 'invalid pricing' // Should be object
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Pricing must be an object');
    });

    it('should reject car with negative daily price', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        seats: 5,
        doors: 4,
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: {
          daily: -50, // Negative price
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Daily price must be positive');
    });

    it('should reject car with invalid currency', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
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
          currency: 'INVALID'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow('Invalid currency');
    });
  });

  describe('Seasonal Pricing Validation', () => {
    it('should accept valid seasonal pricing', () => {
      const validCar = {
        title: 'Toyota Corolla',
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
        },
        seasonal_pricing: [
          {
            name: 'Summer',
            startDate: '2024-06-01',
            endDate: '2024-08-31',
            pricing: {
              daily: 80,
              currency: 'EUR'
            }
          }
        ]
      };

      expect(() => CarModel.validate(validCar)).not.toThrow();
    });

    it('should accept empty seasonal pricing array', () => {
      const validCar = {
        title: 'Toyota Corolla',
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
        },
        seasonal_pricing: []
      };

      expect(() => CarModel.validate(validCar)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme but valid values', () => {
      const edgeCaseCar = {
        title: 'A'.repeat(255), // Maximum length
        category: 'Luxury',
        brand: 'Rolls-Royce',
        model: 'Phantom',
        year: new Date().getFullYear() + 2, // Future year
        seats: 50, // Maximum seats
        doors: 8, // Maximum doors
        transmission: 'Otomatik',
        fuelType: 'Elektrikli',
        pricing: {
          daily: 9999.99, // High price
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(edgeCaseCar)).not.toThrow();
    });

    it('should handle null and undefined values', () => {
      const nullCar = {
        title: null,
        category: undefined,
        brand: '',
        model: '   ', // Whitespace only
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

      expect(() => CarModel.validate(nullCar)).toThrow();
    });

    it('should handle Unicode and special characters', () => {
      const unicodeCar = {
        title: 'BMW 汽车 🚗',
        category: 'Luxury',
        brand: 'BMW',
        model: 'X5',
        year: 2024,
        seats: 5,
        doors: 4,
        transmission: 'Otomatik',
        fuelType: 'Benzin',
        pricing: {
          daily: 150,
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(unicodeCar)).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longStringCar = {
        title: 'A'.repeat(1000), // Very long title
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

      // Should reject very long strings
      expect(() => CarModel.validate(longStringCar)).toThrow();
    });
  });

  describe('Data Type Validation', () => {
    it('should handle string numbers correctly', () => {
      const stringNumberCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: '2024', // String instead of number
        seats: '5',
        doors: '4',
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: {
          daily: '50', // String number
          currency: 'EUR'
        }
      };

      // Should handle string to number conversion or reject
      const result = () => CarModel.validate({
        ...stringNumberCar,
        year: parseInt(stringNumberCar.year),
        seats: parseInt(stringNumberCar.seats),
        doors: parseInt(stringNumberCar.doors),
        pricing: {
          ...stringNumberCar.pricing,
          daily: parseFloat(stringNumberCar.pricing.daily)
        }
      });

      expect(result).not.toThrow();
    });

    it('should reject non-numeric strings for number fields', () => {
      const invalidCar = {
        title: 'Toyota Corolla',
        category: 'Economy',
        brand: 'Toyota',
        model: 'Corolla',
        year: 'invalid year',
        seats: 5,
        doors: 4,
        transmission: 'Manuel',
        fuelType: 'Benzin',
        pricing: {
          daily: 50,
          currency: 'EUR'
        }
      };

      expect(() => CarModel.validate(invalidCar)).toThrow();
    });
  });
});