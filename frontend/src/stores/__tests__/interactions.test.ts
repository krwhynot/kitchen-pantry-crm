import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInteractionStore } from '../interactions'

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
  Interaction: {}
}))

const mockInteractions = [
  {
    id: 'interaction-1',
    type: 'call',
    contactId: 'contact-1',
    organizationId: 'org-1',
    subject: 'Initial contact call',
    notes: 'Discussed product requirements',
    scheduledAt: '2023-01-01T10:00:00Z',
    completedAt: '2023-01-01T10:30:00Z',
    outcome: 'positive',
    createdAt: '2023-01-01T09:00:00Z',
    updatedAt: '2023-01-01T11:00:00Z'
  },
  {
    id: 'interaction-2',
    type: 'email',
    contactId: 'contact-2',
    organizationId: 'org-1',
    subject: 'Product information email',
    notes: 'Sent product brochure',
    scheduledAt: null,
    completedAt: '2023-01-02T14:00:00Z',
    outcome: 'neutral',
    createdAt: '2023-01-02T14:00:00Z',
    updatedAt: '2023-01-02T14:00:00Z'
  },
  {
    id: 'interaction-3',
    type: 'meeting',
    contactId: 'contact-3',
    organizationId: 'org-2',
    subject: 'Product demo meeting',
    notes: 'Scheduled for next week',
    scheduledAt: '2023-01-10T15:00:00Z',
    completedAt: null,
    outcome: null,
    createdAt: '2023-01-03T10:00:00Z',
    updatedAt: '2023-01-03T10:00:00Z'
  }
]

