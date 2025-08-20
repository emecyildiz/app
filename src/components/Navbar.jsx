import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Film, Info, User, LogIn, UserPlus, Menu, X, LogOut, Shield, Users, Search } from 'lucide-react'
import { useRef } from 'react'
import { userService } from '../services/userService'
import { APP_NAME, APP_LOGO_URL } from '../config/appConfig'
import { useAuthStore } from '../store/newAuthStore'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, profile, signOut } = useAuthStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeout = useRef(null)

  // Guard: if auth store hasn't hydrated yet, avoid rendering actions that rely on it
  const safeIsAuthenticated = Boolean(isAuthenticated && profile)

  const handleSearchChange = (e) => {
    setQuery(e.target.value)
    setResults([])
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    const value = query.trim()
    if (!value || value.length < 2) return
    setIsSearching(true)
    try {
      const res = await userService.searchUsers(value, 8)
      setResults(res)
    } finally {
      setIsSearching(false)
    }
  }

  const goToPublicProfile = (username, id) => {
    setQuery('')
    setResults([])
    // Prefer username routing; fallback to id if username yok
    const target = (username && username.trim().length > 0) ? username : id
    navigate(`/u/${encodeURIComponent(target)}`)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { path: '/', label: 'Ana Sayfa', icon: Home },
    { path: '/movies', label: 'Filmler', icon: Film },
    { path: '/about', label: 'Hakkında', icon: Info },
    ...(safeIsAuthenticated ? [{ path: '/profile', label: 'Profil', icon: User }] : []),
    ...(safeIsAuthenticated && profile?.role === 'ADMIN' ? [{ path: '/admin', label: 'Admin Panel', icon: Shield }] : []),
    ...(safeIsAuthenticated && profile?.role === 'OPERATOR' ? [{ path: '/operator', label: 'Operatör Paneli', icon: Shield }] : []),
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-dark shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-white hover:text-primary-400 transition-colors"
          >
            <img src={APP_LOGO_URL} alt={APP_NAME} className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Nav Links */}
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.path
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'text-primary-400 bg-primary-400/10'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* User Search */}
            <div className="relative w-72">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Kullanıcı ara..."
                  className="bg-transparent outline-none text-sm text-white placeholder:text-gray-400 w-full"
                />
                <button type="submit" className="text-xs px-2 py-1 bg-primary-500/20 text-primary-300 rounded">Ara</button>
              </form>
              {query && results.length > 0 && (
                <div className="absolute mt-2 w-full glass-dark rounded-lg border border-white/10 max-h-72 overflow-auto z-50">
                  {results.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => goToPublicProfile(u.username, u.id)}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                    >
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${u.name || u.username}&background=ef4444&color=fff`}
                        alt={u.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex flex-col">
                        <span className="text-white text-sm">{u.name || u.username}</span>
                        <span className="text-gray-400 text-xs">@{u.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {query && !isSearching && results.length === 0 && (
                <div className="absolute mt-2 w-full glass-dark rounded-lg border border-white/10 p-3 text-sm text-gray-400 z-50">
                  Sonuç yok
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {safeIsAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <img
                      src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}&background=ef4444&color=fff`}
                      alt={profile?.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-medium">{profile?.name}</span>
                    {profile?.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">Admin</span>
                    )}
                    {profile?.role === 'OPERATOR' && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">Operatör</span>
                    )}
                  </Link>
                  <button
                    onClick={signOut}
                    className="btn btn-ghost"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Çıkış</span>
                  </button>
                  {/* Force sign-out butonu kaldırıldı */}
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">
                    <LogIn className="w-4 h-4" />
                    <span>Giriş</span>
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    <UserPlus className="w-4 h-4" />
                    <span>Kayıt Ol</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-primary-400 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4">
              {/* Mobile Nav Links */}
              <ul className="space-y-2 mb-4">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = location.pathname === link.path
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'text-primary-400 bg-primary-400/10'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Mobile Auth Buttons */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=ef4444&color=fff`}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">{user?.name}</span>
                    </Link>
                    <button
                      onClick={() => {
                        signOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full btn btn-ghost justify-start"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full btn btn-ghost justify-start"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Giriş Yap</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full btn btn-primary justify-start"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Kayıt Ol</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar