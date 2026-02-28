import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [], // Keep for UI/cache
      favoriteIds: new Set(), // True source from DB
      
      addToFavorites: (movie) => {
        const { favorites, favoriteIds } = get()
        if (!favoriteIds.has(movie.id)) {
          set({ 
            favorites: [...favorites, movie],
            favoriteIds: new Set([...favoriteIds, movie.id])
          })
        }
      },
      
      removeFromFavorites: (movieId) => {
        const { favorites, favoriteIds } = get()
        const newIds = new Set(favoriteIds)
        newIds.delete(movieId)
        set({ 
          favorites: favorites.filter(f => f.id !== movieId),
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
        const { favoriteIds } = get()
        return favoriteIds.has(movieId)
      },
      
      // Sync from DB - called on app load and after add/remove
      syncFromDB: (favoriteIds) => {
        set({ favoriteIds: new Set(favoriteIds) })
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
