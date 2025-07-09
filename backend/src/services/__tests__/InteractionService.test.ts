import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { InteractionService } from '../InteractionService'
import { InteractionModel } from '../../models/Interaction'
import { ContactModel } from '../../models/Contact'
import { OrganizationModel } from '../../models/Organization'
import { Interaction } from '@shared/types'

// Mock the models
jest.mock('../../models/Interaction')
jest.mock('../../models/Contact')
jest.mock('../../models/Organization')

describe('InteractionService', () => {
  let interactionService: InteractionService
  let mockInteractionModel: jest.Mocked<typeof InteractionModel>
  let mockContactModel: jest.Mocked<typeof ContactModel>
  let mockOrganizationModel: jest.Mocked<typeof OrganizationModel>

  const mockInteraction: Interaction = {
    id: '1',
    type: 'email',
    subject: 'Test Email',
    description: 'Test interaction description',
    contactId: 'contact1',
    organizationId: 'org1',
    userId: 'user1',
    scheduledAt: '2024-12-31T10:00:00Z',
    duration: 60,
    location: 'Online',
    outcome: 'positive',
    nextSteps: 'Follow up next week',
    priority: 'medium',
    tags: ['follow-up', 'important'],
    isCompleted: false,
    cancelled: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user1',
    isActive: true
  }

  const mockContact = {
    id: 'contact1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    organizationId: 'org1',
    isActive: true
  }

  const mockOrganization = {
    id: 'org1',
    name: 'Test Organization',
    type: 'restaurant',
    isActive: true
  }

  beforeEach(() => {
    mockInteractionModel = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findByContact: jest.fn(),
      findByOrganization: jest.fn(),
      findByUser: jest.fn(),
      findUpcoming: jest.fn(),
      findOverdue: jest.fn(),
      search: jest.fn(),
      getAnalytics: jest.fn(),
      validateSchema: jest.fn()
    } as any

    mockContactModel = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn()
    } as any

    mockOrganizationModel = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn()
    } as any

    // Reset the mocks before each test
    jest.mocked(InteractionModel).mockImplementation(() => mockInteractionModel as any)
    jest.mocked(ContactModel).mockImplementation(() => mockContactModel as any)
    jest.mocked(OrganizationModel).mockImplementation(() => mockOrganizationModel as any)
    
    // Mock static methods
    Object.assign(InteractionModel, mockInteractionModel)
    Object.assign(ContactModel, mockContactModel)
    Object.assign(OrganizationModel, mockOrganizationModel)
    
    interactionService = new InteractionService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createInteraction', () => {
    const createData = {
      type: 'email' as const,
      subject: 'New Email',
      description: 'Email description',
      contactId: 'contact1',
      organizationId: 'org1',
      scheduledAt: '2024-12-31T10:00:00Z',
      duration: 30,
      location: 'Conference Room',
      outcome: 'positive',
      nextSteps: 'Follow up',
      priority: 'high' as const,
      tags: ['important']
    }

    it('should create interaction successfully', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockInteractionModel.create.mockResolvedValue(mockInteraction)

      const result = await interactionService.createInteraction(createData, 'user1')

      expect(mockContactModel.findById).toHaveBeenCalledWith('contact1')
      expect(mockOrganizationModel.findById).toHaveBeenCalledWith('org1')
      expect(mockInteractionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          userId: 'user1',
          createdBy: 'user1',
          updatedBy: 'user1',
          isCompleted: false,
          cancelled: false
        })
      )
      expect(result).toEqual(mockInteraction)
    })

    it('should throw error if contact not found', async () => {
      mockContactModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.createInteraction(createData, 'user1')
      ).rejects.toThrow('Failed to create interaction: Contact not found')
    })

    it('should throw error if organization not found', async () => {
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.createInteraction(createData, 'user1')
      ).rejects.toThrow('Failed to create interaction: Organization not found')
    })

    it('should use contact organization if not specified', async () => {
      const dataWithoutOrg = { ...createData }
      delete dataWithoutOrg.organizationId
      
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockInteractionModel.create.mockResolvedValue(mockInteraction)

      await interactionService.createInteraction(dataWithoutOrg, 'user1')

      expect(mockOrganizationModel.findById).toHaveBeenCalledWith('org1')
      expect(mockInteractionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org1'
        })
      )
    })

    it('should throw error if scheduled time is in the past', async () => {
      const pastTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      await expect(
        interactionService.createInteraction({
          ...createData,
          scheduledAt: pastTime
        }, 'user1')
      ).rejects.toThrow('Failed to create interaction: Scheduled time must be in the future')
    })

    it('should create interaction without contact', async () => {
      const dataWithoutContact = { ...createData }
      delete dataWithoutContact.contactId
      
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockInteractionModel.create.mockResolvedValue(mockInteraction)

      const result = await interactionService.createInteraction(dataWithoutContact, 'user1')

      expect(mockContactModel.findById).not.toHaveBeenCalled()
      expect(result).toEqual(mockInteraction)
    })

    it('should create interaction without organization', async () => {
      const dataWithoutOrg = { ...createData }
      delete dataWithoutOrg.organizationId
      delete dataWithoutOrg.contactId
      
      mockInteractionModel.create.mockResolvedValue(mockInteraction)

      const result = await interactionService.createInteraction(dataWithoutOrg, 'user1')

      expect(mockContactModel.findById).not.toHaveBeenCalled()
      expect(mockOrganizationModel.findById).not.toHaveBeenCalled()
      expect(result).toEqual(mockInteraction)
    })
  })

  describe('updateInteraction', () => {
    const updateData = {
      subject: 'Updated Subject',
      description: 'Updated description',
      outcome: 'negative',
      nextSteps: 'New next steps',
      priority: 'low' as const
    }

    it('should update interaction successfully', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockInteractionModel.update.mockResolvedValue({
        ...mockInteraction,
        ...updateData
      })

      const result = await interactionService.updateInteraction('1', updateData, 'user1')

      expect(mockInteractionModel.findById).toHaveBeenCalledWith('1')
      expect(mockInteractionModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          ...updateData,
          updatedBy: 'user1',
          updatedAt: expect.any(String)
        })
      )
      expect(result).toEqual(expect.objectContaining(updateData))
    })

    it('should throw error if interaction not found', async () => {
      mockInteractionModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.updateInteraction('999', updateData, 'user1')
      ).rejects.toThrow('Failed to update interaction: Interaction not found')
    })

    it('should validate contact when changing', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockContactModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.updateInteraction('1', { contactId: 'new-contact' }, 'user1')
      ).rejects.toThrow('Failed to update interaction: Contact not found')
    })

    it('should validate organization when changing', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockOrganizationModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.updateInteraction('1', { organizationId: 'new-org' }, 'user1')
      ).rejects.toThrow('Failed to update interaction: Organization not found')
    })

    it('should auto-complete when setting completedAt', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockInteractionModel.update.mockResolvedValue({
        ...mockInteraction,
        completedAt: '2023-01-02T00:00:00Z',
        isCompleted: true
      })

      const result = await interactionService.updateInteraction('1', {
        completedAt: '2023-01-02T00:00:00Z'
      }, 'user1')

      expect(mockInteractionModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          completedAt: '2023-01-02T00:00:00Z',
          isCompleted: true
        })
      )
    })

    it('should not change completion status if already completed', async () => {
      const completedInteraction = {
        ...mockInteraction,
        isCompleted: true,
        completedAt: '2023-01-01T12:00:00Z'
      }
      mockInteractionModel.findById.mockResolvedValue(completedInteraction)
      mockInteractionModel.update.mockResolvedValue(completedInteraction)

      await interactionService.updateInteraction('1', {
        completedAt: '2023-01-02T00:00:00Z'
      }, 'user1')

      expect(mockInteractionModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          completedAt: '2023-01-02T00:00:00Z'
        })
      )
      expect(mockInteractionModel.update).not.toHaveBeenCalledWith('1', 
        expect.objectContaining({
          isCompleted: true
        })
      )
    })
  })

  describe('deleteInteraction', () => {
    it('should soft delete interaction successfully', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockInteractionModel.update.mockResolvedValue({} as any)

      await interactionService.deleteInteraction('1', 'user1')

      expect(mockInteractionModel.findById).toHaveBeenCalledWith('1')
      expect(mockInteractionModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(String),
          deletedBy: 'user1'
        })
      )
    })

    it('should throw error if interaction not found', async () => {
      mockInteractionModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.deleteInteraction('999', 'user1')
      ).rejects.toThrow('Failed to delete interaction: Interaction not found')
    })
  })

  describe('getInteractionById', () => {
    it('should return interaction with related data', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.getInteractionById('1')

      expect(mockInteractionModel.findById).toHaveBeenCalledWith('1')
      expect(mockContactModel.findById).toHaveBeenCalledWith('contact1')
      expect(mockOrganizationModel.findById).toHaveBeenCalledWith('org1')
      expect(result).toEqual(expect.objectContaining({
        ...mockInteraction,
        contact: mockContact,
        organization: mockOrganization
      }))
    })

    it('should return null if interaction not found', async () => {
      mockInteractionModel.findById.mockResolvedValue(null)

      const result = await interactionService.getInteractionById('999')

      expect(result).toBeNull()
    })

    it('should handle interaction without contact', async () => {
      const interactionWithoutContact = { ...mockInteraction, contactId: null }
      mockInteractionModel.findById.mockResolvedValue(interactionWithoutContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.getInteractionById('1')

      expect(mockContactModel.findById).not.toHaveBeenCalled()
      expect(result).toEqual(expect.objectContaining({
        ...interactionWithoutContact,
        contact: null,
        organization: mockOrganization
      }))
    })

    it('should handle interaction without organization', async () => {
      const interactionWithoutOrg = { ...mockInteraction, organizationId: null }
      mockInteractionModel.findById.mockResolvedValue(interactionWithoutOrg)
      mockContactModel.findById.mockResolvedValue(mockContact)

      const result = await interactionService.getInteractionById('1')

      expect(mockOrganizationModel.findById).not.toHaveBeenCalled()
      expect(result).toEqual(expect.objectContaining({
        ...interactionWithoutOrg,
        contact: mockContact,
        organization: null
      }))
    })
  })

  describe('searchInteractions', () => {
    it('should search interactions with filters', async () => {
      const searchResults = [mockInteraction]
      mockInteractionModel.findAll.mockResolvedValue(searchResults)
      mockInteractionModel.search.mockResolvedValue({ data: searchResults, total: 1 })
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.searchInteractions({
        query: 'test',
        type: 'email',
        contactId: 'contact1',
        organizationId: 'org1',
        outcome: 'positive',
        limit: 10,
        offset: 0
      })

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            ...mockInteraction,
            contact: mockContact,
            organization: mockOrganization
          })
        ]),
        total: 1,
        page: 1,
        limit: 10
      })
    })

    it('should apply date range filters', async () => {
      mockInteractionModel.findAll.mockResolvedValue([])
      mockInteractionModel.search.mockResolvedValue({ data: [], total: 0 })

      await interactionService.searchInteractions({
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      })

      expect(mockInteractionModel.findAll).toHaveBeenCalledWith({
        filters: expect.objectContaining({
          'createdAt__gte': '2023-01-01',
          'createdAt__lte': '2023-12-31'
        }),
        limit: 20,
        offset: 0,
        orderBy: { column: 'scheduledAt', ascending: false }
      })
    })

    it('should handle text search', async () => {
      mockInteractionModel.findAll.mockResolvedValue([])
      mockInteractionModel.search.mockResolvedValue({ data: [], total: 0 })

      await interactionService.searchInteractions({
        query: 'test search'
      })

      expect(mockInteractionModel.search).toHaveBeenCalledWith(
        'test search',
        expect.any(Object)
      )
    })
  })

  describe('getInteractionsByContact', () => {
    it('should return interactions for contact', async () => {
      mockInteractionModel.findByContact.mockResolvedValue([mockInteraction])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.getInteractionsByContact('contact1')

      expect(mockInteractionModel.findByContact).toHaveBeenCalledWith('contact1')
      expect(result).toEqual([
        expect.objectContaining({
          ...mockInteraction,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })
  })

  describe('getInteractionsByOrganization', () => {
    it('should return interactions for organization', async () => {
      mockInteractionModel.findByOrganization.mockResolvedValue([mockInteraction])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.getInteractionsByOrganization('org1')

      expect(mockInteractionModel.findByOrganization).toHaveBeenCalledWith('org1')
      expect(result).toEqual([
        expect.objectContaining({
          ...mockInteraction,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })
  })

  describe('getUpcomingInteractions', () => {
    it('should return upcoming interactions for user', async () => {
      mockInteractionModel.findUpcoming.mockResolvedValue([mockInteraction])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.getUpcomingInteractions('user1')

      expect(mockInteractionModel.findUpcoming).toHaveBeenCalledWith('user1')
      expect(result).toEqual([
        expect.objectContaining({
          ...mockInteraction,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })

    it('should return upcoming interactions for all users', async () => {
      mockInteractionModel.findUpcoming.mockResolvedValue([mockInteraction])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.getUpcomingInteractions()

      expect(mockInteractionModel.findUpcoming).toHaveBeenCalledWith(undefined)
      expect(result).toEqual([
        expect.objectContaining({
          ...mockInteraction,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })
  })

  describe('getOverdueInteractions', () => {
    it('should return overdue interactions for user', async () => {
      mockInteractionModel.findOverdue.mockResolvedValue([mockInteraction])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await interactionService.getOverdueInteractions('user1')

      expect(mockInteractionModel.findOverdue).toHaveBeenCalledWith('user1')
      expect(result).toEqual([
        expect.objectContaining({
          ...mockInteraction,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })
  })

  describe('completeInteraction', () => {
    it('should mark interaction as completed', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockInteractionModel.update.mockResolvedValue({
        ...mockInteraction,
        isCompleted: true,
        completedAt: '2023-01-02T00:00:00Z',
        outcome: 'positive'
      })

      const result = await interactionService.completeInteraction('1', 'positive', 'user1')

      expect(mockInteractionModel.findById).toHaveBeenCalledWith('1')
      expect(mockInteractionModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          isCompleted: true,
          completedAt: expect.any(String),
          outcome: 'positive',
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual(expect.objectContaining({
        isCompleted: true,
        outcome: 'positive'
      }))
    })

    it('should throw error if interaction not found', async () => {
      mockInteractionModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.completeInteraction('999', 'positive', 'user1')
      ).rejects.toThrow('Failed to complete interaction: Interaction not found')
    })

    it('should throw error if interaction already completed', async () => {
      const completedInteraction = {
        ...mockInteraction,
        isCompleted: true,
        completedAt: '2023-01-01T12:00:00Z'
      }
      mockInteractionModel.findById.mockResolvedValue(completedInteraction)

      await expect(
        interactionService.completeInteraction('1', 'positive', 'user1')
      ).rejects.toThrow('Failed to complete interaction: Interaction is already completed')
    })
  })

  describe('cancelInteraction', () => {
    it('should cancel interaction', async () => {
      mockInteractionModel.findById.mockResolvedValue(mockInteraction)
      mockInteractionModel.update.mockResolvedValue({
        ...mockInteraction,
        cancelled: true,
        cancelReason: 'Client unavailable'
      })

      const result = await interactionService.cancelInteraction('1', 'Client unavailable', 'user1')

      expect(mockInteractionModel.findById).toHaveBeenCalledWith('1')
      expect(mockInteractionModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          cancelled: true,
          cancelReason: 'Client unavailable',
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual(expect.objectContaining({
        cancelled: true,
        cancelReason: 'Client unavailable'
      }))
    })

    it('should throw error if interaction not found', async () => {
      mockInteractionModel.findById.mockResolvedValue(null)

      await expect(
        interactionService.cancelInteraction('999', 'No reason', 'user1')
      ).rejects.toThrow('Failed to cancel interaction: Interaction not found')
    })
  })

  describe('getInteractionAnalytics', () => {
    it('should return interaction analytics', async () => {
      const interactions = [
        { ...mockInteraction, type: 'email', isCompleted: true, outcome: 'positive' },
        { ...mockInteraction, id: '2', type: 'phone', isCompleted: false, outcome: null },
        { ...mockInteraction, id: '3', type: 'email', isCompleted: true, outcome: 'negative' }
      ]
      
      mockInteractionModel.findAll.mockResolvedValue(interactions)

      const result = await interactionService.getInteractionAnalytics()

      expect(mockInteractionModel.findAll).toHaveBeenCalledWith({
        filters: {},
        limit: 10000
      })
      expect(result).toEqual(expect.objectContaining({
        totalInteractions: 3,
        completedInteractions: 2,
        pendingInteractions: 1,
        cancelledInteractions: 0,
        byType: expect.objectContaining({
          email: 2,
          phone: 1
        }),
        byOutcome: expect.objectContaining({
          positive: 1,
          negative: 1
        }),
        completionRate: expect.any(Number)
      }))
    })

    it('should apply date range filters', async () => {
      mockInteractionModel.findAll.mockResolvedValue([])

      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31')
      }

      await interactionService.getInteractionAnalytics(dateRange)

      expect(mockInteractionModel.findAll).toHaveBeenCalledWith({
        filters: {
          'createdAt__gte': '2023-01-01T00:00:00.000Z',
          'createdAt__lte': '2023-12-31T00:00:00.000Z'
        },
        limit: 10000
      })
    })
  })

  describe('validateInteractionData', () => {
    it('should return data as-is (placeholder implementation)', async () => {
      const testData = { type: 'email', subject: 'Test' }
      const result = await interactionService.validateInteractionData(testData)

      expect(result).toEqual(testData)
    })
  })
})