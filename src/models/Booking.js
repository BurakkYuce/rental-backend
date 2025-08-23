// src/models/Booking.js - PostgreSQL Booking Model
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Service type
    serviceType: {
      type: DataTypes.ENUM('car_rental', 'transfer'),
      allowNull: false,
      defaultValue: 'car_rental',
    },

    // Car reference (for car rental)
    carId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for transfer bookings
      references: {
        model: 'cars',
        key: 'id'
      }
    },

    // Transfer reference (for transfer service)
    transferId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for car rental bookings
      references: {
        model: 'transfers',
        key: 'id'
      }
    },

    // Transfer specific data
    transferData: {
      type: DataTypes.JSONB,
      allowNull: true,
      // Structure: { vehicleCapacity: 'capacity_1_4', passengers: 3, flightNumber: 'TK123', notes: '' }
    },

    // Booking reference number
    bookingReference: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // Allow null initially, will be set by hook
    },

    // Drivers (JSON array)
    drivers: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },

    // Locations
    pickupLocation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 200]
      }
    },

    dropoffLocation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 200]
      }
    },

    // Times
    pickupTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    dropoffTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // Pricing (JSON object)
    pricing: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    // Status
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },

    // Additional services
    additionalServices: {
      type: DataTypes.JSON,
      defaultValue: [],
    },

    // Notes
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Admin tracking
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    lastModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "bookings",
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false,
    hooks: {
      beforeCreate: (booking) => {
        // Generate booking reference based on service type
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const prefix = booking.serviceType === 'transfer' ? 'TR' : 'BK';
        booking.bookingReference = `${prefix}${timestamp}${random}`;
      }
    }
  }
);

// Instance methods - only add if Booking prototype exists (not in test environment)
if (Booking && Booking.prototype) {
  Booking.prototype.canBeModified = function() {
    const modifiableStatuses = ['pending', 'confirmed'];
    const now = new Date();
    return modifiableStatuses.includes(this.status) && 
           new Date(this.pickupTime) > now;
  };
}

// Static methods for filtering - only add if Booking exists (not in test environment)
if (Booking && typeof Booking === 'function') {
  Booking.getBookingsWithFilters = async function(filters) {
  const {
    page = 1,
    limit = 20,
    status = 'all',
    carId,
    dateFrom,
    dateTo,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const whereClause = {};
  
  // Status filter
  if (status !== 'all') {
    whereClause.status = status;
  }

  // Car filter
  if (carId) {
    whereClause.carId = carId;
  }

  // Date range filter
  if (dateFrom) {
    whereClause.pickupTime = {
      [sequelize.Sequelize.Op.gte]: new Date(dateFrom)
    };
  }
  if (dateTo) {
    whereClause.dropoffTime = {
      [sequelize.Sequelize.Op.lte]: new Date(dateTo)
    };
  }

  // Search filter (in driver names, locations, booking reference)
  if (search) {
    whereClause[sequelize.Sequelize.Op.or] = [
      { bookingReference: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
      { pickupLocation: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
      { dropoffLocation: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
      // For JSON search in drivers, we'd need a more complex query
    ];
  }

  const { rows: bookings, count: total } = await Booking.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  return {
    bookings,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
};
}

module.exports = Booking;