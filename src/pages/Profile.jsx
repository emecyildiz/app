import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, User, Mail, Calendar, Film, Star, Heart, Settings, LogOut, MapPin, Edit2, Twitter, Instagram, Link, Users, UserMinus, Check, X, MessageSquare, Share2, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/newAuthStore'
import { useFavoritesStore } from '../store/favoritesStore'
import { userService } from '../services/userService'
import { movieService } from '../services/movieService'
import { tmdbService } from '../services/tmdbService'
import recommendationService from '../services/recommendationService'
import AvatarUpload from '../components/AvatarUpload'
import MovieCard from '../components/MovieCard'

const Profile = () => {
  const { user, profile, updateProfile, updateAvatar, signOut, isLoading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { section } = useParams()
  const { favorites, removeFromFavorites, getFavoritesCount, clearFavorites } = useFavoritesStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Friends state
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [friendsBusy, setFriendsBusy] = useState(false)

  // Movie ratings state
  const [ratedMovies, setRatedMovies] = useState([])
  const [ratingsPage, setRatingsPage] = useState(1)
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1)
  const [ratingsLoading, setRatingsLoading] = useState(false)

  const [stats, setStats] = useState({ 
    watchedMovies: 0, 
    ratings: 0, 
    comments: 0,
    favorites: 0, 
    memberSince: user?.created_at || null, 
    memberSinceDays: 0 
  })
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: profile?.name || '',
      username: profile?.username || '',
      email: user?.email || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      twitter: profile?.social_links?.twitter || '',
      instagram: profile?.social_links?.instagram || '',
      letterboxd: profile?.social_links?.letterboxd || '',
      isPublic: (profile?.social_links?.privacy || 'public') !== 'private',
    },
  })

  const onSubmit = async (data) => {
    const updates = {
      name: data.name,
      username: data.username,
      email: data.email,
      bio: data.bio,
      location: data.location,
      isPublic: data.isPublic,
      socialLinks: {
        twitter: data.twitter,
        instagram: data.instagram,
        letterboxd: data.letterboxd,
      }
    }
    const result = await updateProfile(updates)
    if (result.success) {
      setIsEditModalOpen(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const loadStats = async () => {
      try {
        const data = await userService.getMyStats()
        if (mounted && data) {
          setStats({
            watchedMovies: data.watchedMovies || 0,
            ratings: data.ratingsCount || 0,
            comments: data.commentsCount || 0,
            favorites: typeof data.favoritesCount === 'number' ? data.favoritesCount : getFavoritesCount(),
            memberSince: data.memberSince || user?.created_at || null,
            memberSinceDays: data.memberSinceDays || 0,
          })
        }
      } catch (e) {
        // silent
      }
    }
    if (user) loadStats()
    return () => { mounted = false }
  }, [user])

  // Sync state from URL once and validate section; avoid navigate loops
  useEffect(() => {
    try {
      const candidate = section || 'overview'
      if (!tabs.some(x => x.id === candidate)) {
        // Invalid section -> normalize URL once
        navigate('/profile/overview', { replace: true })
        setActiveTab('overview')
        return
      }
      setActiveTab(candidate)
      // Scroll to top on section change
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      } catch {
        window.scrollTo(0, 0)
      }
    } catch {}
  }, [section])

  // Film puanlarını yükle
  useEffect(() => {
    let mounted = true
    const loadRatings = async () => {
      if (activeTab !== 'ratings') return
      try {
        setRatingsLoading(true)
        const data = await movieService.getMyRatings(ratingsPage)

        // Enrich movies with TMDB details if poster/backdrop missing
        const ratingsArr = Array.isArray(data?.ratings) ? data.ratings : []
        const idsToFetch = Array.from(new Set(
          ratingsArr
            .filter(r => r && r.movie && !r.movie.poster_path)
            .map(r => Number(r.movie.id || r.movie_id))
            .filter(Boolean)
        ))

        let detailsMap = {}
        if (idsToFetch.length > 0) {
          try {
            const details = await Promise.all(idsToFetch.map(id => tmdbService.getMovieDetails(id).catch(() => null)))
            details.forEach(d => {
              if (d && d.id) {
                detailsMap[d.id] = {
                  title: d.title || d.original_title || null,
                  poster_path: d.poster_path || null,
                  backdrop_path: d.backdrop_path || null,
                  release_date: d.release_date || null,
                  vote_average: typeof d.vote_average === 'number' ? d.vote_average : null,
                  overview: d.overview || null,
                  runtime: d.runtime || null,
                }
              }
            })
          } catch (_) {}
        }

        const enriched = ratingsArr.map(r => {
          const mid = Number(r?.movie?.id || r?.movie_id)
          const extra = mid ? detailsMap[mid] : null
          if (!extra) return r
          return {
            ...r,
            movie: {
              ...r.movie,
              title: r.movie?.title || extra.title || `#${mid}`,
              poster_path: r.movie?.poster_path ?? extra.poster_path ?? null,
              backdrop_path: r.movie?.backdrop_path ?? extra.backdrop_path ?? null,
              release_date: r.movie?.release_date ?? extra.release_date ?? null,
              vote_average: r.movie?.vote_average ?? extra.vote_average ?? 0,
              overview: r.movie?.overview ?? extra.overview ?? '',
              runtime: r.movie?.runtime ?? extra.runtime ?? null,
            }
          }
        })

        if (mounted) {
          setRatedMovies(prev => ratingsPage === 1 ? enriched : [...prev, ...enriched])
          setRatingsTotalPages(data.totalPages)
        }
      } catch (error) {
        toast.error('Puanladığınız filmler yüklenirken bir hata oluştu')
      } finally {
        if (mounted) setRatingsLoading(false)
      }
    }
    loadRatings()
    return () => { mounted = false }
  }, [activeTab, ratingsPage])

  // Load my comments when comments tab active
  const [myComments, setMyComments] = useState([])
  const [commentsPage, setCommentsPage] = useState(1)
  const [commentsTotalPages, setCommentsTotalPages] = useState(1)
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Recommendations state
  const [receivedRecommendations, setReceivedRecommendations] = useState([])
  const [sentRecommendations, setSentRecommendations] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  const toggleLocalRecommendationWatched = (recId, movieId, isWatched) => {
    setReceivedRecommendations(prev => prev.map(r => {
      if (r.id !== recId) return r
      return {
        ...r,
        items: (r.items || []).map(i => i.movie_id === movieId ? { ...i, isWatched } : i)
      }
    }))
  }

  useEffect(() => {
    let mounted = true
    const loadComments = async () => {
      if (activeTab !== 'comments') return
      try {
        setCommentsLoading(true)
        const data = await userService.listMyComments(commentsPage, 20)
        if (mounted) {
          setMyComments(prev => commentsPage === 1 ? data.comments : [...prev, ...data.comments])
          setCommentsTotalPages(data.totalPages || 1)
        }
      } finally {
        if (mounted) setCommentsLoading(false)
      }
    }
    loadComments()
    return () => { mounted = false }
  }, [activeTab, commentsPage])

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: User },
    { id: 'favorites', label: 'Favorilerim', icon: Heart },
    { id: 'ratings', label: 'Puanladıklarım', icon: Star },
    { id: 'comments', label: 'Yorumlarım', icon: MessageSquare },
    { id: 'recommendations', label: 'Öneriler', icon: Share2 },
    { id: 'friends', label: 'Arkadaşlar', icon: Users },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ]

  // Load recommendations when recommendations tab is active
  useEffect(() => {
    let mounted = true
    const loadRecommendations = async () => {
      if (activeTab !== 'recommendations') return
      try {
        setRecommendationsLoading(true)
        const [received, sent, watchedSet] = await Promise.all([
          recommendationService.getRecommendations('received'),
          recommendationService.getRecommendations('sent'),
          movieService.getWatchedIds()
        ])

        // Enrich with user display info (name, username, avatar)
        const all = [...(received || []), ...(sent || [])]
        const idSet = new Set()
        all.forEach(r => {
          if (r?.from_user_id) idSet.add(r.from_user_id)
          if (r?.to_user_id) idSet.add(r.to_user_id)
        })

        let profileMap = {}
        if (idSet.size > 0) {
          try {
            const ids = Array.from(idSet)
            const results = await Promise.all(ids.map(id => userService.getPublicProfile(id)))
            results.forEach(p => {
              if (p && p.id) profileMap[p.id] = {
                id: p.id,
                name: p.name || null,
                username: p.username || null,
                avatar: p.avatar || null,
              }
            })
          } catch (_) {}
        }

        // Fetch minimal movie info from TMDB for mini cards (title/poster)
        const movieIdSet = new Set()
        ;(received || []).forEach(r => (r.items || []).forEach(i => movieIdSet.add(Number(i.movie_id))))
        ;(sent || []).forEach(r => (r.items || []).forEach(i => movieIdSet.add(Number(i.movie_id))))
        let movieMap = {}
        if (movieIdSet.size > 0) {
          try {
            const ids = Array.from(movieIdSet)
            const details = await Promise.all(ids.map(id => tmdbService.getMovieDetails(id).catch(()=>null)))
            details.forEach(d => {
              if (d && d.id) movieMap[d.id] = { title: d.title || d.original_title || `#${d.id}`, poster_path: d.poster_path || null }
            })
          } catch (_) {}
        }

        const hydrate = (rec) => ({
          ...rec,
          from_user: profileMap[rec?.from_user_id] || null,
          to_user: profileMap[rec?.to_user_id] || null,
          items: (rec.items || []).map(it => ({
            ...it,
            isWatched: watchedSet.has(Number(it.movie_id)),
            poster_path: movieMap[Number(it.movie_id)]?.poster_path || null,
            movie_title: movieMap[Number(it.movie_id)]?.title || `#${it.movie_id}`
          }))
        })

        if (mounted) {
          setReceivedRecommendations((received || []).map(hydrate))
          setSentRecommendations((sent || []).map(hydrate))
        }
      } catch (error) {
        console.error('Error loading recommendations:', error)
        toast.error('Öneriler yüklenirken bir hata oluştu')
      } finally {
        if (mounted) setRecommendationsLoading(false)
      }
    }
    loadRecommendations()
    return () => { mounted = false }
  }, [activeTab])

  useEffect(() => {
    let mounted = true
    const loadFriendsData = async () => {
      if (activeTab !== 'friends') return
      try {
        const [list, reqs] = await Promise.all([
          userService.listFriends(),
          userService.listIncomingRequests(),
        ])
        if (mounted) {
          setFriends(list || [])
          setRequests(reqs || [])
        }
      } catch (_) {}
    }
    loadFriendsData()
    return () => { mounted = false }
  }, [activeTab])

  // Favorites tab: genres and filtering
  const [genreOptions, setGenreOptions] = useState([])
  const [selectedGenreId, setSelectedGenreId] = useState('')
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [favoritePage, setFavoritePage] = useState(1)
  const [favoriteTotalPages, setFavoriteTotalPages] = useState(1)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadGenres = async () => {
      if (activeTab !== 'favorites') return
      try {
        const res = await tmdbService.getGenres()
        if (mounted) setGenreOptions(res.genres || [])
      } catch (_) {}
    }
    loadGenres()
    return () => { mounted = false }
  }, [activeTab])

  // Load favorite movies from backend when favorites tab is active
  useEffect(() => {
    let mounted = true
    const loadFavoriteMovies = async () => {
      if (activeTab !== 'favorites') return
      try {
        setFavoriteLoading(true)
        const { items = [], totalPages = 1 } = await userService.getMyFavoriteIds(favoritePage, 24)
        const uniqueIds = Array.from(new Set((items || []).map(id => Number(id)).filter(Boolean)))
        const details = await Promise.all(uniqueIds.map(id => tmdbService.getMovieDetails(id).catch(() => null)))
        const movies = details.filter(Boolean)
        if (mounted) {
          setFavoriteMovies(prev => favoritePage === 1 ? movies : [...prev, ...movies])
          setFavoriteTotalPages(totalPages || 1)
        }
      } catch (_) {
        if (mounted) {
          setFavoriteMovies([])
          setFavoriteTotalPages(1)
        }
      } finally {
        if (mounted) setFavoriteLoading(false)
      }
    }
    loadFavoriteMovies()
    return () => { mounted = false }
  }, [activeTab, favoritePage])

  const filteredFavorites = favoriteMovies.filter((m) => {
    if (!selectedGenreId) return true
    const gid = Number(selectedGenreId)
    if (Array.isArray(m?.genre_ids)) {
      return m.genre_ids.includes(gid)
    }
    if (Array.isArray(m?.genres)) {
      return m.genres.some(g => Number(g.id) === gid)
    }
    return false
  })

  // Load friends once for stats/count even if not on friends tab
  useEffect(() => {
    let mounted = true
    const preloadFriends = async () => {
      if (!user) return
      try {
        const list = await userService.listFriends()
        if (mounted) setFriends(list || [])
      } catch (_) {}
    }
    preloadFriends()
    return () => { mounted = false }
  }, [user])

  // Optional: preload my favorite IDs to reconcile UI if needed (hidden, non-blocking)
  useEffect(() => {
    let mounted = true
    const preloadFavorites = async () => {
      try {
        await userService.getMyFavoriteIds(1, 1)
      } catch (_) {}
    }
    preloadFavorites()
    return () => { mounted = false }
  }, [])

  const acceptRequest = async (requestId, fromUserId) => {
    setFriendsBusy(true)
    try {
      const resp = await userService.respondFriendRequest({ requestId, fromUserId, action: 'accept' })
      if (resp?.success || resp?.status === 'friends') {
        // Refresh lists
        const [list, reqs] = await Promise.all([
          userService.listFriends(),
          userService.listIncomingRequests(),
        ])
        setFriends(list || [])
        setRequests(reqs || [])
      }
    } finally {
      setFriendsBusy(false)
    }
  }

  const rejectRequest = async (requestId, fromUserId) => {
    setFriendsBusy(true)
    try {
      const resp = await userService.respondFriendRequest({ requestId, fromUserId, action: 'reject' })
      if (resp?.success || resp?.status === 'none') {
        const reqs = await userService.listIncomingRequests()
        setRequests(reqs || [])
      }
    } finally {
      setFriendsBusy(false)
    }
  }

  const unfriend = async (otherUserId) => {
    setFriendsBusy(true)
    try {
      const ok = await userService.unfriend(otherUserId)
      if (ok) {
        setFriends(prev => prev.filter(f => f.id !== otherUserId))
      }
    } finally {
      setFriendsBusy(false)
    }
  }

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen-dvh pt-20">
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' ? (
          <>
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass rounded-2xl p-8 mb-8"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <AvatarUpload
                  currentAvatar={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}&background=ef4444&color=fff&size=200`}
                  onUpload={updateAvatar}
                  size="large"
                />

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {profile?.name}
                  </h1>
                  <p className="text-xl text-gray-400 mb-3">@{profile?.username}</p>
                  
                  {profile?.bio && (
                    <p className="text-gray-300 mb-4 max-w-2xl">{profile?.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
                    {profile?.location && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>Üyelik: {stats.memberSince ? new Date(stats.memberSince).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Film className="w-4 h-4" />
                      <span>{stats.watchedMovies} film izlendi</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  {(profile?.social_links?.twitter || profile?.social_links?.instagram || profile?.social_links?.letterboxd) && (
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                      {profile.social_links.twitter && (
                        <a
                          href={`https://twitter.com/${profile.social_links.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {profile.social_links.instagram && (
                        <a
                          href={`https://instagram.com/${profile.social_links.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {profile.social_links.letterboxd && (
                        <a
                          href={`https://letterboxd.com/${profile.social_links.letterboxd}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Link className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn btn-primary"
                  >
                    <Edit2 className="w-4 h-4" />
                    Profili Düzenle
                  </button>
                  <button onClick={signOut} className="btn btn-secondary">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Compact Metrics Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 mb-6"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <Film className="w-4 h-4 text-primary-400" />
                <span className="text-white font-semibold">{stats.watchedMovies}</span>
                <span className="text-gray-400 text-sm">İzlendi</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold">{stats.ratings}</span>
                <span className="text-gray-400 text-sm">Puan</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-white font-semibold">{stats.comments}</span>
                <span className="text-gray-400 text-sm">Yorum</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-white font-semibold">{stats.favorites}</span>
                <span className="text-gray-400 text-sm">Favori</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-white font-semibold">{stats.memberSinceDays}</span>
                <span className="text-gray-400 text-sm">Gün</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <User className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold">{friends.length}</span>
                <span className="text-gray-400 text-sm">Arkadaş</span>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => navigate('/profile/overview')} className="btn btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
            <h2 className="text-xl font-bold text-white">{tabs.find(t => t.id === activeTab)?.label || ''}</h2>
            <div className="w-12" />
          </div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Tab Navigation (hidden on mobile; replaced by profile hamburger) */}
          <div className="mb-8 overflow-x-auto hidden sm:block">
            <div className="inline-flex items-center bg-white/5 rounded-xl p-1 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-500 text-white shadow'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Son Aktiviteler</h2>
                  <div className="glass rounded-xl p-6">
                    <p className="text-gray-400 text-center py-8">
                      Henüz aktivite bulunmuyor
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">Favori Filmlerim ({filteredFavorites.length}/{favoriteMovies.length})</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedGenreId}
                      onChange={(e) => setSelectedGenreId(e.target.value)}
                      className="input py-2 px-3"
                    >
                      <option value="">Tüm Türler</option>
                      {genreOptions.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {favorites.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Tüm favorileri temizlemek istediğinize emin misiniz?')) {
                            clearFavorites()
                          }
                        }}
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Tümünü Temizle
                      </button>
                    )}
                  </div>
                </div>
                
                {favoriteLoading && filteredFavorites.length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Favoriler yükleniyor...</p>
                  </div>
                ) : filteredFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {filteredFavorites.map((movie, index) => (
                      <div key={movie.id} className="relative group">
                        <MovieCard movie={movie} index={index} />
                        <button
                          onClick={async () => {
                            try { await userService.removeFavorite(movie.id) } catch {}
                            removeFromFavorites(movie.id)
                            setFavoriteMovies(prev => prev.filter(m => m.id !== movie.id))
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-xl p-12 text-center">
                    <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Henüz favori film eklemediniz</p>
                    <p className="text-gray-500 text-sm mt-2">Film detay sayfalarından favorilere ekleyebilirsiniz</p>
                  </div>
                )}
                {favoritePage < favoriteTotalPages && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setFavoritePage(p => p + 1)}
                      disabled={favoriteLoading}
                      className="btn btn-primary"
                    >
                      {favoriteLoading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Puanladığım Filmler ({stats.ratings})
                </h2>

                {ratedMovies.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {ratedMovies.filter(r => r && r.movie).map((rating, index) => (
                        <div key={rating.id} className="relative group">
                          <MovieCard movie={rating.movie} index={index} />
                          <div className="absolute top-3 left-3 glass px-2 py-1 rounded-lg flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-white font-semibold text-sm">
                              {rating.rating}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const res = await movieService.deleteRating(rating.movie.id)
                                if (res.success) {
                                  setRatedMovies(prev => prev.filter(r => r.id !== rating.id))
                                  setStats(s => ({ ...s, ratings: Math.max(0, (s.ratings || 0) - 1) }))
                                }
                              } catch {}
                            }}
                            className="absolute top-3 right-3 btn btn-secondary btn-sm"
                          >
                            Sil
                          </button>
                          {rating.comment && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-sm text-gray-300">
                                "{rating.comment}"
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {ratingsPage < ratingsTotalPages && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setRatingsPage(p => p + 1)}
                          disabled={ratingsLoading}
                          className="btn btn-primary"
                        >
                          {ratingsLoading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass rounded-xl p-12 text-center">
                    <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Henüz film puanlamadınız</p>
                    <p className="text-gray-500 text-sm mt-2">Film detay sayfalarından puan verebilirsiniz</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Yorumlarım ({stats.comments})</h2>
                {myComments.length > 0 ? (
                  <div className="space-y-4">
                    {myComments.map((c) => (
                      <div key={c.id} className="glass rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-gray-300 whitespace-pre-wrap flex-1">{c.content}</div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={async () => {
                              const ok = await userService.deleteComment(c.movie_id)
                              if (ok) {
                                setMyComments(prev => prev.filter(x => x.id !== c.id))
                                setStats(s => ({ ...s, comments: Math.max(0, (s.comments || 0) - 1) }))
                              }
                            }}
                          >
                            Sil
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(c.created_at).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))}
                    {commentsPage < commentsTotalPages && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => setCommentsPage(p => p + 1)}
                          disabled={commentsLoading}
                          className="btn btn-primary"
                        >
                          {commentsLoading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass rounded-xl p-12 text-center text-gray-400">Henüz yorum yok</div>
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Gelen İstekler</h2>
                  <div className="glass rounded-xl p-4">
                    {requests.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">Bekleyen istek yok</p>
                    ) : (
                      <ul className="divide-y divide-white/10">
                        {requests.map((r) => (
                          <li key={r.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              <img src={r.fromUser.avatar || `https://ui-avatars.com/api/?name=${r.fromUser.name || r.fromUser.username}&background=ef4444&color=fff`} alt={r.fromUser.name} className="w-8 h-8 rounded-full"/>
                              <div>
                                <p className="text-white text-sm font-medium">{r.fromUser.name || r.fromUser.username}</p>
                                <p className="text-gray-400 text-xs">@{r.fromUser.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button disabled={friendsBusy} onClick={() => acceptRequest(r.id, r.fromUser.id)} className="btn btn-primary btn-sm">
                                <Check className="w-4 h-4" />
                                Kabul Et
                              </button>
                              <button disabled={friendsBusy} onClick={() => rejectRequest(r.id, r.fromUser.id)} className="btn btn-secondary btn-sm">
                                <X className="w-4 h-4" />
                                Reddet
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Arkadaşlarım ({friends.length})</h2>
                  <div className="glass rounded-xl p-4">
                    {friends.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">Henüz arkadaş yok</p>
                    ) : (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {friends.map((f) => (
                          <li key={f.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <a href={`/u/${encodeURIComponent(f.username || f.id)}`} className="flex items-center gap-3 hover:opacity-90">
                              <img src={f.avatar || `https://ui-avatars.com/api/?name=${f.name || f.username}&background=ef4444&color=fff`} alt={f.name} className="w-8 h-8 rounded-full"/>
                              <div>
                                <p className="text-white text-sm font-medium">{f.name || f.username}</p>
                                <p className="text-gray-400 text-xs">@{f.username}</p>
                              </div>
                            </a>
                            <button disabled={friendsBusy} onClick={() => unfriend(f.id)} className="btn btn-secondary btn-sm">
                              <UserMinus className="w-4 h-4" />
                              Kaldır
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}



            {activeTab === 'recommendations' && (
              <div>
                <div className="space-y-8">
                  {/* Gelen Öneriler (İzlendi / İzlenmedi) */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Gelen Öneriler</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* İzlenmedi */}
                      <div className="glass rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">İzlemediklerim</h3>
                        {recommendationsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                            <p className="text-gray-400 mt-2">Yükleniyor...</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {receivedRecommendations.flatMap((rec) => (
                              (rec.items || []).filter(i => !i.isWatched).map((item) => (
                                <div key={`${rec.id}-${item.movie_id}`} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                                  {/* Mini poster placeholder */}
                                  <div className="w-10 h-14 rounded-md overflow-hidden bg-white/10">
                                    <img src={`https://image.tmdb.org/t/p/w92${item.poster_path || ''}`} alt="" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-white text-sm font-medium">{item.movie_title || rec.title}</div>
                                <div className="text-xs text-gray-400 mt-1">Kimden: {rec.from_user?.name || rec.from_user?.username || `@${rec.from_user_id}`}</div>
                                    {rec.note && <div className="text-xs text-gray-400 mt-1">{rec.note}</div>}
                                    <div className="text-[11px] text-gray-500 mt-1">{new Date(rec.created_at).toLocaleString('tr-TR')}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="btn btn-primary btn-xs"
                                      onClick={async ()=>{
                                        const res = await movieService.markAsWatched(item.movie_id)
                                        if (res?.success) toggleLocalRecommendationWatched(rec.id, item.movie_id, true)
                                      }}
                                    >İzledim</button>
                                    <button
                                      className="btn btn-secondary btn-xs"
                                      onClick={async ()=>{
                                        const ok = await recommendationService.deleteRecommendation(rec.id)
                                        if (ok?.success || ok) {
                                          setReceivedRecommendations(prev => prev.filter(r => r.id !== rec.id))
                                        }
                                      }}
                                    >Sil</button>
                                  </div>
                                </div>
                              ))
                            ))}
                            {receivedRecommendations.every(r => (r.items || []).every(i => i.isWatched)) && (
                              <p className="text-gray-400 text-center py-6">İzlemediğiniz öneri yok</p>
                            )}
                          </div>
                        )}
                      </div>
                      {/* İzledim */}
                      <div className="glass rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">İzlediklerim</h3>
                        {recommendationsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                            <p className="text-gray-400 mt-2">Yükleniyor...</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {receivedRecommendations.flatMap((rec) => (
                              (rec.items || []).filter(i => i.isWatched).map((item) => (
                                <div key={`${rec.id}-${item.movie_id}`} className="flex items-start gap-3 bg-white/5 rounded-lg p-3 opacity-80">
                                  <div className="w-10 h-14 rounded-md overflow-hidden bg-white/10">
                                    <img src={`https://image.tmdb.org/t/p/w92${item.poster_path || ''}`} alt="" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-white text-sm font-medium">{item.movie_title || rec.title}</div>
                                    <div className="text-xs text-gray-400 mt-1">Kimden: {rec.from_user?.name || rec.from_user?.username || `@${rec.from_user_id}`}</div>
                                    {rec.note && <div className="text-xs text-gray-400 mt-1">{rec.note}</div>}
                                    <div className="text-[11px] text-gray-500 mt-1">{new Date(rec.created_at).toLocaleString('tr-TR')}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="btn btn-secondary btn-xs"
                                      onClick={async ()=>{
                                        const res = await movieService.markAsUnwatched(item.movie_id)
                                        if (res?.success) toggleLocalRecommendationWatched(rec.id, item.movie_id, false)
                                      }}
                                    >İzlemedim</button>
                                    <button
                                      className="btn btn-secondary btn-xs"
                                      onClick={async ()=>{
                                        const ok = await recommendationService.deleteRecommendation(rec.id)
                                        if (ok?.success || ok) {
                                          setReceivedRecommendations(prev => prev.filter(r => r.id !== rec.id))
                                        }
                                      }}
                                    >Sil</button>
                                  </div>
                                </div>
                              ))
                            ))}
                            {receivedRecommendations.every(r => (r.items || []).every(i => !i.isWatched)) && (
                              <p className="text-gray-400 text-center py-6">İzlediğiniz öneri yok</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gönderilen Öneriler - mini kartlar */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Gönderilen Öneriler</h2>
                    <div className="glass rounded-xl p-4">
                      {recommendationsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                          <p className="text-gray-400 mt-2">Yükleniyor...</p>
                        </div>
                      ) : sentRecommendations.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Henüz öneri göndermediniz</p>
                      ) : (
                        <div className="space-y-3">
                          {sentRecommendations.flatMap((rec) => (
                            (rec.items || []).map((item) => (
                              <div key={`${rec.id}-${item.movie_id}`} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                                <div className="w-10 h-14 rounded-md overflow-hidden bg-white/10">
                                  <img src={`https://image.tmdb.org/t/p/w92${item.poster_path || ''}`} alt="" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />
                                </div>
                                <div className="flex-1">
                                  <div className="text-white text-sm font-medium">{item.movie_title || rec.title}</div>
                                  <div className="text-xs text-gray-400 mt-1">Kime: {rec.to_user?.name || rec.to_user?.username || `@${rec.to_user_id}`}</div>
                                  {rec.note && <div className="text-xs text-gray-400 mt-1">{rec.note}</div>}
                                  <div className="text-[11px] text-gray-500 mt-1">{new Date(rec.created_at).toLocaleString('tr-TR')}</div>
                                </div>
                              </div>
                            ))
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Hesap Ayarları</h2>
                <div className="space-y-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">E-posta Bildirimleri</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">Yeni filmler hakkında bildirim al</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">Haftalık öneriler</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                          defaultChecked
                        />
                      </label>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Gizlilik</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">Profilimi herkese açık yap</span>
                        <input
                          type="checkbox"
                          {...register('isPublic')}
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4">Tehlikeli Bölge</h3>
                    <button className="btn btn-secondary border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                      Hesabı Sil
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        {/* Spacer for mobile bottom nav */}
        <div className="h-20 sm:h-0" />
      </div>

      {/* Mobile Bottom Nav removed; Profile uses top hamburger for sections */}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Profili Düzenle</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Ad soyad gereklidir',
                      minLength: {
                        value: 3,
                        message: 'Ad soyad en az 3 karakter olmalıdır',
                      },
                    })}
                    className="input"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    {...register('username', {
                      required: 'Kullanıcı adı gereklidir',
                      pattern: {
                        value: /^[a-z0-9_]+$/,
                        message: 'Kullanıcı adı sadece küçük harf, rakam ve _ içerebilir',
                      },
                      minLength: {
                        value: 3,
                        message: 'Kullanıcı adı en az 3 karakter olmalıdır',
                      },
                    })}
                    className="input"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'E-posta gereklidir',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir e-posta adresi girin',
                    },
                  })}
                  className="input"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Biyografi
                </label>
                <textarea
                  {...register('bio', {
                    maxLength: {
                      value: 200,
                      message: 'Biyografi en fazla 200 karakter olabilir',
                    },
                  })}
                  rows={3}
                  className="input"
                  placeholder="Kendinizden bahsedin..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Konum
                </label>
                <input
                  type="text"
                  {...register('location')}
                  className="input"
                  placeholder="İstanbul, Türkiye"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Sosyal Medya</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Twitter Kullanıcı Adı
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-dark-300 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      {...register('twitter')}
                      className="input rounded-l-none"
                      placeholder="kullaniciadi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instagram Kullanıcı Adı
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-dark-300 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      {...register('instagram')}
                      className="input rounded-l-none"
                      placeholder="kullaniciadi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Letterboxd Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    {...register('letterboxd')}
                    className="input"
                    placeholder="kullaniciadi"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Profile