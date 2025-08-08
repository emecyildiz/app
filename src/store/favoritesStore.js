import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { userService } from '../services/userService'

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      
      // Add movie to favorites
      addToFavorites: async (movie) => {
        const { favorites } = get()
        const isAlreadyFavorite = favorites.some(fav => fav.id === movie.id)
        
        if (isAlreadyFavorite) {
          toast.error('Bu film zaten favorilerinizde!')
          return
        }
        // Optimistic update
        set({ favorites: [...favorites, movie] })
        try {
          const ok = await userService.addFavorite(movie.id)
          if (!ok) throw new Error('failed')
          toast.success('Film favorilere eklendi!')
        } catch (_) {
          // Revert
          set({ favorites: get().favorites.filter(m => m.id !== movie.id) })
          toast.error('Favorilere eklenemedi!')
        }
      },
      
      // Remove movie from favorites
      removeFromFavorites: async (movieId) => {
        const prev = get().favorites
        set({ favorites: prev.filter(movie => movie.id !== movieId) })
        try {
          const ok = await userService.removeFavorite(movieId)
          if (!ok) throw new Error('failed')
          toast.success('Film favorilerden kaldırıldı!')
        } catch (_) {
          set({ favorites: prev })
          toast.error('Favorilerden kaldırılamadı!')
        }
      },
      
      // Check if movie is favorite
      isFavorite: (movieId) => {
        const { favorites } = get()
        return favorites.some(movie => movie.id === movieId)
      },
      
      // Get favorites count
      getFavoritesCount: () => {
        return get().favorites.length
      },
      
      // Clear all favorites
      clearFavorites: () => {
        set({ favorites: [] })
        toast.success('Tüm favoriler temizlendi!')
      }
    }),
    {
      name: 'favorites-storage',
    }
  )
)

export { useFavoritesStore }