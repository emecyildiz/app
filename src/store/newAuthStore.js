import { create } from 'zustand'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import { translateError } from '../utils/errorTranslate'

// Ensure only one initialization runs at a time across the app
let inFlightAuthInit = null

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  session: null,
  isInitialized: false, // Track if auth has been initialized
  isInitializing: false,

  // Initialize auth state
  initializeAuth: async () => {
    // Prevent multiple initializations and dedupe concurrent calls
    if (get().isInitialized) {
      console.log('Auth already initialized, skipping...')
      return
    }
    if (get().isInitializing && inFlightAuthInit) {
      console.log('Auth initialization in progress, awaiting existing run...')
      return inFlightAuthInit
    }

    set({ isLoading: true, isInitializing: true })

    inFlightAuthInit = (async () => {
      try {
        console.log('Starting auth initialization...')
        // Get initial session from Supabase (now persisted)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          set({ isLoading: false, isInitialized: true })
          return
        }

        if (session?.user?.id) {
          const { user } = session
          console.log('Found session for user:', user.email)
          console.log('Session expires at:', new Date(session.expires_at * 1000))

          // Store token in sessionStorage for backend compatibility
          try {
            sessionStorage.setItem('auth-token', session.access_token)
          } catch {}

          // Fetch profile with timeout
          try {
            console.log('Fetching profile for user:', user.id)
            
            // Add timeout to prevent hanging
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            )

            const { data, error: profileError } = await Promise.race([profilePromise, timeoutPromise])

            if (profileError && profileError.code === 'PGRST116') {
              console.log('Profile not found, creating new profile')
              const insertPromise = supabase.from('profiles').insert({
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                role: 'USER',
                social_links: {}
              })
              
              const insertTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile insert timeout')), 3000)
              )
              
              await Promise.race([insertPromise, insertTimeout])
            }

            const finalProfile = data || {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              role: 'USER',
              social_links: {}
            }

            console.log('Setting complete auth state with profile:', finalProfile.name)
            // Set complete state at once
            set({ 
              user, 
              session, 
              profile: finalProfile,
              isAuthenticated: true, 
              isLoading: false,
              isInitialized: true 
            })
          } catch (error) {
            console.error('Profile fetch error:', error)
            const fallback = {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              role: 'USER'
            }
            console.log('Using fallback profile:', fallback.name)
            set({ 
              user, 
              session, 
              profile: fallback,
              isAuthenticated: true, 
              isLoading: false,
              isInitialized: true 
            })
          }
        } else {
          // No valid session
          console.log('No valid session found')
          set({ 
            user: null, 
            profile: null, 
            session: null, 
            isAuthenticated: false, 
            isLoading: false,
            isInitialized: true 
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        set({ isLoading: false, isInitialized: true })
      } finally {
        set({ isInitializing: false })
        inFlightAuthInit = null
      }
    })()

    return inFlightAuthInit
  },

  // Setup auth listener
  setupAuthListener: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            const { user } = session
            console.log('Processing SIGNED_IN event for user:', user.email)

            // Store token
            try {
              sessionStorage.setItem('auth-token', session.access_token)
            } catch {}

            // Fetch profile immediately
            try {
              console.log('Fetching profile for user:', user.id)
              const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

              if (profileError && profileError.code === 'PGRST116') {
                console.log('Profile not found, creating new profile')
                await supabase.from('profiles').insert({
                  id: user.id,
                  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                  username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                  role: 'USER',
                  social_links: {}
                })
              }

              const finalProfile = data || {
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                role: 'USER',
                social_links: {}
              }

              console.log('Setting complete auth state with profile:', finalProfile.name)
              // Set complete state at once
              set({ 
                user, 
                session, 
                profile: finalProfile,
                isAuthenticated: true, 
                isLoading: false,
                isInitialized: true
              })
            } catch (error) {
              console.error('Listener profile fetch error:', error)
              const fallback = {
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                role: 'USER'
              }
              console.log('Using fallback profile:', fallback.name)
              set({ 
                user, 
                session, 
                profile: fallback,
                isAuthenticated: true, 
                isLoading: false,
                isInitialized: true
              })
            }
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('Processing SIGNED_OUT event')
          try { sessionStorage.removeItem('auth-token') } catch {}
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false
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
          emailRedirectTo: window.location.origin + '/confirm-signup',
          data: {
            name: userData.name,
            username: userData.username
          }
        }
      })

      if (error) {
        toast.error(translateError(error.message))
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
      toast.success('E‑posta doğrulama bağlantısı gönderdik. Lütfen e‑postanızı kontrol edin.')
      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error('Kayıt sırasında bir hata oluştu')
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Removed OTP signup flow from frontend; we use link confirmation for signup now

  // Verify the email OTP, then set the password and profile
  verifyEmailOtp: async (email, token, password, userData = {}) => {
    set({ isLoading: true })
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'email', // for email OTP
      })

      if (verifyError) {
        toast.error(translateError(verifyError.message))
        set({ isLoading: false })
        return { success: false, error: verifyError.message }
      }

      // If password already set via email/password later, skip; otherwise set it now
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
          name: userData.name,
          username: userData.username,
        },
      })

      if (updateError) {
        console.error('Update user after OTP error:', updateError)
        toast.error('Şifre belirlenemedi')
        set({ isLoading: false })
        return { success: false, error: updateError.message }
      }

      // Ensure profile row exists/updated
      try {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: updateData?.user?.id || verifyData?.user?.id,
              username: userData.username,
              name: userData.name,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
      } catch (profileErr) {
        console.error('Profile upsert after OTP error:', profileErr)
      }

      // Some flows return no session immediately; fetch after a short delay
      let session = verifyData?.session
      if (!session) {
        try { await new Promise((r) => setTimeout(r, 150)) } catch {}
        session = (await supabase.auth.getSession()).data.session
      }
      const user = updateData?.user || verifyData?.user || session?.user

      set({
        user,
        session,
        isAuthenticated: true,
        isLoading: false,
      })

      try { sessionStorage.setItem('auth-token', session?.access_token || '') } catch {}

      toast.success('E-posta doğrulandı ve şifre ayarlandı!')
      return { success: true }
    } catch (error) {
      console.error('Verify email OTP error:', error)
      toast.error('Doğrulama başarısız oldu')
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Resend the email OTP
  resendEmailOtp: async (email) => {
    try {
      // Some Supabase versions require specific types for resend.
      // Safest cross-version approach is to trigger a fresh OTP via signInWithOtp.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (error) throw error
      toast.success('Kod yeniden gönderildi')
      return { success: true }
    } catch (error) {
      console.error('Resend OTP error:', error)
      const message =
        error?.message?.includes('Missing one of these types')
          ? 'Kod yeniden gönderilemedi. Lütfen tekrar deneyin.'
          : translateError(error?.message || 'Kod gönderilemedi')
      toast.error(message)
      return { success: false, error: message }
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    // Prevent multiple sign-in attempts
    if (get().isLoading) {
      return { success: false, error: 'Giriş işlemi devam ediyor' }
    }

    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        const message = translateError(error.message)
        toast.error(message)
        set({ isLoading: false })
        const normalized = message.toLowerCase()
        const errorCode = normalized.includes('doğrula') ? 'email_not_confirmed' : 'invalid_credentials'
        return { success: false, error: message, errorCode }
      }

      // Store token
      try {
        sessionStorage.setItem('auth-token', data.session.access_token)
      } catch {}

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      }

      // Set complete state at once
      set({
        user: data.user,
        profile: profile || {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'user',
          role: 'USER'
        },
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

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    set({ isLoading: true })
    
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('Redirecting to:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false, // Supabase otomatik redirect etsin
        }
      })

      if (error) {
        const message = translateError(error.message)
        console.error('OAuth error:', error)
        toast.error(message)
        set({ isLoading: false })
        return { success: false, error: message }
      }

      console.log('OAuth initiated, user will be redirected to Google...')
      // OAuth redirects automatically, loading state will be handled by callback
      return { success: true, data }
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error(translateError(error.message))
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  resendSignupConfirmation: async (email) => {
    try {
      if (typeof supabase.auth.resend === 'function') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: window.location.origin + '/confirm-signup' }
        })
        if (error) throw error
        toast.success('Onay e‑postası yeniden gönderildi')
        return { success: true }
      }
      toast.error('Yeniden gönderme desteklenmiyor')
      return { success: false }
    } catch (e) {
      console.error('resendSignupConfirmation error:', e)
      toast.error('Onay e‑postası gönderilemedi')
      return { success: false }
    }
  },

  // Sign out
  signOut: async () => {
    // Prevent multiple sign-out attempts
    if (get().isLoading) {
      return
    }

    set({ isLoading: true })

    try {
      // Sign out from Supabase with local scope (works for both regular & OAuth)
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        console.error('Supabase sign out error:', error)
      }

      // Clear sessionStorage token
      try { 
        sessionStorage.removeItem('auth-token') 
      } catch {}

      // Also clear localStorage auth keys
      try {
        localStorage.removeItem('supabase.auth.token')
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      } catch {}

      // Reset state completely
      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false // Reset initialization flag
      })

      toast.success('Çıkış yapıldı!')

      // Redirect to login
      try { 
        window.location.replace('/login') 
      } catch {}
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Çıkış sırasında bir hata oluştu')
      set({ isLoading: false })
    }
  },

  // Force sign out without calling Supabase (last resort)
  forceSignOut: () => {
    try { 
      sessionStorage.removeItem('auth-token') 
    } catch {}
    
    // Clear Supabase persisted session
    try {
      supabase.auth.signOut({ scope: 'local' })
    } catch {}

    // Reset state
    set({ user: null, profile: null, session: null, isAuthenticated: false, isLoading: false })
    try { 
      window.location.replace('/login') 
    } catch {}
  },

  // Update profile
  updateProfile: async (updates) => {
    set({ isLoading: true })
    
    try {
      const user = get().user
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Map front-end keys to DB columns
      const payload = {
        name: updates.name,
        username: updates.username,
        bio: updates.bio,
        location: updates.location,
        social_links: {
          ...(updates.socialLinks || {}),
          // privacy: 'public' | 'private' (default public)
          privacy: updates.isPublic === false ? 'private' : 'public'
        },
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
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

  // Check if user is moderator or admin
  isModeratorOrAdmin: () => {
    const profile = get().profile
    return profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'
  }
}))

export { useAuthStore }
