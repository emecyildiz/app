import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Star, 
  Calendar, 
  Clock, 
  Globe, 
  Play, 
  ArrowLeft,
  Users,
  Award,
  Heart
} from 'lucide-react'
import { useMovieStore } from '../store/movieStore'
import { useFavoritesStore } from '../store/favoritesStore'
import { tmdbService } from '../services/tmdbService'
import { movieService } from '../services/movieService'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const MovieDetail = () => {
  const { id } = useParams()
  const { currentMovie, loading, error, loadMovieDetails, clearCurrentMovie } = useMovieStore()
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [similarMovies, setSimilarMovies] = useState([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState('')
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadMovieDetails(id)
      loadSimilarMovies(id)
      // Sayfanın en üstüne scroll et
      window.scrollTo(0, 0)
    }

    return () => {
      clearCurrentMovie()
    }
  }, [id])

  const loadSimilarMovies = async (movieId) => {
    setLoadingSimilar(true)
    try {
      const response = await tmdbService.getSimilarMovies(movieId, 1)
      setSimilarMovies(response.results.slice(0, 6)) // İlk 6 film
    } catch (error) {
      console.error('Benzer filmler yüklenemedi:', error)
    } finally {
      setLoadingSimilar(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih yok'
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatRuntime = (minutes) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}s ${mins}dk`
  }

  const formatBudget = (budget) => {
    if (!budget || budget === 0) return 'Bilinmiyor'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget)
  }

  const formatRevenue = (revenue) => {
    if (!revenue || revenue === 0) return 'Bilinmiyor'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(revenue)
  }

  const handleRateMovie = async () => {
    if (!isAuthenticated) {
      toast.error('Puan vermek için giriş yapın')
      navigate('/login')
      return
    }
    if (!userRating) return
    
    setRatingLoading(true)
    try {
      const result = await movieService.rateMovie(id, userRating, userComment, currentMovie)
      if (result.success) {
        toast.success('Film puanınız kaydedildi!')
        setShowRatingModal(false)
        setUserRating(0)
        setUserComment('')
      } else {
        toast.error(result.error || 'Puan kaydedilemedi')
      }
    } catch (error) {
      toast.error('Bir hata oluştu')
    } finally {
      setRatingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !currentMovie) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Film Bulunamadı</h2>
          <p className="text-gray-400 mb-6">{error || 'Film yüklenemedi'}</p>
          <Link to="/movies" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Filmler Sayfasına Dön
          </Link>
        </div>
      </div>
    )
  }

  const {
    title,
    original_title,
    overview,
    poster_path,
    backdrop_path,
    vote_average,
    vote_count,
    release_date,
    runtime,
    budget,
    revenue,
    status,
    genres = [],
    credits = {},
    videos = {}
  } = currentMovie

  const posterURL = tmdbService.getImageURL(poster_path, 'w500')
  const backdropURL = tmdbService.getImageURL(backdrop_path, 'original')
  const trailer = videos?.results?.find(video => video.type === 'Trailer')

  return (
    <div className="min-h-screen pt-20">
      {/* Backdrop */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <img
          src={backdropURL || posterURL}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent" />
        
        {/* Back Button */}
        <Link
          to="/movies"
          className="absolute top-4 left-4 btn btn-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Link>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              {/* Poster */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0"
              >
                <img
                  src={posterURL}
                  alt={title}
                  className="w-48 md:w-64 rounded-lg shadow-2xl"
                />
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1"
              >
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                  {title}
                </h1>
                
                {original_title && original_title !== title && (
                  <p className="text-xl text-gray-300 mb-4">
                    {original_title}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{vote_average.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-300">
                    {vote_count.toLocaleString('tr-TR')} oy
                  </span>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-4">
                  {release_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(release_date)}</span>
                    </div>
                  )}
                  
                  {runtime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatRuntime(runtime)}</span>
                    </div>
                  )}

                  {status && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span>{status}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {genres.map(genre => (
                      <span
                        key={genre.id}
                        className="bg-primary-500/20 text-primary-300 px-3 py-1 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* Trailer Button */}
                  {trailer && (
                    <a
                      href={`https://www.youtube.com/watch?v=${trailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Fragman İzle
                    </a>
                  )}

                  {/* Rate Movie Button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Puan vermek için giriş yapın')
                        navigate('/login')
                        return
                      }
                      setShowRatingModal(true)
                    }}
                    className="btn btn-secondary inline-flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Puanla
                  </button>

                  {/* Favorite Button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Favorilere eklemek için giriş yapın')
                        navigate('/login')
                        return
                      }
                      if (isFavorite(id)) {
                        removeFromFavorites(id)
                        userService.removeFavorite(id)
                        toast.success('Favorilerden çıkarıldı')
                      } else {
                        addToFavorites(currentMovie)
                        userService.addFavorite(id)
                        toast.success('Favorilere eklendi')
                      }
                    }}
                    className={`btn inline-flex items-center gap-2 ${
                      isFavorite(id) 
                        ? 'btn-secondary border-red-500 text-red-400 hover:bg-red-500 hover:text-white' 
                        : 'btn-secondary'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(id) ? 'fill-current' : ''}`} />
                    {isFavorite(id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Overview */}
            {overview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Özet</h2>
                <p className="text-gray-300 leading-relaxed">{overview}</p>
              </motion.div>
            )}

            {/* Cast */}
            {credits?.cast && credits.cast.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Oyuncular</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {credits.cast.slice(0, 8).map(actor => (
                    <div key={actor.id} className="text-center">
                      <img
                        src={tmdbService.getImageURL(actor.profile_path, 'w185') || '/placeholder-actor.jpg'}
                        alt={actor.name}
                        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-actor.jpg'
                        }}
                      />
                      <p className="text-white text-sm font-medium">{actor.name}</p>
                      <p className="text-gray-400 text-xs">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Benzer Filmler</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  {similarMovies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-dark-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Film Bilgileri</h3>
              
              <div className="space-y-4">
                {budget > 0 && (
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium">Bütçe</h4>
                    <p className="text-white">{formatBudget(budget)}</p>
                  </div>
                )}

                {revenue > 0 && (
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium">Hasılat</h4>
                    <p className="text-white">{formatRevenue(revenue)}</p>
                  </div>
                )}

                {credits?.crew && (
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Yönetmen</h4>
                    {credits.crew
                      .filter(person => person.job === 'Director')
                      .slice(0, 3)
                      .map(director => (
                        <p key={director.id} className="text-white text-sm">
                          {director.name}
                        </p>
                      ))}
                  </div>
                )}

                {credits?.crew && (
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Senaryo</h4>
                    {credits.crew
                      .filter(person => person.job === 'Screenplay' || person.job === 'Writer')
                      .slice(0, 3)
                      .map(writer => (
                        <p key={writer.id} className="text-white text-sm">
                          {writer.name}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowRatingModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-6">Film Puanla</h3>
            
            <div className="space-y-6">
              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Puanınız
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= userRating 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-400'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yorumunuz (İsteğe bağlı)
                </label>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  rows={3}
                  className="input w-full"
                  placeholder="Film hakkında düşüncelerinizi paylaşın..."
                  maxLength={500}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isAuthenticated) {
                        toast.error('Yorum yapmak için giriş yapın')
                        navigate('/login')
                        return
                      }
                      if (!userComment.trim()) {
                        toast.error('Yorum boş olamaz')
                        return
                      }
                      setRatingLoading(true)
                      try {
                        await userService.upsertComment(id, userComment.trim())
                        toast.success('Yorum kaydedildi')
                        setUserComment('')
                        setShowRatingModal(false)
                      } finally {
                        setRatingLoading(false)
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    disabled={ratingLoading}
                  >
                    Sadece Yorumu Kaydet
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 btn btn-secondary"
                  disabled={ratingLoading}
                >
                  İptal
                </button>
                <button
                  onClick={handleRateMovie}
                  className="flex-1 btn btn-primary"
                  disabled={ratingLoading || userRating === 0}
                >
                  {ratingLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default MovieDetail
