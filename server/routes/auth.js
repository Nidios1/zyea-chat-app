const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult, oneOf } = require('express-validator');
const { getConnection } = require('../config/database');
const nodemailer = require('nodemailer');

const router = express.Router();

// In-memory store for email verification codes (dev/demo)
// In production, persist to DB or cache and send via an email provider
const emailVerificationStore = new Map(); // key: email, value: { code, expiresAt }
const phoneVerificationStore = new Map(); // key: phone, value: { code, expiresAt }

// In-memory store for QR login sessions
// Structure: { qrToken: { userId: null, status: 'pending'|'confirmed'|'expired', expiresAt: timestamp, token: null } }
const qrLoginSessions = new Map();

// In-memory store for active user sessions
// Structure: { token: { userId, deviceInfo, createdAt, lastActive } }
const activeSessions = new Map();

// In-memory store for revoked tokens (blacklist)
// Structure: Set of revoked token strings
const revokedTokens = new Set();

// Helper function to send QR login system notification message
const sendQRLoginSystemMessage = async (userId, deviceInfo) => {
  try {
    const connection = getConnection();
    
    // Check if BOT_USER_ID is set in environment (use real user as bot)
    const botUserIdFromEnv = process.env.BOT_USER_ID;
    let systemUserId;
    
    if (botUserIdFromEnv) {
      // Use specified user ID as bot
      const [botUser] = await connection.execute(
        'SELECT id, username, full_name, avatar_url FROM users WHERE id = ?',
        [botUserIdFromEnv]
      );
      
      if (botUser.length === 0) {
        console.error('❌ Bot user ID specified but user not found:', botUserIdFromEnv);
        throw new Error('Bot user not found');
      }
      
      systemUserId = botUser[0].id;
      console.log('✅ Using real user as bot:', {
        id: systemUserId,
        username: botUser[0].username,
        full_name: botUser[0].full_name,
        avatar_url: botUser[0].avatar_url
      });
    } else {
      // Get or create system user (username: 'system' or email: 'system@zyea.com')
      let [systemUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
        ['system', 'system@zyea.com']
      );
      
      if (systemUsers.length === 0) {
        // Create system user if doesn't exist
        // Use a dummy password hash (system user won't login)
        const dummyPassword = await bcrypt.hash('system_user_no_login', 10);
        // Set avatar_url for system user (logo)
        const systemAvatarUrl = '/assets/icon.jpg'; // Logo path
        const [result] = await connection.execute(
          'INSERT INTO users (username, email, password, full_name, role, status, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['system', 'system@zyea.com', dummyPassword, 'ZYEA Chat', 'admin', 'online', systemAvatarUrl]
        );
        systemUserId = result.insertId;
        console.log('✅ Created system user with ID:', systemUserId);
      } else {
        systemUserId = systemUsers[0].id;
        // Always update avatar_url to ensure it's set correctly
        const systemAvatarUrl = '/assets/icon.jpg';
        await connection.execute(
          'UPDATE users SET avatar_url = ?, full_name = ? WHERE id = ?',
          [systemAvatarUrl, 'ZYEA Chat', systemUserId]
        );
        console.log('✅ Updated system user avatar to:', systemAvatarUrl);
        console.log('✅ Using existing system user with ID:', systemUserId);
      }
    }

    // Format date and time (format: "11 tháng 11, 2025 20:16")
    const now = new Date();
    const day = now.getDate();
    const monthNames = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 
                        'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateTimeStr = `${day} ${month}, ${year} ${hours}:${minutes}`;

    // Format device info properly
    const deviceType = deviceInfo.device || deviceInfo.deviceType || 'Desktop';
    const browser = deviceInfo.browser || 'Chrome';
    const browserVersion = deviceInfo.browserVersion || deviceInfo.version || 'Unknown';
    const os = deviceInfo.os || deviceInfo.osName || 'Windows';
    const deviceStr = `${deviceType} - ${browser} - ${browserVersion} - ${os}`;

    // Get IP address (handle various proxy headers)
    let ipAddress = deviceInfo.ip || 'Unknown';
    if (ipAddress === 'Unknown' || !ipAddress) {
      // Try to get from request if available (but we don't have req here, so use deviceInfo)
      ipAddress = deviceInfo.ip || 'Unknown';
    }
    // Clean IP address (remove port if present, handle IPv6)
    if (ipAddress && ipAddress !== 'Unknown') {
      // Remove port number if present (e.g., "192.168.0.104:12345" -> "192.168.0.104")
      ipAddress = ipAddress.split(':')[0];
    }

    // Create system message content
    const messageContent = `[Cảnh báo] Hệ thống ghi nhận phiên đăng nhập tài khoản của bạn trên thiết bị mới:
Thời gian: ${dateTimeStr}
Địa điểm: ${deviceInfo.location || 'Unknown'}
Thiết bị: ${deviceStr}
IP: ${ipAddress}
Vui lòng kiểm tra tại mục Bảo mật & An toàn.`;

    // Get or create conversation between user and system
    console.log('🔍 Looking for existing conversation between user', userId, 'and system user', systemUserId);
    const [existingConvs] = await connection.execute(`
      SELECT c.id FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE cp1.user_id = ? AND cp2.user_id = ? AND c.type = 'private'
    `, [userId, systemUserId]);
    console.log('🔍 Found existing conversations:', existingConvs.length);

    let conversationId;
    if (existingConvs.length > 0) {
      conversationId = existingConvs[0].id;
      console.log('✅ Using existing conversation:', conversationId);
      // Unhide conversation if it was hidden
      await connection.execute(`
        UPDATE conversation_settings 
        SET hidden = FALSE 
        WHERE conversation_id = ? AND user_id = ?
      `, [conversationId, userId]);
      console.log('✅ Conversation unhidden');
    } else {
      // Create new conversation
      console.log('📝 Creating new conversation with system user');
      const [convResult] = await connection.execute(
        'INSERT INTO conversations (type, name) VALUES (?, ?)',
        ['private', 'ZYEA Chat']
      );
      conversationId = convResult.insertId;
      console.log('✅ Created new conversation:', conversationId);

      // Add participants
      await connection.execute(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
        [conversationId, userId, conversationId, systemUserId]
      );
      console.log('✅ Added participants to conversation');

      // Don't hide conversation - system messages should be visible
      await connection.execute(`
        INSERT INTO conversation_settings (conversation_id, user_id, hidden)
        VALUES (?, ?, FALSE)
      `, [conversationId, userId]);
      console.log('✅ Conversation settings created (not hidden)');
    }

    // Send system message (sender is system user)
    console.log('📤 Sending system message to conversation:', conversationId);
    console.log('📤 Message content length:', messageContent.length);
    const [messageResult] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)',
      [conversationId, systemUserId, messageContent, 'system']
    );
    console.log('✅ System message inserted with ID:', messageResult.insertId);

    // Update conversation timestamp
    await connection.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );
    console.log('✅ Conversation timestamp updated');

    console.log('✅ QR login system message sent to conversation:', conversationId);
  } catch (error) {
    console.error('Error sending QR login system message:', error);
    throw error;
  }
};

