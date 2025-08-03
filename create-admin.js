// create-admin.js - Create admin user and test database connection
require('dotenv').config();
const { sequelize } = require('./src/config/database');
const Admin = require('./src/models/Admin');

async function createAdminUser() {
  try {
    console.log('🔧 Testing PostgreSQL connection...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
    console.log(`📦 Database: ${process.env.DATABASE_NAME}`);
    console.log(`🏠 Host: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`);
    
    // Sync database tables
    console.log('🔄 Synchronizing database tables...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized');
    
    // Check if admin user already exists
    console.log('👤 Checking for existing admin user...');
    const existingAdmin = await Admin.findOne({
      where: {
        username: 'admin'
      }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with username "admin"');
      console.log('Admin details:', {
        id: existingAdmin.id,
        username: existingAdmin.username,
        email: existingAdmin.email,
        role: existingAdmin.role,
        isActive: existingAdmin.isActive
      });
      return existingAdmin;
    }
    
    // Create admin user
    console.log('➕ Creating admin user...');
    const adminUser = await Admin.create({
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
        },
        {
          module: 'admin',
          actions: ['create', 'read', 'update', 'delete']
        }
      ]
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@mitcarrental.com');
    console.log('   Role: super_admin');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Admin user setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin user setup failed:', error);
      process.exit(1);
    });
}

module.exports = createAdminUser;