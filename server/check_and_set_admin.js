const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkAndSetAdmin() {
  let connection;
  
  try {
    console.log('🚀 Checking users and admin roles...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone'
    });

    console.log('✅ Connected to database\n');

    // Get all users
    const [users] = await connection.execute(
      'SELECT id, username, email, full_name, role FROM users ORDER BY id'
    );

    console.log('📊 All users in database:');
    console.log('─'.repeat(60));
    users.forEach(u => {
      const role = u.role || 'user';
      const roleBadge = role === 'admin' ? '👑 ADMIN' : '👤 USER';
      console.log(`ID: ${u.id} | ${roleBadge} | ${u.email} | ${u.full_name || u.username}`);
    });
    console.log('─'.repeat(60));

    // Count admins
    const [admins] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      ['admin']
    );

    console.log(`\n📈 Total admins: ${admins[0].count}`);
    console.log(`📈 Total users: ${users.length}`);

    // Ask if user wants to set admin for specific email
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n💡 Enter email to set as admin (or press Enter to skip): ', async (email) => {
      if (email && email.trim()) {
        try {
          const [result] = await connection.execute(
            'UPDATE users SET role = ? WHERE email = ?',
            ['admin', email.trim()]
          );

          if (result.affectedRows > 0) {
            console.log(`\n✅ Successfully set ${email.trim()} as admin!`);
            console.log('💡 Please logout and login again to see Admin Panel.');
          } else {
            console.log(`\n⚠️  No user found with email: ${email.trim()}`);
          }
        } catch (error) {
          console.error('❌ Error:', error.message);
        }
      } else {
        console.log('\n⏭️  Skipped. No changes made.');
      }

      await connection.end();
      rl.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndSetAdmin();

