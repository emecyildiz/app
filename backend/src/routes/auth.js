const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Test endpoint for password hashing (REMOVE AFTER TESTING)
router.post('/test-hash', async (req, res) => {
  try {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    res.json({ password, hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
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

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        passwordHash,
        name,
        username: username || email.split('@')[0],
        role: 'USER'
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
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

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

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve password alanları zorunludur'
      });
    }

    console.log('Login attempt for email:', email);

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash ? user.passwordHash.length : 0
    });

    // Check if passwordHash exists
    if (!user.passwordHash) {
      console.error('Password hash is missing for user:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hesabınız devre dışı bırakılmış'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    console.log('Login successful for user:', user.email);

    res.status(200).json({
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

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token gerekli'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
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
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Çıkış başarılı'
  });
});

module.exports = router; 