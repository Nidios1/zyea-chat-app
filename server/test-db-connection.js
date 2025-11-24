const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function testConnection() {
  let connection;
  
  try {
    console.log('🔍 Testing database connection...');
    console.log('Config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD ? '***' : 'not set'
    });
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone',
      timezone: '+00:00'
    });

    console.log('✅ Connected to MySQL successfully');
    
    // Test query - LIMIT and OFFSET must be literals, not parameters
    console.log('\n🔍 Testing query with LIMIT/OFFSET as literals...');
    const testUserId = 1;
    const testConversationId = 1;
    const testLimit = 50;
    const testOffset = 0;
    
    // Validate limit and offset are integers (prevent SQL injection)
    if (!Number.isInteger(testLimit) || !Number.isInteger(testOffset) || testLimit < 0 || testOffset < 0) {
      throw new Error('Invalid limit or offset');
    }
    
    const [result] = await connection.execute(`
      SELECT m.id, m.content, m.message_type, m.file_url, m.created_at, m.reactions,
             m.edited_at,
             u.id as sender_id, u.username, u.full_name, u.avatar_url,
             mrs.read_at
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = ?
      LEFT JOIN message_deletions md ON m.id = md.message_id AND md.user_id = ?
      WHERE m.conversation_id = ? 
        AND md.id IS NULL
      ORDER BY m.created_at DESC
      LIMIT ${testLimit} OFFSET ${testOffset}
    `, [testUserId, testUserId, testConversationId]);
    
    console.log('✅ Query executed successfully');
    console.log(`Found ${result.length} messages`);
    
    // Check user permissions
    console.log('\n🔍 Checking user permissions...');
    const [grants] = await connection.execute('SHOW GRANTS FOR CURRENT_USER()');
    console.log('User grants:', grants);
    
    // Check if tables exist
    console.log('\n🔍 Checking tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME || 'zalo_clone']);
    console.log('Tables found:', tables.map(t => t.TABLE_NAME));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();

