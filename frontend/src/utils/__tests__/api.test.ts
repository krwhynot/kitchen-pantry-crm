import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Mock axios instance
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  defaults: {
    headers: {
      common: {}
    }
  },
  interceptors: {
    request: {
      use: vi.fn()
    },
    response: {
      use: vi.fn()
    }
  }
}

// Mock axios.create to return our mock instance
mockedAxios.create = vi.fn(() => mockAxiosInstance as any)

// Now import the modules after setting up mocks
import { apiClient, api, type ApiResponse, type PaginatedResponse } from '../api'

describe('apiClient', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000'
      },
      writable: true
    })
  })

  it('creates axios instance with correct configuration', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:5000/api/v1',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
  })

  it('uses environment variable for baseURL when available', () => {
    // Mock import.meta.env
    const originalEnv = import.meta.env
    import.meta.env = { ...originalEnv, VITE_API_URL: 'https://api.example.com' }
    
    // Re-import the module to test environment variable usage
    const { apiClient } = require('../api')
    
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.example.com'
      })
    )
    
    // Restore original env
    import.meta.env = originalEnv
  })

  it('sets up request interceptor', () => {
    const mockInterceptor = {
      use: vi.fn()
    }
    
    const mockAxiosInstance = {
      interceptors: {
        request: mockInterceptor,
        response: { use: vi.fn() }
      }
    }
    
    mockedAxios.create = vi.fn(() => mockAxiosInstance as any)
    
    // Re-import to trigger interceptor setup
    require('../api')
    
    expect(mockInterceptor.use).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('request interceptor returns config unchanged', () => {
    const mockInterceptor = {
      use: vi.fn()
    }
    
    const mockAxiosInstance = {
      interceptors: {
        request: mockInterceptor,
        response: { use: vi.fn() }
      }
    }
    
    mockedAxios.create = vi.fn(() => mockAxiosInstance as any)
    
    // Re-import to trigger interceptor setup
    require('../api')
    
    const [successHandler] = mockInterceptor.use.mock.calls[0]
    const config = { url: '/test' }
    
    expect(successHandler(config)).toBe(config)
  })

  it('request interceptor rejects errors', () => {
    const mockInterceptor = {
      use: vi.fn()
    }
    
    const mockAxiosInstance = {
      interceptors: {
        request: mockInterceptor,
        response: { use: vi.fn() }
      }
    }
    
    mockedAxios.create = vi.fn(() => mockAxiosInstance as any)
    
    // Re-import to trigger interceptor setup
    require('../api')
    
    const [, errorHandler] = mockInterceptor.use.mock.calls[0]
    const error = new Error('Request failed')
    
    expect(errorHandler(error)).rejects.toBe(error)
  })
})

describe('response interceptor', () => {
  let mockAxiosInstance: any
  let responseInterceptor: any

  beforeEach(() => {
    mockAxiosInstance = {
      post: vi.fn(),
      defaults: {
        headers: {
          common: {}
        }
      },
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }
    
    mockedAxios.create = vi.fn(() => mockAxiosInstance)
    
    // Re-import to trigger interceptor setup
    require('../api')
    
    responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0]
  })

  it('returns response unchanged on success', () => {
    const [successHandler] = responseInterceptor
    const response = { data: { message: 'Success' } }
    
    expect(successHandler(response)).toBe(response)
  })

  it('handles 401 error with refresh token', async () => {
    const [, errorHandler] = responseInterceptor
    
    // Mock localStorage to return refresh token
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('refresh_token_123'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    
    // Mock successful refresh response
    mockAxiosInstance.post.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          session: {
            access_token: 'new_access_token',
            refresh_token: 'new_refresh_token'
          }
        }
      }
    })
    
    // Mock the original request
    const originalRequest = {
      headers: {},
      _retry: undefined
    }
    
    const error = {
      response: { status: 401 },
      config: originalRequest
    }
    
    mockAxiosInstance.mockImplementation = vi.fn().mockResolvedValue({ data: 'success' })
    
    await errorHandler(error)
    
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', {
      refresh_token: 'refresh_token_123'
    })
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'new_access_token')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new_refresh_token')
  })

  it('handles 401 error without refresh token', async () => {
    const [, errorHandler] = responseInterceptor
    
    // Mock localStorage to return null
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    
    // Mock window.location
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })
    
    const error = {
      response: { status: 401 },
      config: { _retry: undefined }
    }
    
    await errorHandler(error)
    
    expect(mockLocation.href).toBe('/login')
  })

  it('handles refresh token failure', async () => {
    const [, errorHandler] = responseInterceptor
    
    // Mock localStorage to return refresh token
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('refresh_token_123'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    
    // Mock failed refresh response
    mockAxiosInstance.post.mockRejectedValue(new Error('Refresh failed'))
    
    // Mock window.location
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })
    
    const error = {
      response: { status: 401 },
      config: { _retry: undefined }
    }
    
    await expect(errorHandler(error)).rejects.toThrow('Refresh failed')
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    expect(mockLocation.href).toBe('/login')
  })

  it('does not retry 401 error if already retried', async () => {
    const [, errorHandler] = responseInterceptor
    
    const error = {
      response: { status: 401 },
      config: { _retry: true }
    }
    
    await expect(errorHandler(error)).rejects.toBe(error)
  })

  it('passes through non-401 errors', async () => {
    const [, errorHandler] = responseInterceptor
    
    const error = {
      response: { status: 400 },
      config: {}
    }
    
    await expect(errorHandler(error)).rejects.toBe(error)
  })
})

