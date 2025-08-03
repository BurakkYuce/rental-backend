// migration-setup.js - Setup PostgreSQL tables for Admin-only system
const { sequelize } = require('./src/config/database');
const Admin = require('./src/models/Admin');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up PostgreSQL database for Admin-only system...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');
    
    // Enable UUID extension
    console.log('🔄 Enabling UUID extension...');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Drop existing tables to start fresh (careful!)
    console.log('🔄 Dropping existing tables...');
    await sequelize.query('DROP TABLE IF EXISTS listings CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS users CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS admins CASCADE');
    
    // Create Admin table
    console.log('🔄 Creating admins table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'editor')),
        avatar JSONB,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        last_login_ip VARCHAR(45),
        login_attempts INTEGER DEFAULT 0,
        lock_until TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        email_verification_token VARCHAR(255),
        permissions JSONB DEFAULT '[]',
        preferences JSONB DEFAULT '{"language": "tr", "timezone": "Europe/Istanbul", "dateFormat": "DD/MM/YYYY", "theme": "light", "notifications": {"email": true, "browser": true, "newBookings": true, "messages": true}}',
        activity JSONB DEFAULT '{"totalLogins": 0, "lastActions": []}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create Listings table
    console.log('🔄 Creating listings table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(250) UNIQUE NOT NULL,
        description TEXT,
        brand VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        category VARCHAR(20) DEFAULT 'Ekonomik',
        fuel_type VARCHAR(20) DEFAULT 'Benzin',
        transmission VARCHAR(20) DEFAULT 'Manuel',
        body_type VARCHAR(50) DEFAULT 'Sedan',
        seats INTEGER DEFAULT 5,
        doors INTEGER DEFAULT 4,
        images JSONB DEFAULT '{"main": null, "gallery": []}',
        pricing JSONB DEFAULT '{"daily": 0, "weekly": 0, "monthly": 0, "currency": "TRY"}',
        status VARCHAR(20) DEFAULT 'active',
        featured BOOLEAN DEFAULT false,
        total_units INTEGER DEFAULT 1,
        available_units INTEGER DEFAULT 1,
        min_driver_age INTEGER DEFAULT 21,
        min_license_year INTEGER DEFAULT 1,
        whatsapp_number VARCHAR(20) DEFAULT '+905366039907',
        meta_description VARCHAR(160),
        keywords TEXT[],
        stats JSONB DEFAULT '{"viewCount": 0, "reservationCount": 0, "rating": {"average": 0, "count": 0}}',
        user_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes
    console.log('🔄 Creating indexes...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_listings_brand ON listings(brand)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active)');
    
    console.log('✅ Tables created successfully');
    
    // Create default super admin
    console.log('🔄 Creating default super admin...');
    await Admin.createDefaultAdmin();
    
    // Create test admin
    console.log('🔄 Creating test admin...');
    const testAdmin = await Admin.create({
      username: 'testadmin',
      email: 'test@mitcarrental.com',
      password: 'test123',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      permissions: [
        {
          module: 'cars',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'content',
          actions: ['create', 'read', 'update', 'delete']
        }
      ]
    });
    
    console.log('✅ Test admin created: testadmin / test123');
    
    // Insert test listings
    console.log('🔄 Creating test listings...');
    const listingIds = [
      'a47ac10b-58cc-4372-a567-0e02b2c3d470',
      'b47ac10b-58cc-4372-a567-0e02b2c3d471', 
      'c47ac10b-58cc-4372-a567-0e02b2c3d472'
    ];
    
    await sequelize.query(`
      INSERT INTO listings (id, title, brand, model, year, pricing, user_id, slug, created_at, updated_at) 
      VALUES 
      ('${listingIds[0]}', 'BMW 3 Series', 'BMW', '3 Series', 2022, '{"daily": 150, "currency": "TRY"}', '${testAdmin.id}', 'bmw-3-series-${Date.now()}', NOW(), NOW()),
      ('${listingIds[1]}', 'Mercedes C-Class', 'Mercedes-Benz', 'C-Class', 2023, '{"daily": 200, "currency": "TRY"}', '${testAdmin.id}', 'mercedes-c-class-${Date.now()}', NOW(), NOW()),
      ('${listingIds[2]}', 'Toyota Corolla', 'Toyota', 'Corolla', 2023, '{"daily": 100, "currency": "TRY"}', '${testAdmin.id}', 'toyota-corolla-${Date.now()}', NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `);
    
    console.log('✅ Test listings created');
    
    // Check results
    const [adminCount] = await sequelize.query('SELECT COUNT(*) as count FROM admins');
    const [listingCount] = await sequelize.query('SELECT COUNT(*) as count FROM listings');
    
    console.log(`📊 Total admins: ${adminCount[0].count}`);
    console.log(`📊 Total listings: ${listingCount[0].count}`);
    
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Super Admin: admin / admin123');
    console.log('   Test Admin: testadmin / test123');
    console.log('');
    console.log('🚀 You can now start the server with: npm start');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('👋 Connection closed');
  }
}

setupDatabase();