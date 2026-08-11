import { apiRequest } from './apiClient'

class UserService {
  getUserStats() {
    return apiRequest('/api/admin/dashboard')
  }

  getAllUsers() {
    return apiRequest('/api/admin/users')
  }

  getAllModerators() {
    return apiRequest('/api/admin/moderators')
  }

  deleteUser(userId) {
    return apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE', csrf: true })
  }

  updateUser(userId, userData) {
    return apiRequest(`/api/admin/users/${userId}`, { method: 'PUT', body: userData, csrf: true })
  }

  addModerator(moderatorData) {
    return apiRequest('/api/admin/moderators', { method: 'POST', body: moderatorData, csrf: true })
  }

  promoteToModerator(userId) {
    return apiRequest(`/api/admin/users/${userId}/promote`, { method: 'PUT', body: {}, csrf: true })
  }

  removeModerator(userId) {
    return apiRequest(`/api/admin/moderators/${userId}`, { method: 'DELETE', csrf: true })
  }

  async getMyStats() {
    try {
      return await apiRequest('/api/users/stats')
    } catch (error) {
      console.error('Unable to load profile statistics:', error)
      return null
    }
  }

  async addFavorite(movie) {
    const movieId = Number(typeof movie === 'number' ? movie : (movie?.id ?? movie?.movie_id ?? movie?.tmdb_id))
    if (!Number.isSafeInteger(movieId) || movieId <= 0) throw new Error('Invalid movie identifier.')
    return apiRequest('/api/favorites', {
      method: 'POST',
      csrf: true,
      body: {
        movieId,
        title: typeof movie === 'object' ? (movie.title || movie.original_title) : `Movie #${movieId}`,
        posterPath: typeof movie === 'object' ? movie.poster_path || null : null,
      },
    })
  }

  removeFavorite(movieId) {
    return apiRequest(`/api/favorites/${movieId}`, { method: 'DELETE', csrf: true })
  }

  async getFavoritesList() {
    try {
      return (await apiRequest('/api/users/me/favorites', { params: { page: 1, limit: 50 } })).items || []
    } catch (error) {
      console.error('Unable to load favorite identifiers:', error)
      return []
    }
  }

  async getMyFavoriteIds(page = 1, limit = 50) {
    try {
      return await apiRequest('/api/users/me/favorites', { params: { page, limit } })
    } catch (error) {
      console.error('Unable to load favorites:', error)
      return { items: [], totalPages: 0, currentPage: page }
    }
  }

  async searchUsers(search, limit = 10) {
    try {
      const result = await apiRequest('/api/users/search', { params: { q: search, limit } })
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Unable to search users:', error)
      return []
    }
  }

  async searchFriends(search, limit = 10) {
    try {
      const result = await apiRequest('/api/friends/search', { params: { q: search, limit } })
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Unable to search friends:', error)
      return []
    }
  }

  async getPublicProfile(identifier) {
    try {
      return await apiRequest(`/api/users/public/${encodeURIComponent(identifier)}`)
    } catch (error) {
      if (error.status !== 404) console.error('Unable to load public profile:', error)
      return null
    }
  }

  async upsertComment(movieId, content, movieTitle = null, posterPath = null) {
    try {
      const result = await apiRequest('/api/comments', {
        method: 'POST',
        csrf: true,
        body: { movieId, content, movieTitle: movieTitle || `Movie #${movieId}`, posterPath },
      })
      return result.success === true
    } catch (error) {
      console.error('Unable to save comment:', error)
      return false
    }
  }

  async listMyComments(page = 1, limit = 20) {
    try {
      return await apiRequest('/api/users/me/comments', { params: { page, limit } })
    } catch (error) {
      console.error('Unable to load comments:', error)
      return { comments: [], totalPages: 0, currentPage: page }
    }
  }

  async deleteComment(movieId) {
    try {
      return (await apiRequest(`/api/comments/${movieId}`, { method: 'DELETE', csrf: true })).success === true
    } catch (error) {
      console.error('Unable to delete comment:', error)
      return false
    }
  }

  async getPrivacy(identifier) {
    try {
      return Boolean((await apiRequest(`/api/users/privacy/${encodeURIComponent(identifier)}`)).isPublic)
    } catch (error) {
      return true
    }
  }

  async getUserFavorites(userId, page = 1) {
    try {
      return await apiRequest(`/api/users/${userId}/favorites`, { params: { page } })
    } catch (error) {
      return { items: [], totalPages: 0, currentPage: page }
    }
  }

  async getUserRatings(userId, page = 1) {
    try {
      return await apiRequest(`/api/users/${userId}/ratings`, { params: { page } })
    } catch (error) {
      return { items: [], totalPages: 0, currentPage: page }
    }
  }

  async getFriendStatus(otherUserId) {
    try {
      return (await apiRequest(`/api/friends/status/${otherUserId}`)).status || 'none'
    } catch (error) {
      return 'none'
    }
  }

  async sendFriendRequest(toUserId) {
    try {
      return await apiRequest('/api/friends/request', { method: 'POST', body: { toUserId }, csrf: true })
    } catch (error) {
      console.error('Unable to send friend request:', error)
      return { success: false }
    }
  }

  async respondFriendRequest(payload) {
    try {
      return await apiRequest('/api/friends/respond', { method: 'POST', body: payload, csrf: true })
    } catch (error) {
      console.error('Unable to respond to friend request:', error)
      return { success: false }
    }
  }

  async unfriend(otherUserId) {
    try {
      return (await apiRequest(`/api/friends/${otherUserId}`, { method: 'DELETE', csrf: true })).success === true
    } catch (error) {
      return false
    }
  }

  async listFriends(userId) {
    try {
      const result = await apiRequest(userId ? `/api/friends/list/${userId}` : '/api/friends/list')
      return Array.isArray(result) ? result : []
    } catch (error) {
      return []
    }
  }

  async listIncomingRequests() {
    try {
      const result = await apiRequest('/api/friends/requests')
      return Array.isArray(result) ? result : []
    } catch (error) {
      return []
    }
  }

  getBlockedUsers(page = 1, limit = 20) {
    return apiRequest('/api/safety/blocks', { params: { page, limit } })
  }

  blockUser(userId) {
    return apiRequest('/api/safety/blocks', {
      method: 'POST',
      body: { userId },
      csrf: true,
    })
  }

  unblockUser(userId) {
    return apiRequest(`/api/safety/blocks/${userId}`, { method: 'DELETE', csrf: true })
  }

  getMyReports(page = 1, limit = 20) {
    return apiRequest('/api/safety/reports', { params: { page, limit } })
  }

  reportUser(userId, category, details) {
    return apiRequest('/api/safety/reports', {
      method: 'POST',
      body: { userId, category, details },
      csrf: true,
    })
  }
}

export const userService = new UserService()
