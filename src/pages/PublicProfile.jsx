import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Ban, Film, Flag, Heart, Star, ArrowLeft, UserPlus, UserMinus, Check, X, Share2, LockKeyhole } from 'lucide-react'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import RecommendationModal from '../components/RecommendationModal'
import { ProfileIdentityCard, ProfileStats } from '../components/ProfileIdentityCard'
import { EmptyState, WorkspacePanel } from '../components/WorkspaceUI'
import toast from 'react-hot-toast'

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState('none')
  const [busy, setBusy] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const [showRecommendModal, setShowRecommendModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportCategory, setReportCategory] = useState('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [reportBusy, setReportBusy] = useState(false)

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

  const handleBlock = async () => {
    if (!profile) return
    const confirmed = window.confirm(
      `Block @${profile.username}? Existing friendship will be removed and both accounts will be unable to find or contact each other.`,
    )
    if (!confirmed) return
    setBusy(true)
    try {
      await userService.blockUser(profile.id)
      toast.success(`@${profile.username} has been blocked.`)
      navigate('/profile/safety', { replace: true })
    } catch (error) {
      toast.error(error?.message || 'The account could not be blocked.')
    } finally {
      setBusy(false)
    }
  }

  const handleReport = async (event) => {
    event.preventDefault()
    if (!profile || reportDetails.trim().length < 10) return
    setReportBusy(true)
    try {
      await userService.reportUser(profile.id, reportCategory, reportDetails.trim())
      toast.success('Your report has been submitted for review.')
      setShowReportModal(false)
      setReportCategory('spam')
      setReportDetails('')
    } catch (error) {
      const messages = {
        duplicate_recent_report: 'You already submitted a matching report recently.',
        daily_report_limit_reached: 'Your daily report limit has been reached.',
        too_many_reports: 'Too many reports were submitted. Please try again later.',
      }
      toast.error(messages[error?.code] || error?.message || 'The report could not be submitted.')
    } finally {
      setReportBusy(false)
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
                    <button onClick={() => setShowReportModal(true)} disabled={busy} className="btn btn-secondary">
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                    <button
                      onClick={handleBlock}
                      disabled={busy}
                      className="btn btn-secondary border-red-500/50 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    >
                      <Ban className="w-4 h-4" />
                      Block
                    </button>
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
          }}
        />
      )}

      {showReportModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            className="ui-surface w-full max-w-lg p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="ui-eyebrow text-[#e85d4a]">Safety report</p>
                <h2 id="report-dialog-title" className="mt-2 font-display text-3xl text-[#f3efe6]">
                  Report @{profile.username}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#918e86]">
                  Reports are visible only to the moderation team. Include concrete context without sharing passwords or other sensitive information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                disabled={reportBusy}
                className="btn btn-secondary p-2"
                aria-label="Close report dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReport} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#d8d2c7]">Reason</span>
                <select
                  value={reportCategory}
                  onChange={(event) => setReportCategory(event.target.value)}
                  className="input"
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate_content">Inappropriate content</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#d8d2c7]">What happened?</span>
                <textarea
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value.slice(0, 2000))}
                  minLength={10}
                  maxLength={2000}
                  rows={6}
                  required
                  className="input resize-y"
                  placeholder="Describe the behavior and where you encountered it."
                />
                <span className="mt-2 block text-right font-mono text-[10px] text-[#77756f]">
                  {reportDetails.length}/2000
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowReportModal(false)} disabled={reportBusy} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportBusy || reportDetails.trim().length < 10}
                  className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reportBusy ? 'Submitting…' : 'Submit report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


