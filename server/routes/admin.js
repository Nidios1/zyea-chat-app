const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Helper function to parse ID from params
const parseId = (idParam) => {
  if (!idParam) {
    throw new Error('ID parameter is required');
  }
  const id = parseInt(idParam);
  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid ID: ${idParam}`);
  }
  return id;
};

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(isAdmin);

// ==================== DASHBOARD STATS ====================
router.get('/stats', async (req, res) => {
  try {
    const connection = getConnection();
    
    // Get total users
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const totalUsers = userCount[0].count;
    
    // Get total posts
    const [postCount] = await connection.execute('SELECT COUNT(*) as count FROM posts');
    const totalPosts = postCount[0].count;
    
    // Get total messages
    const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM messages');
    const totalMessages = messageCount[0].count;
    
    // Get total conversations
    const [conversationCount] = await connection.execute('SELECT COUNT(*) as count FROM conversations');
    const totalConversations = conversationCount[0].count;
    
    // Get active users (online in last 24 hours)
    const [activeUsers] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    const activeUsersCount = activeUsers[0].count;
    
    // Get new users today
    const [newUsersToday] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE DATE(created_at) = CURDATE()
    `);
    const newUsersTodayCount = newUsersToday[0].count;
    
    // Get new posts today
    const [newPostsToday] = await connection.execute(`
      SELECT COUNT(*) as count FROM posts 
      WHERE DATE(created_at) = CURDATE()
    `);
    const newPostsTodayCount = newPostsToday[0].count;
    
    // Get users by status
    const [usersByStatus] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM users 
      GROUP BY status
    `);
    
    // Get posts by privacy
    const [postsByPrivacy] = await connection.execute(`
      SELECT privacy, COUNT(*) as count 
      FROM posts 
      GROUP BY privacy
    `);
    
    res.json({
      totalUsers,
      totalPosts,
      totalMessages,
      totalConversations,
      activeUsers: activeUsersCount,
      newUsersToday: newUsersTodayCount,
      newPostsToday: newPostsTodayCount,
      usersByStatus: usersByStatus.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      postsByPrivacy: postsByPrivacy.reduce((acc, item) => {
        acc[item.privacy] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== USER MANAGEMENT ====================
// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    console.log('👥 Admin get users - Request received', {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      role: req.query.role,
      status: req.query.status
    });
    
    // Parse query parameters to integers (they come as strings from URL)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    const offset = (page - 1) * limit;
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Admin get users - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    // Validate pagination parameters
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 0 || offset < 0) {
      throw new Error('Invalid limit or offset');
    }
    
    let query = 'SELECT id, username, email, full_name, phone, avatar_url, role, status, last_seen, created_at FROM users WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    console.log('👥 Admin get users - Executing query...');
    const [users] = await connection.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].count;
    
    console.log('👥 Admin get users - Found:', users.length, 'users (total:', total, ')');
    
    res.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Admin get users error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    console.log('👥 Admin get user by ID - Request received:', id);
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Admin get user - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    const [users] = await connection.execute(
      'SELECT id, username, email, full_name, phone, avatar_url, cover_url, role, status, last_seen, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      console.log('⚠️ Admin get user - User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user stats
    const [postCount] = await connection.execute('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [id]);
    const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM messages WHERE sender_id = ?', [id]);
    const [friendCount] = await connection.execute('SELECT COUNT(*) as count FROM friends WHERE (user_id = ? OR friend_id = ?) AND status = "accepted"', [id, id]);
    
    console.log('✅ Admin get user - Found user:', users[0].username);
    
    res.json({
      ...users[0],
      stats: {
        posts: postCount[0].count,
        messages: messageCount[0].count,
        friends: friendCount[0].count
      }
    });
  } catch (error) {
    console.error('❌ Admin get user error:', error);
    if (error.message.includes('Invalid ID')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const { full_name, email, phone, role, status } = req.body;
    console.log('👥 Admin update user - Request received:', { id, updates: { full_name, email, phone, role, status } });
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Admin update user - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    // Check if user exists
    const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      console.log('⚠️ Admin update user - User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from removing their own admin role
    if (id == req.user.id && role && role !== 'admin') {
      console.log('⚠️ Admin update user - Cannot remove own admin role');
      return res.status(400).json({ message: 'Cannot remove your own admin role' });
    }
    
    const updates = [];
    const params = [];
    
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    params.push(id);
    await connection.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    console.log('✅ Admin update user - User updated successfully:', id);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ Admin update user error:', error);
    if (error.message.includes('Invalid ID')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    console.log('👥 Admin delete user - Request received:', id);
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Admin delete user - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    // Prevent admin from deleting themselves
    if (id == req.user.id) {
      console.log('⚠️ Admin delete user - Cannot delete own account');
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const [users] = await connection.execute('SELECT id, username FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      console.log('⚠️ Admin delete user - User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    
    console.log('✅ Admin delete user - User deleted successfully:', users[0].username);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Admin delete user error:', error);
    if (error.message.includes('Invalid ID')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Reset user password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const { newPassword } = req.body;
    console.log('👥 Admin reset password - Request received:', id);
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Admin reset password - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const [users] = await connection.execute('SELECT id, username FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      console.log('⚠️ Admin reset password - User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    
    console.log('✅ Admin reset password - Password reset successfully for user:', users[0].username);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Admin reset password error:', error);
    if (error.message.includes('Invalid ID')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== POST MANAGEMENT ====================
// Get all posts with pagination
router.get('/posts', async (req, res) => {
  try {
    // Parse query parameters to integers (they come as strings from URL)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const userId = req.query.userId || '';
    const offset = (page - 1) * limit;
    const connection = getConnection();
    
    let query = `
      SELECT p.id, p.user_id, p.content, p.image_url, p.post_type, p.privacy, 
             p.likes_count, p.comments_count, p.shares_count, p.created_at, p.updated_at,
             u.username, u.full_name, u.avatar_url
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      query += ' AND p.content LIKE ?';
      params.push(`%${search}%`);
    }
    
    if (userId) {
      query += ' AND p.user_id = ?';
      params.push(userId);
    }
    
    // LIMIT and OFFSET cannot be parameters in MySQL prepared statements
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 0 || offset < 0) {
      throw new Error('Invalid limit or offset');
    }
    query += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [posts] = await connection.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM posts WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND content LIKE ?';
      countParams.push(`%${search}%`);
    }
    
    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(userId);
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].count;
    
    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const connection = getConnection();
    
    await connection.execute('DELETE FROM posts WHERE id = ?', [id]);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Admin delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== REPORTS ====================
