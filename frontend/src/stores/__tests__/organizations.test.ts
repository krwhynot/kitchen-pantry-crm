import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOrganizationStore } from '../organizations'
import { apiClient } from '../../utils/api'
import type { Organization } from '@shared/types'

// Mock the API client
vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Organizations Store', () => {
  let store: ReturnType<typeof useOrganizationStore>
  let mockApiClient: jest.Mocked<typeof apiClient>

  const mockOrganizations: Organization[] = [
    {
      id: '1',
      name: 'Fine Dining Restaurant',
      type: 'restaurant',
      priority: 'A',
      segment: 'fine_dining',
      description: 'Upscale restaurant',
      email: 'contact@finedining.com',
      phone: '+1234567890',
      website: 'https://finedining.com',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    },
    {
      id: '2',
      name: 'Food Distribution Corp',
      type: 'distributor',
      priority: 'B',
      segment: 'distribution',
      description: 'Large food distributor',
      email: 'info@fooddist.com',
      phone: '+1234567891',
      website: 'https://fooddist.com',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    },
    {
      id: '3',
      name: 'Food Manufacturing Co',
      type: 'manufacturer',
      priority: 'C',
      segment: 'manufacturing',
      description: 'Food manufacturer',
      email: 'contact@foodmfg.com',
      phone: '+1234567892',
      website: 'https://foodmfg.com',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      createdBy: 'user1',
      updatedBy: 'user1'
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useOrganizationStore()
    mockApiClient = apiClient as jest.Mocked<typeof apiClient>
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('state', () => {
    it('should initialize with empty state', () => {
      expect(store.organizations).toEqual([])
      expect(store.currentOrganization).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      store.organizations = mockOrganizations
    })

    it('should get organization by id', () => {
      const organization = store.getOrganizationById('1')
      expect(organization).toEqual(mockOrganizations[0])
    })

    it('should return undefined for non-existent organization', () => {
      const organization = store.getOrganizationById('999')
      expect(organization).toBeUndefined()
    })

    it('should filter organizations by type', () => {
      const restaurantOrgs = store.getOrganizationsByType('restaurant')
      expect(restaurantOrgs).toEqual([mockOrganizations[0]])

      const distributorOrgs = store.getOrganizationsByType('distributor')
      expect(distributorOrgs).toEqual([mockOrganizations[1]])

      const manufacturerOrgs = store.getOrganizationsByType('manufacturer')
      expect(manufacturerOrgs).toEqual([mockOrganizations[2]])
    })

    it('should get restaurant organizations', () => {
      const restaurants = store.restaurantOrganizations
      expect(restaurants).toEqual([mockOrganizations[0]])
    })

    it('should get distributor organizations', () => {
      const distributors = store.distributorOrganizations
      expect(distributors).toEqual([mockOrganizations[1]])
    })

    it('should get manufacturer organizations', () => {
      const manufacturers = store.manufacturerOrganizations
      expect(manufacturers).toEqual([mockOrganizations[2]])
    })

    it('should get food service organizations', () => {
      const foodServiceOrg = {
        ...mockOrganizations[0],
        id: '4',
        type: 'food_service' as const
      }
      store.organizations = [...mockOrganizations, foodServiceOrg]

      const foodServiceOrgs = store.foodServiceOrganizations
      expect(foodServiceOrgs).toEqual([foodServiceOrg])
    })
  })

  describe('actions', () => {
    describe('fetchOrganizations', () => {
      it('should fetch organizations successfully', async () => {
        const mockResponse = {
          data: {
            status: 'success',
            data: mockOrganizations,
            meta: {
              pagination: {
                total: 3,
                page: 1,
                limit: 50
              }
            }
          }
        }

        mockApiClient.get.mockResolvedValue(mockResponse)

        await store.fetchOrganizations()

        expect(mockApiClient.get).toHaveBeenCalledWith('/organizations', {
          params: undefined
        })
        expect(store.organizations).toEqual(mockOrganizations)
        expect(store.isLoading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should fetch organizations with parameters', async () => {
        const mockResponse = {
          data: {
            status: 'success',
            data: [mockOrganizations[0]],
            meta: {
              pagination: {
                total: 1,
                page: 1,
                limit: 10
              }
            }
          }
        }

        mockApiClient.get.mockResolvedValue(mockResponse)

        const params = {
          page: 1,
          limit: 10,
          type: 'restaurant' as const
        }

        await store.fetchOrganizations(params)

        expect(mockApiClient.get).toHaveBeenCalledWith('/organizations', {
          params
        })
        expect(store.organizations).toEqual([mockOrganizations[0]])
      })

      it('should handle fetch error', async () => {
        const errorMessage = 'Failed to fetch organizations'
        mockApiClient.get.mockRejectedValue(new Error(errorMessage))

        await store.fetchOrganizations()

        expect(store.organizations).toEqual([])
        expect(store.isLoading).toBe(false)
        expect(store.error).toBe(errorMessage)
      })

      it('should handle API error response', async () => {
        const mockResponse = {
          data: {
            status: 'error',
            message: 'API Error'
          }
        }

        mockApiClient.get.mockResolvedValue(mockResponse)

        await store.fetchOrganizations()

        expect(store.organizations).toEqual([])
        expect(store.error).toBe('API Error')
      })

      it('should set loading state during fetch', async () => {
        const mockResponse = {
          data: {
            status: 'success',
            data: mockOrganizations,
            meta: { pagination: { total: 3, page: 1, limit: 50 } }
          }
        }

        // Create a promise that we can control
        let resolvePromise: (value: any) => void
        const controlledPromise = new Promise(resolve => {
          resolvePromise = resolve
        })

        mockApiClient.get.mockReturnValue(controlledPromise as any)

        // Start the fetch
        const fetchPromise = store.fetchOrganizations()

        // Check loading state is true
        expect(store.isLoading).toBe(true)

        // Resolve the promise
        resolvePromise!(mockResponse)
        await fetchPromise

        // Check loading state is false
        expect(store.isLoading).toBe(false)
      })
    })

    describe('fetchOrganizationById', () => {
      it('should fetch organization by id successfully', async () => {
        const mockResponse = {
          data: {
            status: 'success',
            data: mockOrganizations[0]
          }
        }

        mockApiClient.get.mockResolvedValue(mockResponse)

        const result = await store.fetchOrganizationById('1')

        expect(mockApiClient.get).toHaveBeenCalledWith('/organizations/1')
        expect(result).toEqual(mockOrganizations[0])
        expect(store.currentOrganization).toEqual(mockOrganizations[0])
        expect(store.error).toBeNull()
      })

      it('should handle fetch by id error', async () => {
        const errorMessage = 'Organization not found'
        mockApiClient.get.mockRejectedValue(new Error(errorMessage))

        const result = await store.fetchOrganizationById('999')

        expect(result).toBeNull()
        expect(store.currentOrganization).toBeNull()
        expect(store.error).toBe(errorMessage)
      })

      it('should handle API error response for fetch by id', async () => {
        const mockResponse = {
          data: {
            status: 'error',
            message: 'Organization not found'
          }
        }

        mockApiClient.get.mockResolvedValue(mockResponse)

        const result = await store.fetchOrganizationById('999')

        expect(result).toBeNull()
        expect(store.error).toBe('Organization not found')
      })
    })

    describe('createOrganization', () => {
      const newOrganizationData = {
        name: 'New Restaurant',
        type: 'restaurant' as const,
        priority: 'A',
        segment: 'fine_dining',
        description: 'New upscale restaurant',
        email: 'contact@newrestaurant.com',
        phone: '+1234567893',
        website: 'https://newrestaurant.com'
      }

      it('should create organization successfully', async () => {
        const createdOrganization = {
          id: '4',
          ...newOrganizationData,
          isActive: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          createdBy: 'user1',
          updatedBy: 'user1'
        }

        const mockResponse = {
          data: {
            status: 'success',
            data: createdOrganization
          }
        }

        mockApiClient.post.mockResolvedValue(mockResponse)

        const result = await store.createOrganization(newOrganizationData)

        expect(mockApiClient.post).toHaveBeenCalledWith('/organizations', newOrganizationData)
        expect(result).toEqual(createdOrganization)
        expect(store.organizations).toContain(createdOrganization)
        expect(store.error).toBeNull()
      })

      it('should handle create error', async () => {
        const errorMessage = 'Failed to create organization'
        mockApiClient.post.mockRejectedValue(new Error(errorMessage))

        const result = await store.createOrganization(newOrganizationData)

        expect(result).toBeNull()
        expect(store.error).toBe(errorMessage)
      })

      it('should handle API error response for create', async () => {
        const mockResponse = {
          data: {
            status: 'error',
            message: 'Validation failed'
          }
        }

        mockApiClient.post.mockResolvedValue(mockResponse)

        const result = await store.createOrganization(newOrganizationData)

        expect(result).toBeNull()
        expect(store.error).toBe('Validation failed')
      })
    })

    describe('updateOrganization', () => {
      const updateData = {
        name: 'Updated Restaurant Name',
        description: 'Updated description'
      }

      it('should update organization successfully', async () => {
        const updatedOrganization = {
          ...mockOrganizations[0],
          ...updateData,
          updatedAt: '2023-01-02T00:00:00Z'
        }

        const mockResponse = {
          data: {
            status: 'success',
            data: updatedOrganization
          }
        }

        // Set initial organizations
        store.organizations = [...mockOrganizations]

        mockApiClient.put.mockResolvedValue(mockResponse)

        const result = await store.updateOrganization('1', updateData)

        expect(mockApiClient.put).toHaveBeenCalledWith('/organizations/1', updateData)
        expect(result).toEqual(updatedOrganization)
        expect(store.organizations[0]).toEqual(updatedOrganization)
        expect(store.error).toBeNull()
      })

      it('should update current organization if it matches', async () => {
        const updatedOrganization = {
          ...mockOrganizations[0],
          ...updateData,
          updatedAt: '2023-01-02T00:00:00Z'
        }

        const mockResponse = {
          data: {
            status: 'success',
            data: updatedOrganization
          }
        }

        // Set initial state
        store.organizations = [...mockOrganizations]
        store.currentOrganization = mockOrganizations[0]

        mockApiClient.put.mockResolvedValue(mockResponse)

        await store.updateOrganization('1', updateData)

        expect(store.currentOrganization).toEqual(updatedOrganization)
      })

      it('should handle update error', async () => {
        const errorMessage = 'Failed to update organization'
        mockApiClient.put.mockRejectedValue(new Error(errorMessage))

        const result = await store.updateOrganization('1', updateData)

        expect(result).toBeNull()
        expect(store.error).toBe(errorMessage)
      })
    })

    describe('deleteOrganization', () => {
      it('should delete organization successfully', async () => {
        const mockResponse = {
          data: {
            status: 'success',
            message: 'Organization deleted successfully'
          }
        }

        // Set initial organizations
        store.organizations = [...mockOrganizations]

        mockApiClient.delete.mockResolvedValue(mockResponse)

        const result = await store.deleteOrganization('1')

        expect(mockApiClient.delete).toHaveBeenCalledWith('/organizations/1')
        expect(result).toBe(true)
        expect(store.organizations).not.toContain(mockOrganizations[0])
        expect(store.error).toBeNull()
      })

      it('should clear current organization if deleted', async () => {
        const mockResponse = {
          data: {
            status: 'success',
            message: 'Organization deleted successfully'
          }
        }

        // Set initial state
        store.organizations = [...mockOrganizations]
        store.currentOrganization = mockOrganizations[0]

        mockApiClient.delete.mockResolvedValue(mockResponse)

        await store.deleteOrganization('1')

        expect(store.currentOrganization).toBeNull()
      })

      it('should handle delete error', async () => {
        const errorMessage = 'Failed to delete organization'
        mockApiClient.delete.mockRejectedValue(new Error(errorMessage))

        const result = await store.deleteOrganization('1')

        expect(result).toBe(false)
        expect(store.error).toBe(errorMessage)
      })
    })

    describe('clearError', () => {
      it('should clear error state', () => {
        store.error = 'Some error'
        
        store.clearError()
        
        expect(store.error).toBeNull()
      })
    })

    describe('setCurrentOrganization', () => {
      it('should set current organization', () => {
        store.setCurrentOrganization(mockOrganizations[0])
        
        expect(store.currentOrganization).toEqual(mockOrganizations[0])
      })

      it('should clear current organization when null', () => {
        store.currentOrganization = mockOrganizations[0]
        
        store.setCurrentOrganization(null)
        
        expect(store.currentOrganization).toBeNull()
      })
    })
  })
})