import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Film, Info, User } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'

const MobileBottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const items = [
    { path: '/', label: 'Ana', icon: Home },
    { path: '/movies', label: 'Filmler', icon: Film },
    { path: '/about', label: 'Hakkında', icon: Info },
    ...(isAuthenticated ? [{ path: '/profile', label: 'Profil', icon: User }] : []),
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


