import { getCsrfToken } from '../utils/csrfToken'

export const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '')

export async function apiRequest(path, { method = 'GET', body, params, csrf = false } = {}) {
  const url = new URL(`${apiBaseUrl}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    })
  }

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (csrf) headers['x-csrf-token'] = (await getCsrfToken()) || ''

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || 'The request could not be completed.')
    error.code = payload?.error || `http_${response.status}`
    error.status = response.status
    throw error
  }
  return payload
}
