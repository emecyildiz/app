// Required imports
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigin = 'https://app-eta-five-56.vercel.app';
  
  // Always log the request
  console.log(`${req.method} ${req.path} from ${req.headers.origin}`);

  // Set basic CORS headers
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://iqmocrrunczqgjnnukcd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'zsDMe8f75FXWgBtWadkKmAmPx0vZio+MX6gFHGzY1YEWnehKuN2aH2WfYYNpDE/AENTMBoT6AyjGJZoGWEepdQ==';

// Auth middleware
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
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CinemaHub Backend API',
    endpoints: {
      health: '/health',
      stats: '/api/users/stats',
      login: '/api/auth/login'
    }
  });
});

// User stats endpoint
app.get('/api/users/stats', async (req, res) => {
  try {
    // Get user count
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('role', { count: 'exact' })
      .eq('role', 'user');

    // Get operator count
    const { data: operators, error: operatorError } = await supabase
      .from('users')
      .select('role', { count: 'exact' })
      .eq('role', 'operator');

    if (userError || operatorError) {
      console.error('Database error:', userError || operatorError);
      throw new Error('Database query failed');
    }

    res.json({
      success: true,
      data: {
        userCount: users?.length || 0,
        operatorCount: operators?.length || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken bir hata oluştu'
    });
  }
});

// Activity tracking endpoint
app.post('/api/users/activity', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const timestamp = new Date().toISOString();

    const { error } = await supabase
      .from('user_activity')
      .insert([
        { user_id: userId, timestamp, type: 'PAGE_VIEW' }
      ]);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Activity tracking error:', error);
    res.status(500).json({ success: false, message: 'Activity tracking failed' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Get all operators (admin only)
app.get('/api/admin/operators', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: operators, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'operator')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(operators || []);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ message: 'Failed to get operators' });
  }
});

// Get dashboard stats (admin only)
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get user stats
    const { data: users } = await supabase
      .from('users')
      .select('role', { count: 'exact' });

    // Get active users in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: activeUsers } = await supabase
      .from('user_activity')
      .select('user_id')
      .gt('timestamp', fifteenMinutesAgo)
      .order('timestamp', { ascending: false });

    const stats = {
      totalUsers: users?.filter(u => u.role === 'USER').length || 0,
      totalOperators: users?.filter(u => u.role === 'OPERATOR').length || 0,
      activeUsers: new Set(activeUsers?.map(a => a.user_id)).size || 0,
      realTimeActiveUsers: new Set(activeUsers?.map(a => a.user_id)).size || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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

    if (error || !user) {
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
      { expiresIn: '7d' }
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

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS allowed origin: https://app-eta-five-56.vercel.app`);
});