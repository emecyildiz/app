const express = require('express');
const { trackActivityFromToken } = require('../middleware/activityTracker');
const router = express.Router();

// TODO: Import movie controller when created
// const movieController = require('../controllers/movieController');

// Temporary mock responses for development
router.get('/', trackActivityFromToken, (req, res) => {
  const { page = 1, limit = 12, genre, search } = req.query;
  
  res.status(200).json({
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
        currentPage: parseInt(page),
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

router.get('/:id', trackActivityFromToken, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      movie: {
        id: parseInt(req.params.id),
        title: 'Inception',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        releaseYear: 2010,
        duration: 148,
        posterUrl: 'https://example.com/inception.jpg',
        trailerUrl: 'https://example.com/inception-trailer.mp4',
        genres: ['Sci-Fi', 'Action', 'Thriller'],
        cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page'],
        director: 'Christopher Nolan',
        averageRating: 8.8,
        totalRatings: 2500000,
        userRating: null
      }
    }
  });
});

router.post('/:id/rate', trackActivityFromToken, (req, res) => {
  const { rating, review } = req.body;
  
  res.status(200).json({
    success: true,
    message: 'Rating submitted successfully (mock)',
    data: {
      rating: parseInt(rating),
      review: review || null
    }
  });
});

router.get('/search', trackActivityFromToken, (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;
  
  res.status(200).json({
    success: true,
    data: {
      movies: [
        {
          id: 1,
          title: 'Inception',
          description: 'A thief who steals corporate secrets...',
          releaseYear: 2010,
          averageRating: 8.8
        }
      ],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

router.get('/trending', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      movies: [
        {
          id: 1,
          title: 'Inception',
          averageRating: 8.8
        },
        {
          id: 2,
          title: 'The Shawshank Redemption',
          averageRating: 9.3
        }
      ]
    }
  });
});

module.exports = router; 