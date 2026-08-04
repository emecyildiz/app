import { create } from 'zustand'
import { tmdbService } from '../services/tmdbService'

export const useMovieStore = create((set, get) => ({
  // State
  movies: [],
  currentMovie: null,
  genres: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  searchQuery: '',
  selectedGenre: null,
  sortBy: 'popularity.desc',
  listType: 'popular',

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Load a movie list.
  loadMovies: async (type = 'popular', page = 1) => {
    set({ loading: true, error: null })
    try {
      let response
      switch (type) {
        case 'popular':
          response = await tmdbService.getPopularMovies(page)
          break
        case 'latest':
          response = await tmdbService.getLatestMovies(page)
          break
        case 'topRated':
          response = await tmdbService.getTopRatedMovies(page)
          break
        default:
          response = await tmdbService.getPopularMovies(page)
      }

      set({
        movies: response.results,
        currentPage: response.page,
        totalPages: response.total_pages,
        listType: type,
        searchQuery: '',
        selectedGenre: null,
        loading: false
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Load movie details.
  loadMovieDetails: async (movieId) => {
    set({ loading: true, error: null })
    try {
      const movie = await tmdbService.getMovieDetails(movieId)
      set({ currentMovie: movie, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Search for movies.
  searchMovies: async (query, page = 1) => {
    if (!query.trim()) {
      get().loadMovies('popular', page)
      return
    }

    set({ loading: true, error: null, searchQuery: query })
    try {
      const response = await tmdbService.searchMovies(query, page)
      set({
        movies: response.results,
        currentPage: response.page,
        totalPages: response.total_pages,
        loading: false
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Load genres.
  loadGenres: async () => {
    try {
      const response = await tmdbService.getGenres()
      set({ genres: response.genres || [] })
    } catch (error) {
      console.error('Genres could not be loaded:', error)
      set({ genres: [] })
    }
  },

  // Load movies by genre.
  loadMoviesByGenre: async (genreId, page = 1) => {
    set({ loading: true, error: null, selectedGenre: genreId })
    try {
      const response = await tmdbService.getMoviesByGenre(genreId, page)
      set({
        movies: response.results,
        currentPage: response.page,
        totalPages: response.total_pages,
        loading: false
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Change the active page without losing the current catalog mode.
  changePage: (page) => {
    const { searchQuery, selectedGenre, listType } = get()
    if (searchQuery) {
      get().searchMovies(searchQuery, page)
    } else if (selectedGenre) {
      get().loadMoviesByGenre(selectedGenre, page)
    } else {
      get().loadMovies(listType, page)
    }
  },

  // Clear the active search.
  clearSearch: () => {
    set({ searchQuery: '', selectedGenre: null })
    get().loadMovies('popular', 1)
  },

  // Clear the selected genre.
  clearGenreFilter: () => {
    set({ selectedGenre: null })
    get().loadMovies('popular', 1)
  },

  // Clear movie details.
  clearCurrentMovie: () => set({ currentMovie: null })
}))
