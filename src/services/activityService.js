import { apiRequest } from './apiClient'

class ActivityService {
  constructor() {
    this.interval = null
  }

  async trackActivity() {
    try {
      await apiRequest('/api/users/activity', { method: 'POST', body: {}, csrf: true })
    } catch (error) {
      if (error.status !== 401) console.error('Unable to update activity:', error)
    }
  }

  startTracking(intervalMs = 5 * 60 * 1000) {
    if (import.meta.env.VITE_ENABLE_ACTIVITY_TRACKING === 'false') return null
    this.stopTracking()
    void this.trackActivity()
    this.interval = window.setInterval(() => void this.trackActivity(), intervalMs)
    return this.interval
  }

  stopTracking(interval = this.interval) {
    if (interval) window.clearInterval(interval)
    if (interval === this.interval) this.interval = null
  }
}

export const activityService = new ActivityService()
