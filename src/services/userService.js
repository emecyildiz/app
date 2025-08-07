import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://app-production-c295.up.railway.app';

class UserService {
  async getUserStats() {
    try {
      const response = await axios.get(`${API_URL}/api/users/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
