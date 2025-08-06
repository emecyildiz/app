// Active users tracking middleware
const activeUsers = new Map(); // userId -> { lastActivity, sessionId }

// Update user activity
const updateUserActivity = (userId) => {
  if (!userId) {
    console.log('updateUserActivity: userId is null or undefined');
    return;
  }
  
  console.log('updateUserActivity: Tracking activity for userId:', userId);
  
  const now = new Date();
  activeUsers.set(userId, {
    lastActivity: now,
    sessionId: Math.random().toString(36).substring(7)
  });
  
  console.log('updateUserActivity: Active users count after update:', activeUsers.size);
  
  // Clean up inactive users (15 minutes of inactivity - increased from 5 minutes)
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  for (const [id, data] of activeUsers.entries()) {
    if (data.lastActivity < fifteenMinutesAgo) {
      console.log('updateUserActivity: Removing inactive user:', id);
      activeUsers.delete(id);
    }
  }
};

// Get active users count
const getActiveUsersCount = () => {
  const count = activeUsers.size;
  console.log('getActiveUsersCount: Current active users count:', count);
  return count;
};

// Debug function to see active users
const getActiveUsers = () => {
  const users = [];
  for (const [id, data] of activeUsers.entries()) {
    users.push({
      userId: id,
      lastActivity: data.lastActivity,
      sessionId: data.sessionId
    });
  }
  console.log('getActiveUsers: Active users:', users);
  return users;
};

// Middleware to track user activity
const trackUserActivity = (req, res, next) => {
  console.log('trackUserActivity: req.user:', req.user);
  // Only track activity for authenticated users
  if (req.user && req.user.userId) {
    console.log('trackUserActivity: Tracking activity for userId:', req.user.userId);
    updateUserActivity(req.user.userId);
  } else {
    console.log('trackUserActivity: No user or userId found');
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
      console.log('trackActivityFromToken: Decoded token:', decoded);
      if (decoded && decoded.userId) {
        console.log('trackActivityFromToken: Tracking activity for userId:', decoded.userId);
        updateUserActivity(decoded.userId);
      } else {
        console.log('trackActivityFromToken: No userId in decoded token');
      }
    } catch (error) {
      console.log('trackActivityFromToken: Token verification failed:', error.message);
    }
  } else {
    console.log('trackActivityFromToken: No token found');
  }
  
  next();
};

module.exports = {
  trackUserActivity,
  trackActivityFromToken,
  getActiveUsersCount,
  getActiveUsers,
  updateUserActivity
}; 