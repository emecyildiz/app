import axios from 'axios'
import { mockMovies, mockGenres } from '../utils/mockData'

// For development, we'll use mock data
// In production, replace with actual API endpoints
const USE_MOCK_DATA = true // Temporarily use mock data due to API issues

class MovieService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://zonal-essence-production.up.railway.app'
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async getMovies(page = 1, limit = 12) {
    if (USE_MOCK_DATA) {
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedMovies = mockMovies.slice(start, end)
      
      return {
        movies: paginatedMovies,
        totalPages: Math.ceil(mockMovies.length / limit),
        currentPage: page,
      }
    }

    try {
      const response = await this.apiClient.get('/api/movies', {
        params: { page, limit },
      })
      return response.data.data // Backend response formatı
    } catch (error) {
      console.error('Error fetching movies:', error)
      // Fallback olarak mock data döndür
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedMovies = mockMovies.slice(start, end)
      
      return {
        movies: paginatedMovies,
        totalPages: Math.ceil(mockMovies.length / limit),
        currentPage: page,
      }
    }
  }

  async getMovieById(id) {
    if (USE_MOCK_DATA) {
      const movie = mockMovies.find((m) => m.id === parseInt(id))
      if (!movie) throw new Error('Film bulunamadı')
      return movie
    }

    try {
      const response = await this.apiClient.get(`/api/movies/${id}`)
      return response.data.data.movie // Backend response formatı
    } catch (error) {
      console.error('Error fetching movie:', error)
      throw new Error('Film detayları yüklenirken bir hata oluştu')
    }
  }

  async getGenres() {
    if (USE_MOCK_DATA) {
      return mockGenres
    }

    try {
      const response = await this.apiClient.get('/api/genres')
      return response.data.data || mockGenres // Fallback to mock data
    } catch (error) {
      console.error('Error fetching genres:', error)
      return mockGenres // Fallback to mock data
    }
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

    try {
      const response = await this.apiClient.get('/api/movies/search', {
        params: { q: query, page, limit },
      })
      return response.data.data // Backend response formatı
    } catch (error) {
      console.error('Error searching movies:', error)
      throw new Error('Arama yapılırken bir hata oluştu')
    }
  }

  async getTrendingMovies() {
    if (USE_MOCK_DATA) {
      return mockMovies
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)
    }

    try {
      const response = await this.apiClient.get('/api/movies/trending')
      return response.data.data.movies || [] // Backend response formatı
    } catch (error) {
      console.error('Error fetching trending movies:', error)
      return mockMovies.slice(0, 10) // Fallback
    }
  }

  async getAllActors() {
    if (USE_MOCK_DATA) {
      // Mock verilerden aktörleri çıkar
      const allActors = new Set()
      mockMovies.forEach(movie => {
        if (movie.cast && Array.isArray(movie.cast)) {
          movie.cast.forEach(actor => allActors.add(actor))
        }
      })
      return Array.from(allActors).sort()
    }

    try {
      const response = await this.apiClient.get('/api/actors')
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching actors:', error)
      // Fallback - mock verilerden aktörleri çıkar
      const allActors = new Set()
      mockMovies.forEach(movie => {
        if (movie.cast && Array.isArray(movie.cast)) {
          movie.cast.forEach(actor => allActors.add(actor))
        }
      })
      return Array.from(allActors).sort()
    }
  }
}

export const movieService = new MovieService()