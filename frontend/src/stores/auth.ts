import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../utils/api'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'sales_rep'
  organizationId: string
  organization?: {
    id: string
    name: string
    type: string
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => userRole.value === 'admin')
  const isManager = computed(() => userRole.value === 'manager')
  const isSalesRep = computed(() => userRole.value === 'sales_rep')
  const hasManagerAccess = computed(() => isAdmin.value || isManager.value)

  // Actions
  const setAuthData = (authData: { user: User; session: any }) => {
    user.value = authData.user
    token.value = authData.session.access_token
    refreshToken.value = authData.session.refresh_token
    
    // Store in localStorage
    localStorage.setItem('auth_token', authData.session.access_token)
    localStorage.setItem('refresh_token', authData.session.refresh_token)
    
    // Set default authorization header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authData.session.access_token}`
  }

  const clearAuthData = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    
    // Remove from localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    
    // Remove authorization header
    delete apiClient.defaults.headers.common['Authorization']
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: string
    organizationId: string
  }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/auth/register', userData)
      
      if (response.data.status === 'success') {
        setAuthData(response.data.data)
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Registration failed')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const login = async (credentials: { email: string; password: string }) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/auth/login', credentials)
      
      if (response.data.status === 'success') {
        setAuthData(response.data.data)
        return response.data.data
      }
      
      throw new Error(response.data.message || 'Login failed')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      isLoading.value = true
      
      // Call logout endpoint if token exists
      if (token.value) {
        await apiClient.post('/auth/logout')
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuthData()
      isLoading.value = false
    }
  }

  const getCurrentUser = async () => {
    try {
      if (!token.value) return null
      
      // Set authorization header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      const response = await apiClient.get('/auth/profile')
      
      if (response.data.status === 'success') {
        user.value = response.data.data.user
        return response.data.data.user
      }
      
      throw new Error('Failed to get user profile')
    } catch (err: any) {
      console.error('Get current user error:', err)
      clearAuthData()
      throw err
    }
  }

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }
      
      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshToken.value
      })
      
      if (response.data.status === 'success') {
        token.value = response.data.data.session.access_token
        refreshToken.value = response.data.data.session.refresh_token
        
        // Update localStorage
        localStorage.setItem('auth_token', response.data.data.session.access_token)
        localStorage.setItem('refresh_token', response.data.data.session.refresh_token)
        
        // Update authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.session.access_token}`
        
        return response.data.data.session
      }
      
      throw new Error('Token refresh failed')
    } catch (err: any) {
      console.error('Token refresh error:', err)
      clearAuthData()
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/auth/reset-password', { email })
      
      if (response.data.status === 'success') {
        return response.data.message
      }
      
      throw new Error(response.data.message || 'Password reset failed')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Password reset failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await apiClient.post('/auth/update-password', {
        currentPassword,
        newPassword
      })
      
      if (response.data.status === 'success') {
        return response.data.message
      }
      
      throw new Error(response.data.message || 'Password update failed')
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Password update failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Initialize auth state on store creation
  if (token.value) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return {
    // State
    user,
    token,
    refreshToken,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    userRole,
    isAdmin,
    isManager,
    isSalesRep,
    hasManagerAccess,
    
    // Actions
    register,
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    resetPassword,
    updatePassword,
    clearError
  }
})