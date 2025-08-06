import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Home, Info, User, LogIn, UserPlus, Menu, X, LogOut, Shield, Users } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()

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
    ...(isAuthenticated ? [{ path: '/profile', label: 'Profil', icon: User }] : []),
    ...(user?.role === 'ADMIN' ? [{ path: '/admin', label: 'Admin Panel', icon: Shield }] : []),
    ...(user?.role === 'OPERATOR' ? [{ path: '/operator', label: 'Operatör Paneli', icon: Shield }] : []),
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
            <Film className="w-8 h-8" />
            <span>CinemaHub</span>
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

            {/* Empty Space (former search bar area) */}
            <div className="w-64"></div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=ef4444&color=fff`}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-medium">{user?.name}</span>
                    {user?.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">Admin</span>
                    )}
                    {user?.role === 'OPERATOR' && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">Operatör</span>
                    )}
                  </Link>
                  <button
                    onClick={logout}
                    className="btn btn-ghost"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Çıkış</span>
                  </button>
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
                        logout()
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