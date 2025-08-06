const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { trackUserActivity } = require('../middleware/activityTracker');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token gerekli'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
};

// Get user profile
router.get('/profile', authenticateToken, trackUserActivity, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, trackUserActivity, async (req, res) => {
  try {
    const { name, username, bio, location, socialLinks } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name,
        username,
        bio,
        location,
        socialLinks,
        updatedAt: new Date()
      })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Profil güncellenemedi'
      });
    }

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Track user activity (for frontend to ping)
router.post('/activity', authenticateToken, trackUserActivity, async (req, res) => {
  console.log('POST /api/users/activity: Activity tracking endpoint called');
  res.status(200).json({
    success: true,
    message: 'Activity tracked'
  });
});

// Update user avatar
router.put('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL gerekli'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        avatarUrl,
        updatedAt: new Date()
      })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) {
      console.error('Update avatar error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Avatar güncellenemedi'
      });
    }

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Avatar başarıyla güncellendi',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get user by ID (for admin/operator use)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin or operator role
    if (req.user.role !== 'ADMIN' && req.user.role !== 'OPERATOR') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Update user by ID (for admin/operator use)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin or operator role
    if (req.user.role !== 'ADMIN' && req.user.role !== 'OPERATOR') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    const { name, username, bio, location, socialLinks, role, isActive } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name,
        username,
        bio,
        location,
        socialLinks,
        role,
        isActive,
        updatedAt: new Date()
      })
      .eq('id', req.params.id)
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
    const { passwordHash: _, ...userWithoutPassword } = user;

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

// Delete user by ID (for admin/operator use)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin or operator role
    if (req.user.role !== 'ADMIN' && req.user.role !== 'OPERATOR') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

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