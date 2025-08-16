const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rent',
  user: 'postgres',
  password: 'a'
});

async function checkTables() {
  try {
    const result = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', ['public']);
    console.log('📋 Available tables:');
    result.rows.forEach(row => console.log('- ' + row.table_name));
    
    // Check Cars table structure
    const carsColumns = await pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['Cars']);
    console.log('\n🚗 Cars table columns:');
    carsColumns.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkTables();