// create-cars-table.js - Create cars table for new Car model
const { sequelize } = require("./src/config/database");
const { Car } = require("./src/models");

async function createCarsTable() {
  try {
    console.log("🔄 Creating cars table...");

    // Test connection
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connection successful");

    // Enable UUID extension
    console.log("🔄 Enabling UUID extension...");
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Drop existing cars table if exists
    console.log("🔄 Dropping existing cars table...");
    await sequelize.query("DROP TABLE IF EXISTS cars CASCADE");

    // Create cars table with the exact structure our Car model expects
    console.log("🔄 Creating cars table...");
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        year INTEGER NOT NULL,
        brand VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        category VARCHAR(20) DEFAULT 'Ekonomik' CHECK (category IN ('Ekonomik', 'Orta Sınıf', 'Üst Sınıf', 'SUV', 'Geniş', 'Lüks')),
        body_type VARCHAR(50) DEFAULT 'Sedan',
        seats INTEGER DEFAULT 5 CHECK (seats >= 2 AND seats <= 50),
        doors INTEGER DEFAULT 4 CHECK (doors >= 2 AND doors <= 6),
        engine_capacity INTEGER CHECK (engine_capacity >= 500 AND engine_capacity <= 10000),
        transmission VARCHAR(20) DEFAULT 'Manuel' CHECK (transmission IN ('Manuel', 'Yarı Otomatik', 'Otomatik')),
        fuel_type VARCHAR(20) DEFAULT 'Benzin' CHECK (fuel_type IN ('Benzin', 'Dizel', 'Benzin+LPG', 'Elektrikli', 'Hibrit')),
        main_image JSONB,
        description TEXT,
        pricing JSONB NOT NULL DEFAULT '{"daily": 0, "weekly": 0, "monthly": 0, "currency": "TRY"}',
        slug VARCHAR(250) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        featured BOOLEAN DEFAULT false,
        user_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    console.log("🔄 Creating indexes...");
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id)"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status)"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_featured ON cars(featured)"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_brand_model ON cars(brand, model)"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_category ON cars(category)"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_slug ON cars(slug)"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_pricing ON cars USING gin(pricing)"
    );
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_cars_main_image ON cars USING gin(main_image)"
    );

    console.log("✅ Cars table created successfully!");

    // Verify table structure
    console.log("🔍 Verifying table structure...");
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      ORDER BY ordinal_position
    `);

    console.log("📋 Table structure:");
    tableInfo.forEach((column) => {
      console.log(
        `   ${column.column_name}: ${column.data_type} ${
          column.is_nullable === "NO" ? "NOT NULL" : ""
        }`
      );
    });

    console.log("");
    console.log("🎉 Cars table setup complete!");
    console.log("🚀 You can now create cars through the API");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log("👋 Connection closed");
  }
}

createCarsTable();
