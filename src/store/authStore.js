import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          // Mock user data
          const user = {
            id: 1,
            email: credentials.email,
            name: 'John Doe',
            avatar: `https://ui-avatars.com/api/?name=John+Doe&background=ef4444&color=fff`,
          }
          
          set({ user, isAuthenticated: true, isLoading: false })
          toast.success('Giriş başarılı!')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          toast.error('Giriş başarısız!')
          return { success: false, error: error.message }
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          // Mock user data
          const user = {
            id: Date.now(),
            email: userData.email,
            name: userData.name,
            avatar: `https://ui-avatars.com/api/?name=${userData.name.replace(' ', '+')}&background=ef4444&color=fff`,
          }
          
          set({ user, isAuthenticated: true, isLoading: false })
          toast.success('Kayıt başarılı!')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          toast.error('Kayıt başarısız!')
          return { success: false, error: error.message }
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
        toast.success('Çıkış yapıldı!')
      },

      updateProfile: async (updates) => {
        set({ isLoading: true })
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          set((state) => ({
            user: { ...state.user, ...updates },
            isLoading: false,
          }))
          toast.success('Profil güncellendi!')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          toast.error('Profil güncellenemedi!')
          return { success: false, error: error.message }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export { useAuthStore }