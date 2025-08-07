const express = require('express');
// CORS will be handled manually
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
require('dotenv').config();

const app = express();

// Simple CORS middleware
app.use((req, res, next) => {
  const allowedOrigin = 'https://app-eta-five-56.vercel.app';
  
  // Always log the request
  console.log(`${req.method} ${req.path} from ${req.headers.origin}`);

  // Set basic CORS headers
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(204).end();
    return;
  }

  next();
});

app.use(express.json());

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.iqmocrrunczqgjnnukcd:porche911BEL@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !DATABASE_URL) {
  console.error('Required credentials are missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// JWT Secret from Supabase
const JWT_SECRET = 'zsDMe8f75FXWgBtWadkKmAmPx0vZio+MX6gFHGzY1YEWnehKuN2aH2WfYYNpDE/AENTMBoT6AyjGJZoGWEepdQ==';

// User Stats Endpoint
app.get('/api/users/stats', async (req, res) => {
  try {
    // Kullanıcı sayısı
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('role', { count: 'exact' })
      .eq('role', 'user');

    // Operatör sayısı
    const { data: operators, error: operatorError } = await supabase
      .from('users')
      .select('role', { count: 'exact' })
      .eq('role', 'operator');

    if (userError || operatorError) {
      throw new Error(userError || operatorError);
    }

    res.json({
      success: true,
      data: {
        userCount: users.length,
        operatorCount: operators.length
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

// Health check
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
      login: '/api/auth/login',
      register: '/api/auth/register',
      stats: '/api/users/stats'
    }
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Processing login:', {
    body: req.body,
    origin: req.headers.origin
  });
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});