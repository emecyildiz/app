import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Calendar, Clock, Heart, Loader } from 'lucide-react'
import { useState } from 'react'
import { tmdbService } from '../services/tmdbService'
import { useFavoritesStore } from '../store/favoritesStore'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import toast from 'react-hot-toast'

const MovieCard = ({ movie, showFavoriteButton = true }) => {
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
  const {
    id,
    title,
    original_title,
    poster_path,
    backdrop_path,
    vote_average,
    release_date,
    runtime,
    overview
  } = movie

  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const { addToFavorites, removeFromFavorites } = useFavoritesStore()
  const favoriteIds = useFavoritesStore(state => state.favoriteIds)
  const isFavorited = favoriteIds.has(Number(id))

  const posterURL = tmdbService.getImageURL(poster_path, 'w500')
  const backdropURL = tmdbService.getImageURL(backdrop_path, 'w500')
  const fallbackPoster = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#1f2937"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="300" height="450" fill="url(#g)"/>
      <g fill="#6b7280">
        <circle cx="150" cy="180" r="60" fill="#374151"/>
        <rect x="85" y="260" width="130" height="18" rx="9"/>
      </g>
    </svg>`
  )

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih yok'
    return new Date(dateString).getFullYear()
  }

  const formatRuntime = (minutes) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}s ${mins}dk`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-lg bg-dark-800 hover:bg-dark-700 transition-all duration-300"
    >
      <Link to={`/movies/${id}`}>
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={posterURL || backdropURL || fallbackPoster}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              if (e.currentTarget && e.currentTarget.src !== fallbackPoster) {
                e.currentTarget.onerror = null
                e.currentTarget.src = fallbackPoster
              }
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-sm text-gray-300 line-clamp-3">
                {overview || 'No overview available'}
              </p>
            </div>
          </div>

          {/* Rating Badge */}
          {vote_average > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-yellow-400 px-2 py-1 rounded-full text-sm font-medium">
              <Star className="w-3 h-3 fill-current" />
              <span>{vote_average.toFixed(1)}</span>
            </div>
          )}

          {/* Favorite Button */}
          {showFavoriteButton && (
            <button
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!isAuthenticated) {
                  toast.error('Sign in to add favorites.')
                  navigate('/login')
                  return
                }
                
                if (isLoadingFavorite) return // Prevent double-click
                
                setIsLoadingFavorite(true)
                try {
                  if (isFavorited) {
                    // Remove from favorites - verify with DB
                    await userService.removeFavorite(id)
                    removeFromFavorites(id)
                    toast.success('Removed from favorites.')
                  } else {
                    // Add to favorites - verify with DB
                    await userService.addFavorite(movie)
                    addToFavorites(movie)
                    toast.success('Favorilere eklendi')
                  }
                } catch (error) {
                  console.error('Favorite operation failed:', error)
                  toast.error('The operation failed.')
                } finally {
                  setIsLoadingFavorite(false)
                }
              }}
              disabled={isLoadingFavorite}
              className="absolute top-2 left-2 p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingFavorite ? (
                <Loader className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Heart 
                  className={`w-4 h-4 ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`} 
                />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
          
          {original_title && original_title !== title && (
            <p className="text-gray-400 text-sm mb-2 line-clamp-1">
              {original_title}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-400">
            {release_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(release_date)}</span>
              </div>
            )}
            
            {runtime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatRuntime(runtime)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default MovieCard
