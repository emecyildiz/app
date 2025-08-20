import axios from 'axios'

// Using backend API for TMDB data

class MovieService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://app-production-c295.up.railway.app'
    console.log('MovieService - baseURL:', this.baseURL)
    
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  getAuthHeaders() {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('auth-token') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async getMovies(page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get('/api/movies', {
        params: { page, limit },
      })
      return response.data.data
    } catch (error) {
      console.error('Error fetching movies:', error)
      throw new Error('Filmler yüklenirken bir hata oluştu')
    }
  }

  async getMovieById(id) {
    try {
      const response = await this.apiClient.get(`/api/movies/${id}`)
      return response.data.data.movie
    } catch (error) {
      console.error('Error fetching movie:', error)
      throw new Error('Film detayları yüklenirken bir hata oluştu')
    }
  }

  async getGenres() {
    try {
      const response = await this.apiClient.get('/api/movies/genres')
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching genres:', error)
      return []
    }
  }

  async getMoviesByGenre(genreId, page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get(`/api/movies/genre/${genreId}`, { params: { page, limit } })
      return response.data.data
    } catch (error) {
      console.error('Error fetching movies by genre:', error)
      throw new Error('Kategori filmleri yüklenirken bir hata oluştu')
    }
  }

  async getMoviesByActor(actor, page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get(`/api/movies/actor/${encodeURIComponent(actor)}`, { params: { page, limit } })
      return response.data.data
    } catch (error) {
      console.error('Error fetching movies by actor:', error)
      throw new Error('Aktör filmleri yüklenirken bir hata oluştu')
    }
  }

  async rateMovie(movieId, rating) {
    try {
      const response = await this.apiClient.post(`/api/movies/${movieId}/rate`, { rating }, {
        headers: this.getAuthHeaders(),
      })
      return response.data.data
    } catch (error) {
      console.error('Error rating movie:', error)
      throw error
    }
  }

  async removeRating(movieId) {
    try {
      const response = await this.apiClient.delete(`/api/movies/${movieId}/rate`, {
        headers: this.getAuthHeaders(),
      })
      return response.data.data
    } catch (error) {
      console.error('Error removing rating:', error)
      throw error
    }
  }

  async getMyRatings(page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get('/api/users/ratings', {
        params: { page, limit },
        headers: this.getAuthHeaders(),
      })
      return response.data.data
    } catch (error) {
      console.error('Error fetching my ratings:', error)
      throw error
    }
  }

  async searchMovies(query, page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get('/api/movies/search', {
        params: { q: query, page, limit },
      })
      return response.data.data
    } catch (error) {
      console.error('Error searching movies:', error)
      throw new Error('Arama yapılırken bir hata oluştu')
    }
  }

  async getTrendingMovies() {
    try {
      const response = await this.apiClient.get('/api/movies/trending')
      return response.data.data.movies || []
    } catch (error) {
      console.error('Error fetching trending movies:', error)
      return []
    }
  }

  async getAllActors() {
    try {
      const response = await this.apiClient.get('/api/movies/actors')
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching actors:', error)
      return []
    }
  }
}

export const movieService = new MovieService()