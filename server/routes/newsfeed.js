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
    // Get type from query - handle both string and undefined
    // Check both req.query.type and req.query.type (case insensitive)
    const typeParam = req.query.type;
    const type = typeParam ? String(typeParam).toLowerCase().trim() : 'all'; // Default to 'all'
    
    console.log('📱 [Backend] /posts request - userId:', userId);
    console.log('📱 [Backend] req.query:', JSON.stringify(req.query));
    console.log('📱 [Backend] typeParam:', typeParam, 'type:', type, 'typeof:', typeof typeParam);
    console.log('📱 [Backend] Will use query for type:', type);
    
    let query, params;
    
    // When type is 'all' or undefined/null, show ALL posts from everyone
    // Explicitly check for 'all' string or undefined/null
    // IMPORTANT: Default to 'all' if type is not 'following' to show all posts
    if (type !== 'following') {
      // Get ALL PUBLIC posts from everyone (like Threads "For you" tab)
      // Show all public posts - everyone can see public posts
      
      // Debug: Check total posts in database
      const [totalPosts] = await getConnection().execute('SELECT COUNT(*) as count FROM posts');
      const [uniqueUsers] = await getConnection().execute('SELECT COUNT(DISTINCT user_id) as count FROM posts');
      console.log('📱 [Backend] Total posts in DB:', totalPosts[0].count, 'from', uniqueUsers[0].count, 'users');
      
      query = `
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
        WHERE p.privacy = 'public' OR p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
      params = [userId, userId];
      console.log('📱 [Backend] Fetching ALL PUBLIC posts from everyone, type:', type || 'undefined (defaulting to all)');
    } else if (type === 'following') {
      // Get posts from users being followed
      query = `
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
        JOIN follows fl ON fl.follower_id = ? AND fl.following_id = p.user_id
        WHERE p.privacy = 'public' OR p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
      params = [userId, userId, userId];
      console.log('📱 [Backend] Fetching posts from following, type:', type);
    } else {
      // Fallback: Should not happen, but if it does, show all posts
      console.log('⚠️ [Backend] Unexpected type value:', type, '- defaulting to all posts');
      query = `
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
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
      params = [userId];
    }
    
    const [posts] = await getConnection().execute(query, params);
    console.log('📱 [Backend] Found', posts.length, 'posts for type:', type || 'default');
    if (posts.length > 0) {
      const userIds = [...new Set(posts.map((p) => p.user_id))];
      console.log('📱 [Backend] Posts from', userIds.length, 'different users:', userIds);
      console.log('📱 [Backend] Sample post user_ids:', posts.slice(0, 5).map((p) => ({ id: p.id, user_id: p.user_id, username: p.username, isCurrentUser: p.user_id === userId })));
    } else {
      console.log('⚠️ [Backend] No posts found! Check database.');
    }

    // Get comments for each post and parse images
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
      
      // Parse images from image_url
      if (post.image_url) {
        try {
          // Try to parse as JSON (for multiple images)
          const parsed = JSON.parse(post.image_url);
          if (Array.isArray(parsed)) {
            post.images = parsed;
            post.image_url = parsed[0]; // Keep first image for backward compatibility
          } else {
            post.images = [post.image_url];
          }
        } catch (e) {
          // Not JSON, treat as single image
          post.images = [post.image_url];
        }
      } else {
        post.images = [];
      }

      // Add videoUrl to response (using video_url from database)
      if (post.video_url) {
        post.videoUrl = post.video_url;
      }
    }

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/posts', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const { content, images, videoUrl, privacy = 'public' } = req.body;
    
    console.log('Creating post:', { userId, content, privacy, images, videoUrl });
    console.log('Request body:', req.body);
    
    // Handle images - can be array or single string
    let imageUrl = null;
    if (images && Array.isArray(images) && images.length > 0) {
      // If multiple images, store as JSON string
      if (images.length === 1) {
        imageUrl = images[0];
      } else {
        imageUrl = JSON.stringify(images);
      }
    } else if (images && typeof images === 'string') {
      imageUrl = images;
    }

    // Handle videoUrl
    let video_url = videoUrl || null;

    console.log('Executing INSERT query...');
    // Try to insert with video_url, fallback to old schema if column doesn't exist
    let result;
    try {
      [result] = await getConnection().execute(`
        INSERT INTO posts (user_id, content, image_url, video_url, privacy)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, content || '', imageUrl, video_url, privacy]);
    } catch (error) {
      // If video_url column doesn't exist, try without it
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('video_url')) {
        console.warn('video_url column not found, attempting to add it...');
        try {
          await getConnection().execute(`
            ALTER TABLE posts ADD COLUMN video_url VARCHAR(500) DEFAULT NULL
          `);
          // Retry insert with video_url
          [result] = await getConnection().execute(`
            INSERT INTO posts (user_id, content, image_url, video_url, privacy)
            VALUES (?, ?, ?, ?, ?)
          `, [userId, content || '', imageUrl, video_url, privacy]);
        } catch (alterError) {
          console.error('Failed to add video_url column:', alterError);
          // Fallback to insert without video_url
          [result] = await getConnection().execute(`
            INSERT INTO posts (user_id, content, image_url, privacy)
            VALUES (?, ?, ?, ?)
          `, [userId, content || '', imageUrl, privacy]);
        }
      } else {
        throw error;
      }
    }

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

    const post = posts[0];
    
    // Parse images from image_url
    if (post.image_url) {
      try {
        const parsed = JSON.parse(post.image_url);
        if (Array.isArray(parsed)) {
          post.images = parsed;
        } else {
          post.images = [post.image_url];
        }
      } catch (e) {
        post.images = [post.image_url];
      }
    } else {
      post.images = [];
    }

    // Add videoUrl to response
    if (post.video_url) {
      post.videoUrl = post.video_url;
    }

    console.log('Retrieved post:', post);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error: ' + (error.message || 'Unknown error'),
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
