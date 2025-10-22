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
      `SELECT id, username, full_name, email, avatar_url, status, last_seen 
       FROM users 
       WHERE (username LIKE ? OR full_name LIKE ? OR email LIKE ?) 
       AND id != ? 
       ORDER BY 
         CASE 
           WHEN username LIKE ? THEN 1
           WHEN full_name LIKE ? THEN 2
           WHEN email LIKE ? THEN 3
           ELSE 4
         END,
         full_name`,
      [searchTerm, searchTerm, searchTerm, req.user.id, searchTerm, searchTerm, searchTerm]
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
      `SELECT id, username, full_name, email, avatar_url, status, last_seen 
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
      `SELECT id, username, full_name, email, avatar_url, status, last_seen 
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

// Get user profile
router.get('/profile', (req, res) => {
  console.log('Users profile endpoint - req.user:', req.user);
  res.json(req.user);
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

// Get friends list
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

// Friend-related routes moved to /api/friends

module.exports = router;
