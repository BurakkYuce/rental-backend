// src/models/Admin.js - PostgreSQL Admin Model
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'editor'),
    defaultValue: 'admin'
  },
  avatar: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIP: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_login_ip'
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      language: 'tr',
      timezone: 'Europe/Istanbul',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light',
      notifications: {
        email: true,
        browser: true,
        newBookings: true,
        messages: true
      }
    }
  },
  activity: {
    type: DataTypes.JSONB,
    defaultValue: {
      totalLogins: 0,
      lastActions: []
    }
  }
}, {
  tableName: 'admins',
  underscored: true,
  timestamps: true,
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        admin.password = await bcrypt.hash(admin.password, 12);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        admin.password = await bcrypt.hash(admin.password, 12);
      }
    }
  }
});

// Instance methods
Admin.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

Admin.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.passwordResetToken;
  delete values.emailVerificationToken;
  return values;
};

Admin.prototype.hasPermission = function(module, action) {
  if (this.role === 'super_admin') return true;
  
  const modulePermission = this.permissions.find(p => p.module === module);
  return modulePermission && modulePermission.actions.includes(action);
};

Admin.prototype.logActivity = function(action, module, description, req = null) {
  const activityEntry = {
    action,
    module,
    description,
    timestamp: new Date(),
    ip: req ? (req.ip || req.connection?.remoteAddress) : null,
    userAgent: req ? req.get('User-Agent') : null
  };

  if (!this.activity) this.activity = { totalLogins: 0, lastActions: [] };
  if (!this.activity.lastActions) this.activity.lastActions = [];
  
  this.activity.lastActions.unshift(activityEntry);
  
  // Keep only last 50 activities
  if (this.activity.lastActions.length > 50) {
    this.activity.lastActions = this.activity.lastActions.slice(0, 50);
  }
  
  return this.save();
};

// Static methods
Admin.findByLogin = function(login) {
  return this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { username: login.toLowerCase() },
        { email: login.toLowerCase() }
      ],
      isActive: true
    }
  });
};

Admin.createDefaultAdmin = async function() {
  const adminCount = await this.count();
  
  if (adminCount === 0) {
    const defaultAdmin = await this.create({
      username: 'admin',
      email: 'admin@mitcarrental.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      isActive: true,
      emailVerified: true,
      permissions: [
        {
          module: 'cars',
          actions: ['create', 'read', 'update', 'delete', 'export']
        },
        {
          module: 'locations',
          actions: ['create', 'read', 'update', 'delete', 'export']
        },
        {
          module: 'bookings',
          actions: ['create', 'read', 'update', 'delete', 'export']
        },
        {
          module: 'content',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'settings',
          actions: ['create', 'read', 'update', 'delete']
        }
      ]
    });
    
    console.log('✅ Default admin created: admin / admin123');
    return defaultAdmin;
  }
  
  return null;
};

module.exports = Admin;