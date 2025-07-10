import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOpportunityStore } from '../opportunities'

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

vi.mock('../utils/api', () => ({
  apiClient: mockApiClient
}))

// Mock shared types
vi.mock('@shared/types', () => ({
  Opportunity: {}
}))

const mockOpportunities = [
  {
    id: 'opp-1',
    title: 'Restaurant Equipment Deal',
    description: 'Large kitchen equipment order',
    stage: 'proposal',
    value: 50000,
    probability: 70,
    contactId: 'contact-1',
    organizationId: 'org-1',
    userId: 'user-1',
    expectedCloseDate: '2023-02-15T00:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-10T00:00:00Z'
  },
  {
    id: 'opp-2',
    title: 'Catering Contract',
    description: 'Annual catering services contract',
    stage: 'closed_won',
    value: 75000,
    probability: 100,
    contactId: 'contact-2',
    organizationId: 'org-1',
    userId: 'user-1',
    expectedCloseDate: '2023-01-20T00:00:00Z',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-20T00:00:00Z'
  },
  {
    id: 'opp-3',
    title: 'Food Service Supplies',
    description: 'Monthly food service supplies',
    stage: 'closed_lost',
    value: 25000,
    probability: 0,
    contactId: 'contact-3',
    organizationId: 'org-2',
    userId: 'user-2',
    expectedCloseDate: '2023-01-30T00:00:00Z',
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-30T00:00:00Z'
  },
  {
    id: 'opp-4',
    title: 'Bar Equipment Upgrade',
    description: 'Complete bar equipment upgrade',
    stage: 'negotiation',
    value: 30000,
    probability: 85,
    contactId: 'contact-4',
    organizationId: 'org-2',
    userId: 'user-2',
    expectedCloseDate: '2023-02-28T00:00:00Z',
    createdAt: '2023-01-04T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z'
  }
]

