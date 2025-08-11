import { create } from 'zustand'
import { movieService } from '../services/movieService'

const useMovieStore = create((set, get) => ({
  movies: [],
  genres: [],
  selectedGenre: null,
  selectedActor: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,

  // Fetch movies
  fetchMovies: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const { movies, totalPages } = await movieService.getMovies(page)
      set({ movies, totalPages, currentPage: page, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Fetch genres
  fetchGenres: async () => {
    try {
      const genres = await movieService.getGenres()
      set({ genres })
    } catch (error) {
      console.error('Failed to fetch genres:', error)
    }
  },

  // Search movies
  searchMovies: async (query, page = 1) => {
    set({ isLoading: true, error: null, searchQuery: query })
    try {
      const { movies, totalPages } = await movieService.searchMovies(query, page)
      set({ movies, totalPages, currentPage: page, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Filter by genre
  filterByGenre: async (genreId, page = 1) => {
    set({ isLoading: true, error: null, selectedGenre: genreId })
    try {
      const { movies, totalPages } = await movieService.getMoviesByGenre(genreId, page)
      set({ movies, totalPages, currentPage: page, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Filter by actor
  filterByActor: async (actor, page = 1) => {
    set({ isLoading: true, error: null, selectedActor: actor })
    try {
      const { movies, totalPages } = await movieService.getMoviesByActor(actor, page)
      set({ movies, totalPages, currentPage: page, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Clear filters
  clearFilters: () => {
    set({ selectedGenre: null, selectedActor: null, searchQuery: '' })
    get().fetchMovies(1)
  },

  // Load next page and append
  loadMore: async () => {
    const { currentPage, selectedGenre, selectedActor, searchQuery, movies } = get()
    const nextPage = (currentPage || 1) + 1
    set({ isLoading: true, error: null })
    try {
      let result
      if (searchQuery) {
        result = await movieService.searchMovies(searchQuery, nextPage)
      } else if (selectedGenre) {
        result = await movieService.getMoviesByGenre(selectedGenre, nextPage)
      } else if (selectedActor) {
        result = await movieService.getMoviesByActor(selectedActor, nextPage)
      } else {
        result = await movieService.getMovies(nextPage)
      }
      const merged = Array.isArray(result.movies)
        ? [...movies, ...result.movies.filter(m => !movies.some(x => x.id === m.id))]
        : movies
      set({ movies: merged, totalPages: result.totalPages || get().totalPages, currentPage: nextPage, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Rate movie
  rateMovie: async (movieId, rating) => {
    try {
      const result = await movieService.rateMovie(movieId, rating)
      // Update the movie in the list
      set((state) => ({
        movies: state.movies.map((movie) =>
          movie.id === movieId
            ? { 
                ...movie, 
                userRating: rating,
                averageRating: result.averageRating,
                ratingsCount: result.ratingsCount,
                friendsAverage: result.friendsAverage,
                friendsCount: result.friendsCount,
              }
            : movie
        ),
      }))
      return { success: true, data: result }
    } catch (error) {
      if (error.response?.status === 429) {
        return { success: false, error: 'Günlük puan verme limitine ulaştınız (10 farklı film)' }
      }
      return { success: false, error: error.message }
    }
  },

  // Remove rating
  removeRating: async (movieId) => {
    try {
      const result = await movieService.removeRating(movieId)
      // Update the movie in the list
      set((state) => ({
        movies: state.movies.map((movie) =>
          movie.id === movieId
            ? { 
                ...movie, 
                userRating: null,
                averageRating: result.averageRating,
                ratingsCount: result.ratingsCount,
                friendsAverage: result.friendsAverage,
                friendsCount: result.friendsCount,
              }
            : movie
        ),
      }))
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}))

export { useMovieStore }