import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const ENABLED = import.meta.env.VITE_ACTIVITY_TRACKING_ENABLED === 'true'

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
    // Track activity every 2 minutes
    const interval = setInterval(() => {
      activityService.trackActivity()
    }, 2 * 60 * 1000)
    // Initial track
    activityService.trackActivity()
    return interval
  },

  // Stop activity tracking
  stopTracking: (interval) => {
    console.log('activityService: Stopping activity tracking...')
    if (interval) {
      clearInterval(interval)
    }
  }
} 