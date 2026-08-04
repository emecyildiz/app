class TMDBService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || ''
    this.imageBaseURL = 'https://image.tmdb.org/t/p'
    this.timeoutMs = Number.parseInt(import.meta.env.VITE_HTTP_TIMEOUT_MS || '10000', 10)
  }

  async makeRequest(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin)
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'include' })
      if (!response.ok) throw new Error(`Movie API returned HTTP ${response.status}.`)
      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  }

  getImageURL(path, size = 'w500') {
    return path ? `${this.imageBaseURL}/${size}${path}` : null
  }

  getPopularMovies(page = 1) { return this.makeRequest('/api/movies/popular', { page }) }
  getLatestMovies(page = 1) { return this.makeRequest('/api/movies/latest', { page }) }
  getTopRatedMovies(page = 1) { return this.makeRequest('/api/movies/top-rated', { page }) }
  getMovieDetails(movieId) { return this.makeRequest(`/api/movies/${movieId}`) }
  searchMovies(query, page = 1) { return this.makeRequest(`/api/movies/search/${encodeURIComponent(query)}`, { page }) }
  getGenres() { return this.makeRequest('/api/genres') }
  getMoviesByGenre(genreId, page = 1) { return this.makeRequest(`/api/movies/genre/${genreId}`, { page }) }
  getSimilarMovies(movieId, page = 1) { return this.makeRequest(`/api/movies/${movieId}/similar`, { page }) }
}

export const tmdbService = new TMDBService()
