import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ChartBarIcon,
  CogIcon,
  PencilIcon,
  ShieldCheckIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/newAuthStore'
import { userService } from '../services/userService'
import { MetricStrip, WorkspacePage, WorkspacePanel, WorkspaceTabs } from '../components/WorkspaceUI'

export default function ModeratorDashboard() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    username: '',
    bio: '',
    location: '',
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const canModerate = profile?.role === 'MODERATOR' || profile?.role === 'ADMIN'
    if (!canModerate) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const usersData = await userService.getAllUsers()
        setUsers(usersData || [])
      } catch (error) {
        console.error('Error loading moderator data:', error)
        toast.error('Data could not be loaded.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile?.role])

  if (!profile || (profile.role !== 'MODERATOR' && profile.role !== 'ADMIN')) {
    return <Navigate to="/" replace />
  }

  const standardUsers = users.filter((userItem) => userItem.role === 'USER')

  const handleViewUser = (userItem) => {
    setSelectedUser(userItem)
    setEditForm({
      name: userItem.name || '',
      email: userItem.email || '',
      username: userItem.username || '',
      bio: userItem.bio || '',
      location: userItem.location || '',
    })
    setShowUserDetails(true)
  }

  const handleUpdateUser = async (event) => {
    event.preventDefault()

    if (!editForm.name || !editForm.email) {
      toast.error('Please complete all required fields.')
      return
    }

    try {
      await userService.updateUser(selectedUser.id, editForm)
      setShowUserDetails(false)
      setSelectedUser(null)
      const usersData = await userService.getAllUsers()
      setUsers(usersData || [])
      toast.success('User updated.')
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('The user could not be updated.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      await userService.deleteUser(userId)
      const usersData = await userService.getAllUsers()
      setUsers(usersData || [])
      toast.success('User deleted.')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('The user could not be deleted.')
    }
  }

  const moderatorTabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Members', icon: UsersIcon },
    { id: 'profile', label: 'My profile', icon: CogIcon },
  ]

  return (
    <WorkspacePage
      eyebrow="Review workspace"
      title="Moderation"
      description="Review standard member accounts without exposing administrator controls or deployment settings."
      badge={`${profile.role === 'ADMIN' ? 'Administrator' : 'Moderator'} access`}
    >
      <MetricStrip
        items={[
          { label: 'Standard members', value: standardUsers.length, icon: UsersIcon },
          { label: 'Directory records', value: users.length, icon: ChartBarIcon },
          { label: 'Access level', value: profile.role === 'ADMIN' ? 'Admin' : 'Moderator', icon: ShieldCheckIcon },
          { label: 'Scope', value: 'Accounts', icon: CogIcon, note: 'No deployment access' },
        ]}
      />

      <WorkspaceTabs items={moderatorTabs} active={activeTab} onChange={setActiveTab} label="Moderation sections" />

      {activeTab === 'overview' && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <WorkspacePanel
            eyebrow="Session summary"
            title="Account review access"
            description="Your role can review and maintain standard member records. Administrator and moderator accounts remain outside this list."
          >
            <dl className="grid sm:grid-cols-2">
              <SummaryItem label="Signed in as" value={profile?.name || user?.email?.split('@')[0]} />
              <SummaryItem label="Email" value={user?.email} />
              <SummaryItem label="Permission" value={profile?.role === 'ADMIN' ? 'Administrator' : 'Moderator'} accent />
              <SummaryItem
                label="Last sign-in"
                value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US') : 'Unknown'}
              />
            </dl>
          </WorkspacePanel>

          <WorkspacePanel eyebrow="Shortcuts" title="Continue reviewing">
            <div className="space-y-3 p-5 sm:p-6">
              <button type="button" onClick={() => setActiveTab('users')} className="ui-button-primary w-full px-4">
                <UsersIcon className="h-4 w-4" />
                Review members
              </button>
              <button type="button" onClick={() => navigate('/profile/settings')} className="ui-button-secondary w-full px-4">
                <CogIcon className="h-4 w-4" />
                Open profile settings
              </button>
            </div>
          </WorkspacePanel>
        </div>
      )}

      {activeTab === 'users' && (
        <WorkspacePanel
          eyebrow="Directory"
          title="Standard members"
          description="Edit or remove standard accounts. Privileged accounts are intentionally excluded from moderator actions."
          className="mt-8"
        >
          <div className="overflow-x-auto">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center">Loading member records...</td>
                  </tr>
                ) : standardUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No standard members found.</td>
                  </tr>
                ) : (
                  standardUsers.map((userItem) => (
                    <tr key={userItem.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-[#1c1d19]">
                            <span className="text-sm font-medium text-[#f3efe6]">
                              {userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="whitespace-nowrap font-medium text-[#f3efe6]">
                              {formatName(userItem.name) || 'Unnamed user'}
                            </p>
                            <p className="whitespace-nowrap text-xs text-[#77756f]">
                              @{userItem.username?.replace('@', '') || 'username'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{userItem.email}</td>
                      <td><span className="role-badge">User</span></td>
                      <td>{formatDate(userItem.memberSince || userItem.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-4">
                          <button type="button" onClick={() => handleViewUser(userItem)} className="table-action">
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteUser(userItem.id)} className="table-action text-[#f48a79]">
                            <TrashIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </WorkspacePanel>
      )}

      {activeTab === 'profile' && (
        <WorkspacePanel
          eyebrow="Personal settings"
          title="Your public identity"
          description="Profile details use the same working settings page as every other account; there is no disconnected duplicate form here."
          className="mt-8"
          action={
            <button type="button" onClick={() => navigate('/profile/settings')} className="ui-button-primary min-h-10 px-4">
              Open profile settings
            </button>
          }
        >
          <dl className="grid sm:grid-cols-3">
            <SummaryItem label="Display name" value={profile?.name || 'Not set'} />
            <SummaryItem label="Username" value={profile?.username ? `@${profile.username.replace('@', '')}` : 'Not set'} />
            <SummaryItem label="Role" value={profile?.role === 'ADMIN' ? 'Administrator' : 'Moderator'} accent />
          </dl>
        </WorkspacePanel>
      )}

      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="ui-surface max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <p className="ui-eyebrow text-[#e85d4a]">Standard member</p>
                <h3 className="mt-1 font-display text-2xl text-[#f3efe6]">Edit account record</h3>
                <p className="mt-2 text-sm text-[#77756f]">{selectedUser.email}</p>
              </div>
              <button type="button" aria-label="Close member editor" onClick={() => setShowUserDetails(false)} className="table-action px-2 py-1">
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Full name">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                    className="input"
                    required
                  />
                </Field>
                <Field label="Username">
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(event) => setEditForm({ ...editForm, username: event.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Location">
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(event) => setEditForm({ ...editForm, location: event.target.value })}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="About">
                <textarea
                  value={editForm.bio}
                  onChange={(event) => setEditForm({ ...editForm, bio: event.target.value })}
                  rows="3"
                  className="input"
                />
              </Field>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowUserDetails(false)} className="ui-button-secondary min-h-10 px-4">
                  Cancel
                </button>
                <button type="submit" className="ui-button-primary min-h-10 px-4">
                  Update member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspacePage>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="ui-field-label">{label}</span>
      {children}
    </label>
  )
}

function SummaryItem({ label, value, accent = false }) {
  return (
    <div className="border-b border-white/10 px-5 py-5 last:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6">
      <dt className="ui-eyebrow">{label}</dt>
      <dd className={`mt-2 break-words text-sm font-medium ${accent ? 'text-emerald-300' : 'text-[#d8d2c7]'}`}>
        {value || 'Unavailable'}
      </dd>
    </div>
  )
}

function formatName(name) {
  if (!name) return ''
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function formatDate(value) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString('en-US')
}
