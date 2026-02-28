import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [], // Keep for UI/cache
      favoriteIds: new Set(), // True source from DB
      
      addToFavorites: (movie) => {
        const movieId = Number(movie?.id)
        if (Number.isNaN(movieId)) return
        const { favorites, favoriteIds } = get()
        if (!favoriteIds.has(movieId)) {
          set({ 
            favorites: [...favorites, movie],
            favoriteIds: new Set([...favoriteIds, movieId])
          })
        }
      },
      
      removeFromFavorites: (movieId) => {
        const numericMovieId = Number(movieId)
        if (Number.isNaN(numericMovieId)) return
        const { favorites, favoriteIds } = get()
        const newIds = new Set(favoriteIds)
        newIds.delete(numericMovieId)
        set({ 
          favorites: favorites.filter(f => Number(f.id) !== numericMovieId),
          favoriteIds: newIds
        })
      },
      
      clearFavorites: () => {
        set({ 
          favorites: [],
          favoriteIds: new Set()
        })
      },
      
      isFavorite: (movieId) => {
        const numericMovieId = Number(movieId)
        if (Number.isNaN(numericMovieId)) return false
        const { favoriteIds } = get()
        return favoriteIds.has(numericMovieId)
      },
      
      // Sync from DB - called on app load and after add/remove
      syncFromDB: (favoriteIds) => {
        const normalized = (Array.isArray(favoriteIds) ? favoriteIds : [])
          .map(id => Number(id))
          .filter(id => !Number.isNaN(id))
        set({ favoriteIds: new Set(normalized) })
      },
      
      getFavoritesCount: () => {
        const { favoriteIds } = get()
        return favoriteIds.size
      }
    }),
    {
      name: 'favorites-storage',
      serialize: (state) => JSON.stringify({
        state: {
          favorites: state.state.favorites,
          favoriteIds: Array.from(state.state.favoriteIds || [])
        }
      }),
      deserialize: (str) => {
        const { state } = JSON.parse(str)
        return {
          state: {
            favorites: state.favorites || [],
            favoriteIds: new Set(state.favoriteIds || [])
          }
        }
      }
    }
  )
)

// Custom deserialization
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('favorites-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.state?.favoriteIds && Array.isArray(parsed.state.favoriteIds)) {
        parsed.state.favoriteIds = new Set(parsed.state.favoriteIds)
      }
    } catch (e) {
      console.error('Failed to parse favorites storage:', e)
    }
  }
}
