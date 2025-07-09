import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { OpportunityService } from '../OpportunityService'
import { OpportunityModel } from '../../models/Opportunity'
import { ContactModel } from '../../models/Contact'
import { OrganizationModel } from '../../models/Organization'
import { Opportunity } from '@shared/types'

// Mock the models
jest.mock('../../models/Opportunity')
jest.mock('../../models/Contact')
jest.mock('../../models/Organization')

describe('OpportunityService', () => {
  let opportunityService: OpportunityService
  let mockOpportunityModel: jest.Mocked<typeof OpportunityModel>
  let mockContactModel: jest.Mocked<typeof ContactModel>
  let mockOrganizationModel: jest.Mocked<typeof OrganizationModel>

  const mockOpportunity: Opportunity = {
    id: '1',
    name: 'Test Opportunity',
    description: 'A test opportunity',
    value: 50000,
    stage: 'prospecting',
    probability: 25,
    expectedCloseDate: '2024-12-31T23:59:59Z',
    contactId: 'contact1',
    organizationId: 'org1',
    userId: 'user1',
    priority: 'high',
    source: 'website',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user1',
    stageHistory: [{
      stage: 'prospecting',
      date: '2023-01-01T00:00:00Z',
      userId: 'user1',
      notes: 'Opportunity created'
    }]
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
    mockOpportunityModel = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findByStage: jest.fn(),
      findByUser: jest.fn(),
      findClosingThisMonth: jest.fn(),
      count: jest.fn(),
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
    jest.mocked(OpportunityModel).mockImplementation(() => mockOpportunityModel as any)
    jest.mocked(ContactModel).mockImplementation(() => mockContactModel as any)
    jest.mocked(OrganizationModel).mockImplementation(() => mockOrganizationModel as any)
    
    // Mock static methods
    Object.assign(OpportunityModel, mockOpportunityModel)
    Object.assign(ContactModel, mockContactModel)
    Object.assign(OrganizationModel, mockOrganizationModel)
    
    opportunityService = new OpportunityService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createOpportunity', () => {
    const createData = {
      name: 'New Opportunity',
      description: 'A new opportunity',
      value: 75000,
      stage: 'prospecting' as const,
      probability: 25,
      expectedCloseDate: '2024-12-31T23:59:59Z',
      contactId: 'contact1',
      organizationId: 'org1',
      priority: 'high' as const,
      source: 'referral'
    }

    it('should create opportunity successfully', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOpportunityModel.create.mockResolvedValue(mockOpportunity)

      const result = await opportunityService.createOpportunity(createData, 'user1')

      expect(mockOrganizationModel.findById).toHaveBeenCalledWith('org1')
      expect(mockContactModel.findById).toHaveBeenCalledWith('contact1')
      expect(mockOpportunityModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          userId: 'user1',
          isActive: true,
          createdBy: 'user1',
          updatedBy: 'user1',
          stageHistory: expect.arrayContaining([
            expect.objectContaining({
              stage: 'prospecting',
              userId: 'user1',
              notes: 'Opportunity created'
            })
          ])
        })
      )
      expect(result).toEqual(mockOpportunity)
    })

    it('should throw error if organization not found', async () => {
      mockOrganizationModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.createOpportunity(createData, 'user1')
      ).rejects.toThrow('Failed to create opportunity: Organization not found')
    })

    it('should throw error if contact not found', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.createOpportunity(createData, 'user1')
      ).rejects.toThrow('Failed to create opportunity: Contact not found')
    })

    it('should throw error if contact does not belong to organization', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findById.mockResolvedValue({
        ...mockContact,
        organizationId: 'different-org'
      })

      await expect(
        opportunityService.createOpportunity(createData, 'user1')
      ).rejects.toThrow('Failed to create opportunity: Contact does not belong to the specified organization')
    })

    it('should throw error if expected close date is in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findById.mockResolvedValue(mockContact)

      await expect(
        opportunityService.createOpportunity({
          ...createData,
          expectedCloseDate: pastDate
        }, 'user1')
      ).rejects.toThrow('Failed to create opportunity: Expected close date must be in the future')
    })

    it('should throw error if probability is out of range', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findById.mockResolvedValue(mockContact)

      await expect(
        opportunityService.createOpportunity({
          ...createData,
          probability: 150
        }, 'user1')
      ).rejects.toThrow('Failed to create opportunity: Probability must be between 0 and 100')
    })

    it('should throw error if value is not positive', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findById.mockResolvedValue(mockContact)

      await expect(
        opportunityService.createOpportunity({
          ...createData,
          value: -100
        }, 'user1')
      ).rejects.toThrow('Failed to create opportunity: Opportunity value must be positive')
    })

    it('should create opportunity without contact', async () => {
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockOpportunityModel.create.mockResolvedValue(mockOpportunity)

      const dataWithoutContact = { ...createData }
      delete dataWithoutContact.contactId

      const result = await opportunityService.createOpportunity(dataWithoutContact, 'user1')

      expect(mockContactModel.findById).not.toHaveBeenCalled()
      expect(result).toEqual(mockOpportunity)
    })
  })

  describe('updateOpportunity', () => {
    const updateData = {
      name: 'Updated Opportunity',
      description: 'Updated description',
      value: 100000,
      stage: 'qualification' as const,
      probability: 50
    }

    it('should update opportunity successfully', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockOpportunityModel.update.mockResolvedValue({
        ...mockOpportunity,
        ...updateData
      })

      const result = await opportunityService.updateOpportunity('1', updateData, 'user1')

      expect(mockOpportunityModel.findById).toHaveBeenCalledWith('1')
      expect(mockOpportunityModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          ...updateData,
          updatedBy: 'user1',
          updatedAt: expect.any(String)
        })
      )
      expect(result).toEqual(expect.objectContaining(updateData))
    })

    it('should throw error if opportunity not found', async () => {
      mockOpportunityModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.updateOpportunity('999', updateData, 'user1')
      ).rejects.toThrow('Failed to update opportunity: Opportunity not found')
    })

    it('should validate organization when changing', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockOrganizationModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.updateOpportunity('1', { organizationId: 'new-org' }, 'user1')
      ).rejects.toThrow('Failed to update opportunity: Organization not found')
    })

    it('should validate contact when changing', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockContactModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.updateOpportunity('1', { contactId: 'new-contact' }, 'user1')
      ).rejects.toThrow('Failed to update opportunity: Contact not found')
    })

    it('should validate probability range', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)

      await expect(
        opportunityService.updateOpportunity('1', { probability: 150 }, 'user1')
      ).rejects.toThrow('Failed to update opportunity: Probability must be between 0 and 100')
    })

    it('should validate positive value', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)

      await expect(
        opportunityService.updateOpportunity('1', { value: -100 }, 'user1')
      ).rejects.toThrow('Failed to update opportunity: Opportunity value must be positive')
    })
  })

  describe('deleteOpportunity', () => {
    it('should soft delete opportunity successfully', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockOpportunityModel.update.mockResolvedValue({} as any)

      await opportunityService.deleteOpportunity('1', 'user1')

      expect(mockOpportunityModel.findById).toHaveBeenCalledWith('1')
      expect(mockOpportunityModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(String),
          deletedBy: 'user1'
        })
      )
    })

    it('should throw error if opportunity not found', async () => {
      mockOpportunityModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.deleteOpportunity('999', 'user1')
      ).rejects.toThrow('Failed to delete opportunity: Opportunity not found')
    })
  })

  describe('getOpportunityById', () => {
    it('should return opportunity with related data', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunityById('1')

      expect(mockOpportunityModel.findById).toHaveBeenCalledWith('1')
      expect(mockContactModel.findById).toHaveBeenCalledWith('contact1')
      expect(mockOrganizationModel.findById).toHaveBeenCalledWith('org1')
      expect(result).toEqual(expect.objectContaining({
        ...mockOpportunity,
        contact: mockContact,
        organization: mockOrganization
      }))
    })

    it('should return null if opportunity not found', async () => {
      mockOpportunityModel.findById.mockResolvedValue(null)

      const result = await opportunityService.getOpportunityById('999')

      expect(result).toBeNull()
    })

    it('should handle opportunity without contact', async () => {
      const opportunityWithoutContact = { ...mockOpportunity, contactId: null }
      mockOpportunityModel.findById.mockResolvedValue(opportunityWithoutContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunityById('1')

      expect(mockContactModel.findById).not.toHaveBeenCalled()
      expect(result).toEqual(expect.objectContaining({
        ...opportunityWithoutContact,
        contact: null,
        organization: mockOrganization
      }))
    })
  })

  describe('searchOpportunities', () => {
    it('should search opportunities with filters', async () => {
      const searchResults = [mockOpportunity]
      mockOpportunityModel.findAll.mockResolvedValue(searchResults)
      mockOpportunityModel.count.mockResolvedValue(1)
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.searchOpportunities({
        query: 'test',
        stage: 'prospecting',
        minValue: 10000,
        maxValue: 100000,
        limit: 10,
        offset: 0
      })

      expect(mockOpportunityModel.findAll).toHaveBeenCalledWith({
        filters: expect.objectContaining({
          stage: 'prospecting',
          'value__gte': 10000,
          'value__lte': 100000
        }),
        limit: 10,
        offset: 0,
        orderBy: { column: 'expectedCloseDate', ascending: true }
      })
      expect(mockOpportunityModel.count).toHaveBeenCalled()
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            ...mockOpportunity,
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
      mockOpportunityModel.findAll.mockResolvedValue([])
      mockOpportunityModel.count.mockResolvedValue(0)

      await opportunityService.searchOpportunities({
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      })

      expect(mockOpportunityModel.findAll).toHaveBeenCalledWith({
        filters: expect.objectContaining({
          'createdAt__gte': '2023-01-01',
          'createdAt__lte': '2023-12-31'
        }),
        limit: 20,
        offset: 0,
        orderBy: { column: 'expectedCloseDate', ascending: true }
      })
    })
  })

  describe('getOpportunitiesByStage', () => {
    it('should return opportunities by stage', async () => {
      mockOpportunityModel.findByStage.mockResolvedValue([mockOpportunity])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunitiesByStage('prospecting')

      expect(mockOpportunityModel.findByStage).toHaveBeenCalledWith('prospecting')
      expect(result).toEqual([
        expect.objectContaining({
          ...mockOpportunity,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })
  })

  describe('getOpportunitiesByUser', () => {
    it('should return opportunities by user', async () => {
      mockOpportunityModel.findByUser.mockResolvedValue([mockOpportunity])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunitiesByUser('user1')

      expect(mockOpportunityModel.findByUser).toHaveBeenCalledWith('user1')
      expect(result).toEqual([
        expect.objectContaining({
          ...mockOpportunity,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })
  })

  describe('getOpportunitiesClosingThisMonth', () => {
    it('should return opportunities closing this month', async () => {
      mockOpportunityModel.findClosingThisMonth.mockResolvedValue([mockOpportunity])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunitiesClosingThisMonth('user1')

      expect(mockOpportunityModel.findClosingThisMonth).toHaveBeenCalledWith('user1')
      expect(result).toEqual([
        expect.objectContaining({
          ...mockOpportunity,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })

    it('should return opportunities closing this month without user filter', async () => {
      mockOpportunityModel.findClosingThisMonth.mockResolvedValue([mockOpportunity])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunitiesClosingThisMonth()

      expect(mockOpportunityModel.findClosingThisMonth).toHaveBeenCalledWith(undefined)
      expect(result).toEqual([
        expect.objectContaining({
          ...mockOpportunity,
          contact: mockContact,
          organization: mockOrganization
        })
      ])
    })
  })

  describe('transitionStage', () => {
    it('should transition stage successfully', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockOpportunityModel.update.mockResolvedValue({
        ...mockOpportunity,
        stage: 'qualification',
        probability: 25
      })

      const result = await opportunityService.transitionStage('1', 'qualification', 'user1', 'Moving forward')

      expect(mockOpportunityModel.findById).toHaveBeenCalledWith('1')
      expect(mockOpportunityModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          stage: 'qualification',
          probability: 25,
          stageHistory: expect.arrayContaining([
            expect.objectContaining({
              fromStage: 'prospecting',
              toStage: 'qualification',
              reason: 'Moving forward',
              userId: 'user1'
            })
          ]),
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual(expect.objectContaining({
        stage: 'qualification',
        probability: 25
      }))
    })

    it('should set probability based on stage', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockOpportunityModel.update.mockResolvedValue({
        ...mockOpportunity,
        stage: 'closed_won',
        probability: 100
      })

      await opportunityService.transitionStage('1', 'closed_won', 'user1', 'Deal closed')

      expect(mockOpportunityModel.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          stage: 'closed_won',
          probability: 100,
          actualCloseDate: expect.any(String),
          closeReason: 'Deal closed'
        })
      )
    })

    it('should throw error if opportunity not found', async () => {
      mockOpportunityModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.transitionStage('999', 'qualification', 'user1')
      ).rejects.toThrow('Failed to transition opportunity stage: Opportunity not found')
    })
  })

  describe('getOpportunityAnalytics', () => {
    it('should return analytics for all opportunities', async () => {
      const opportunities = [
        { ...mockOpportunity, stage: 'prospecting', value: 10000, userId: 'user1' },
        { ...mockOpportunity, id: '2', stage: 'closed_won', value: 20000, userId: 'user1' },
        { ...mockOpportunity, id: '3', stage: 'closed_lost', value: 15000, userId: 'user2' }
      ]
      
      mockOpportunityModel.findAll.mockResolvedValue(opportunities)

      const result = await opportunityService.getOpportunityAnalytics()

      expect(mockOpportunityModel.findAll).toHaveBeenCalledWith({
        filters: {},
        limit: 10000
      })
      expect(result).toEqual(expect.objectContaining({
        totalOpportunities: 3,
        totalValue: 45000,
        avgValue: 15000,
        conversionRate: expect.any(Number),
        byStage: expect.objectContaining({
          prospecting: { count: 1, value: 10000 },
          closed_won: { count: 1, value: 20000 },
          closed_lost: { count: 1, value: 15000 }
        }),
        byUser: expect.objectContaining({
          user1: expect.objectContaining({
            count: 2,
            value: 30000,
            winRate: 50
          }),
          user2: expect.objectContaining({
            count: 1,
            value: 15000,
            winRate: 0
          })
        })
      }))
    })

    it('should apply date range filters', async () => {
      mockOpportunityModel.findAll.mockResolvedValue([])

      const dateRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-12-31')
      }

      await opportunityService.getOpportunityAnalytics(dateRange)

      expect(mockOpportunityModel.findAll).toHaveBeenCalledWith({
        filters: {
          'createdAt__gte': '2023-01-01T00:00:00.000Z',
          'createdAt__lte': '2023-12-31T00:00:00.000Z'
        },
        limit: 10000
      })
    })
  })

  describe('getOpportunityForecast', () => {
    it('should return forecast for current month', async () => {
      const opportunities = [
        { ...mockOpportunity, value: 10000, probability: 75 },
        { ...mockOpportunity, id: '2', value: 20000, probability: 25 },
        { ...mockOpportunity, id: '3', value: 15000, probability: 50 }
      ]
      
      mockOpportunityModel.findAll.mockResolvedValue(opportunities)
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunityForecast('month')

      expect(result).toEqual(expect.objectContaining({
        period: 'month',
        totalPipeline: 45000,
        weightedPipeline: 16250, // (10000*0.75) + (20000*0.25) + (15000*0.50)
        bestCase: 10000, // Only opportunities with 75%+ probability
        worstCase: 20000, // Only opportunities with 25%- probability
        mostLikely: 16250,
        closingThisPeriod: expect.any(Array),
        atRiskOpportunities: expect.any(Array)
      }))
    })

    it('should return forecast for quarter', async () => {
      mockOpportunityModel.findAll.mockResolvedValue([])
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)

      const result = await opportunityService.getOpportunityForecast('quarter')

      expect(result.period).toBe('quarter')
      expect(mockOpportunityModel.findAll).toHaveBeenCalledWith({
        filters: expect.objectContaining({
          'expectedCloseDate__gte': expect.any(String),
          'expectedCloseDate__lte': expect.any(String),
          isActive: true
        }),
        limit: 10000
      })
    })
  })

  describe('bulkUpdateOpportunities', () => {
    it('should update multiple opportunities', async () => {
      const opportunityIds = ['1', '2', '3']
      const updates = { priority: 'high' as const }
      
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockOpportunityModel.update.mockResolvedValue({
        ...mockOpportunity,
        ...updates
      })

      const result = await opportunityService.bulkUpdateOpportunities(opportunityIds, updates, 'user1')

      expect(result).toHaveLength(3)
      expect(mockOpportunityModel.findById).toHaveBeenCalledTimes(3)
      expect(mockOpportunityModel.update).toHaveBeenCalledTimes(3)
    })
  })

  describe('cloneOpportunity', () => {
    it('should clone opportunity successfully', async () => {
      mockOpportunityModel.findById.mockResolvedValue(mockOpportunity)
      mockOrganizationModel.findById.mockResolvedValue(mockOrganization)
      mockContactModel.findById.mockResolvedValue(mockContact)
      mockOpportunityModel.create.mockResolvedValue({
        ...mockOpportunity,
        id: '2',
        name: 'Test Opportunity (Copy)',
        stage: 'prospecting',
        probability: 10
      })

      const result = await opportunityService.cloneOpportunity('1', { name: 'Cloned Opportunity' }, 'user1')

      expect(mockOpportunityModel.findById).toHaveBeenCalledWith('1')
      expect(mockOpportunityModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cloned Opportunity',
          stage: 'prospecting',
          probability: 10,
          organizationId: 'org1',
          contactId: 'contact1'
        })
      )
      expect(result).toEqual(expect.objectContaining({
        name: 'Test Opportunity (Copy)',
        stage: 'prospecting',
        probability: 10
      }))
    })

    it('should throw error if opportunity not found', async () => {
      mockOpportunityModel.findById.mockResolvedValue(null)

      await expect(
        opportunityService.cloneOpportunity('999', {}, 'user1')
      ).rejects.toThrow('Failed to clone opportunity: Opportunity not found')
    })
  })

  describe('getOpportunityInsights', () => {
    it('should return empty insights structure', async () => {
      const result = await opportunityService.getOpportunityInsights()

      expect(result).toEqual({
        topPerformers: [],
        stageAnalysis: [],
        competitorAnalysis: [],
        productPerformance: []
      })
    })
  })

  describe('validateOpportunityData', () => {
    it('should return data as-is (placeholder implementation)', async () => {
      const testData = { name: 'Test', value: 1000 }
      const result = await opportunityService.validateOpportunityData(testData)

      expect(result).toEqual(testData)
    })
  })
})