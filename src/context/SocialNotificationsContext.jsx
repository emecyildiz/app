import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import recommendationService from '../services/recommendationService'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'

const SocialNotificationsContext = createContext(null)
const RECOMMENDATIONS_LAST_VIEWED_KEY = 'recs-last-viewed-at'

export function SocialNotificationsProvider({ children }) {
  const { isAuthenticated, user, profile } = useAuthStore()
  const [hasNewRecommendation, setHasNewRecommendation] = useState(false)
  const [pendingFriendRequestCount, setPendingFriendRequestCount] = useState(0)

  const hasSession = Boolean(isAuthenticated && user && profile)

  const refreshNotifications = useCallback(async () => {
    if (!hasSession) {
      setHasNewRecommendation(false)
      setPendingFriendRequestCount(0)
      return
    }

    const [recommendationsResult, friendRequestsResult] = await Promise.allSettled([
      recommendationService.getRecommendations('received', 'pending', 1, 10),
      userService.listIncomingRequests(),
    ])

    if (recommendationsResult.status === 'fulfilled') {
      const lastViewedAt = Number(localStorage.getItem(RECOMMENDATIONS_LAST_VIEWED_KEY) || 0) || 0
      const latestCreatedAt = Array.isArray(recommendationsResult.value?.items)
        ? recommendationsResult.value.items.reduce((latest, recommendation) => {
            const createdAt = recommendation?.created_at ? Date.parse(recommendation.created_at) : 0
            return Number.isFinite(createdAt) ? Math.max(latest, createdAt) : latest
          }, 0)
        : 0

      setHasNewRecommendation(latestCreatedAt > lastViewedAt)
    }

    if (friendRequestsResult.status === 'fulfilled') {
      setPendingFriendRequestCount(friendRequestsResult.value.length)
    }
  }, [hasSession])

  const markRecommendationsViewed = useCallback(() => {
    localStorage.setItem(RECOMMENDATIONS_LAST_VIEWED_KEY, String(Date.now()))
    setHasNewRecommendation(false)
  }, [])

  useEffect(() => {
    refreshNotifications()
    if (!hasSession) return undefined

    const intervalId = window.setInterval(refreshNotifications, 120000)
    window.addEventListener('focus', refreshNotifications)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshNotifications)
    }
  }, [hasSession, refreshNotifications])

  const value = useMemo(() => ({
    hasNewRecommendation,
    hasPendingFriendRequest: pendingFriendRequestCount > 0,
    hasProfileNotification: hasNewRecommendation || pendingFriendRequestCount > 0,
    pendingFriendRequestCount,
    markRecommendationsViewed,
    refreshNotifications,
  }), [hasNewRecommendation, markRecommendationsViewed, pendingFriendRequestCount, refreshNotifications])

  return (
    <SocialNotificationsContext.Provider value={value}>
      {children}
    </SocialNotificationsContext.Provider>
  )
}

export function useSocialNotifications() {
  const context = useContext(SocialNotificationsContext)
  if (!context) throw new Error('useSocialNotifications must be used inside SocialNotificationsProvider')
  return context
}
