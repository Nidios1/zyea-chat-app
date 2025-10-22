const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/upload');
const profileRoutes = require('./routes/profile');
const newsfeedRoutes = require('./routes/newsfeed');
const friendsRoutes = require('./routes/friends');
const { router: notificationRoutes } = require('./routes/notifications');
const { connectDB } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
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
      console.log(`⚠️  CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now, can be changed to false for security
    }
  },
  credentials: true
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
app.use('/api/profile', profileRoutes);
app.use('/api/newsfeed', authenticateToken, newsfeedRoutes);
app.use('/api/test-newsfeed', newsfeedRoutes); // Test route without auth
app.use('/api/friends', authenticateToken, friendsRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api', uploadRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', async (userId) => {
    socket.join(userId);
    socket.userId = userId; // Store userId in socket for disconnect handling
    socket.lastActivity = Date.now(); // Track last activity time
    console.log(`User ${userId} joined their room`);
    
    // Update user status to online when they join
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        ['online', userId]
      );
      console.log(`User ${userId} status updated to online`);
      
      // Notify all friends that this user is now online
      const [friends] = await connection.execute(`
        SELECT f.user_id FROM friends f 
        WHERE f.friend_id = ? AND f.status = 'accepted'
      `, [userId]);
      
      // Emit online status to all friends
      friends.forEach(friend => {
        socket.to(friend.user_id.toString()).emit('userStatusChanged', {
          userId: userId,
          status: 'online',
          lastSeen: new Date()
        });
      });
    } catch (error) {
      console.error('Error updating user status on join:', error);
    }
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    console.log('Received sendMessage:', data);
    const { receiverId, message, senderId, conversationId } = data;
    
    // Update sender's activity and last_seen when they send a message
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [senderId]
      );
    } catch (error) {
      console.error('Error updating last_seen on sendMessage:', error);
    }
    
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

  // Handle typing indicators
  socket.on('typing', async (data) => {
    // Update sender's activity and last_seen when they are typing
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [data.senderId]
      );
    } catch (error) {
      console.error('Error updating last_seen on typing indicator:', error);
    }
    
    socket.to(data.receiverId).emit('userTyping', {
      senderId: data.senderId,
      isTyping: data.isTyping
    });
  });

  // Handle user viewing conversation (read receipts)
  socket.on('viewingConversation', async (data) => {
    console.log('User viewing conversation:', data);
    
    // Update user's activity and last_seen when they view a conversation
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [data.userId]
      );
    } catch (error) {
      console.error('Error updating last_seen on viewingConversation:', error);
    }
    
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
    
    // Update user's activity and last_seen when they leave a conversation
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [data.userId]
      );
    } catch (error) {
      console.error('Error updating last_seen on leftConversation:', error);
    }
    
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
    
    // Update user's activity and last_seen when they read a message
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [data.readBy]
      );
    } catch (error) {
      console.error('Error updating last_seen on messageRead:', error);
    }
    
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
    
    // Update user's activity and last_seen when they mark messages as read
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [data.userId]
      );
    } catch (error) {
      console.error('Error updating last_seen on markMessagesAsRead:', error);
    }
    
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
    
    // Update user's activity and last_seen when they are typing
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [data.userId]
      );
    } catch (error) {
      console.error('Error updating last_seen on typing:', error);
    }
    
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
    
    // Update user's activity and last_seen when they stop typing
    socket.lastActivity = Date.now();
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [data.userId]
      );
    } catch (error) {
      console.error('Error updating last_seen on stopTyping:', error);
    }
    
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
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      await connection.execute(
        'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        ['online', data.userId]
      );
      console.log(`User ${data.userId} activity updated, status set to online`);
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Update user status to offline when they disconnect
    try {
      const { getConnection } = require('./config/database');
      const connection = getConnection();
      
      // Get user ID from socket data if stored
      const userId = socket.userId;
      if (userId) {
        await connection.execute(
          'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
          ['offline', userId]
        );
        console.log(`User ${userId} status updated to offline`);
        
        // Notify all friends that this user is now offline
        const [friends] = await connection.execute(`
          SELECT f.user_id FROM friends f 
          WHERE f.friend_id = ? AND f.status = 'accepted'
        `, [userId]);
        
        // Emit offline status to all friends
        friends.forEach(friend => {
          socket.to(friend.user_id.toString()).emit('userStatusChanged', {
            userId: userId,
            status: 'offline',
            lastSeen: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Error updating user status on disconnect:', error);
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