// Email transporter configuration
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  // Only create transporter if credentials are provided
  if (!emailUser || !emailPass || emailUser === 'your_email@gmail.com' || emailPass === 'your_app_password_here') {
    console.log('⚠️  Email credentials not configured. Email verification will log to console only.');
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

// Register
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, phone } = req.body;
    const connection = getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (username = email)
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)',
      [email, email, hashedPassword, fullName, phone || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.insertId,
        username: email,
        email,
        fullName,
        phone,
        role: 'user' // New users are always 'user' by default
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (accept email or phone)
router.post('/login', [
  oneOf([
    body('email').isEmail(),
    body('phone').isMobilePhone('vi-VN')
  ], 'Please provide a valid email or phone number'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('📥 Login request received:', { email: req.body.email, passwordLength: req.body.password?.length });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, phone, password } = req.body;
    const connection = getConnection();

    // Find user by email or phone
    let users;
    if (email) {
      [users] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
    } else if (phone) {
      [users] = await connection.execute(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
    } else {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update user status to online
    await connection.execute(
      'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      ['online', user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Extract device info from request
    const userAgent = req.headers['user-agent'] || '';
    const clientIp = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Parse device info
    let device = 'Mobile';
    let browser = 'Unknown';
    let browserVersion = '';
    let os = 'Unknown';
    
    if (userAgent) {
      // Detect browser
      if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+)/);
        browserVersion = match ? match[1] : '';
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+)/);
        browserVersion = match ? match[1] : '';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
        const match = userAgent.match(/Version\/(\d+)/);
        browserVersion = match ? match[1] : '';
      }
      
      // Detect OS
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) {
        os = 'Android';
        device = 'Mobile';
      } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        os = 'iOS';
        device = 'Mobile';
      }
    }

    // Store active session
    // Try to get location from request body (if sent from client) or use IP-based location
    let location = 'Unknown';
    if (req.body.deviceInfo && req.body.deviceInfo.location) {
      location = req.body.deviceInfo.location;
    }
    
    const deviceInfo = {
      device,
      browser,
      browserVersion,
      os,
      ip: clientIp,
      location: location
    };

    activeSessions.set(token, {
      userId: user.id,
      deviceInfo,
      createdAt: new Date(),
      lastActive: new Date()
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        fullName: user.full_name, // Keep both for compatibility
        avatar_url: user.avatar_url,
        cover_url: user.cover_url,
        phone: user.phone,
        role: user.role || 'user', // Include role
        status: 'online'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const connection = getConnection();

    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, email, full_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Generate reset token (simple implementation - in production, use crypto.randomBytes)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real application, you would:
    // 1. Store the reset token in database with expiration
    // 2. Send email with reset link
    // 3. Handle token validation and password reset

    // For now, just return success (in production, don't return the token)
    console.log(`Password reset requested for user: ${user.email}`);
    console.log(`Reset token: ${resetToken}`);

    res.json({
      message: 'Password reset email sent successfully',
      // In production, don't return the token to client
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;
    const connection = getConnection();

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await connection.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, decoded.userId]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    const connection = getConnection();

    // Update user status to offline
    await connection.execute(
      'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      ['offline', userId]
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active sessions for current user
router.get('/active-sessions', async (req, res) => {
  try {
    console.log('📥 GET /auth/active-sessions - Request received');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      console.log('✅ Token verified, userId:', userId);
      console.log('📊 Active sessions count:', activeSessions.size);

      // Get all active sessions for this user (excluding current token)
      const userSessions = [];
      for (const [sessionToken, sessionData] of activeSessions.entries()) {
        if (sessionData.userId === userId && !revokedTokens.has(sessionToken)) {
          // Skip current session token
          if (sessionToken !== token) {
            const browser = sessionData.deviceInfo?.browser || 'Unknown';
            const browserVersion = sessionData.deviceInfo?.browserVersion || '';
            const appVersion = sessionData.deviceInfo?.version || 'Zyea+ Web';
            
            userSessions.push({
              id: sessionToken.substring(0, 20) + '...', // Use partial token as ID for display
              sessionId: sessionToken, // Full token for logout
              browser: browser,
              browserVersion: browserVersion,
              appVersion: appVersion,
              location: sessionData.deviceInfo?.location || 'Unknown',
              lastActive: sessionData.lastActive || sessionData.createdAt
            });
          }
        }
      }

      console.log('📊 Found', userSessions.length, 'sessions for user', userId);
      res.json({
        sessions: userSessions
      });
    } catch (error) {
      console.error('❌ Token verification error:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Get active sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout from a specific session
router.post('/logout-session', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Verify the session belongs to this user
      const session = activeSessions.get(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Revoke the token
      revokedTokens.add(sessionId);
      activeSessions.delete(sessionId);

      // Emit socket event to notify the revoked session (if socket exists)
      // Get io instance from req.app if available
      const io = req.app.get('io');
      if (io) {
        // Emit to user room - all sockets for this user will receive it
        // Client will check if it's their session and logout if needed
        io.to(userId.toString()).emit('session-revoked', { 
          reason: 'logged_out',
          sessionId: sessionId 
        });
      }

      res.json({ message: 'Session logged out successfully' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Logout session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout from all other sessions (keep current session)
router.post('/logout-all-other-sessions', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Revoke all other sessions for this user
      let revokedCount = 0;
      const revokedTokensList = [];
      for (const [sessionToken, sessionData] of activeSessions.entries()) {
        if (sessionData.userId === userId && sessionToken !== token) {
          revokedTokens.add(sessionToken);
          activeSessions.delete(sessionToken);
          revokedTokensList.push(sessionToken);
          revokedCount++;
        }
      }

      // Emit socket events to notify all revoked sessions
      const io = req.app.get('io');
      if (io) {
        // Emit to user room - all sockets for this user will receive it
        // Client will check if it's their session and logout if needed
        io.to(userId.toString()).emit('session-revoked', { 
          reason: 'logged_out_all_other',
          revokedSessions: revokedTokensList 
        });
      }

      res.json({ 
        message: 'All other sessions logged out successfully',
        revokedCount 
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Logout all other sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export revokedTokens for middleware to check
module.exports = router;
module.exports.revokedTokens = revokedTokens;
module.exports.activeSessions = activeSessions;

// -- Email/Phone Verification (DEV) --
// Send verification code to email or phone
router.post('/send-verification', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Send to email
    if (email) {
      emailVerificationStore.set(email, { code, expiresAt });

      // Send real email with OTP
      try {
        const transporter = createTransporter();
        if (transporter) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: email,
            subject: 'Mã xác thực tài khoản Zyea+',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0a66ff;">Xác thực tài khoản Zyea+</h2>
                <p>Xin chào,</p>
                <p>Bạn đang đăng ký tài khoản Zyea+. Vui lòng sử dụng mã xác thực sau:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                  <h1 style="color: #0a66ff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
                </div>
                <p>Mã này có hiệu lực trong 10 phút.</p>
                <p>Nếu bạn không yêu cầu đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">Email này được gửi tự động từ hệ thống Zyea+</p>
              </div>
            `
          });
          console.log(`📧 Verification email sent to ${email}`);
        } else {
          // Email config not setup, log to console
          console.log(`📧 Verification code for ${email}: ${code} (expires in 10m)`);
          console.log(`   --- Copy this code and paste it in the app ---`);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Still return success to user, but log the error
        console.log(`📧 Fallback: Verification code for ${email}: ${code} (expires in 10m)`);
        console.log(`   --- Copy this code and paste it in the app ---`);
      }
    }

    // Send to phone
    if (phone) {
      phoneVerificationStore.set(phone, { code, expiresAt });
      
      // Try to send real SMS if Twilio is configured
      try {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
          const twilio = require('twilio');
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          
          await client.messages.create({
            body: `Mã xác thực Zyea+ của bạn là: ${code}. Mã này có hiệu lực trong 10 phút.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
          });
          
          console.log(`📱 SMS sent to ${phone}`);
        } else {
          // Fallback: log to console if Twilio not configured
          console.log(`📱 Verification code for ${phone}: ${code} (expires in 10m)`);
          console.log(`--- Copy this code and paste it in the app ---`);
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        // Still log to console as fallback
        console.log(`📱 Verification code for ${phone}: ${code} (expires in 10m)`);
        console.log(`--- Copy this code and paste it in the app ---`);
      }
    }

    return res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('send-verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Verify code (email or phone)
router.post('/verify-code', [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, code } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    // Check email verification
    if (email) {
      const record = emailVerificationStore.get(email);
      if (!record) return res.status(400).json({ message: 'Code not found' });
      if (Date.now() > record.expiresAt) {
        emailVerificationStore.delete(email);
        return res.status(400).json({ message: 'Code expired' });
      }
      if (record.code !== code) return res.status(400).json({ message: 'Invalid code' });

      // Mark verified (dev): remove record
      emailVerificationStore.delete(email);
      return res.json({ message: 'Email verified' });
    }

    // Check phone verification
    if (phone) {
      const record = phoneVerificationStore.get(phone);
      if (!record) return res.status(400).json({ message: 'Code not found' });
      if (Date.now() > record.expiresAt) {
        phoneVerificationStore.delete(phone);
        return res.status(400).json({ message: 'Code expired' });
      }
      if (record.code !== code) return res.status(400).json({ message: 'Invalid code' });

      // Mark verified (dev): remove record
      phoneVerificationStore.delete(phone);
      return res.json({ message: 'Phone verified' });
    }

    return res.status(400).json({ message: 'Email or phone is required' });
  } catch (error) {
    console.error('verify-code error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// -- QR CODE LOGIN ENDPOINTS --

// Register QR code session (called by PC when generating QR)
router.post('/qr-login-init', (req, res) => {
  try {
    const { qrToken, deviceInfo } = req.body;
    
    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    // Get device info from request
    const userAgent = req.headers['user-agent'] || '';
    // Get IP address (handle various proxy headers)
    let clientIp = req.ip || 
                   req.connection?.remoteAddress || 
                   req.socket?.remoteAddress ||
                   (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
                   req.headers['x-real-ip'] ||
                   'Unknown';
    // Clean IP address (remove port if present)
    if (clientIp && clientIp !== 'Unknown') {
      clientIp = clientIp.split(':')[0];
    }
    
    // Parse device info from user agent or use provided deviceInfo
    let device = 'Desktop';
    let browser = 'Chrome';
    let browserVersion = 'Unknown';
    let os = 'Windows';
    let location = 'Unknown';
    
    if (deviceInfo) {
      device = deviceInfo.device || deviceInfo.deviceType || device;
      browser = deviceInfo.browser || browser;
      browserVersion = deviceInfo.browserVersion || deviceInfo.version || browserVersion;
      os = deviceInfo.os || deviceInfo.osName || os;
      location = deviceInfo.location || location; // Get location from client if provided
    } else if (userAgent) {
      // Simple parsing from user agent
      if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
        const match = userAgent.match(/Chrome\/([\d.]+)/);
        if (match) browserVersion = match[1];
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
      }
      
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
    }

    // Check if session already exists and is still valid
    const existingSession = qrLoginSessions.get(qrToken);
    if (existingSession && Date.now() < existingSession.expiresAt) {
      return res.json({ 
        success: true, 
        message: 'QR session already active',
        expiresAt: existingSession.expiresAt
      });
    }

    // Create new session with device info
    const expiresAt = Date.now() + 60 * 1000; // 60 seconds
    qrLoginSessions.set(qrToken, {
      userId: null,
      status: 'pending',
      expiresAt: expiresAt,
      token: null,
      deviceInfo: {
        device,
        browser,
        browserVersion,
        os,
        ip: clientIp,
        location: location // Use location from client or 'Unknown'
      }
    });

    // Auto-cleanup expired session
    setTimeout(() => {
      const session = qrLoginSessions.get(qrToken);
      if (session && session.status === 'pending') {
        session.status = 'expired';
      }
    }, 60 * 1000);

    res.json({ 
      success: true, 
      message: 'QR session initialized',
      expiresAt: expiresAt
    });
  } catch (error) {
    console.error('QR init error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mobile scans QR and confirms login (called by mobile app)
router.post('/qr-login-confirm', async (req, res) => {
  try {
    const { qrToken, userId } = req.body;

    if (!qrToken || !userId) {
      return res.status(400).json({ message: 'QR token and user ID are required' });
    }

    const session = qrLoginSessions.get(qrToken);

    if (!session) {
      return res.status(404).json({ message: 'QR session not found or expired' });
    }

    if (Date.now() > session.expiresAt) {
      session.status = 'expired';
      return res.status(400).json({ message: 'QR code expired' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ message: 'QR code already used or expired' });
    }

    // Get user data
    const connection = getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, email, full_name, avatar_url, cover_url, phone, status FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Generate JWT token for PC login
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Update session
    session.status = 'confirmed';
    session.userId = userId;
    session.token = token;
    session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      fullName: user.full_name,
      avatar_url: user.avatar_url,
      cover_url: user.cover_url,
      phone: user.phone,
      status: user.status
    };

    // Store active session for QR login
    if (session.deviceInfo) {
      activeSessions.set(token, {
        userId: user.id,
        deviceInfo: session.deviceInfo,
        createdAt: new Date(),
        lastActive: new Date()
      });
    }

    // Update user status to online
    await connection.execute(
      'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      ['online', user.id]
    );

    // Clean up after 5 minutes
    setTimeout(() => {
      qrLoginSessions.delete(qrToken);
    }, 5 * 60 * 1000);

    // Send system notification message
    try {
      console.log('📱 Attempting to send QR login system message for user:', user.id);
      // Get IP address (handle various proxy headers)
      let clientIp = req.ip || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress ||
                     (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
                     req.headers['x-real-ip'] ||
                     'Unknown';
      // Clean IP address (remove port if present)
      if (clientIp && clientIp !== 'Unknown') {
        clientIp = clientIp.split(':')[0];
      }
      // Use session deviceInfo if available, otherwise create default
      const deviceInfoToSend = session.deviceInfo ? {
        ...session.deviceInfo,
        ip: session.deviceInfo.ip || clientIp
      } : {
        device: 'Desktop',
        browser: 'Chrome',
        browserVersion: 'Unknown',
        os: 'Windows',
        ip: clientIp,
        location: 'Unknown'
      };
      await sendQRLoginSystemMessage(user.id, deviceInfoToSend);
      console.log('✅ QR login system message sent successfully');
    } catch (notifError) {
      console.error('❌ Failed to send QR login system message:', notifError);
      console.error('Error details:', {
        message: notifError.message,
        stack: notifError.stack
      });
      // Don't fail the login if notification fails
    }

    // Return success with device info for notification
    res.json({ 
      success: true, 
      message: 'QR login confirmed successfully',
      deviceInfo: session.deviceInfo || {
        device: 'Desktop',
        browser: 'Chrome',
        browserVersion: 'Unknown',
        os: 'Windows',
        ip: req.ip || req.connection.remoteAddress || 'Unknown',
        location: 'Unknown'
      }
    });
  } catch (error) {
    console.error('QR confirm error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PC polls this endpoint to check QR status
router.post('/qr-login-status', (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    const session = qrLoginSessions.get(qrToken);

    if (!session) {
      return res.json({ 
        status: 'expired',
        message: 'QR session not found or expired'
      });
    }

    if (Date.now() > session.expiresAt && session.status === 'pending') {
      session.status = 'expired';
    }

    if (session.status === 'confirmed') {
      // Return login data
      return res.json({
        status: 'confirmed',
        token: session.token,
        user: session.user,
        message: 'Login successful'
      });
    }

    res.json({
      status: session.status,
      message: session.status === 'pending' ? 'Waiting for scan' : 'QR expired',
      deviceInfo: session.deviceInfo || null
    });
  } catch (error) {
    console.error('QR status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
