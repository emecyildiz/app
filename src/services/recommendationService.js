import { apiRequest } from './apiClient'

function compactMovie(movie) {
  if (!movie || typeof movie !== 'object') return { id: movie }

  return {
    id: movie.id,
    title: String(movie.title || movie.original_title || '').trim().slice(0, 300),
    poster_path: typeof movie.poster_path === 'string'
      ? movie.poster_path.trim().slice(0, 500)
      : null,
  }
}

class RecommendationService {
  createRecommendation(toUserId, title, note, movies) {
    return apiRequest('/api/recommendations', {
      method: 'POST',
      csrf: true,
      body: {
        toUserId,
        title: String(title || '').trim().slice(0, 200),
        note: String(note || '').trim().slice(0, 2000),
        movies: Array.isArray(movies) ? movies.slice(0, 3).map(compactMovie) : [],
      },
    })
  }

  getRecommendations(type = 'received', status = null, page = 1, limit = 10) {
    return apiRequest('/api/recommendations', { params: { type, status, page, limit } })
  }

  getRecommendationById(id) {
    return apiRequest(`/api/recommendations/${id}`)
  }

  respondToRecommendation(id, status) {
    return apiRequest(`/api/recommendations/${id}/respond`, {
      method: 'POST',
      csrf: true,
      body: { status },
    })
  }

  deleteRecommendation(id) {
    return apiRequest(`/api/recommendations/${id}`, { method: 'DELETE', csrf: true })
  }
}

export default new RecommendationService()
