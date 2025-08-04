const express = require('express');
const router = express.Router();

// TODO: Import user controller when created
// const userController = require('../controllers/userController');

// Temporary mock responses for development
router.get('/', (req, res) => {
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
          memberSince: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'Jane Smith',
          username: 'janesmith',
          role: 'user',
          memberSince: '2023-02-01T00:00:00.000Z'
        }
      ]
    }
  });
});

router.get('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.params.id,
        email: 'user@example.com',
        name: 'Mock User',
        username: 'mockuser',
        role: 'user',
        bio: 'This is a mock user',
        location: 'Istanbul, Turkey',
        memberSince: '2023-01-01T00:00:00.000Z'
      }
    }
  });
});

router.put('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User updated successfully (mock)',
    data: {
      user: {
        id: req.params.id,
        ...req.body
      }
    }
  });
});

router.delete('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User deleted successfully (mock)'
  });
});

module.exports = router; 