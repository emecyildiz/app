import axios from 'axios'
import { mockMovies, mockGenres } from '../utils/mockData'

// For development, we'll use mock data
// In production, replace with actual API endpoints
const USE_MOCK_DATA = true

class MovieService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://api.example.com'
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async getMovies(page = 1, limit = 12) {
    if (USE_MOCK_DATA) {
      // Simulate pagination with mock data
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedMovies = mockMovies.slice(start, end)
      
      return {
        movies: paginatedMovies,
        totalPages: Math.ceil(mockMovies.length / limit),
        currentPage: page,
      }
    }

    const response = await this.apiClient.get('/movies', {
      params: { page, limit },
    })
    return response.data
  }

  async getMovieById(id) {
    if (USE_MOCK_DATA) {
      const movie = mockMovies.find((m) => m.id === parseInt(id))
      if (!movie) throw new Error('Film bulunamadı')
      return movie
    }

    const response = await this.apiClient.get(`/movies/${id}`)
    return response.data
  }

  async getGenres() {
    if (USE_MOCK_DATA) {
      return mockGenres
    }

    const response = await this.apiClient.get('/genres')
    return response.data
  }

  async getMoviesByGenre(genreId, page = 1, limit = 12) {
    if (USE_MOCK_DATA) {
      const filteredMovies = mockMovies.filter((movie) =>
        movie.genres.some((g) => g.id === parseInt(genreId))
      )
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedMovies = filteredMovies.slice(start, end)
      
      return {
        movies: paginatedMovies,
        totalPages: Math.ceil(filteredMovies.length / limit),
        currentPage: page,
      }
    }

    const response = await this.apiClient.get('/movies', {
      params: { genre: genreId, page, limit },
    })
    return response.data
  }

  async searchMovies(query, page = 1, limit = 12) {
    if (USE_MOCK_DATA) {
      const searchResults = mockMovies.filter((movie) =>
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.description.toLowerCase().includes(query.toLowerCase())
      )
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedMovies = searchResults.slice(start, end)
      
      return {
        movies: paginatedMovies,
        totalPages: Math.ceil(searchResults.length / limit),
        currentPage: page,
      }
    }

    const response = await this.apiClient.get('/movies/search', {
      params: { q: query, page, limit },
    })
    return response.data
  }

  async rateMovie(movieId, rating) {
    if (USE_MOCK_DATA) {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true, rating }
    }

    const response = await this.apiClient.post(`/movies/${movieId}/rate`, {
      rating,
    })
    return response.data
  }

  async getTrendingMovies() {
    if (USE_MOCK_DATA) {
      // Return top 10 movies sorted by rating
      return mockMovies
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)
    }

    const response = await this.apiClient.get('/movies/trending')
    return response.data
  }

  async getRecommendedMovies(userId) {
    if (USE_MOCK_DATA) {
      // Return random 6 movies as recommendations
      const shuffled = [...mockMovies].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, 6)
    }

    const response = await this.apiClient.get(`/users/${userId}/recommendations`)
    return response.data
  }
}

export const movieService = new MovieService()