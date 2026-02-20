import axios from 'axios';
import { API_BASE_URL } from '../config/appConfig';

class RecommendationService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/recommendations`;
  }

  // Read auth token from sessionStorage (same pattern as userService)
  getAuthToken() {
    return sessionStorage.getItem('auth-token');
  }

  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async createRecommendation(toUserId, title, note, movieIds) {
    const response = await axios.post(
      this.baseURL,
      { toUserId, title, note, movieIds },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getRecommendations(type = 'received', status = null) {
    const params = { type };
    if (status) params.status = status;
    const response = await axios.get(this.baseURL, { 
      params, 
      headers: this.getAuthHeaders(),
      timeout: 15000, // 15s timeout
    });
    return response.data;
  }

  async getRecommendationById(id) {
    const response = await axios.get(`${this.baseURL}/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async respondToRecommendation(id, status) {
    const response = await axios.post(
      `${this.baseURL}/${id}/respond`,
      { status },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async deleteRecommendation(id) {
    // Try DELETE first, fallback to POST /delete
    try {
      const response = await axios.delete(`${this.baseURL}/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (e) {
      const response = await axios.post(`${this.baseURL}/${id}/delete`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    }
  }
}

export default new RecommendationService();