const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
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
          description: 'A thief who steals corporate secrets...',
          releaseYear: 2010,
          duration: 148,
          posterUrl: 'https://example.com/inception.jpg',
          genres: ['Sci-Fi', 'Action', 'Thriller'],
          cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page'],
          director: 'Christopher Nolan',
          averageRating: 8.8,
          totalRatings: 2500000
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
}); 