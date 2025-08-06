const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration - Allow all origins for development
app.use(cors({
  origin: true,  // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock login validation
  if (email === 'admin@cinemahub.com' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@cinemahub.com',
          role: 'ADMIN'
        },
        token: 'mock-jwt-token'
      }
    });
  } else if (email === 'operator@cinemahub.com' && password === 'operator123') {
    res.json({
      success: true,
      data: {
        user: {
          id: 2,
          name: 'Operator User',
          email: 'operator@cinemahub.com',
          role: 'OPERATOR'
        },
        token: 'mock-jwt-token'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Geçersiz email veya şifre'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 3,
        name: 'New User',
        email: req.body.email,
        role: 'USER'
      },
      token: 'mock-jwt-token'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Çıkış başarılı'
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@cinemahub.com',
        role: 'ADMIN'
      }
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}); 