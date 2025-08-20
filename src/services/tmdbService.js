class TMDBService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://app-production-c295.up.railway.app'
    this.imageBaseURL = 'https://image.tmdb.org/t/p'
  }

  // API çağrısı için yardımcı fonksiyon
  async makeRequest(endpoint, params = {}) {
    try {
      const url = new URL(`${this.baseURL}${endpoint}`)
      
      // Ek parametreleri ekle
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Resim URL'i oluştur
  getImageURL(path, size = 'w500') {
    if (!path) return null
    return `${this.imageBaseURL}/${size}${path}`
  }

  // Popüler filmler
  async getPopularMovies(page = 1) {
    try {
      return await this.makeRequest('/api/movies/popular', { page })
    } catch (error) {
      console.error('Popular Movies API Error:', error)
      throw error
    }
  }

  // En yeni filmler
  async getLatestMovies(page = 1) {
    try {
      return await this.makeRequest('/api/movies/latest', { page })
    } catch (error) {
      console.error('Latest Movies API Error:', error)
      throw error
    }
  }

  // En çok oy alan filmler
  async getTopRatedMovies(page = 1) {
    try {
      return await this.makeRequest('/api/movies/top-rated', { page })
    } catch (error) {
      console.error('Top Rated Movies API Error:', error)
      throw error
    }
  }

  // Film detayı
  async getMovieDetails(movieId) {
    try {
      return await this.makeRequest(`/api/movies/${movieId}`)
    } catch (error) {
      console.error('Movie Details API Error:', error)
      throw error
    }
  }

  // Film arama
  async searchMovies(query, page = 1) {
    try {
      return await this.makeRequest(`/api/movies/search/${encodeURIComponent(query)}`, { page })
    } catch (error) {
      console.error('Search Movies API Error:', error)
      throw error
    }
  }

  // Kategoriler
  async getGenres() {
    try {
      return await this.makeRequest('/api/genres')
    } catch (error) {
      console.error('Genres API Error:', error)
      throw error
    }
  }

  // Kategoriye göre filmler
  async getMoviesByGenre(genreId, page = 1) {
    try {
      return await this.makeRequest(`/api/movies/genre/${genreId}`, { page })
    } catch (error) {
      console.error('Movies By Genre API Error:', error)
      throw error
    }
  }

  // Benzer filmler
  async getSimilarMovies(movieId, page = 1) {
    try {
      return await this.makeRequest(`/api/movies/${movieId}/similar`, { page })
    } catch (error) {
      console.error('Similar Movies API Error:', error)
      throw error
    }
  }
}

export const tmdbService = new TMDBService()
