import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, User, Mail, Calendar, Film, Star, Heart, Settings, LogOut } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'
import MovieCard from '../components/MovieCard'
import { mockMovies } from '../utils/mockData'

const Profile = () => {
  const { user, updateProfile, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  const onSubmit = async (data) => {
    const result = await updateProfile(data)
    if (result.success) {
      setIsEditModalOpen(false)
    }
  }

  // Mock data for user activity
  const userStats = {
    watchedMovies: 42,
    ratings: 38,
    favorites: 12,
    memberSince: '2023-01-15',
  }

  const favoriteMovies = mockMovies.slice(0, 6)
  const ratedMovies = mockMovies.slice(6, 12)

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: User },
    { id: 'favorites', label: 'Favorilerim', icon: Heart },
    { id: 'ratings', label: 'Puanladıklarım', icon: Star },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ]

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=ef4444&color=fff&size=200`}
                alt={user?.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full"
              />
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {user?.name}
              </h1>
              <p className="text-gray-400 mb-4">{user?.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Üyelik: {new Date(userStats.memberSince).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Film className="w-4 h-4" />
                  <span>{userStats.watchedMovies} film izlendi</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Star className="w-4 h-4" />
                  <span>{userStats.ratings} puan verildi</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn btn-primary"
              >
                Profili Düzenle
              </button>
              <button
                onClick={logout}
                className="btn btn-secondary"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass rounded-xl p-6 text-center">
            <Film className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{userStats.watchedMovies}</p>
            <p className="text-gray-400">Film İzlendi</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{userStats.ratings}</p>
            <p className="text-gray-400">Puan Verildi</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{userStats.favorites}</p>
            <p className="text-gray-400">Favori Film</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">
              {Math.floor((Date.now() - new Date(userStats.memberSince)) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-gray-400">Gün Üye</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-200 text-gray-300 hover:bg-dark-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Son Aktiviteler</h2>
                  <div className="glass rounded-xl p-6">
                    <p className="text-gray-400 text-center py-8">
                      Henüz aktivite bulunmuyor
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Favori Filmlerim</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {favoriteMovies.map((movie, index) => (
                    <MovieCard key={movie.id} movie={movie} index={index} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ratings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Puanladığım Filmler</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {ratedMovies.map((movie, index) => (
                    <MovieCard key={movie.id} movie={movie} index={index} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Hesap Ayarları</h2>
                <div className="space-y-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">E-posta Bildirimleri</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">Yeni filmler hakkında bildirim al</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                          defaultChecked
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">Haftalık öneriler</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                          defaultChecked
                        />
                      </label>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Gizlilik</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">Profilimi herkese açık yap</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-300">İzleme geçmişimi göster</span>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4">Tehlikeli Bölge</h3>
                    <button className="btn btn-secondary border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                      Hesabı Sil
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

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
            className="glass rounded-xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Profili Düzenle</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  {...register('name', {
                    required: 'Ad soyad gereklidir',
                    minLength: {
                      value: 3,
                      message: 'Ad soyad en az 3 karakter olmalıdır',
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
                  E-posta
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'E-posta gereklidir',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir e-posta adresi girin',
                    },
                  })}
                  className="input"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 btn btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Kaydet
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