const { connectDB, getConnection } = require('./config/database');

/**
 * Migration script to add message_deletions table
 * This enables proper "delete for me" functionality where each user
 * can delete messages independently without affecting other users.
 * 
 * Run this script once: node migration-add-message-deletions.js
 */

async function migrate() {
  try {
    console.log('🔄 Starting migration: Adding message_deletions table...');
    
    // Connect to database first (this will auto-create message_deletions table)
    await connectDB();
    const connection = getConnection();

    console.log('✅ Successfully connected to database and created tables');
    
    // Check if old deleted_for_user column exists and migrate data
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM messages LIKE 'deleted_for_user'
    `);

    if (columns.length > 0) {
      console.log('🔄 Migrating data from old deleted_for_user column...');
      
      // Migrate existing data to new table
      await connection.execute(`
        INSERT IGNORE INTO message_deletions (message_id, user_id)
        SELECT id, deleted_for_user 
        FROM messages 
        WHERE deleted_for_user IS NOT NULL
      `);
      
      console.log('✅ Data migration completed');
      console.log('ℹ️  Note: You can manually drop the old column with:');
      console.log('   ALTER TABLE messages DROP COLUMN deleted_for_user;');
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

