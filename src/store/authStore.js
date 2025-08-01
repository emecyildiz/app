import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'emecyildiz01@gmail.com',
  password: 'Nova2357'
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      users: [], // All users for admin management
      operators: [], // Operators list

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          // Check if admin login
          if (credentials.email === ADMIN_CREDENTIALS.email && 
              credentials.password === ADMIN_CREDENTIALS.password) {
            const adminUser = {
              id: 'admin-1',
              email: credentials.email,
              name: 'Admin',
              username: 'admin',
              role: 'admin',
              bio: 'Sistem Yöneticisi',
              location: 'Türkiye',
              avatar: `https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff`,
              memberSince: new Date('2023-01-01').toISOString(),
              socialLinks: {
                twitter: '',
                instagram: '',
                letterboxd: ''
              }
            }
            
            set({ user: adminUser, isAuthenticated: true, isLoading: false })
            toast.success('Admin girişi başarılı!')
            return { success: true }
          }
          
          // Check if operator login
          const operators = get().operators
          const operator = operators.find(op => 
            op.email === credentials.email && op.password === credentials.password
          )
          
          if (operator) {
            set({ user: operator, isAuthenticated: true, isLoading: false })
            toast.success('Operatör girişi başarılı!')
            return { success: true }
          }
          
          // Regular user login
          const user = {
            id: Date.now().toString(),
            email: credentials.email,
            name: 'John Doe',
            username: 'johndoe',
            role: 'user',
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
          
          // Add user to users list if not exists
          const existingUsers = get().users
          if (!existingUsers.find(u => u.email === user.email)) {
            set({ users: [...existingUsers, user] })
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
            id: Date.now().toString(),
            email: userData.email,
            name: userData.name,
            username: userData.username || userData.email.split('@')[0],
            role: 'user',
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
          
          // Add user to users list
          const existingUsers = get().users
          set({ users: [...existingUsers, user] })
          
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

      // Admin functions
      addOperator: async (operatorData) => {
        const currentUser = get().user
        if (currentUser?.role !== 'admin') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        try {
          const newOperator = {
            id: Date.now().toString(),
            ...operatorData,
            role: 'operator',
            avatar: `https://ui-avatars.com/api/?name=${operatorData.name.replace(' ', '+')}&background=3b82f6&color=fff`,
            memberSince: new Date().toISOString(),
            socialLinks: {
              twitter: '',
              instagram: '',
              letterboxd: ''
            }
          }

          set((state) => ({
            operators: [...state.operators, newOperator]
          }))

          toast.success('Operatör başarıyla eklendi!')
          return { success: true }
        } catch (error) {
          toast.error('Operatör eklenemedi!')
          return { success: false, error: error.message }
        }
      },

      removeOperator: async (operatorId) => {
        const currentUser = get().user
        if (currentUser?.role !== 'admin') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        set((state) => ({
          operators: state.operators.filter(op => op.id !== operatorId)
        }))

        toast.success('Operatör kaldırıldı!')
        return { success: true }
      },

      updateUserProfile: async (userId, updates) => {
        const currentUser = get().user
        if (currentUser?.role !== 'admin' && currentUser?.role !== 'operator') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        set((state) => ({
          users: state.users.map(user => 
            user.id === userId ? { ...user, ...updates } : user
          )
        }))

        toast.success('Kullanıcı profili güncellendi!')
        return { success: true }
      },

      deleteUser: async (userId) => {
        const currentUser = get().user
        if (currentUser?.role !== 'admin') {
          toast.error('Bu işlem için yetkiniz yok!')
          return { success: false, error: 'Unauthorized' }
        }

        set((state) => ({
          users: state.users.filter(user => user.id !== userId)
        }))

        toast.success('Kullanıcı silindi!')
        return { success: true }
      },

      getAllUsers: () => {
        const currentUser = get().user
        if (currentUser?.role !== 'admin' && currentUser?.role !== 'operator') {
          return []
        }
        return get().users
      },

      getAllOperators: () => {
        const currentUser = get().user
        if (currentUser?.role !== 'admin') {
          return []
        }
        return get().operators
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)

export { useAuthStore }