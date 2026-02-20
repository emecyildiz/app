import axios from 'axios';
import { supabase } from '../config/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class UserService {
  constructor() {
    this.supabase = supabase;
  }
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

  async getAllModerators() {
    try {
      const response = await axios.get(`${API_URL}/api/admin/moderators`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching moderators:', error);
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
      const response = await axios.post(`${API_URL}/api/favorites`, { movieId }, {
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
      const response = await axios.delete(`${API_URL}/api/favorites/${movieId}`, {
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

  async getMyFavoriteIds(page = 1, limit = 50) {
    try {
      const { data: { user } } = await this.supabase?.auth?.getUser?.() || { data: { user: null } };
      const uid = user?.id || null;
      const token = this.getAuthToken();
      if (!uid || !token) return { items: [], totalPages: 0 };
      const response = await axios.get(`${API_URL}/api/users/${uid}/favorites`, {
        params: { page, limit },
        headers: this.getAuthHeaders()
      });
      return response.data || { items: [], totalPages: 0 };
    } catch (error) {
      console.error('Error getting my favorites list:', error);
      return { items: [], totalPages: 0 };
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

  // ===== Comments =====
  async upsertComment(movieId, content, movieTitle = null, posterPath = null) {
    try {
      const response = await axios.post(`${API_URL}/api/comments`, { 
        movieId, 
        content,
        movieTitle: movieTitle || `Film #${movieId}`,
        posterPath 
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Error upserting comment:', error);
      return false;
    }
  }

  async listMyComments(page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_URL}/api/users/me/comments`, {
        params: { page, limit },
        headers: this.getAuthHeaders()
      });
      return response.data || { comments: [], totalPages: 0 };
    } catch (error) {
      console.error('Error listing my comments:', error);
      return { comments: [], totalPages: 0 };
    }
  }

  async deleteComment(movieId) {
    try {
      const response = await axios.delete(`${API_URL}/api/comments/${movieId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  async getPrivacy(identifier) {
    try {
      const response = await axios.get(`${API_URL}/api/users/privacy/${encodeURIComponent(identifier)}`);
      return Boolean(response.data?.isPublic);
    } catch (error) {
      console.error('Error fetching privacy:', error);
      return true;
    }
  }

  // Public lists (subject to privacy / friendship handled server-side in future)
  async getUserFavorites(userId, page = 1) {
    try {
      const response = await axios.get(`${API_URL}/api/users/${userId}/favorites`, { params: { page }, headers: this.getAuthHeaders() });
      return response.data || { items: [], totalPages: 0 };
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return { items: [], totalPages: 0 };
    }
  }

  async getUserRatings(userId, page = 1) {
    try {
      const response = await axios.get(`${API_URL}/api/users/${userId}/ratings`, { params: { page }, headers: this.getAuthHeaders() });
      return response.data || { items: [], totalPages: 0 };
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return { items: [], totalPages: 0 };
    }
  }

  // ===== Friendships =====
  async getFriendStatus(otherUserId) {
    try {
      const response = await axios.get(`${API_URL}/api/friends/status/${otherUserId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data?.status || 'none';
    } catch (error) {
      console.error('Error getting friend status:', error);
      return 'none';
    }
  }

  async sendFriendRequest(toUserId) {
    try {
      const response = await axios.post(`${API_URL}/api/friends/request`, { toUserId }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false };
    }
  }

  async respondFriendRequest(payload) {
    try {
      const response = await axios.post(`${API_URL}/api/friends/respond`, payload, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error responding friend request:', error);
      return { success: false };
    }
  }

  async unfriend(otherUserId) {
    try {
      const response = await axios.delete(`${API_URL}/api/friends/${otherUserId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Error unfriending:', error);
      return false;
    }
  }

  async listFriends(userId) {
    try {
      const url = userId ? `${API_URL}/api/friends/list/${userId}` : `${API_URL}/api/friends/list`;
      const response = await axios.get(url, { headers: this.getAuthHeaders() });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error listing friends:', error);
      return [];
    }
  }

  async listIncomingRequests() {
    try {
      const response = await axios.get(`${API_URL}/api/friends/requests`, { headers: this.getAuthHeaders() });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error listing friend requests:', error);
      return [];
    }
  }
}

export const userService = new UserService();
