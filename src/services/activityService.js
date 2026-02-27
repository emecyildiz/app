import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const ENABLED = import.meta.env.VITE_ACTIVITY_TRACKING_ENABLED === 'true'
let activityIntervalId = null

export const activityService = {
  // Track user activity
  trackActivity: async () => {
    if (!ENABLED) return
    try {
      const token = sessionStorage.getItem('auth-token')
      if (!token) return
      // console.debug('activityService: Tracking activity...')
      await axios.post(`${API_URL}/api/users/activity`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (error) {
      // Silently fail - don't show errors for activity tracking
      // console.debug('Activity tracking failed:', error.message)
    }
  },

  // Start activity tracking
  startTracking: () => {
    if (!ENABLED) return null
    if (activityIntervalId) return activityIntervalId
    // Track activity every 2 minutes
    const interval = setInterval(() => {
      activityService.trackActivity()
    }, 2 * 60 * 1000)
    // Initial track
    activityService.trackActivity()
    activityIntervalId = interval
    return interval
  },

  // Stop activity tracking
  stopTracking: (interval) => {
    const id = interval || activityIntervalId
    console.log('activityService: Stopping activity tracking...')
    if (id) {
      clearInterval(id)
    }
    if (id === activityIntervalId) {
      activityIntervalId = null
    }
  }
} 