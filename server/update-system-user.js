const { getConnection } = require('./config/database');
require('dotenv').config({ path: './config.env' });

async function updateSystemUser() {
  try {
    const connection = getConnection();
    
    // Find system user
    const [systemUsers] = await connection.execute(
      'SELECT id, username, full_name, avatar_url FROM users WHERE username = ? OR email = ? LIMIT 1',
      ['system', 'system@zyea.com']
    );
    
    if (systemUsers.length === 0) {
      console.log('❌ System user not found. It will be created automatically on next QR login.');
      process.exit(0);
    }
    
    const systemUser = systemUsers[0];
    console.log('📋 Current system user:', {
      id: systemUser.id,
      username: systemUser.username,
      full_name: systemUser.full_name,
      avatar_url: systemUser.avatar_url
    });
    
    // Update avatar_url and full_name
    const systemAvatarUrl = '/assets/icon.jpg';
    const systemFullName = 'ZYEA Chat';
    await connection.execute(
      'UPDATE users SET avatar_url = ?, full_name = ? WHERE id = ?',
      [systemAvatarUrl, systemFullName, systemUser.id]
    );
    
    console.log('✅ System user updated:');
    console.log('   - Avatar URL:', systemAvatarUrl);
    console.log('   - Full Name:', systemFullName);
    
    // Verify update
    const [updated] = await connection.execute(
      'SELECT avatar_url, full_name FROM users WHERE id = ?',
      [systemUser.id]
    );
    console.log('✅ Verified update:');
    console.log('   - Avatar URL:', updated[0].avatar_url);
    console.log('   - Full Name:', updated[0].full_name);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating system user:', error);
    process.exit(1);
  }
}

// Connect to database first
const connectDB = require('./config/database').connectDB;
connectDB().then(() => {
  updateSystemUser();
}).catch((error) => {
  console.error('❌ Failed to connect to database:', error);
  process.exit(1);
});

