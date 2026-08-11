import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/newAuthStore'
import { userService } from '../services/userService'
import { Navigate } from 'react-router-dom'
import { 
  UserPlusIcon, 
  CogIcon,
  ChartBarIcon,
  FlagIcon,
  ShieldCheckIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { MetricStrip, WorkspacePage, WorkspacePanel, WorkspaceTabs } from '../components/WorkspaceUI'
import ModerationReportsPanel from '../components/ModerationReportsPanel'

export default function AdminDashboard() {
  const authStore = useAuthStore()
  const { user, profile, updateUserProfile } = authStore
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddModerator, setShowAddModerator] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    username: '',
    bio: '',
    location: ''
  })
  const [moderatorForm, setModeratorForm] = useState({
    email: '',
    password: '',
    name: '',
    username: ''
  })
  const [users, setUsers] = useState([])
  const [moderators, setModerators] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshingStats, setRefreshingStats] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalMovies: 0,
    totalRatings: 0,
    activeUsers: 0,
    realTimeActiveUsers: 0
  })

  // Load data on component mount
  useEffect(() => {
    if (profile?.role !== 'ADMIN') {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        // Get user stats from backend
        const stats = await userService.getUserStats();
        
        // Update dashboard stats
        setDashboardStats(prev => ({
          ...prev,
          totalUsers: stats.totalUsers || 0,
          totalModerators: stats.totalModerators || 0,
          activeUsers: stats.activeUsers || 0,
          realTimeActiveUsers: stats.realTimeActiveUsers || 0
        }));

        // Get detailed user and moderator data
        const [usersData, moderatorsData] = await Promise.all([
          userService.getAllUsers(),
          userService.getAllModerators()
        ]);

        setUsers(usersData || []);
        setModerators(moderatorsData || []);

        console.log('Admin Dashboard - Stats:', {
          totalUsers: stats.totalUsers,
          totalModerators: stats.totalModerators,
          activeUsers: stats.activeUsers,
          realTimeActiveUsers: stats.realTimeActiveUsers
        });
      } catch (error) {
        console.error('Error loading admin data:', error);
        toast.error('Data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.role]);

  // Keep every hook unconditional, then enforce the role boundary.
  if (!profile || profile.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  // Manual refresh function for active users
  const refreshActiveUsers = async () => {
    setRefreshingStats(true)
    try {
      const stats = await userService.getUserStats()
      if (stats) {
        setDashboardStats(prev => ({
          ...prev,
          realTimeActiveUsers: stats.realTimeActiveUsers || 0
        }))
        toast.success('Active user count refreshed.')
      }
    } catch (error) {
      console.error('Error refreshing active users:', error)
      toast.error('The active user count could not be refreshed.')
    } finally {
      setRefreshingStats(false)
    }
  }

  const handleAddModerator = async (e) => {
    e.preventDefault()
    
    if (!moderatorForm.email || !moderatorForm.password || !moderatorForm.name) {
      toast.error('Please complete all fields.')
      return
    }

    try {
      const result = await userService.addModerator(moderatorForm)
      if (result.success) {
        setModeratorForm({ email: '', password: '', name: '', username: '' })
        setShowAddModerator(false)
        // Reload data after adding moderator
        const [usersData, moderatorsData] = await Promise.all([
          userService.getAllUsers(),
          userService.getAllModerators()
        ])
        setUsers(usersData)
        setModerators(moderatorsData)
        toast.success('Moderator added.')
      }
    } catch (error) {
      console.error('Moderator creation failed:', error)
      toast.error(error.response?.data?.error || 'The moderator could not be added.')
    }
  }

  const handleRemoveModerator = async (moderatorId) => {
    if (window.confirm('Remove this moderator and return the account to the USER role?')) {
      try {
        const result = await userService.removeModerator(moderatorId)
        if (result.success) {
          // Reload data after removing moderator
          const [usersData, moderatorsData] = await Promise.all([
            userService.getAllUsers(),
            userService.getAllModerators()
          ])
          setUsers(usersData)
          setModerators(moderatorsData)
          toast.success('Moderator access removed.')
        }
      } catch (error) {
        console.error('Moderator removal failed:', error)
        toast.error(error.response?.data?.error || 'The moderator could not be removed.')
      }
    }
  }

  const handlePromoteToModerator = async (userId, userName) => {
    if (window.confirm(`${userName} should be promoted to moderator?`)) {
      try {
        const result = await userService.promoteToModerator(userId)
        if (result.success) {
          // Reload data after promotion
          const [usersData, moderatorsData] = await Promise.all([
            userService.getAllUsers(),
            userService.getAllModerators()
          ])
          setUsers(usersData)
          setModerators(moderatorsData)
          toast.success(`${userName} was promoted to moderator.`)
        }
      } catch (error) {
        console.error('Moderator promotion failed:', error)
        toast.error(error.response?.data?.error || 'The user could not be promoted.')
      }
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId)
        // Reload data after deleting user
        const [usersData, moderatorsData] = await Promise.all([
          userService.getAllUsers(),
          userService.getAllModerators()
        ])
        setUsers(usersData)
        setModerators(moderatorsData)
        toast.success('User deleted.')
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('The user could not be deleted.')
      }
    }
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      bio: user.bio || '',
      location: user.location || ''
    })
    setShowEditUser(true)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    if (!editForm.name || !editForm.email) {
      toast.error('Please complete all required fields.')
      return
    }

    const result = await updateUserProfile(selectedUser.id, editForm)
    if (result.success) {
      setShowEditUser(false)
      setSelectedUser(null)
      // Reload data after updating user
      const [usersData, moderatorsData] = await Promise.all([
        userService.getAllUsers(),
        userService.getAllModerators()
      ])
      setUsers(usersData)
      setModerators(moderatorsData)
      toast.success('User updated.')
    }
  }

  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'reports', label: 'Reports', icon: FlagIcon },
    { id: 'users', label: 'Members', icon: UsersIcon },
    { id: 'moderators', label: 'Moderators', icon: ShieldCheckIcon },
    { id: 'settings', label: 'Operations', icon: CogIcon },
  ]

  return (
    <WorkspacePage
      eyebrow="Control room"
      title="Administration"
      description="Review account health, manage member access, and keep privileged roles explicit."
      badge="Administrator access"
    >

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white text-lg">Loading data...</div>
          </div>
        ) : (
          <>
            <MetricStrip items={[
              { label: 'Members', value: dashboardStats.totalUsers, icon: UsersIcon },
              { label: 'Moderators', value: dashboardStats.totalModerators, icon: ShieldCheckIcon },
              { label: 'Active in 30d', value: dashboardStats.activeUsers, icon: ChartBarIcon },
              { label: 'Active now', value: dashboardStats.realTimeActiveUsers, icon: ArrowPathIcon, note: 'Live estimate' },
            ]} />

            <WorkspaceTabs items={adminTabs} active={activeTab} onChange={setActiveTab} label="Administration sections" />

            {/* Content */}
            {activeTab === 'overview' && (
              <WorkspacePanel
                eyebrow="System summary"
                title="Account operations"
                description="A concise view of the current privileged session and member activity."
                className="mt-8"
                action={
                  <button onClick={refreshActiveUsers} disabled={refreshingStats} className="ui-button-secondary min-h-10 px-4">
                    <ArrowPathIcon className={`h-4 w-4 ${refreshingStats ? 'animate-spin' : ''}`} />
                    Refresh activity
                  </button>
                }
              >
                <dl className="grid sm:grid-cols-3">
                  <SummaryItem label="Service state" value="Operational" accent />
                  <SummaryItem label="Administrator" value={user?.email} />
                  <SummaryItem label="Last sign-in" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US') : 'Unknown'} />
                </dl>
              </WorkspacePanel>
            )}

            {activeTab === 'users' && (
              <div className="mt-8">
                <WorkspacePanel
                  eyebrow="Directory"
                  title="Standard members"
                  description="Review accounts with the USER role. Privileged accounts are managed separately."
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
                        {users.filter(user => user.role === 'USER').length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-400">
                              No standard users found
                            </td>
                          </tr>
                        ) : (
                          users.filter(user => user.role === 'USER').map((user) => (
                            <tr key={user.id}>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-[#1c1d19]">
                                    <span className="text-white font-medium text-sm">
                                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-white font-medium whitespace-nowrap">
                                      {user.name 
                                        ? user.name.split(' ').map(word => 
                                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                          ).join(' ')
                                        : 'Unnamed user'}
                                    </p>
                                    <p className="text-gray-400 text-sm whitespace-nowrap">
                                      @{user.username?.replace('@', '') || 'username'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-gray-300">{user.email}</td>
                              <td className="p-4">
                                <span className="role-badge">
                                  User
                                </span>
                              </td>
                              <td className="p-4 text-gray-300">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : 'Unknown'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handlePromoteToModerator(user.id, user.name || user.username)}
                                    className="table-action text-emerald-300"
                                    title="Promote to moderator"
                                  >
                                    Promote to moderator
                                  </button>
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="table-action"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="table-action text-[#f48a79]"
                                  >
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
              </div>
            )}

            {activeTab === 'reports' && <ModerationReportsPanel />}

            {activeTab === 'moderators' && (
              <div className="mt-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="ui-eyebrow text-[#e85d4a]">Privileged access</p>
                    <h2 className="mt-1 font-display text-2xl text-[#f3efe6]">Moderator management</h2>
                  </div>
                  <button
                    onClick={() => setShowAddModerator(!showAddModerator)}
                    className="ui-button-primary min-h-10 px-4"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    Add moderator
                  </button>
                </div>

                {showAddModerator && (
                  <div className="ui-surface p-5 sm:p-6">
                    <h3 className="font-display text-2xl text-[#f3efe6]">Add a new moderator</h3>
                    <p className="mt-2 text-sm text-[#77756f]">Create this role only for a person who needs account-review access.</p>
                    <form onSubmit={handleAddModerator} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="ui-field-label">Display name</label>
                          <input
                            type="text"
                            value={moderatorForm.name}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, name: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="ui-field-label">Public username</label>
                          <input
                            type="text"
                            value={moderatorForm.username}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, username: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="ui-field-label">Email</label>
                          <input
                            type="email"
                            value={moderatorForm.email}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, email: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                        <div>
                          <label className="ui-field-label">Temporary password</label>
                          <input
                            type="password"
                            value={moderatorForm.password}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, password: e.target.value })}
                            className="input"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddModerator(false)}
                            className="ui-button-secondary min-h-10 px-4"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                            className="ui-button-primary min-h-10 px-4"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="ui-surface">
                  <div className="overflow-x-auto">
                    <table className="workspace-table">
                      <thead>
                        <tr>
                          <th>Moderator</th>
                          <th>Email</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moderators.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-gray-400">
                              No moderators found
                            </td>
                          </tr>
                        ) : (
                          moderators.map((moderator) => (
                            <tr key={moderator.id}>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center border border-[#e85d4a]/25 bg-[#e85d4a]/[0.08]">
                                    <span className="text-white font-medium text-sm">
                                      {moderator.name ? moderator.name.charAt(0).toUpperCase() : 'M'}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-white font-medium whitespace-nowrap">
                                      {moderator.name 
                                        ? moderator.name.split(' ').map(word => 
                                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                          ).join(' ')
                                        : 'Unnamed moderator'}
                                    </p>
                                    <p className="text-gray-400 text-sm whitespace-nowrap">
                                      @{moderator.username?.replace('@', '') || 'moderator'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-gray-300">{moderator.email}</td>
                              <td className="p-4 text-gray-300">
                                {moderator.created_at ? new Date(moderator.created_at).toLocaleDateString('en-US') : 'Unknown'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleEditUser(moderator)}
                                    className="table-action"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemoveModerator(moderator.id)}
                                    className="table-action text-amber-300"
                                    title="Remove moderator access"
                                  >
                                    Demote
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <WorkspacePanel
                eyebrow="Deployment policy"
                title="Operational boundaries"
                description="Production settings are versioned and deployed with the application. This page intentionally avoids browser-only controls that appear to save but do nothing."
                className="mt-8"
              >
                <dl className="grid sm:grid-cols-3">
                  <SummaryItem label="Environment" value="Production" accent />
                  <SummaryItem label="Public origin" value="ratemet.emecworks.com" />
                  <SummaryItem label="Account storage" value="PostgreSQL" />
                </dl>
                <p className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-[#77756f] sm:px-6">
                  Runtime configuration, maintenance mode, and public metadata must be changed in the versioned deployment configuration and reviewed before release.
                </p>
              </WorkspacePanel>
            )}
          </>
        )}

      {/* User edit modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="ui-surface max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="ui-eyebrow text-[#e85d4a]">Account record</p>
                <h3 className="mt-1 font-display text-2xl text-[#f3efe6]">Edit member</h3>
              </div>
              <button
                type="button"
                aria-label="Close user editor"
                onClick={() => setShowEditUser(false)}
                className="table-action px-2 py-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center border border-white/10 bg-[#1c1d19]">
                  <span className="text-white font-medium text-lg">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-xl text-[#f3efe6]">{selectedUser.name || 'Unnamed user'}</h4>
                  <p className="text-sm text-[#77756f]">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="ui-field-label">Full name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="ui-field-label">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="ui-field-label">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="ui-field-label">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="ui-field-label">About</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows="3"
                  className="input"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditUser(false)}
                  className="ui-button-secondary min-h-10 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ui-button-primary min-h-10 px-4"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspacePage>
  )
}

function SummaryItem({ label, value, accent = false }) {
  return (
    <div className="border-b border-white/10 px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6">
      <dt className="ui-eyebrow">{label}</dt>
      <dd className={`mt-2 break-words text-sm font-medium ${accent ? 'text-emerald-300' : 'text-[#d8d2c7]'}`}>
        {value || 'Unavailable'}
      </dd>
    </div>
  )
}
