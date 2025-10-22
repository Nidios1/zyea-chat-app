const express = require('express');
const { getConnection } = require('../config/database');

const router = express.Router();

// Get conversations
router.get('/conversations', async (req, res) => {
  try {
    const connection = getConnection();

    const [conversations] = await connection.execute(`
      SELECT DISTINCT c.id, c.name, c.type, c.updated_at,
             u.id as other_user_id, u.username, u.full_name, u.avatar_url, u.status,
             m.content as last_message, m.created_at as last_message_time,
             COALESCE(unread.unread_count, 0) as unread_count
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      JOIN users u ON cp2.user_id = u.id
      LEFT JOIN conversation_settings cs ON c.id = cs.conversation_id AND cs.user_id = ?
      LEFT JOIN (
        SELECT conversation_id, content, created_at,
               ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
        FROM messages
      ) m ON c.id = m.conversation_id AND m.rn = 1
      LEFT JOIN (
        SELECT m.conversation_id, COUNT(*) as unread_count
        FROM messages m
        LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = ?
        WHERE m.sender_id != ? AND mrs.read_at IS NULL
        GROUP BY m.conversation_id
      ) unread ON c.id = unread.conversation_id
      WHERE cp1.user_id = ? AND cp2.user_id != ?
        AND (cs.hidden IS NULL OR cs.hidden = FALSE)
      ORDER BY c.updated_at DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    console.log('Found conversations:', conversations.length);
    console.log('Conversations data:', conversations);
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create conversation with a user
router.post('/conversations', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('Creating conversation request:', { userId, currentUserId: req.user.id });
    const connection = getConnection();

    // Check if conversation already exists
    const [existing] = await connection.execute(`
      SELECT c.id FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE cp1.user_id = ? AND cp2.user_id = ? AND c.type = 'private'
    `, [req.user.id, userId]);

    console.log('Existing conversations:', existing);

    if (existing.length > 0) {
      console.log('Found existing conversation:', existing[0].id);
      
      // Unhide conversation ONLY for the current user (not for the other user)
      // The other user will only see it after receiving the first message
      await connection.execute(`
        UPDATE conversation_settings 
        SET hidden = FALSE 
        WHERE conversation_id = ? AND user_id = ?
      `, [existing[0].id, req.user.id]);
      
      console.log('Unhidden conversation only for current user:', req.user.id);
      return res.json({ conversationId: existing[0].id });
    }

    // Create new conversation
    console.log('Creating new conversation...');
    const [conversationResult] = await connection.execute(
      'INSERT INTO conversations (type) VALUES (?)',
      ['private']
    );

    const conversationId = conversationResult.insertId;
    console.log('Created conversation with ID:', conversationId);

    // Add participants
    await connection.execute(
      'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
      [conversationId, req.user.id, conversationId, userId]
    );

    // Hide conversation for the other user until first message is sent
    await connection.execute(`
      INSERT INTO conversation_settings (conversation_id, user_id, hidden)
      VALUES (?, ?, TRUE)
    `, [conversationId, userId]);

    console.log('Added participants to conversation');
    console.log('Hidden conversation for recipient until first message');
    res.json({ conversationId });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const connection = getConnection();

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get messages with read status
    const [messages] = await connection.execute(`
      SELECT m.id, m.content, m.message_type, m.file_url, m.created_at,
             u.id as sender_id, u.username, u.full_name, u.avatar_url,
             CASE 
               WHEN mrs.read_at IS NOT NULL THEN 'read'
               WHEN m.sender_id != ? THEN 'delivered'
               ELSE 'sent'
             END as status,
             mrs.read_at
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = ?
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, req.user.id, id, parseInt(limit), offset]);

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, messageType = 'text', fileUrl } = req.body;
    const connection = getConnection();

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Insert message
    const [result] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_id, content, message_type, file_url) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, content, messageType, fileUrl || null]
    );

    // Update conversation timestamp
    await connection.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Unhide conversation for all participants if it was hidden
    await connection.execute(`
      UPDATE conversation_settings cs
      INNER JOIN conversation_participants cp ON cs.conversation_id = cp.conversation_id AND cs.user_id = cp.user_id
      SET cs.hidden = FALSE
      WHERE cs.conversation_id = ? AND cs.hidden = TRUE
    `, [id]);

    res.json({ messageId: result.insertId });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/conversations/:id/messages/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { messageIds } = req.body;
    const connection = getConnection();

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Message IDs are required' });
    }

    // Mark messages as read
    const placeholders = messageIds.map(() => '(?, ?)').join(', ');
    const values = messageIds.flatMap(messageId => [messageId, req.user.id]);
    
    await connection.execute(`
      INSERT INTO message_read_status (message_id, user_id) 
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP
    `, values);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all messages in conversation as read
router.post('/conversations/:id/read-all', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all unread messages in this conversation
    const [unreadMessages] = await connection.execute(`
      SELECT m.id 
      FROM messages m
      LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = ?
      WHERE m.conversation_id = ? AND m.sender_id != ? AND mrs.read_at IS NULL
    `, [req.user.id, id, req.user.id]);

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      const placeholders = messageIds.map(() => '(?, ?)').join(', ');
      const values = messageIds.flatMap(messageId => [messageId, req.user.id]);
      
      await connection.execute(`
        INSERT INTO message_read_status (message_id, user_id) 
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP
      `, values);
    }

    res.json({ success: true, readCount: unreadMessages.length });
  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update typing status
