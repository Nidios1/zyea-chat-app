const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/upload');
const profileRoutes = require('./routes/profile');
const newsfeedRoutes = require('./routes/newsfeed');
const friendsRoutes = require('./routes/friends');
const appRoutes = require('./routes/app');
const { router: notificationRoutes } = require('./routes/notifications');
const { connectDB } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.'
});
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow localhost and common network IPs
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /^http:\/\/192\.168\.\d+\.\d+:3000$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
        /^http:\/\/172\.\d+\.\d+\.\d+:3000$/
      ];
      
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        } else {
          return allowedOrigin.test(origin);
        }
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(`⚠️  Socket CORS blocked origin: ${origin}`);
        callback(null, true); // Allow for now, can be changed to false for security
      }
    },
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    console.log(`🔍 CORS Request from origin: ${origin}`);
    
    // Allow localhost and common network IPs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
      /^http:\/\/172\.\d+\.\d+\.\d+:3000$/
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else {
        return allowedOrigin.test(origin);
      }
    });
    
    if (isAllowed) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`⚠️  CORS origin not in whitelist (but allowing anyway): ${origin}`);
      callback(null, true); // Allow for now, can be changed to false for security
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to database
connectDB();

// Middleware to pass io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/newsfeed', authenticateToken, newsfeedRoutes);
app.use('/api/test-newsfeed', newsfeedRoutes); // Test route without auth
app.use('/api/friends', authenticateToken, friendsRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/app', appRoutes); // Live update endpoints
app.use('/api', uploadRoutes);

// ✅ Tối ưu: Tạo helper function để tránh lặp code get connection
const { getConnection } = require('./config/database');

// ✅ Tối ưu: Helper function update last_seen để tránh duplicate code
const updateLastSeen = async (userId) => {
  try {
    if (!userId) return;
    const connection = getConnection();
    await connection.execute(
      'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('❌ Error updating last_seen:', error);
  }
};

// ✅ Helper function to update user activity status
const updateUserActivity = async (userId, status = 'online') => {
  try {
    if (!userId) return false;
    const connection = getConnection();
    await connection.execute(
      'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [status, userId]
    );
    return true;
  } catch (error) {
    console.error('❌ Error updating user activity:', error);
    return false;
  }
};

// ✅ Tối ưu: Throttle update last_seen để giảm DB load
const lastSeenUpdates = new Map();
const LAST_SEEN_THROTTLE = 5000; // 5 giây

const throttledUpdateLastSeen = async (userId) => {
  if (!userId) return;
  
  const now = Date.now();
  const lastUpdate = lastSeenUpdates.get(userId);
  
  if (!lastUpdate || now - lastUpdate > LAST_SEEN_THROTTLE) {
    lastSeenUpdates.set(userId, now);
    await updateLastSeen(userId);
  }
};

// ✅ Helper function to notify friends about status changes
const notifyFriendsStatusChange = async (socket, userId, status) => {
  try {
    if (!userId) return;
    
    const connection = getConnection();
    
    // Query friends
    const [friends] = await connection.execute(`
      SELECT f.user_id FROM friends f 
      WHERE f.friend_id = ? AND f.status = 'accepted'
    `, [userId]);
    
    // Prepare status change data
    const statusData = {
      userId: userId,
      status: status,
      lastSeen: new Date()
    };
    
    // Emit status change to all friends
    friends.forEach(friend => {
      socket.to(friend.user_id.toString()).emit('userStatusChanged', statusData);
    });
    
    console.log(`Notified ${friends.length} friends about ${userId}'s status change to ${status}`);
  } catch (error) {
    console.error('❌ Error notifying friends status change:', error);
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', async (userId) => {
    socket.join(userId);
    socket.userId = userId; // Store userId in socket for disconnect handling
    socket.lastActivity = Date.now(); // Track last activity time
    console.log(`User ${userId} joined their room`);
    
    // Update user status to online when they join
    try {
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        ['online', userId]
      );
      console.log(`User ${userId} status updated to online`);
      
      // ✅ Tối ưu: Query friends một lần và emit batch
      const [friends] = await connection.execute(`
        SELECT f.user_id FROM friends f 
        WHERE f.friend_id = ? AND f.status = 'accepted'
      `, [userId]);
      
      // ✅ Tối ưu: Prepare status change data một lần
      const statusData = {
        userId: userId,
        status: 'online',
        lastSeen: new Date()
      };
      
      // Emit online status to all friends
      friends.forEach(friend => {
        socket.to(friend.user_id.toString()).emit('userStatusChanged', statusData);
      });
    } catch (error) {
      console.error('❌ Error updating user status on join:', error);
    }
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    console.log('Received sendMessage:', data);
    const { receiverId, message, senderId, conversationId } = data;
    
    // ✅ Tối ưu: Update activity với throttle
    socket.lastActivity = Date.now();
    throttledUpdateLastSeen(senderId);
    
    // Send message to receiver
    socket.to(receiverId).emit('receiveMessage', {
      senderId,
      message,
      timestamp: new Date()
    });
    console.log('Sent receiveMessage to:', receiverId);
    
    // Emit conversation update to both users
    const updateData = {
      conversationId: conversationId,
      lastMessage: message,
      timestamp: new Date()
    };
    
    // Emit to sender (current user)
    socket.to(senderId).emit('conversationUpdated', updateData);
    console.log('Sent conversationUpdated to sender:', senderId);
    
    // Emit to receiver
    socket.to(receiverId).emit('conversationUpdated', updateData);
    console.log('Sent conversationUpdated to receiver:', receiverId);
    
    // Also emit to current socket (sender)
    socket.emit('conversationUpdated', updateData);
    console.log('Sent conversationUpdated to current socket');
  });

  // ✅ Tối ưu: Xóa duplicate typing handler - handler đầy đủ hơn ở dưới (line 340)

  // Handle message edited
  socket.on('messageEdited', (data) => {
    console.log('Received messageEdited:', data);
    const { messageId, content, conversationId } = data;
    
    // Get conversation participants
    const connection = getConnection();
    connection.query(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
      [conversationId],
      (err, results) => {
        if (err) {
          console.error('Error getting conversation participants:', err);
          return;
        }
        
        // Emit to all participants in this conversation
        results.forEach(participant => {
          io.to(participant.user_id).emit('messageEdited', {
            messageId,
            content,
            conversationId
          });
          console.log('Sent messageEdited to user:', participant.user_id);
        });
      }
    );
  });

  // Handle message deleted
  socket.on('messageDeleted', (data) => {
    console.log('Received messageDeleted:', data);
    const { messageId, conversationId } = data;
    
    // Get conversation participants
    const connection = getConnection();
    connection.query(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
      [conversationId],
      (err, results) => {
        if (err) {
          console.error('Error getting conversation participants:', err);
          return;
        }
        
        // Emit to all participants in this conversation
        results.forEach(participant => {
          io.to(participant.user_id).emit('messageDeleted', {
            messageId,
            conversationId
          });
          console.log('Sent messageDeleted to user:', participant.user_id);
        });
      }
    );
  });

  // Handle user viewing conversation (read receipts)
  socket.on('viewingConversation', async (data) => {
    console.log('User viewing conversation:', data);
    
    // ✅ Tối ưu: Update với throttle
    socket.lastActivity = Date.now();
    throttledUpdateLastSeen(data.userId);
    
    // Join user to conversation room
    socket.join(data.conversationId);
    
    // Emit to other users in the conversation that this user is viewing
    socket.to(data.conversationId).emit('userViewingConversation', {
      userId: data.userId,
      conversationId: data.conversationId
    });
  });

  // Handle user leaving conversation
  socket.on('leftConversation', async (data) => {
    console.log('User left conversation:', data);
    
    // ✅ Tối ưu: Update với throttle
    socket.lastActivity = Date.now();
    throttledUpdateLastSeen(data.userId);
    
    // Leave conversation room
    socket.leave(data.conversationId);
    
    // Emit to other users that this user left
    socket.to(data.conversationId).emit('userLeftConversation', {
      userId: data.userId,
      conversationId: data.conversationId
    });
  });

  // Handle message read status
  socket.on('messageRead', async (data) => {
    console.log('Message read status:', data);
    
    // ✅ Tối ưu: Update với throttle
    socket.lastActivity = Date.now();
    throttledUpdateLastSeen(data.readBy);
    
    // Emit to sender that their message was read
    socket.to(data.senderId).emit('messageRead', {
      messageId: data.messageId,
      readBy: data.readBy,
      readAt: data.readAt
    });
  });

  // Handle marking messages as read
  socket.on('markMessagesAsRead', async (data) => {
    console.log('Marking messages as read:', data);
    
    // ✅ Tối ưu: Update với throttle
    socket.lastActivity = Date.now();
    throttledUpdateLastSeen(data.userId);
    
    // Emit to other users in conversation that messages were read
    socket.to(data.conversationId).emit('messagesMarkedAsRead', {
      conversationId: data.conversationId,
      messageIds: data.messageIds,
      readBy: data.userId,
      readAt: new Date()
    });
  });

  // Handle typing status
  socket.on('typing', async (data) => {
    console.log('User typing status:', data);
    
    // ✅ Tối ưu: Update với throttle
    socket.lastActivity = Date.now();
    throttledUpdateLastSeen(data.userId);
    
    // Emit to other users in conversation
    socket.to(data.conversationId).emit('userTyping', {
      conversationId: data.conversationId,
      userId: data.userId,
      isTyping: data.isTyping,
      username: data.username,
      fullName: data.fullName
    });
  });

  // Handle stop typing
  socket.on('stopTyping', async (data) => {
    console.log('User stopped typing:', data);
    
    // ✅ Tối ưu: Update với throttle
    socket.lastActivity = Date.now();
    throttledUpdateLastSeen(data.userId);
    
    // Emit to other users in conversation
    socket.to(data.conversationId).emit('userStoppedTyping', {
      conversationId: data.conversationId,
      userId: data.userId,
      username: data.username,
      fullName: data.fullName
    });
  });

  // Handle user activity (general activity tracking)
  socket.on('userActivity', async (data) => {
    console.log('User activity:', data);
    
    // Update user's activity and last_seen
    socket.lastActivity = Date.now();
    const updated = await updateUserActivity(data.userId, 'online');
    if (updated) {
      console.log(`User ${data.userId} activity updated, status set to online`);
    }
  });

  // WebRTC Signaling for Video/Audio Calls
  socket.on('call-offer', (data) => {
    console.log('Call offer from:', data.from, 'to:', data.to);
    socket.to(data.to.toString()).emit('call-offer', {
      offer: data.offer,
      from: data.from,
      isVideo: data.isVideo
    });
  });

  socket.on('call-answer', (data) => {
    console.log('Call answer from:', data.from, 'to:', data.to);
    socket.to(data.to.toString()).emit('call-answer', {
      answer: data.answer,
      from: data.from
    });
  });

  socket.on('ice-candidate', (data) => {
    console.log('ICE candidate from:', socket.userId, 'to:', data.to);
    socket.to(data.to.toString()).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.userId
    });
  });

  socket.on('end-call', (data) => {
    console.log('Call ended by:', socket.userId, 'to:', data.to);
    socket.to(data.to.toString()).emit('call-ended', {
      from: socket.userId
    });
  });

  socket.on('call-rejected', (data) => {
    console.log('Call rejected by:', socket.userId, 'to:', data.to);
    socket.to(data.to.toString()).emit('call-rejected', {
      from: socket.userId
    });
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Update user status to offline when they disconnect
    const userId = socket.userId;
    if (userId) {
      const updated = await updateUserActivity(userId, 'offline');
      if (updated) {
        console.log(`User ${userId} status updated to offline`);
        await notifyFriendsStatusChange(socket, userId, 'offline');
      }
    }
  });
});

