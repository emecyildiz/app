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
            username: 'johndoe',
            bio: 'Film tutkunu, sinema aşığı',
            location: 'İstanbul, Türkiye',
            avatar: `https://ui-avatars.com/api/?name=John+Doe&background=ef4444&color=fff`,
            memberSince: new Date('2023-01-15').toISOString(),
            socialLinks: {
              twitter: '',
              instagram: '',
              letterboxd: ''
            }
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
            username: userData.username || userData.email.split('@')[0], // Use provided username or generate from email
            bio: '',
            location: '',
            avatar: `https://ui-avatars.com/api/?name=${userData.name.replace(' ', '+')}&background=ef4444&color=fff`,
            memberSince: new Date().toISOString(),
            socialLinks: {
              twitter: '',
              instagram: '',
              letterboxd: ''
            }
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

      updateAvatar: async (avatarUrl) => {
        set({ isLoading: true })
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          set((state) => ({
            user: { ...state.user, avatar: avatarUrl },
            isLoading: false,
          }))
          toast.success('Profil fotoğrafı güncellendi!')
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          toast.error('Profil fotoğrafı güncellenemedi!')
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