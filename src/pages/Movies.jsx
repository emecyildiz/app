import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'

import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useMovieStore } from '../store/movieStore'

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  
  const {
    movies,
    genres,
    isLoading,
    currentPage,
    totalPages,
    selectedGenre,
    searchQuery,
    fetchMovies,
    fetchGenres,
    searchMovies,
    filterByGenre,
    clearFilters,
  } = useMovieStore()

  useEffect(() => {
    fetchGenres()
    
    // Check URL params
    const search = searchParams.get('search')
    const genre = searchParams.get('genre')
    
    if (search) {
      setLocalSearchQuery(search)
      searchMovies(search)
    } else if (genre) {
      filterByGenre(genre)
    } else {
      fetchMovies(1)
    }
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    if (localSearchQuery.trim()) {
      setSearchParams({ search: localSearchQuery })
      searchMovies(localSearchQuery)
      // Scroll to top after search
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setSearchParams({})
      clearFilters()
    }
  }

  const handleGenreFilter = (genreId) => {
    if (genreId) {
      setSearchParams({ genre: genreId })
      filterByGenre(genreId)
    } else {
      setSearchParams({})
      clearFilters()
    }
    // Scroll to top after filter change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageChange = (page) => {
    if (searchQuery) {
      searchMovies(searchQuery, page)
    } else if (selectedGenre) {
      filterByGenre(selectedGenre, page)
    } else {
      fetchMovies(page)
    }
    // Scroll to top after page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Filmler</h1>
          <p className="text-gray-400 text-lg">
            {searchQuery
              ? `"${searchQuery}" için arama sonuçları`
              : selectedGenre
              ? `${genres.find((g) => g.id === parseInt(selectedGenre))?.name || ''} filmleri`
              : 'Tüm filmler'}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <input
              type="search"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Film ara..."
              className="w-full px-6 py-4 pr-12 rounded-xl bg-dark-200 border border-dark-500 text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-lg"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors p-2"
            >
              <Search className="w-6 h-6" />
            </button>
          </form>

          {/* Filter Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
            >
              <Filter className="w-4 h-4" />
              <span>Filtreler</span>
            </button>
            
            {(searchQuery || selectedGenre) && (
              <button
                onClick={() => {
                  setSearchParams({})
                  setLocalSearchQuery('')
                  clearFilters()
                }}
                className="btn btn-ghost text-primary-400"
              >
                <X className="w-4 h-4" />
                <span>Filtreleri Temizle</span>
              </button>
            )}
          </div>

          {/* Genre Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl p-6"
            >
              <h3 className="text-white font-semibold mb-4">Türler</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleGenreFilter(null)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    !selectedGenre
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                  }`}
                >
                  Tümü
                </button>
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreFilter(genre.id)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedGenre === genre.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Movies Grid */}
        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Film bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
              {movies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-300 text-gray-300 hover:bg-dark-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Movies