const express = require('express');
const { getConnection } = require('../config/database');

const router = express.Router();

// Helper function to parse conversation ID from params
const parseConversationId = (idParam) => {
  const id = parseInt(idParam);
  if (isNaN(id)) {
    throw new Error('Invalid conversation ID');
  }
  return id;
};

// Get conversations
router.get('/conversations', async (req, res) => {
  try {
    const connection = getConnection();

    // Get conversations where user is a participant
    // For private chats: show other user info
    // For group chats: show group name and participants count
    const [conversations] = await connection.execute(`
      SELECT DISTINCT 
        c.id, 
        c.name, 
        c.type, 
        c.created_at,
        c.updated_at,
        CASE 
          WHEN c.type = 'group' THEN NULL
          ELSE u.id
        END as other_user_id,
        CASE 
          WHEN c.type = 'group' THEN c.name
          ELSE u.username
        END as username,
        CASE 
          WHEN c.type = 'group' THEN c.name
          ELSE u.full_name
        END as full_name,
        CASE 
          WHEN c.type = 'group' THEN NULL
          ELSE u.avatar_url
        END as avatar_url,
        CASE 
          WHEN c.type = 'group' THEN NULL
          ELSE u.status
        END as status,
        CASE 
          WHEN c.type = 'group' THEN NULL
          ELSE u.last_seen
        END as last_seen,
        m.content as last_message, 
        m.created_at as last_message_time, 
        m.sender_id as last_message_sender_id,
        m.message_type as last_message_type,
        COALESCE(unread.unread_count, 0) as unread_count,
        CASE 
          WHEN c.type = 'group' THEN (
            SELECT COUNT(*) 
            FROM conversation_participants cp_count 
            WHERE cp_count.conversation_id = c.id
          )
          ELSE NULL
        END as participants_count
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = ?
      LEFT JOIN conversation_participants cp_other ON c.id = cp_other.conversation_id 
        AND cp_other.user_id != ? 
        AND c.type = 'private'
      LEFT JOIN users u ON cp_other.user_id = u.id AND c.type = 'private'
      LEFT JOIN conversation_settings cs ON c.id = cs.conversation_id AND cs.user_id = ?
      LEFT JOIN (
        SELECT conversation_id, content, created_at, sender_id, message_type,
               ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
        FROM messages
        WHERE NOT EXISTS (
          SELECT 1 FROM message_deletions md 
          WHERE md.message_id = messages.id AND md.user_id = ?
        )
      ) m ON c.id = m.conversation_id AND m.rn = 1
      LEFT JOIN (
        SELECT m.conversation_id, COUNT(*) as unread_count
        FROM messages m
        LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = ?
        WHERE m.sender_id != ? AND mrs.read_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM message_deletions md 
            WHERE md.message_id = m.id AND md.user_id = ?
          )
        GROUP BY m.conversation_id
      ) unread ON c.id = unread.conversation_id
      WHERE (cs.hidden IS NULL OR cs.hidden = FALSE)
      ORDER BY c.updated_at DESC
    `, [
      req.user.id,  // cp.user_id - user must be participant
      req.user.id,  // cp_other.user_id != ? - for private chats
      req.user.id,  // cs.user_id
      req.user.id,  // md.user_id trong LEFT JOIN subquery
      req.user.id,  // mrs.user_id trong unread subquery
      req.user.id,  // m.sender_id != ?
      req.user.id   // md.user_id trong unread subquery
    ]);

    console.log(`✅ Found ${conversations.length} conversations for user ${req.user.id}`);
    // Log group chats separately for debugging
    const groupChats = conversations.filter((c) => c.type === 'group');
    if (groupChats.length > 0) {
      console.log(`📁 Group chats (${groupChats.length}):`, groupChats.map((c) => ({ 
        id: c.id, 
        name: c.name, 
        participants_count: c.participants_count 
      })));
    }
    // IMPORTANT: Query uses INNER JOIN conversation_participants, so only conversations where user is participant are returned
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

// Create group conversation
router.post('/conversations/group', async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    console.log('Creating group conversation request:', { name, participantIds, currentUserId: req.user.id });
    const connection = getConnection();

    // Validation: Group name is required
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Tên nhóm là bắt buộc' });
    }

    // Validation: At least 2 participants are required (excluding creator) - tổng ít nhất 3 người
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 2 thành viên' });
    }

    // Remove duplicates and current user from participantIds
    const uniqueParticipantIds = [...new Set(participantIds.map((id) => parseInt(id)))];
    const filteredParticipantIds = uniqueParticipantIds.filter(id => id !== req.user.id && !isNaN(id) && id > 0);

    // Yêu cầu ít nhất 2 thành viên khác (tổng 3 người: creator + 2 thành viên)
    if (filteredParticipantIds.length < 2) {
      return res.status(400).json({ message: 'Nhóm chat phải có ít nhất 3 thành viên (bao gồm bạn). Vui lòng chọn thêm ít nhất 2 thành viên khác.' });
    }

    // Create new group conversation with created_by
    console.log('Creating new group conversation...');
    console.log('Group name:', name.trim());
    console.log('Creator ID:', req.user.id);
    console.log('Selected participant IDs:', filteredParticipantIds);
    
    const [conversationResult] = await connection.execute(
      'INSERT INTO conversations (type, name, created_by) VALUES (?, ?, ?)',
      ['group', name.trim(), req.user.id]
    );

    const conversationId = conversationResult.insertId;
    console.log('✅ Created group conversation with ID:', conversationId, 'Name:', name.trim());

    // Add all participants (creator + selected members ONLY)
    // IMPORTANT: Only add creator and selected members, no one else
    const allParticipants = [req.user.id, ...filteredParticipantIds];
    
    // Validate all participant IDs exist in users table
    const placeholders = allParticipants.map(() => '?').join(',');
    const [existingUsers] = await connection.execute(
      `SELECT id FROM users WHERE id IN (${placeholders})`,
      allParticipants
    );
    
    const existingUserIds = existingUsers.map((u) => u.id);
    const validParticipants = allParticipants.filter(id => existingUserIds.includes(id));
    
    if (validParticipants.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy người dùng hợp lệ' });
    }
    
    // Insert ONLY valid participants (creator + selected members)
    const participantValues = validParticipants.map(() => '(?, ?)').join(', ');
    const participantParams = validParticipants.flatMap(userId => [conversationId, userId]);
    
    await connection.execute(
      `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ${participantValues}`,
      participantParams
    );

    console.log('✅ Added participants to group conversation:', validParticipants.length, 'Members:', validParticipants);
    console.log('⚠️ IMPORTANT: Only these users can see this group chat:', validParticipants);

    // Get creator info for system message
    const [creatorInfo] = await connection.execute(
      'SELECT id, username, full_name, avatar_url FROM users WHERE id = ?',
      [req.user.id]
    );
    const creator = creatorInfo[0];

    // Get other participants info for system message
    const otherParticipantIds = validParticipants.filter(id => id !== req.user.id);
    const otherPlaceholders = otherParticipantIds.map(() => '?').join(',');
    const [otherParticipantsInfo] = await connection.execute(
      `SELECT id, username, full_name FROM users WHERE id IN (${otherPlaceholders})`,
      otherParticipantIds
    );

    // Create system message: "Creator đã tạo nhóm với X thành viên"
    const otherNames = otherParticipantsInfo.map((u) => u.full_name || u.username).join(', ');
    const systemMessageContent = otherNames 
      ? `${creator.full_name || creator.username} đã tạo nhóm với ${otherNames}`
      : `${creator.full_name || creator.username} đã tạo nhóm`;

    // Get system user ID (bot user or system user)
    const botUserIdFromEnv = process.env.BOT_USER_ID;
    let systemUserId;
    if (botUserIdFromEnv) {
      const [botUser] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [botUserIdFromEnv]
      );
      systemUserId = botUser.length > 0 ? botUser[0].id : req.user.id;
    } else {
      // Find system user by username
      const [systemUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
        ['system', 'system@zyea.com']
      );
      systemUserId = systemUsers.length > 0 ? systemUsers[0].id : req.user.id;
    }

    // Insert system message
    const [systemMessageResult] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)',
      [conversationId, systemUserId, systemMessageContent, 'system']
    );

    // Emit system message via socket if available
    if (req.io) {
      const [systemMessage] = await connection.execute(
        `SELECT m.*, u.username, u.full_name, u.avatar_url 
         FROM messages m 
         JOIN users u ON m.sender_id = u.id 
         WHERE m.id = ?`,
        [systemMessageResult.insertId]
      );
      
      if (systemMessage.length > 0) {
        const msg = systemMessage[0];
        validParticipants.forEach((participantId) => {
          req.io.to(String(participantId)).emit('receiveMessage', {
            id: msg.id,
            conversation_id: conversationId,
            sender_id: msg.sender_id,
            content: msg.content,
            message_type: 'system',
            created_at: msg.created_at,
            username: msg.username,
            full_name: msg.full_name,
            avatar_url: msg.avatar_url,
          });
        });
      }
    }

    // Return conversationId and group info
    res.json({ 
      conversationId,
      groupId: conversationId,
      groupName: name.trim(),
      members: validParticipants, // Return only valid participants
      participantsCount: validParticipants.length,
      createdAt: new Date().toISOString(),
      type: 'group'
    });
  } catch (error) {
    console.error('Create group conversation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      } : undefined
    });
  }
});

