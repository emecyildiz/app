import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      
      // Add movie to favorites
      addToFavorites: (movie) => {
        const { favorites } = get()
        const isAlreadyFavorite = favorites.some(fav => fav.id === movie.id)
        
        if (isAlreadyFavorite) {
          toast.error('Bu film zaten favorilerinizde!')
          return
        }
        
        set({ favorites: [...favorites, movie] })
        toast.success('Film favorilere eklendi!')
      },
      
      // Remove movie from favorites
      removeFromFavorites: (movieId) => {
        set((state) => ({
          favorites: state.favorites.filter(movie => movie.id !== movieId)
        }))
        toast.success('Film favorilerden kaldırıldı!')
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