// Check for inactive users every 5 minutes (disabled for now to fix loading issue)
// setInterval(async () => {
//   try {
//     const { getConnection } = require('./config/database');
//     const connection = getConnection();
    
//     // Find users who need status updates based on their last activity
//     const [usersToUpdate] = await connection.execute(`
//       SELECT id, last_seen, status FROM users 
//       WHERE status IN ('online', 'recently_active', 'away')
//     `);
    
//     for (const user of usersToUpdate) {
//       const lastSeen = new Date(user.last_seen);
//       const now = new Date();
//       const minutesSinceLastSeen = Math.floor((now - lastSeen) / (1000 * 60));
      
//       let newStatus = 'offline';
      
//       if (minutesSinceLastSeen <= 2) {
//         newStatus = 'online';
//       } else if (minutesSinceLastSeen <= 10) {
//         newStatus = 'recently_active';
//       } else if (minutesSinceLastSeen <= 30) {
//         newStatus = 'away';
//       } else {
//         newStatus = 'offline';
//       }
      
//       // Only update if status has changed
//       if (user.status !== newStatus) {
//         await connection.execute(
//           'UPDATE users SET status = ? WHERE id = ?',
//           [newStatus, user.id]
//         );
        
//         // Notify all friends that this user's status has changed
//         const [friends] = await connection.execute(`
//           SELECT f.user_id FROM friends f 
//           WHERE f.friend_id = ? AND f.status = 'accepted'
//         `, [user.id]);
        
