import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://zonal-essence-production.up.railway.app'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      users: [], // All users for admin management
      operators: [], // Operators list

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, credentials)
          
          if (response.data.success) {
            const { user, token } = response.data.data
            
            // Set auth headers for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false, 
              token 
            })
            
            toast.success('Giriş başarılı!')
            return { success: true }
          } else {
            set({ isLoading: false })
            toast.error(response.data.message || 'Giriş başarısız!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          set({ isLoading: false })
          const errorMessage = error.response?.data?.message || 'Giriş başarısız!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await axios.post(`${API_URL}/api/auth/register`, userData)
          
          if (response.data.success) {
            const { user, token } = response.data.data
            
            // Set auth headers for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false, 
              token 
            })
            
            toast.success('Kayıt başarılı!')
            return { success: true }
          } else {
            set({ isLoading: false })
            toast.error(response.data.message || 'Kayıt başarısız!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          set({ isLoading: false })
          const errorMessage = error.response?.data?.message || 'Kayıt başarısız!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint
          await axios.post(`${API_URL}/api/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
        } catch (error) {
          console.error('Logout error:', error)
        }
        
        // Clear auth headers
        delete axios.defaults.headers.common['Authorization']
        
        set({ 
          user: null, 
          isAuthenticated: false, 
          token: null 
        })
        toast.success('Çıkış yapıldı!')
      },

      getCurrentUser: async () => {
        const token = get().token
        if (!token) return null
        
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (response.data.success) {
            set({ user: response.data.data.user })
            return response.data.data.user
          }
        } catch (error) {
          console.error('Get current user error:', error)
          // Token might be expired, logout user
          get().logout()
        }
        
        return null
      },

      updateProfile: async (updates) => {
        set({ isLoading: true })
        try {
          const response = await axios.put(`${API_URL}/api/users/profile`, updates, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          if (response.data.success) {
            set((state) => ({
              user: { ...state.user, ...response.data.data.user },
              isLoading: false,
            }))
            toast.success('Profil güncellendi!')
            return { success: true }
          } else {
            set({ isLoading: false })
            toast.error(response.data.message || 'Profil güncellenemedi!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          set({ isLoading: false })
          const errorMessage = error.response?.data?.message || 'Profil güncellenemedi!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      updateAvatar: async (avatarUrl) => {
        set({ isLoading: true })
        try {
          const response = await axios.put(`${API_URL}/api/users/avatar`, { avatarUrl }, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          if (response.data.success) {
            set((state) => ({
              user: { ...state.user, avatarUrl },
              isLoading: false,
            }))
            toast.success('Profil fotoğrafı güncellendi!')
            return { success: true }
          } else {
            set({ isLoading: false })
            toast.error(response.data.message || 'Profil fotoğrafı güncellenemedi!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          set({ isLoading: false })
          const errorMessage = error.response?.data?.message || 'Profil fotoğrafı güncellenemedi!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      // Admin functions
      addOperator: async (operatorData) => {
        const currentUser = get().user
        if (currentUser?.role !== 'ADMIN') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        try {
          const response = await axios.post(`${API_URL}/api/admin/operators`, operatorData, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          if (response.data.success) {
            toast.success('Operatör başarıyla eklendi!')
            return { success: true }
          } else {
            toast.error(response.data.message || 'Operatör eklenemedi!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Operatör eklenemedi!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      removeOperator: async (operatorId) => {
        const currentUser = get().user
        if (currentUser?.role !== 'ADMIN') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        try {
          const response = await axios.delete(`${API_URL}/api/admin/operators/${operatorId}`, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          if (response.data.success) {
            toast.success('Operatör kaldırıldı!')
            return { success: true }
          } else {
            toast.error(response.data.message || 'Operatör kaldırılamadı!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Operatör kaldırılamadı!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      updateUserProfile: async (userId, updates) => {
        const currentUser = get().user
        if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OPERATOR') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        try {
          const response = await axios.put(`${API_URL}/api/admin/users/${userId}`, updates, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          if (response.data.success) {
            toast.success('Kullanıcı profili güncellendi!')
            return { success: true }
          } else {
            toast.error(response.data.message || 'Kullanıcı profili güncellenemedi!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Kullanıcı profili güncellenemedi!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      deleteUser: async (userId) => {
        const currentUser = get().user
        if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OPERATOR') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        try {
          const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          if (response.data.success) {
            toast.success('Kullanıcı silindi!')
            return { success: true }
          } else {
            toast.error(response.data.message || 'Kullanıcı silinemedi!')
            return { success: false, error: response.data.message }
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Kullanıcı silinemedi!'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      getAllUsers: async () => {
        const currentUser = get().user
        if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'OPERATOR') {
          return []
        }

        try {
          const response = await axios.get(`${API_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          if (response.data.success) {
            const users = response.data.data.users || []
            set({ users })
            return users
          }
        } catch (error) {
          console.error('Get users error:', error)
        }
        
        return []
      },

      getAllOperators: async () => {
        const currentUser = get().user
        if (currentUser?.role !== 'ADMIN') {
          return []
        }

        try {
          const response = await axios.get(`${API_URL}/api/admin/operators`, {
            headers: { Authorization: `Bearer ${get().token}` }
          })
          
          console.log('getAllOperators - Response:', response.data)
          
          if (response.data.success) {
            const operators = response.data.data.operators || []
            console.log('getAllOperators - Operators:', operators)
            set({ operators })
            return operators
          }
        } catch (error) {
          console.error('Get operators error:', error)
        }
        
        return []
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)

export { useAuthStore }