// Required imports
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
// In proxy environments (Vercel/Railway), trust proxy to allow rate limiter to read client IP
app.set('trust proxy', 1);
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://app-eta-five-56.vercel.app',
    'https://app-production-c295.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  const origin = req.headers.origin;
  console.log(`${req.method} ${req.path} from ${origin || 'unknown origin'}`);

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Supabase configuration (require env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT configuration (require env) - prefer SUPABASE_JWT_SECRET, fallback to JWT_SECRET
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
if (!JWT_SECRET) {
  console.error('JWT secret missing. Please set SUPABASE_JWT_SECRET (preferred) or JWT_SECRET');
}

// Auth middleware with error logging
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error?.message || '');
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware with error logging
const adminMiddleware = (req, res, next) => {
  console.log('User Role:', req.user?.role);
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabase: supabaseUrl ? 'Configured' : 'Missing'
  });
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }

    // Check if user exists
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Register - existing check error:', existingError);
      return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }

    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu e-posta zaten kayıtlı' });
    }

    const passwordhash = await bcrypt.hash(password, 10);

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, username, email, passwordhash, role: 'USER' }])
      .select('*')
      .single();

    if (insertError) {
      console.error('Register - insert error:', insertError);
      return res.status(500).json({ success: false, message: 'Kayıt başarısız' });
    }

    const token = jwt.sign(
      { userId: insertedUser.id, email: insertedUser.email, role: insertedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { passwordhash: _ph, ...userWithoutPassword } = insertedUser;

    return res.json({
      success: true,
      message: 'Kayıt başarılı',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Auth: Logout (stateless)
app.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Çıkış başarılı' });
});

// Auth: Me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yetkisiz' });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Me error:', error);
      return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
    const { passwordhash: _ph, ...userWithoutPassword } = user || {};
    return res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Get all users requested');
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Supabase Error:', error);
      return res.json([]);
    }

    // Remove sensitive fields
    const safeUsers = (users || []).map(({ passwordhash, ...u }) => u);
    console.log('Users found:', safeUsers?.length || 0);
    res.json(safeUsers || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.json([]);
  }
});

// Get all operators (admin only)
app.get('/api/admin/operators', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Get all operators requested');
    const { data: operators, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'OPERATOR');

    if (error) {
      console.error('Supabase Error:', error);
      return res.json([]);
    }

    const safeOperators = (operators || []).map(({ passwordhash, ...u }) => u);
    console.log('Operators found:', safeOperators?.length || 0);
    res.json(safeOperators || []);
  } catch (error) {
    console.error('Get operators error:', error);
    res.json([]);
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    const { passwordhash, ...safe } = data || {};
    res.json({ success: true, data: safe });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Get dashboard stats
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Dashboard stats requested');
    
    // Get user stats
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('role');

    if (userError) {
      console.error('User Stats Error:', userError);
      // Don't throw error, just return empty stats
      return res.json({
        totalUsers: 0,
        totalOperators: 0,
        activeUsers: 0,
        realTimeActiveUsers: 0
      });
    }

    console.log('Users data:', users);

    // Try to get active users, but don't fail if table doesn't exist
    let activeUsers = [];
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity')
        .select('user_id')
        .gt('timestamp', fifteenMinutesAgo);

      if (!activityError) {
        activeUsers = activityData || [];
      }
    } catch (activityError) {
      console.log('Activity table not available, using empty data');
    }

    const stats = {
      totalUsers: users?.filter(u => u.role === 'USER').length || 0,
      totalOperators: users?.filter(u => u.role === 'OPERATOR').length || 0,
      activeUsers: new Set(activeUsers?.map(a => a.user_id)).size || 0,
      realTimeActiveUsers: new Set(activeUsers?.map(a => a.user_id)).size || 0
    };

    console.log('Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    // Return empty stats instead of 500 error
    res.json({
      totalUsers: 0,
      totalOperators: 0,
      activeUsers: 0,
      realTimeActiveUsers: 0
    });
  }
});

// Activity tracking endpoint
app.post('/api/users/activity', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log('Activity Tracking:', { timestamp });

    // For now, just return success
    res.json({ success: true });
  } catch (error) {
    console.error('Activity tracking error:', error);
    res.status(500).json({ success: false, message: 'Activity tracking failed' });
  }
});

// User: Update profile
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yetkisiz' });
    }

    const allowedFields = ['name', 'email', 'username', 'bio', 'location', 'socialLinks'];
    const updatePayload = {};
    for (const key of allowedFields) {
      if (key in req.body) updatePayload[key] = req.body[key];
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, message: 'Güncellenecek alan yok' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ success: false, message: 'Profil güncellenemedi' });
    }

    const { passwordhash: _ph, ...userWithoutPassword } = updated || {};
    return res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Update profile endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// User: Update avatar
app.put('/api/users/avatar', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user || {};
    const avatar = (req.body && (req.body.avatar || req.body.avatarUrl)) || null;
    if (!userId || !avatar) {
      return res.status(400).json({ success: false, message: 'Geçersiz istek' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({ avatar })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Update avatar error:', error);
      return res.status(500).json({ success: false, message: 'Profil fotoğrafı güncellenemedi' });
    }

    const { passwordhash: _ph, ...userWithoutPassword } = updated || {};
    return res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Update avatar endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve password gerekli'
      });
    }

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordhash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { passwordhash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Admin: Add operator
app.post('/api/admin/operators', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { email, password, name, username } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Add operator - existing check error:', existingError);
      return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu e-posta zaten kayıtlı' });
    }

    const passwordhash = await bcrypt.hash(password, 10);
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ name, username, email, passwordhash, role: 'OPERATOR' }]);

    if (insertError) {
      console.error('Add operator - insert error:', insertError);
      return res.status(500).json({ success: false, message: 'Operatör eklenemedi' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Add operator error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Admin: Remove operator -> downgrade to USER
app.delete('/api/admin/operators/:operatorId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { error } = await supabase
      .from('users')
      .update({ role: 'USER' })
      .eq('id', operatorId);

    if (error) {
      console.error('Remove operator error:', error);
      return res.status(500).json({ success: false, message: 'Operatör kaldırılamadı' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Remove operator endpoint error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Export the Express app for Vercel
export default app;

// For Railway deployment
if (process.env.NODE_ENV !== 'production' || process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  });
}
