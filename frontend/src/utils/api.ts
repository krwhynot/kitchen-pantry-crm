import axios from 'axios'

// Create API client instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken) {
        try {
          const response = await apiClient.post('/auth/refresh', {
            refresh_token: refreshToken
          })
          
          if (response.data.status === 'success') {
            const { access_token, refresh_token: newRefreshToken } = response.data.data.session
            
            // Update stored tokens
            localStorage.setItem('auth_token', access_token)
            localStorage.setItem('refresh_token', newRefreshToken)
            
            // Update authorization header
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
            originalRequest.headers['Authorization'] = `Bearer ${access_token}`
            
            // Retry the original request
            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('auth_token')
          localStorage.removeItem('refresh_token')
          delete apiClient.defaults.headers.common['Authorization']
          
          // Redirect to login page
          window.location.href = '/login'
          
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  message?: string
  statusCode?: number
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Common API methods
export const api = {
  // GET request
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> =>
    apiClient.get(url, { params }).then(res => res.data),
  
  // POST request
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.post(url, data).then(res => res.data),
  
  // PUT request
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.put(url, data).then(res => res.data),
  
  // DELETE request
  delete: <T = any>(url: string): Promise<ApiResponse<T>> =>
    apiClient.delete(url).then(res => res.data),
  
  // PATCH request
  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data).then(res => res.data)
}

export default api