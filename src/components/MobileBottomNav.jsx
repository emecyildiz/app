import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Film, Info, User } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'
import { useEffect, useState } from 'react'
import recommendationService from '../services/recommendationService'

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [pendingRecCount, setPendingRecCount] = useState(0)
  const [hasNewRec, setHasNewRec] = useState(false)

  // Helpers for last-viewed marker
  const getLastViewedAt = () => {
    try { return Number(localStorage.getItem('recs-last-viewed-at') || 0) || 0 } catch { return 0 }
  }

  useEffect(() => {
    let mounted = true
    const loadPending = async () => {
      try {
        if (!isAuthenticated) { setPendingRecCount(0); return }
        const recs = await recommendationService.getRecommendations('received', 'pending')
        if (mounted) {
          const next = Array.isArray(recs) ? recs.length : 0
          setPendingRecCount((prev) => prev !== next ? next : prev)
          const lastViewed = getLastViewedAt()
          let latest = 0
          if (Array.isArray(recs)) {
            for (const r of recs) {
              const t = r?.created_at ? Date.parse(r.created_at) : 0
              if (Number.isFinite(t) && t > latest) latest = t
            }
          }
          const nextHasNew = latest > 0 && latest > lastViewed
          setHasNewRec((prev) => prev !== nextHasNew ? nextHasNew : prev)
        }
      } catch (_) {
        if (mounted) { setPendingRecCount(0); setHasNewRec(false) }
      }
    }
    loadPending()
    const id = setInterval(loadPending, 60000)
    return () => { mounted = false; clearInterval(id) }
  }, [isAuthenticated])

  // Clear dot when viewing recommendations page
  useEffect(() => {
    if (!isAuthenticated) return
    const isRecsPage = location.pathname.startsWith('/profile/recommendations')
    if (isRecsPage) {
      setHasNewRec(false)
      try { localStorage.setItem('recs-last-viewed-at', String(Date.now())) } catch {}
    }
  }, [location.pathname, isAuthenticated])

  const items = [
    { path: '/', label: 'Ana', icon: Home },
    { path: '/movies', label: 'Filmler', icon: Film },
    { path: '/about', label: 'Hakkında', icon: Info },
    ...(isAuthenticated ? [
      { path: '/profile', label: 'Profil', icon: User },
    ] : []),
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 sm:hidden glass-dark border-t border-white/10 backdrop-blur-md pb-safe z-[60] h-16 w-full will-change-transform">
      <div className={`grid ${items.length === 4 ? 'grid-cols-4' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-1 h-16 items-center w-full`}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                isActive ? 'text-primary-400 bg-white/5' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] leading-none">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav


