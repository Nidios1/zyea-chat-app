const { getConnection } = require('./config/database');
require('dotenv').config({ path: './config.env' });

async function checkBotAvatar() {
  try {
    const connection = getConnection();
    
    // Check if BOT_USER_ID is set
    const botUserIdFromEnv = process.env.BOT_USER_ID;
    
    if (botUserIdFromEnv) {
      console.log('🤖 Bot is configured to use real user ID:', botUserIdFromEnv);
      const [botUser] = await connection.execute(
        'SELECT id, username, full_name, avatar_url FROM users WHERE id = ?',
        [botUserIdFromEnv]
      );
      
      if (botUser.length > 0) {
        console.log('✅ Bot user info:', botUser[0]);
        console.log('📸 Avatar URL:', botUser[0].avatar_url);
        if (botUser[0].avatar_url) {
          console.log('✅ Avatar is set');
        } else {
          console.log('⚠️ Avatar is not set');
        }
      } else {
        console.log('❌ Bot user not found');
      }
    } else {
      console.log('🤖 Bot is using system user');
      
      // Find system user
      const [systemUsers] = await connection.execute(
        'SELECT id, username, full_name, avatar_url FROM users WHERE username = ? OR email = ? LIMIT 1',
        ['system', 'system@zyea.com']
      );
      
      if (systemUsers.length > 0) {
        const systemUser = systemUsers[0];
        console.log('✅ System user info:', systemUser);
        console.log('📸 Avatar URL:', systemUser.avatar_url);
        
        if (systemUser.avatar_url) {
          console.log('✅ Avatar is set');
          console.log('🔗 Full URL should be: http://YOUR_SERVER_IP:5000' + systemUser.avatar_url);
        } else {
          console.log('⚠️ Avatar is not set');
          console.log('💡 Run: node update-system-user.js');
        }
      } else {
        console.log('❌ System user not found');
      }
    }
    
    // Check recent system messages
    console.log('\n📬 Checking recent system messages...');
    const [messages] = await connection.execute(`
      SELECT m.id, m.content, m.created_at, u.id as sender_id, u.username, u.full_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.message_type = 'system' OR u.username = 'system'
      ORDER BY m.created_at DESC
      LIMIT 5
    `);
    
    if (messages.length > 0) {
      console.log(`Found ${messages.length} system messages:`);
      messages.forEach((msg, idx) => {
        console.log(`\n${idx + 1}. Message ID: ${msg.id}`);
        console.log(`   Sender: ${msg.full_name} (ID: ${msg.sender_id})`);
        console.log(`   Avatar URL: ${msg.avatar_url || 'NOT SET'}`);
        console.log(`   Content: ${msg.content.substring(0, 50)}...`);
      });
    } else {
      console.log('No system messages found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Connect to database first
const connectDB = require('./config/database').connectDB;
connectDB().then(() => {
  checkBotAvatar();
}).catch((error) => {
  console.error('❌ Failed to connect to database:', error);
  process.exit(1);
});

