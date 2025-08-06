// Active users tracking middleware
const activeUsers = new Map(); // userId -> { lastActivity, sessionId }

// Update user activity
const updateUserActivity = (userId) => {
  const now = new Date();
  activeUsers.set(userId, {
    lastActivity: now,
    sessionId: Math.random().toString(36).substring(7)
  });
  
  // Clean up inactive users (5 minutes of inactivity)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  for (const [id, data] of activeUsers.entries()) {
    if (data.lastActivity < fiveMinutesAgo) {
      activeUsers.delete(id);
    }
  }
};

// Get active users count
const getActiveUsersCount = () => {
  return activeUsers.size;
};

// Middleware to track user activity
const trackUserActivity = (req, res, next) => {
  // Only track activity for authenticated users
  if (req.user && req.user.id) {
    updateUserActivity(req.user.id);
  }
  next();
};

// Middleware to track activity from token (for routes that don't use auth middleware)
const trackActivityFromToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        updateUserActivity(decoded.id);
      }
    } catch (error) {
      // Token is invalid, ignore
    }
  }
  
  next();
};

module.exports = {
  trackUserActivity,
  trackActivityFromToken,
  getActiveUsersCount,
  updateUserActivity
}; 