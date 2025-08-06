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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
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

// Search users endpoint
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Arama terimi en az 2 karakter olmalıdır'
      })
    }

    const searchTerm = q.trim().toLowerCase()
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('createdat', { ascending: false })

    if (error) {
      console.error('Search users error:', error)
      return res.status(500).json({
        success: false,
        message: 'Kullanıcı arama sırasında hata oluştu'
      })
    }

    res.status(200).json({
      success: true,
      data: users || []
    })
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({
      success: false,
      message: 'Kullanıcı arama sırasında hata oluştu'
    })
  }
})

// Get user profile with stats
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    
    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      })
    }

    // Get user stats (mock data for now)
    const stats = {
      favoriteMovies: Math.floor(Math.random() * 20) + 1,
      reviews: Math.floor(Math.random() * 15) + 1,
      ratings: Math.floor(Math.random() * 30) + 1,
      memberSince: user.createdat
    }

    // Get user favorites (mock data for now)
    const favorites = [
      { id: 1, title: 'Inception', poster: 'https://example.com/poster1.jpg', rating: 5 },
      { id: 2, title: 'The Dark Knight', poster: 'https://example.com/poster2.jpg', rating: 4 },
      { id: 3, title: 'Interstellar', poster: 'https://example.com/poster3.jpg', rating: 5 },
      { id: 4, title: 'Pulp Fiction', poster: 'https://example.com/poster4.jpg', rating: 4 },
      { id: 5, title: 'Fight Club', poster: 'https://example.com/poster5.jpg', rating: 5 },
      { id: 6, title: 'The Matrix', poster: 'https://example.com/poster6.jpg', rating: 4 }
    ]

    res.status(200).json({
      success: true,
      data: {
        user,
        stats,
        favorites
      }
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Kullanıcı profili alınırken hata oluştu'
    })
  }
})

module.exports = router 