const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

let connection;

const connectDB = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone',
      timezone: '+00:00', // Set timezone to UTC for consistent timestamp handling
      // Additional options for Docker MySQL compatibility
      typeCast: function (field, next) {
        // Convert TINYINT(1) to boolean
        if (field.type === 'TINY' && field.length === 1) {
          return field.string() === '1';
        }
        return next();
      },
      // Ensure proper number handling
      supportBigNumbers: true,
      bigNumberStrings: false
    });

    console.log('MySQL connected successfully');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    
    // Set session timezone to UTC for consistent timestamp handling
    await connection.execute("SET time_zone = '+00:00'");
    
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
        role ENUM('user', 'admin') DEFAULT 'user',
        status ENUM('online', 'recently_active', 'away', 'offline') DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add role column if it doesn't exist (for existing databases)
    try {
      const [roleColumns] = await connection.execute(`
        SHOW COLUMNS FROM users LIKE 'role'
      `);
      if (roleColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'
        `);
        console.log('Added role column to users table');
      }
    } catch (e) {
      console.log('Could not add role column (may already exist):', e.message);
    }

    // Add activity_status_enabled column if it doesn't exist (for existing databases)
    try {
      const [activityStatusColumns] = await connection.execute(`
        SHOW COLUMNS FROM users LIKE 'activity_status_enabled'
      `);
      if (activityStatusColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE users ADD COLUMN activity_status_enabled BOOLEAN DEFAULT TRUE
        `);
        console.log('Added activity_status_enabled column to users table');
      }
    } catch (e) {
      console.log('Could not add activity_status_enabled column (may already exist):', e.message);
    }

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

    // Add created_by column if it doesn't exist (for existing databases)
    try {
      const [createdByColumns] = await connection.execute(`
        SHOW COLUMNS FROM conversations LIKE 'created_by'
      `);
      if (createdByColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE conversations ADD COLUMN created_by INT
        `);
        await connection.execute(`
          ALTER TABLE conversations ADD CONSTRAINT fk_conversations_created_by 
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log('Added created_by column to conversations table');
      }
    } catch (e) {
      console.log('Could not add created_by column (may already exist):', e.message);
    }

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
        message_type ENUM('text', 'image', 'file', 'sticker', 'video', 'system', 'call') DEFAULT 'text',
        file_url VARCHAR(255) DEFAULT NULL,
        deleted_for_user INT,
        reactions TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (deleted_for_user) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Update message_type ENUM to include new types (for existing databases)
    try {
      // Check current ENUM values
      const [enumInfo] = await connection.execute(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'messages' 
        AND COLUMN_NAME = 'message_type'
      `);
      
      if (enumInfo.length > 0) {
        const currentEnum = enumInfo[0].COLUMN_TYPE;
        // Check if 'sticker' is already in ENUM
        if (!currentEnum.includes("'sticker'") || 
            !currentEnum.includes("'video'") || 
            !currentEnum.includes("'system'") || 
            !currentEnum.includes("'call'")) {
          console.log('Updating message_type ENUM to include sticker, video, system, call...');
          await connection.execute(`
            ALTER TABLE messages 
            MODIFY COLUMN message_type ENUM('text', 'image', 'file', 'sticker', 'video', 'system', 'call') DEFAULT 'text'
          `);
          console.log('✅ Updated message_type ENUM successfully');
        }
      }
    } catch (e) {
      console.log('Could not update message_type ENUM (may already be updated):', e.message);
    }
    
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

    // Add edited_at column if it doesn't exist (for tracking edited messages)
    try {
      const [editedColumns] = await connection.execute(`
        SHOW COLUMNS FROM messages LIKE 'edited_at'
      `);
      if (editedColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL
        `);
        console.log('Added edited_at column to messages table');
      }
    } catch (e) {
      console.log('Could not add edited_at column (may already exist):', e.message);
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
        reaction_type VARCHAR(20) DEFAULT 'like',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_post_like (post_id, user_id)
      )
    `);

    // Post views table - track which users have viewed which posts
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS post_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_post_view (post_id, user_id)
      )
    `);
    
    // Add reaction_type column if it doesn't exist (for existing databases)
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'post_likes' 
        AND COLUMN_NAME = 'reaction_type'
      `);
      
      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE post_likes 
          ADD COLUMN reaction_type VARCHAR(20) DEFAULT 'like'
        `);
        console.log('✅ Added reaction_type column to post_likes table');
      }
    } catch (error) {
      // Column might already exist or other error, log but don't fail
      console.log('Note: Could not add reaction_type column (may already exist):', error.message);
    }

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
        post_id INT,
        reaction_type VARCHAR(20),
        \`read\` BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        INDEX idx_user_read (user_id, \`read\`),
        INDEX idx_user_created (user_id, created_at),
        INDEX idx_post_id (post_id)
      )
    `);
    
    // Thêm các cột mới nếu chưa tồn tại (migration)
    try {
      // Kiểm tra xem cột post_id đã tồn tại chưa
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'notifications' 
        AND COLUMN_NAME IN ('post_id', 'reaction_type')
      `);
      
      const existingColumns = columns.map((col) => col.COLUMN_NAME);
      
      if (!existingColumns.includes('post_id')) {
        await connection.execute(`
          ALTER TABLE notifications ADD COLUMN post_id INT
        `);
        await connection.execute(`
          ALTER TABLE notifications 
          ADD FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        `).catch(() => {
          // Ignore nếu foreign key đã tồn tại
        });
        await connection.execute(`
          ALTER TABLE notifications ADD INDEX idx_post_id (post_id)
        `).catch(() => {
          // Ignore nếu index đã tồn tại
        });
        console.log('✅ Added post_id column to notifications table');
      }
      
      if (!existingColumns.includes('reaction_type')) {
        await connection.execute(`
          ALTER TABLE notifications ADD COLUMN reaction_type VARCHAR(20)
        `);
        console.log('✅ Added reaction_type column to notifications table');
      }
    } catch (error) {
      // Ignore error nếu cột đã tồn tại
      if (error.message && !error.message.includes('Duplicate column name')) {
        console.log('Note: Some notification columns may already exist:', error.message);
      }
    }

    // Sticker packs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sticker_packs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        icon_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_active (is_active),
        INDEX idx_sort (sort_order)
      )
    `);

    // Stickers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stickers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pack_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        file_format ENUM('webp', 'png', 'jpg', 'jpeg', 'gif') DEFAULT 'webp',
        file_size INT,
        width INT DEFAULT 512,
        height INT DEFAULT 512,
        is_animated BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (pack_id) REFERENCES sticker_packs(id) ON DELETE CASCADE,
        INDEX idx_pack (pack_id),
        INDEX idx_sort (sort_order)
      )
    `);

    // System notifications table
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

    // User system notifications read status table
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

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error.message);
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Database connection not established. Call connectDB() first.');
  }
  return connection;
};

module.exports = { connectDB, getConnection };
