#!/usr/bin/env node

/**
 * Script để cập nhật ENUM của message_type trong bảng messages
 * Thêm các giá trị: 'sticker', 'video', 'system', 'call'
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function updateMessageTypeEnum() {
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
    
    // Kiểm tra ENUM hiện tại
    const [enumInfo] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'messages' 
      AND COLUMN_NAME = 'message_type'
    `);
    
    if (enumInfo.length === 0) {
      console.log('❌ Không tìm thấy cột message_type trong bảng messages');
      process.exit(1);
    }
    
    const currentEnum = enumInfo[0].COLUMN_TYPE;
    console.log('📋 ENUM hiện tại:', currentEnum);
    
    // Kiểm tra xem đã có các giá trị mới chưa
    const hasSticker = currentEnum.includes("'sticker'");
    const hasVideo = currentEnum.includes("'video'");
    const hasSystem = currentEnum.includes("'system'");
    const hasCall = currentEnum.includes("'call'");
    
    if (hasSticker && hasVideo && hasSystem && hasCall) {
      console.log('✅ ENUM đã được cập nhật đầy đủ');
      process.exit(0);
    }
    
    console.log('🔄 Đang cập nhật ENUM...');
    
    // Cập nhật ENUM
    await connection.execute(`
      ALTER TABLE messages 
      MODIFY COLUMN message_type ENUM('text', 'image', 'file', 'sticker', 'video', 'system', 'call') DEFAULT 'text'
    `);
    
    console.log('✅ Đã cập nhật ENUM thành công!');
    console.log('📋 Các giá trị mới: text, image, file, sticker, video, system, call');
    
    await connection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật ENUM:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

updateMessageTypeEnum();