//         // Emit status change to all friends
//         friends.forEach(friend => {
//           io.to(friend.user_id.toString()).emit('userStatusChanged', {
//             userId: user.id,
//             status: newStatus,
//             lastSeen: lastSeen
//           });
//         });
        
//         console.log(`User ${user.id} status updated to ${newStatus} (${minutesSinceLastSeen} minutes ago)`);
//       }
//     }
//   } catch (error) {
//     console.error('Error checking inactive users:', error);
//   }
// }, 5 * 60 * 1000); // Check every 5 minutes

// Test endpoint to manually trigger status update
app.get('/api/test-status', async (req, res) => {
  try {
    const { getConnection } = require('./config/database');
    const connection = getConnection();
    
    // Get all users and their current status
    const [users] = await connection.execute(`
      SELECT id, username, full_name, status, last_seen 
      FROM users 
      ORDER BY id
    `);
    
    const statusInfo = users.map(user => {
      const lastSeen = new Date(user.last_seen);
      const now = new Date();
      const minutesSinceLastSeen = Math.floor((now - lastSeen) / (1000 * 60));
      
      let expectedStatus = 'offline';
      if (minutesSinceLastSeen <= 2) {
        expectedStatus = 'online';
      } else if (minutesSinceLastSeen <= 10) {
        expectedStatus = 'recently_active';
      } else if (minutesSinceLastSeen <= 30) {
        expectedStatus = 'away';
      } else {
        expectedStatus = 'offline';
      }
      
      return {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        currentStatus: user.status,
        expectedStatus: expectedStatus,
        lastSeen: user.last_seen,
        minutesAgo: minutesSinceLastSeen,
        needsUpdate: user.status !== expectedStatus
      };
    });
    
    res.json({
      message: 'Status test completed',
      users: statusInfo,
      totalUsers: users.length,
      needsUpdate: statusInfo.filter(u => u.needsUpdate).length
    });
  } catch (error) {
    console.error('Error testing status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Server accessible from network on http://[YOUR_IP]:${PORT}`);
  console.log(`📱 Mobile devices can access via: http://[YOUR_IP]:${PORT}`);
  console.log(`\n💡 To find your IP address:`);
  console.log(`   Windows: ipconfig`);
  console.log(`   Mac/Linux: ifconfig`);
});



