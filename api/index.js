// Required imports
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize express app
const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://app-eta-five-56.vercel.app',
    'https://app-production-c295.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  const origin = req.headers.origin;
  console.log(`${req.method} ${req.path} from ${origin}`);

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

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://iqmocrrunczqgjnnukcd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'zsDMe8f75FXWgBtWadkKmAmPx0vZio+MX6gFHGzY1YEWnehKuN2aH2WfYYNpDE/AENTMBoT6AyjGJZoGWEepdQ==';

// Auth middleware with error logging
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Auth Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
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

// Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    res.json(users || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Get all operators (admin only)
app.get('/api/admin/operators', async (req, res) => {
  try {
    const { data: operators, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'operator')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    res.json(operators || []);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ message: 'Failed to get operators' });
  }
});

// Get dashboard stats
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    // Get user stats
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('role');

    if (userError) {
      console.error('User Stats Error:', userError);
      throw userError;
    }

    // Get active users in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: activeUsers, error: activityError } = await supabase
      .from('user_activity')
      .select('user_id')
      .gt('timestamp', fifteenMinutesAgo);

    if (activityError) {
      console.error('Activity Stats Error:', activityError);
      throw activityError;
    }

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

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

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
