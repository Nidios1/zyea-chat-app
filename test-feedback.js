// Load config giống như server/index.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', 'config.env') });
const { getConnection, connectDB } = require('./server/config/database');

async function testFeedback() {
  console.log('🧪 Bắt đầu test feedback system...\n');
  
  try {
    // Kết nối database trước
    console.log('⏳ Đang kết nối database...');
    await connectDB();
    console.log('⏳ Đang kết nối database...\n');
    
    // Đợi một chút để connection được thiết lập
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Không thể kết nối database');
      return;
    }
    
    console.log('✅ Đã kết nối database\n');
    
    // 1. Kiểm tra bảng feedbacks
    console.log('1️⃣ Kiểm tra bảng feedbacks...');
    try {
      const [tables] = await connection.execute("SHOW TABLES LIKE 'feedbacks'");
      if (tables.length === 0) {
        console.log('⚠️ Bảng feedbacks chưa tồn tại, đang tạo...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS feedbacks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            content TEXT NOT NULL,
            type ENUM('feedback', 'report', 'bug') DEFAULT 'feedback',
            media_url VARCHAR(500) NULL,
            reported_user_id INT NULL,
            status ENUM('pending', 'reviewed', 'resolved', 'rejected') DEFAULT 'pending',
            admin_response TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_reported_user_id (reported_user_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Đã tạo bảng feedbacks\n');
      } else {
        console.log('✅ Bảng feedbacks đã tồn tại\n');
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra/tạo bảng:', error.message);
      return;
    }
    
    // 2. Kiểm tra số lượng feedback
    console.log('2️⃣ Kiểm tra số lượng feedback...');
    try {
      const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM feedbacks');
      const total = countResult[0].count;
      console.log(`📊 Tổng số feedback: ${total}\n`);
      
      if (total === 0) {
        console.log('⚠️ Chưa có feedback nào trong database');
        console.log('💡 Tạo feedback test...');
        
        // Lấy user đầu tiên để tạo feedback test
        const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
        if (users.length === 0) {
          console.log('❌ Không có user nào trong database');
          return;
        }
        
        const testUserId = users[0].id;
        const [result] = await connection.execute(
          `INSERT INTO feedbacks (user_id, content, type, status) 
           VALUES (?, ?, ?, ?)`,
          [testUserId, 'Đây là feedback test để kiểm tra hệ thống', 'feedback', 'pending']
        );
        console.log(`✅ Đã tạo feedback test với ID: ${result.insertId}\n`);
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra số lượng:', error.message);
      return;
    }
    
    // 3. Lấy danh sách feedback với query giống admin
    console.log('3️⃣ Test query admin feedbacks...');
    try {
      const query = `
        SELECT 
          f.id, f.user_id, f.content, f.type, f.media_url, f.reported_user_id, f.status, 
          f.admin_response, f.created_at, f.updated_at,
          u.username, u.full_name, u.email, u.avatar_url,
          ru.username as reported_username, ru.full_name as reported_full_name, ru.avatar_url as reported_avatar_url
        FROM feedbacks f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN users ru ON f.reported_user_id = ru.id
        WHERE 1=1
        ORDER BY f.created_at DESC
        LIMIT 20
      `;
      
      const [feedbacks] = await connection.execute(query);
      console.log(`📋 Tìm thấy ${feedbacks.length} feedback(s):\n`);
      
      if (feedbacks.length > 0) {
        feedbacks.forEach((fb, index) => {
          console.log(`${index + 1}. ID: ${fb.id}`);
          console.log(`   User: ${fb.full_name || fb.username || 'N/A'} (ID: ${fb.user_id})`);
          console.log(`   Type: ${fb.type}`);
          console.log(`   Status: ${fb.status}`);
          console.log(`   Content: ${fb.content.substring(0, 50)}...`);
          console.log(`   Created: ${fb.created_at}`);
          console.log('');
        });
      } else {
        console.log('⚠️ Query trả về 0 feedback');
      }
    } catch (error) {
      console.error('❌ Lỗi khi query feedbacks:', error.message);
      console.error('Stack:', error.stack);
      return;
    }
    
    // 4. Kiểm tra cấu trúc bảng
    console.log('4️⃣ Kiểm tra cấu trúc bảng feedbacks...');
    try {
      const [columns] = await connection.execute('DESCRIBE feedbacks');
      console.log('📋 Các cột trong bảng:');
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra cấu trúc:', error.message);
    }
    
    // 5. Kiểm tra users có tồn tại không
    console.log('5️⃣ Kiểm tra users...');
    try {
      const [users] = await connection.execute('SELECT id, username, full_name, role FROM users LIMIT 5');
      console.log(`📊 Tìm thấy ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name || user.username} (ID: ${user.id}, Role: ${user.role || 'user'})`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra users:', error.message);
    }
    
    console.log('✅ Test hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Chạy test
testFeedback();

