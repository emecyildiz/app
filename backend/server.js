const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
require('dotenv').config();

const app = express();

// Middleware
// Enable CORS for all routes
app.use((req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', 'https://app-eta-five-56.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request from:', req.headers.origin);
    return res.status(200).end();
  }

  // Log request details
  console.log('Request details:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });

  next();
});

// Additional CORS handling for specific routes
app.options('*', (req, res) => {
  console.log('Handling global OPTIONS request');
  res.header('Access-Control-Allow-Origin', 'https://app-eta-five-56.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.use(express.json());

// Supabase client with error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// JWT Secret from Supabase
const JWT_SECRET = 'zsDMe8f75FXWgBtWadkKmAmPx0vZio+MX6gFHGzY1YEWnehKuN2aH2WfYYNpDE/AENTMBoT6AyjGJZoGWEepdQ==';

// Health check
app.get('/health', (req, res) => {
  console.log('Health check request from:', req.get('origin'));
  res.json({
    status: 'OK',
    message: 'CinemaHub Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: req.get('origin'),
      method: req.method,
      headers: req.headers
    }
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
      register: '/api/auth/register'
    }
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  // Set CORS headers specifically for login
  res.header('Access-Control-Allow-Origin', 'https://app-eta-five-56.vercel.app');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Log login attempt
  console.log('Login attempt:', {
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

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password ve name gerekli'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        passwordhash: passwordHash,
        name,
        username: username || email.split('@')[0],
        role: 'USER',
        lastLoginAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Kullanıcı kaydı başarısız'
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

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token gerekli'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Remove password from response
    const { passwordhash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Çıkış başarılı'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route bulunamadı'
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 CinemaHub Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
