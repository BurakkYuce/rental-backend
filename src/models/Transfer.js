// src/models/Transfer.js - Transfer Zones Model
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transfer = sequelize.define(
    'Transfer',
    {
      // Primary Key
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      // Zone Information
      zoneName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'zone_name', // Map to snake_case DB column
        validate: {
          notEmpty: {
            msg: 'Zone name is required'
          },
          len: {
            args: [2, 100],
            msg: 'Zone name must be between 2-100 characters'
          }
        }
      },

      // Zone Description (optional)
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Pricing for different vehicle capacities (in EUR)
      pricing: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          capacity_1_4: 0,    // 1-4 passengers
          capacity_1_6: 0,    // 1-6 passengers  
          capacity_1_16: 0,   // 1-16 passengers
          currency: 'EUR'
        },
        validate: {
          isValidPricing(value) {
            if (!value || typeof value !== 'object') {
              throw new Error('Pricing must be an object');
            }
            
            const requiredFields = ['capacity_1_4', 'capacity_1_6', 'capacity_1_16'];
            for (const field of requiredFields) {
              if (typeof value[field] !== 'number' || value[field] < 0) {
                throw new Error(`${field} must be a non-negative number`);
              }
            }
            
            if (value.currency && value.currency !== 'EUR') {
              throw new Error('Currency must be EUR');
            }
          }
        }
      },

      // Zone order for display
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'display_order', // Map to snake_case DB column
      },

      // Active status
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },

      // Foreign Key to Admin
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id', // Map to snake_case DB column
        references: {
          model: 'admins',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      tableName: 'transfers',
      indexes: [
        { fields: ['user_id'] }, // Use snake_case field name
        { fields: ['status'] },
        { fields: ['display_order'] }, // Use snake_case field name
        { fields: ['zone_name'] }, // Use snake_case field name
        { fields: ['pricing'], using: 'gin' }, // JSONB index
      ],
      hooks: {
        beforeSave: async (transfer) => {
          // Ensure currency is always EUR
          if (transfer.pricing) {
            transfer.pricing.currency = 'EUR';
          }
        }
      }
    }
  );

  // Model associations
  Transfer.associate = (models) => {
    // Transfer belongs to Admin (creator)
    Transfer.belongsTo(models.Admin, {
      foreignKey: 'userId',
      as: 'creator',
      onDelete: 'CASCADE'
    });
  };

  return Transfer;
};