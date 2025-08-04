const express = require('express');
const router = express.Router();

// TODO: Import auth controller when created
// const authController = require('../controllers/authController');

// Temporary mock responses for development
router.post('/register', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User registered successfully (mock)',
    data: {
      user: {
        id: 'temp-user-id',
        email: req.body.email,
        name: req.body.name,
        role: 'user'
      },
      token: 'mock-jwt-token'
    }
  });
});

router.post('/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Login successful (mock)',
    data: {
      user: {
        id: 'temp-user-id',
        email: req.body.email,
        name: 'Mock User',
        role: 'user'
      },
      token: 'mock-jwt-token'
    }
  });
});

router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful (mock)'
  });
});

router.get('/me', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: 'temp-user-id',
        email: 'user@example.com',
        name: 'Mock User',
        role: 'user'
      }
    }
  });
});

module.exports = router; 