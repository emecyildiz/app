class TMDBService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    this.imageBaseURL = 'https://image.tmdb.org/t/p'
    this.timeoutMs = parseInt(import.meta.env.VITE_HTTP_TIMEOUT_MS || '10000', 10)
    this.tmdbDirectEnabled = (import.meta.env.VITE_TMDB_DIRECT_FALLBACK || 'true') === 'true'
    this.tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY
    this.tmdbBaseURL = import.meta.env.VITE_TMDB_API_BASE_URL || 'https://api.themoviedb.org/3'
    this.tmdbLanguage = import.meta.env.VITE_TMDB_LANGUAGE || 'tr-TR'
  }

  // Base fetch with timeout to prevent long hangs on cold starts
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      return response
    } finally {
      clearTimeout(id)
    }
  }

  // Try backend first; on timeout/network failure optionally fall back to direct TMDB
  async makeRequest(endpoint, params = {}) {
    const backendUrl = new URL(`${this.baseURL}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      backendUrl.searchParams.append(key, value)
    })

    try {
      const res = await this.fetchWithTimeout(backendUrl.toString())
      if (!res.ok) throw new Error(`API Error: ${res.status}`)
      return await res.json()
    } catch (err) {
      const isAbort = err?.name === 'AbortError'
      const canFallback = this.tmdbDirectEnabled && this.tmdbApiKey
      if (canFallback) {
        try {
          return await this.makeDirectTmdbRequest(endpoint, params)
        } catch (fallbackErr) {
          // If fallback also fails, rethrow original if it was timeout; otherwise throw fallback error for better signal
          if (isAbort) throw err
          throw fallbackErr
        }
      }
      throw err
    }
  }

  // Map our backend endpoints to direct TMDB endpoints
  async makeDirectTmdbRequest(endpoint, params = {}) {
    const { page } = params || {}
    const url = this.buildDirectTmdbUrl(endpoint, params)
    if (!url) throw new Error('Unsupported TMDB endpoint for direct fallback')
    const res = await this.fetchWithTimeout(url)
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`)
    return await res.json()
  }

  buildDirectTmdbUrl(endpoint, params = {}) {
    const url = new URL(this.tmdbBaseURL)
    const language = this.tmdbLanguage
    const page = params.page || 1
    // Helpers
    const setSearch = (obj) => {
      url.searchParams.set('api_key', this.tmdbApiKey)
      if (language) url.searchParams.set('language', language)
      Object.entries(obj || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
      })
      return url.toString()
    }

    // Static endpoints
    if (endpoint === '/api/movies/popular') {
      url.pathname += '/movie/popular'
      return setSearch({ page })
    }
    if (endpoint === '/api/movies/latest') {
      url.pathname += '/movie/now_playing'
      return setSearch({ page })
    }
    if (endpoint === '/api/movies/top-rated') {
      url.pathname += '/movie/top_rated'
      return setSearch({ page })
    }
    if (endpoint === '/api/genres') {
      url.pathname += '/genre/movie/list'
      return setSearch({})
    }

    // Pattern endpoints
    const genreMatch = endpoint.match(/^\/api\/movies\/genre\/(\d+)/)
    if (genreMatch) {
      const genreId = genreMatch[1]
      url.pathname += '/discover/movie'
      return setSearch({ with_genres: genreId, page })
    }

    const similarMatch = endpoint.match(/^\/api\/movies\/(\d+)\/similar$/)
    if (similarMatch) {
      const movieId = similarMatch[1]
      url.pathname += `/movie/${movieId}/similar`
      return setSearch({ page })
    }

    const detailMatch = endpoint.match(/^\/api\/movies\/(\d+)$/)
    if (detailMatch) {
      const movieId = detailMatch[1]
      url.pathname += `/movie/${movieId}`
      return setSearch({ append_to_response: 'credits,videos,images' })
    }

    const searchMatch = endpoint.match(/^\/api\/movies\/search\/(.+)$/)
    if (searchMatch) {
      const rawQuery = decodeURIComponent(searchMatch[1])
      url.pathname += '/search/movie'
      return setSearch({ query: rawQuery, page })
    }

    return null
  }

  // Resim URL'i oluştur
  getImageURL(path, size = 'w500') {
    if (!path) return null
    return `${this.imageBaseURL}/${size}${path}`
  }

  // Popüler filmler
  async getPopularMovies(page = 1) {
    return await this.makeRequest('/api/movies/popular', { page })
  }

  // En yeni filmler
  async getLatestMovies(page = 1) {
    return await this.makeRequest('/api/movies/latest', { page })
  }

  // En çok oy alan filmler
  async getTopRatedMovies(page = 1) {
    return await this.makeRequest('/api/movies/top-rated', { page })
  }

  // Film detayı
  async getMovieDetails(movieId) {
    return await this.makeRequest(`/api/movies/${movieId}`)
  }

  // Film arama
  async searchMovies(query, page = 1) {
    return await this.makeRequest(`/api/movies/search/${encodeURIComponent(query)}`, { page })
  }

  // Kategoriler
  async getGenres() {
    return await this.makeRequest('/api/genres')
  }

  // Kategoriye göre filmler
  async getMoviesByGenre(genreId, page = 1) {
    return await this.makeRequest(`/api/movies/genre/${genreId}`, { page })
  }

  // Benzer filmler
  async getSimilarMovies(movieId, page = 1) {
    return await this.makeRequest(`/api/movies/${movieId}/similar`, { page })
  }
}

export const tmdbService = new TMDBService()
