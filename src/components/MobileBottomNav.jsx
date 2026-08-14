import { Eye, Film, Home, Info, LogIn, Shield, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'
import { useSocialNotifications } from '../context/SocialNotificationsContext'

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, profile } = useAuthStore()
  const { hasProfileNotification } = useSocialNotifications()

  const items = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/movies', label: 'Films', icon: Film },
    { path: '/about', label: 'About', icon: Info },
    ...(isAuthenticated
      ? [
          { path: '/profile', label: 'Archive', icon: User, dot: hasProfileNotification },
          ...(profile?.role === 'ADMIN' ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
          ...(profile?.role === 'MODERATOR' ? [{ path: '/moderator', label: 'Review', icon: Eye }] : []),
        ]
      : [{ path: '/login', label: 'Sign in', icon: LogIn }]),
  ]

  const gridColumns = items.length >= 5
    ? 'grid-cols-5'
    : items.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-3'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] h-16 border-t border-white/10 bg-[#0d0e0c]/95 pb-safe shadow-[0_-12px_30px_rgba(0,0,0,.24)] backdrop-blur-xl sm:hidden">
      <div className={`grid h-16 w-full ${gridColumns}`}>
        {items.map(({ path, label, icon: Icon, dot }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname === path || location.pathname.startsWith(`${path}/`)

          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 transition ${
                isActive ? 'text-[#e8e3d9]' : 'text-[#77756f] hover:text-[#c8c2b7]'
              }`}
            >
              {isActive && <span className="absolute inset-x-4 top-0 h-px bg-[#e85d4a]" />}
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {dot && <span className="absolute left-1/2 top-3 ml-2 h-2 w-2 rounded-full bg-[#e85d4a]" aria-label="New activity" />}
              <span className="truncate font-mono text-[9px] uppercase tracking-[0.1em]">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav
