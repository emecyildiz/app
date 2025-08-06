import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://zonal-essence-production.up.railway.app'

export const activityService = {
  // Track user activity
  trackActivity: async () => {
    try {
      const token = sessionStorage.getItem('auth-token')
      if (token) {
        console.log('activityService: Tracking activity...')
        await axios.post(`${API_URL}/api/users/activity`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('activityService: Activity tracked successfully')
      } else {
        console.log('activityService: No token found')
      }
    } catch (error) {
      // Silently fail - don't show errors for activity tracking
      console.log('Activity tracking failed:', error.message)
    }
  },

  // Start activity tracking
  startTracking: () => {
    console.log('activityService: Starting activity tracking...')
    
    // Track activity every 1 minute (increased frequency)
    const interval = setInterval(() => {
      activityService.trackActivity()
    }, 1 * 60 * 1000) // 1 minute

    // Track initial activity
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