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
}

export const userService = new UserService();