// Get recent activity (users, posts, messages)
router.get('/activity', async (req, res) => {
  try {
    // Parse query parameters to integers (they come as strings from URL)
    const limit = parseInt(req.query.limit) || 50;
    const connection = getConnection();
    
    // Recent users
    // LIMIT cannot be parameter in MySQL prepared statements
    if (!Number.isInteger(limit) || limit < 0) {
      throw new Error('Invalid limit');
    }
    const [recentUsers] = await connection.execute(
      `SELECT id, username, full_name, email, created_at FROM users ORDER BY created_at DESC LIMIT ${limit}`
    );
    
    // Recent posts
    const [recentPosts] = await connection.execute(
      `SELECT p.id, p.content, p.created_at, u.username, u.full_name 
       FROM posts p 
       LEFT JOIN users u ON p.user_id = u.id 
       ORDER BY p.created_at DESC LIMIT ${limit}`
    );
    
    res.json({
      recentUsers,
      recentPosts
    });
  } catch (error) {
    console.error('Admin activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== STICKER PACKS MANAGEMENT ====================
// Get all sticker packs
router.get('/sticker-packs', async (req, res) => {
  try {
    console.log('📦 Admin get sticker packs - Request received');
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Admin get sticker packs - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    console.log('📦 Admin get sticker packs - Executing query...');
    const [packs] = await connection.execute(`
      SELECT sp.*, 
             COUNT(s.id) as sticker_count,
             u.username as created_by_username
      FROM sticker_packs sp
      LEFT JOIN stickers s ON sp.id = s.pack_id
      LEFT JOIN users u ON sp.created_by = u.id
      GROUP BY sp.id
      ORDER BY sp.sort_order ASC, sp.created_at DESC
    `);
    
    console.log('📦 Admin get sticker packs - Found:', packs.length);
    if (packs.length > 0) {
      console.log('📦 Packs:', packs.map(p => ({ id: p.id, name: p.name, title: p.title, count: p.sticker_count })));
    } else {
      console.log('⚠️ No sticker packs found in database');
    }
    
    res.json({ packs: packs || [] });
  } catch (error) {
    console.error('❌ Admin get sticker packs error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get sticker pack by ID with stickers
router.get('/sticker-packs/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const connection = getConnection();
    
    const [packs] = await connection.execute(
      'SELECT * FROM sticker_packs WHERE id = ?',
      [id]
    );
    
    if (packs.length === 0) {
      return res.status(404).json({ message: 'Sticker pack not found' });
    }
    
    const [stickers] = await connection.execute(
      'SELECT * FROM stickers WHERE pack_id = ? ORDER BY sort_order ASC, id ASC',
      [id]
    );
    
    res.json({
      pack: packs[0],
      stickers
    });
  } catch (error) {
    console.error('Admin get sticker pack error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create sticker pack
router.post('/sticker-packs', async (req, res) => {
  try {
    const { name, title, description, icon_url, sort_order } = req.body;
    const connection = getConnection();
    
    if (!name || !title) {
      return res.status(400).json({ message: 'Name and title are required' });
    }
    
    const [result] = await connection.execute(
      `INSERT INTO sticker_packs (name, title, description, icon_url, sort_order, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, title, description || null, icon_url || null, sort_order || 0, req.user.id]
    );
    
    res.json({ 
      message: 'Sticker pack created successfully',
      packId: result.insertId
    });
  } catch (error) {
    console.error('Admin create sticker pack error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update sticker pack
router.put('/sticker-packs/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const { name, title, description, icon_url, is_active, sort_order } = req.body;
    const connection = getConnection();
    
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (icon_url !== undefined) {
      updates.push('icon_url = ?');
      params.push(icon_url);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    params.push(id);
    await connection.execute(
      `UPDATE sticker_packs SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'Sticker pack updated successfully' });
  } catch (error) {
    console.error('Admin update sticker pack error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete sticker pack
router.delete('/sticker-packs/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const connection = getConnection();
    
    await connection.execute('DELETE FROM sticker_packs WHERE id = ?', [id]);
    
    res.json({ message: 'Sticker pack deleted successfully' });
  } catch (error) {
    console.error('Admin delete sticker pack error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== STICKERS MANAGEMENT ====================
// Add sticker to pack
router.post('/sticker-packs/:packId/stickers', async (req, res) => {
  try {
    const packId = parseId(req.params.packId);
    const { image_url, file_format, file_size, width, height, is_animated, sort_order } = req.body;
    const connection = getConnection();
    
    if (!image_url) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
    // Verify pack exists
    const [packs] = await connection.execute('SELECT id FROM sticker_packs WHERE id = ?', [packId]);
    if (packs.length === 0) {
      return res.status(404).json({ message: 'Sticker pack not found' });
    }
    
    const [result] = await connection.execute(
      `INSERT INTO stickers (pack_id, image_url, file_format, file_size, width, height, is_animated, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        packId,
        image_url,
        file_format || 'webp',
        file_size || null,
        width || 512,
        height || 512,
        is_animated || false,
        sort_order || 0
      ]
    );
    
    res.json({
      message: 'Sticker added successfully',
      stickerId: result.insertId
    });
  } catch (error) {
    console.error('Admin add sticker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update sticker
router.put('/stickers/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const { image_url, file_format, file_size, width, height, is_animated, sort_order } = req.body;
    const connection = getConnection();
    
    const updates = [];
    const params = [];
    
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }
    if (file_format !== undefined) {
      updates.push('file_format = ?');
      params.push(file_format);
    }
    if (file_size !== undefined) {
      updates.push('file_size = ?');
      params.push(file_size);
    }
    if (width !== undefined) {
      updates.push('width = ?');
      params.push(width);
    }
    if (height !== undefined) {
      updates.push('height = ?');
      params.push(height);
    }
    if (is_animated !== undefined) {
      updates.push('is_animated = ?');
      params.push(is_animated);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    params.push(id);
    await connection.execute(
      `UPDATE stickers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'Sticker updated successfully' });
  } catch (error) {
    console.error('Admin update sticker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete sticker
router.delete('/stickers/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const connection = getConnection();
    
    await connection.execute('DELETE FROM stickers WHERE id = ?', [id]);
    
    res.json({ message: 'Sticker deleted successfully' });
  } catch (error) {
    console.error('Admin delete sticker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Batch update sticker sort order
router.put('/sticker-packs/:packId/stickers/reorder', async (req, res) => {
  try {
    const packId = parseId(req.params.packId);
    const { stickerOrders } = req.body; // Array of { id, sort_order }
    
    console.log('🔄 Admin reorder stickers - Request received:', { packId, count: stickerOrders?.length });
    
    if (!Array.isArray(stickerOrders) || stickerOrders.length === 0) {
      return res.status(400).json({ message: 'stickerOrders must be a non-empty array' });
    }
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Admin reorder stickers - Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    // Verify pack exists
    const [packs] = await connection.execute('SELECT id FROM sticker_packs WHERE id = ?', [packId]);
    if (packs.length === 0) {
      console.log('⚠️ Admin reorder stickers - Pack not found:', packId);
      return res.status(404).json({ message: 'Sticker pack not found' });
    }
    
    // Update each sticker's sort_order
    const updatePromises = stickerOrders.map(({ id, sort_order }) => {
      if (!id || typeof sort_order !== 'number') {
        throw new Error(`Invalid sticker order: id=${id}, sort_order=${sort_order}`);
      }
      return connection.execute(
        'UPDATE stickers SET sort_order = ? WHERE id = ? AND pack_id = ?',
        [sort_order, id, packId]
      );
    });
    
    await Promise.all(updatePromises);
    
    console.log('✅ Admin reorder stickers - Successfully updated', stickerOrders.length, 'stickers');
    res.json({ message: 'Stickers reordered successfully', updated: stickerOrders.length });
  } catch (error) {
    console.error('❌ Admin reorder stickers error:', error);
    if (error.message.includes('Invalid ID') || error.message.includes('Invalid sticker order')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== SYSTEM NOTIFICATIONS ====================
// Get all system notifications
router.get('/system-notifications', async (req, res) => {
  console.log('📢 GET /admin/system-notifications - Request received');
  try {
    // Parse query parameters to integers (they come as strings from URL)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category || '';
    const offset = (page - 1) * limit;
    const connection = getConnection();
    
    console.log('📢 Query params:', { page, limit, category });
    
    // Check if table exists, if not return empty array
    try {
      await connection.execute('SELECT 1 FROM system_notifications LIMIT 1');
      console.log('✅ system_notifications table exists');
    } catch (tableError) {
      // Table doesn't exist, return empty result
      console.log('⚠️ system_notifications table does not exist yet:', tableError.message);
      return res.json({
        notifications: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }
    
    let query = `
      SELECT 
        sn.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM system_notifications sn
      LEFT JOIN users u ON sn.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category) {
      query += ' AND sn.category = ?';
      params.push(category);
    }
    
    // LIMIT and OFFSET cannot be parameters in MySQL prepared statements
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 0 || offset < 0) {
      throw new Error('Invalid limit or offset');
    }
    query += ` ORDER BY sn.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [notifications] = await connection.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM system_notifications WHERE 1=1';
    const countParams = [];
    
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].count;
    
    console.log(`✅ Returning ${notifications.length} notifications, total: ${total}`);
    
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
    console.error('Admin get system notifications error:', error);
    // Return detailed error for debugging
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create system notification
router.post('/system-notifications', async (req, res) => {
  try {
    const { category, title, description, target_audience, target_user_ids } = req.body;
    const connection = getConnection();
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    // Insert system notification
    const [result] = await connection.execute(`
      INSERT INTO system_notifications (category, title, description, target_audience, target_user_ids, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      category || 'Cập nhật tài khoản',
      title,
      description,
      target_audience || 'all',
      target_user_ids ? JSON.stringify(target_user_ids) : null,
      req.user.id
    ]);
    
    const notificationId = result.insertId;
    
    // If target_audience is 'all', create entries for all users
    // If 'specific', create entries only for specified users
    if (target_audience === 'all') {
      // Get all user IDs
      const [users] = await connection.execute('SELECT id FROM users');
      const userIds = users.map(u => u.id);
      
      // Create user_system_notifications entries for all users
      if (userIds.length > 0) {
        const values = userIds.map(userId => `(${userId}, ${notificationId}, FALSE)`).join(',');
        await connection.execute(`
          INSERT INTO user_system_notifications (user_id, system_notification_id, \`read\`)
          VALUES ${values}
          ON DUPLICATE KEY UPDATE system_notification_id = system_notification_id
        `);
      }
    } else if (target_audience === 'specific' && target_user_ids) {
      // Create entries only for specified users
      const userIds = Array.isArray(target_user_ids) ? target_user_ids : JSON.parse(target_user_ids);
      if (userIds.length > 0) {
        const values = userIds.map(userId => `(${userId}, ${notificationId}, FALSE)`).join(',');
        await connection.execute(`
          INSERT INTO user_system_notifications (user_id, system_notification_id, \`read\`)
          VALUES ${values}
          ON DUPLICATE KEY UPDATE system_notification_id = system_notification_id
        `);
      }
    }
    
    // Emit socket event to notify all users (or specific users)
    if (req.io) {
      const notification = {
        id: notificationId,
        category: category || 'Cập nhật tài khoản',
        title,
        description,
        created_at: new Date()
      };
      
      if (target_audience === 'all') {
        req.io.emit('system_notification', notification);
      } else if (target_audience === 'specific' && target_user_ids) {
        const userIds = Array.isArray(target_user_ids) ? target_user_ids : JSON.parse(target_user_ids);
        userIds.forEach(userId => {
          req.io.to(`user_${userId}`).emit('system_notification', notification);
        });
      }
    }
    
    res.json({ 
      message: 'System notification created successfully',
      notification: {
        id: notificationId,
        category: category || 'Cập nhật tài khoản',
        title,
        description,
        target_audience: target_audience || 'all',
        target_user_ids: target_user_ids || null,
        created_by: req.user.id,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Admin create system notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete system notification
router.delete('/system-notifications/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const connection = getConnection();
    
    await connection.execute('DELETE FROM system_notifications WHERE id = ?', [id]);
    
    res.json({ message: 'System notification deleted successfully' });
  } catch (error) {
    console.error('Admin delete system notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

