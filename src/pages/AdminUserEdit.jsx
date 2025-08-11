import { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminUserEdit() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { profile: currentUser, getAllUsers, updateUserProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      letterboxd: ''
    }
  })

  // Check if admin or operator (use uppercase roles)
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'OPERATOR')) {
    return <Navigate to="/" replace />
  }

  useEffect(() => {
    const users = getAllUsers()
    const targetUser = users.find(u => u.id === userId)
    
    if (targetUser) {
      setUserData(targetUser)
      setFormData({
        name: targetUser.name || '',
        username: targetUser.username || '',
        email: targetUser.email || '',
        bio: targetUser.bio || '',
        location: targetUser.location || '',
        socialLinks: {
          twitter: targetUser.socialLinks?.twitter || '',
          instagram: targetUser.socialLinks?.instagram || '',
          letterboxd: targetUser.socialLinks?.letterboxd || ''
        }
      })
    }
  }, [userId, getAllUsers])

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Kullanıcı bulunamadı</p>
          <button
            onClick={() => navigate('/admin')}
            className="text-red-600 hover:text-red-500"
          >
            Admin paneline dön
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateUserProfile(userId, formData)
    
    if (result.success) {
      navigate('/admin')
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('social.')) {
      const socialField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Admin Paneline Dön
          </button>
          <h1 className="text-3xl font-bold text-white">Kullanıcı Düzenle</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-center">
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-white mb-1">{userData.name}</h2>
                <p className="text-gray-400 mb-2">@{userData.username}</p>
                 <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  userData.role === 'ADMIN' 
                    ? 'bg-red-900/50 text-red-400'
                    : userData.role === 'OPERATOR'
                    ? 'bg-blue-900/50 text-blue-400'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {userData.role === 'ADMIN' ? 'Admin' : userData.role === 'OPERATOR' ? 'Operatör' : 'Kullanıcı'}
                </span>
              </div>
              <div className="mt-6 space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Katılım Tarihi</p>
                  <p className="text-white">{new Date(userData.memberSince).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Kullanıcı ID</p>
                  <p className="text-white font-mono text-sm">{userData.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-6">Profil Bilgileri</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      disabled={userData.role === 'admin'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Konum
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Örn: İstanbul, Türkiye"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Biyografi
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Kullanıcı hakkında kısa bilgi..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Sosyal Medya Bağlantıları</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Twitter
                      </label>
                      <input
                        type="text"
                        name="social.twitter"
                        value={formData.socialLinks.twitter}
                        onChange={handleChange}
                        placeholder="https://twitter.com/kullaniciadi"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Instagram
                      </label>
                      <input
                        type="text"
                        name="social.instagram"
                        value={formData.socialLinks.instagram}
                        onChange={handleChange}
                        placeholder="https://instagram.com/kullaniciadi"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Letterboxd
                      </label>
                      <input
                        type="text"
                        name="social.letterboxd"
                        value={formData.socialLinks.letterboxd}
                        onChange={handleChange}
                        placeholder="https://letterboxd.com/kullaniciadi"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}