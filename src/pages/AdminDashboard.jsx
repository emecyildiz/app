import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/newAuthStore'
import { userService } from '../services/userService'
import { Navigate, useNavigate } from 'react-router-dom'
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const authStore = useAuthStore()
  const { user, profile, updateUserProfile } = authStore
  const navigate = useNavigate()
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

  // Redirect users who do not have the administrator role.
  if (!profile || profile.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  // Load data on component mount
  useEffect(() => {
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
  }, []);

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

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Paneli</h1>
          <p className="text-gray-400">System administration and user controls</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white text-lg">Loading data...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Toplam User</p>
                    <p className="text-3xl font-bold text-white mt-1">{dashboardStats.totalUsers}</p>
                  </div>
                  <UsersIcon className="w-12 h-12 text-red-600" />
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Moderatorler</p>
                    <p className="text-3xl font-bold text-white mt-1">{dashboardStats.totalModerators}</p>
                  </div>
                  <ShieldCheckIcon className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Aktif Userlar (Son 24 Saat)</p>
                    <p className="text-3xl font-bold text-white mt-1">{dashboardStats.activeUsers}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={refreshActiveUsers}
                        disabled={refreshingStats}
                        className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                      >
                        <ArrowPathIcon className={`w-3 h-3 ${refreshingStats ? 'animate-spin' : ''}`} />
                        Yenile
                      </button>
                    </div>
                  </div>
                  <ChartBarIcon className="w-12 h-12 text-green-600" />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'users'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Userlar
                </button>
                <button
                  onClick={() => setActiveTab('moderators')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'moderators'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Moderatorler
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'settings'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-xl font-semibold text-white mb-4">System summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Sistem Durumu</p>
                      <p className="text-green-500 font-medium">Aktif</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Last sign-in</p>
                      <p className="text-white font-medium">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US') : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Admin email</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Sistem Versiyonu</p>
                      <p className="text-white font-medium">v1.0.0</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg border border-gray-800">
                  <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">Normal Userlar</h2>
                    <p className="text-gray-400 mt-1">View and manage accounts with the USER role</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left p-4 text-gray-400 font-medium">User</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Rol</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Registration date</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
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
                            <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
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
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
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
                                    className="text-green-500 hover:text-green-400 text-sm font-medium"
                                    title="Promote to moderator"
                                  >
                                    Promote to moderator
                                  </button>
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="text-blue-500 hover:text-blue-400 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-500 hover:text-red-400 text-sm"
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
                </div>
              </div>
            )}

            {activeTab === 'moderators' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Moderator management</h2>
                  <button
                    onClick={() => setShowAddModerator(!showAddModerator)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    Add moderator
                  </button>
                </div>

                {showAddModerator && (
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Add a new moderator</h3>
                    <form onSubmit={handleAddModerator} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Full name
                          </label>
                          <input
                            type="text"
                            value={moderatorForm.name}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            value={moderatorForm.username}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, username: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={moderatorForm.email}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, email: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            value={moderatorForm.password}
                            onChange={(e) => setModeratorForm({ ...moderatorForm, password: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddModerator(false)}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-gray-900 rounded-lg border border-gray-800">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left p-4 text-gray-400 font-medium">Moderator</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Registration date</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
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
                            <tr key={moderator.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
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
                                    className="text-blue-500 hover:text-blue-400 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemoveModerator(moderator.id)}
                                    className="text-orange-500 hover:text-orange-400 text-sm font-medium"
                                    title="Remove moderator access"
                                  >
                                    ⬇️ Demote
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
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-xl font-semibold text-white mb-4">System settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Site title
                      </label>
                      <input
                        type="text"
                        defaultValue="Ratemet movie journal"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Site description
                      </label>
                      <textarea
                        defaultValue="A focused platform for movie enthusiasts"
                        rows="3"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Maintenance mode
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="maintenance"
                          className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-600"
                        />
                        <label htmlFor="maintenance" className="text-gray-300">
                          Enable maintenance mode
                        </label>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                        Save settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Edit Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">User Edit</h3>
              <button
                onClick={() => setShowEditUser(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white">{selectedUser.name || 'Unnamed user'}</h4>
                  <p className="text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Konum
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  About
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditUser(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
