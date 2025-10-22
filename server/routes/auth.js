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

// In-memory store for QR login sessions
// Structure: { qrToken: { userId: null, status: 'pending'|'confirmed'|'expired', expiresAt: timestamp, token: null } }
const qrLoginSessions = new Map();

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // You can change to other services like 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password' // Use App Password for Gmail
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
        phone
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
        phone: user.phone,
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

module.exports = router;

// -- Email Verification (DEV) --
// Send verification code to email
router.post('/send-verification', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    emailVerificationStore.set(email, { code, expiresAt });

    // Send real email with OTP
    try {
      const transporter = createTransporter();
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
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success to user, but log the error
      console.log(`Fallback: Verification code for ${email}: ${code} (expires in 10m)`);
    }

    return res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('send-verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Verify email code
router.post('/verify-code', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;
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
  } catch (error) {
    console.error('verify-code error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// -- QR CODE LOGIN ENDPOINTS --

// Register QR code session (called by PC when generating QR)
router.post('/qr-login-init', (req, res) => {
  try {
    const { qrToken } = req.body;
    
    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
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

    // Create new session
    const expiresAt = Date.now() + 60 * 1000; // 60 seconds
    qrLoginSessions.set(qrToken, {
      userId: null,
      status: 'pending',
      expiresAt: expiresAt,
      token: null
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
      'SELECT id, username, email, full_name, avatar_url, phone, status FROM users WHERE id = ?',
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
      phone: user.phone,
      status: user.status
    };

    // Update user status to online
    await connection.execute(
      'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      ['online', user.id]
    );

    // Clean up after 5 minutes
    setTimeout(() => {
      qrLoginSessions.delete(qrToken);
    }, 5 * 60 * 1000);

    res.json({ 
      success: true, 
      message: 'QR login confirmed successfully'
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
      message: session.status === 'pending' ? 'Waiting for scan' : 'QR expired'
    });
  } catch (error) {
    console.error('QR status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
