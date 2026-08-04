let cachedCsrfToken = null

const apiBaseUrl = () => import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '')

export const setCsrfToken = (token) => {
  cachedCsrfToken = typeof token === 'string' && token ? token : null
}

export const getCsrfToken = async () => {
  if (cachedCsrfToken) return cachedCsrfToken

  const response = await fetch(`${apiBaseUrl()}/api/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) return null
  const data = await response.json().catch(() => ({}))
  setCsrfToken(data.csrfToken)
  return cachedCsrfToken
}

export const addCsrfHeader = async (headers = {}) => {
  const token = await getCsrfToken()
  return token ? { ...headers, 'x-csrf-token': token } : headers
}

export const clearCsrfToken = () => {
  cachedCsrfToken = null
}
