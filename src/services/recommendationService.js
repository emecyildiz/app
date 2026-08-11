import { apiRequest } from './apiClient'

class RecommendationService {
  createRecommendation(toUserId, title, note, movies) {
    return apiRequest('/api/recommendations', {
      method: 'POST',
      csrf: true,
      body: { toUserId, title, note, movies },
    })
  }

  getRecommendations(type = 'received', status = null) {
    return apiRequest('/api/recommendations', { params: { type, status } })
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
