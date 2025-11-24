#!/usr/bin/env node

/**
 * Script để thêm indexes cho database để tối ưu performance
 * Chạy script này để cải thiện tốc độ query
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addIndexes() {
  let connection;
  
  try {
    console.log('🔧 Đang kết nối database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zalo_clone',
      timezone: '+00:00'
    });

    console.log('✅ Đã kết nối database');
    console.log('📊 Đang thêm indexes để tối ưu performance...\n');
    
    // Indexes cho bảng messages
    const messageIndexes = [
      // Index cho conversation_id (dùng nhiều trong query messages)
      { name: 'idx_messages_conversation_id', table: 'messages', columns: 'conversation_id' },
      // Index cho sender_id
      { name: 'idx_messages_sender_id', table: 'messages', columns: 'sender_id' },
      // Composite index cho conversation_id và created_at (dùng trong ORDER BY)
      { name: 'idx_messages_conversation_created', table: 'messages', columns: 'conversation_id, created_at' },
      // Index cho created_at (dùng trong ORDER BY)
      { name: 'idx_messages_created_at', table: 'messages', columns: 'created_at' },
    ];
    
    // Indexes cho bảng conversations
    const conversationIndexes = [
      // Index cho updated_at (dùng trong ORDER BY khi lấy conversations)
      { name: 'idx_conversations_updated_at', table: 'conversations', columns: 'updated_at' },
      // Index cho created_at
      { name: 'idx_conversations_created_at', table: 'conversations', columns: 'created_at' },
    ];
    
    // Indexes cho bảng conversation_participants
    const participantIndexes = [
      // Composite index cho conversation_id và user_id (dùng trong JOIN và WHERE)
      { name: 'idx_participants_conv_user', table: 'conversation_participants', columns: 'conversation_id, user_id' },
      // Index cho user_id
      { name: 'idx_participants_user_id', table: 'conversation_participants', columns: 'user_id' },
    ];
    
    // Indexes cho bảng posts
    const postIndexes = [
      // Index cho user_id
      { name: 'idx_posts_user_id', table: 'posts', columns: 'user_id' },
      // Composite index cho privacy và created_at (dùng trong WHERE và ORDER BY)
      { name: 'idx_posts_privacy_created', table: 'posts', columns: 'privacy, created_at' },
      // Index cho created_at
      { name: 'idx_posts_created_at', table: 'posts', columns: 'created_at' },
    ];
    
    // Indexes cho bảng post_likes
    const postLikeIndexes = [
      // Composite index cho post_id và user_id (dùng trong JOIN và WHERE)
      { name: 'idx_post_likes_post_user', table: 'post_likes', columns: 'post_id, user_id' },
    ];
    
    // Indexes cho bảng message_read_status
    const readStatusIndexes = [
      // Composite index cho message_id và user_id
      { name: 'idx_read_status_msg_user', table: 'message_read_status', columns: 'message_id, user_id' },
    ];
    
    // Indexes cho bảng message_deletions
    const deletionIndexes = [
      // Composite index cho message_id và user_id
      { name: 'idx_deletions_msg_user', table: 'message_deletions', columns: 'message_id, user_id' },
    ];
    
    // Combine all indexes
    const allIndexes = [
      ...messageIndexes,
      ...conversationIndexes,
      ...participantIndexes,
      ...postIndexes,
      ...postLikeIndexes,
      ...readStatusIndexes,
      ...deletionIndexes,
    ];
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const index of allIndexes) {
      try {
        // Check if index already exists
        const [existing] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM information_schema.statistics 
          WHERE table_schema = DATABASE() 
          AND table_name = ? 
          AND index_name = ?
        `, [index.table, index.name]);
        
        if (existing[0].count > 0) {
          console.log(`⏭️  Index ${index.name} đã tồn tại, bỏ qua`);
          skipCount++;
          continue;
        }
        
        // Create index
        await connection.execute(`
          CREATE INDEX ${index.name} ON ${index.table} (${index.columns})
        `);
        
        console.log(`✅ Đã tạo index: ${index.name} trên ${index.table}(${index.columns})`);
        successCount++;
      } catch (error) {
        // Ignore "Duplicate key name" errors
        if (error.message.includes('Duplicate key name') || error.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  Index ${index.name} đã tồn tại, bỏ qua`);
          skipCount++;
        } else {
          console.error(`❌ Lỗi khi tạo index ${index.name}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n📊 Kết quả:');
    console.log(`✅ Đã tạo: ${successCount} indexes`);
    console.log(`⏭️  Đã bỏ qua: ${skipCount} indexes (đã tồn tại)`);
    if (errorCount > 0) {
      console.log(`❌ Lỗi: ${errorCount} indexes`);
    }
    console.log('\n✨ Hoàn tất! Database đã được tối ưu với indexes.');
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Lỗi khi thêm indexes:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

addIndexes();

