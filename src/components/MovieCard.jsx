import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Calendar, Clock, Heart } from 'lucide-react'
import { tmdbService } from '../services/tmdbService'
import { useFavoritesStore } from '../store/favoritesStore'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import toast from 'react-hot-toast'

const MovieCard = ({ movie, showFavoriteButton = true }) => {
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
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore()
  const isFavorited = isFavorite(id)

  const posterURL = tmdbService.getImageURL(poster_path, 'w500')
  const backdropURL = tmdbService.getImageURL(backdrop_path, 'w500')

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
            src={posterURL || backdropURL || '/placeholder-movie.jpg'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = '/placeholder-movie.jpg'
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-sm text-gray-300 line-clamp-3">
                {overview || 'Açıklama bulunamadı'}
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
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!isAuthenticated) {
                  toast.error('Favorilere eklemek için giriş yapın')
                  navigate('/login')
                  return
                }
                if (isFavorited) {
                  removeFromFavorites(id)
                  userService.removeFavorite(id)
                } else {
                  addToFavorites(movie)
                  userService.addFavorite(id)
                }
              }}
              className="absolute top-2 left-2 p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
            >
              <Heart 
                className={`w-4 h-4 ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`} 
              />
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
