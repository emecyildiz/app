import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Film, Heart, Star, MapPin, ArrowLeft, UserPlus, UserMinus, Check, X, Share2 } from 'lucide-react'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import RecommendationModal from '../components/RecommendationModal'
import UserAvatar from '../components/UserAvatar'
import toast from 'react-hot-toast'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState('none')
  const [busy, setBusy] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const [showRecommendModal, setShowRecommendModal] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await userService.getPublicProfile(username)
        if (mounted) setProfile(data)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [username])

  useEffect(() => {
    let mounted = true
    const ensureStatus = async () => {
      if (!profile || !isAuthenticated) return
      if (user?.id && profile?.id && user.id === profile.id) {
        setFriendStatus('self')
        return
      }
      const status = await userService.getFriendStatus(profile.id)
      if (mounted) setFriendStatus(status)
    }
    ensureStatus()
    return () => { mounted = false }
  }, [profile, isAuthenticated, user])

  const handleSendRequest = async () => {
    if (!profile) return
    setBusy(true)
    try {
      const resp = await userService.sendFriendRequest(profile.id)
      if (resp?.status) setFriendStatus(resp.status)
    } finally {
      setBusy(false)
    }
  }

  const handleRespond = async (action) => {
    if (!profile) return
    setBusy(true)
    try {
      const resp = await userService.respondFriendRequest({ fromUserId: profile.id, action })
      if (resp?.status) {
        setFriendStatus(resp.status)
        if (action === 'accept') {
          const refreshedProfile = await userService.getPublicProfile(username)
          if (refreshedProfile) setProfile(refreshedProfile)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const handleUnfriend = async () => {
    if (!profile) return
    setBusy(true)
    try {
      const ok = await userService.unfriend(profile.id)
      if (ok) setFriendStatus('none')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-400">Loading...</div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">User not found</p>
          <Link to="/" className="btn btn-primary">
            Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative glass rounded-3xl overflow-hidden mb-8 shadow-xl"
        >
          {/* Decorative gradients */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-pink-500/10 rounded-full blur-3xl" />
          </div>
          {/* Subtle cover strip */}
          <div className="w-full h-28 sm:h-36 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-1 rounded-full bg-gradient-to-tr from-primary-500 to-pink-500">
                <div className="rounded-full bg-dark-200 p-1">
                  <UserAvatar
                    src={profile.avatar}
                    name={profile.name}
                    username={profile.username}
                    className="w-32 h-32 rounded-full object-cover"
                    fallbackClassName="text-4xl"
                  />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{profile.name || profile.username}</h1>
                <p className="text-base md:text-lg text-gray-400 mt-1">@{profile.username}</p>
                {profile.bio && <p className="text-gray-300 mt-3 max-w-2xl">{profile.bio}</p>}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm mt-3">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.memberSince && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>Member since: {new Date(profile.memberSince).toLocaleDateString('en-US')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full md:w-auto flex justify-center md:justify-end">
                {isAuthenticated && friendStatus !== 'self' && (
                  <div className="flex gap-2">
                    {friendStatus === 'none' && (
                      <button onClick={handleSendRequest} disabled={busy} className="btn btn-primary">
                        <UserPlus className="w-4 h-4" />
                        Add friend
                      </button>
                    )}
                    {friendStatus === 'pending_outgoing' && (
                      <button disabled className="btn btn-secondary opacity-70 cursor-not-allowed">
                        Request sent
                      </button>
                    )}
                    {friendStatus === 'pending_incoming' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleRespond('accept')} disabled={busy} className="btn btn-primary">
                          <Check className="w-4 h-4" />
                          Accept
                        </button>
                        <button onClick={() => handleRespond('reject')} disabled={busy} className="btn btn-secondary">
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                    {friendStatus === 'friends' && (
                      <div className="flex gap-2">
                        <button onClick={() => setShowRecommendModal(true)} disabled={busy} className="btn btn-primary">
                          <Share2 className="w-4 h-4" />
                          Send recommendation
                        </button>
                        <button onClick={handleUnfriend} disabled={busy} className="btn btn-secondary">
                          <UserMinus className="w-4 h-4" />
                          Remove friend
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {!isAuthenticated && (
                  <Link to="/login" className="btn btn-primary">Sign in</Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {profile.canViewDetails ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <div className="glass rounded-xl p-6 text-center">
              <Film className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">{profile.stats?.watchedMovies || 0}</p>
              <p className="text-gray-400">Movies watched</p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">{profile.stats?.ratings || 0}</p>
              <p className="text-gray-400">Ratings</p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">{profile.stats?.favorites || 0}</p>
              <p className="text-gray-400">Favorites</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="ui-surface px-6 py-10 text-center"
          >
            <p className="font-display text-3xl text-white">This viewing record is private.</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50">
              Profile details and activity become visible after the account owner accepts your friend request.
            </p>
          </motion.div>
        )}

        {/* Detailed favorites, ratings, and comments can be added here when the profile grants access. */}
      </div>

      {/* Recommendation Modal */}
      {profile && (
        <RecommendationModal
          isOpen={showRecommendModal}
          onClose={() => setShowRecommendModal(false)}
          toUserId={profile.id}
          toUser={{ avatar: profile.avatar, name: profile.name, username: profile.username }}
          onSuccess={() => {
            setShowRecommendModal(false)
            toast.success('Recommendation sent.')
          }}
        />
      )}
    </div>
  )
}


