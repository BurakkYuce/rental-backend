// create-blogs-table.js - Create blogs table for new Blog model
const { sequelize } = require('./src/config/database');
const { Blog } = require('./src/models');

async function createBlogsTable() {
  try {
    console.log('🔄 Creating blogs table...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');
    
    // Drop existing blogs table if exists
    console.log('🔄 Dropping existing blogs table...');
    await sequelize.query('DROP TABLE IF EXISTS blogs CASCADE');
    
    // Create blogs table with the exact structure our Blog model expects
    console.log('🔄 Creating blogs table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        excerpt VARCHAR(500),
        slug VARCHAR(250) UNIQUE NOT NULL,
        image JSONB,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        featured BOOLEAN DEFAULT false,
        tags JSONB DEFAULT '[]',
        author VARCHAR(100) DEFAULT 'Admin',
        publish_date TIMESTAMP,
        view_count INTEGER DEFAULT 0,
        user_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes for performance
    console.log('🔄 Creating indexes...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_blogs_publish_date ON blogs(publish_date)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_blogs_tags ON blogs USING gin(tags)');
    
    console.log('✅ Blogs table created successfully!');
    
    // Verify table structure
    console.log('🔍 Verifying table structure...');
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'blogs' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    tableInfo.forEach(column => {
      console.log(`   ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    console.log('');
    console.log('🎉 Blogs table setup complete!');
    console.log('🚀 You can now create blogs through the API');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('👋 Connection closed');
  }
}

createBlogsTable();