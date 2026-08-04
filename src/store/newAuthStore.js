import { create } from 'zustand'
import toast from 'react-hot-toast'
import { authService, apiBaseUrl } from '../services/authService'
import { clearCsrfToken, getCsrfToken } from '../utils/csrfToken'

let initializationPromise = null

function normalizeIdentity(user) {
  if (!user) return { user: null, profile: null, session: null }

  const normalizedUser = {
    id: user.id,
    email: user.email,
    role: user.role || 'USER',
    created_at: user.createdAt || user.created_at || null,
  }
  const profile = {
    id: user.id,
    name: user.name || user.email?.split('@')[0] || 'User',
    username: user.username || user.email?.split('@')[0] || 'user',
    role: user.role || 'USER',
    bio: user.bio || '',
    location: user.location || '',
    avatar: user.avatar || user.avatar_url || null,
    avatar_url: user.avatar || user.avatar_url || null,
    social_links: user.socialLinks || user.social_links || {},
    created_at: user.createdAt || user.created_at || null,
  }

  return { user: normalizedUser, profile, session: { user: normalizedUser } }
}

function authenticatedState(user) {
  return { ...normalizeIdentity(user), isAuthenticated: true }
}

const anonymousState = {
  user: null,
  profile: null,
  session: null,
  isAuthenticated: false,
}

const useAuthStore = create((set, get) => ({
  ...anonymousState,
  isLoading: false,
  isInitialized: false,
  isInitializing: false,
  adminUsers: [],

  initializeAuth: async () => {
    if (get().isInitialized) return
    if (initializationPromise) return initializationPromise

    set({ isLoading: true, isInitializing: true })
    initializationPromise = (async () => {
      try {
        const result = await authService.getSession()
        set({
          ...authenticatedState(result.user),
          isLoading: false,
          isInitializing: false,
          isInitialized: true,
        })
        await authService.refreshCsrfToken()
      } catch (error) {
        if (error.status !== 401) console.error('Authentication bootstrap failed:', error)
        clearCsrfToken()
        set({
          ...anonymousState,
          isLoading: false,
          isInitializing: false,
          isInitialized: true,
        })
      } finally {
        initializationPromise = null
      }
    })()

    return initializationPromise
  },

  setupAuthListener: () => ({ unsubscribe() {} }),

  signUp: async (email, password, userData = {}) => {
    set({ isLoading: true })
    try {
      const result = await authService.register({
        email,
        password,
        name: userData.name,
        username: userData.username,
      })
      toast.success(result.emailVerificationRequired
        ? 'Account created. Check your email to verify it.'
        : 'Account created. You can now sign in.')
      return { success: true, ...result }
    } catch (error) {
      toast.error(error.message)
      return { success: false, error: error.code || error.message }
    } finally {
      set({ isLoading: false })
    }
  },

  verifyEmailOtp: async (_email, token) => {
    try {
      await authService.verifyEmail(token)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.code || error.message }
    }
  },

  resendEmailOtp: async (email) => get().resendSignupConfirmation(email),

  signIn: async (email, password) => {
    set({ isLoading: true })
    try {
      const result = await authService.login(email, password)
      set({
        ...authenticatedState(result.user),
        isLoading: false,
        isInitialized: true,
        isInitializing: false,
      })
      toast.success('Welcome back.')
      return { success: true }
    } catch (error) {
      toast.error(error.message)
      set({ isLoading: false })
      return { success: false, error: error.code || error.message }
    }
  },

  signInWithGoogle: async () => {
    const message = 'Google sign-in is not available during the self-hosted migration.'
    toast.error(message)
    return { success: false, error: 'oauth_not_available' }
  },

  resendSignupConfirmation: async (email) => {
    set({ isLoading: true })
    try {
      await authService.resendVerification(email)
      toast.success('If the account is awaiting verification, a new email has been sent.')
      return { success: true }
    } catch (error) {
      toast.error(error.message)
      return { success: false, error: error.code || error.message }
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
    } catch (error) {
      if (error.status !== 401) toast.error(error.message)
    } finally {
      clearCsrfToken()
      set({ ...anonymousState, isLoading: false, isInitialized: true })
    }
    return { success: true }
  },

  forceSignOut: () => {
    clearCsrfToken()
    set({ ...anonymousState, isLoading: false, isInitialized: true })
  },

  deleteAccount: async () => {
    set({ isLoading: true })
    try {
      await authService.deleteAccount()
      set({ ...anonymousState, isLoading: false, isInitialized: true })
      toast.success('Your account has been deleted.')
      return { success: true }
    } catch (error) {
      toast.error(error.message)
      set({ isLoading: false })
      return { success: false, error: error.code || error.message }
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true })
    try {
      const current = get().profile || {}
      const socialLinks = updates.socialLinks === undefined && updates.isPublic === undefined
        ? undefined
        : {
            ...(current.social_links || {}),
            ...(updates.socialLinks || {}),
            privacy: updates.isPublic === false ? 'private' : 'public',
          }
      const result = await authService.updateProfile({
        name: updates.name,
        username: updates.username,
        bio: updates.bio,
        location: updates.location,
        avatarUrl: updates.avatar,
        socialLinks,
      })
      const row = result.profile
      const profile = {
        ...current,
        ...row,
        avatar: row.avatar_url || null,
        social_links: row.social_links || {},
      }
      set({ profile, isLoading: false })
      toast.success('Profile updated.')
      return { success: true, profile }
    } catch (error) {
      toast.error(error.message)
      set({ isLoading: false })
      return { success: false, error: error.code || error.message }
    }
  },

  updateAvatar: async (avatarUrl) => get().updateProfile({ avatar: avatarUrl }),

  getAccessToken: () => null,
  hasRole: (role) => get().profile?.role === role,
  isAdmin: () => get().hasRole('ADMIN'),
  isModeratorOrAdmin: () => ['ADMIN', 'MODERATOR'].includes(get().profile?.role),
  getAllUsers: () => get().adminUsers,

  fetchAdminUsers: async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Unable to load users.')
      const users = await response.json()
      set({ adminUsers: users })
      return users
    } catch (error) {
      console.error('Admin user list failed:', error)
      return []
    }
  },

  updateUserProfile: async (userId, updates) => {
    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || '',
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Unable to update the user.')
      const result = await response.json()
      set((state) => ({
        adminUsers: state.adminUsers.map((user) => user.id === userId ? { ...user, ...updates } : user),
      }))
      toast.success('User updated.')
      return { success: true, data: result }
    } catch (error) {
      toast.error(error.message)
      return { success: false, error: error.message }
    }
  },
}))

export { useAuthStore }
