const express = require('express');
const router = express.Router();

// TODO: Import admin controller when created
// const adminController = require('../controllers/adminController');

// Temporary mock responses for development
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers: 1250,
        totalMovies: 450,
        totalRatings: 8500,
        activeUsers: 890
      },
      recentActivity: [
        {
          id: 1,
          type: 'user_registration',
          message: 'New user registered: john.doe@example.com',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'movie_rating',
          message: 'New rating for Inception: 9/10',
          timestamp: new Date().toISOString()
        }
      ]
    }
  });
});

router.get('/users', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      users: [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'John Doe',
          username: 'johndoe',
          role: 'user',
          memberSince: '2023-01-01T00:00:00.000Z',
          isActive: true
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'Jane Smith',
          username: 'janesmith',
          role: 'user',
          memberSince: '2023-02-01T00:00:00.000Z',
          isActive: true
        },
        {
          id: 'operator-1',
          email: 'operator@example.com',
          name: 'Ahmet Yılmaz',
          username: 'ahmetyilmaz',
          role: 'operator',
          memberSince: '2023-06-01T00:00:00.000Z',
          isActive: true
        }
      ]
    }
  });
});

router.get('/movies', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      movies: [
        {
          id: 1,
          title: 'Inception',
          releaseYear: 2010,
          averageRating: 8.8,
          totalRatings: 2500000,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 2,
          title: 'The Shawshank Redemption',
          releaseYear: 1994,
          averageRating: 9.3,
          totalRatings: 2800000,
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ]
    }
  });
});

router.post('/users/:id/role', (req, res) => {
  const { role } = req.body;
  
  res.status(200).json({
    success: true,
    message: `User role updated to ${role} successfully (mock)`,
    data: {
      userId: req.params.id,
      newRole: role
    }
  });
});

module.exports = router; 