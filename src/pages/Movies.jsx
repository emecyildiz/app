import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import MovieCard from '../components/MovieCard'
import { useMovieStore } from '../store/movieStore'

const genreNameToId = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'science-fiction': 878,
  thriller: 53,
  'tv-movie': 10770,
  war: 10752,
  western: 37,
}

const catalogTabs = [
  { key: 'popular', label: 'Popular now' },
  { key: 'latest', label: 'New releases' },
  { key: 'topRated', label: 'Top rated' },
]

const Movies = () => {
  const [searchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('popular')

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
    clearGenreFilter,
  } = useMovieStore()

  useEffect(() => {
    loadGenres()
    const genreParam = searchParams.get('genre')
    const genreId = genreParam ? genreNameToId[genreParam.toLowerCase()] : null

    if (genreId) {
      loadMoviesByGenre(genreId)
      setShowFilters(true)
    } else {
      loadMovies('popular')
    }
  }, [searchParams, loadGenres, loadMoviesByGenre, loadMovies])

  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  const handleSearch = (event) => {
    event.preventDefault()
    const value = searchInput.trim()
    if (value) searchMovies(value)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchInput('')
    loadMovies(tab)
  }

  const handleGenreSelect = (genreId) => {
    if (selectedGenre === genreId) {
      clearGenreFilter()
    } else {
      setSearchInput('')
      loadMoviesByGenre(genreId)
    }
  }

  const clearAllFilters = () => {
    setSearchInput('')
    setActiveTab('popular')
    clearSearch()
  }

  if (error) {
    return (
      <section className="flex min-h-[65vh] items-center justify-center bg-[#0d0e0c] px-5">
        <div className="max-w-xl border border-white/10 p-8 text-center">
          <p className="ui-eyebrow">Catalog unavailable</p>
          <h1 className="mt-4 font-display text-4xl text-[#e8e3d9]">The film index could not be loaded.</h1>
          <p className="mt-4 text-sm leading-7 text-[#96938c]">{error}</p>
          <button type="button" onClick={() => loadMovies(activeTab)} className="ui-button-primary mt-7">
            Try again
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0e0c] text-[#e8e3d9]">
      <header className="border-b border-white/10 bg-[#11120f]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
          <p className="ui-eyebrow">Catalog / browse and discover</p>
          <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-6xl tracking-[-0.045em] sm:text-8xl">Film index</h1>
              <p className="mt-4 max-w-xl leading-7 text-[#96938c]">
                Search the catalog, move through genres, or start with what people are watching now.
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66645f]">
              {movies?.length || 0} entries on this page
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-10 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="flex min-h-12 items-center border border-white/15 bg-[#0d0e0c] px-4 focus-within:border-[#e85d4a]">
              <Search className="h-4 w-4 shrink-0 text-[#77756f]" strokeWidth={1.6} />
              <span className="sr-only">Search films</span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#66645f]"
              />
            </label>
            <button type="submit" className="ui-button-primary">Search</button>
            <button
              type="button"
              onClick={() => setShowFilters((visible) => !visible)}
              aria-expanded={showFilters}
              className="ui-button-secondary"
            >
              <Filter className="h-4 w-4" /> Filters
            </button>
          </form>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.section
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/10 bg-[#151613]"
          >
            <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
              <div className="flex flex-wrap gap-px border border-white/10 bg-white/10">
                {catalogTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`min-h-11 flex-1 bg-[#151613] px-5 text-sm transition sm:flex-none ${
                      activeTab === tab.key && !searchQuery && !selectedGenre
                        ? 'text-[#e85d4a]'
                        : 'text-[#96938c] hover:text-[#e8e3d9]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-7">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#e85d4a]" />
                  <p className="ui-eyebrow">Genres</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {genres?.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => handleGenreSelect(genre.id)}
                      className={`border px-3 py-2 text-xs transition ${
                        selectedGenre === genre.id
                          ? 'border-[#e85d4a] bg-[#e85d4a] text-[#17130f]'
                          : 'border-white/10 text-[#96938c] hover:border-white/30 hover:text-[#e8e3d9]'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        {(searchQuery || selectedGenre) && (
          <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-white/10 pb-5 text-sm">
            <span className="ui-eyebrow">Showing</span>
            {searchQuery && <span className="text-[#d2ccc1]">Search: “{searchQuery}”</span>}
            {selectedGenre && (
              <span className="text-[#d2ccc1]">
                Genre: {genres.find((genre) => genre.id === selectedGenre)?.name || selectedGenre}
              </span>
            )}
            <button type="button" onClick={clearAllFilters} className="ml-auto inline-flex items-center gap-1 text-xs text-[#e85d4a] hover:text-[#f47b65]">
              Clear <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center"><LoadingSpinner /></div>
        ) : movies?.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-6"
          >
            {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
          </motion.div>
        ) : (
          <div className="border-y border-white/10 py-20 text-center">
            <p className="ui-eyebrow">No entries</p>
            <h2 className="mt-4 font-display text-4xl">No films matched this view.</h2>
            <button type="button" onClick={clearAllFilters} className="ui-button-secondary mt-7">Return to popular films</button>
          </div>
        )}

        {!loading && totalPages > 1 && movies?.length > 0 && (
          <nav aria-label="Catalog pagination" className="mt-14 flex items-center justify-between border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa79f] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77756f]">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa79f] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </main>
    </div>
  )
}

export default Movies