router.post('/conversations/:id/typing', async (req, res) => {
  try {
    const { id } = req.params;
    const { isTyping } = req.body;
    const connection = getConnection();

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update typing status
    await connection.execute(`
      INSERT INTO typing_status (conversation_id, user_id, is_typing) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE is_typing = ?, updated_at = CURRENT_TIMESTAMP
    `, [id, req.user.id, isTyping, isTyping]);

    res.json({ success: true });
  } catch (error) {
    console.error('Update typing status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get typing status for conversation
router.get('/conversations/:id/typing', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get typing status for other users in conversation
    const [typingUsers] = await connection.execute(`
      SELECT ts.user_id, ts.is_typing, ts.updated_at, u.username, u.full_name
      FROM typing_status ts
      JOIN users u ON ts.user_id = u.id
      WHERE ts.conversation_id = ? AND ts.user_id != ? AND ts.is_typing = TRUE
      ORDER BY ts.updated_at DESC
    `, [id, req.user.id]);

    res.json(typingUsers);
  } catch (error) {
    console.error('Get typing status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pin conversation
router.post('/conversations/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { pinned } = req.body;
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await connection.execute(`
      INSERT INTO conversation_settings (conversation_id, user_id, pinned)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE pinned = ?
    `, [id, req.user.id, pinned, pinned]);

    res.json({ success: true, pinned });
  } catch (error) {
    console.error('Pin conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Hide conversation
router.post('/conversations/:id/hide', async (req, res) => {
  try {
    const { id } = req.params;
    const { hidden } = req.body;
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await connection.execute(`
      INSERT INTO conversation_settings (conversation_id, user_id, hidden)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE hidden = ?
    `, [id, req.user.id, hidden, hidden]);

    res.json({ success: true, hidden });
  } catch (error) {
    console.error('Hide conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update nickname
router.post('/conversations/:id/nickname', async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname } = req.body;
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await connection.execute(`
      INSERT INTO conversation_settings (conversation_id, user_id, nickname)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE nickname = ?
    `, [id, req.user.id, nickname, nickname]);

    res.json({ success: true, nickname });
  } catch (error) {
    console.error('Update nickname error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as close friend
router.post('/conversations/:id/close-friend', async (req, res) => {
  try {
    const { id } = req.params;
    const { isCloseFriend } = req.body;
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await connection.execute(`
      INSERT INTO conversation_settings (conversation_id, user_id, is_close_friend)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE is_close_friend = ?
    `, [id, req.user.id, isCloseFriend, isCloseFriend]);

    res.json({ success: true, isCloseFriend });
  } catch (error) {
    console.error('Mark as close friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation settings
router.get('/conversations/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [settings] = await connection.execute(`
      SELECT pinned, hidden, nickname, is_close_friend, call_notifications
      FROM conversation_settings
      WHERE conversation_id = ? AND user_id = ?
    `, [id, req.user.id]);

    res.json(settings[0] || {
      pinned: false,
      hidden: false,
      nickname: null,
      is_close_friend: false,
      call_notifications: true
    });
  } catch (error) {
    console.error('Get conversation settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete conversation history
router.delete('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete messages for this user only (soft delete)
    await connection.execute(`
      UPDATE messages 
      SET deleted_for_user = ? 
      WHERE conversation_id = ? AND sender_id = ?
    `, [req.user.id, id, req.user.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete entire conversation (for current user only - soft delete)
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();

    console.log('Delete conversation request (hide for user):', { conversationId: id, userId: req.user.id });

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      console.log('Access denied - user is not participant');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Hide conversation for this user only (soft delete)
    // This way the other person still sees the conversation
    await connection.execute(`
      INSERT INTO conversation_settings (conversation_id, user_id, hidden)
      VALUES (?, ?, TRUE)
      ON DUPLICATE KEY UPDATE hidden = TRUE
    `, [id, req.user.id]);

    // Also delete message read status for this user to reset when they come back
    await connection.execute(`
      DELETE mrs FROM message_read_status mrs
      INNER JOIN messages m ON mrs.message_id = m.id
      WHERE m.conversation_id = ? AND mrs.user_id = ?
    `, [id, req.user.id]);

    console.log('Conversation hidden for user:', req.user.id);
    res.json({ success: true, message: 'Conversation hidden successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark conversation as unread
router.put('/conversations/:id/unread', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();

    console.log('Mark as unread request:', { conversationId: id, userId: req.user.id });

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      console.log('Access denied - user is not participant');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the latest message in this conversation that's not from the current user
    const [latestMessages] = await connection.execute(`
      SELECT m.id 
      FROM messages m
      WHERE m.conversation_id = ? AND m.sender_id != ?
      ORDER BY m.created_at DESC
      LIMIT 1
    `, [id, req.user.id]);

    if (latestMessages.length > 0) {
      const messageId = latestMessages[0].id;
      
      // Delete read status for this message to mark as unread
      await connection.execute(`
        DELETE FROM message_read_status 
        WHERE message_id = ? AND user_id = ?
      `, [messageId, req.user.id]);

      console.log('Marked conversation as unread');
      res.json({ success: true, message: 'Conversation marked as unread' });
    } else {
      // No messages from other users, nothing to mark as unread
      console.log('No messages to mark as unread');
      res.json({ success: true, message: 'No messages to mark as unread' });
    }
  } catch (error) {
    console.error('Mark as unread error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
