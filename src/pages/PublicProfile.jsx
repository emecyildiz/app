import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Film, Heart, Star, MapPin, ArrowLeft } from 'lucide-react'
import { userService } from '../services/userService'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-400">Yükleniyor...</div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Kullanıcı bulunamadı</p>
          <Link to="/" className="btn btn-primary">
            Ana Sayfa
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Geri
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name || profile.username}&background=ef4444&color=fff&size=200`}
              alt={profile.name}
              className="w-32 h-32 rounded-full"
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{profile.name || profile.username}</h1>
              <p className="text-xl text-gray-400 mb-3">@{profile.username}</p>
              {profile.bio && <p className="text-gray-300 max-w-2xl">{profile.bio}</p>}
              <div className="flex flex-wrap items-center gap-6 text-sm mt-4">
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.memberSince && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>Üyelik: {new Date(profile.memberSince).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          <div className="glass rounded-xl p-6 text-center">
            <Film className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{profile.stats?.watchedMovies || 0}</p>
            <p className="text-gray-400">Film İzlendi</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{profile.stats?.ratings || 0}</p>
            <p className="text-gray-400">Puan Verildi</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white mb-1">{profile.stats?.favorites || 0}</p>
            <p className="text-gray-400">Favori</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


