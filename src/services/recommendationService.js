import axios from 'axios';
import { API_BASE_URL } from '../config/appConfig';

class RecommendationService {
  async createRecommendation(toUserId, title, note, movieIds) {
    const response = await axios.post(`${API_BASE_URL}/recommendations`, {
      toUserId,
      title,
      note,
      movieIds
    });
    return response.data;
  }

  async getRecommendations(type = 'received', status = null) {
    const params = { type };
    if (status) params.status = status;
    
    const response = await axios.get(`${API_BASE_URL}/recommendations`, { params });
    return response.data;
  }

  async getRecommendationById(id) {
    const response = await axios.get(`${API_BASE_URL}/recommendations/${id}`);
    return response.data;
  }

  async respondToRecommendation(id, status) {
    const response = await axios.post(`${API_BASE_URL}/recommendations/${id}/respond`, { status });
    return response.data;
  }
}

export default new RecommendationService();
