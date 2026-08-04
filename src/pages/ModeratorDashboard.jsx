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
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
    location: ''
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirect if not moderator
  if (!profile || (profile.role !== 'MODERATOR' && profile.role !== 'ADMIN')) {
    return <Navigate to="/" />
  }

  // Load data on component mount
  useEffect(() => {
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
  }, [])

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio || '',
      location: user.location || ''
    })
    setShowUserDetails(true)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    if (!editForm.name || !editForm.email) {
      toast.error('Please complete all required fields.')
      return
    }

    try {
      await userService.updateUser(selectedUser.id, editForm)
      setShowUserDetails(false)
      setSelectedUser(null)
      // Reload data after updating user
      const usersData = await userService.getAllUsers()
      setUsers(usersData || [])
      toast.success('User updated.')
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('The user could not be updated.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId)
        // Reload data after deleting user
        const usersData = await userService.getAllUsers()
        setUsers(usersData || [])
        toast.success('User deleted.')
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('The user could not be deleted.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Moderator Paneli</h1>
          <p className="text-gray-400">User management and account controls</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam User</p>
                <p className="text-3xl font-bold text-white mt-1">{users.filter(u => u.role === 'USER').length}</p>
              </div>
              <UsersIcon className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Moderator Yetkisi</p>
                <p className="text-3xl font-bold text-white mt-1">✓</p>
              </div>
              <ShieldCheckIcon className="w-12 h-12 text-purple-600" />
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
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              User management
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Profile settings
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Moderator summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Moderator name</p>
                  <p className="text-white font-medium">{profile?.name || user?.email?.split('@')[0]}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">E-posta</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Yetki Seviyesi</p>
                  <p className="text-blue-500 font-medium">{profile?.role === 'ADMIN' ? 'Admin' : 'Moderator'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Last sign-in</p>
                  <p className="text-white font-medium">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('tr-TR') : 'Bilinmiyor'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Quick actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-6 h-6" />
                    <div>
                      <p className="font-medium">Manage users</p>
                      <p className="text-sm opacity-90">List and edit user accounts</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CogIcon className="w-6 h-6" />
                    <div>
                      <p className="font-medium">Profile settings</p>
                      <p className="text-sm opacity-90">Edit the moderator profile</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg border border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">User management</h2>
                <p className="text-gray-400 mt-1">View and manage standard user accounts</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-4 text-gray-400 font-medium">User</th>
                      <th className="text-left p-4 text-gray-400 font-medium">E-posta</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Rol</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Registration date</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">Loading...</td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400">No standard users found.</td>
                      </tr>
                    ) : (
                      users.map((userItem) => (
                        <tr key={userItem.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium whitespace-nowrap">
                                  {userItem.name 
                                    ? userItem.name.split(' ').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                      ).join(' ')
                                    : 'Unnamed user'}
                                </p>
                                <p className="text-gray-400 text-sm whitespace-nowrap">
                                  @{userItem.username?.replace('@', '') || 'username'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">{userItem.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              userItem.role === 'ADMIN' 
                                ? 'bg-red-900/50 text-red-400'
                                : userItem.role === 'MODERATOR'
                                ? 'bg-blue-900/50 text-blue-400'
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {userItem.role === 'ADMIN' ? 'Admin' : userItem.role === 'MODERATOR' ? 'Moderator' : 'User'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">
                            {new Date(userItem.memberSince).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewUser(userItem)}
                                className="text-green-500 hover:text-green-400 text-sm flex items-center gap-1"
                              >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                              </button>
                              {userItem.role === 'USER' && (
                                <button
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                  Sil
                                </button>
                              )}
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

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Moderator Profile settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-blue-700 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {profile?.name ? profile.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{profile?.name || user?.email?.split('@')[0]}</h3>
                    <p className="text-gray-400">{user?.email}</p>
                    <p className="text-blue-500 text-sm">Moderator</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      defaultValue={user.name}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      defaultValue={user.username}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Konum
                    </label>
                    <input
                      type="text"
                      defaultValue={user.location}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    About
                  </label>
                  <textarea
                    defaultValue={user.bio}
                    rows="3"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                
                <div className="pt-4">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Profili Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">User details</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white">
                      {selectedUser.name 
                        ? selectedUser.name.split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')
                        : 'Unnamed user'}
                    </h4>
                    <p className="text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Ad Soyad
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
                      E-posta
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
                    onClick={() => setShowUserDetails(false)}
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
    </div>
  )
}
