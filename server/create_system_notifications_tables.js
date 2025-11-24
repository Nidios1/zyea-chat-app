const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function createSystemNotificationsTables() {
  let connection;
  
  try {
    console.log('🚀 Creating system notifications tables...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone'
    });

    console.log('✅ Connected to database');

    // Create system_notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL DEFAULT 'Cập nhật tài khoản',
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        target_audience ENUM('all', 'specific') DEFAULT 'all',
        target_user_ids TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_category (category),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Created system_notifications table');

    // Create user_system_notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_system_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        system_notification_id INT NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (system_notification_id) REFERENCES system_notifications(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_system_notification (user_id, system_notification_id),
        INDEX idx_user_read (user_id, \`read\`),
        INDEX idx_user_created (user_id, created_at)
      )
    `);
    console.log('✅ Created user_system_notifications table');

    await connection.end();
    console.log('✅ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createSystemNotificationsTables();

