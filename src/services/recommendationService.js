import axios from 'axios';
import { API_BASE_URL } from '../config/appConfig';

class RecommendationService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/recommendations`;
  }

  async createRecommendation(toUserId, title, note, movieIds) {
    const response = await axios.post(this.baseURL, {
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
    
    const response = await axios.get(this.baseURL, { params });
    return response.data;
  }

  async getRecommendationById(id) {
    const response = await axios.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async respondToRecommendation(id, status) {
    const response = await axios.post(`${this.baseURL}/${id}/respond`, { status });
    return response.data;
  }
}

export default new RecommendationService();