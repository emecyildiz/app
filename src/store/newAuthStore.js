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
      console.log('LocalStorage keys:', Object.keys(localStorage).filter(key => key.includes('supabase') || key.startsWith('sb-')))
      
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

        // Immediately mark authenticated so UI can render
        set({ user, session, isAuthenticated: true, isLoading: false })
        // Persist API token for backend endpoints expecting Bearer
        try {
          sessionStorage.setItem('auth-token', session.access_token)
        } catch {}

        // Fetch profile in background and update when ready
        ;(async () => {
          try {
            const { data, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (profileError && profileError.code === 'PGRST116') {
              await supabase.from('profiles').insert({
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user'
              })
            }

            const finalProfile = data || {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              role: 'USER'
            }
            set({ profile: finalProfile })
          } catch (error) {
            console.error('Background profile fetch error:', error)
            const fallback = {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              role: 'USER'
            }
            set({ profile: fallback })
          }
        })()
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

            // Immediately set authenticated so UI shows
            set({ user, session, isAuthenticated: true, isLoading: false })
            try {
              sessionStorage.setItem('auth-token', session.access_token)
            } catch {}

            // Update profile in background
            try {
              const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

              if (profileError && profileError.code === 'PGRST116') {
                await supabase.from('profiles').insert({
                  id: user.id,
                  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                  username: user.user_metadata?.username || user.email?.split('@')[0] || 'user'
                })
              }

              const finalProfile = data || {
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                role: 'USER'
              }
              set({ profile: finalProfile })
            } catch (error) {
              console.error('Listener background profile fetch error:', error)
              const fallback = {
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                role: 'USER'
              }
              set({ profile: fallback })
            }
          }
        } else if (event === 'SIGNED_OUT') {
          try { sessionStorage.removeItem('auth-token') } catch {}
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

      // If user is created, ensure profile exists
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: userData.username,
            name: userData.name
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('Error creating/updating profile:', profileError)
          // Don't fail the signup, just log the error
        } else {
          console.log('Profile created successfully for user:', data.user.id)
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

      try { sessionStorage.removeItem('auth-token') } catch {}

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
