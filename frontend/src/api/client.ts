import axios from 'axios'

export const STORAGE_KEY_EMAIL = 'wysa_user_email'

/**
 * Axios instance configured with base URL and automatic `x-user-email` header injection.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Automatically attach x-user-email header from localStorage
apiClient.interceptors.request.use((config) => {
  const email = localStorage.getItem(STORAGE_KEY_EMAIL)
  if (email) {
    config.headers['x-user-email'] = email
  }
  return config
})

// Response Interceptor: Extract clean error message for easy toast handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'

    // Attach enhanced details to the error object
    error.formattedMessage = customMessage
    error.status = error.response?.status
    return Promise.reject(error)
  },
)
