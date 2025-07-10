import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

// Mock the API client
const mockApiClient = {
  post: vi.fn(),
  get: vi.fn(),
  defaults: {
    headers: {
      common: {}
    }
  }
}

vi.mock('../utils/api', () => ({
  apiClient: mockApiClient
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'sales_rep' as const,
  organizationId: 'org-123',
  organization: {
    id: 'org-123',
    name: 'Test Organization',
    type: 'company'
  }
}

const mockSession = {
  access_token: 'access-token-123',
  refresh_token: 'refresh-token-123',
  expires_in: 3600
}

const mockAuthData = {
  user: mockUser,
  session: mockSession
}

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with null user and token when no stored tokens', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const authStore = useAuthStore()
      
      expect(authStore.user).toBeNull()
      expect(authStore.token).toBeNull()
      expect(authStore.refreshToken).toBeNull()
      expect(authStore.isLoading).toBe(false)
      expect(authStore.error).toBeNull()
    })

    it('initializes with stored token when available', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return 'stored-token'
        if (key === 'refresh_token') return 'stored-refresh'
        return null
      })
      
      const authStore = useAuthStore()
      
      expect(authStore.token).toBe('stored-token')
      expect(authStore.refreshToken).toBe('stored-refresh')
      expect(mockApiClient.defaults.headers.common['Authorization']).toBe('Bearer stored-token')
    })
  })

  describe('Computed Properties', () => {
    it('calculates isAuthenticated correctly', () => {
      const authStore = useAuthStore()
      
      expect(authStore.isAuthenticated).toBe(false)
      
      authStore.user = mockUser
      authStore.token = 'test-token'
      
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('calculates userRole correctly', () => {
      const authStore = useAuthStore()
      
      expect(authStore.userRole).toBeNull()
      
      authStore.user = mockUser
      
      expect(authStore.userRole).toBe('sales_rep')
    })

    it('calculates role-based permissions correctly', () => {
      const authStore = useAuthStore()
      
      // Sales rep
      authStore.user = { ...mockUser, role: 'sales_rep' }
      expect(authStore.isAdmin).toBe(false)
      expect(authStore.isManager).toBe(false)
      expect(authStore.isSalesRep).toBe(true)
      expect(authStore.hasManagerAccess).toBe(false)
      
      // Manager
      authStore.user = { ...mockUser, role: 'manager' }
      expect(authStore.isAdmin).toBe(false)
      expect(authStore.isManager).toBe(true)
      expect(authStore.isSalesRep).toBe(false)
      expect(authStore.hasManagerAccess).toBe(true)
      
      // Admin
      authStore.user = { ...mockUser, role: 'admin' }
      expect(authStore.isAdmin).toBe(true)
      expect(authStore.isManager).toBe(false)
      expect(authStore.isSalesRep).toBe(false)
      expect(authStore.hasManagerAccess).toBe(true)
    })
  })

  describe('Actions', () => {
    describe('register', () => {
      it('successfully registers a user', async () => {
        const authStore = useAuthStore()
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          organizationId: 'org-123'
        }

        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockAuthData
          }
        })

        const result = await authStore.register(userData)

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', userData)
        expect(authStore.user).toEqual(mockUser)
        expect(authStore.token).toBe(mockSession.access_token)
        expect(authStore.refreshToken).toBe(mockSession.refresh_token)
        expect(authStore.isLoading).toBe(false)
        expect(authStore.error).toBeNull()
        expect(result).toEqual(mockAuthData)
        
        // Check localStorage calls
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockSession.access_token)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refresh_token', mockSession.refresh_token)
        
        // Check authorization header
        expect(mockApiClient.defaults.headers.common['Authorization']).toBe(`Bearer ${mockSession.access_token}`)
      })

      it('handles registration errors', async () => {
        const authStore = useAuthStore()
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          organizationId: 'org-123'
        }

        const errorMessage = 'Email already exists'
        mockApiClient.post.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(authStore.register(userData)).rejects.toThrow()
        
        expect(authStore.error).toBe(errorMessage)
        expect(authStore.isLoading).toBe(false)
        expect(authStore.user).toBeNull()
      })

      it('handles API error responses', async () => {
        const authStore = useAuthStore()
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          organizationId: 'org-123'
        }

        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'error',
            message: 'Registration failed'
          }
        })

        await expect(authStore.register(userData)).rejects.toThrow('Registration failed')
        
        expect(authStore.error).toBe('Registration failed')
        expect(authStore.user).toBeNull()
      })
    })

    describe('login', () => {
      it('successfully logs in a user', async () => {
        const authStore = useAuthStore()
        const credentials = {
          email: 'test@example.com',
          password: 'password123'
        }

        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockAuthData
          }
        })

        const result = await authStore.login(credentials)

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials)
        expect(authStore.user).toEqual(mockUser)
        expect(authStore.token).toBe(mockSession.access_token)
        expect(authStore.isLoading).toBe(false)
        expect(authStore.error).toBeNull()
        expect(result).toEqual(mockAuthData)
      })

      it('handles login errors', async () => {
        const authStore = useAuthStore()
        const credentials = {
          email: 'test@example.com',
          password: 'wrongpassword'
        }

        const errorMessage = 'Invalid credentials'
        mockApiClient.post.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(authStore.login(credentials)).rejects.toThrow()
        
        expect(authStore.error).toBe(errorMessage)
        expect(authStore.isLoading).toBe(false)
        expect(authStore.user).toBeNull()
      })
    })

    describe('logout', () => {
      it('successfully logs out with token', async () => {
        const authStore = useAuthStore()
        authStore.user = mockUser
        authStore.token = 'test-token'
        authStore.refreshToken = 'test-refresh'

        mockApiClient.post.mockResolvedValueOnce({})

        await authStore.logout()

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout')
        expect(authStore.user).toBeNull()
        expect(authStore.token).toBeNull()
        expect(authStore.refreshToken).toBeNull()
        expect(authStore.isLoading).toBe(false)
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
        expect(mockApiClient.defaults.headers.common['Authorization']).toBeUndefined()
      })

      it('logs out without token', async () => {
        const authStore = useAuthStore()

        await authStore.logout()

        expect(mockApiClient.post).not.toHaveBeenCalled()
        expect(authStore.user).toBeNull()
        expect(authStore.token).toBeNull()
        expect(authStore.isLoading).toBe(false)
      })

      it('handles logout API errors gracefully', async () => {
        const authStore = useAuthStore()
        authStore.token = 'test-token'

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockApiClient.post.mockRejectedValueOnce(new Error('API Error'))

        await authStore.logout()

        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
        expect(authStore.user).toBeNull()
        expect(authStore.token).toBeNull()
        
        consoleSpy.mockRestore()
      })
    })

    describe('getCurrentUser', () => {
      it('successfully gets current user', async () => {
        const authStore = useAuthStore()
        authStore.token = 'test-token'

        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: {
              user: mockUser
            }
          }
        })

        const result = await authStore.getCurrentUser()

        expect(mockApiClient.get).toHaveBeenCalledWith('/auth/profile')
        expect(mockApiClient.defaults.headers.common['Authorization']).toBe('Bearer test-token')
        expect(authStore.user).toEqual(mockUser)
        expect(result).toEqual(mockUser)
      })

      it('returns null when no token', async () => {
        const authStore = useAuthStore()

        const result = await authStore.getCurrentUser()

        expect(mockApiClient.get).not.toHaveBeenCalled()
        expect(result).toBeNull()
      })

      it('clears auth data on error', async () => {
        const authStore = useAuthStore()
        authStore.token = 'invalid-token'
        authStore.user = mockUser

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockApiClient.get.mockRejectedValueOnce(new Error('Unauthorized'))

        await expect(authStore.getCurrentUser()).rejects.toThrow()

        expect(authStore.user).toBeNull()
        expect(authStore.token).toBeNull()
        expect(consoleSpy).toHaveBeenCalled()
        
        consoleSpy.mockRestore()
      })
    })

    describe('refreshAccessToken', () => {
      it('successfully refreshes access token', async () => {
        const authStore = useAuthStore()
        authStore.refreshToken = 'test-refresh'

        const newSession = {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token'
        }

        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: {
              session: newSession
            }
          }
        })

        const result = await authStore.refreshAccessToken()

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
          refresh_token: 'test-refresh'
        })
        expect(authStore.token).toBe(newSession.access_token)
        expect(authStore.refreshToken).toBe(newSession.refresh_token)
        expect(result).toEqual(newSession)
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', newSession.access_token)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refresh_token', newSession.refresh_token)
        expect(mockApiClient.defaults.headers.common['Authorization']).toBe(`Bearer ${newSession.access_token}`)
      })

      it('throws error when no refresh token', async () => {
        const authStore = useAuthStore()

        await expect(authStore.refreshAccessToken()).rejects.toThrow('No refresh token available')
      })

      it('clears auth data on refresh failure', async () => {
        const authStore = useAuthStore()
        authStore.refreshToken = 'invalid-refresh'
        authStore.user = mockUser

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockApiClient.post.mockRejectedValueOnce(new Error('Invalid refresh token'))

        await expect(authStore.refreshAccessToken()).rejects.toThrow()

        expect(authStore.user).toBeNull()
        expect(authStore.token).toBeNull()
        expect(authStore.refreshToken).toBeNull()
        expect(consoleSpy).toHaveBeenCalled()
        
        consoleSpy.mockRestore()
      })
    })

    describe('resetPassword', () => {
      it('successfully sends password reset', async () => {
        const authStore = useAuthStore()
        const email = 'test@example.com'
        const successMessage = 'Password reset email sent'

        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            message: successMessage
          }
        })

        const result = await authStore.resetPassword(email)

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', { email })
        expect(result).toBe(successMessage)
        expect(authStore.isLoading).toBe(false)
        expect(authStore.error).toBeNull()
      })

      it('handles password reset errors', async () => {
        const authStore = useAuthStore()
        const email = 'invalid@example.com'
        const errorMessage = 'User not found'

        mockApiClient.post.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(authStore.resetPassword(email)).rejects.toThrow()
        
        expect(authStore.error).toBe(errorMessage)
        expect(authStore.isLoading).toBe(false)
      })
    })

    describe('updatePassword', () => {
      it('successfully updates password', async () => {
        const authStore = useAuthStore()
        const currentPassword = 'oldpassword'
        const newPassword = 'newpassword'
        const successMessage = 'Password updated successfully'

        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            message: successMessage
          }
        })

        const result = await authStore.updatePassword(currentPassword, newPassword)

        expect(mockApiClient.post).toHaveBeenCalledWith('/auth/update-password', {
          currentPassword,
          newPassword
        })
        expect(result).toBe(successMessage)
        expect(authStore.isLoading).toBe(false)
        expect(authStore.error).toBeNull()
      })

      it('handles password update errors', async () => {
        const authStore = useAuthStore()
        const currentPassword = 'wrongpassword'
        const newPassword = 'newpassword'
        const errorMessage = 'Current password is incorrect'

        mockApiClient.post.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(authStore.updatePassword(currentPassword, newPassword)).rejects.toThrow()
        
        expect(authStore.error).toBe(errorMessage)
        expect(authStore.isLoading).toBe(false)
      })
    })

    describe('clearError', () => {
      it('clears error state', () => {
        const authStore = useAuthStore()
        authStore.error = 'Some error'

        authStore.clearError()

        expect(authStore.error).toBeNull()
      })
    })
  })

  describe('Auth Data Management', () => {
    it('sets auth data correctly', () => {
      const authStore = useAuthStore()

      // Simulate setAuthData by calling register
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          status: 'success',
          data: mockAuthData
        }
      })

      return authStore.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        organizationId: 'org-123'
      }).then(() => {
        expect(authStore.user).toEqual(mockUser)
        expect(authStore.token).toBe(mockSession.access_token)
        expect(authStore.refreshToken).toBe(mockSession.refresh_token)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockSession.access_token)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refresh_token', mockSession.refresh_token)
        expect(mockApiClient.defaults.headers.common['Authorization']).toBe(`Bearer ${mockSession.access_token}`)
      })
    })

    it('clears auth data correctly', async () => {
      const authStore = useAuthStore()
      authStore.user = mockUser
      authStore.token = 'test-token'
      authStore.refreshToken = 'test-refresh'

      await authStore.logout()

      expect(authStore.user).toBeNull()
      expect(authStore.token).toBeNull()
      expect(authStore.refreshToken).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
      expect(mockApiClient.defaults.headers.common['Authorization']).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const authStore = useAuthStore()
      
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'))

      await expect(authStore.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow()

      expect(authStore.error).toBe('Network error')
      expect(authStore.isLoading).toBe(false)
    })

    it('handles API response errors without response data', async () => {
      const authStore = useAuthStore()
      
      mockApiClient.post.mockRejectedValueOnce({
        message: 'Request failed'
      })

      await expect(authStore.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow()

      expect(authStore.error).toBe('Request failed')
    })

    it('uses default error messages', async () => {
      const authStore = useAuthStore()
      
      mockApiClient.post.mockRejectedValueOnce({})

      await expect(authStore.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow()

      expect(authStore.error).toBe('Login failed')
    })
  })

  describe('Loading States', () => {
    it('manages loading state during operations', async () => {
      const authStore = useAuthStore()
      
      // Mock a delayed response
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockApiClient.post.mockReturnValueOnce(delayedPromise)

      const loginPromise = authStore.login({
        email: 'test@example.com',
        password: 'password123'
      })

      // Should be loading
      expect(authStore.isLoading).toBe(true)

      // Resolve the promise
      resolvePromise!({
        data: {
          status: 'success',
          data: mockAuthData
        }
      })

      await loginPromise

      // Should no longer be loading
      expect(authStore.isLoading).toBe(false)
    })
  })
})