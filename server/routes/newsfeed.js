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
          CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,
          pl.reaction_type as reactionType,
          COALESCE(like_counts.likes_count, 0) as likes_count,
          COALESCE(comment_counts.comments_count, 0) as comments_count,
          COALESCE(p.views_count, 0) as views_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = ?
        LEFT JOIN (
          SELECT post_id, COUNT(*) as likes_count
          FROM post_likes
          GROUP BY post_id
        ) like_counts ON p.id = like_counts.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comments_count
          FROM comments
          GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
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
          CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,
          pl.reaction_type as reactionType,
          COALESCE(like_counts.likes_count, 0) as likes_count,
          COALESCE(comment_counts.comments_count, 0) as comments_count,
          COALESCE(p.views_count, 0) as views_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = ?
        LEFT JOIN (
          SELECT post_id, COUNT(*) as likes_count
          FROM post_likes
          GROUP BY post_id
        ) like_counts ON p.id = like_counts.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comments_count
          FROM comments
          GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
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
          CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,
          pl.reaction_type as reactionType,
          COALESCE(like_counts.likes_count, 0) as likes_count,
          COALESCE(comment_counts.comments_count, 0) as comments_count,
          COALESCE(p.views_count, 0) as views_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_likes pl ON p.id = pl.post_id AND pl.user_id = ?
        LEFT JOIN (
          SELECT post_id, COUNT(*) as likes_count
          FROM post_likes
          GROUP BY post_id
        ) like_counts ON p.id = like_counts.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as comments_count
          FROM comments
          GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
      params = [userId];
    }
    
    let posts;
    try {
      [posts] = await getConnection().execute(query, params);
    } catch (error) {
      // Nếu lỗi do thiếu cột views_count, thử thêm cột và query lại
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('views_count')) {
        console.warn('views_count column not found, attempting to add it...');
        try {
          await getConnection().execute(`
            ALTER TABLE posts ADD COLUMN views_count INT DEFAULT 0
          `);
          // Query lại sau khi thêm cột
          [posts] = await getConnection().execute(query, params);
        } catch (alterError) {
          console.error('Failed to add views_count column:', alterError);
          // Fallback: query lại không có views_count
          const fallbackQuery = query.replace(/COALESCE\(p\.views_count, 0\) as views_count,?\s*/g, '');
          [posts] = await getConnection().execute(fallbackQuery, params);
          // Set views_count = 0 cho tất cả posts
          posts = posts.map((p) => ({ ...p, views_count: 0 }));
        }
      } else {
        throw error;
      }
    }
    
    console.log('📱 [Backend] Found', posts.length, 'posts for type:', type || 'default');
    if (posts.length > 0) {
      const userIds = [...new Set(posts.map((p) => p.user_id))];
      console.log('📱 [Backend] Posts from', userIds.length, 'different users:', userIds);
      console.log('📱 [Backend] Sample post user_ids:', posts.slice(0, 5).map((p) => ({ id: p.id, user_id: p.user_id, username: p.username, isCurrentUser: p.user_id === userId })));
    } else {
      console.log('⚠️ [Backend] No posts found! Check database.');
    }

    // Get all reactions for all posts to calculate breakdown
    const postIds = posts.map(p => p.id);
    let allReactions = [];
    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',');
      const [reactions] = await getConnection().execute(`
        SELECT post_id, reaction_type, COUNT(*) as count
        FROM post_likes
        WHERE post_id IN (${placeholders})
        GROUP BY post_id, reaction_type
      `, postIds);
      allReactions = reactions;
    }

    // Get comments for each post and parse images
    for (let post of posts) {
      // Calculate reactions breakdown from allReactions
      const postReactions = allReactions.filter(r => r.post_id === post.id);
      post.reactions_breakdown = {
        like: 0,
        love: 0,
        care: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      };
      
      postReactions.forEach(reaction => {
        const reactionType = reaction.reaction_type || 'like';
        if (post.reactions_breakdown.hasOwnProperty(reactionType)) {
          post.reactions_breakdown[reactionType] = parseInt(reaction.count) || 0;
        }
      });
      
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
        0 as isLiked,
        COALESCE(like_counts.likes_count, 0) as likes_count,
        COALESCE(comment_counts.comments_count, 0) as comments_count,
        COALESCE(p.views_count, 0) as views_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as likes_count
        FROM post_likes
        GROUP BY post_id
      ) like_counts ON p.id = like_counts.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comments_count
        FROM comments
        GROUP BY post_id
      ) comment_counts ON p.id = comment_counts.post_id
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const postId = req.params.id;
    const { reactionType = 'like' } = req.body;

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    console.log(`📝 [Like Post] User ${userId} reacting to post ${postId} with reaction: ${reactionType}`);

    // Validate reaction type
    const validReactions = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ 
        message: 'Invalid reaction type',
        validReactions 
      });
    }

    // Check if user already liked the post
    const [existingLike] = await getConnection().execute(`
      SELECT id, COALESCE(reaction_type, 'like') as reaction_type FROM post_likes WHERE post_id = ? AND user_id = ?
    `, [postId, userId]);
    
    console.log(`📝 [Like Post] Existing like:`, existingLike.length > 0 ? existingLike[0] : 'none');

    // Lấy thông tin post owner để tạo notification
    const [postData] = await getConnection().execute(`
      SELECT user_id FROM posts WHERE id = ?
    `, [postId]);
    
    if (!postData || postData.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const postOwnerId = postData[0]?.user_id;
    const isOwnPost = postOwnerId === userId;
    
    console.log(`📝 [Like Post] Post owner: ${postOwnerId}, Current user: ${userId}, Is own post: ${isOwnPost}`);

    if (existingLike.length > 0) {
      // Update reaction type or unlike if same reaction
      if (existingLike[0].reaction_type === reactionType) {
        // Unlike the post
        console.log(`📝 [Like Post] Unliking post ${postId}`);
        await getConnection().execute(`
          DELETE FROM post_likes WHERE post_id = ? AND user_id = ?
        `, [postId, userId]);
        
        console.log(`✅ [Like Post] Post ${postId} unliked successfully`);
        res.json({ liked: false, reactionType: null });
      } else {
        // Update reaction type
        console.log(`📝 [Like Post] Updating reaction from ${existingLike[0].reaction_type} to ${reactionType}`);
        await getConnection().execute(`
          UPDATE post_likes SET reaction_type = ? WHERE post_id = ? AND user_id = ?
        `, [reactionType, postId, userId]);
        
        // Tạo notification cho post owner (nếu không phải chính mình)
        if (!isOwnPost && postOwnerId) {
          try {
            const reactionMessages = {
              like: 'đã thích bài viết của bạn',
              love: 'đã yêu thích bài viết của bạn',
              care: 'đã quan tâm đến bài viết của bạn',
              haha: 'đã cười với bài viết của bạn',
              wow: 'đã ngạc nhiên với bài viết của bạn',
              sad: 'đã buồn với bài viết của bạn',
              angry: 'đã tức giận với bài viết của bạn',
            };
            
            const message = reactionMessages[reactionType] || 'đã thích bài viết của bạn';
            
            // Xóa notification cũ nếu có (để tránh duplicate)
            await getConnection().execute(`
              DELETE FROM notifications 
              WHERE user_id = ? AND from_user_id = ? AND post_id = ? AND type = 'like'
            `, [postOwnerId, userId, postId]);
            
            // Tạo notification mới
            await getConnection().execute(`
              INSERT INTO notifications (user_id, from_user_id, type, message, post_id, reaction_type)
              VALUES (?, ?, 'like', ?, ?, ?)
            `, [postOwnerId, userId, message, postId, reactionType]);
            
            console.log(`📬 [Notification] Created like notification for user ${postOwnerId} (reaction: ${reactionType})`);
          } catch (notifError) {
            console.error('❌ [Notification] Error creating notification:', notifError);
            // Không throw error để không ảnh hưởng đến like action
            // Notification có thể được tạo sau
          }
        } else {
          console.log(`ℹ️ [Notification] Skipping notification - isOwnPost: ${isOwnPost}, postOwnerId: ${postOwnerId}`);
        }
        
        console.log(`✅ [Like Post] Reaction updated successfully`);
        res.json({ liked: true, reactionType });
      }
    } else {
      // Like the post with reaction type
      console.log(`📝 [Like Post] Creating new like for post ${postId}`);
      await getConnection().execute(`
        INSERT INTO post_likes (post_id, user_id, reaction_type) VALUES (?, ?, ?)
      `, [postId, userId, reactionType]);
      
      // Tạo notification cho post owner (nếu không phải chính mình)
      if (!isOwnPost && postOwnerId) {
        try {
          const reactionMessages = {
            like: 'đã thích bài viết của bạn',
            love: 'đã yêu thích bài viết của bạn',
            care: 'đã quan tâm đến bài viết của bạn',
            haha: 'đã cười với bài viết của bạn',
            wow: 'đã ngạc nhiên với bài viết của bạn',
            sad: 'đã buồn với bài viết của bạn',
            angry: 'đã tức giận với bài viết của bạn',
          };
          
          const message = reactionMessages[reactionType] || 'đã thích bài viết của bạn';
          
          await getConnection().execute(`
            INSERT INTO notifications (user_id, from_user_id, type, message, post_id, reaction_type)
            VALUES (?, ?, 'like', ?, ?, ?)
          `, [postOwnerId, userId, message, postId, reactionType]);
          
          console.log(`📬 [Notification] Created like notification for user ${postOwnerId} (reaction: ${reactionType})`);
        } catch (notifError) {
          console.error('❌ [Notification] Error creating notification:', notifError);
          // Không throw error để không ảnh hưởng đến like action
          // Notification có thể được tạo sau
        }
      } else {
        console.log(`ℹ️ [Notification] Skipping notification - isOwnPost: ${isOwnPost}, postOwnerId: ${postOwnerId}`);
      }
      
      console.log(`✅ [Like Post] Post ${postId} liked successfully with reaction ${reactionType}`);
      res.json({ liked: true, reactionType });
    }
  } catch (error) {
    console.error('❌ [Like Post] Error:', error.message);
    console.error('❌ [Like Post] Error stack:', error.stack);
    console.error('❌ [Like Post] Error details:', {
      userId: req.user?.id,
      postId: req.params.id,
      reactionType: req.body.reactionType,
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Track post view - tăng views_count khi user xem post
router.post('/posts/:id/view', async (req, res) => {
  try {
    console.log('📊 [View Post] Request received:', {
      postId: req.params.id,
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl
    });
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const postId = req.params.id;

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    // Kiểm tra xem post có tồn tại không
    const [post] = await getConnection().execute(`
      SELECT id, user_id, privacy, COALESCE(views_count, 0) as views_count FROM posts WHERE id = ?
    `, [postId]);

    if (post.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postData = post[0];
    
    // Kiểm tra quyền xem post (chỉ tăng views nếu user có quyền xem)
    if (postData.privacy === 'private' && postData.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this post' });
    }

    // Không tính lượt xem của chính người đăng bài
    if (postData.user_id === userId) {
      return res.json({ 
        success: true,
        views_count: postData.views_count || 0,
        message: 'Post owner view not counted'
      });
    }

    // Kiểm tra xem user đã xem post này chưa
    let hasViewed = false;
    try {
      const [existingView] = await getConnection().execute(`
        SELECT id FROM post_views WHERE post_id = ? AND user_id = ?
      `, [postId, userId]);
      
      hasViewed = existingView.length > 0;
      console.log(`🔍 [View Post] User ${userId} - Post ${postId} - Has viewed: ${hasViewed}`);
    } catch (error) {
      // Nếu bảng post_views chưa tồn tại, tạo bảng
      if (error.code === 'ER_NO_SUCH_TABLE' || error.sqlMessage?.includes('post_views')) {
        console.warn('post_views table not found, attempting to create it...');
        try {
          await getConnection().execute(`
            CREATE TABLE IF NOT EXISTS post_views (
              id INT AUTO_INCREMENT PRIMARY KEY,
              post_id INT NOT NULL,
              user_id INT NOT NULL,
              viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              UNIQUE KEY unique_post_view (post_id, user_id)
            )
          `);
          console.log('✅ post_views table created successfully');
          // Sau khi tạo bảng, kiểm tra lại
          const [existingView] = await getConnection().execute(`
            SELECT id FROM post_views WHERE post_id = ? AND user_id = ?
          `, [postId, userId]);
          hasViewed = existingView.length > 0;
        } catch (createError) {
          console.error('Failed to create post_views table:', createError);
          // Nếu không tạo được bảng, return error
          return res.status(500).json({ message: 'Failed to track view - database error' });
        }
      } else {
        throw error;
      }
    }

    // Chỉ tăng views_count nếu user chưa xem post này trước đó
    if (!hasViewed) {
      try {
        // Thêm record vào post_views TRƯỚC (với ON DUPLICATE KEY để tránh lỗi)
        await getConnection().execute(`
          INSERT INTO post_views (post_id, user_id) 
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP
        `, [postId, userId]);

        // Sau đó mới tăng views_count - chỉ tăng 1 lần
        const [updateResult] = await getConnection().execute(`
          UPDATE posts 
          SET views_count = COALESCE(views_count, 0) + 1 
          WHERE id = ?
        `, [postId]);
        
        console.log(`✅ [View Post] User ${userId} viewed post ${postId} for the first time. Views updated.`);
      } catch (error) {
        // Nếu cột views_count chưa tồn tại, thêm cột và update lại
        if (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('views_count')) {
          console.warn('views_count column not found, attempting to add it...');
          try {
            await getConnection().execute(`
              ALTER TABLE posts ADD COLUMN views_count INT DEFAULT 0
            `);
            await getConnection().execute(`
              UPDATE posts SET views_count = 1 WHERE id = ?
            `, [postId]);
          } catch (alterError) {
            console.error('Failed to add views_count column:', alterError);
            return res.status(500).json({ message: 'Failed to track view' });
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log(`ℹ️ [View Post] User ${userId} already viewed post ${postId}, not counting again`);
    }

    // Luôn lấy views_count mới nhất từ database (kể cả khi đã xem rồi)
    const [updatedPost] = await getConnection().execute(`
      SELECT COALESCE(views_count, 0) as views_count FROM posts WHERE id = ?
    `, [postId]);

    const currentViewsCount = updatedPost[0]?.views_count || 0;

    res.json({ 
      success: true,
      views_count: currentViewsCount,
      isNewView: !hasViewed, // Cho biết đây có phải lượt xem mới không
    });
  } catch (error) {
    console.error('❌ [View Post] Error:', error.message);
    console.error('❌ [View Post] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      LIMIT ${limit} OFFSET ${offset}
    `, [postId]);

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
