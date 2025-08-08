import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://app-production-c295.up.railway.app';

class UserService {
  // Get auth token from sessionStorage
  getAuthToken() {
    const token = sessionStorage.getItem('auth-token');
    return token;
  }

  // Create axios instance with auth header
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getUserStats() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getAllOperators() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/operators`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching operators:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await axios.put(`${API_URL}/api/admin/users/${userId}`, userData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Get my aggregated stats
  async getMyStats() {
    try {
      const response = await axios.get(`${API_URL}/api/users/stats`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my stats:', error);
      return null;
    }
  }

  async addFavorite(movieId) {
    try {
      const response = await axios.post(`${API_URL}/api/users/favorites`, { movieId }, {
        headers: this.getAuthHeaders()
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  async removeFavorite(movieId) {
    try {
      const response = await axios.delete(`${API_URL}/api/users/favorites/${movieId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async getFavoritesCount() {
    try {
      const response = await axios.get(`${API_URL}/api/users/favorites/count`, {
        headers: this.getAuthHeaders()
      });
      return response.data?.count ?? 0;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  }

  async searchUsers(query, limit = 10) {
    try {
      const response = await axios.get(`${API_URL}/api/users/search`, {
        params: { q: query, limit }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async getPublicProfile(identifier) {
    try {
      const response = await axios.get(`${API_URL}/api/users/public/${encodeURIComponent(identifier)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public profile:', error);
      return null;
    }
  }
}

export const userService = new UserService();
