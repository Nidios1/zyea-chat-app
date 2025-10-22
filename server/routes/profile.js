const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getConnection } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads/avatars directory if it doesn't exist
const avatarsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getConnection();
    
    const [rows] = await db.execute(
      'SELECT id, username, full_name, avatar_url, email, phone, bio, location, website, status, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getConnection();
    const { full_name, email, phone, bio, location, website } = req.body;
    
    // Validate required fields
    if (!full_name && !email && !phone && !bio && !location && !website) {
      return res.status(400).json({ message: 'At least one field must be provided' });
    }
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    
    if (email !== undefined) {
      // Check if email already exists (excluding current user)
      if (email) {
        const [existingUser] = await db.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );
        
        if (existingUser.length > 0) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }
      
      updates.push('email = ?');
      values.push(email);
    }
    
    if (phone !== undefined) {
      // Check if phone already exists (excluding current user)
      if (phone) {
        const [existingUser] = await db.execute(
          'SELECT id FROM users WHERE phone = ? AND id != ?',
          [phone, userId]
        );
        
        if (existingUser.length > 0) {
          return res.status(400).json({ message: 'Phone number already exists' });
        }
      }
      
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    
    if (website !== undefined) {
      updates.push('website = ?');
      values.push(website);
    }
    
    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add userId for WHERE clause
    values.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.execute(query, values);
    
    // Fetch updated user data
    const [updatedUser] = await db.execute(
      'SELECT id, username, full_name, avatar_url, email, phone, bio, location, website, status, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user status
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getConnection();
    const { status } = req.body;
    
    if (!status || !['online', 'recently_active', 'away', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await db.execute(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, userId]
    );
    
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getConnection();
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    // Get current user data
    const [users] = await db.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await db.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload avatar with error handling
router.post('/avatar', authenticateToken, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ 
        message: err.message || 'Error uploading file',
        error: err.toString()
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('📸 Avatar upload request received');
    console.log('User ID:', req.user?.id);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.error('❌ No file provided');
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    const userId = req.user.id;
    const db = getConnection();
    
    console.log('📋 Getting old avatar for user:', userId);
    // Get old avatar to delete it
    const [users] = await db.execute(
      'SELECT avatar_url FROM users WHERE id = ?',
      [userId]
    );
    
    const oldAvatarUrl = users[0]?.avatar_url;
    console.log('🗑️ Old avatar:', oldAvatarUrl);
    
    // Delete old avatar file if exists
    if (oldAvatarUrl) {
      const oldAvatarPath = path.join(__dirname, '..', oldAvatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        console.log('🗑️ Deleting old avatar:', oldAvatarPath);
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Generate URL for the uploaded avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('💾 New avatar URL:', avatarUrl);
    
    // Update avatar URL in database
    await db.execute(
      'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [avatarUrl, userId]
    );
    
    console.log('✅ Avatar uploaded successfully');
    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    
    // Delete uploaded file if database update failed
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error uploading avatar',
      error: error.message 
    });
  }
});

module.exports = router;
