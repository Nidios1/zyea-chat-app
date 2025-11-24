const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Get notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all' } = req.query;
    
    let whereClause = 'WHERE n.user_id = ?';
    let params = [userId];
    
    if (type !== 'all') {
      whereClause += ' AND n.type = ?';
      params.push(type);
    }
    
    const [notifications] = await getConnection().execute(`
      SELECT 
        n.*,
        u.username,
        u.full_name,
        u.avatar_url,
        p.image_url as post_image_url
      FROM notifications n
      LEFT JOIN users u ON n.from_user_id = u.id
      LEFT JOIN posts p ON n.post_id = p.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT 50
    `, params);

    console.log(`📬 [Notifications API] User ${userId} - Found ${notifications.length} notifications`);
    if (notifications.length > 0) {
      console.log(`📬 [Notifications API] Sample: Type=${notifications[0].type}, From=${notifications[0].full_name || notifications[0].username}, Message=${notifications[0].message}`);
    }

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent notifications (for bell dropdown)
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [notifications] = await getConnection().execute(`
      SELECT 
        n.*,
        u.username,
        u.full_name,
        u.avatar_url,
        p.image_url as post_image_url
      FROM notifications n
      LEFT JOIN users u ON n.from_user_id = u.id
      LEFT JOIN posts p ON n.post_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [result] = await getConnection().execute(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND \`read\` = FALSE
    `, [userId]);

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const [result] = await getConnection().execute(`
      UPDATE notifications 
      SET \`read\` = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.post('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    await getConnection().execute(`
      UPDATE notifications 
      SET \`read\` = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND \`read\` = FALSE
    `, [userId]);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request from notification
router.post('/:id/accept-friend-request', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const { fromUserId } = req.body;
    
    const connection = getConnection();
    
    // Start transaction
    await connection.execute('START TRANSACTION');
    
    try {
      // Update the friend request to accepted
      const [result] = await connection.execute(`
        UPDATE friends 
        SET status = 'accepted' 
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
      `, [fromUserId, userId]);

      if (result.affectedRows === 0) {
        throw new Error('Friend request not found');
      }

      // Create reciprocal friendship
      await connection.execute(`
        INSERT INTO friends (user_id, friend_id, status)
        VALUES (?, ?, 'accepted')
        ON DUPLICATE KEY UPDATE status = 'accepted'
      `, [userId, fromUserId]);

      // Mark notification as read
      await connection.execute(`
        UPDATE notifications 
        SET \`read\` = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

      // Create notification for the other user
      await connection.execute(`
        INSERT INTO notifications (user_id, from_user_id, type, message, read)
        VALUES (?, ?, 'friend_accepted', ?, FALSE)
      `, [fromUserId, userId, `${req.user.full_name || req.user.username} đã chấp nhận lời mời kết bạn của bạn`]);

      await connection.execute('COMMIT');
      res.json({ message: 'Friend request accepted' });
    } catch (error) {
      await connection.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request from notification
router.post('/:id/reject-friend-request', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const connection = getConnection();
    
    // Start transaction
    await connection.execute('START TRANSACTION');
    
    try {
      // Get notification details
      const [notification] = await connection.execute(`
        SELECT * FROM notifications WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

      if (notification.length === 0) {
        throw new Error('Notification not found');
      }

      const fromUserId = notification[0].from_user_id;

      // Delete the friend request
      await connection.execute(`
        DELETE FROM friends 
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
      `, [fromUserId, userId]);

      // Mark notification as read
      await connection.execute(`
        UPDATE notifications 
        SET \`read\` = TRUE, read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

      await connection.execute('COMMIT');
      res.json({ message: 'Friend request rejected' });
    } catch (error) {
      await connection.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SYSTEM NOTIFICATIONS ====================
// Get system notifications for current user
router.get('/system', async (req, res) => {
  try {
    const userId = req.user.id;
    // Parse query parameters to integers (they come as strings from URL)
    const category = req.query.category || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const connection = getConnection();
    
    let query = `
      SELECT 
        sn.*,
        usn.read as is_read,
        usn.read_at
      FROM system_notifications sn
      INNER JOIN user_system_notifications usn ON sn.id = usn.system_notification_id
      WHERE usn.user_id = ?
    `;
    const params = [userId];
    
    if (category) {
      query += ' AND sn.category = ?';
      params.push(category);
    }
    
    // LIMIT and OFFSET cannot be parameters in MySQL prepared statements
    // Use string interpolation after validation (safe because validated as integers)
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 0 || offset < 0) {
      throw new Error('Invalid limit or offset');
    }
    query += ` ORDER BY sn.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [notifications] = await connection.execute(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as count
      FROM system_notifications sn
      INNER JOIN user_system_notifications usn ON sn.id = usn.system_notification_id
      WHERE usn.user_id = ?
    `;
    const countParams = [userId];
    
    if (category) {
      countQuery += ' AND sn.category = ?';
      countParams.push(category);
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].count;
    
    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread system notifications count
router.get('/system/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [result] = await getConnection().execute(`
      SELECT COUNT(*) as count
      FROM user_system_notifications usn
      INNER JOIN system_notifications sn ON usn.system_notification_id = sn.id
      WHERE usn.user_id = ? AND usn.read = FALSE
    `, [userId]);

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread system notifications count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark system notification as read
router.post('/system/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const [result] = await getConnection().execute(`
      UPDATE user_system_notifications 
      SET \`read\` = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND system_notification_id = ?
    `, [userId, notificationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'System notification not found' });
    }

    res.json({ message: 'System notification marked as read' });
  } catch (error) {
    console.error('Error marking system notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all system notifications as read
router.post('/system/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    await getConnection().execute(`
      UPDATE user_system_notifications 
      SET \`read\` = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND \`read\` = FALSE
    `, [userId]);

    res.json({ message: 'All system notifications marked as read' });
  } catch (error) {
    console.error('Error marking all system notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to create notification
const createNotification = async (userId, fromUserId, type, message) => {
  try {
    await getConnection().execute(`
      INSERT INTO notifications (user_id, from_user_id, type, message, read)
      VALUES (?, ?, ?, ?, FALSE)
    `, [userId, fromUserId, type, message]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Export the helper function for use in other routes
module.exports = { router, createNotification };