describe('Opportunity Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with empty state', () => {
      const opportunityStore = useOpportunityStore()
      
      expect(opportunityStore.opportunities).toEqual([])
      expect(opportunityStore.currentOpportunity).toBeNull()
      expect(opportunityStore.isLoading).toBe(false)
      expect(opportunityStore.error).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      const opportunityStore = useOpportunityStore()
      opportunityStore.opportunities = mockOpportunities
    })

    it('gets opportunity by id', () => {
      const opportunityStore = useOpportunityStore()
      
      const opportunity = opportunityStore.getOpportunityById('opp-1')
      expect(opportunity).toEqual(mockOpportunities[0])
      
      const nonExistentOpportunity = opportunityStore.getOpportunityById('non-existent')
      expect(nonExistentOpportunity).toBeUndefined()
    })

    it('gets opportunities by contact', () => {
      const opportunityStore = useOpportunityStore()
      
      const contactOpportunities = opportunityStore.getOpportunitiesByContact('contact-1')
      expect(contactOpportunities).toHaveLength(1)
      expect(contactOpportunities).toEqual([mockOpportunities[0]])
    })

    it('gets opportunities by organization', () => {
      const opportunityStore = useOpportunityStore()
      
      const org1Opportunities = opportunityStore.getOpportunitiesByOrganization('org-1')
      expect(org1Opportunities).toHaveLength(2)
      expect(org1Opportunities).toEqual([mockOpportunities[0], mockOpportunities[1]])
      
      const org2Opportunities = opportunityStore.getOpportunitiesByOrganization('org-2')
      expect(org2Opportunities).toHaveLength(2)
      expect(org2Opportunities).toEqual([mockOpportunities[2], mockOpportunities[3]])
    })

    it('gets opportunities by stage', () => {
      const opportunityStore = useOpportunityStore()
      
      const proposalOpportunities = opportunityStore.getOpportunitiesByStage('proposal')
      expect(proposalOpportunities).toHaveLength(1)
      expect(proposalOpportunities).toEqual([mockOpportunities[0]])
      
      const wonOpportunities = opportunityStore.getOpportunitiesByStage('closed_won')
      expect(wonOpportunities).toHaveLength(1)
      expect(wonOpportunities).toEqual([mockOpportunities[1]])
    })

    it('gets opportunities by user', () => {
      const opportunityStore = useOpportunityStore()
      
      const user1Opportunities = opportunityStore.getOpportunitiesByUser('user-1')
      expect(user1Opportunities).toHaveLength(2)
      expect(user1Opportunities).toEqual([mockOpportunities[0], mockOpportunities[1]])
      
      const user2Opportunities = opportunityStore.getOpportunitiesByUser('user-2')
      expect(user2Opportunities).toHaveLength(2)
      expect(user2Opportunities).toEqual([mockOpportunities[2], mockOpportunities[3]])
    })

    it('gets active opportunities', () => {
      const opportunityStore = useOpportunityStore()
      
      const activeOpportunities = opportunityStore.activeOpportunities
      expect(activeOpportunities).toHaveLength(2)
      expect(activeOpportunities).toEqual([mockOpportunities[0], mockOpportunities[3]])
    })

    it('gets won opportunities', () => {
      const opportunityStore = useOpportunityStore()
      
      const wonOpportunities = opportunityStore.wonOpportunities
      expect(wonOpportunities).toHaveLength(1)
      expect(wonOpportunities).toEqual([mockOpportunities[1]])
    })

    it('gets lost opportunities', () => {
      const opportunityStore = useOpportunityStore()
      
      const lostOpportunities = opportunityStore.lostOpportunities
      expect(lostOpportunities).toHaveLength(1)
      expect(lostOpportunities).toEqual([mockOpportunities[2]])
    })

    it('calculates total value', () => {
      const opportunityStore = useOpportunityStore()
      
      const totalValue = opportunityStore.totalValue
      expect(totalValue).toBe(180000) // 50000 + 75000 + 25000 + 30000
    })

    it('calculates total active value', () => {
      const opportunityStore = useOpportunityStore()
      
      const totalActiveValue = opportunityStore.totalActiveValue
      expect(totalActiveValue).toBe(80000) // 50000 + 30000 (only active opportunities)
    })

    it('calculates total won value', () => {
      const opportunityStore = useOpportunityStore()
      
      const totalWonValue = opportunityStore.totalWonValue
      expect(totalWonValue).toBe(75000) // Only the won opportunity
    })

    it('calculates weighted value', () => {
      const opportunityStore = useOpportunityStore()
      
      const weightedValue = opportunityStore.weightedValue
      // (50000 * 70/100) + (75000 * 100/100) + (25000 * 0/100) + (30000 * 85/100)
      // = 35000 + 75000 + 0 + 25500 = 135500
      expect(weightedValue).toBe(135500)
    })
  })

  describe('Actions', () => {
    describe('fetchOpportunities', () => {
      it('successfully fetches opportunities', async () => {
        const opportunityStore = useOpportunityStore()
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockOpportunities
          }
        })

        const result = await opportunityStore.fetchOpportunities()

        expect(mockApiClient.get).toHaveBeenCalledWith('/opportunities', { params: undefined })
        expect(opportunityStore.opportunities).toEqual(mockOpportunities)
        expect(opportunityStore.isLoading).toBe(false)
        expect(opportunityStore.error).toBeNull()
        expect(result).toEqual(mockOpportunities)
      })

      it('fetches opportunities with parameters', async () => {
        const opportunityStore = useOpportunityStore()
        const params = {
          page: 1,
          limit: 10,
          contactId: 'contact-1',
          organizationId: 'org-1',
          userId: 'user-1',
          stage: 'proposal' as const
        }
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockOpportunities
          }
        })

        await opportunityStore.fetchOpportunities(params)

        expect(mockApiClient.get).toHaveBeenCalledWith('/opportunities', { params })
      })

      it('handles fetch opportunities error', async () => {
        const opportunityStore = useOpportunityStore()
        const errorMessage = 'Failed to fetch opportunities'
        
        mockApiClient.get.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(opportunityStore.fetchOpportunities()).rejects.toThrow()
        
        expect(opportunityStore.error).toBe(errorMessage)
        expect(opportunityStore.isLoading).toBe(false)
        expect(opportunityStore.opportunities).toEqual([])
      })
    })

    describe('fetchOpportunityById', () => {
      it('successfully fetches opportunity by id', async () => {
        const opportunityStore = useOpportunityStore()
        const opportunityId = 'opp-1'
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockOpportunities[0]
          }
        })

        const result = await opportunityStore.fetchOpportunityById(opportunityId)

        expect(mockApiClient.get).toHaveBeenCalledWith(`/opportunities/${opportunityId}`)
        expect(opportunityStore.currentOpportunity).toEqual(mockOpportunities[0])
        expect(opportunityStore.isLoading).toBe(false)
        expect(opportunityStore.error).toBeNull()
        expect(result).toEqual(mockOpportunities[0])
      })

      it('updates existing opportunity in list', async () => {
        const opportunityStore = useOpportunityStore()
        opportunityStore.opportunities = [...mockOpportunities]
        
        const updatedOpportunity = { ...mockOpportunities[0], probability: 90 }
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedOpportunity
          }
        })

        await opportunityStore.fetchOpportunityById('opp-1')

        expect(opportunityStore.opportunities[0]).toEqual(updatedOpportunity)
        expect(opportunityStore.currentOpportunity).toEqual(updatedOpportunity)
      })

      it('handles fetch opportunity by id error', async () => {
        const opportunityStore = useOpportunityStore()
        const errorMessage = 'Opportunity not found'
        
        mockApiClient.get.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(opportunityStore.fetchOpportunityById('non-existent')).rejects.toThrow()
        
        expect(opportunityStore.error).toBe(errorMessage)
        expect(opportunityStore.isLoading).toBe(false)
        expect(opportunityStore.currentOpportunity).toBeNull()
      })
    })

    describe('createOpportunity', () => {
      it('successfully creates an opportunity', async () => {
        const opportunityStore = useOpportunityStore()
        const newOpportunityData = {
          title: 'New Kitchen Deal',
          description: 'New kitchen equipment deal',
          stage: 'qualification' as const,
          value: 40000,
          probability: 60,
          contactId: 'contact-5',
          organizationId: 'org-3',
          userId: 'user-3',
          expectedCloseDate: '2023-03-15T00:00:00Z'
        }
        
        const createdOpportunity = {
          id: 'opp-5',
          ...newOpportunityData,
          createdAt: '2023-01-05T00:00:00Z',
          updatedAt: '2023-01-05T00:00:00Z'
        }
        
        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: createdOpportunity
          }
        })

        const result = await opportunityStore.createOpportunity(newOpportunityData)

        expect(mockApiClient.post).toHaveBeenCalledWith('/opportunities', newOpportunityData)
        expect(opportunityStore.opportunities).toContain(createdOpportunity)
        expect(opportunityStore.isLoading).toBe(false)
        expect(opportunityStore.error).toBeNull()
        expect(result).toEqual(createdOpportunity)
      })

      it('handles create opportunity error', async () => {
        const opportunityStore = useOpportunityStore()
        const errorMessage = 'Invalid opportunity data'
        
        mockApiClient.post.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(opportunityStore.createOpportunity({
          title: 'Test Opportunity',
          description: 'Test description',
          stage: 'qualification',
          value: 10000,
          probability: 50,
          contactId: 'contact-1',
          organizationId: 'org-1',
          userId: 'user-1',
          expectedCloseDate: '2023-03-01T00:00:00Z'
        })).rejects.toThrow()
        
        expect(opportunityStore.error).toBe(errorMessage)
        expect(opportunityStore.isLoading).toBe(false)
      })
    })

    describe('updateOpportunity', () => {
      it('successfully updates an opportunity', async () => {
        const opportunityStore = useOpportunityStore()
        opportunityStore.opportunities = [...mockOpportunities]
        opportunityStore.currentOpportunity = mockOpportunities[0]
        
        const updateData = { probability: 80 }
        const updatedOpportunity = { ...mockOpportunities[0], ...updateData }
        
        mockApiClient.put.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedOpportunity
          }
        })

        const result = await opportunityStore.updateOpportunity('opp-1', updateData)

        expect(mockApiClient.put).toHaveBeenCalledWith('/opportunities/opp-1', updateData)
        expect(opportunityStore.opportunities[0]).toEqual(updatedOpportunity)
        expect(opportunityStore.currentOpportunity).toEqual(updatedOpportunity)
        expect(opportunityStore.isLoading).toBe(false)
        expect(opportunityStore.error).toBeNull()
        expect(result).toEqual(updatedOpportunity)
      })

      it('updates only list when current opportunity is different', async () => {
        const opportunityStore = useOpportunityStore()
        opportunityStore.opportunities = [...mockOpportunities]
        opportunityStore.currentOpportunity = mockOpportunities[1] // Different opportunity
        
        const updateData = { probability: 80 }
        const updatedOpportunity = { ...mockOpportunities[0], ...updateData }
        
        mockApiClient.put.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedOpportunity
          }
        })

        await opportunityStore.updateOpportunity('opp-1', updateData)

        expect(opportunityStore.opportunities[0]).toEqual(updatedOpportunity)
        expect(opportunityStore.currentOpportunity).toEqual(mockOpportunities[1]) // Unchanged
      })

      it('handles update opportunity error', async () => {
        const opportunityStore = useOpportunityStore()
        const errorMessage = 'Opportunity not found'
        
        mockApiClient.put.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(opportunityStore.updateOpportunity('non-existent', { probability: 80 })).rejects.toThrow()
        
        expect(opportunityStore.error).toBe(errorMessage)
        expect(opportunityStore.isLoading).toBe(false)
      })
    })

    describe('deleteOpportunity', () => {
      it('successfully deletes an opportunity', async () => {
        const opportunityStore = useOpportunityStore()
        opportunityStore.opportunities = [...mockOpportunities]
        opportunityStore.currentOpportunity = mockOpportunities[0]
        
        mockApiClient.delete.mockResolvedValueOnce({
          data: {
            status: 'success'
          }
        })

        const result = await opportunityStore.deleteOpportunity('opp-1')

        expect(mockApiClient.delete).toHaveBeenCalledWith('/opportunities/opp-1')
        expect(opportunityStore.opportunities).toHaveLength(3)
        expect(opportunityStore.opportunities.find(o => o.id === 'opp-1')).toBeUndefined()
        expect(opportunityStore.currentOpportunity).toBeNull()
        expect(opportunityStore.isLoading).toBe(false)
        expect(opportunityStore.error).toBeNull()
        expect(result).toBe(true)
      })

      it('deletes from list only when current opportunity is different', async () => {
        const opportunityStore = useOpportunityStore()
        opportunityStore.opportunities = [...mockOpportunities]
        opportunityStore.currentOpportunity = mockOpportunities[1] // Different opportunity
        
        mockApiClient.delete.mockResolvedValueOnce({
          data: {
            status: 'success'
          }
        })

        await opportunityStore.deleteOpportunity('opp-1')

        expect(opportunityStore.opportunities).toHaveLength(3)
        expect(opportunityStore.opportunities.find(o => o.id === 'opp-1')).toBeUndefined()
        expect(opportunityStore.currentOpportunity).toEqual(mockOpportunities[1]) // Unchanged
      })

      it('handles delete opportunity error', async () => {
        const opportunityStore = useOpportunityStore()
        const errorMessage = 'Opportunity not found'
        
        mockApiClient.delete.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(opportunityStore.deleteOpportunity('non-existent')).rejects.toThrow()
        
        expect(opportunityStore.error).toBe(errorMessage)
        expect(opportunityStore.isLoading).toBe(false)
      })
    })

    describe('clearError', () => {
      it('clears error state', () => {
        const opportunityStore = useOpportunityStore()
        opportunityStore.error = 'Some error'

        opportunityStore.clearError()

        expect(opportunityStore.error).toBeNull()
      })
    })

    describe('clearCurrentOpportunity', () => {
      it('clears current opportunity', () => {
        const opportunityStore = useOpportunityStore()
        opportunityStore.currentOpportunity = mockOpportunities[0]

        opportunityStore.clearCurrentOpportunity()

        expect(opportunityStore.currentOpportunity).toBeNull()
      })
    })
  })

  describe('Value Calculations', () => {
    beforeEach(() => {
      const opportunityStore = useOpportunityStore()
      opportunityStore.opportunities = mockOpportunities
    })

    it('calculates values correctly with different stages', () => {
      const opportunityStore = useOpportunityStore()
      
      expect(opportunityStore.totalValue).toBe(180000)
      expect(opportunityStore.totalActiveValue).toBe(80000) // Excludes closed_won and closed_lost
      expect(opportunityStore.totalWonValue).toBe(75000)
      expect(opportunityStore.weightedValue).toBe(135500)
    })

    it('handles empty opportunities list', () => {
      const opportunityStore = useOpportunityStore()
      opportunityStore.opportunities = []
      
      expect(opportunityStore.totalValue).toBe(0)
      expect(opportunityStore.totalActiveValue).toBe(0)
      expect(opportunityStore.totalWonValue).toBe(0)
      expect(opportunityStore.weightedValue).toBe(0)
    })

    it('recalculates values when opportunities change', () => {
      const opportunityStore = useOpportunityStore()
      
      // Add a new opportunity
      const newOpportunity = {
        id: 'opp-5',
        title: 'Additional Deal',
        description: 'Another deal',
        stage: 'proposal' as const,
        value: 20000,
        probability: 50,
        contactId: 'contact-5',
        organizationId: 'org-3',
        userId: 'user-3',
        expectedCloseDate: '2023-03-01T00:00:00Z',
        createdAt: '2023-01-05T00:00:00Z',
        updatedAt: '2023-01-05T00:00:00Z'
      }
      
      opportunityStore.opportunities.push(newOpportunity)
      
      expect(opportunityStore.totalValue).toBe(200000) // 180000 + 20000
      expect(opportunityStore.totalActiveValue).toBe(100000) // 80000 + 20000
      expect(opportunityStore.weightedValue).toBe(145500) // 135500 + 10000
    })
  })

  describe('Error Handling', () => {
    it('handles API errors without response data', async () => {
      const opportunityStore = useOpportunityStore()
      
      mockApiClient.get.mockRejectedValueOnce({
        message: 'Network error'
      })

      await expect(opportunityStore.fetchOpportunities()).rejects.toThrow()
      
      expect(opportunityStore.error).toBe('Network error')
    })

    it('uses default error messages', async () => {
      const opportunityStore = useOpportunityStore()
      
      mockApiClient.get.mockRejectedValueOnce({})

      await expect(opportunityStore.fetchOpportunities()).rejects.toThrow()
      
      expect(opportunityStore.error).toBe('Failed to fetch opportunities')
    })
  })

  describe('Loading States', () => {
    it('manages loading state during operations', async () => {
      const opportunityStore = useOpportunityStore()
      
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockApiClient.get.mockReturnValueOnce(delayedPromise)

      const fetchPromise = opportunityStore.fetchOpportunities()

      // Should be loading
      expect(opportunityStore.isLoading).toBe(true)

      // Resolve the promise
      resolvePromise!({
        data: {
          status: 'success',
          data: mockOpportunities
        }
      })

      await fetchPromise

      // Should no longer be loading
      expect(opportunityStore.isLoading).toBe(false)
    })
  })

  describe('Stage Filtering', () => {
    beforeEach(() => {
      const opportunityStore = useOpportunityStore()
      opportunityStore.opportunities = mockOpportunities
    })

    it('filters opportunities by stage correctly', () => {
      const opportunityStore = useOpportunityStore()
      
      // Test different stages
      expect(opportunityStore.getOpportunitiesByStage('proposal')).toHaveLength(1)
      expect(opportunityStore.getOpportunitiesByStage('negotiation')).toHaveLength(1)
      expect(opportunityStore.getOpportunitiesByStage('closed_won')).toHaveLength(1)
      expect(opportunityStore.getOpportunitiesByStage('closed_lost')).toHaveLength(1)
      expect(opportunityStore.getOpportunitiesByStage('qualification' as any)).toHaveLength(0)
    })

    it('identifies active vs closed opportunities', () => {
      const opportunityStore = useOpportunityStore()
      
      const activeOpps = opportunityStore.activeOpportunities
      const wonOpps = opportunityStore.wonOpportunities
      const lostOpps = opportunityStore.lostOpportunities
      
      expect(activeOpps).toHaveLength(2)
      expect(wonOpps).toHaveLength(1)
      expect(lostOpps).toHaveLength(1)
      
      // Verify no overlap
      const totalCount = activeOpps.length + wonOpps.length + lostOpps.length
      expect(totalCount).toBe(mockOpportunities.length)
    })
  })
})