import { create } from 'zustand'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  session: null,

  // Initialize auth state
  initializeAuth: async () => {
    try {
      set({ isLoading: true })
      
      // Debug: Check localStorage
      console.log('LocalStorage keys:', Object.keys(localStorage).filter(key => key.includes('supabase')))
      
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        set({ isLoading: false })
        return
      }

      if (session) {
        const { user } = session
        console.log('Found session for user:', user.email)
        console.log('Session expires at:', new Date(session.expires_at * 1000))
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          
          // If user doesn't exist in profiles table, sign out
          if (profileError.code === 'PGRST116') {
            console.log('User not found in profiles table, signing out...')
            await get().signOut()
            return
          }
        }

        // If no profile found, also sign out
        if (!profile) {
          console.log('No profile found, signing out...')
          await get().signOut()
          return
        }

        set({
          user,
          profile,
          session,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ isLoading: false })
    }
  },

  // Setup auth listener
  setupAuthListener: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            const { user } = session
            
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (profileError) {
              console.error('Error fetching profile:', profileError)
              
              // If user doesn't exist in profiles table, sign out
              if (profileError.code === 'PGRST116') {
                console.log('User not found in profiles table, signing out...')
                await get().signOut()
                return
              }
            }

            // If no profile found, also sign out
            if (!profile) {
              console.log('No profile found, signing out...')
              await get().signOut()
              return
            }

            set({
              user,
              profile,
              session,
              isAuthenticated: true,
              isLoading: false
            })
          }
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      }
    )

    return subscription
  },

  // Sign up with email and password
  signUp: async (email, password, userData = {}) => {
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            username: userData.username
          }
        }
      })

      if (error) {
        toast.error(error.message)
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      // If user is created, update profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: userData.username,
            name: userData.name
          })
          .eq('id', data.user.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }
      }

      set({ isLoading: false })
      toast.success('Kayıt başarılı! E-posta adresinizi kontrol edin.')
      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error('Kayıt sırasında bir hata oluştu')
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast.error(error.message)
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      }

      set({
        user: data.user,
        profile,
        session: data.session,
        isAuthenticated: true,
        isLoading: false
      })

      toast.success('Giriş başarılı!')
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Giriş sırasında bir hata oluştu')
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        toast.error('Çıkış sırasında bir hata oluştu')
        return
      }

      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false
      })

      toast.success('Çıkış yapıldı!')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Çıkış sırasında bir hata oluştu')
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    set({ isLoading: true })
    
    try {
      const user = get().user
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        toast.error('Profil güncellenemedi')
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      set({
        profile: data,
        isLoading: false
      })

      toast.success('Profil güncellendi!')
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Profil güncellenemedi')
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Update avatar
  updateAvatar: async (avatarUrl) => {
    return get().updateProfile({ avatar: avatarUrl })
  },

  // Get current user's access token
  getAccessToken: () => {
    const session = get().session
    return session?.access_token || null
  },

  // Check if user has specific role
  hasRole: (role) => {
    const profile = get().profile
    return profile?.role === role
  },

  // Check if user is admin
  isAdmin: () => {
    return get().hasRole('ADMIN')
  },

  // Check if user is operator or admin
  isOperatorOrAdmin: () => {
    const profile = get().profile
    return profile?.role === 'ADMIN' || profile?.role === 'OPERATOR'
  }
}))

export { useAuthStore }
