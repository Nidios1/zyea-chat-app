const { connectDB, getConnection } = require('./config/database');

async function fixPostsTable() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Database connection not available');
      process.exit(1);
    }

    console.log('🔧 Fixing posts table...');

    // Add post_type column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE posts 
        ADD COLUMN post_type ENUM('text', 'image') DEFAULT 'text' 
        AFTER image_url
      `);
      console.log('✅ Added post_type column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELD_NAME') {
        console.log('ℹ️  post_type column already exists');
      } else {
        throw error;
      }
    }

    // Add likes_count column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE posts 
        ADD COLUMN likes_count INT DEFAULT 0 
        AFTER privacy
      `);
      console.log('✅ Added likes_count column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELD_NAME') {
        console.log('ℹ️  likes_count column already exists');
      } else {
        throw error;
      }
    }

    // Add comments_count column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE posts 
        ADD COLUMN comments_count INT DEFAULT 0 
        AFTER likes_count
      `);
      console.log('✅ Added comments_count column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELD_NAME') {
        console.log('ℹ️  comments_count column already exists');
      } else {
        throw error;
      }
    }

    // Add shares_count column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE posts 
        ADD COLUMN shares_count INT DEFAULT 0 
        AFTER comments_count
      `);
      console.log('✅ Added shares_count column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELD_NAME') {
        console.log('ℹ️  shares_count column already exists');
      } else {
        throw error;
      }
    }

    // Update image_url size if needed
    try {
      await connection.execute(`
        ALTER TABLE posts 
        MODIFY COLUMN image_url VARCHAR(500)
      `);
      console.log('✅ Updated image_url column size');
    } catch (error) {
      console.log('ℹ️  Could not update image_url size:', error.message);
    }

    console.log('✅ Posts table fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing posts table:', error);
    process.exit(1);
  }
}

fixPostsTable();

