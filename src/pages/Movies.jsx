import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Film, Search } from 'lucide-react'

import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useMovieStore } from '../store/movieStore'

const Movies = () => {
  const {
    movies,
    genres,
    isLoading,
    error,
    fetchMovies,
    fetchGenres,
    searchMovies,
    filterByGenre,
    clearFilters,
  } = useMovieStore()

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')

  // Initial load + handle genre filter from URL
  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  useEffect(() => {
    const genreParam = searchParams.get('genre')
    if (genreParam) {
      const genreId = parseInt(genreParam, 10)
      if (!Number.isNaN(genreId)) {
        filterByGenre(genreId)
        return
      }
    }
    // default: fetch first page
    fetchMovies(1)
  }, [searchParams, fetchMovies, filterByGenre])

  const onSubmitSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    // Clear genre param when searching
    setSearchParams((prev) => {
      prev.delete('genre')
      return prev
    })
    searchMovies(query.trim())
  }

  const onClear = () => {
    setQuery('')
    setSearchParams((prev) => {
      prev.delete('genre')
      return prev
    })
    clearFilters()
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Filmler</h1>
            <p className="text-gray-400">Keşfet, ara ve detayları incele</p>
          </div>

          <form onSubmit={onSubmitSearch} className="w-full md:w-auto">
            <div className="flex items-center gap-2">
              <div className="flex-1 md:flex-none md:w-80 relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Film ara..."
                  className="w-full bg-dark-200 text-white rounded-lg py-2.5 pl-10 pr-3 outline-none border border-dark-300 focus:border-primary-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button type="submit" className="btn btn-primary">Ara</button>
              <button type="button" onClick={onClear} className="btn btn-ghost glass">Temizle</button>
            </div>
          </form>
        </div>

        {/* Genres filter */}
        {Array.isArray(genres) && genres.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => { setSearchParams({}); fetchMovies(1) }} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white">Tümü</button>
            {genres.slice(0, 12).map((g) => (
              <button
                key={g.id}
                onClick={() => setSearchParams({ genre: String(g.id) })}
                className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white"
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="py-16">
            <LoadingSpinner fullScreen={false} />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="glass p-6 rounded-lg text-center text-red-400 mb-8">{error}</div>
        )}

        {/* Movies grid */}
        {!isLoading && !error && (
          <>
            {Array.isArray(movies) && movies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {movies.map((movie, index) => (
                    <MovieCard key={`${movie.id}-${index}`} movie={movie} index={index} />
                  ))}
                </div>
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => useMovieStore.getState().loadMore()}
                    className="btn btn-secondary"
                  >
                    Daha Fazla Yükle
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass p-10 rounded-xl text-center"
              >
                <Film className="w-10 h-10 text-primary-400 mx-auto mb-3" />
                <p className="text-gray-300">Gösterilecek film bulunamadı.</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Movies