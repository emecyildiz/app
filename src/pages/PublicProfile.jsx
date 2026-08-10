import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Film, Heart, Star, ArrowLeft, UserPlus, UserMinus, Check, X, Share2, LockKeyhole } from 'lucide-react'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import RecommendationModal from '../components/RecommendationModal'
import { ProfileIdentityCard, ProfileStats } from '../components/ProfileIdentityCard'
import { EmptyState, WorkspacePanel } from '../components/WorkspaceUI'
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
    <div className="min-h-screen-dvh pt-24 pb-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#918e86] transition hover:text-[#f3efe6]">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="ui-eyebrow">Public member page</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <ProfileIdentityCard
            profile={profile}
            memberSince={profile.memberSince}
            actions={
              <>
                {isAuthenticated && friendStatus !== 'self' && (
                  <>
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
                      <>
                        <button onClick={() => setShowRecommendModal(true)} disabled={busy} className="btn btn-primary">
                          <Share2 className="w-4 h-4" />
                          Send recommendation
                        </button>
                        <button onClick={handleUnfriend} disabled={busy} className="btn btn-secondary">
                          <UserMinus className="w-4 h-4" />
                          Remove friend
                        </button>
                      </>
                    )}
                  </>
                )}
                {!isAuthenticated && (
                  <Link to="/login" className="btn btn-primary">Sign in</Link>
                )}
              </>
            }
          />
        </motion.div>

        {profile.canViewDetails ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <ProfileStats items={[
              { label: 'watched', value: profile.stats?.watchedMovies || 0, icon: Film },
              { label: 'ratings', value: profile.stats?.ratings || 0, icon: Star },
              { label: 'favorites', value: profile.stats?.favorites || 0, icon: Heart },
            ]} />
            {!profile.stats?.watchedMovies && !profile.stats?.ratings && !profile.stats?.favorites && (
              <WorkspacePanel className="mt-8">
                <EmptyState
                  icon={Film}
                  title="The journal is still empty."
                  description="Watched films, ratings, and favorites will shape this member page over time."
                />
              </WorkspacePanel>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <WorkspacePanel>
              <EmptyState
                icon={LockKeyhole}
                title="This viewing record is private."
                description="Profile details and activity become visible after the account owner accepts your friend request."
              />
            </WorkspacePanel>
          </motion.div>
        )}
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


