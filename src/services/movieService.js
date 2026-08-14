import { apiRequest } from './apiClient'

function compactMovie(movie, movieId) {
  const id = Number(movieId ?? movie?.id ?? movie?.movie_id ?? movie?.tmdb_id)

  return {
    id,
    title: String(movie?.title || movie?.original_title || `Movie #${id}`).trim().slice(0, 300),
    posterPath: typeof movie?.poster_path === 'string'
      ? movie.poster_path.trim().slice(0, 500)
      : null,
  }
}

class MovieService {
  async ensureMovieRow(movie) {
    if (!movie?.id) return null
    return apiRequest('/api/movies/ensure', {
      method: 'POST',
      csrf: true,
      body: {
        id: movie.id,
        title: movie.title || movie.original_title || `Movie #${movie.id}`,
        posterPath: movie.poster_path || null,
      },
    })
  }

  async upsertComment(movieId, comment, movie = null) {
    try {
      await apiRequest(`/api/ratings/${movieId}/comment`, {
        method: 'PATCH',
        csrf: true,
        body: {
          comment: String(comment || '').trim().slice(0, 2000),
          movie: compactMovie(movie, movieId),
        },
      })
      return { success: true }
    } catch (error) {
      console.error('Unable to save the rating comment:', error)
      return { success: false, error: error.message }
    }
  }

  async getMyRatings(page = 1, limit = 20) {
    try {
      return await apiRequest('/api/ratings/me', { params: { page, limit } })
    } catch (error) {
      console.error('Unable to load ratings:', error)
      return { ratings: [], totalPages: 0, currentPage: page }
    }
  }

  async rateMovie(movieId, rating, comment = '', movie = null) {
    try {
      return await apiRequest('/api/ratings', {
        method: 'POST',
        csrf: true,
        body: {
          movieId,
          rating,
          comment: String(comment || '').trim().slice(0, 2000),
          movie: compactMovie(movie, movieId),
        },
      })
    } catch (error) {
      console.error('Unable to save rating:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteRating(movieId) {
    try {
      await apiRequest(`/api/ratings/${movieId}`, { method: 'DELETE', csrf: true })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getWatchedMovies(page = 1, limit = 20) {
    try {
      return await apiRequest('/api/watched', { params: { page, limit } })
    } catch (error) {
      console.error('Unable to load watched movies:', error)
      return { movies: [], totalPages: 0, currentPage: page }
    }
  }

  async markAsWatched(movieId, movie = null) {
    try {
      return await apiRequest('/api/watched', {
        method: 'POST',
        csrf: true,
        body: { movieId, movie: compactMovie(movie, movieId) },
      })
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async markAsUnwatched(movieId) {
    try {
      await apiRequest(`/api/watched/${movieId}`, { method: 'DELETE', csrf: true })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getWatchedIds() {
    try {
      const result = await apiRequest('/api/watched/ids')
      return new Set((result.items || []).map(Number))
    } catch (error) {
      console.error('Unable to load watched movie identifiers:', error)
      return new Set()
    }
  }

  async getUserRating(movieId) {
    try {
      return (await apiRequest(`/api/ratings/movie/${movieId}`)).rating
    } catch (error) {
      if (error.status !== 401) console.error('Unable to load rating:', error)
      return null
    }
  }
}

export const movieService = new MovieService()