describe('api methods', () => {
  let mockAxiosInstance: any

  beforeEach(() => {
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      defaults: {
        headers: {
          common: {}
        }
      },
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }
    
    mockedAxios.create = vi.fn(() => mockAxiosInstance)
  })

  it('api.get makes GET request with correct parameters', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: { id: 1, name: 'Test' }
      }
    }
    
    mockAxiosInstance.get.mockResolvedValue(mockResponse)
    
    const result = await api.get('/users', { page: 1 })
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users', { params: { page: 1 } })
    expect(result).toEqual(mockResponse.data)
  })

  it('api.post makes POST request with correct data', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: { id: 1, name: 'Created' }
      }
    }
    
    mockAxiosInstance.post.mockResolvedValue(mockResponse)
    
    const postData = { name: 'New User' }
    const result = await api.post('/users', postData)
    
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', postData)
    expect(result).toEqual(mockResponse.data)
  })

  it('api.put makes PUT request with correct data', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: { id: 1, name: 'Updated' }
      }
    }
    
    mockAxiosInstance.put.mockResolvedValue(mockResponse)
    
    const putData = { name: 'Updated User' }
    const result = await api.put('/users/1', putData)
    
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/1', putData)
    expect(result).toEqual(mockResponse.data)
  })

  it('api.delete makes DELETE request', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        message: 'Deleted successfully'
      }
    }
    
    mockAxiosInstance.delete.mockResolvedValue(mockResponse)
    
    const result = await api.delete('/users/1')
    
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/users/1')
    expect(result).toEqual(mockResponse.data)
  })

  it('api.patch makes PATCH request with correct data', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: { id: 1, name: 'Patched' }
      }
    }
    
    mockAxiosInstance.patch.mockResolvedValue(mockResponse)
    
    const patchData = { name: 'Patched User' }
    const result = await api.patch('/users/1', patchData)
    
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/users/1', patchData)
    expect(result).toEqual(mockResponse.data)
  })

  it('handles API errors correctly', async () => {
    const mockError = new Error('API Error')
    mockAxiosInstance.get.mockRejectedValue(mockError)
    
    await expect(api.get('/users')).rejects.toThrow('API Error')
  })

  it('handles requests without data parameter', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        data: []
      }
    }
    
    mockAxiosInstance.get.mockResolvedValue(mockResponse)
    
    const result = await api.get('/users')
    
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users', { params: undefined })
    expect(result).toEqual(mockResponse.data)
  })

  it('handles POST requests without data', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        message: 'Success'
      }
    }
    
    mockAxiosInstance.post.mockResolvedValue(mockResponse)
    
    const result = await api.post('/users')
    
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', undefined)
    expect(result).toEqual(mockResponse.data)
  })
})

describe('TypeScript interfaces', () => {
  it('ApiResponse interface should be properly typed', () => {
    const successResponse: ApiResponse<{ id: number; name: string }> = {
      status: 'success',
      data: { id: 1, name: 'Test' },
      message: 'Success',
      statusCode: 200
    }
    
    expect(successResponse.status).toBe('success')
    expect(successResponse.data).toEqual({ id: 1, name: 'Test' })
    expect(successResponse.message).toBe('Success')
    expect(successResponse.statusCode).toBe(200)
  })

  it('ApiResponse can represent error responses', () => {
    const errorResponse: ApiResponse = {
      status: 'error',
      message: 'Something went wrong',
      statusCode: 400
    }
    
    expect(errorResponse.status).toBe('error')
    expect(errorResponse.message).toBe('Something went wrong')
    expect(errorResponse.statusCode).toBe(400)
  })

  it('PaginatedResponse interface should be properly typed', () => {
    const paginatedResponse: PaginatedResponse<{ id: number; name: string }> = {
      data: [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    }
    
    expect(paginatedResponse.data).toHaveLength(2)
    expect(paginatedResponse.pagination.page).toBe(1)
    expect(paginatedResponse.pagination.limit).toBe(10)
    expect(paginatedResponse.pagination.total).toBe(2)
    expect(paginatedResponse.pagination.totalPages).toBe(1)
  })
})

describe('Integration tests', () => {
  let mockAxiosInstance: any

  beforeEach(() => {
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      defaults: {
        headers: {
          common: {}
        }
      },
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }
    
    mockedAxios.create = vi.fn(() => mockAxiosInstance)
  })

  it('should handle complete API workflow', async () => {
    // Mock successful responses
    mockAxiosInstance.get.mockResolvedValue({
      data: { status: 'success', data: [] }
    })
    
    mockAxiosInstance.post.mockResolvedValue({
      data: { status: 'success', data: { id: 1, name: 'Created' } }
    })
    
    mockAxiosInstance.put.mockResolvedValue({
      data: { status: 'success', data: { id: 1, name: 'Updated' } }
    })
    
    mockAxiosInstance.delete.mockResolvedValue({
      data: { status: 'success', message: 'Deleted' }
    })
    
    // Test complete workflow
    const getResult = await api.get('/users')
    const postResult = await api.post('/users', { name: 'New User' })
    const putResult = await api.put('/users/1', { name: 'Updated User' })
    const deleteResult = await api.delete('/users/1')
    
    expect(getResult.status).toBe('success')
    expect(postResult.status).toBe('success')
    expect(putResult.status).toBe('success')
    expect(deleteResult.status).toBe('success')
  })

  it('should handle API errors gracefully', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'))
    
    await expect(api.get('/users')).rejects.toThrow('Network error')
  })

  it('should handle timeout errors', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('timeout of 10000ms exceeded'))
    
    await expect(api.get('/users')).rejects.toThrow('timeout of 10000ms exceeded')
  })
})