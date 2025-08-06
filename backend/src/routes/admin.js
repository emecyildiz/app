const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Active users tracking
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
  if (req.user && req.user.id) {
    updateUserActivity(req.user.id);
  }
  next();
};

// Middleware to verify JWT token and admin role
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token gerekli'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin yetkisi gerekli'
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
};

// Middleware to verify JWT token and admin/operator role
const authenticateAdminOrOperator = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token gerekli'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'ADMIN' && decoded.role !== 'OPERATOR') {
      return res.status(403).json({
        success: false,
        message: 'Admin veya operatör yetkisi gerekli'
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
};

// Get admin dashboard stats
router.get('/dashboard', authenticateAdmin, trackUserActivity, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total movies
    const { count: totalMovies } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true });

    // Get total ratings
    const { count: totalRatings } = await supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true });

    // Get active users (users with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: activeUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('updatedat', thirtyDaysAgo.toISOString());

    // Get real-time active users
    const realTimeActiveUsers = getActiveUsersCount();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers || 0,
          totalMovies: totalMovies || 0,
          totalRatings: totalRatings || 0,
          activeUsers: activeUsersCount || 0,
          realTimeActiveUsers: realTimeActiveUsers
        },
        recentActivity: [] // TODO: Implement activity tracking
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get all users (admin/operator)
router.get('/users', authenticateAdminOrOperator, trackUserActivity, async (req, res) => {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .order('createdat', { ascending: false });

    // If operator, only show USER role users
    if (req.user.role === 'OPERATOR') {
      query = query.eq('role', 'USER');
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Kullanıcılar yüklenemedi'
      });
    }

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { passwordhash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.status(200).json({
      success: true,
      data: {
        users: usersWithoutPasswords
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get all operators (admin only)
router.get('/operators', authenticateAdmin, trackUserActivity, async (req, res) => {
  try {
    console.log('Get operators request received') // Debug log
    const { data: operators, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'OPERATOR')
      .order('createdat', { ascending: false });

    console.log('Supabase operators query result:', { operators, error }) // Debug log

    if (error) {
      console.error('Get operators error:', error);
      return res.status(500).json({
        success: false,
        message: 'Operatörler yüklenemedi'
      });
    }

    // Remove passwords from response
    const operatorsWithoutPasswords = operators.map(operator => {
      const { passwordhash: _, ...operatorWithoutPassword } = operator;
      return operatorWithoutPassword;
    });

    console.log('Operators without passwords:', operatorsWithoutPasswords) // Debug log

    res.status(200).json({
      success: true,
      data: {
        operators: operatorsWithoutPasswords
      }
    });
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Add operator (admin only)
router.post('/operators', authenticateAdmin, async (req, res) => {
  try {
    const { email, password, name, username } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password ve name alanları zorunludur'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create operator in Supabase
    const { data: operator, error } = await supabase
      .from('users')
      .insert({
        email,
        passwordhash: passwordHash,
        name,
        username: username || email.split('@')[0],
        role: 'OPERATOR'
      })
      .select()
      .single();

    if (error) {
      console.error('Add operator error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operatör eklenemedi'
      });
    }

    // Remove password from response
    const { passwordhash: _, ...operatorWithoutPassword } = operator;

    res.status(201).json({
      success: true,
      message: 'Operatör başarıyla eklendi',
      data: {
        operator: operatorWithoutPassword
      }
    });
  } catch (error) {
    console.error('Add operator error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Remove operator (admin only)
router.delete('/operators/:id', authenticateAdmin, async (req, res) => {
  try {
    // Check if user is actually an operator
    const { data: operator, error: getError } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.params.id)
      .single();

    if (getError || !operator) {
      return res.status(404).json({
        success: false,
        message: 'Operatör bulunamadı'
      });
    }

    if (operator.role !== 'OPERATOR') {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı bir operatör değil'
      });
    }

    // Delete operator
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Remove operator error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operatör kaldırılamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Operatör başarıyla kaldırıldı'
    });
  } catch (error) {
    console.error('Remove operator error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', authenticateAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['USER', 'OPERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir rol belirtin (USER, OPERATOR, ADMIN)'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ role, updatedat: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Update role error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Rol güncellenemedi'
      });
    }

    // Remove password from response
    const { passwordhash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Kullanıcı rolü başarıyla güncellendi',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Update user profile (admin/operator)
router.put('/users/:id', authenticateAdminOrOperator, async (req, res) => {
  try {
    const { name, email, username, bio, location } = req.body;
    const userId = req.params.id;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Ad ve email alanları zorunludur'
      });
    }

    // Check if user exists
    const { data: existingUser, error: getError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (getError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // If operator, only allow updating USER role users
    if (req.user.role === 'OPERATOR' && existingUser.role !== 'USER') {
      return res.status(403).json({
        success: false,
        message: 'Sadece normal kullanıcıları düzenleyebilirsiniz'
      });
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const { data: emailExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi zaten kullanılıyor'
        });
      }
    }

    // Update user
    const updateData = {
      name,
      email,
      username: username || email.split('@')[0],
      bio: bio || null,
      location: location || null,
      updatedat: new Date()
    };

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Kullanıcı güncellenemedi'
      });
    }

    // Remove password from response
    const { passwordhash: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Delete user (admin/operator)
router.delete('/users/:id', authenticateAdminOrOperator, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const { data: existingUser, error: getError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (getError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // If operator, only allow deleting USER role users
    if (req.user.role === 'OPERATOR' && existingUser.role !== 'USER') {
      return res.status(403).json({
        success: false,
        message: 'Sadece normal kullanıcıları silebilirsiniz'
      });
    }

    // Admin cannot delete themselves
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Kullanıcı silinemedi'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router; 