// Get participants of a conversation
router.get('/conversations/:id/participants', async (req, res) => {
  try {
    // Parse conversation ID to integer
    const id = parseConversationId(req.params.id);
    
    console.log('📋 Get participants - Request received:', { 
      conversationId: id, 
      userId: req.user?.id 
    });
    
    // Validate inputs
    if (!id) {
      console.error('❌ Get participants error: Conversation ID is missing');
      return res.status(400).json({ message: 'Conversation ID is required' });
    }
    
    if (!req.user || !req.user.id) {
      console.error('❌ Get participants error: req.user is missing');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ Get participants error: Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }

    console.log('📋 Get participants - Checking user participation...');
    // Check if user is participant
    const [userParticipant] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (userParticipant.length === 0) {
      console.warn('⚠️ Get participants - User is not a participant:', { conversationId: id, userId: req.user.id });
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('📋 Get participants - Getting conversation info...');
    // Get conversation info to find creator
    const [conversationInfo] = await connection.execute(
      'SELECT created_by FROM conversations WHERE id = ?',
      [id]
    );
    
    if (conversationInfo.length === 0) {
      console.error('❌ Get participants error: Conversation not found:', id);
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const creatorId = conversationInfo[0]?.created_by || null;
    console.log('📋 Get participants - Creator ID:', creatorId);

    // Get all participants with user info
    // Order: creator first (if exists), then by joined_at (oldest first) to get consistent top 3
    let participants;
    try {
      console.log('📋 Get participants - Executing query...');
      // Get creator ID from conversation
      const [convInfo] = await connection.execute(
        'SELECT created_by FROM conversations WHERE id = ?',
        [id]
      );
      const actualCreatorId = convInfo[0]?.created_by || creatorId || 0;
      
      [participants] = await connection.execute(`
        SELECT u.id, u.username, u.full_name, u.avatar_url, u.status, u.last_seen, cp.joined_at,
               CASE WHEN u.id = ? THEN 1 ELSE 0 END as is_creator
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ?
        ORDER BY is_creator DESC, cp.joined_at ASC
      `, [actualCreatorId, id]);
      
      console.log('✅ Get participants - Success:', { 
        conversationId: id, 
        participantsCount: participants.length 
      });
    } catch (queryError) {
      console.error('❌ Get participants query error:', queryError);
      console.error('Query error stack:', queryError.stack);
      throw queryError;
    }

    res.json(participants);
  } catch (error) {
    console.error('❌ Get participants error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add participants to a group conversation
router.post('/conversations/:id/participants', async (req, res) => {
  try {
    // Parse conversation ID to integer
    const id = parseConversationId(req.params.id);
    const { participantIds } = req.body;
    const connection = getConnection();

    // Validate inputs
    if (!id) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'Participant IDs are required' });
    }

    // Check if conversation exists and is a group
    const [conversations] = await connection.execute(
      'SELECT type FROM conversations WHERE id = ?',
      [id]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversations[0].type !== 'group') {
      return res.status(400).json({ message: 'Can only add participants to group conversations' });
    }

    // Check if current user is a participant (required to add others)
    const [userParticipant] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (userParticipant.length === 0) {
      return res.status(403).json({ message: 'Access denied. You must be a participant to add members.' });
    }

    // Remove duplicates and current user from participantIds
    const uniqueParticipantIds = [...new Set(participantIds.map((id) => parseInt(id)))];
    const filteredParticipantIds = uniqueParticipantIds.filter(
      userId => userId !== req.user.id && !isNaN(userId) && userId > 0
    );

    if (filteredParticipantIds.length === 0) {
      return res.status(400).json({ message: 'No valid participants to add' });
    }

    // Check which participants are already in the group
    const placeholders = filteredParticipantIds.map(() => '?').join(',');
    const [existingParticipants] = await connection.execute(
      `SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id IN (${placeholders})`,
      [id, ...filteredParticipantIds]
    );

    const existingIds = existingParticipants.map((p) => p.user_id);
    const newParticipantIds = filteredParticipantIds.filter(id => !existingIds.includes(id));

    if (newParticipantIds.length === 0) {
      return res.status(400).json({ message: 'All selected users are already in the group' });
    }

    // Add new participants
    const values = newParticipantIds.map(() => '(?, ?)').join(', ');
    const params = newParticipantIds.flatMap(userId => [id, userId]);

    await connection.execute(
      `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ${values}`,
      params
    );

    // Update conversation updated_at timestamp
    await connection.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Get added users info for system message
    const addedPlaceholders = newParticipantIds.map(() => '?').join(',');
    const [addedUsersInfo] = await connection.execute(
      `SELECT id, username, full_name FROM users WHERE id IN (${addedPlaceholders})`,
      newParticipantIds
    );

    // Get current user info
    const [currentUserInfo] = await connection.execute(
      'SELECT id, username, full_name FROM users WHERE id = ?',
      [req.user.id]
    );
    const currentUser = currentUserInfo[0];

    // Create system message: "User1, User2 đã tham gia nhóm" or "User1 đã tham gia nhóm"
    const addedNames = addedUsersInfo.map((u) => u.full_name || u.username).join(', ');
    const systemMessageContent = addedNames 
      ? `${addedNames} đã tham gia nhóm`
      : 'Đã thêm thành viên vào nhóm';

    // Get system user ID (bot user or system user)
    const botUserIdFromEnv = process.env.BOT_USER_ID;
    let systemUserId;
    if (botUserIdFromEnv) {
      const [botUser] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [botUserIdFromEnv]
      );
      systemUserId = botUser.length > 0 ? botUser[0].id : req.user.id;
    } else {
      // Find system user by username
      const [systemUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
        ['system', 'system@zyea.com']
      );
      systemUserId = systemUsers.length > 0 ? systemUsers[0].id : req.user.id;
    }

    // Insert system message
    const [systemMessageResult] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)',
      [id, systemUserId, systemMessageContent, 'system']
    );

    // Get all participants to emit socket events
    const [allParticipants] = await connection.execute(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
      [id]
    );

    // Emit system message via socket if available
    if (req.io) {
      const [systemMessage] = await connection.execute(
        `SELECT m.*, u.username, u.full_name, u.avatar_url 
         FROM messages m 
         JOIN users u ON m.sender_id = u.id 
         WHERE m.id = ?`,
        [systemMessageResult.insertId]
      );
      
      if (systemMessage.length > 0) {
        const msg = systemMessage[0];
        allParticipants.forEach((participant) => {
          req.io.to(String(participant.user_id)).emit('receiveMessage', {
            id: msg.id,
            conversation_id: id,
            sender_id: msg.sender_id,
            content: msg.content,
            message_type: 'system',
            created_at: msg.created_at,
            username: msg.username,
            full_name: msg.full_name,
            avatar_url: msg.avatar_url,
          });
        });
      }
    }

    console.log(`✅ Added ${newParticipantIds.length} participants to group ${id}`);

    res.json({ 
      message: 'Participants added successfully',
      addedCount: newParticipantIds.length,
      participantIds: newParticipantIds
    });
  } catch (error) {
    console.error('Add participants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      console.error('Get messages error: User not authenticated');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Parse conversation ID to integer
    let id;
    try {
      id = parseConversationId(req.params.id);
    } catch (parseError) {
      console.error('Get messages error: Invalid conversation ID', req.params.id);
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }
    
    // Parse query parameters to integers (they come as strings from URL)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate parsed values
    if (isNaN(page) || isNaN(limit) || isNaN(offset) || isNaN(id)) {
      console.error('Get messages error: Invalid numeric values', {
        page, limit, offset, id,
        pageRaw: req.query.page,
        limitRaw: req.query.limit,
        idRaw: req.params.id
      });
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    // Ensure all values are integers (not strings)
    const userId = parseInt(req.user.id);
    if (isNaN(userId)) {
      console.error('Get messages error: Invalid user ID', req.user.id);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const connection = getConnection();
    
    if (!connection) {
      console.error('Get messages error: Database connection not available');
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, userId]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Debug log parameters before executing
    console.log('📥 Get messages - Parameters:', {
      conversationId: id,
      userId: userId,
      page,
      limit,
      offset
    });

    // Get messages with read status, excluding messages deleted by this user
    // Note: LIMIT and OFFSET cannot be parameters in MySQL prepared statements
    // Must use string interpolation after validation (safe because we validated they are integers)
    const [messages] = await connection.execute(`
      SELECT m.id, m.content, m.message_type, m.file_url, m.created_at, m.reactions,
             m.edited_at,
             u.id as sender_id, u.username, u.full_name, u.avatar_url,
             mrs.read_at
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = ?
      LEFT JOIN message_deletions md ON m.id = md.message_id AND md.user_id = ?
      WHERE m.conversation_id = ? 
        AND md.id IS NULL
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [
      userId,  // ?1: mrs.user_id in LEFT JOIN
      userId,  // ?2: md.user_id in LEFT JOIN  
      id       // ?3: conversation_id in WHERE
    ]);
    
    // Calculate status and edited flag in application code
    const messagesWithStatus = messages.map(msg => ({
      ...msg,
      edited: msg.edited_at !== null && msg.edited_at !== undefined && String(msg.edited_at).trim() !== '',
      status: msg.read_at ? 'read' : (msg.sender_id === userId ? 'sent' : 'delivered')
    }));

    console.log(`📥 Found ${messagesWithStatus.length} messages for conversation ${id} and user ${req.user.id}`);
    
    // Debug: Log if no messages
    if (messagesWithStatus.length === 0) {
      console.log(`⚠️ NO MESSAGES FOUND for conversation ${id}`);
      
      // Check if conversation exists
      const [convCheck] = await connection.execute(
        'SELECT id FROM conversations WHERE id = ?',
        [id]
      );
      console.log(`Conversation ${id} exists:`, convCheck.length > 0);
      
      // Check if user is participant
      console.log(`User ${req.user.id} is participant:`, participants.length > 0);
      
      // Check total messages in conversation (for any user)
      const [allMsgs] = await connection.execute(
        'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
        [id]
      );
      console.log(`Total messages in conversation ${id}:`, allMsgs[0].count);
      
      // Check deleted messages for this user
      const [deletedCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM message_deletions md JOIN messages m ON md.message_id = m.id WHERE md.user_id = ? AND m.conversation_id = ?',
        [req.user.id, id]
      );
      console.log(`Deleted messages for user ${req.user.id}:`, deletedCount[0].count);
    }
    
    res.json(messagesWithStatus.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      stack: error.stack
    });
    
    // Return more detailed error message for debugging
    const errorMessage = error.message || 'Server error';
    const statusCode = error.code === 'ER_WRONG_ARGUMENTS' ? 400 : 500;
    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    // Parse conversation ID to integer
    const id = parseConversationId(req.params.id);
    
    const { content, messageType = 'text', fileUrl } = req.body;
    const connection = getConnection();

    // Validate messageType - must be one of the allowed values
    const allowedMessageTypes = ['text', 'image', 'file', 'sticker', 'video', 'system', 'call'];
    const validMessageType = allowedMessageTypes.includes(messageType) ? messageType : 'text';
    
    if (messageType !== validMessageType) {
      console.warn(`⚠️ Invalid messageType "${messageType}", using "text" instead`);
    }

    // Check if user is participant
    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Insert message
    console.log('📤 Sending message to conversation:', id);
    console.log('📤 Content:', content);
    console.log('📤 Message Type:', validMessageType);
    console.log('📤 Sender:', req.user.id);
    
    const [result] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_id, content, message_type, file_url) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, content, validMessageType, fileUrl || null]
    );
    
    console.log('📤 Message inserted with ID:', result.insertId);

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

    // Get all participants to emit socket events
    const [allParticipants] = await connection.execute(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
      [id]
    );

    // Emit socket events immediately for real-time delivery
    if (req.io) {
      const timestamp = new Date();
      const updateData = {
        conversationId: id,
        lastMessage: content,
        timestamp: timestamp
      };

      // Emit to all participants (both sender and receiver)
      allParticipants.forEach((participant) => {
        const participantId = participant.user_id.toString();
        
        // Emit conversationUpdated to update chat list
        req.io.to(participantId).emit('conversationUpdated', updateData);
        
        // Emit receiveMessage to receiver only (not to sender)
        if (String(participantId) !== String(req.user.id)) {
          req.io.to(participantId).emit('receiveMessage', {
            senderId: req.user.id,
            message: content,
            timestamp: timestamp,
            conversationId: id
          });
          console.log('📬 Emitted receiveMessage to user:', participantId);
        }
        
        console.log('📬 Emitted conversationUpdated to user:', participantId);
      });
    }

    res.json({ messageId: result.insertId });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/conversations/:id/messages/read', async (req, res) => {
  try {
    // Parse conversation ID to integer
    const id = parseConversationId(req.params.id);
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
    // Parse conversation ID to integer
    const id = parseConversationId(req.params.id);
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

// Mute conversation notifications
router.post('/conversations/:id/mute', async (req, res) => {
  try {
    const { id } = req.params;
    const { muted } = req.body;
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mute = set call_notifications to false
    await connection.execute(`
      INSERT INTO conversation_settings (conversation_id, user_id, call_notifications)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE call_notifications = ?
    `, [id, req.user.id, !muted, !muted]);

    res.json({ success: true, muted });
  } catch (error) {
    console.error('Mute conversation error:', error);
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

// Delete conversation history (for current user only)
router.delete('/conversations/:id/messages', async (req, res) => {
  try {
    // Parse conversation ID to integer
    const id = parseConversationId(req.params.id);
    const connection = getConnection();

    const [participants] = await connection.execute(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark ALL messages in this conversation as deleted for this user
    // This affects both sent and received messages
    await connection.execute(`
      INSERT INTO message_deletions (message_id, user_id)
      SELECT m.id, ? 
      FROM messages m
      WHERE m.conversation_id = ?
      ON DUPLICATE KEY UPDATE deleted_at = CURRENT_TIMESTAMP
    `, [req.user.id, id]);

    console.log('Deleted all messages in conversation for user:', req.user.id);
    res.json({ success: true, message: 'Conversation history deleted for you' });
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

    // Mark ALL messages in this conversation as deleted for this user
    // This ensures messages are hidden when user deletes conversation (like Facebook)
    // Messages will still be visible to the other person
    // Use INSERT IGNORE to avoid duplicate key errors
    await connection.execute(`
      INSERT IGNORE INTO message_deletions (message_id, user_id)
      SELECT m.id, ? 
      FROM messages m
      WHERE m.conversation_id = ?
    `, [req.user.id, id]);
    
    // Update deleted_at timestamp for all messages (including existing deletions)
    await connection.execute(`
      UPDATE message_deletions md
      INNER JOIN messages m ON md.message_id = m.id
      SET md.deleted_at = CURRENT_TIMESTAMP
      WHERE m.conversation_id = ? AND md.user_id = ?
    `, [id, req.user.id]);

    // Also delete message read status for this user to reset when they come back
    await connection.execute(`
      DELETE mrs FROM message_read_status mrs
      INNER JOIN messages m ON mrs.message_id = m.id
      WHERE m.conversation_id = ? AND mrs.user_id = ?
    `, [id, req.user.id]);

    console.log('Conversation hidden and all messages marked as deleted for user:', req.user.id);
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

// Update message reactions
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reactions } = req.body;
    const connection = getConnection();

    // Check if user can access this message
    const [messages] = await connection.execute(`
      SELECT m.*, cp.conversation_id 
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = ? AND cp.user_id = ?
    `, [messageId, req.user.id]);

    if (messages.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update reactions
    await connection.execute(
      'UPDATE messages SET reactions = ? WHERE id = ?',
      [JSON.stringify(reactions), messageId]
    );

    res.json({ success: true, reactions });
  } catch (error) {
    console.error('Update reactions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update message content
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const connection = getConnection();

    // Convert messageId to integer
    const messageIdInt = parseInt(messageId);
    
    if (isNaN(messageIdInt)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    console.log('Update message request:', { messageId: messageIdInt, content, userId: req.user.id });

    // Check if message exists and user is the sender
    const [messages] = await connection.execute(`
      SELECT m.* 
      FROM messages m
      WHERE m.id = ?
    `, [messageIdInt]);

    if (messages.length === 0) {
      console.log('Message not found:', messageIdInt);
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = messages[0];

    // Only allow editing own messages
    if (message.sender_id !== req.user.id) {
      console.log('Access denied - not sender:', { messageSenderId: message.sender_id, currentUserId: req.user.id });
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    // Update message content and set edited_at timestamp
    await connection.execute(
      'UPDATE messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, messageIdInt]
    );

    // Get updated message to return with edited flag
    const [updatedMessages] = await connection.execute(`
      SELECT m.id, m.content, m.created_at, m.edited_at,
             CASE WHEN m.edited_at IS NOT NULL THEN 1 ELSE 0 END as edited,
             u.id as sender_id, u.username, u.full_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageIdInt]);

    console.log('Message updated successfully:', messageIdInt);
    res.json({ 
      success: true, 
      message: 'Message updated successfully',
      data: updatedMessages[0]
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.query; // Query parameter: ?deleteForEveryone=true
    const connection = getConnection();

    // Convert messageId to integer
    const messageIdInt = parseInt(messageId);
    
    if (isNaN(messageIdInt)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    console.log('Delete message request:', { messageId: messageIdInt, userId: req.user.id, deleteForEveryone });

    // Check if message exists and user is the sender
    const [messages] = await connection.execute(`
      SELECT m.* 
      FROM messages m
      WHERE m.id = ?
    `, [messageIdInt]);

    if (messages.length === 0) {
      console.log('Message not found:', messageIdInt);
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = messages[0];

    // Only allow deleting own messages
    if (message.sender_id !== req.user.id) {
      console.log('Access denied - not sender:', { messageSenderId: message.sender_id, currentUserId: req.user.id });
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    if (deleteForEveryone === 'true') {
      // Delete for everyone - mark deleted for all participants in the conversation
      const [participants] = await connection.execute(
        'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
        [message.conversation_id]
      );

      // Add deletion record for all participants
      for (const participant of participants) {
        try {
          // Use INSERT IGNORE or check if exists first to avoid duplicate key errors
          await connection.execute(
            'INSERT IGNORE INTO message_deletions (message_id, user_id) VALUES (?, ?)',
            [messageIdInt, participant.user_id]
          );
        } catch (err) {
          // Log error but continue
          console.error('Error deleting message for user:', participant.user_id, err.message);
        }
      }

      console.log('Message deleted for everyone:', messageIdInt);
    } else {
      // Delete for me only - soft delete - add to message_deletions table
      // Use INSERT IGNORE to avoid duplicate key errors if already deleted
      try {
        await connection.execute(
          'INSERT IGNORE INTO message_deletions (message_id, user_id) VALUES (?, ?)',
          [messageIdInt, req.user.id]
        );
        console.log('Message deleted for user only:', messageIdInt);
      } catch (err) {
        // If duplicate, message is already deleted, which is fine
        if (err.message.includes('Duplicate entry')) {
          console.log('Message already deleted for user:', req.user.id);
        } else {
          throw err;
        }
      }
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
