const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

let connection;

const connectDB = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('MySQL connected successfully');
    
    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const createTables = async () => {
  try {
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        cover_url VARCHAR(500) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        status ENUM('online', 'recently_active', 'away', 'offline') DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Conversations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) DEFAULT NULL,
        type ENUM('private', 'group') DEFAULT 'private',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Conversation participants table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT,
        user_id INT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participant (conversation_id, user_id)
      )
    `);

    // Messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT,
        sender_id INT,
        content TEXT NOT NULL,
        message_type ENUM('text', 'image', 'file') DEFAULT 'text',
        file_url VARCHAR(255) DEFAULT NULL,
        deleted_for_user INT,
        reactions TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (deleted_for_user) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add reactions column if it doesn't exist (for existing databases)
    try {
      const [columns] = await connection.execute(`
        SHOW COLUMNS FROM messages LIKE 'reactions'
      `);
      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE messages ADD COLUMN reactions TEXT DEFAULT NULL
        `);
      }
    } catch (e) {
      // Ignore if column already exists
      console.log('Could not add reactions column (may already exist):', e.message);
    }

    // Friends table (first definition - will be removed later)

    // Message read status table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS message_read_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT,
        user_id INT,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_message_read (message_id, user_id)
      )
    `);

    // Message deletions table - tracks which users deleted which messages
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS message_deletions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_message_user_deletion (message_id, user_id)
      )
    `);

    // Typing status table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS typing_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT,
        user_id INT,
        is_typing BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_typing_status (conversation_id, user_id)
      )
    `);

    // Conversation settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversation_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT,
        user_id INT,
        pinned BOOLEAN DEFAULT FALSE,
        hidden BOOLEAN DEFAULT FALSE,
        nickname VARCHAR(100),
        is_close_friend BOOLEAN DEFAULT FALSE,
        call_notifications BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_conversation_settings (conversation_id, user_id)
      )
    `);

    // Posts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT,
        image_url VARCHAR(500),
        post_type ENUM('text', 'image') DEFAULT 'text',
        privacy ENUM('public', 'friends', 'private') DEFAULT 'public',
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Post likes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_post_like (post_id, user_id)
      )
    `);

    // Post comments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Post shares table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS post_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_post_share (post_id, user_id)
      )
    `);

    // Friends table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS friends (
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

    // Follows table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_follow (follower_id, following_id)
      )
    `);

    // Notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
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

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error.message);
  }
};

const getConnection = () => connection;

module.exports = { connectDB, getConnection };
