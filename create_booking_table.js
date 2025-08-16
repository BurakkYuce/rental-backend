const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rent',
  user: 'postgres',
  password: 'a'
});

async function createBookingTable() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Drop existing table if it exists
    await pool.query('DROP TABLE IF EXISTS bookings CASCADE;');
    console.log('✅ Existing bookings table dropped');
    
    // Create new bookings table
    const createTableSQL = `
    CREATE TABLE bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "carId" UUID NOT NULL REFERENCES cars(id),
      "bookingReference" VARCHAR(255) UNIQUE NOT NULL,
      drivers JSONB NOT NULL,
      "pickupLocation" VARCHAR(255) NOT NULL,
      "dropoffLocation" VARCHAR(255) NOT NULL,
      "pickupTime" TIMESTAMP WITH TIME ZONE NOT NULL,
      "dropoffTime" TIMESTAMP WITH TIME ZONE NOT NULL,
      pricing JSONB NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
      "additionalServices" JSONB DEFAULT '[]',
      "specialRequests" TEXT,
      "adminNotes" TEXT,
      "createdBy" UUID,
      "lastModifiedBy" UUID,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ New bookings table created successfully');
    
    // Create indexes
    await pool.query('CREATE INDEX idx_bookings_car_id ON bookings("carId");');
    await pool.query('CREATE INDEX idx_bookings_status ON bookings(status);');
    await pool.query('CREATE INDEX idx_bookings_pickup_time ON bookings("pickupTime");');
    console.log('✅ Indexes created');
    
    await pool.end();
    console.log('🎉 Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  }
}

createBookingTable();