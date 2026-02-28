import { create } from 'zustand'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import { translateError } from '../utils/errorTranslate'
import { clearCsrfToken, getCsrfToken } from '../utils/csrfToken'

// Ensure only one initialization runs at a time across the app
let inFlightAuthInit = null

const fireAndForgetLocationUpdate = async (userId, currentLocation) => {
  if (!userId || currentLocation) return

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const csrfToken = await getCsrfToken()
    await fetch(`${apiUrl}/api/update-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('auth-token') || ''}`,
        'x-csrf-token': csrfToken || ''
      },
      body: JSON.stringify({ userId })
    })
  } catch {}
}

const fetchOrEnsureProfile = async (session, user) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  const token = session?.access_token || sessionStorage.getItem('auth-token') || ''
  const response = await fetch(`${apiUrl}/api/users/me/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`profile_fetch_failed_${response.status}`)
  }

  const body = await response.json()
  const profile = body?.profile || null

  if (!profile) {
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
      role: 'USER',
      social_links: {},
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    }
  }

  return {
    ...profile,
    avatar: profile.avatar_url || profile.avatar || null
  }
}

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  session: null,
  isInitialized: false, // Track if auth has been initialized
  isInitializing: false,
  adminUsers: [], // Cache for admin users list

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

          // Validate session to avoid stale auth after account deletion
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (userError || !userData?.user?.id) {
            console.error('Session validation failed:', userError)
            try { sessionStorage.removeItem('auth-token') } catch {}
            try {
              Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase') || key.startsWith('sb-')) {
                  localStorage.removeItem(key)
                }
              })
            } catch {}
            set({ 
              user: null, 
              profile: null, 
              session: null, 
              isAuthenticated: false, 
              isLoading: false,
              isInitialized: true 
            })
            return
          }

          // Store token in sessionStorage for backend compatibility
          try {
            sessionStorage.setItem('auth-token', session.access_token)
          } catch {}

          // Fetch profile via backend (service-role) to avoid RLS issues
          try {
            console.log('Fetching profile via backend for user:', user.id)
            const finalProfile = await fetchOrEnsureProfile(session, user)

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

            void fireAndForgetLocationUpdate(user.id, finalProfile.location)
          } catch (error) {
            console.error('Profile fetch error:', error)
            const fallback = {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              role: 'USER',
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
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

            void fireAndForgetLocationUpdate(user.id, fallback.location)
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

            // CRITICAL: Avoid redundant profile fetches if already loaded for same user
            const currentState = get()
            if (currentState.profile?.id === user.id && currentState.isAuthenticated) {
              console.log('Profile already loaded for user, skipping fetch')
              // Just update session/token if needed
              try {
                sessionStorage.setItem('auth-token', session.access_token)
              } catch {}
              set({ session })
              return
            }

            // Store token
            try {
              sessionStorage.setItem('auth-token', session.access_token)
            } catch {}

            // Fetch profile via backend (service-role) to avoid RLS issues
            try {
              console.log('Fetching profile via backend for user:', user.id)
              const finalProfile = await fetchOrEnsureProfile(session, user)

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

              void fireAndForgetLocationUpdate(user.id, finalProfile.location)
            } catch (error) {
              console.error('Listener profile fetch error:', error)
              const fallback = {
                id: user.id,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                role: 'USER',
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
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

              void fireAndForgetLocationUpdate(user.id, fallback.location)
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

    // IMPORTANT: Return subscription for cleanup
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

      // Some flows return no session immediately; fetch after a short delay
      let session = verifyData?.session
      if (!session) {
        try { await new Promise((r) => setTimeout(r, 150)) } catch {}
        session = (await supabase.auth.getSession()).data.session
      }
      const user = updateData?.user || verifyData?.user || session?.user
      const profile = user ? await fetchOrEnsureProfile(session, user) : null

      set({
        user,
        profile,
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

      const profile = await fetchOrEnsureProfile(data.session, data.user)

      // Set complete state at once
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

      // Clear CSRF token cache
      try {
        clearCsrfToken()
      } catch {}

      // Also clear localStorage auth keys
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.startsWith('sb-')) {
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

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })
    } catch {}

    // Reset state
    set({ user: null, profile: null, session: null, isAuthenticated: false, isLoading: false })
    try { 
      window.location.replace('/login') 
    } catch {}
  },

  // Delete account permanently
  deleteAccount: async () => {
    set({ isLoading: true })

    try {
      const user = get().user
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı')
        set({ isLoading: false })
        return { success: false }
      }

      // Call backend to delete account
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const csrfToken = await getCsrfToken()
      const response = await fetch(`${apiUrl}/api/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth-token') || ''}`,
          'x-csrf-token': csrfToken || ''
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Hesap silinirken hata oluştu')
      }

      // Clear all auth data
      try { 
        sessionStorage.removeItem('auth-token') 
      } catch {}

      try {
        // Try to sign out locally to clear Supabase client state
        try { await supabase.auth.signOut({ scope: 'local' }) } catch {}
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
      } catch {}

      // Reset state
      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false
      })

      toast.success('Hesabınız başarıyla silindi')

      // Redirect to home
      try { 
        window.location.replace('/') 
      } catch {}

      return { success: true }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(translateError(error.message))
      set({ isLoading: false })
      return { success: false, error: error.message }
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

      // Map front-end keys to DB columns (ONLY update allowed columns)
      const payload = {}
      
      // Only include fields that are actually being updated and exist in DB schema
      if (updates.name !== undefined) payload.name = updates.name || null
      if (updates.username !== undefined) payload.username = updates.username || null
      if (updates.bio !== undefined) payload.bio = updates.bio || null
      if (updates.location !== undefined) payload.location = updates.location || null
      
      if (updates.avatar !== undefined) {
        payload.avatar_url = updates.avatar || null
      }

      // Only update social_links if it's provided
      if (updates.socialLinks !== undefined || updates.isPublic !== undefined) {
        payload.social_links = {
          ...(updates.socialLinks || {}),
          privacy: updates.isPublic === false ? 'private' : 'public'
        }
      }

      // Always update timestamp
      payload.updated_at = new Date().toISOString()

      console.log('Updating profile with payload:', payload)

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select()
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows gracefully

      // Check for specific Supabase errors
      if (error) {
        console.error('Profile update error:', error)
        
        // Handle RLS/permission errors
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          console.error('RLS Policy blocked update or user not found')
          toast.error('Profil güncellenirken yetki hatası oluştu. Lütfen sayfayı yenileyin.')
          set({ isLoading: false })
          return { success: false, error: 'RLS_ERROR' }
        }
        
        if (error.code === '406') {
          toast.error('Güncelleme başarısız oldu. Lütfen girdiğiniz bilgileri kontrol edin.')
          set({ isLoading: false })
          return { success: false, error: 'INVALID_UPDATE' }
        }

        toast.error('Profil güncellenemedi: ' + error.message)
        set({ isLoading: false })
        return { success: false, error: error.message }
      }

      // If data is null (no rows returned), that's an RLS issue
      if (!data) {
        console.error('No data returned from update (RLS likely blocked it)')
        toast.error('Profil güncellenemedi. Lütfen sayfayı yenileyin ve tekrar deneyiniz.')
        set({ isLoading: false })
        return { success: false, error: 'NO_DATA_RETURNED' }
      }

      set({
        profile: {
          ...data,
          avatar: data.avatar_url || data.avatar || null
        },
        isLoading: false
      })

      toast.success('Profil güncellendi!')
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      
      // Handle network/parsing errors
      if (error instanceof TypeError) {
        toast.error('Ağ hatası oluştu. İnternet bağlantınızı kontrol edin.')
      } else {
        toast.error('Profil güncellenirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'))
      }
      
      set({ isLoading: false })
      return { success: false, error: error?.message }
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
  },

  // Get all users for admin (cached)
  getAllUsers: () => {
    return get().adminUsers
  },

  // Fetch users list for admin
  fetchAdminUsers: async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const token = sessionStorage.getItem('auth-token') || ''
      const response = await fetch(`${apiUrl}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch admin users:', response.status)
        return
      }

      const users = await response.json()
      set({ adminUsers: users })
      return users
    } catch (error) {
      console.error('Error fetching admin users:', error)
    }
  },

  // Update user profile (admin action)
  updateUserProfile: async (userId, updates) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const token = sessionStorage.getItem('auth-token') || ''
      const csrfToken = await getCsrfToken()

      // Build payload with only allowed fields (must match backend ALLOWED_FIELDS)
      const payload = {}
      if (updates.name !== undefined) payload.name = updates.name || null
      if (updates.username !== undefined) payload.username = updates.username || null
      if (updates.bio !== undefined) payload.bio = updates.bio || null
      if (updates.location !== undefined) payload.location = updates.location || null
      
      // Convert camelCase to snake_case for backend
      if (updates.socialLinks !== undefined) {
        payload.social_links = updates.socialLinks
      }

      console.log('Updating user with payload:', payload)

      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-csrf-token': csrfToken || ''
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Update failed:', errorData)
        toast.error('Kullanıcı güncellenemedi: ' + (errorData.error || 'Bilinmeyen hata'))
        return { success: false, error: errorData.error }
      }

      const result = await response.json()
      toast.success('Kullanıcı başarıyla güncellendi!')

      // Update local cache with original format for frontend consistency
      set(state => ({
        adminUsers: state.adminUsers.map(u => 
          u.id === userId ? { ...u, ...updates } : u
        )
      }))

      return { success: true, data: result }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Güncelleme sırasında hata oluştu: ' + error.message)
      return { success: false, error: error.message }
    }
  },
}))

export { useAuthStore }
