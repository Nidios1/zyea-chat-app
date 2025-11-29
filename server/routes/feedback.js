const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All feedback routes require authentication
router.use(authenticateToken);

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const { content, type = 'feedback', mediaUrl, reported_user_id } = req.body;
    const userId = req.user.id;

    console.log('📝 Feedback submission - Request received:', {
      userId,
      type,
      contentLength: content?.length,
      hasMedia: !!mediaUrl
    });

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung góp ý không được để trống' });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({ message: 'Nội dung góp ý phải có ít nhất 10 ký tự' });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ message: 'Nội dung góp ý không được vượt quá 1000 ký tự' });
    }

    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Feedback submission - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }

    // Check if feedbacks table exists, if not create it
    try {
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
      
      // Add reported_user_id column if table exists but column doesn't
      try {
        await connection.execute(`
          ALTER TABLE feedbacks 
          ADD COLUMN IF NOT EXISTS reported_user_id INT NULL,
          ADD FOREIGN KEY IF NOT EXISTS (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
          ADD INDEX IF NOT EXISTS idx_reported_user_id (reported_user_id)
        `);
      } catch (alterError) {
        // Column might already exist, ignore error
        console.log('Note: reported_user_id column might already exist');
      }
      console.log('✅ Feedback table created or already exists');
    } catch (tableError) {
      console.error('❌ Error creating feedbacks table:', tableError);
      // Continue anyway, table might already exist
    }

    // Insert feedback
    const [result] = await connection.execute(
      `INSERT INTO feedbacks (user_id, content, type, media_url, reported_user_id, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, content.trim(), type, mediaUrl || null, reported_user_id || null]
    );

    console.log('✅ Feedback submitted successfully:', {
      feedbackId: result.insertId,
      userId,
      type
    });

    res.json({
      message: 'Cảm ơn bạn đã góp ý! Chúng tôi sẽ xem xét và cải thiện ứng dụng.',
      feedbackId: result.insertId
    });
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    res.status(500).json({
      message: 'Không thể gửi góp ý. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's feedback history (optional - for future use)
router.get('/my-feedback', async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = getConnection();
    
    if (!connection) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    const [feedbacks] = await connection.execute(
      `SELECT id, content, type, media_url, status, admin_response, created_at, updated_at 
       FROM feedbacks 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

