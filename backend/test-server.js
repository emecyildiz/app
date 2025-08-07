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

// Mock auth endpoints - Database'den gerçek kullanıcı verilerini kullan
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Database'den kullanıcı kontrolü yapılmalı
  // Bu endpoint artık gerçek auth sistemi kullanıyor
  res.status(400).json({
    success: false,
    message: 'Test server: Lütfen gerçek backend server\'ı kullanın'
  });
});

app.post('/api/auth/register', (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Test server: Lütfen gerçek backend server\'ı kullanın'
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Çıkış başarılı'
  });
});

app.get('/api/auth/me', (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Test server: Lütfen gerçek backend server\'ı kullanın'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`⚠️  Bu test server sadece health check için kullanılmalı`);
  console.log(`🔐 Gerçek authentication için ana backend server'ı kullanın`);
}); 