describe('Interaction Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with empty state', () => {
      const interactionStore = useInteractionStore()
      
      expect(interactionStore.interactions).toEqual([])
      expect(interactionStore.currentInteraction).toBeNull()
      expect(interactionStore.isLoading).toBe(false)
      expect(interactionStore.error).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      const interactionStore = useInteractionStore()
      interactionStore.interactions = mockInteractions
    })

    it('gets interaction by id', () => {
      const interactionStore = useInteractionStore()
      
      const interaction = interactionStore.getInteractionById('interaction-1')
      expect(interaction).toEqual(mockInteractions[0])
      
      const nonExistentInteraction = interactionStore.getInteractionById('non-existent')
      expect(nonExistentInteraction).toBeUndefined()
    })

    it('gets interactions by contact', () => {
      const interactionStore = useInteractionStore()
      
      const contactInteractions = interactionStore.getInteractionsByContact('contact-1')
      expect(contactInteractions).toHaveLength(1)
      expect(contactInteractions).toEqual([mockInteractions[0]])
      
      const nonExistentContactInteractions = interactionStore.getInteractionsByContact('non-existent')
      expect(nonExistentContactInteractions).toEqual([])
    })

    it('gets interactions by organization', () => {
      const interactionStore = useInteractionStore()
      
      const org1Interactions = interactionStore.getInteractionsByOrganization('org-1')
      expect(org1Interactions).toHaveLength(2)
      expect(org1Interactions).toEqual([mockInteractions[0], mockInteractions[1]])
      
      const org2Interactions = interactionStore.getInteractionsByOrganization('org-2')
      expect(org2Interactions).toHaveLength(1)
      expect(org2Interactions).toEqual([mockInteractions[2]])
    })

    it('gets interactions by type', () => {
      const interactionStore = useInteractionStore()
      
      const callInteractions = interactionStore.getInteractionsByType('call')
      expect(callInteractions).toHaveLength(1)
      expect(callInteractions).toEqual([mockInteractions[0]])
      
      const emailInteractions = interactionStore.getInteractionsByType('email')
      expect(emailInteractions).toHaveLength(1)
      expect(emailInteractions).toEqual([mockInteractions[1]])
      
      const meetingInteractions = interactionStore.getInteractionsByType('meeting')
      expect(meetingInteractions).toHaveLength(1)
      expect(meetingInteractions).toEqual([mockInteractions[2]])
    })

    it('gets scheduled interactions', () => {
      const interactionStore = useInteractionStore()
      
      const scheduledInteractions = interactionStore.scheduledInteractions
      expect(scheduledInteractions).toHaveLength(1)
      expect(scheduledInteractions).toEqual([mockInteractions[2]]) // Only the one without completedAt
    })

    it('gets completed interactions', () => {
      const interactionStore = useInteractionStore()
      
      const completedInteractions = interactionStore.completedInteractions
      expect(completedInteractions).toHaveLength(2)
      expect(completedInteractions).toEqual([mockInteractions[0], mockInteractions[1]])
    })
  })

  describe('Actions', () => {
    describe('fetchInteractions', () => {
      it('successfully fetches interactions', async () => {
        const interactionStore = useInteractionStore()
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockInteractions
          }
        })

        const result = await interactionStore.fetchInteractions()

        expect(mockApiClient.get).toHaveBeenCalledWith('/interactions', { params: undefined })
        expect(interactionStore.interactions).toEqual(mockInteractions)
        expect(interactionStore.isLoading).toBe(false)
        expect(interactionStore.error).toBeNull()
        expect(result).toEqual(mockInteractions)
      })

      it('fetches interactions with parameters', async () => {
        const interactionStore = useInteractionStore()
        const params = { 
          page: 1, 
          limit: 10, 
          contactId: 'contact-1', 
          organizationId: 'org-1',
          type: 'call' as const
        }
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockInteractions
          }
        })

        await interactionStore.fetchInteractions(params)

        expect(mockApiClient.get).toHaveBeenCalledWith('/interactions', { params })
      })

      it('handles fetch interactions error', async () => {
        const interactionStore = useInteractionStore()
        const errorMessage = 'Failed to fetch interactions'
        
        mockApiClient.get.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(interactionStore.fetchInteractions()).rejects.toThrow()
        
        expect(interactionStore.error).toBe(errorMessage)
        expect(interactionStore.isLoading).toBe(false)
        expect(interactionStore.interactions).toEqual([])
      })
    })

    describe('fetchInteractionById', () => {
      it('successfully fetches interaction by id', async () => {
        const interactionStore = useInteractionStore()
        const interactionId = 'interaction-1'
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: mockInteractions[0]
          }
        })

        const result = await interactionStore.fetchInteractionById(interactionId)

        expect(mockApiClient.get).toHaveBeenCalledWith(`/interactions/${interactionId}`)
        expect(interactionStore.currentInteraction).toEqual(mockInteractions[0])
        expect(interactionStore.isLoading).toBe(false)
        expect(interactionStore.error).toBeNull()
        expect(result).toEqual(mockInteractions[0])
      })

      it('updates existing interaction in list', async () => {
        const interactionStore = useInteractionStore()
        interactionStore.interactions = [...mockInteractions]
        
        const updatedInteraction = { ...mockInteractions[0], notes: 'Updated notes' }
        
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedInteraction
          }
        })

        await interactionStore.fetchInteractionById('interaction-1')

        expect(interactionStore.interactions[0]).toEqual(updatedInteraction)
        expect(interactionStore.currentInteraction).toEqual(updatedInteraction)
      })

      it('handles fetch interaction by id error', async () => {
        const interactionStore = useInteractionStore()
        const errorMessage = 'Interaction not found'
        
        mockApiClient.get.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(interactionStore.fetchInteractionById('non-existent')).rejects.toThrow()
        
        expect(interactionStore.error).toBe(errorMessage)
        expect(interactionStore.isLoading).toBe(false)
        expect(interactionStore.currentInteraction).toBeNull()
      })
    })

    describe('createInteraction', () => {
      it('successfully creates an interaction', async () => {
        const interactionStore = useInteractionStore()
        const newInteractionData = {
          type: 'call' as const,
          contactId: 'contact-1',
          organizationId: 'org-1',
          subject: 'Follow-up call',
          notes: 'Discussed next steps',
          scheduledAt: '2023-01-05T10:00:00Z',
          completedAt: null,
          outcome: null
        }
        
        const createdInteraction = {
          id: 'interaction-4',
          ...newInteractionData,
          createdAt: '2023-01-05T09:00:00Z',
          updatedAt: '2023-01-05T09:00:00Z'
        }
        
        mockApiClient.post.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: createdInteraction
          }
        })

        const result = await interactionStore.createInteraction(newInteractionData)

        expect(mockApiClient.post).toHaveBeenCalledWith('/interactions', newInteractionData)
        expect(interactionStore.interactions).toContain(createdInteraction)
        expect(interactionStore.isLoading).toBe(false)
        expect(interactionStore.error).toBeNull()
        expect(result).toEqual(createdInteraction)
      })

      it('handles create interaction error', async () => {
        const interactionStore = useInteractionStore()
        const errorMessage = 'Invalid interaction data'
        
        mockApiClient.post.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(interactionStore.createInteraction({
          type: 'call',
          contactId: 'contact-1',
          organizationId: 'org-1',
          subject: 'Test call',
          notes: 'Test notes',
          scheduledAt: null,
          completedAt: null,
          outcome: null
        })).rejects.toThrow()
        
        expect(interactionStore.error).toBe(errorMessage)
        expect(interactionStore.isLoading).toBe(false)
      })
    })

    describe('updateInteraction', () => {
      it('successfully updates an interaction', async () => {
        const interactionStore = useInteractionStore()
        interactionStore.interactions = [...mockInteractions]
        interactionStore.currentInteraction = mockInteractions[0]
        
        const updateData = { notes: 'Updated notes' }
        const updatedInteraction = { ...mockInteractions[0], ...updateData }
        
        mockApiClient.put.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedInteraction
          }
        })

        const result = await interactionStore.updateInteraction('interaction-1', updateData)

        expect(mockApiClient.put).toHaveBeenCalledWith('/interactions/interaction-1', updateData)
        expect(interactionStore.interactions[0]).toEqual(updatedInteraction)
        expect(interactionStore.currentInteraction).toEqual(updatedInteraction)
        expect(interactionStore.isLoading).toBe(false)
        expect(interactionStore.error).toBeNull()
        expect(result).toEqual(updatedInteraction)
      })

      it('updates only list when current interaction is different', async () => {
        const interactionStore = useInteractionStore()
        interactionStore.interactions = [...mockInteractions]
        interactionStore.currentInteraction = mockInteractions[1] // Different interaction
        
        const updateData = { notes: 'Updated notes' }
        const updatedInteraction = { ...mockInteractions[0], ...updateData }
        
        mockApiClient.put.mockResolvedValueOnce({
          data: {
            status: 'success',
            data: updatedInteraction
          }
        })

        await interactionStore.updateInteraction('interaction-1', updateData)

        expect(interactionStore.interactions[0]).toEqual(updatedInteraction)
        expect(interactionStore.currentInteraction).toEqual(mockInteractions[1]) // Unchanged
      })

      it('handles update interaction error', async () => {
        const interactionStore = useInteractionStore()
        const errorMessage = 'Interaction not found'
        
        mockApiClient.put.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(interactionStore.updateInteraction('non-existent', { notes: 'Test' })).rejects.toThrow()
        
        expect(interactionStore.error).toBe(errorMessage)
        expect(interactionStore.isLoading).toBe(false)
      })
    })

    describe('deleteInteraction', () => {
      it('successfully deletes an interaction', async () => {
        const interactionStore = useInteractionStore()
        interactionStore.interactions = [...mockInteractions]
        interactionStore.currentInteraction = mockInteractions[0]
        
        mockApiClient.delete.mockResolvedValueOnce({
          data: {
            status: 'success'
          }
        })

        const result = await interactionStore.deleteInteraction('interaction-1')

        expect(mockApiClient.delete).toHaveBeenCalledWith('/interactions/interaction-1')
        expect(interactionStore.interactions).toHaveLength(2)
        expect(interactionStore.interactions.find(i => i.id === 'interaction-1')).toBeUndefined()
        expect(interactionStore.currentInteraction).toBeNull()
        expect(interactionStore.isLoading).toBe(false)
        expect(interactionStore.error).toBeNull()
        expect(result).toBe(true)
      })

      it('deletes from list only when current interaction is different', async () => {
        const interactionStore = useInteractionStore()
        interactionStore.interactions = [...mockInteractions]
        interactionStore.currentInteraction = mockInteractions[1] // Different interaction
        
        mockApiClient.delete.mockResolvedValueOnce({
          data: {
            status: 'success'
          }
        })

        await interactionStore.deleteInteraction('interaction-1')

        expect(interactionStore.interactions).toHaveLength(2)
        expect(interactionStore.interactions.find(i => i.id === 'interaction-1')).toBeUndefined()
        expect(interactionStore.currentInteraction).toEqual(mockInteractions[1]) // Unchanged
      })

      it('handles delete interaction error', async () => {
        const interactionStore = useInteractionStore()
        const errorMessage = 'Interaction not found'
        
        mockApiClient.delete.mockRejectedValueOnce({
          response: {
            data: {
              message: errorMessage
            }
          }
        })

        await expect(interactionStore.deleteInteraction('non-existent')).rejects.toThrow()
        
        expect(interactionStore.error).toBe(errorMessage)
        expect(interactionStore.isLoading).toBe(false)
      })
    })

    describe('clearError', () => {
      it('clears error state', () => {
        const interactionStore = useInteractionStore()
        interactionStore.error = 'Some error'

        interactionStore.clearError()

        expect(interactionStore.error).toBeNull()
      })
    })

    describe('clearCurrentInteraction', () => {
      it('clears current interaction', () => {
        const interactionStore = useInteractionStore()
        interactionStore.currentInteraction = mockInteractions[0]

        interactionStore.clearCurrentInteraction()

        expect(interactionStore.currentInteraction).toBeNull()
      })
    })
  })

  describe('Data Filtering and Queries', () => {
    beforeEach(() => {
      const interactionStore = useInteractionStore()
      interactionStore.interactions = mockInteractions
    })

    it('filters interactions by multiple criteria', () => {
      const interactionStore = useInteractionStore()
      
      // Test filtering by type and organization
      const callsInOrg1 = interactionStore.interactions.filter(i => 
        i.type === 'call' && i.organizationId === 'org-1'
      )
      expect(callsInOrg1).toHaveLength(1)
      expect(callsInOrg1[0]).toEqual(mockInteractions[0])
      
      // Test filtering by completion status
      const completedInOrg1 = interactionStore.interactions.filter(i => 
        i.completedAt && i.organizationId === 'org-1'
      )
      expect(completedInOrg1).toHaveLength(2)
    })

    it('handles empty filter results', () => {
      const interactionStore = useInteractionStore()
      
      const nonExistentType = interactionStore.getInteractionsByType('non-existent-type' as any)
      expect(nonExistentType).toEqual([])
      
      const nonExistentContact = interactionStore.getInteractionsByContact('non-existent-contact')
      expect(nonExistentContact).toEqual([])
    })
  })

  describe('Error Handling', () => {
    it('handles API errors without response data', async () => {
      const interactionStore = useInteractionStore()
      
      mockApiClient.get.mockRejectedValueOnce({
        message: 'Network error'
      })

      await expect(interactionStore.fetchInteractions()).rejects.toThrow()
      
      expect(interactionStore.error).toBe('Network error')
    })

    it('uses default error messages', async () => {
      const interactionStore = useInteractionStore()
      
      mockApiClient.get.mockRejectedValueOnce({})

      await expect(interactionStore.fetchInteractions()).rejects.toThrow()
      
      expect(interactionStore.error).toBe('Failed to fetch interactions')
    })
  })

  describe('Loading States', () => {
    it('manages loading state during operations', async () => {
      const interactionStore = useInteractionStore()
      
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      mockApiClient.get.mockReturnValueOnce(delayedPromise)

      const fetchPromise = interactionStore.fetchInteractions()

      // Should be loading
      expect(interactionStore.isLoading).toBe(true)

      // Resolve the promise
      resolvePromise!({
        data: {
          status: 'success',
          data: mockInteractions
        }
      })

      await fetchPromise

      // Should no longer be loading
      expect(interactionStore.isLoading).toBe(false)
    })
  })
})