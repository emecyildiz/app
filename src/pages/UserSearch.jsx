import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, User, Heart, MessageSquare, Star, Eye, Calendar } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useMovieStore } from '../store/movieStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const UserSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  
  const { searchUsers, getUserProfile } = useAuthStore()
  const { movies } = useMovieStore()

  useEffect(() => {
    const search = searchParams.get('q')
    if (search) {
      setSearchQuery(search)
      performUserSearch(search)
    }
  }, [searchParams])

  const performUserSearch = async (query) => {
    setLoading(true)
    try {
      const results = await searchUsers(query)
      setUsers(results)
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Kullanıcı arama sırasında hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery })
      performUserSearch(searchQuery)
    }
  }

  const handleUserClick = async (user) => {
    setSelectedUser(user)
    setShowUserProfile(true)
    setProfileLoading(true)
    
    try {
      const profile = await getUserProfile(user.id)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      toast.error('Kullanıcı profili yüklenirken hata oluştu!')
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Kullanıcı Ara</h1>
          <p className="text-gray-400 text-lg">
            Kullanıcı adı, isim veya e-posta ile arama yapın
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı ara... (kullanıcı adı, isim veya e-posta)"
              className="w-full px-6 py-4 pr-12 rounded-xl bg-dark-200 border border-dark-500 text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-lg"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors p-2"
            >
              <Search className="w-6 h-6" />
            </button>
          </form>
        </motion.div>

        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : users.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {users.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-primary-500/50 transition-all duration-200 cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=ef4444&color=fff`}
                    alt={user.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{user.name}</h3>
                    <p className="text-gray-400">@{user.username}</p>
                    {user.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">Admin</span>
                    )}
                    {user.role === 'OPERATOR' && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">Operatör</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Üye: {new Date(user.createdat).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : searchQuery ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-12"
          >
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Kullanıcı Bulunamadı</h3>
            <p className="text-gray-400">"{searchQuery}" için sonuç bulunamadı.</p>
          </motion.div>
        ) : null}

        {/* User Profile Modal */}
        {showUserProfile && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-800"
            >
              {profileLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : userProfile ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=ef4444&color=fff`}
                        alt={selectedUser.name}
                        className="w-20 h-20 rounded-full"
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedUser.name}</h2>
                        <p className="text-gray-400 text-lg">@{selectedUser.username}</p>
                        <p className="text-gray-500">{selectedUser.email}</p>
                        {selectedUser.bio && (
                          <p className="text-gray-300 mt-2">{selectedUser.bio}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUserProfile(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.stats.favoriteMovies}</div>
                      <div className="text-gray-400 text-sm">Favori Film</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <MessageSquare className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.stats.reviews}</div>
                      <div className="text-gray-400 text-sm">Yorum</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.stats.ratings}</div>
                      <div className="text-gray-400 text-sm">Puanlama</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-white">
                        {new Date(userProfile.stats.memberSince).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-gray-400 text-sm">Üyelik</div>
                    </div>
                  </div>

                  {/* Favorite Movies */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Favori Filmler</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {userProfile.favorites.map((movie) => (
                        <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="text-white font-medium text-sm truncate">{movie.title}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-gray-400 text-xs">{movie.rating}/5</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Son Aktiviteler</h3>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white">
                                <span className="font-medium">{selectedUser.name}</span> yeni bir film izledi
                              </p>
                              <p className="text-gray-400 text-sm">2 saat önce</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">Kullanıcı profili yüklenemedi.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSearch 