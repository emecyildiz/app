import { Link } from 'react-router-dom'
import { Star, Calendar, Clock, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFavoritesStore } from '../store/favoritesStore'

const MovieCard = ({ movie, index = 0, showFavoriteButton = true }) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore()
  const isMovieFavorite = isFavorite(movie.id)

  const handleFavoriteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isMovieFavorite) {
      removeFromFavorites(movie.id)
    } else {
      addToFavorites(movie)
    }
  }

  const handleMovieClick = () => {
    // Scroll to top when movie is clicked
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <Link to={`/movies/${movie.id}`} className="block" onClick={handleMovieClick}>
        <div className="relative overflow-hidden rounded-xl bg-dark-200 transition-all duration-300 hover:transform hover:scale-[1.02]">
          {/* Poster */}
          <div className="aspect-[2/3] overflow-hidden">
            <img
              src={movie.posterUrl || movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Rating Badge */}
            <div className="absolute top-3 right-3 glass px-2 py-1 rounded-lg flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-white font-semibold text-sm">{movie.averageRating ? movie.averageRating.toFixed(1) : movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
            </div>

            {/* Favorite Button */}
            {showFavoriteButton && (
              <button
                onClick={handleFavoriteClick}
                className={`absolute top-3 left-3 p-2 rounded-full transition-all duration-300 ${
                  isMovieFavorite
                    ? 'bg-red-500/90 opacity-100'
                    : 'bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-red-500/90'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isMovieFavorite ? 'text-white fill-current' : 'text-white'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
              {movie.title}
            </h3>
            
            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
              {movie.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{movie.releaseYear || new Date(movie.releaseDate).getFullYear()}</span>
              </div>
              {(movie.duration || movie.runtime) && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{movie.duration || movie.runtime} dk</span>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mt-3">
              {movie.genres && movie.genres.slice(0, 2).map((genre, index) => (
                <span
                  key={genre.id || index}
                  className="px-2 py-1 text-xs bg-dark-300 text-gray-300 rounded-md"
                >
                  {typeof genre === 'string' ? genre : genre.name}
                </span>
              ))}
              {movie.genres && movie.genres.length > 2 && (
                <span className="px-2 py-1 text-xs bg-dark-300 text-gray-300 rounded-md">
                  +{movie.genres.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* Hover Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-primary-500/90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default MovieCard