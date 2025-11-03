const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Starting database setup...');
    
    // First connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'zalo_clone'}\``);
    console.log(`✅ Database '${process.env.DB_NAME || 'zalo_clone'}' created/verified`);

    // Close connection and reconnect to the specific database
    await connection.end();
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone'
    });

    console.log(`✅ Connected to database '${process.env.DB_NAME || 'zalo_clone'}'`);

    // Drop all existing tables (disable foreign key checks first)
    console.log('🗑️  Dropping existing tables...');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const dropTables = [
      'DROP TABLE IF EXISTS notifications',
      'DROP TABLE IF EXISTS post_shares',
      'DROP TABLE IF EXISTS post_likes',
      'DROP TABLE IF EXISTS comments',
      'DROP TABLE IF EXISTS posts',
      'DROP TABLE IF EXISTS message_read_status',
      'DROP TABLE IF EXISTS messages',
      'DROP TABLE IF EXISTS conversation_participants',
      'DROP TABLE IF EXISTS conversations',
      'DROP TABLE IF EXISTS follows',
      'DROP TABLE IF EXISTS friends',
      'DROP TABLE IF EXISTS users'
    ];

    for (const dropQuery of dropTables) {
      await connection.execute(dropQuery);
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ All existing tables dropped');

    // Create users table
    console.log('📝 Creating users table...');
    await connection.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        avatar VARCHAR(255),
        avatar_url VARCHAR(500) DEFAULT NULL,
        cover_url VARCHAR(500) DEFAULT NULL,
        phone VARCHAR(20),
        status ENUM('online', 'offline', 'away', 'recently_active') DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create conversations table
    console.log('📝 Creating conversations table...');
    await connection.execute(`
      CREATE TABLE conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        type ENUM('private', 'group') DEFAULT 'private',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create conversation_participants table
    console.log('📝 Creating conversation_participants table...');
    await connection.execute(`
      CREATE TABLE conversation_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT,
        user_id INT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participant (conversation_id, user_id)
      )
    `);

    // Create messages table
    console.log('📝 Creating messages table...');
    await connection.execute(`
      CREATE TABLE messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT,
        sender_id INT,
        content TEXT NOT NULL,
        message_type ENUM('text', 'image', 'file') DEFAULT 'text',
        file_url VARCHAR(255) DEFAULT NULL,
        deleted_for_user INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (deleted_for_user) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create friends table
    console.log('📝 Creating friends table...');
    await connection.execute(`
      CREATE TABLE friends (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_friendship (user_id, friend_id)
      )
    `);

    // Create follows table
    console.log('📝 Creating follows table...');
    await connection.execute(`
      CREATE TABLE follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_follow (follower_id, following_id)
      )
    `);

    // Create message_read_status table
    console.log('📝 Creating message_read_status table...');
    await connection.execute(`
      CREATE TABLE message_read_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT,
        user_id INT,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_message_read (message_id, user_id)
      )
    `);

    // Create posts table
    console.log('📝 Creating posts table...');
    await connection.execute(`
      CREATE TABLE posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT,
        image_url VARCHAR(255),
        privacy ENUM('public', 'friends', 'private') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create comments table
    console.log('📝 Creating comments table...');
    await connection.execute(`
      CREATE TABLE comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create post_likes table
    console.log('📝 Creating post_likes table...');
    await connection.execute(`
      CREATE TABLE post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_post_like (post_id, user_id)
      )
    `);

    // Create post_shares table
    console.log('📝 Creating post_shares table...');
    await connection.execute(`
      CREATE TABLE post_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_post_share (post_id, user_id)
      )
    `);

    // Create notifications table
    console.log('📝 Creating notifications table...');
    await connection.execute(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        from_user_id INT,
        type ENUM('friend_request', 'friend_accepted', 'follow', 'like', 'comment', 'share', 'mention') NOT NULL,
        message TEXT NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_read (user_id, \`read\`),
        INDEX idx_user_created (user_id, created_at)
      )
    `);

    // Insert sample users
    console.log('👥 Creating sample users...');
    const bcrypt = require('bcryptjs');
    
    const sampleUsers = [
      {
        username: 'admin@zalo.com',
        email: 'admin@zalo.com',
        password: await bcrypt.hash('123456', 10),
        full_name: 'Administrator',
        phone: '0123456789'
      },
      {
        username: 'user1@zalo.com',
        email: 'user1@zalo.com',
        password: await bcrypt.hash('123456', 10),
        full_name: 'Nguyễn Văn A',
        phone: '0123456780'
      },
      {
        username: 'user2@zalo.com',
        email: 'user2@zalo.com',
        password: await bcrypt.hash('123456', 10),
        full_name: 'Trần Thị B',
        phone: '0123456781'
      },
      {
        username: 'user3@zalo.com',
        email: 'user3@zalo.com',
        password: await bcrypt.hash('123456', 10),
        full_name: 'Lê Văn C',
        phone: '0123456782'
      }
    ];

    for (const user of sampleUsers) {
      await connection.execute(`
        INSERT INTO users (username, email, password, full_name, phone, status)
        VALUES (?, ?, ?, ?, ?, 'online')
      `, [user.username, user.email, user.password, user.full_name, user.phone]);
    }

    console.log('✅ Sample users created');

    // Create sample conversations
    console.log('💬 Creating sample conversations...');
    await connection.execute(`
      INSERT INTO conversations (name, type) VALUES 
      ('Chat với User1', 'private'),
      ('Chat với User2', 'private'),
      ('Nhóm Test', 'group')
    `);

    // Add participants to conversations
    await connection.execute(`
      INSERT INTO conversation_participants (conversation_id, user_id) VALUES 
      (1, 1), (1, 2),
      (2, 1), (2, 3),
      (3, 1), (3, 2), (3, 3)
    `);

    console.log('✅ Sample conversations created');

    // Create sample posts
    console.log('📝 Creating sample posts...');
    await connection.execute(`
      INSERT INTO posts (user_id, content, privacy) VALUES 
      (1, 'Chào mừng đến với Zalo Clone!', 'public'),
      (2, 'Hôm nay trời đẹp quá!', 'public'),
      (3, 'Đang học lập trình React', 'friends')
    `);

    console.log('✅ Sample posts created');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('- Users: 4 sample users created');
    console.log('- Conversations: 3 sample conversations');
    console.log('- Posts: 3 sample posts');
    console.log('- All tables created with proper relationships');
    
    console.log('\n🔑 Sample Login Credentials:');
    console.log('- Email: admin@zalo.com, Password: 123456');
    console.log('- Email: user1@zalo.com, Password: 123456');
    console.log('- Email: user2@zalo.com, Password: 123456');
    console.log('- Email: user3@zalo.com, Password: 123456');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
