import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://app-production-c295.up.railway.app';

class UserService {
  async getUserStats() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getAllOperators() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/operators`);
      return response.data;
    } catch (error) {
      console.error('Error fetching operators:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await axios.put(`${API_URL}/api/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
