import { Capacitor } from '@capacitor/core';

/**
 * SQLite Database Utility
 * Local database for offline storage and performance
 */

let db = null;

// Initialize SQLite database
export const initDatabase = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('ℹ️ SQLite only available on native platforms, using fallback');
    return null;
  }

  try {
    const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
    
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    
    // Create or open database
    db = await sqlite.createConnection(
      'zyea_db',
      false, // encrypted
      'no-encryption',
      1, // version
      false // readonly
    );

    await db.open();

    // Create tables
    await createTables();

    console.log('✅ SQLite database initialized');
    return db;
  } catch (error) {
    console.error('❌ SQLite init error:', error);
    return null;
  }
};

// Create database tables
const createTables = async () => {
  if (!db) return;

  const schemas = `
    -- Messages cache
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      conversation_id INTEGER,
      sender_id INTEGER,
      content TEXT,
      message_type TEXT DEFAULT 'text',
      created_at TEXT,
      is_read INTEGER DEFAULT 0,
      sent_to_server INTEGER DEFAULT 0,
      UNIQUE(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

    -- Conversations cache
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY,
      participant_id INTEGER,
      participant_name TEXT,
      participant_avatar TEXT,
      last_message TEXT,
      last_message_time TEXT,
      unread_count INTEGER DEFAULT 0,
      UNIQUE(id)
    );

    -- User cache
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      email TEXT,
      full_name TEXT,
      avatar_url TEXT,
      is_online INTEGER DEFAULT 0,
      last_seen TEXT,
      UNIQUE(id)
    );

    -- Posts cache (NewsFeed)
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      content TEXT,
      image_url TEXT,
      created_at TEXT,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      UNIQUE(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

    -- Pending operations (for offline sync)
    CREATE TABLE IF NOT EXISTS pending_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT,
      data TEXT,
      created_at TEXT,
      retry_count INTEGER DEFAULT 0
    );
  `;

  try {
    await db.execute(schemas);
    console.log('✅ Database tables created');
  } catch (error) {
    console.error('❌ Create tables error:', error);
  }
};

// Cache messages locally
export const cacheMessages = async (conversationId, messages) => {
  if (!db) return;

  try {
    const values = messages.map(msg => [
      msg.id,
      conversationId,
      msg.sender_id,
      msg.content,
      msg.message_type || 'text',
      msg.created_at,
      msg.is_read ? 1 : 0,
      1 // already sent to server
    ]);

    const query = `
      INSERT OR REPLACE INTO messages 
      (id, conversation_id, sender_id, content, message_type, created_at, is_read, sent_to_server)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const value of values) {
      await db.run(query, value);
    }

    console.log(`✅ Cached ${messages.length} messages`);
  } catch (error) {
    console.error('❌ Cache messages error:', error);
  }
};

// Get cached messages
export const getCachedMessages = async (conversationId, limit = 50) => {
  if (!db) return [];

  try {
    const query = `
      SELECT * FROM messages 
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const result = await db.query(query, [conversationId, limit]);
    return result.values || [];
  } catch (error) {
    console.error('❌ Get cached messages error:', error);
    return [];
  }
};

// Cache conversations
export const cacheConversations = async (conversations) => {
  if (!db) return;

  try {
    const query = `
      INSERT OR REPLACE INTO conversations 
      (id, participant_id, participant_name, participant_avatar, last_message, last_message_time, unread_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const conv of conversations) {
      await db.run(query, [
        conv.id,
        conv.participant_id,
        conv.participant_name,
        conv.participant_avatar,
        conv.last_message,
        conv.last_message_time,
        conv.unread_count || 0
      ]);
    }

    console.log(`✅ Cached ${conversations.length} conversations`);
  } catch (error) {
    console.error('❌ Cache conversations error:', error);
  }
};

// Get cached conversations
export const getCachedConversations = async () => {
  if (!db) return [];

  try {
    const query = `
      SELECT * FROM conversations 
      ORDER BY last_message_time DESC
    `;

    const result = await db.query(query);
    return result.values || [];
  } catch (error) {
    console.error('❌ Get cached conversations error:', error);
    return [];
  }
};

// Add pending operation (for offline)
export const addPendingOperation = async (operationType, data) => {
  if (!db) return;

  try {
    const query = `
      INSERT INTO pending_operations (operation_type, data, created_at, retry_count)
      VALUES (?, ?, ?, 0)
    `;

    await db.run(query, [
      operationType,
      JSON.stringify(data),
      new Date().toISOString()
    ]);

    console.log('✅ Added pending operation:', operationType);
  } catch (error) {
    console.error('❌ Add pending operation error:', error);
  }
};

// Get pending operations
export const getPendingOperations = async () => {
  if (!db) return [];

  try {
    const query = `SELECT * FROM pending_operations ORDER BY created_at ASC`;
    const result = await db.query(query);
    
    return (result.values || []).map(op => ({
      ...op,
      data: JSON.parse(op.data)
    }));
  } catch (error) {
    console.error('❌ Get pending operations error:', error);
    return [];
  }
};

// Delete pending operation
export const deletePendingOperation = async (id) => {
  if (!db) return;

  try {
    const query = `DELETE FROM pending_operations WHERE id = ?`;
    await db.run(query, [id]);
    console.log('✅ Deleted pending operation:', id);
  } catch (error) {
    console.error('❌ Delete pending operation error:', error);
  }
};

// Clear all cached data
export const clearCache = async () => {
  if (!db) return;

  try {
    await db.execute(`
      DELETE FROM messages;
      DELETE FROM conversations;
      DELETE FROM users;
      DELETE FROM posts;
    `);
    console.log('✅ Cache cleared');
  } catch (error) {
    console.error('❌ Clear cache error:', error);
  }
};

// Get database stats
export const getDatabaseStats = async () => {
  if (!db) return null;

  try {
    const queries = {
      messages: 'SELECT COUNT(*) as count FROM messages',
      conversations: 'SELECT COUNT(*) as count FROM conversations',
      users: 'SELECT COUNT(*) as count FROM users',
      posts: 'SELECT COUNT(*) as count FROM posts',
      pending: 'SELECT COUNT(*) as count FROM pending_operations'
    };

    const stats = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await db.query(query);
      stats[key] = result.values[0]?.count || 0;
    }

    return stats;
  } catch (error) {
    console.error('❌ Get stats error:', error);
    return null;
  }
};

export default {
  initDatabase,
  cacheMessages,
  getCachedMessages,
  cacheConversations,
  getCachedConversations,
  addPendingOperation,
  getPendingOperations,
  deletePendingOperation,
  clearCache,
  getDatabaseStats
};

