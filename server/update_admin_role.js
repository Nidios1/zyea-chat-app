const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function updateAdminRole() {
  let connection;
  
  try {
    console.log('🚀 Starting admin role update...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone'
    });

    console.log('✅ Connected to database');

    // Check if role column exists
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM users LIKE 'role'
    `);
    
    if (columns.length === 0) {
      console.log('📝 Adding role column to users table...');
      await connection.execute(`
        ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'
      `);
      console.log('✅ Role column added');
    } else {
      console.log('✅ Role column already exists');
    }

    // Update admin user
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', 'admin@zalo.com']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Admin role updated for admin@zalo.com');
    } else {
      console.log('⚠️  No user found with email admin@zalo.com');
    }

    // Show all admin users
    const [admins] = await connection.execute(
      'SELECT id, username, email, role FROM users WHERE role = ?',
      ['admin']
    );

    console.log('\n📊 Admin users:');
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (ID: ${admin.id})`);
    });

    console.log('\n🎉 Update completed!');
    console.log('\n💡 Next steps:');
    console.log('  1. Logout and login again with admin@zalo.com');
    console.log('  2. Access /admin to use Admin Panel');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateAdminRole();

