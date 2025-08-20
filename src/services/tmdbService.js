import axios from 'axios'

class TMDBService {
  constructor() {
    this.apiKey = import.meta.env.VITE_TMDB_API_KEY
    this.baseURL = 'https://api.themoviedb.org/3'
    this.imageBaseURL = 'https://image.tmdb.org/t/p'
    
    if (!this.apiKey) {
      console.error('TMDB API key is missing! Please add VITE_TMDB_API_KEY to your .env file')
    }
    
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      params: {
        api_key: this.apiKey,
        language: 'tr-TR'
      }
    })
  }

  // Film listesi al (popüler filmler)
  async getMovies(page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get('/movie/popular', {
        params: { page }
      })
      
      const movies = response.data.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path ? `${this.imageBaseURL}/w500${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `${this.imageBaseURL}/w1280${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        genre_ids: movie.genre_ids || []
      }))
      
      return {
        movies,
        totalPages: response.data.total_pages,
        currentPage: page,
        totalResults: response.data.total_results
      }
    } catch (error) {
      console.error('Error fetching movies from TMDB:', error)
      throw new Error('Filmler yüklenirken bir hata oluştu')
    }
  }

  // Film detayı al
  async getMovieById(id) {
    try {
      const response = await this.apiClient.get(`/movie/${id}`, {
        params: {
          append_to_response: 'credits,videos,images'
        }
      })
      
      const movie = response.data
      return {
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path ? `${this.imageBaseURL}/w500${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `${this.imageBaseURL}/w1280${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        runtime: movie.runtime,
        status: movie.status,
        genres: movie.genres || [],
        cast: movie.credits?.cast?.slice(0, 10) || [],
        crew: movie.credits?.crew?.slice(0, 10) || [],
        videos: movie.videos?.results || [],
        images: movie.images || {}
      }
    } catch (error) {
      console.error('Error fetching movie from TMDB:', error)
      throw new Error('Film detayları yüklenirken bir hata oluştu')
    }
  }

  // Kategorileri al
  async getGenres() {
    try {
      const response = await this.apiClient.get('/genre/movie/list')
      return response.data.genres || []
    } catch (error) {
      console.error('Error fetching genres from TMDB:', error)
      return []
    }
  }

  // Kategoriye göre filmler
  async getMoviesByGenre(genreId, page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get('/discover/movie', {
        params: {
          with_genres: genreId,
          page,
          sort_by: 'popularity.desc'
        }
      })
      
      const movies = response.data.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path ? `${this.imageBaseURL}/w500${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `${this.imageBaseURL}/w1280${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        genre_ids: movie.genre_ids || []
      }))
      
      return {
        movies,
        totalPages: response.data.total_pages,
        currentPage: page,
        totalResults: response.data.total_results
      }
    } catch (error) {
      console.error('Error fetching movies by genre from TMDB:', error)
      throw new Error('Kategori filmleri yüklenirken bir hata oluştu')
    }
  }

  // Film arama
  async searchMovies(query, page = 1, limit = 12) {
    try {
      const response = await this.apiClient.get('/search/movie', {
        params: {
          query,
          page
        }
      })
      
      const movies = response.data.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path ? `${this.imageBaseURL}/w500${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `${this.imageBaseURL}/w1280${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        genre_ids: movie.genre_ids || []
      }))
      
      return {
        movies,
        totalPages: response.data.total_pages,
        currentPage: page,
        totalResults: response.data.total_results
      }
    } catch (error) {
      console.error('Error searching movies from TMDB:', error)
      throw new Error('Arama yapılırken bir hata oluştu')
    }
  }

  // Trend filmler
  async getTrendingMovies() {
    try {
      const response = await this.apiClient.get('/trending/movie/week')
      
      return response.data.results.slice(0, 10).map(movie => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path ? `${this.imageBaseURL}/w500${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `${this.imageBaseURL}/w1280${movie.backdrop_path}` : null,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        popularity: movie.popularity,
        genre_ids: movie.genre_ids || []
      }))
    } catch (error) {
      console.error('Error fetching trending movies from TMDB:', error)
      return []
    }
  }
}

export const tmdbService = new TMDBService()
