const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addReactionTypeColumn() {
  let connection;
  
  try {
    console.log('🚀 Adding reaction_type column to post_likes table...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone'
    });

    console.log('✅ Connected to database');

    // Check if reaction_type column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'post_likes' 
      AND COLUMN_NAME = 'reaction_type'
    `);
    
    if (columns.length === 0) {
      console.log('📝 Adding reaction_type column...');
      await connection.execute(`
        ALTER TABLE post_likes 
        ADD COLUMN reaction_type VARCHAR(20) DEFAULT 'like'
      `);
      console.log('✅ reaction_type column added successfully!');
      
      // Update existing likes to have default 'like' reaction
      const [updateResult] = await connection.execute(`
        UPDATE post_likes 
        SET reaction_type = 'like' 
        WHERE reaction_type IS NULL
      `);
      console.log(`✅ Updated ${updateResult.affectedRows} existing likes with default 'like' reaction`);
    } else {
      console.log('✅ reaction_type column already exists');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Restart your server');
    console.log('  2. Try liking posts again');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addReactionTypeColumn();

