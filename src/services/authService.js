import { clearCsrfToken, getCsrfToken, setCsrfToken } from '../utils/csrfToken'

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '')

const errorMessages = {
  authentication_required: 'Please sign in to continue.',
  account_temporarily_locked: 'This account is temporarily locked. Try again later.',
  account_unavailable: 'This account is unavailable.',
  email_delivery_unavailable: 'Email delivery is temporarily unavailable. Try again later.',
  email_verification_required: 'Verify your email address before signing in.',
  invalid_credentials: 'The email address or password is incorrect.',
  invalid_csrf_token: 'Your security token expired. Please try again.',
  invalid_or_expired_token: 'This link is invalid or has expired.',
  registration_unavailable: 'That email address or username is unavailable.',
  too_many_authentication_requests: 'Too many attempts. Please wait and try again.',
  too_many_password_requests: 'Too many email requests. Please wait and try again.',
  verification_email_unavailable: 'Your account was created, but the verification email could not be sent.',
}

async function request(path, { method = 'GET', body, csrf = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (csrf) {
    const token = await getCsrfToken()
    if (!token) throw new Error('Your session security token is unavailable. Please sign in again.')
    headers['x-csrf-token'] = token
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = response.status === 204
    ? null
    : await response.json().catch(() => ({}))

  if (!response.ok) {
    const code = payload?.error
    const error = new Error(payload?.message || errorMessages[code] || 'The request could not be completed.')
    error.code = code || `http_${response.status}`
    error.status = response.status
    throw error
  }

  return payload
}

export const authService = {
  async register(input) {
    return request('/api/auth/register', { method: 'POST', body: input })
  },

  async login(email, password) {
    const result = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setCsrfToken(result.csrfToken)
    return result
  },

  getSession() {
    return request('/api/auth/session')
  },

  async refreshCsrfToken() {
    clearCsrfToken()
    return getCsrfToken()
  },

  async logout() {
    await request('/api/auth/logout', { method: 'POST', csrf: true })
    clearCsrfToken()
  },

  verifyEmail(token) {
    return request('/api/auth/verify-email', { method: 'POST', body: { token } })
  },

  resendVerification(email) {
    return request('/api/auth/resend-verification', { method: 'POST', body: { email } })
  },

  forgotPassword(email) {
    return request('/api/auth/forgot-password', { method: 'POST', body: { email } })
  },

  resetPassword(token, password) {
    return request('/api/auth/reset-password', { method: 'POST', body: { token, password } })
  },

  updateProfile(updates) {
    return request('/api/auth/profile', { method: 'PATCH', body: updates, csrf: true })
  },

  async deleteAccount() {
    await request('/api/auth/account', { method: 'DELETE', csrf: true })
    clearCsrfToken()
  },
}

export { apiBaseUrl }
