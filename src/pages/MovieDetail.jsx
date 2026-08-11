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
  Heart,
  Share2
} from 'lucide-react'
import RecommendationModal from '../components/RecommendationModal'
import { useMovieStore } from '../store/movieStore'
import { useFavoritesStore } from '../store/favoritesStore'
import { tmdbService } from '../services/tmdbService'
import { movieService } from '../services/movieService'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { translateError } from '../utils/errorTranslate'

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
  const [showRecommendModal, setShowRecommendModal] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [existingUserRating, setExistingUserRating] = useState(null)

  useEffect(() => {
    if (id) {
      loadMovieDetails(id)
      loadSimilarMovies(id)
      loadUserRating(id)
      // Scroll to the top of the page.
      window.scrollTo(0, 0)
    }

    return () => {
      clearCurrentMovie()
      setExistingUserRating(null)
    }
  }, [id])

  const loadSimilarMovies = async (movieId) => {
    setLoadingSimilar(true)
    try {
      const response = await tmdbService.getSimilarMovies(movieId, 1)
      setSimilarMovies(response.results.slice(0, 6)) // First six movies.
    } catch (error) {
      console.error('Similar movies could not be loaded:', error)
    } finally {
      setLoadingSimilar(false)
    }
  }

  const loadUserRating = async (movieId) => {
    if (!isAuthenticated) return
    try {
      const rating = await movieService.getUserRating(movieId)
      setExistingUserRating(rating)
      if (rating) {
        setUserRating(rating.rating || 0)
        setUserComment(rating.comment || '')
      }
    } catch (error) {
      console.error('The user rating could not be loaded:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatRuntime = (minutes) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatBudget = (budget) => {
    if (!budget || budget === 0) return 'Unknown'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget)
  }

  const formatRevenue = (revenue) => {
    if (!revenue || revenue === 0) return 'Unknown'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(revenue)
  }

  const handleRateMovie = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to rate this movie.')
      navigate('/login')
      return
    }
    if (!userRating) return
    
    setRatingLoading(true)
    try {
      const result = await movieService.rateMovie(id, userRating, userComment, currentMovie)
      if (result.success) {
        if (userComment && userComment.trim().length > 0) {
          try { 
            await userService.upsertComment(
              id, 
              userComment.trim(), 
              currentMovie?.title || currentMovie?.original_title,
              currentMovie?.poster_path
            ) 
          } catch {}
        }
        // Update the current user rating.
        setExistingUserRating({
          rating: userRating,
          comment: userComment,
          movie_id: id
        })
        toast.success('Your rating was saved.')
        setShowRatingModal(false)
      } else {
        toast.error(translateError(result.error) || 'The rating could not be saved.')
      }
    } catch (error) {
      toast.error('Something went wrong.')
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
          <h2 className="text-2xl font-bold text-white mb-4">Movie not found</h2>
          <p className="text-gray-400 mb-6">{error || 'The movie could not be loaded.'}</p>
          <Link to="/movies" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to movies
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
  const currentMovieId = Number(currentMovie?.id || id)
  const isMovieFavorited = isFavorite(currentMovieId)

  return (
    <div className="min-h-screen pt-20">
      {/* Backdrop */}
      <div className="relative min-h-[760px] overflow-hidden md:h-[500px] md:min-h-0">
        <img
          src={backdropURL || posterURL}
          alt={title}
          className="w-full h-full object-cover scale-[1.02]"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e0c] via-[#0d0e0c]/75 to-[#0d0e0c]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e0c]/85 via-[#0d0e0c]/40 to-transparent" />
        
        {/* Back Button */}
        <Link
          to="/movies"
          className="absolute top-4 left-4 btn btn-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
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
                  className="w-36 rounded-lg shadow-2xl md:w-64"
                />
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 rounded-2xl border border-white/10 bg-[#0d0e0c]/80 p-5 shadow-2xl backdrop-blur-md md:p-6"
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
                  <div className="flex items-center gap-2 rounded-full border border-[#f4c95d]/30 bg-[#171914]/90 px-3 py-1 text-[#f4c95d]">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{vote_average.toFixed(1)}</span>
                  </div>
                  <span className="font-medium text-[#f2eee6]">
                    {vote_count.toLocaleString('en-US')} votes
                  </span>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#e8e3d9] mb-4">
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
                        className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-sm font-medium text-white"
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
                      Watch trailer
                    </a>
                  )}

                  {/* Rate Movie Button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Sign in to rate this movie.')
                        navigate('/login')
                        return
                      }
                      setShowRatingModal(true)
                    }}
                    className={`btn inline-flex items-center gap-2 ${
                      existingUserRating 
                        ? 'btn-secondary border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white' 
                        : 'btn-secondary'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${existingUserRating ? 'fill-current' : ''}`} />
                    {existingUserRating ? `Rated (${existingUserRating.rating}/10)` : 'Rate'}
                  </button>

                  {/* Favorite Button */}
                  <button
                    onClick={async () => {
                      if (!isAuthenticated) {
                        toast.error('Sign in to add favorites.')
                        navigate('/login')
                        return
                      }
                      if (!currentMovieId || Number.isNaN(currentMovieId)) {
                        toast.error('Invalid movie information.')
                        return
                      }

                      try {
                        if (isMovieFavorited) {
                          await userService.removeFavorite(currentMovieId)
                          removeFromFavorites(currentMovieId)
                          toast.success('Removed from favorites.')
                        } else {
                          await userService.addFavorite(currentMovie)
                          addToFavorites(currentMovie)
                          toast.success('Added to favorites')
                        }
                      } catch (error) {
                        console.error('Favorite operation failed:', error)
                        toast.error('The favorite could not be updated.')
                      }
                    }}
                    className={`btn inline-flex items-center gap-2 ${
                      isMovieFavorited 
                        ? 'btn-secondary border-red-500 text-red-400 hover:bg-red-500 hover:text-white' 
                        : 'btn-secondary'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isMovieFavorited ? 'fill-current' : ''}`} />
                    {isMovieFavorited ? 'In favorites' : 'Add to favorites'}
                  </button>

                  {/* Recommend Button */}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Sign in to recommend a movie.')
                        navigate('/login')
                        return
                      }
                      setShowRecommendModal(true)
                    }}
                    className="btn btn-secondary inline-flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Recommend to a friend
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
                className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
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
                <h2 className="text-2xl font-bold text-white mb-4">Cast</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {credits.cast.slice(0, 8).map(actor => (
                    <div key={actor.id} className="text-center">
                      <img
                        src={tmdbService.getImageURL(actor.profile_path, 'w185') || '/placeholder-actor.svg'}
                        alt={actor.name}
                        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/placeholder-actor.svg'
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
                <h2 className="text-2xl font-bold text-white mb-4">Similar films</h2>
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
              className="rounded-2xl border border-white/10 bg-[#11120f] p-6 shadow-xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Film details</h3>
              
              <div className="space-y-4">
                {budget > 0 && (
                  <div className="border-b border-white/10 pb-4">
                    <h4 className="text-gray-400 text-sm font-medium">Budget</h4>
                    <p className="mt-1 font-semibold text-[#f7f3eb]">{formatBudget(budget)}</p>
                  </div>
                )}

                {revenue > 0 && (
                  <div className="border-b border-white/10 pb-4">
                    <h4 className="text-gray-400 text-sm font-medium">Revenue</h4>
                    <p className="mt-1 font-semibold text-[#f7f3eb]">{formatRevenue(revenue)}</p>
                  </div>
                )}

                {credits?.crew && (
                  <div className="border-b border-white/10 pb-4">
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Director</h4>
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
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Writers</h4>
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
            <h3 className="text-2xl font-bold text-white mb-6">Rate this film</h3>
            
            <div className="space-y-6">
              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Your rating (out of 10)
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-7 h-7 ${
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
                  Your comment (optional)
                </label>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  rows={3}
                  className="input w-full"
                  placeholder="Share your thoughts about the movie..."
                  maxLength={500}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isAuthenticated) {
                        toast.error('Sign in to comment.')
                        navigate('/login')
                        return
                      }
                      const text = userComment.trim()
                      if (!text) {
                        toast.error('The comment cannot be empty.')
                        return
                      }
                      setRatingLoading(true)
                      try {
                        const result = await movieService.upsertComment(id, text, currentMovie)
                        if (result.success) {
                          toast.success('Comment saved.')
                          setUserComment('')
                          setShowRatingModal(false)
                        } else {
                          toast.error(translateError(result.error) || 'The comment could not be saved.')
                        }
                      } finally {
                        setRatingLoading(false)
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    disabled={ratingLoading}
                  >
                    Save comment only
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
                  Cancel
                </button>
                <button
                  onClick={handleRateMovie}
                  className="flex-1 btn btn-primary"
                  disabled={ratingLoading || userRating === 0}
                >
                  {ratingLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Recommendation Modal */}
      <RecommendationModal
        isOpen={showRecommendModal}
        onClose={() => setShowRecommendModal(false)}
        movie={currentMovie}
        onSuccess={() => {
          setShowRecommendModal(false)
        }}
      />
    </div>
  )
}

export default MovieDetail
