const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
// CORS middleware with specific configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://app-eta-five-56.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      body: "OK"
    });
  }
  
  next();
});

app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://iqmocrrunczqgjnnukcd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbW9jcnJ1bmN6cWdqbm51a2NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4OTYzOCwiZXhwIjoyMDY5OTY1NjM4fQ.BJLjF8FuWmV-GHQVfZFb6zEjoMerTG27e_CW8jH11y8';
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || '595b4445839106846cff73051315ee96667ca199a208a4e0c8daa4126cba200dd383650bdbd21880d78f3d199a66cdb0b9ccbe5f818734983550e17670d1a65a';

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
  console.log('Login request received:', {
    headers: req.headers,
    body: req.body,
    origin: req.get('origin')
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
