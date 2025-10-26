const { connectDB, getConnection } = require('./config/database');

async function verify() {
  try {
    console.log('🔍 Verifying migration...\n');
    
    await connectDB();
    const conn = getConnection();
    
    // Check if table exists
    const [tables] = await conn.execute("SHOW TABLES LIKE 'message_deletions'");
    
    if (tables.length === 0) {
      console.log('❌ Table message_deletions NOT found!');
      process.exit(1);
    }
    
    console.log('✅ Table message_deletions exists\n');
    
    // Show table structure
    const [columns] = await conn.execute('DESCRIBE message_deletions');
    console.log('📋 Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field.padEnd(15)} : ${col.Type}`);
    });
    
    console.log('\n✅ Migration verified successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verify();

