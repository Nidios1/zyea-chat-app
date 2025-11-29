const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create verification_requests table if it doesn't exist
const ensureVerificationTable = async () => {
  try {
    const connection = getConnection();
    if (!connection) return;

    // Check if table exists
    await connection.execute('SELECT 1 FROM verification_requests LIMIT 1');
  } catch (error) {
    // Table doesn't exist or connection not ready, create it
    try {
      const connection = getConnection();
      if (!connection) {
        console.log('⚠️ Database connection not ready, will create table on next request');
        return;
      }

      console.log('⚠️ Verification requests table does not exist, creating...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS verification_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          category ENUM('individual', 'organization', 'brand', 'public_figure', 'other') DEFAULT 'individual',
          reason TEXT NOT NULL,
          email VARCHAR(255) NOT NULL,
          id_card_image VARCHAR(500) NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          admin_id INT NULL,
          admin_response TEXT NULL,
          verified_by VARCHAR(255) NULL,
          verified_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Verification requests table created successfully');
    } catch (createError) {
      if (createError.message.includes('Database connection not established')) {
        console.log('⚠️ Database connection not ready, will create table on next request');
      } else {
        console.error('❌ Error creating verification_requests table:', createError);
      }
    }
  }
};

// Submit verification request
router.post('/request', async (req, res) => {
  try {
    // Ensure table exists before processing request
    await ensureVerificationTable();

    const { full_name, category, reason, email, id_card_image } = req.body;
    const userId = req.user.id;

    if (!full_name || !reason || !email) {
      return res.status(400).json({ message: 'Tên đầy đủ, email và lý do là bắt buộc' });
    }

    if (reason.trim().length < 20) {
      return res.status(400).json({ message: 'Lý do phải có ít nhất 20 ký tự' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (!id_card_image) {
      return res.status(400).json({ message: 'Vui lòng tải lên ảnh hộ chiếu hoặc CCCD' });
    }

    const connection = getConnection();
    if (!connection) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    // Check if user already has a pending request
    const [existingRequests] = await connection.execute(
      'SELECT id, status FROM verification_requests WHERE user_id = ? AND status = ?',
      [userId, 'pending']
    );

    if (existingRequests.length > 0) {
      return res.status(400).json({ message: 'Bạn đã có yêu cầu xác minh đang chờ duyệt' });
    }

    // Ensure users table has is_verified, verified_by, verified_at columns
    try {
      await connection.execute('SELECT is_verified FROM users LIMIT 1');
    } catch (error) {
      // Columns don't exist, add them
      console.log('⚠️ Adding verification columns to users table...');
      try {
        await connection.execute(`
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255) NULL,
          ADD COLUMN IF NOT EXISTS verified_at DATETIME NULL
        `);
        console.log('✅ Verification columns added to users table');
      } catch (alterError) {
        console.error('❌ Error adding verification columns:', alterError);
        // Continue anyway - columns might already exist
      }
    }

    // Check if user is already verified
    const [user] = await connection.execute(
      'SELECT is_verified FROM users WHERE id = ?',
      [userId]
    );

    if (user.length > 0 && user[0].is_verified) {
      return res.status(400).json({ message: 'Tài khoản của bạn đã được xác minh' });
    }

    // Ensure columns exist
    try {
      await connection.execute('SELECT id_card_image, email FROM verification_requests LIMIT 1');
    } catch (error) {
      // Columns don't exist, add them
      console.log('⚠️ Adding columns to verification_requests table...');
      try {
        // Add email column (MySQL doesn't support IF NOT EXISTS in ALTER TABLE)
        try {
          await connection.execute(`
            ALTER TABLE verification_requests
            ADD COLUMN email VARCHAR(255) NULL
          `);
          console.log('✅ email column added');
        } catch (e) {
          if (e.code !== 'ER_DUP_FIELDNAME') {
            console.error('Error adding email column:', e.message);
          }
        }
        
        // Add id_card_image column
        try {
          await connection.execute(`
            ALTER TABLE verification_requests
            ADD COLUMN id_card_image VARCHAR(500) NULL
          `);
          console.log('✅ id_card_image column added');
        } catch (e) {
          if (e.code !== 'ER_DUP_FIELDNAME') {
            console.error('Error adding id_card_image column:', e.message);
          }
        }
      } catch (alterError) {
        console.error('❌ Error adding columns:', alterError);
      }
    }

    // Insert verification request
    const [result] = await connection.execute(
      `INSERT INTO verification_requests (user_id, full_name, category, reason, email, id_card_image, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, full_name.trim(), category || 'individual', reason.trim(), email.trim(), id_card_image || null]
    );

    res.status(201).json({
      message: 'Yêu cầu xác minh đã được gửi thành công! Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.',
      requestId: result.insertId
    });
  } catch (error) {
    console.error('❌ Verification request error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get verification status for current user
router.get('/status', async (req, res) => {
  try {
    // Ensure table exists
    await ensureVerificationTable();

    const userId = req.user.id;
    const connection = getConnection();
    if (!connection) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    // Get user verification status
    const [users] = await connection.execute(
      'SELECT is_verified, verified_by, verified_at FROM users WHERE id = ?',
      [userId]
    );

    const isVerified = users.length > 0 && users[0].is_verified;
    let verificationRequest = null;

    // Get latest verification request if exists
    const [requests] = await connection.execute(
      `SELECT id, full_name, category, reason, email, id_card_image, status, admin_response, 
              verified_by, verified_at, created_at, updated_at
       FROM verification_requests 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (requests.length > 0) {
      verificationRequest = requests[0];
    }

    res.json({
      isVerified: Boolean(isVerified), // Convert to boolean (MySQL returns 1/0)
      verifiedBy: users.length > 0 ? users[0].verified_by : null,
      verifiedAt: users.length > 0 ? users[0].verified_at : null,
      request: verificationRequest
    });
  } catch (error) {
    console.error('❌ Get verification status error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Get verification info for a user (public)
router.get('/user/:userId', async (req, res) => {
  try {
    // Ensure table exists
    await ensureVerificationTable();

    const { userId } = req.params;
    const connection = getConnection();
    if (!connection) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    const [users] = await connection.execute(
      'SELECT is_verified, verified_by, verified_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      isVerified: Boolean(users[0].is_verified), // Convert to boolean (MySQL returns 1/0)
      verifiedBy: users[0].verified_by,
      verifiedAt: users[0].verified_at
    });
  } catch (error) {
    console.error('❌ Get user verification info error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

