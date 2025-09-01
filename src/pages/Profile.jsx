import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, User, Mail, Calendar, Film, Star, Heart, Settings, LogOut, MapPin, Edit2, Twitter, Instagram, Link, Users, UserMinus, Check, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/newAuthStore'
import { useFavoritesStore } from '../store/favoritesStore'
import { userService } from '../services/userService'
import { movieService } from '../services/movieService'
import AvatarUpload from '../components/AvatarUpload'
import MovieCard from '../components/MovieCard'

const Profile = () => {
  const { user, profile, updateProfile, updateAvatar, signOut, isLoading } = useAuthStore()
  const { favorites, removeFromFavorites, getFavoritesCount, clearFavorites } = useFavoritesStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Friends state
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [friendsBusy, setFriendsBusy] = useState(false)

  // Movie ratings state
  const [ratedMovies, setRatedMovies] = useState([])
  const [ratingsPage, setRatingsPage] = useState(1)
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1)
  const [ratingsLoading, setRatingsLoading] = useState(false)

  const [stats, setStats] = useState({ 
    watchedMovies: 0, 
    ratings: 0, 
    favorites: 0, 
    memberSince: user?.created_at || null, 
    memberSinceDays: 0 
  })
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: profile?.name || '',
      username: profile?.username || '',
      email: user?.email || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      twitter: profile?.social_links?.twitter || '',
      instagram: profile?.social_links?.instagram || '',
      letterboxd: profile?.social_links?.letterboxd || '',
      isPublic: (profile?.social_links?.privacy || 'public') !== 'private',
    },
  })

  const onSubmit = async (data) => {
    const updates = {
      name: data.name,
      username: data.username,
      email: data.email,
      bio: data.bio,
      location: data.location,
      isPublic: data.isPublic,
      socialLinks: {
        twitter: data.twitter,
        instagram: data.instagram,
        letterboxd: data.letterboxd,
      }
    }
    const result = await updateProfile(updates)
    if (result.success) {
      setIsEditModalOpen(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const loadStats = async () => {
      try {
        const data = await userService.getMyStats()
        if (mounted && data) {
          setStats({
            watchedMovies: data.watchedMovies || 0,
            ratings: data.ratings || 0,
            favorites: getFavoritesCount(),
            memberSince: data.memberSince || user?.created_at || null,
            memberSinceDays: data.memberSinceDays || 0,
          })
        }
      } catch (e) {
        // silent
      }
    }
    if (user) loadStats()
    return () => { mounted = false }
  }, [user])

  // Film puanlarını yükle
  useEffect(() => {
    let mounted = true
    const loadRatings = async () => {
      if (activeTab !== 'ratings') return
      try {
        setRatingsLoading(true)
        const data = await movieService.getMyRatings(ratingsPage)
        if (mounted) {
          setRatedMovies(prev => ratingsPage === 1 ? data.ratings : [...prev, ...data.ratings])
          setRatingsTotalPages(data.totalPages)
        }
      } catch (error) {
        toast.error('Puanladığınız filmler yüklenirken bir hata oluştu')
      } finally {
        if (mounted) setRatingsLoading(false)
      }
    }
    loadRatings()
    return () => { mounted = false }
  }, [activeTab, ratingsPage])

  const tabs = [
    { id: 'overview', label: 'Genel Bakış', icon: User },
    { id: 'favorites', label: 'Favorilerim', icon: Heart },
    { id: 'ratings', label: 'Puanladıklarım', icon: Star },
    { id: 'friends', label: 'Arkadaşlar', icon: Users },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ]

  useEffect(() => {
    let mounted = true
    const loadFriendsData = async () => {
      if (activeTab !== 'friends') return
      try {
        const [list, reqs] = await Promise.all([
          userService.listFriends(),
          userService.listIncomingRequests(),
        ])
        if (mounted) {
          setFriends(list || [])
          setRequests(reqs || [])
        }
      } catch (_) {}
    }
    loadFriendsData()
    return () => { mounted = false }
  }, [activeTab])

  const acceptRequest = async (requestId, fromUserId) => {
    setFriendsBusy(true)
    try {
      const resp = await userService.respondFriendRequest({ requestId, fromUserId, action: 'accept' })
      if (resp?.success || resp?.status === 'friends') {
        // Refresh lists
        const [list, reqs] = await Promise.all([
          userService.listFriends(),
          userService.listIncomingRequests(),
        ])
        setFriends(list || [])
        setRequests(reqs || [])
      }
    } finally {
      setFriendsBusy(false)
    }
  }

  const rejectRequest = async (requestId, fromUserId) => {
    setFriendsBusy(true)
    try {
      const resp = await userService.respondFriendRequest({ requestId, fromUserId, action: 'reject' })
      if (resp?.success || resp?.status === 'none') {
        const reqs = await userService.listIncomingRequests()
        setRequests(reqs || [])
      }
    } finally {
      setFriendsBusy(false)
    }
  }

  const unfriend = async (otherUserId) => {
    setFriendsBusy(true)
    try {
      const ok = await userService.unfriend(otherUserId)
      if (ok) {
        setFriends(prev => prev.filter(f => f.id !== otherUserId))
      }
    } finally {
      setFriendsBusy(false)
    }
  }

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
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
            <AvatarUpload
              currentAvatar={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}&background=ef4444&color=fff&size=200`}
              onUpload={updateAvatar}
              size="large"
            />

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                {profile?.name}
              </h1>
              <p className="text-xl text-gray-400 mb-3">@{profile?.username}</p>
              
              {profile?.bio && (
                <p className="text-gray-300 mb-4 max-w-2xl">{profile?.bio}</p>
              )}
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
                {profile?.location && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Üyelik: {stats.memberSince ? new Date(stats.memberSince).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Film className="w-4 h-4" />
                  <span>{stats.watchedMovies} film izlendi</span>
                </div>
              </div>

              {/* Social Links */}
              {(profile?.social_links?.twitter || profile?.social_links?.instagram || profile?.social_links?.letterboxd) && (
                <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                  {profile.social_links.twitter && (
                    <a
                      href={`https://twitter.com/${profile.social_links.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile.social_links.instagram && (
                    <a
                      href={`https://instagram.com/${profile.social_links.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {profile.social_links.letterboxd && (
                    <a
                      href={`https://letterboxd.com/${profile.social_links.letterboxd}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Link className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn btn-primary"
              >
                <Edit2 className="w-4 h-4" />
                Profili Düzenle
              </button>
              <button onClick={signOut} className="btn btn-secondary">
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <div className="glass rounded-xl p-6 text-center">
            <Film className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{stats.watchedMovies}</p>
            <p className="text-gray-400">Film İzlendi</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{stats.ratings}</p>
            <p className="text-gray-400">Puan Verildi</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{stats.favorites}</p>
            <p className="text-gray-400">Favori Film</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">
              {stats.memberSinceDays}
            </p>
            <p className="text-gray-400">Gün Üye</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <User className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">
              {friends.length}
            </p>
            <p className="text-gray-400">Arkadaş</p>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Favori Filmlerim ({favorites.length})</h2>
                  {favorites.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('Tüm favorileri temizlemek istediğinize emin misiniz?')) {
                          clearFavorites()
                        }
                      }}
                      className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Tümünü Temizle
                    </button>
                  )}
                </div>
                
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {favorites.map((movie, index) => (
                      <div key={movie.id} className="relative group">
                        <MovieCard movie={movie} index={index} />
                        <button
                          onClick={() => removeFromFavorites(movie.id)}
                          className="absolute top-2 right-2 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-xl p-12 text-center">
                    <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Henüz favori film eklemediniz</p>
                    <p className="text-gray-500 text-sm mt-2">Film detay sayfalarından favorilere ekleyebilirsiniz</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Puanladığım Filmler ({stats.ratings})
                </h2>

                {ratedMovies.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {ratedMovies.map((rating, index) => (
                        <div key={rating.id} className="relative group">
                          <MovieCard movie={rating.movie} index={index} />
                          <div className="absolute top-3 left-3 glass px-2 py-1 rounded-lg flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-white font-semibold text-sm">
                              {rating.rating}
                            </span>
                          </div>
                          {rating.comment && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-sm text-gray-300">
                                "{rating.comment}"
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {ratingsPage < ratingsTotalPages && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setRatingsPage(p => p + 1)}
                          disabled={ratingsLoading}
                          className="btn btn-primary"
                        >
                          {ratingsLoading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass rounded-xl p-12 text-center">
                    <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Henüz film puanlamadınız</p>
                    <p className="text-gray-500 text-sm mt-2">Film detay sayfalarından puan verebilirsiniz</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Gelen İstekler</h2>
                  <div className="glass rounded-xl p-4">
                    {requests.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">Bekleyen istek yok</p>
                    ) : (
                      <ul className="divide-y divide-white/10">
                        {requests.map((r) => (
                          <li key={r.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              <img src={r.fromUser.avatar || `https://ui-avatars.com/api/?name=${r.fromUser.name || r.fromUser.username}&background=ef4444&color=fff`} alt={r.fromUser.name} className="w-8 h-8 rounded-full"/>
                              <div>
                                <p className="text-white text-sm font-medium">{r.fromUser.name || r.fromUser.username}</p>
                                <p className="text-gray-400 text-xs">@{r.fromUser.username}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button disabled={friendsBusy} onClick={() => acceptRequest(r.id, r.fromUser.id)} className="btn btn-primary btn-sm">
                                <Check className="w-4 h-4" />
                                Kabul Et
                              </button>
                              <button disabled={friendsBusy} onClick={() => rejectRequest(r.id, r.fromUser.id)} className="btn btn-secondary btn-sm">
                                <X className="w-4 h-4" />
                                Reddet
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Arkadaşlarım ({friends.length})</h2>
                  <div className="glass rounded-xl p-4">
                    {friends.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">Henüz arkadaş yok</p>
                    ) : (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {friends.map((f) => (
                          <li key={f.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <img src={f.avatar || `https://ui-avatars.com/api/?name=${f.name || f.username}&background=ef4444&color=fff`} alt={f.name} className="w-8 h-8 rounded-full"/>
                              <div>
                                <p className="text-white text-sm font-medium">{f.name || f.username}</p>
                                <p className="text-gray-400 text-xs">@{f.username}</p>
                              </div>
                            </div>
                            <button disabled={friendsBusy} onClick={() => unfriend(f.id)} className="btn btn-secondary btn-sm">
                              <UserMinus className="w-4 h-4" />
                              Kaldır
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
                          {...register('isPublic')}
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
            className="glass rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Profili Düzenle</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    {...register('username', {
                      required: 'Kullanıcı adı gereklidir',
                      pattern: {
                        value: /^[a-z0-9_]+$/,
                        message: 'Kullanıcı adı sadece küçük harf, rakam ve _ içerebilir',
                      },
                      minLength: {
                        value: 3,
                        message: 'Kullanıcı adı en az 3 karakter olmalıdır',
                      },
                    })}
                    className="input"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                  )}
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Biyografi
                </label>
                <textarea
                  {...register('bio', {
                    maxLength: {
                      value: 200,
                      message: 'Biyografi en fazla 200 karakter olabilir',
                    },
                  })}
                  rows={3}
                  className="input"
                  placeholder="Kendinizden bahsedin..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Konum
                </label>
                <input
                  type="text"
                  {...register('location')}
                  className="input"
                  placeholder="İstanbul, Türkiye"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Sosyal Medya</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Twitter Kullanıcı Adı
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-dark-300 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      {...register('twitter')}
                      className="input rounded-l-none"
                      placeholder="kullaniciadi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instagram Kullanıcı Adı
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-dark-300 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      {...register('instagram')}
                      className="input rounded-l-none"
                      placeholder="kullaniciadi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Letterboxd Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    {...register('letterboxd')}
                    className="input"
                    placeholder="kullaniciadi"
                  />
                </div>
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