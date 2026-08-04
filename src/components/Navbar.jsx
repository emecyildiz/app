import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Film,
  Heart,
  Info,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Share2,
  Shield,
  Star,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import recommendationService from '../services/recommendationService'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import BrandMark from './BrandMark'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [hasNewRecommendation, setHasNewRecommendation] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, profile, signOut } = useAuthStore()

  const hasSession = Boolean(isAuthenticated && profile && user)
  const isProfileRoute = location.pathname.startsWith('/profile')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    let inFlight = false

    const loadPendingRecommendations = async () => {
      if (!hasSession || inFlight) {
        if (!hasSession && mounted) setHasNewRecommendation(false)
        return
      }

      inFlight = true
      try {
        const recommendations = await recommendationService.getRecommendations('received', 'pending')
        if (!mounted) return

        const lastViewedAt = Number(localStorage.getItem('recs-last-viewed-at') || 0) || 0
        const latestCreatedAt = Array.isArray(recommendations)
          ? recommendations.reduce((latest, recommendation) => {
              const createdAt = recommendation?.created_at ? Date.parse(recommendation.created_at) : 0
              return Number.isFinite(createdAt) ? Math.max(latest, createdAt) : latest
            }, 0)
          : 0

        setHasNewRecommendation(latestCreatedAt > lastViewedAt)
      } catch {
        if (mounted) setHasNewRecommendation(false)
      } finally {
        inFlight = false
      }
    }

    loadPendingRecommendations()
    const intervalId = window.setInterval(loadPendingRecommendations, 120000)
    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [hasSession])

  useEffect(() => {
    if (hasSession && location.pathname.startsWith('/profile/recommendations')) {
      setHasNewRecommendation(false)
      localStorage.setItem('recs-last-viewed-at', String(Date.now()))
    }
  }, [hasSession, location.pathname])

  const handleSearchChange = (event) => {
    setQuery(event.target.value)
    setResults([])
    setHasSearched(false)
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    const value = query.trim()
    if (value.length < 2) return

    setIsSearching(true)
    setHasSearched(false)
    try {
      const matches = await userService.searchUsers(value, 8)
      setResults(matches)
    } finally {
      setIsSearching(false)
      setHasSearched(true)
    }
  }

  const goToPublicProfile = (username, id) => {
    const target = username?.trim() || id
    setQuery('')
    setResults([])
    setHasSearched(false)
    navigate(`/u/${encodeURIComponent(target)}`)
  }

  const navLinks = [
    { path: '/movies', label: 'Films', icon: Film },
    { path: '/about', label: 'About', icon: Info },
    ...(hasSession ? [{ path: '/profile/overview', label: 'Journal', icon: User }] : []),
    ...(hasSession && profile?.role === 'ADMIN' ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
    ...(hasSession && profile?.role === 'MODERATOR' ? [{ path: '/moderator', label: 'Moderation', icon: Shield }] : []),
  ]

  const profileTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'ratings', label: 'Ratings', icon: Star },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'recommendations', label: 'Recommendations', icon: Share2, dot: hasNewRecommendation },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const isActivePath = (path) => {
    if (path === '/movies') return location.pathname.startsWith('/movies')
    if (path.startsWith('/profile')) return location.pathname.startsWith('/profile')
    return location.pathname === path
  }

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${isScrolled ? 'border-white/10 bg-[#0d0e0c]/95 shadow-[0_14px_40px_rgba(0,0,0,.24)] backdrop-blur-xl' : 'border-white/[0.07] bg-[#0d0e0c]/90'}`}>
      <nav aria-label="Primary navigation" className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="hidden border-l border-white/10 pl-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#77756f] xl:block">
            Film journal<br />and catalog
          </span>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = isActivePath(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex min-h-10 items-center gap-2 border-b px-3 text-sm transition ${isActive ? 'border-[#e85d4a] text-[#f3efe6]' : 'border-transparent text-[#aaa79f] hover:text-[#f3efe6]'}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="flex h-10 w-56 items-center border border-white/10 bg-white/[0.025] px-3 transition focus-within:border-white/25 xl:w-64">
              <Search className="h-4 w-4 shrink-0 text-[#77756f]" strokeWidth={1.6} />
              <input
                value={query}
                onChange={handleSearchChange}
                placeholder="Find a member"
                aria-label="Find a member"
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#e8e3d9] outline-none placeholder:text-[#66645f]"
              />
              <button type="submit" disabled={isSearching} className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#aaa79f] hover:text-white disabled:opacity-40">
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            {(results.length > 0 || (query && hasSearched && !isSearching)) && (
              <div className="absolute right-0 mt-2 w-72 border border-white/10 bg-[#151613] shadow-2xl">
                {results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => goToPublicProfile(result.username, result.id)}
                    className="flex w-full items-center gap-3 border-b border-white/[0.07] px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.04]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#252620] text-xs font-semibold text-[#e8e3d9]">
                      {(result.name || result.username || '?').slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[#e8e3d9]">{result.name || result.username}</span>
                      <span className="block truncate text-xs text-[#77756f]">@{result.username}</span>
                    </span>
                  </button>
                ))}
                {results.length === 0 && (
                  <p className="px-4 py-3 text-sm text-[#77756f]">No members found.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasSession ? (
              <>
                <Link to="/profile/recommendations" className="relative p-2 text-[#aaa79f] transition hover:text-white" aria-label="Recommendations">
                  <Share2 className="h-5 w-5" strokeWidth={1.6} />
                  {hasNewRecommendation && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e85d4a]" />}
                </Link>
                <Link to="/profile/overview" className="max-w-36 truncate px-2 text-sm text-[#d3cec4] hover:text-white">
                  {profile?.name || profile?.username || 'Profile'}
                </Link>
                <button type="button" onClick={signOut} className="p-2 text-[#77756f] transition hover:text-[#e85d4a]" aria-label="Sign out">
                  <LogOut className="h-5 w-5" strokeWidth={1.6} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="inline-flex h-10 items-center gap-2 px-3 text-sm text-[#aaa79f] transition hover:text-white">
                  <LogIn className="h-4 w-4" strokeWidth={1.6} /> Sign in
                </Link>
                <Link to="/register" className="inline-flex h-10 items-center gap-2 bg-[#e85d4a] px-4 text-sm font-semibold text-[#17130f] transition hover:bg-[#f06b57]">
                  <UserPlus className="h-4 w-4" /> Join
                </Link>
              </>
            )}
          </div>
        </div>

        {isProfileRoute && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-profile-menu"
            className="p-2 text-[#d3cec4] md:hidden"
          >
            <span className="sr-only">Toggle profile menu</span>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && isProfileRoute && (
          <motion.div
            id="mobile-profile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 bg-[#11120f] md:hidden"
          >
            <div className="grid grid-cols-2 gap-px bg-white/10 p-px">
              {profileTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = location.pathname === `/profile/${tab.id}`
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      navigate(`/profile/${tab.id}`)
                      setIsMobileMenuOpen(false)
                      window.scrollTo({ top: 0, behavior: 'auto' })
                    }}
                    className={`relative flex items-center gap-3 bg-[#11120f] px-4 py-4 text-left text-sm ${isActive ? 'text-[#e85d4a]' : 'text-[#aaa79f]'}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                    {tab.label}
                    {tab.dot && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#e85d4a]" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
