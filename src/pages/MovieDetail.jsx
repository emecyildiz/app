import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Calendar, Clock, Play, Heart, Share2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

import LoadingSpinner from '../components/LoadingSpinner'
import MovieCard from '../components/MovieCard'
import { movieService } from '../services/movieService'
import axios from 'axios'
import { useAuthStore } from '../store/newAuthStore'
import { useMovieStore } from '../store/movieStore'
import { Users } from 'lucide-react'
import { useFavoritesStore } from '../store/favoritesStore'

const MovieDetail = () => {
  const { id } = useParams()
  const { isAuthenticated } = useAuthStore()
  const { rateMovie, removeRating } = useMovieStore()
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore()
  const [movie, setMovie] = useState(null)
  const [relatedMovies, setRelatedMovies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRating, setUserRating] = useState(0)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)

  // Scroll to top when component mounts or movie ID changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant' // Use instant for page navigation
    })
  }, [id])

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const [movieData, related] = await Promise.all([
          movieService.getMovieById(id),
          movieService.getMovies(1, 6),
        ])
        setMovie(movieData)
        setRelatedMovies(related.movies.filter((m) => m.id !== parseInt(id)))
        setUserRating(movieData.userRating || 0)
      } catch (error) {
        toast.error('Film detayları yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovieData()
  }, [id])

  const handleRating = async (rating) => {
    if (!isAuthenticated) {
      toast.error('Puan vermek için giriş yapmalısınız')
      return
    }

    try {
      const result = await rateMovie(movie.id, rating)
      if (result.success) {
        setUserRating(rating)
        setMovie(prev => ({
          ...prev,
          userRating: rating,
          averageRating: result.data.averageRating,
          ratingsCount: result.data.ratingsCount,
          friendsAverage: result.data.friendsAverage,
          friendsCount: result.data.friendsCount,
        }))
        toast.success('Puanınız kaydedildi!')
        setIsRatingModalOpen(false)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Puan verilirken bir hata oluştu')
    }
  }

  const handleRemoveRating = async () => {
    try {
      const result = await removeRating(movie.id)
      if (result.success) {
        setUserRating(0)
        setMovie(prev => ({
          ...prev,
          userRating: null,
          averageRating: result.data.averageRating,
          ratingsCount: result.data.ratingsCount,
          friendsAverage: result.data.friendsAverage,
          friendsCount: result.data.friendsCount,
        }))
        toast.success('Puanınız kaldırıldı')
        setIsRatingModalOpen(false)
      }
    } catch (error) {
      toast.error('Puan kaldırılırken bir hata oluştu')
    }
  }

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error('Favorilere eklemek için giriş yapmalısınız')
      return
    }

    if (isFavorite(movie.id)) {
      await removeFromFavorites(movie.id)
    } else {
      await addToFavorites(movie)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!movie) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Film bulunamadı</p>
          <Link to="/movies" className="btn btn-primary">
            Filmlere Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={movie.backdrop}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-20 left-4 z-10">
          <Link
            to="/movies"
            className="btn btn-ghost glass"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri</span>
          </Link>
        </div>

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex items-end pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-end">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:block -mb-20"
            >
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full max-w-sm rounded-xl shadow-2xl"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {/* Global Rating */}
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-semibold text-white">
                    {movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-gray-400">({movie.ratingsCount || 0} oy)</span>
                </div>

                {/* Friends Rating */}
                {movie.friendsAverage && (
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    <span className="text-2xl font-semibold text-white">
                      {movie.friendsAverage.toFixed(1)}
                    </span>
                    <span className="text-gray-400">({movie.friendsCount} arkadaş)</span>
                  </div>
                )}

                {/* Release Date */}
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(movie.releaseDate).getFullYear()}</span>
                </div>

                {/* Runtime */}
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5" />
                  <span>{movie.runtime} dakika</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    to={`/movies?genre=${genre.id}`}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>

              <p className="text-lg text-gray-200 mb-8 max-w-3xl">
                {movie.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <button className="btn btn-primary text-lg px-6 py-3">
                  <Play className="w-5 h-5" />
                  Fragmanı İzle
                </button>
                <button
                  onClick={() => setIsRatingModalOpen(true)}
                  className="btn btn-secondary text-lg px-6 py-3"
                >
                  <Star className="w-5 h-5" />
                  {userRating > 0 ? `Puanım: ${userRating}` : 'Puan Ver'}
                </button>
                <button 
                  onClick={handleFavoriteClick}
                  className={`btn glass ${isFavorite(movie?.id) ? 'bg-red-500/20 border-red-500' : 'btn-ghost'}`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(movie?.id) ? 'fill-current text-red-500' : ''}`} />
                </button>
                <button className="btn btn-ghost glass">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-12 bg-dark-100 lg:pt-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cast */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Oyuncular</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.map((actor, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-dark-200 rounded-lg text-gray-300"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Director */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Yönetmen</h2>
                <p className="text-gray-300">{movie.director}</p>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Film Bilgileri</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-gray-400 text-sm">Çıkış Tarihi</dt>
                    <dd className="text-white">{new Date(movie.releaseDate).toLocaleDateString('tr-TR')}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 text-sm">Süre</dt>
                    <dd className="text-white">{movie.runtime} dakika</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 text-sm">Ortalama Puan</dt>
                    <dd className="text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'} / 10
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 text-sm">Oy Sayısı</dt>
                    <dd className="text-white">{movie.ratingsCount.toLocaleString('tr-TR')}</dd>
                  </div>
                  {movie.friendsAverage && (
                    <div>
                      <dt className="text-gray-400 text-sm">Arkadaşların Puanı</dt>
                      <dd className="text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        {movie.friendsAverage.toFixed(1)} / 10
                        <span className="text-gray-400 text-sm">({movie.friendsCount} kişi)</span>
                      </dd>
                    </div>
                  )}
                </dl>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Movies */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white">Benzer Filmler</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {relatedMovies.slice(0, 5).map((relatedMovie, index) => (
              <MovieCard key={relatedMovie.id} movie={relatedMovie} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Rating Modal */}
      {isRatingModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsRatingModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              {movie.title} için Puanınız
            </h3>

            <div className="flex justify-center gap-2 mb-8">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handleRating(i + 1)}
                  className={`p-2 transition-all ${
                    i + 1 <= userRating
                      ? 'text-yellow-500'
                      : 'text-gray-500 hover:text-yellow-500'
                  }`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      i + 1 <= userRating ? 'fill-current' : ''
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRatingModalOpen(false)}
                className="flex-1 btn btn-secondary"
              >
                İptal
              </button>
              {userRating > 0 && (
                <>
                  <button
                    onClick={handleRemoveRating}
                    className="flex-1 btn btn-error"
                  >
                    Puanı Kaldır
                  </button>
                  <button
                    onClick={() => handleRating(userRating)}
                    className="flex-1 btn btn-primary"
                  >
                    Puanla ({userRating})
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default MovieDetail