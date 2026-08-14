import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Film, Star, Heart, Settings, LogOut, Edit2, Users, UserMinus, Check, X, MessageSquare, Share2, ArrowLeft, Ban, Flag, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/newAuthStore'
import { useFavoritesStore } from '../store/favoritesStore'
import { userService } from '../services/userService'
import { movieService } from '../services/movieService'
import { tmdbService } from '../services/tmdbService'
import recommendationService from '../services/recommendationService'
import MovieCard from '../components/MovieCard'
import UserAvatar from '../components/UserAvatar'
import { ProfileIdentityCard, ProfileStats } from '../components/ProfileIdentityCard'
import { EmptyState, WorkspacePanel, WorkspaceTabs } from '../components/WorkspaceUI'
import { useSocialNotifications } from '../context/SocialNotificationsContext'

const recommendationStatus = {
  pending: {
    label: 'Awaiting response',
    className: 'border-[#d8a34f]/35 bg-[#d8a34f]/10 text-[#e6bd78]',
  },
  accepted: {
    label: 'Interested',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  rejected: {
    label: 'Passed',
    className: 'border-white/15 bg-white/[0.04] text-[#918e86]',
  },
}

const reportStatus = {
  pending: {
    label: 'Awaiting review',
    className: 'border-[#d8a34f]/35 bg-[#d8a34f]/10 text-[#e6bd78]',
  },
  reviewing: {
    label: 'Under review',
    className: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  },
  resolved: {
    label: 'Resolved',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  dismissed: {
    label: 'Dismissed',
    className: 'border-white/15 bg-white/[0.04] text-[#918e86]',
  },
}

const Profile = () => {
  const { user, profile, updateProfile, signOut, deleteAccount, isLoading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { section } = useParams()
  const { favorites, removeFromFavorites, getFavoritesCount, clearFavorites } = useFavoritesStore()
  const {
    hasNewRecommendation,
    hasPendingFriendRequest,
    markRecommendationsViewed,
    refreshNotifications,
  } = useSocialNotifications()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Friends state
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [friendsBusy, setFriendsBusy] = useState(false)

  // Safety state
  const [blockedUsers, setBlockedUsers] = useState([])
  const [myReports, setMyReports] = useState([])
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [safetyActionId, setSafetyActionId] = useState(null)

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
      twitter: profile?.social_links?.twitter || '',
      instagram: profile?.social_links?.instagram || '',
      letterboxd: profile?.social_links?.letterboxd || '',
      isPublic: (profile?.social_links?.privacy || 'public') !== 'private',
    },
  })

  useEffect(() => {
    setValue('isPublic', (profile?.social_links?.privacy || 'public') !== 'private')
  }, [profile?.social_links?.privacy, setValue])

  const onSubmit = async (data) => {
    try {
      const updates = {
        name: data.name,
        username: data.username,
        bio: data.bio,
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
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Profile could not be updated: ' + (error?.message || 'Unknown error'))
    }
  }

  const savePrivacy = async () => {
    await updateProfile({ isPublic: watch('isPublic') })
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

  // Load movie ratings.
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
            .filter(r => r && (!r.movie || !r.movie.poster_path))
            .map(r => Number(r?.movie?.id || r?.movie_id))
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
          if (!extra && r?.movie) return r
          const fallbackTitle = r?.movie?.title || extra?.title || (mid ? `#${mid}` : 'Unknown')
          return {
            ...r,
            movie: {
              ...(r.movie || {}),
              id: r?.movie?.id || mid || r?.movie_id,
              title: fallbackTitle,
              poster_path: r?.movie?.poster_path ?? extra?.poster_path ?? null,
              backdrop_path: r?.movie?.backdrop_path ?? extra?.backdrop_path ?? null,
              release_date: r?.movie?.release_date ?? extra?.release_date ?? null,
              vote_average: r?.movie?.vote_average ?? extra?.vote_average ?? 0,
              overview: r?.movie?.overview ?? extra?.overview ?? '',
              runtime: r?.movie?.runtime ?? extra?.runtime ?? null,
            }
          }
        })

        if (mounted) {
          setRatedMovies(prev => ratingsPage === 1 ? enriched : [...prev, ...enriched])
          setRatingsTotalPages(data.totalPages)
        }
      } catch (error) {
        toast.error('Rated movies could not be loaded.')
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
  const [receivedRecommendationsPage, setReceivedRecommendationsPage] = useState(1)
  const [sentRecommendationsPage, setSentRecommendationsPage] = useState(1)
  const [receivedRecommendationsTotalPages, setReceivedRecommendationsTotalPages] = useState(0)
  const [sentRecommendationsTotalPages, setSentRecommendationsTotalPages] = useState(0)
  const [recommendationActionId, setRecommendationActionId] = useState(null)
  const [recommendationsRefreshKey, setRecommendationsRefreshKey] = useState(0)

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
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'favorites', label: 'My favorites', icon: Heart },
    { id: 'ratings', label: 'My ratings', icon: Star },
    { id: 'comments', label: 'My comments', icon: MessageSquare },
    { id: 'recommendations', label: 'Recommendations', icon: Share2, dot: hasNewRecommendation },
    { id: 'friends', label: 'Friends', icon: Users, dot: hasPendingFriendRequest },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Load recommendations when recommendations tab is active
  useEffect(() => {
    let mounted = true
    const loadRecommendations = async () => {
      if (activeTab !== 'recommendations') return
      try {
        setRecommendationsLoading(true)
        const [received, sent, watchedSet] = await Promise.all([
          recommendationService.getRecommendations('received', null, receivedRecommendationsPage, 10),
          recommendationService.getRecommendations('sent', null, sentRecommendationsPage, 10),
          movieService.getWatchedIds()
        ])

        const hydrate = (rec) => ({
          ...rec,
          items: (rec.items || []).map(it => ({
            ...it,
            isWatched: watchedSet.has(Number(it.movie_id)),
            movie_title: it.movie_title || `Movie #${it.movie_id}`
          }))
        })

        if (mounted) {
          setReceivedRecommendations((received?.items || []).map(hydrate))
          setSentRecommendations((sent?.items || []).map(hydrate))
          setReceivedRecommendationsTotalPages(received?.totalPages || 0)
          setSentRecommendationsTotalPages(sent?.totalPages || 0)
          if (received?.currentPage && received.currentPage !== receivedRecommendationsPage) {
            setReceivedRecommendationsPage(received.currentPage)
          }
          if (sent?.currentPage && sent.currentPage !== sentRecommendationsPage) {
            setSentRecommendationsPage(sent.currentPage)
          }
        }
      } catch (error) {
        console.error('Error loading recommendations:', error)
        toast.error('Recommendations could not be loaded.')
      } finally {
        if (mounted) setRecommendationsLoading(false)
      }
    }
    loadRecommendations()
    return () => { mounted = false }
  }, [activeTab, receivedRecommendationsPage, sentRecommendationsPage, recommendationsRefreshKey])

  useEffect(() => {
    if (activeTab === 'recommendations') markRecommendationsViewed()
  }, [activeTab, markRecommendationsViewed])

  // Refetch data when tab becomes visible (after switching tabs/browsers)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Trigger refetch for active tab
        if (activeTab === 'recommendations') {
          setRecommendationsRefreshKey((value) => value + 1)
        } else if (activeTab === 'ratings') {
          setRatingsLoading(true)
        } else if (activeTab === 'comments') {
          setCommentsLoading(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [activeTab])

  useEffect(() => {
    let mounted = true
    const loadSafetyData = async () => {
      if (activeTab !== 'safety') return
      setSafetyLoading(true)
      try {
        const [blocks, reports] = await Promise.all([
          userService.getBlockedUsers(1, 50),
          userService.getMyReports(1, 20),
        ])
        if (mounted) {
          setBlockedUsers(Array.isArray(blocks?.items) ? blocks.items : [])
          setMyReports(Array.isArray(reports?.items) ? reports.items : [])
        }
      } catch (error) {
        if (mounted) toast.error(error?.message || 'Safety information could not be loaded.')
      } finally {
        if (mounted) setSafetyLoading(false)
      }
    }
    loadSafetyData()
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
      if (!user?.id) return
      try {
        const list = await userService.listFriends()
        if (mounted) setFriends(list || [])
      } catch (_) {}
    }
    preloadFriends()
    return () => { mounted = false }
  }, [user?.id])

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
        await refreshNotifications()
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
        await refreshNotifications()
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

  const unblockUser = async (blockedUser) => {
    setSafetyActionId(blockedUser.id)
    try {
      const result = await userService.unblockUser(blockedUser.id)
      if (result?.removed) {
        setBlockedUsers((current) => current.filter((item) => item.id !== blockedUser.id))
        toast.success(`@${blockedUser.username} has been unblocked.`)
      } else {
        setBlockedUsers((current) => current.filter((item) => item.id !== blockedUser.id))
        toast.success('The account was already unblocked.')
      }
    } catch (error) {
      toast.error(error?.message || 'The account could not be unblocked.')
    } finally {
      setSafetyActionId(null)
    }
  }

  const respondToRecommendation = async (recommendationId, status) => {
    setRecommendationActionId(`${recommendationId}:response`)
    try {
      const result = await recommendationService.respondToRecommendation(recommendationId, status)
      if (result?.success) {
        setReceivedRecommendations((current) => current.map((recommendation) => (
          recommendation.id === recommendationId ? { ...recommendation, status } : recommendation
        )))
        toast.success(status === 'accepted' ? 'Marked as interesting.' : 'Recommendation passed.')
      }
    } catch (error) {
      toast.error(error?.message || 'The recommendation could not be updated.')
    } finally {
      setRecommendationActionId(null)
    }
  }

  const setRecommendationWatched = async (recommendationId, item, shouldBeWatched) => {
    setRecommendationActionId(`${recommendationId}:${item.movie_id}`)
    try {
      const result = shouldBeWatched
        ? await movieService.markAsWatched(item.movie_id, {
            id: Number(item.movie_id),
            title: item.movie_title,
            poster_path: item.poster_path,
          })
        : await movieService.markAsUnwatched(item.movie_id)
      if (result?.success) {
        toggleLocalRecommendationWatched(recommendationId, item.movie_id, shouldBeWatched)
        toast.success(shouldBeWatched ? 'Added to watched movies.' : 'Removed from watched movies.')
      } else {
        toast.error(result?.error || 'Watch history could not be updated.')
      }
    } finally {
      setRecommendationActionId(null)
    }
  }

  const hideRecommendation = async (recommendationId, type) => {
    setRecommendationActionId(`${recommendationId}:delete`)
    try {
      const result = await recommendationService.deleteRecommendation(recommendationId)
      if (result?.success) {
        const isReceived = type === 'received'
        const currentItems = isReceived ? receivedRecommendations : sentRecommendations
        const currentPage = isReceived ? receivedRecommendationsPage : sentRecommendationsPage
        if (currentItems.length === 1 && currentPage > 1) {
          if (isReceived) setReceivedRecommendationsPage((page) => page - 1)
          else setSentRecommendationsPage((page) => page - 1)
        } else {
          setRecommendationsRefreshKey((value) => value + 1)
        }
        toast.success(isReceived ? 'Recommendation removed from your inbox.' : 'Recommendation removed from sent history.')
      }
    } catch (error) {
      toast.error(error?.message || 'The recommendation could not be removed.')
    } finally {
      setRecommendationActionId(null)
    }
  }

  const renderRecommendationCard = (recommendation, type) => {
    const isReceived = type === 'received'
    const person = isReceived ? recommendation.from_user : recommendation.to_user
    const status = recommendationStatus[recommendation.status] || recommendationStatus.pending
    const deleteBusy = recommendationActionId === `${recommendation.id}:delete`
    const responseBusy = recommendationActionId === `${recommendation.id}:response`

    return (
      <article key={recommendation.id} className="border border-white/10 bg-[#11120f]">
        <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              src={person?.avatar}
              name={person?.name}
              username={person?.username}
              className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
              fallbackClassName="text-xs"
            />
            <div className="min-w-0">
              <p className="ui-eyebrow">{isReceived ? 'From' : 'To'}</p>
              <p className="truncate text-sm font-medium text-[#f3efe6]">
                {person?.name || person?.username || 'Unavailable member'}
              </p>
              {person?.username && <p className="truncate text-xs text-[#77756f]">@{person.username}</p>}
            </div>
          </div>
          <span className={`w-fit border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${status.className}`}>
            {status.label}
          </span>
        </header>

        <div className="px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div>
              <h3 className="font-display text-xl text-[#f3efe6]">{recommendation.title}</h3>
              {recommendation.note && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa79f]">{recommendation.note}</p>}
            </div>
            <time className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#66645f]" dateTime={recommendation.created_at}>
              {new Date(recommendation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </time>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(recommendation.items || []).map((item) => {
              const itemBusy = recommendationActionId === `${recommendation.id}:${item.movie_id}`
              return (
                <div key={item.id || item.movie_id} className="flex min-w-0 gap-3 border border-white/10 bg-black/20 p-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/movies/${item.movie_id}`)}
                    className="h-20 w-14 shrink-0 overflow-hidden bg-white/[0.04] text-[#77756f] transition hover:opacity-80"
                    aria-label={`Open ${item.movie_title}`}
                  >
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w154${item.poster_path}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Film className="m-auto h-full w-5" strokeWidth={1.4} />
                    )}
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/movies/${item.movie_id}`)}
                      className="line-clamp-2 text-left text-sm font-medium leading-5 text-[#f3efe6] transition hover:text-[#e85d4a]"
                    >
                      {item.movie_title}
                    </button>
                    <button
                      type="button"
                      disabled={itemBusy}
                      onClick={() => setRecommendationWatched(recommendation.id, item, !item.isWatched)}
                      className="w-fit border border-white/15 px-2.5 py-1.5 text-xs text-[#aaa79f] transition hover:border-[#e85d4a]/50 hover:text-[#f3efe6] disabled:cursor-wait disabled:opacity-50"
                    >
                      {itemBusy ? 'Updating…' : (item.isWatched ? 'Mark as unwatched' : 'Mark as watched')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap gap-2">
            {isReceived && recommendation.status === 'pending' && (
              <>
                <button
                  type="button"
                  disabled={responseBusy}
                  onClick={() => respondToRecommendation(recommendation.id, 'accepted')}
                  className="btn btn-primary"
                >
                  <Check className="h-4 w-4" /> Interested
                </button>
                <button
                  type="button"
                  disabled={responseBusy}
                  onClick={() => respondToRecommendation(recommendation.id, 'rejected')}
                  className="btn btn-secondary"
                >
                  <X className="h-4 w-4" /> Pass
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            disabled={deleteBusy}
            onClick={() => hideRecommendation(recommendation.id, type)}
            className="w-fit text-xs text-[#77756f] underline decoration-white/20 underline-offset-4 transition hover:text-[#e85d4a] disabled:cursor-wait disabled:opacity-50"
          >
            {deleteBusy ? 'Removing…' : (isReceived ? 'Remove from inbox' : 'Remove from sent history')}
          </button>
        </footer>
      </article>
    )
  }

  const renderRecommendationPagination = (page, totalPages, setPage, label) => {
    if (totalPages <= 1) return null
    return (
      <nav aria-label={`${label} pagination`} className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
        <button
          type="button"
          disabled={page <= 1 || recommendationsLoading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#77756f]">Page {page} of {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages || recommendationsLoading}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </nav>
    )
  }

  const handleDeleteAccount = async () => {
    const result = await deleteAccount()
    if (result.success) {
      setShowDeleteConfirm(false)
    }
  }

  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen-dvh pt-24 pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' ? (
          <>
            {/* Profile identity */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <ProfileIdentityCard
                profile={profile}
                memberSince={stats.memberSince}
                label="Your film journal"
                actions={
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="btn btn-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit profile
                    </button>
                    <button onClick={signOut} className="btn btn-secondary">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </>
                }
              />
            </motion.div>

            {/* Journal metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <ProfileStats items={[
                { label: 'watched', value: stats.watchedMovies, icon: Film },
                { label: 'ratings', value: stats.ratings, icon: Star },
                { label: 'favorites', value: stats.favorites, icon: Heart },
                { label: 'friends', value: friends.length, icon: Users },
              ]} />
            </motion.div>
          </>
        ) : (
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => navigate('/profile/overview')} className="btn btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
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
          <WorkspaceTabs items={tabs} active={activeTab} onChange={setActiveTab} label="Profile sections" />

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <WorkspacePanel
                eyebrow="Overview"
                title="Recent journal activity"
                description="Your latest ratings, favorites, and watched films will collect here."
                className="mt-8"
              >
                <EmptyState
                  icon={Film}
                  title="Nothing recorded yet."
                  description="Explore the catalog and start rating or saving films to build your journal."
                  action={<button onClick={() => navigate('/movies')} className="ui-button-primary">Browse films</button>}
                />
              </WorkspacePanel>
            )}

            {activeTab === 'favorites' && (
              <div>
                <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">My favorite films ({filteredFavorites.length}/{favoriteMovies.length})</h2>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedGenreId}
                      onChange={(e) => setSelectedGenreId(e.target.value)}
                      className="input py-2 px-3"
                    >
                      <option value="">All genres</option>
                      {genreOptions.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {favorites.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to clear all favorites?')) {
                            clearFavorites()
                          }
                        }}
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                
                {favoriteLoading && filteredFavorites.length === 0 ? (
                  <div className="glass rounded-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading favorites...</p>
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
                    <p className="text-gray-400 text-lg">You have not added any favorite movies</p>
                    <p className="text-gray-500 text-sm mt-2">Add favorites from a movie detail page</p>
                  </div>
                )}
                {favoritePage < favoriteTotalPages && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setFavoritePage(p => p + 1)}
                      disabled={favoriteLoading}
                      className="btn btn-primary"
                    >
                      {favoriteLoading ? 'Loading...' : 'Show more'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  My rated movies ({stats.ratings})
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
                            Delete
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
                          {ratingsLoading ? 'Loading...' : 'Show more'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass rounded-xl p-12 text-center">
                    <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">You have not rated any movies</p>
                    <p className="text-gray-500 text-sm mt-2">Rate a movie from its detail page</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">My comments ({stats.comments})</h2>
                {myComments.length > 0 ? (
                  <div className="space-y-4">
                    {myComments.map((c) => (
                      <div key={c.id} className="glass rounded-xl p-4">
                        <div className="flex gap-4">
                          {/* Movie poster */}
                          {c.movie && (
                            <a 
                              href={`/movie/${c.movie_id}`}
                              className="flex-shrink-0 group"
                            >
                              <img
                                src={c.movie.poster_path ? `https://image.tmdb.org/t/p/w92${c.movie.poster_path}` : '/placeholder-movie.png'}
                                alt={c.movie.title || 'Movie'}
                                className="w-16 h-24 object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform"
                              />
                            </a>
                          )}
                          
                          {/* Comment content */}
                          <div className="flex-1 flex flex-col">
                            {c.movie && (
                              <a 
                                href={`/movie/${c.movie_id}`}
                                className="text-primary-400 hover:text-primary-300 font-semibold mb-2 transition-colors"
                              >
                                {c.movie.title || `Movie #${c.movie_id}`}
                              </a>
                            )}
                            <div className="text-gray-300 whitespace-pre-wrap flex-1">{c.content}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(c.created_at).toLocaleString('en-US')}
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            className="btn btn-secondary btn-sm self-start"
                            onClick={async () => {
                              const ok = await userService.deleteComment(c.movie_id)
                              if (ok) {
                                setMyComments(prev => prev.filter(x => x.id !== c.id))
                                setStats(s => ({ ...s, comments: Math.max(0, (s.comments || 0) - 1) }))
                              }
                            }}
                          >
                            Delete
                          </button>
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
                          {commentsLoading ? 'Loading...' : 'Show more'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass rounded-xl p-12 text-center text-gray-400">No comments yet</div>
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Incoming requests</h2>
                  <div className="glass rounded-xl p-4">
                    {requests.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">No pending requests</p>
                    ) : (
                      <ul className="divide-y divide-white/10">
                        {requests.map((r) => r.fromUser?.id ? (
                          <li key={r.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar src={r.fromUser.avatar} name={r.fromUser.name} username={r.fromUser.username} className="w-8 h-8 rounded-full object-cover" fallbackClassName="text-xs" />
                              <div>
                                <p className="text-white text-sm font-medium">{r.fromUser.name || r.fromUser.username}</p>
                                <p className="text-gray-400 text-xs">@{r.fromUser.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button disabled={friendsBusy} onClick={() => acceptRequest(r.id, r.fromUser.id)} className="btn btn-primary btn-sm">
                                <Check className="w-4 h-4" />
                                Accept
                              </button>
                              <button disabled={friendsBusy} onClick={() => rejectRequest(r.id, r.fromUser.id)} className="btn btn-secondary btn-sm">
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </li>
                        ) : null)}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">My friends ({friends.length})</h2>
                  <div className="glass rounded-xl p-4">
                    {friends.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">No friends yet</p>
                    ) : (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {friends.map((f) => (
                          <li key={f.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <a href={`/u/${encodeURIComponent(f.username || f.id)}`} className="flex items-center gap-3 hover:opacity-90">
                              <UserAvatar src={f.avatar} name={f.name} username={f.username} className="w-8 h-8 rounded-full object-cover" fallbackClassName="text-xs" />
                              <div>
                                <p className="text-white text-sm font-medium">{f.name || f.username}</p>
                                <p className="text-gray-400 text-xs">@{f.username}</p>
                              </div>
                            </a>
                            <button disabled={friendsBusy} onClick={() => unfriend(f.id)} className="btn btn-secondary btn-sm">
                              <UserMinus className="w-4 h-4" />
                              Remove
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
              <div className="space-y-8">
                <WorkspacePanel
                  eyebrow="Your inbox"
                  title="Received recommendations"
                  description="Decide whether a suggestion interests you, and track each movie separately in your watch history."
                >
                  <div className="p-4 sm:p-6">
                    {recommendationsLoading ? (
                      <div className="flex min-h-48 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#e85d4a]" />
                      </div>
                    ) : receivedRecommendations.length === 0 ? (
                      <EmptyState
                        icon={Share2}
                        title="No recommendations here"
                        description="Recommendations from accepted friends will appear in this inbox."
                      />
                    ) : (
                      <div className="space-y-4">
                        {receivedRecommendations.map((recommendation) => renderRecommendationCard(recommendation, 'received'))}
                        {renderRecommendationPagination(
                          receivedRecommendationsPage,
                          receivedRecommendationsTotalPages,
                          setReceivedRecommendationsPage,
                          'Received recommendations',
                        )}
                      </div>
                    )}
                  </div>
                </WorkspacePanel>

                <WorkspacePanel
                  eyebrow="Delivery history"
                  title="Sent recommendations"
                  description="Review what you shared and whether the recipient marked it as interesting or passed."
                >
                  <div className="p-4 sm:p-6">
                    {recommendationsLoading ? (
                      <div className="flex min-h-48 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#e85d4a]" />
                      </div>
                    ) : sentRecommendations.length === 0 ? (
                      <EmptyState
                        icon={Share2}
                        title="Nothing sent yet"
                        description="Recommendations you send to accepted friends will remain available here."
                      />
                    ) : (
                      <div className="space-y-4">
                        {sentRecommendations.map((recommendation) => renderRecommendationCard(recommendation, 'sent'))}
                        {renderRecommendationPagination(
                          sentRecommendationsPage,
                          sentRecommendationsTotalPages,
                          setSentRecommendationsPage,
                          'Sent recommendations',
                        )}
                      </div>
                    )}
                  </div>
                </WorkspacePanel>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="mx-auto max-w-4xl space-y-8">
                <WorkspacePanel
                  eyebrow="Account controls"
                  title="Blocked accounts"
                  description="Blocked accounts cannot find your profile, send friend requests, or exchange recommendations with you. Unblocking does not restore an old friendship."
                >
                  {safetyLoading ? (
                    <div className="flex min-h-48 items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#e85d4a]" />
                    </div>
                  ) : blockedUsers.length === 0 ? (
                    <EmptyState
                      icon={Ban}
                      title="No blocked accounts"
                      description="Accounts you block from a public profile will appear here."
                    />
                  ) : (
                    <ul className="divide-y divide-white/10 px-5 sm:px-6">
                      {blockedUsers.map((blockedUser) => (
                        <li key={blockedUser.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar
                              src={blockedUser.avatar}
                              name={blockedUser.name}
                              username={blockedUser.username}
                              className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
                              fallbackClassName="text-xs"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#f3efe6]">
                                {blockedUser.name || blockedUser.username}
                              </p>
                              <p className="truncate text-xs text-[#918e86]">@{blockedUser.username}</p>
                              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#66645f]">
                                Blocked {new Date(blockedUser.blocked_at).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => unblockUser(blockedUser)}
                            disabled={safetyActionId === blockedUser.id}
                            className="btn btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Shield className="h-4 w-4" />
                            {safetyActionId === blockedUser.id ? 'Unblocking…' : 'Unblock'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </WorkspacePanel>

                <WorkspacePanel
                  eyebrow="Moderation history"
                  title="Your reports"
                  description="Track the review state of reports you submitted. Internal moderation notes and actions remain private."
                >
                  {safetyLoading ? (
                    <div className="flex min-h-48 items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#e85d4a]" />
                    </div>
                  ) : myReports.length === 0 ? (
                    <EmptyState
                      icon={Flag}
                      title="No reports submitted"
                      description="Reports you send from another member's public profile will appear here."
                    />
                  ) : (
                    <ul className="divide-y divide-white/10 px-5 sm:px-6">
                      {myReports.map((report) => {
                        const status = reportStatus[report.status] || reportStatus.pending
                        const reportedUser = report.reported_user || {}
                        return (
                          <li key={report.id} className="py-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <UserAvatar
                                  src={reportedUser.avatar}
                                  name={reportedUser.name}
                                  username={reportedUser.username}
                                  className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
                                  fallbackClassName="text-xs"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[#f3efe6]">
                                    {reportedUser.name || reportedUser.username || 'Unavailable account'}
                                  </p>
                                  {reportedUser.username && <p className="truncate text-xs text-[#918e86]">@{reportedUser.username}</p>}
                                </div>
                              </div>
                              <span className={`w-fit shrink-0 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${status.className}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="mt-4 flex flex-col gap-1 border-l border-white/10 pl-4 text-xs text-[#918e86] sm:flex-row sm:items-center sm:gap-3">
                              <span className="capitalize">{String(report.category || 'other').replaceAll('_', ' ')}</span>
                              <span className="hidden text-[#55534f] sm:inline">/</span>
                              <time dateTime={report.created_at}>
                                Submitted {new Date(report.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                })}
                              </time>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </WorkspacePanel>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Account settings</h2>
                <div className="space-y-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Account email</h3>
                    <p className="text-white font-medium break-all">{user?.email}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      This address is used for sign-in, verification, and account recovery. Email changes and optional notification subscriptions are not currently available.
                    </p>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Privacy</h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-400">
                      Private profiles remain discoverable so people can send friend requests, but activity and profile details are visible only to accepted friends.
                    </p>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">Make my profile public</span>
                        <input
                          type="checkbox"
                          {...register('isPublic')}
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={savePrivacy}
                        disabled={isLoading}
                        className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save privacy setting'}
                      </button>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4">Danger zone</h3>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading}
                      className="btn btn-secondary border-red-500 text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete account
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 rounded-lg p-6 max-w-sm mx-auto border border-red-900/50"
          >
            <h2 className="text-2xl font-bold text-red-400 mb-2">Delete account</h2>
            <p className="text-gray-300 mb-6">
              This action cannot be undone. All account data will be deleted. Continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1 btn btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
            <h3 className="text-2xl font-bold text-white mb-6">Edit profile</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    {...register('name', {
                      required: 'Your full name is required.',
                      minLength: {
                        value: 3,
                        message: 'Your name must contain at least three characters.',
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
                    Username
                  </label>
                  <input
                    type="text"
                    {...register('username', {
                      required: 'A username is required.',
                      pattern: {
                        value: /^[a-z0-9_]+$/,
                        message: 'The username may contain lowercase letters, numbers, and underscores.',
                      },
                      minLength: {
                        value: 3,
                        message: 'The username must contain at least three characters.',
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
                  Email
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="input opacity-70 cursor-not-allowed"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">Email changes require a separate verification flow and are currently disabled.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Biography
                </label>
                <textarea
                  {...register('bio', {
                    maxLength: {
                      value: 200,
                      message: 'Biography must not exceed 200 characters.',
                    },
                  })}
                  rows={3}
                  className="input"
                  placeholder="Tell people a little about yourself..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Social media</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Twitter username
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-dark-300 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      {...register('twitter')}
                      className="input rounded-l-none"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instagram username
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-dark-300 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      {...register('instagram')}
                      className="input rounded-l-none"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Letterboxd username
                  </label>
                  <input
                    type="text"
                    {...register('letterboxd')}
                    className="input"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Save
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
