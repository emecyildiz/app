import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      
      addToFavorites: (movie) => {
        const { favorites } = get()
        if (!favorites.find(f => f.id === movie.id)) {
          set({ favorites: [...favorites, movie] })
        }
      },
      
      removeFromFavorites: (movieId) => {
        const { favorites } = get()
        set({ favorites: favorites.filter(f => f.id !== movieId) })
      },
      
      clearFavorites: () => {
        set({ favorites: [] })
      },
      
      isFavorite: (movieId) => {
        const { favorites } = get()
        return favorites.some(f => f.id === movieId)
      },
      
      getFavoritesCount: () => {
        const { favorites } = get()
        return favorites.length
      }
    }),
    {
      name: 'favorites-storage',
    }
  )
)
