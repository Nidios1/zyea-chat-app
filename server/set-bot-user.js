const { getConnection } = require('./config/database');
require('dotenv').config({ path: './config.env' });

// Script to set a real user as bot
// Usage: node set-bot-user.js <user_id>
// Example: node set-bot-user.js 1

async function setBotUser() {
  try {
    const userId = process.argv[2];
    
    if (!userId) {
      console.log('❌ Please provide user ID');
      console.log('Usage: node set-bot-user.js <user_id>');
      console.log('Example: node set-bot-user.js 1');
      process.exit(1);
    }
    
    const connection = getConnection();
    
    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, username, full_name, avatar_url FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      console.log('❌ User not found with ID:', userId);
      process.exit(1);
    }
    
    const user = users[0];
    console.log('📋 User found:', {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url
    });
    
    // Update config.env or show instruction
    console.log('\n✅ To use this user as bot, add this line to your config.env:');
    console.log(`BOT_USER_ID=${user.id}`);
    console.log('\nThen restart your server.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Connect to database first
const connectDB = require('./config/database').connectDB;
connectDB().then(() => {
  setBotUser();
}).catch((error) => {
  console.error('❌ Failed to connect to database:', error);
  process.exit(1);
});

