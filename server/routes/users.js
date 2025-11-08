const express = require('express');
const { getConnection } = require('../config/database');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get all users (for adding friends)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const connection = getConnection();

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;
    const [users] = await connection.execute(
      `SELECT id, username, full_name, email, phone, avatar_url, status, last_seen 
       FROM users 
       WHERE (username LIKE ? OR full_name LIKE ? OR email LIKE ? OR phone LIKE ?) 
       AND id != ? 
       ORDER BY 
         CASE 
           WHEN username LIKE ? THEN 1
           WHEN full_name LIKE ? THEN 2
           WHEN phone LIKE ? THEN 3
           WHEN email LIKE ? THEN 4
           ELSE 5
         END,
         full_name`,
      [searchTerm, searchTerm, searchTerm, searchTerm, req.user.id, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search user by email
router.get('/search/email', async (req, res) => {
  try {
    const { email } = req.query;
    const connection = getConnection();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users] = await connection.execute(
      `SELECT id, username, full_name, email, phone, avatar_url, status, last_seen 
       FROM users 
       WHERE email = ? AND id != ?`,
      [email, req.user.id]
    );

    res.json(users);
  } catch (error) {
    console.error('Search user by email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search user by username (for link sharing)
router.get('/search/username', async (req, res) => {
  try {
    const { username } = req.query;
    const connection = getConnection();

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const [users] = await connection.execute(
      `SELECT id, username, full_name, email, phone, avatar_url, status, last_seen 
       FROM users 
       WHERE username = ? AND id != ?`,
      [username, req.user.id]
    );

    res.json(users);
  } catch (error) {
    console.error('Search user by username error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search user by phone number
router.get('/search/phone', async (req, res) => {
  try {
    const { phone } = req.query;
    const connection = getConnection();

    if (!phone) {
      return res.status(400).json({ message: 'Số điện thoại là bắt buộc' });
    }

    // Normalize phone: remove +, spaces, dashes, and leading zeros
    const normalizedPhone = phone.replace(/[\+\s\-]/g, '').replace(/^0+/, '');
    
    // Try multiple formats:
    // 1. Exact match
    // 2. With leading zero
    // 3. Without + prefix
    // 4. With + prefix
    
    const [users] = await connection.execute(
      `SELECT id, username, full_name, email, phone, avatar_url, status, last_seen 
       FROM users 
       WHERE (phone = ? OR phone = ? OR phone = ? OR phone = ? OR phone LIKE ? OR phone LIKE ?)
       AND id != ?
       LIMIT 10`,
      [
        phone,                      // Original format
        phone.replace(/^\+/, '0'),  // +84... -> 0...
        phone.replace(/^0/, '+84'), // 0... -> +84...
        normalizedPhone,            // Normalized
        `%${normalizedPhone}%`,      // Partial match
        `%${phone}%`,               // Partial match original
        req.user.id
      ]
    );

    res.json(users);
  } catch (error) {
    console.error('Search user by phone error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile (must be before /:id route)
router.get('/profile', (req, res) => {
  console.log('Users profile endpoint - req.user:', req.user);
  res.json(req.user);
});

// Get friends list (must be before /:id route to avoid conflict)
router.get('/friends', async (req, res) => {
  try {
    const connection = getConnection();

    const [friends] = await connection.execute(`
      SELECT u.id, u.username, u.full_name, u.avatar_url, u.status, u.last_seen, f.status as friendship_status
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'accepted'
      ORDER BY u.full_name
    `, [req.user.id]);

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stats (followers/following counts) by ID
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const connection = getConnection();
    
    // Get followers count
    const [followersCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
      [id]
    );
    
    // Get following count
    const [followingCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
      [id]
    );
    
    res.json({
      followersCount: followersCount[0]?.count || 0,
      followingCount: followingCount[0]?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (must be after all specific routes like /profile, /friends)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📱 [GET /users/:id] Request - userId:', id);
    
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const connection = getConnection();
    if (!connection) {
      console.error('❌ Database connection not available');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Chỉ SELECT các cột có trong database (không có bio, location, website)
    const [users] = await connection.execute(
      `SELECT id, username, full_name, email, phone, avatar_url, cover_url, status, created_at 
       FROM users 
       WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      console.log('⚠️ User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Get followers and following counts
    const [followersCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
      [id]
    );
    
    const [followingCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
      [id]
    );

    const user = users[0];
    user.followers_count = followersCount[0]?.count || 0;
    user.following_count = followingCount[0]?.count || 0;

    console.log('✅ User found:', {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      hasAvatar: !!user.avatar_url,
      followers_count: user.followers_count,
      following_count: user.following_count
    });

    res.json(user);
  } catch (error) {
    console.error('❌ Get user by ID error:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ SQL Message:', error.sqlMessage);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;
    const connection = getConnection();

    await connection.execute(
      'UPDATE users SET full_name = ?, phone = ?, avatar = ? WHERE id = ?',
      [fullName, phone, avatar, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Friend-related routes moved to /api/friends

module.exports = router;
