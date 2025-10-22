const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { createNotification } = require('./notifications');

// Get friends list
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [friends] = await getConnection().execute(`
      SELECT 
        f.*,
        u.username,
        u.full_name,
        u.avatar_url,
        u.status,
        u.last_seen,
        'friend' as friendship_status
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'accepted'
      ORDER BY u.full_name ASC
    `, [userId]);

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending friend requests
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [pendingRequests] = await getConnection().execute(`
      SELECT 
        f.*,
        u.username,
        u.full_name,
        u.avatar_url,
        u.status,
        'request_received' as friendship_status
      FROM friends f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    console.log('Friend request received:', { userId, friendId, body: req.body });

    if (!friendId || friendId === userId) {
      console.log('Invalid friend ID:', { friendId, userId });
      return res.status(400).json({ message: 'Invalid friend ID' });
    }

    // Check if friendship already exists
    const [existing] = await getConnection().execute(`
      SELECT * FROM friends 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Friendship already exists' });
    }

    // Create friend request
    await getConnection().execute(`
      INSERT INTO friends (user_id, friend_id, status)
      VALUES (?, ?, 'pending')
    `, [userId, friendId]);

    // Get user info for notification
    const [userInfo] = await getConnection().execute(`
      SELECT username, full_name FROM users WHERE id = ?
    `, [userId]);

    const userName = userInfo[0].full_name || userInfo[0].username;

    // Create notification for the friend
    await createNotification(
      friendId,
      userId,
      'friend_request',
      `${userName} đã gửi lời mời kết bạn cho bạn`
    );

    // Emit real-time notification to the friend
    if (req.io) {
      req.io.to(friendId.toString()).emit('notification', {
        type: 'friend_request',
        message: `${userName} đã gửi lời mời kết bạn cho bạn`,
        from_user: {
          id: userId,
          username: userInfo[0].username,
          full_name: userInfo[0].full_name
        },
        created_at: new Date().toISOString()
      });
    }

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept', async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    // Update the friend request to accepted
    const [result] = await getConnection().execute(`
      UPDATE friends 
      SET status = 'accepted' 
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Create reciprocal friendship
    await getConnection().execute(`
      INSERT INTO friends (user_id, friend_id, status)
      VALUES (?, ?, 'accepted')
      ON DUPLICATE KEY UPDATE status = 'accepted'
    `, [userId, friendId]);

    // Get user info for notification
    const [userInfo] = await getConnection().execute(`
      SELECT username, full_name FROM users WHERE id = ?
    `, [userId]);

    const userName = userInfo[0].full_name || userInfo[0].username;

    // Create notification for the friend
    await createNotification(
      friendId,
      userId,
      'friend_accepted',
      `${userName} đã chấp nhận lời mời kết bạn của bạn`
    );

    // Emit real-time notification to the friend
    if (req.io) {
      req.io.to(friendId.toString()).emit('notification', {
        type: 'friend_accepted',
        message: `${userName} đã chấp nhận lời mời kết bạn của bạn`,
        from_user: {
          id: userId,
          username: userInfo[0].username,
          full_name: userInfo[0].full_name
        },
        created_at: new Date().toISOString()
      });
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request
router.post('/reject', async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    const [result] = await getConnection().execute(`
      DELETE FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfriend
router.delete('/:friendId', async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    // Delete both directions of friendship
    await getConnection().execute(`
      DELETE FROM friends 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error('Error unfriending:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users (for adding friends)
router.get('/users/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const [users] = await getConnection().execute(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        u.status,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM friends f1 
            WHERE f1.user_id = ? AND f1.friend_id = u.id AND f1.status = 'accepted'
          ) THEN 'friend'
          WHEN EXISTS (
            SELECT 1 FROM friends f2 
            WHERE f2.user_id = ? AND f2.friend_id = u.id AND f2.status = 'pending'
          ) THEN 'request_sent'
          WHEN EXISTS (
            SELECT 1 FROM friends f3 
            WHERE f3.user_id = u.id AND f3.friend_id = ? AND f3.status = 'pending'
          ) THEN 'request_received'
          ELSE 'none' 
        END as friendship_status,
        CASE WHEN fl.follower_id IS NOT NULL THEN 1 ELSE 0 END as isFollowing
      FROM users u
      LEFT JOIN follows fl ON (fl.follower_id = ? AND fl.following_id = u.id)
      WHERE u.id != ? AND (u.username LIKE ? OR u.full_name LIKE ?)
      ORDER BY u.full_name ASC
      LIMIT 20
    `, [userId, userId, userId, userId, userId, `%${q}%`, `%${q}%`]);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow user
router.post('/follow', async (req, res) => {
  try {
    const userId = req.user.id;
    const { followingId } = req.body;

    if (!followingId || followingId === userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if already following
    const [existing] = await getConnection().execute(`
      SELECT id FROM follows WHERE follower_id = ? AND following_id = ?
    `, [userId, followingId]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Create follow relationship
    await getConnection().execute(`
      INSERT INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `, [userId, followingId]);

    // Get user info for notification
    const [userInfo] = await getConnection().execute(`
      SELECT username, full_name FROM users WHERE id = ?
    `, [userId]);

    const userName = userInfo[0].full_name || userInfo[0].username;

    // Create notification for the user being followed
    await createNotification(
      followingId,
      userId,
      'follow',
      `${userName} đã bắt đầu theo dõi bạn`
    );

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfollow user
router.delete('/follow/:followingId', async (req, res) => {
  try {
    const userId = req.user.id;
    const followingId = req.params.followingId;

    const [result] = await getConnection().execute(`
      DELETE FROM follows WHERE follower_id = ? AND following_id = ?
    `, [userId, followingId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Follow relationship not found' });
    }

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/block', async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockedUserId } = req.body;
    const connection = getConnection();

    if (!blockedUserId || blockedUserId === userId) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Start transaction
    await connection.execute('START TRANSACTION');

    try {
      // Remove any existing friendship
      await connection.execute(`
        DELETE FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `, [userId, blockedUserId, blockedUserId, userId]);

      // Remove any follow relationships
      await connection.execute(`
        DELETE FROM follows 
        WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)
      `, [userId, blockedUserId, blockedUserId, userId]);

      // Create block relationship
      await connection.execute(`
        INSERT INTO friends (user_id, friend_id, status)
        VALUES (?, ?, 'blocked')
        ON DUPLICATE KEY UPDATE status = 'blocked'
      `, [userId, blockedUserId]);

      await connection.execute('COMMIT');
      res.json({ message: 'User blocked successfully' });
    } catch (error) {
      await connection.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock user
router.delete('/block/:blockedUserId', async (req, res) => {
  try {
    const userId = req.user.id;
    const blockedUserId = req.params.blockedUserId;

    const [result] = await getConnection().execute(`
      DELETE FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'blocked'
    `, [userId, blockedUserId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Block relationship not found' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get followers
router.get('/followers', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [followers] = await getConnection().execute(`
      SELECT 
        f.*,
        u.username,
        u.full_name,
        u.avatar_url,
        u.status
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json(followers);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get following
router.get('/following', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [following] = await getConnection().execute(`
      SELECT 
        f.*,
        u.username,
        u.full_name,
        u.avatar_url,
        u.status
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json(following);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check friendship status with specific user
router.get('/check-status/:userId', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    // Check if current user has blocked target user
    const [blockedByMe] = await getConnection().execute(`
      SELECT status FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'blocked'
    `, [currentUserId, targetUserId]);
    
    if (blockedByMe.length > 0) {
      return res.json({ 
        friendship_status: 'blocked_by_me',
        isFollowing: false
      });
    }
    
    // Check if target user has blocked current user
    const [blockedByThem] = await getConnection().execute(`
      SELECT status FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'blocked'
    `, [targetUserId, currentUserId]);
    
    if (blockedByThem.length > 0) {
      return res.json({ 
        friendship_status: 'blocked_by_them',
        isFollowing: false
      });
    }
    
    // Check if they are friends
    const [friendship] = await getConnection().execute(`
      SELECT status FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'accepted'
    `, [currentUserId, targetUserId]);
    
    if (friendship.length > 0) {
      return res.json({ 
        friendship_status: 'friend',
        isFollowing: false // Will be checked separately if needed
      });
    }
    
    // Check if there's a pending request sent by current user
    const [sentRequest] = await getConnection().execute(`
      SELECT status FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [currentUserId, targetUserId]);
    
    if (sentRequest.length > 0) {
      return res.json({ 
        friendship_status: 'request_sent',
        isFollowing: false
      });
    }
    
    // Check if there's a pending request received by current user
    const [receivedRequest] = await getConnection().execute(`
      SELECT status FROM friends 
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [targetUserId, currentUserId]);
    
    if (receivedRequest.length > 0) {
      return res.json({ 
        friendship_status: 'request_received',
        isFollowing: false
      });
    }
    
    // Check if following
    const [follow] = await getConnection().execute(`
      SELECT 1 FROM follows 
      WHERE follower_id = ? AND following_id = ?
    `, [currentUserId, targetUserId]);
    
    res.json({ 
      friendship_status: 'none',
      isFollowing: follow.length > 0
    });
    
  } catch (error) {
    console.error('Error checking friendship status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
