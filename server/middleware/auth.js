const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');
const authRoutes = require('../routes/auth');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // Check if token is revoked
  if (authRoutes.revokedTokens && authRoutes.revokedTokens.has(token)) {
    return res.status(403).json({ message: 'Token has been revoked' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Update lastActive for this session
    if (authRoutes.activeSessions && authRoutes.activeSessions.has(token)) {
      const session = authRoutes.activeSessions.get(token);
      if (session) {
        session.lastActive = new Date();
      }
    }
    
    // Get user from database
    const connection = getConnection();
    
    if (!connection) {
      console.error('Auth middleware error: Database connection is null');
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    const [users] = await connection.execute(
      'SELECT id, username, email, full_name, avatar_url, cover_url, status, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = users[0];
    console.log('Auth middleware - user from DB:', user);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authenticateToken, isAdmin };
