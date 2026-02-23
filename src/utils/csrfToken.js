// CSRF Token Management

let cachedCsrfToken = null;
let tokenExpiry = 0;

/**
 * Fetch CSRF token from backend
 */
export const getCsrfToken = async () => {
  const now = Date.now();
  
  // Return cached token if still valid
  if (cachedCsrfToken && tokenExpiry > now) {
    return cachedCsrfToken;
  }

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = sessionStorage.getItem('auth-token');

    if (!token) {
      console.warn('[CSRF] No auth token found');
      return null;
    }

    const response = await fetch(`${apiUrl}/api/csrf-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('[CSRF] Failed to get CSRF token:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.csrfToken) {
      console.error('[CSRF] No token in response');
      return null;
    }

    // Cache token (expiresIn is usually 300 seconds = 5 minutes)
    cachedCsrfToken = data.csrfToken;
    tokenExpiry = now + (data.expiresIn * 1000);

    return cachedCsrfToken;
  } catch (error) {
    console.error('[CSRF] Error fetching CSRF token:', error);
    return null;
  }
};

/**
 * Add CSRF token to request headers
 */
export const addCsrfHeader = async (headers = {}) => {
  const token = await getCsrfToken();
  
  if (!token) {
    console.warn('[CSRF] Could not add CSRF header - no token available');
    return headers;
  }

  return {
    ...headers,
    'x-csrf-token': token
  };
};

/**
 * Clear cached token (call after logout)
 */
export const clearCsrfToken = () => {
  cachedCsrfToken = null;
  tokenExpiry = 0;
};
