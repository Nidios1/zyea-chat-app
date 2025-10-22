const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, '../uploads/posts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter 
});

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    res.json({ message: 'Newsfeed API is working', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ message: 'Error: ' + error.message });
  }
});

// Test create post without auth
router.post('/test-post', async (req, res) => {
  try {
    console.log('Test post request:', req.body);
    res.json({ message: 'Test post received', body: req.body });
  } catch (error) {
    res.status(500).json({ message: 'Error: ' + error.message });
  }
});

// Get all posts with user info and interaction status
router.get('/posts', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [posts] = await getConnection().execute(`
      SELECT 
        p.*,
        u.username,
        u.full_name,
        u.avatar_url,
        u.status,
        CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as isLiked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = ?
      LEFT JOIN friends f ON (
        (f.user_id = ? AND f.friend_id = p.user_id AND f.status = 'accepted') OR
        (f.friend_id = ? AND f.user_id = p.user_id AND f.status = 'accepted')
      )
      LEFT JOIN follows fl ON (fl.follower_id = ? AND fl.following_id = p.user_id)
      WHERE p.user_id = ? OR f.id IS NOT NULL OR fl.id IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [userId, userId, userId, userId, userId]);

    // Get comments for each post
    for (let post of posts) {
      const [comments] = await getConnection().execute(`
        SELECT 
          pc.*,
          u.username,
          u.full_name,
          u.avatar_url
        FROM post_comments pc
        JOIN users u ON pc.user_id = u.id
        WHERE pc.post_id = ?
        ORDER BY pc.created_at ASC
        LIMIT 10
      `, [post.id]);
      
      post.comments = comments;
    }

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/posts', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, type = 'text', privacy = 'public' } = req.body;
    
    console.log('Creating post:', { userId, content, type, privacy, file: req.file });
    
    let imageUrl = null;
    if (req.file && type === 'image') {
      imageUrl = `/api/uploads/${req.file.filename}`;
    }

    const [result] = await getConnection().execute(`
      INSERT INTO posts (user_id, content, image_url, post_type, privacy)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, content, imageUrl, type, privacy]);

    console.log('Post created with ID:', result.insertId);

    // Get the created post with user info
    const [posts] = await getConnection().execute(`
      SELECT 
        p.*,
        u.username,
        u.full_name,
        u.avatar_url,
        u.status,
        0 as isLiked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.insertId]);

    console.log('Retrieved post:', posts[0]);
    res.status(201).json(posts[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Like/Unlike a post with reaction type
router.post('/posts/:id/like', async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { reactionType = 'like' } = req.body;

    // Check if user already liked the post
    const [existingLike] = await getConnection().execute(`
      SELECT id, COALESCE(reaction_type, 'like') as reaction_type FROM post_likes WHERE post_id = ? AND user_id = ?
    `, [postId, userId]);

    if (existingLike.length > 0) {
      // Update reaction type or unlike if same reaction
      if (existingLike[0].reaction_type === reactionType) {
        // Unlike the post
        await getConnection().execute(`
          DELETE FROM post_likes WHERE post_id = ? AND user_id = ?
        `, [postId, userId]);
        
        await getConnection().execute(`
          UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?
        `, [postId]);
        
        res.json({ liked: false, reactionType: null });
      } else {
        // Update reaction type
        await getConnection().execute(`
          UPDATE post_likes SET reaction_type = ? WHERE post_id = ? AND user_id = ?
        `, [reactionType, postId, userId]);
        
        res.json({ liked: true, reactionType });
      }
    } else {
      // Like the post with reaction type
      await getConnection().execute(`
        INSERT INTO post_likes (post_id, user_id, reaction_type) VALUES (?, ?, ?)
      `, [postId, userId, reactionType]);
      
      await getConnection().execute(`
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?
      `, [postId]);
      
      res.json({ liked: true, reactionType });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Comment on a post
router.post('/posts/:id/comment', async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Add comment
    const [result] = await getConnection().execute(`
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `, [postId, userId, content.trim()]);

    // Update comment count
    await getConnection().execute(`
      UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?
    `, [postId]);

    // Get the comment with user info
    const [comments] = await getConnection().execute(`
      SELECT 
        pc.*,
        u.username,
        u.full_name,
        u.avatar_url
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.id = ?
    `, [result.insertId]);

    res.status(201).json(comments[0]);
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share a post
router.post('/posts/:id/share', async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    // Check if user already shared the post
    const [existingShare] = await getConnection().execute(`
      SELECT id FROM post_shares WHERE post_id = ? AND user_id = ?
    `, [postId, userId]);

    if (existingShare.length === 0) {
      // Add share
      await getConnection().execute(`
        INSERT INTO post_shares (post_id, user_id) VALUES (?, ?)
      `, [postId, userId]);
      
      await getConnection().execute(`
        UPDATE posts SET shares_count = shares_count + 1 WHERE id = ?
      `, [postId]);
    }

    res.json({ message: 'Post shared successfully' });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post
router.delete('/posts/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    // Check if user owns the post
    const [post] = await getConnection().execute(`
      SELECT user_id FROM posts WHERE id = ?
    `, [postId]);

    if (post.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post[0].user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete the post (cascade will handle related records)
    await getConnection().execute(`
      DELETE FROM posts WHERE id = ?
    `, [postId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get post comments
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [comments] = await getConnection().execute(`
      SELECT 
        pc.*,
        u.username,
        u.full_name,
        u.avatar_url
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = ?
      ORDER BY pc.created_at ASC
      LIMIT ? OFFSET ?
    `, [postId, limit, offset]);

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve uploaded images
router.get('/uploads/posts/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ message: 'Image not found' });
  }
});

module.exports = router;
