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

app.get('/api/movies/trending', (req, res) => {
  res.json({
    success: true,
    data: {
      movies: [
        { id: 1, title: 'Inception', averageRating: 8.8 },
        { id: 2, title: 'The Shawshank Redemption', averageRating: 9.3 }
      ]
    }
  });
});

app.get('/api/movies', (req, res) => {
  res.json({
    success: true,
    data: {
      movies: [
        {
          id: 1,
          title: 'Inception',
          description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
          releaseYear: 2010,
          duration: 148,
          posterUrl: 'https://example.com/inception.jpg',
          genres: ['Sci-Fi', 'Action', 'Thriller'],
          cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page'],
          director: 'Christopher Nolan',
          averageRating: 8.8,
          totalRatings: 2500000
        },
        {
          id: 2,
          title: 'The Shawshank Redemption',
          description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
          releaseYear: 1994,
          duration: 142,
          posterUrl: 'https://example.com/shawshank.jpg',
          genres: ['Drama'],
          cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'],
          director: 'Frank Darabont',
          averageRating: 9.3,
          totalRatings: 2800000
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 6
      }
    }
  });
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