import { apiRequest } from './apiClient'

class RecommendationService {
  createRecommendation(toUserId, title, note, movies) {
    return apiRequest('/api/recommendations', {
      method: 'POST',
      csrf: true,
      body: { toUserId, title, note, movies },
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
