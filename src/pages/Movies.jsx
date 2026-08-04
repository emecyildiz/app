import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMovieStore } from '../store/movieStore'
import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'

const Movies = () => {
  const [searchParams] = useSearchParams()
  
  const {
    movies,
    genres,
    loading,
    error,
    currentPage,
    totalPages,
    searchQuery,
    selectedGenre,
    loadMovies,
    searchMovies,
    loadGenres,
    loadMoviesByGenre,
    changePage,
    clearSearch,
    clearGenreFilter
  } = useMovieStore()

  const [searchInput, setSearchInput] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('popular')

  // Genre name to TMDB ID mapping
  const genreNameToId = {
    'action': 28,
    'adventure': 12,
    'animation': 16,
    'comedy': 35,
    'crime': 80,
    'documentary': 99,
    'drama': 18,
    'family': 10751,
    'fantasy': 14,
    'history': 36,
    'horror': 27,
    'music': 10402,
    'mystery': 9648,
    'romance': 10749,
    'science-fiction': 878,
    'thriller': 53,
    'tv-movie': 10770,
    'war': 10752,
    'western': 37
  }

  useEffect(() => {
    loadGenres()
    
    // Check URL for genre parameter
    const genreParam = searchParams.get('genre')
    if (genreParam && genreNameToId[genreParam.toLowerCase()]) {
      const genreId = genreNameToId[genreParam.toLowerCase()]
      loadMoviesByGenre(genreId)
    } else {
      loadMovies('popular')
    }
  }, [searchParams, loadGenres, loadMoviesByGenre, loadMovies])

  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      searchMovies(searchInput.trim())
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    clearSearch()
    clearGenreFilter()
    loadMovies(tab)
  }

  const handleGenreSelect = (genreId) => {
    if (selectedGenre === genreId) {
      clearGenreFilter()
    } else {
      loadMoviesByGenre(genreId)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => loadMovies('popular')}
            className="btn btn-primary"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Filmler</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Film ara..."
                className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary px-6"
            >
              Ara
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary px-4"
            >
              <Filter className="w-5 h-5" />
            </button>
          </form>

          {/* Active Filters */}
          {(searchQuery || selectedGenre) && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400">Filtreler:</span>
              {searchQuery && (
                <span className="bg-primary-500/20 text-primary-300 px-3 py-1 rounded-full text-sm">
                  "{searchQuery}"
                  <button
                    onClick={clearSearch}
                    className="ml-2 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedGenre && (
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                  {genres.find(g => g.id === selectedGenre)?.name}
                  <button
                    onClick={clearGenreFilter}
                    className="ml-2 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-dark-800 rounded-lg p-6 mb-6"
            >
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { key: 'popular', label: 'Popular' },
                  { key: 'latest', label: 'En Yeni' },
                  { key: 'topRated', label: 'Top rated' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.key && !searchQuery && !selectedGenre
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Genres */}
              <div>
                <h3 className="text-white font-semibold mb-3">Kategoriler</h3>
                <div className="flex flex-wrap gap-2">
                  {genres && genres.length > 0 ? (
                    genres.map(genre => (
                      <button
                        key={genre.id}
                        onClick={() => handleGenreSelect(genre.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedGenre === genre.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">Loading genres...</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {movies && movies.length > 0 ? (
                movies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <p className="text-gray-400">No movies found</p>
                </div>
              )}
            </motion.div>

            {/* Pagination */}
            {totalPages && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <span className="text-white">
                  Page {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* No Results */}
            {movies && movies.length === 0 && !loading && (
              <div className="text-center py-20">
                <h3 className="text-2xl font-bold text-white mb-4">No results found</h3>
                <p className="text-gray-400 mb-6">
                  No movies matched your search.
                </p>
                <button
                  onClick={clearSearch}
                  className="btn btn-primary"
                >
                  Filtreleri Temizle
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
