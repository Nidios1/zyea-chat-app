require('dotenv').config({ path: './config.env' });
const { getConnection, connectDB } = require('./config/database');

async function testFeedbackAPI() {
  console.log('🧪 Test Feedback API Query...\n');
  
  try {
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const connection = getConnection();
    if (!connection) {
      console.error('❌ Không thể kết nối database');
      return;
    }
    
    console.log('✅ Đã kết nối database\n');
    
    // Test query giống admin API
    const page = 1;
    const limit = 20;
    const status = '';
    const type = '';
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        f.id, f.user_id, f.content, f.type, f.media_url, f.reported_user_id, f.status, 
        f.admin_response, f.created_at, f.updated_at,
        u.username, u.full_name, u.email, u.avatar_url,
        ru.username as reported_username, ru.full_name as reported_full_name, ru.avatar_url as reported_avatar_url
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN users ru ON f.reported_user_id = ru.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND f.status = ?';
      params.push(status);
    }
    
    if (type) {
      query += ' AND f.type = ?';
      params.push(type);
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    console.log('📝 Executing query...');
    console.log('Query:', query);
    console.log('Params:', params);
    console.log('');
    
    const [feedbacks] = await connection.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM feedbacks WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].count;
    
    console.log(`✅ Query thành công!`);
    console.log(`📊 Tìm thấy ${feedbacks.length} feedback(s) (tổng: ${total})\n`);
    
    if (feedbacks.length > 0) {
      console.log('📋 Danh sách feedbacks:');
      feedbacks.forEach((fb, index) => {
        console.log(`\n${index + 1}. Feedback ID: ${fb.id}`);
        console.log(`   User: ${fb.full_name || fb.username || 'N/A'} (ID: ${fb.user_id})`);
        console.log(`   Email: ${fb.email || 'N/A'}`);
        console.log(`   Type: ${fb.type}`);
        console.log(`   Status: ${fb.status}`);
        console.log(`   Content: ${fb.content.substring(0, 100)}${fb.content.length > 100 ? '...' : ''}`);
        if (fb.reported_user_id) {
          console.log(`   Reported User: ${fb.reported_full_name || fb.reported_username || 'N/A'} (ID: ${fb.reported_user_id})`);
        }
        console.log(`   Created: ${fb.created_at}`);
      });
    } else {
      console.log('⚠️ Không có feedback nào');
    }
    
    console.log('\n✅ Test hoàn tất!');
    console.log('\n💡 Nếu query thành công nhưng admin không thấy, có thể do:');
    console.log('   1. Server chưa được restart');
    console.log('   2. Authentication/Authorization issue');
    console.log('   3. Frontend cache issue');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testFeedbackAPI();

