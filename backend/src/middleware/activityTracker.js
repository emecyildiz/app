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
  console.log('updateUserActivity: All active users:', Array.from(activeUsers.keys()));
  
  // Clean up inactive users (30 minutes of inactivity - increased for testing)
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  for (const [id, data] of activeUsers.entries()) {
    if (data.lastActivity < thirtyMinutesAgo) {
      console.log('updateUserActivity: Removing inactive user:', id);
      activeUsers.delete(id);
    }
  }
};

// Get active users count (only USER role)
const getActiveUsersCount = () => {
  // We need to filter by user role - this requires database access
  // For now, return all active users count
  const count = activeUsers.size;
  console.log('getActiveUsersCount: Current active users count:', count);
  console.log('getActiveUsersCount: Active user IDs:', Array.from(activeUsers.keys()));
  return count;
};

// Get active users count for specific role
const getActiveUsersCountByRole = async (role) => {
  try {
    const { supabase } = require('../config/supabase');
    
    // Get user IDs from active users map
    const activeUserIds = Array.from(activeUsers.keys());
    
    if (activeUserIds.length === 0) {
      console.log('getActiveUsersCountByRole: No active users found');
      return 0;
    }
    
    console.log('getActiveUsersCountByRole: Checking role:', role);
    console.log('getActiveUsersCountByRole: Active user IDs to check:', activeUserIds);
    
    // Query database to get users with specific role from active users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, role')
      .in('id', activeUserIds)
      .eq('role', role);
    
    if (error) {
      console.error('getActiveUsersCountByRole: Database error:', error);
      return 0;
    }
    
    const count = users ? users.length : 0;
    console.log(`getActiveUsersCountByRole: Active ${role} users count:`, count);
    console.log(`getActiveUsersCountByRole: Active ${role} user IDs:`, users ? users.map(u => u.id) : []);
    
    return count;
  } catch (error) {
    console.error('getActiveUsersCountByRole: Error:', error);
    return 0;
  }
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
  updateUserActivity,
  getActiveUsersCountByRole
}; 