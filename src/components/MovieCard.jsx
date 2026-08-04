import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Loader, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { tmdbService } from '../services/tmdbService'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/newAuthStore'
import { useFavoritesStore } from '../store/favoritesStore'

const MovieCard = ({ movie, showFavoriteButton = true }) => {
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addToFavorites, removeFromFavorites } = useFavoritesStore()
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)

  const {
    id,
    title,
    original_title,
    poster_path,
    backdrop_path,
    vote_average,
    release_date,
    runtime,
  } = movie

  const isFavorited = favoriteIds.has(Number(id))
  const posterUrl = tmdbService.getImageURL(poster_path, 'w500')
  const backdropUrl = tmdbService.getImageURL(backdrop_path, 'w500')
  const fallbackPoster = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
      <rect width="300" height="450" fill="#171814"/>
      <path d="M35 385h230M75 70h150v225H75z" fill="none" stroke="#4d4c47" stroke-width="4"/>
      <circle cx="150" cy="164" r="38" fill="none" stroke="#4d4c47" stroke-width="4"/>
      <text x="150" y="338" fill="#77756f" font-family="sans-serif" font-size="15" text-anchor="middle" letter-spacing="3">NO POSTER</text>
    </svg>`,
  )

  const releaseYear = release_date ? new Date(release_date).getFullYear() : 'Year unknown'

  const formattedRuntime = runtime
    ? `${Math.floor(runtime / 60)}h ${runtime % 60}m`
    : null

  const toggleFavorite = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Sign in to add films to your favorites.')
      navigate('/login')
      return
    }

    if (isLoadingFavorite) return
    setIsLoadingFavorite(true)

    try {
      if (isFavorited) {
        await userService.removeFavorite(id)
        removeFromFavorites(id)
        toast.success('Removed from favorites.')
      } else {
        await userService.addFavorite(movie)
        addToFavorites(movie)
        toast.success('Added to favorites.')
      }
    } catch (error) {
      console.error('Favorite operation failed:', error)
      toast.error('The favorite could not be updated.')
    } finally {
      setIsLoadingFavorite(false)
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="group min-w-0"
    >
      <Link to={`/movies/${id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e85d4a] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0d0e0c]">
        <div className="relative aspect-[2/3] overflow-hidden border border-white/10 bg-[#171814]">
          <img
            src={posterUrl || backdropUrl || fallbackPoster}
            alt={`${title} poster`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.025] group-hover:brightness-90"
            onError={(event) => {
              if (event.currentTarget.src !== fallbackPoster) {
                event.currentTarget.onerror = null
                event.currentTarget.src = fallbackPoster
              }
            }}
          />

          {vote_average > 0 && (
            <div className="absolute right-0 top-0 flex items-center gap-1.5 bg-[#e7dfd1] px-2.5 py-2 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#181714]">
              <Star className="h-3 w-3 fill-current" />
              {vote_average.toFixed(1)}
            </div>
          )}

          {showFavoriteButton && (
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={isLoadingFavorite}
              aria-label={isFavorited ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
              className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center border-b border-r border-white/10 bg-[#0d0e0c]/90 transition hover:bg-[#e85d4a] hover:text-[#181714] disabled:cursor-wait disabled:opacity-60 ${isFavorited ? 'text-[#e85d4a]' : 'text-[#e8e3d9]'}`}
            >
              {isLoadingFavorite ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} strokeWidth={1.8} />
              )}
            </button>
          )}

          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
          <span className="absolute bottom-3 right-3 translate-y-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            View film →
          </span>
        </div>

        <div className="border-b border-white/10 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="min-w-0 truncate font-display text-xl text-[#e8e3d9] transition group-hover:text-[#e85d4a]">
              {title}
            </h3>
            <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-[#77756f]">{releaseYear}</span>
          </div>

          <div className="mt-1 flex min-h-5 items-center gap-3 text-xs text-[#77756f]">
            {original_title && original_title !== title && <span className="truncate">{original_title}</span>}
            {formattedRuntime && <span className="shrink-0">{formattedRuntime}</span>}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

export default MovieCard
