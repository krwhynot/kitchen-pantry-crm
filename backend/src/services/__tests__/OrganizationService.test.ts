import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { OrganizationService } from '../OrganizationService'
import { OrganizationRepository } from '../../repositories/OrganizationRepository'
import { Organization } from '@shared/types'

// Mock the repository
jest.mock('../../repositories/OrganizationRepository')

describe('OrganizationService', () => {
  let organizationService: OrganizationService
  let mockRepository: jest.Mocked<OrganizationRepository>

  const mockOrganization: Organization = {
    id: '1',
    name: 'Test Restaurant',
    type: 'restaurant',
    priority: 'A',
    segment: 'fine_dining',
    description: 'A fine dining restaurant',
    parentOrganizationId: null,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user1'
  }

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findDuplicatesByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findChildren: jest.fn(),
      searchByName: jest.fn(),
      findAll: jest.fn(),
      findHierarchy: jest.fn(),
      getAnalytics: jest.fn(),
      mergeOrganizations: jest.fn(),
      bulkUpdatePriority: jest.fn(),
      bulkUpdateSegment: jest.fn(),
      getOrganizationsNeedingUpdate: jest.fn(),
      validateSchema: jest.fn()
    } as any

    // Reset the mock before each test
    jest.mocked(OrganizationRepository).mockImplementation(() => mockRepository)
    organizationService = new OrganizationService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrganization', () => {
    const createData = {
      name: 'New Restaurant',
      type: 'restaurant',
      priority: 'A',
      segment: 'fine_dining',
      description: 'A new fine dining restaurant',
      email: 'contact@newrestaurant.com',
      phone: '+1234567890',
      website: 'https://newrestaurant.com',
      annualRevenue: 1000000,
      employeeCount: 50,
      tags: ['fine_dining', 'french']
    }

    it('should create organization successfully', async () => {
      mockRepository.findDuplicatesByName.mockResolvedValue([])
      mockRepository.create.mockResolvedValue(mockOrganization)

      const result = await organizationService.createOrganization(createData, 'user1')

      expect(mockRepository.findDuplicatesByName).toHaveBeenCalledWith('New Restaurant')
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          isActive: true,
          createdBy: 'user1',
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual(mockOrganization)
    })

    it('should validate parent organization exists', async () => {
      const parentOrg = { ...mockOrganization, id: 'parent1', isActive: true }
      mockRepository.findById.mockResolvedValue(parentOrg)
      mockRepository.findDuplicatesByName.mockResolvedValue([])
      mockRepository.create.mockResolvedValue(mockOrganization)

      await organizationService.createOrganization({
        ...createData,
        parentOrganizationId: 'parent1'
      }, 'user1')

      expect(mockRepository.findById).toHaveBeenCalledWith('parent1')
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentOrganizationId: 'parent1'
        })
      )
    })

    it('should throw error if parent organization not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        organizationService.createOrganization({
          ...createData,
          parentOrganizationId: 'nonexistent'
        }, 'user1')
      ).rejects.toThrow('Parent organization not found')
    })

    it('should throw error if parent organization is not active', async () => {
      const inactiveParent = { ...mockOrganization, id: 'parent1', isActive: false }
      mockRepository.findById.mockResolvedValue(inactiveParent)

      await expect(
        organizationService.createOrganization({
          ...createData,
          parentOrganizationId: 'parent1'
        }, 'user1')
      ).rejects.toThrow('Parent organization is not active')
    })

    it('should throw error if organization name already exists', async () => {
      mockRepository.findDuplicatesByName.mockResolvedValue([mockOrganization])

      await expect(
        organizationService.createOrganization(createData, 'user1')
      ).rejects.toThrow('Organization with name "New Restaurant" already exists')
    })

    it('should handle repository errors', async () => {
      mockRepository.findDuplicatesByName.mockRejectedValue(new Error('Database error'))

      await expect(
        organizationService.createOrganization(createData, 'user1')
      ).rejects.toThrow('Failed to create organization: Database error')
    })
  })

  describe('updateOrganization', () => {
    const updateData = {
      name: 'Updated Restaurant',
      priority: 'B',
      description: 'Updated description'
    }

    it('should update organization successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)
      mockRepository.findDuplicatesByName.mockResolvedValue([])
      mockRepository.update.mockResolvedValue({ ...mockOrganization, ...updateData })

      const result = await organizationService.updateOrganization('1', updateData, 'user1')

      expect(mockRepository.findById).toHaveBeenCalledWith('1')
      expect(mockRepository.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          ...updateData,
          updatedBy: 'user1'
        })
      )
      expect(result).toEqual({ ...mockOrganization, ...updateData })
    })

    it('should throw error if organization not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        organizationService.updateOrganization('1', updateData, 'user1')
      ).rejects.toThrow('Organization not found')
    })

    it('should prevent self-parenting', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)

      await expect(
        organizationService.updateOrganization('1', { parentOrganizationId: '1' }, 'user1')
      ).rejects.toThrow('Organization cannot be its own parent')
    })

    it('should validate parent organization exists when updating parent', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(mockOrganization)
        .mockResolvedValueOnce(null)

      await expect(
        organizationService.updateOrganization('1', { parentOrganizationId: 'parent1' }, 'user1')
      ).rejects.toThrow('Parent organization not found')
    })

    it('should detect circular references', async () => {
      const org1 = { ...mockOrganization, id: '1' }
      const org2 = { ...mockOrganization, id: '2', parentOrganizationId: '1' }
      
      mockRepository.findById
        .mockResolvedValueOnce(org1)
        .mockResolvedValueOnce(org2)
        .mockResolvedValueOnce(org1)

      await expect(
        organizationService.updateOrganization('1', { parentOrganizationId: '2' }, 'user1')
      ).rejects.toThrow('Circular reference detected in organization hierarchy')
    })

    it('should check for name duplicates when name changes', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)
      mockRepository.findDuplicatesByName.mockResolvedValue([{ ...mockOrganization, id: '2' }])

      await expect(
        organizationService.updateOrganization('1', { name: 'Existing Name' }, 'user1')
      ).rejects.toThrow('Organization with name "Existing Name" already exists')
    })
  })

  describe('deleteOrganization', () => {
    it('should soft delete organization successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)
      mockRepository.findChildren.mockResolvedValue([])
      mockRepository.update.mockResolvedValue({ ...mockOrganization, isActive: false })

      await organizationService.deleteOrganization('1', 'user1')

      expect(mockRepository.findById).toHaveBeenCalledWith('1')
      expect(mockRepository.findChildren).toHaveBeenCalledWith('1')
      expect(mockRepository.update).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          isActive: false,
          deletedBy: 'user1'
        })
      )
    })

    it('should throw error if organization not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        organizationService.deleteOrganization('1', 'user1')
      ).rejects.toThrow('Organization not found')
    })

    it('should throw error if organization has children', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)
      mockRepository.findChildren.mockResolvedValue([mockOrganization])

      await expect(
        organizationService.deleteOrganization('1', 'user1')
      ).rejects.toThrow('Cannot delete organization with child organizations')
    })
  })

  describe('getOrganizationById', () => {
    it('should return organization when found', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)

      const result = await organizationService.getOrganizationById('1')

      expect(mockRepository.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual(mockOrganization)
    })

    it('should return null when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await organizationService.getOrganizationById('1')

      expect(result).toBeNull()
    })

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'))

      await expect(
        organizationService.getOrganizationById('1')
      ).rejects.toThrow('Failed to retrieve organization: Database error')
    })
  })

  describe('searchOrganizations', () => {
    const searchOptions = {
      query: 'restaurant',
      type: 'restaurant',
      priority: 'A',
      limit: 10,
      offset: 0
    }

    it('should search organizations by name when query provided', async () => {
      const searchResults = [mockOrganization]
      mockRepository.searchByName.mockResolvedValue(searchResults)

      const result = await organizationService.searchOrganizations(searchOptions)

      expect(mockRepository.searchByName).toHaveBeenCalledWith('restaurant', {
        limit: 10,
        isActive: undefined
      })
      expect(result).toEqual({
        data: searchResults,
        total: 1,
        page: 1,
        limit: 10
      })
    })

    it('should find all organizations when no query provided', async () => {
      const findAllResult = {
        data: [mockOrganization],
        total: 1
      }
      mockRepository.findAll.mockResolvedValue(findAllResult)

      const result = await organizationService.searchOrganizations({
        type: 'restaurant',
        limit: 10,
        offset: 0
      })

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        filters: { type: 'restaurant' },
        limit: 10,
        offset: 0
      })
      expect(result).toEqual({
        data: [mockOrganization],
        total: 1,
        page: 1,
        limit: 10
      })
    })

    it('should use default limit and offset when not provided', async () => {
      const findAllResult = {
        data: [mockOrganization],
        total: 1
      }
      mockRepository.findAll.mockResolvedValue(findAllResult)

      const result = await organizationService.searchOrganizations({})

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        filters: {},
        limit: 20,
        offset: 0
      })
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should calculate page correctly', async () => {
      const findAllResult = {
        data: [mockOrganization],
        total: 1
      }
      mockRepository.findAll.mockResolvedValue(findAllResult)

      const result = await organizationService.searchOrganizations({
        limit: 10,
        offset: 20
      })

      expect(result.page).toBe(3) // offset 20 / limit 10 + 1
    })
  })

  describe('getOrganizationHierarchy', () => {
    it('should return organization hierarchy', async () => {
      const hierarchy = {
        organization: mockOrganization,
        parent: null,
        children: [],
        siblings: []
      }
      mockRepository.findHierarchy.mockResolvedValue(hierarchy)

      const result = await organizationService.getOrganizationHierarchy('1')

      expect(mockRepository.findHierarchy).toHaveBeenCalledWith('1')
      expect(result).toEqual(hierarchy)
    })

    it('should handle repository errors', async () => {
      mockRepository.findHierarchy.mockRejectedValue(new Error('Database error'))

      await expect(
        organizationService.getOrganizationHierarchy('1')
      ).rejects.toThrow('Failed to get organization hierarchy: Database error')
    })
  })

  describe('getOrganizationAnalytics', () => {
    it('should return analytics data', async () => {
      const analytics = {
        totalOrganizations: 100,
        activeOrganizations: 90,
        organizationsByType: { restaurant: 50, distributor: 30, manufacturer: 20 },
        organizationsByPriority: { A: 30, B: 40, C: 30 },
        organizationsBySegment: { fine_dining: 20, casual: 30, fast_food: 50 }
      }
      mockRepository.getAnalytics.mockResolvedValue(analytics)

      const result = await organizationService.getOrganizationAnalytics()

      expect(mockRepository.getAnalytics).toHaveBeenCalledWith(undefined)
      expect(result).toEqual(analytics)
    })

    it('should pass date range to repository', async () => {
      const dateRange = { start: new Date('2023-01-01'), end: new Date('2023-12-31') }
      mockRepository.getAnalytics.mockResolvedValue({} as any)

      await organizationService.getOrganizationAnalytics(dateRange)

      expect(mockRepository.getAnalytics).toHaveBeenCalledWith(dateRange)
    })
  })

  describe('mergeOrganizations', () => {
    it('should merge organizations successfully', async () => {
      const targetOrg = { ...mockOrganization, id: '1', name: 'Target' }
      const sourceOrg = { ...mockOrganization, id: '2', name: 'Source' }
      const mergedOrg = { ...targetOrg, name: 'Merged Target' }

      mockRepository.findById
        .mockResolvedValueOnce(targetOrg)
        .mockResolvedValueOnce(sourceOrg)
      mockRepository.mergeOrganizations.mockResolvedValue(mergedOrg)

      const result = await organizationService.mergeOrganizations('1', '2', 'user1')

      expect(mockRepository.findById).toHaveBeenCalledWith('1')
      expect(mockRepository.findById).toHaveBeenCalledWith('2')
      expect(mockRepository.mergeOrganizations).toHaveBeenCalledWith('1', '2')
      expect(result).toEqual(mergedOrg)
    })

    it('should throw error when merging organization with itself', async () => {
      await expect(
        organizationService.mergeOrganizations('1', '1', 'user1')
      ).rejects.toThrow('Cannot merge organization with itself')
    })

    it('should throw error when target organization not found', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockOrganization)

      await expect(
        organizationService.mergeOrganizations('1', '2', 'user1')
      ).rejects.toThrow('One or both organizations not found')
    })

    it('should throw error when source organization not found', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(mockOrganization)
        .mockResolvedValueOnce(null)

      await expect(
        organizationService.mergeOrganizations('1', '2', 'user1')
      ).rejects.toThrow('One or both organizations not found')
    })
  })

  describe('bulkUpdatePriority', () => {
    it('should update priority for multiple organizations', async () => {
      const organizationIds = ['1', '2', '3']
      const updatedOrgs = organizationIds.map(id => ({ ...mockOrganization, id, priority: 'A' }))
      mockRepository.bulkUpdatePriority.mockResolvedValue(updatedOrgs)

      const result = await organizationService.bulkUpdatePriority(organizationIds, 'A', 'user1')

      expect(mockRepository.bulkUpdatePriority).toHaveBeenCalledWith(organizationIds, 'A')
      expect(result).toEqual(updatedOrgs)
    })

    it('should handle repository errors', async () => {
      mockRepository.bulkUpdatePriority.mockRejectedValue(new Error('Database error'))

      await expect(
        organizationService.bulkUpdatePriority(['1', '2'], 'A', 'user1')
      ).rejects.toThrow('Failed to bulk update organization priorities: Database error')
    })
  })

  describe('bulkUpdateSegment', () => {
    it('should update segment for multiple organizations', async () => {
      const organizationIds = ['1', '2', '3']
      const updatedOrgs = organizationIds.map(id => ({ ...mockOrganization, id, segment: 'casual' }))
      mockRepository.bulkUpdateSegment.mockResolvedValue(updatedOrgs)

      const result = await organizationService.bulkUpdateSegment(organizationIds, 'casual', 'user1')

      expect(mockRepository.bulkUpdateSegment).toHaveBeenCalledWith(organizationIds, 'casual')
      expect(result).toEqual(updatedOrgs)
    })

    it('should handle repository errors', async () => {
      mockRepository.bulkUpdateSegment.mockRejectedValue(new Error('Database error'))

      await expect(
        organizationService.bulkUpdateSegment(['1', '2'], 'casual', 'user1')
      ).rejects.toThrow('Failed to bulk update organization segments: Database error')
    })
  })

  describe('getOrganizationPerformanceMetrics', () => {
    it('should return performance metrics for organization', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)

      const result = await organizationService.getOrganizationPerformanceMetrics('1')

      expect(mockRepository.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual({
        totalInteractions: 0,
        lastInteractionDate: null,
        totalOpportunities: 0,
        totalOpportunityValue: 0,
        avgOpportunityValue: 0,
        winRate: 0,
        engagementScore: 0,
        healthScore: 0
      })
    })

    it('should throw error if organization not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        organizationService.getOrganizationPerformanceMetrics('1')
      ).rejects.toThrow('Organization not found')
    })
  })

  describe('getOrganizationActivityFeed', () => {
    it('should return activity feed for organization', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)

      const result = await organizationService.getOrganizationActivityFeed('1')

      expect(mockRepository.findById).toHaveBeenCalledWith('1')
      expect(result).toEqual([])
    })

    it('should throw error if organization not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        organizationService.getOrganizationActivityFeed('1')
      ).rejects.toThrow('Organization not found')
    })

    it('should respect limit parameter', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization)

      await organizationService.getOrganizationActivityFeed('1', 25)

      expect(mockRepository.findById).toHaveBeenCalledWith('1')
    })
  })

  describe('getOrganizationsNeedingUpdate', () => {
    it('should return organizations needing update', async () => {
      const organizations = [mockOrganization]
      mockRepository.getOrganizationsNeedingUpdate.mockResolvedValue(organizations)

      const result = await organizationService.getOrganizationsNeedingUpdate()

      expect(mockRepository.getOrganizationsNeedingUpdate).toHaveBeenCalled()
      expect(result).toEqual(organizations)
    })

    it('should handle repository errors', async () => {
      mockRepository.getOrganizationsNeedingUpdate.mockRejectedValue(new Error('Database error'))

      await expect(
        organizationService.getOrganizationsNeedingUpdate()
      ).rejects.toThrow('Failed to get organizations needing update: Database error')
    })
  })

  describe('validateOrganizationData', () => {
    it('should validate organization data', async () => {
      const validData = { name: 'Test', type: 'restaurant' }
      mockRepository.validateSchema.mockResolvedValue(validData)

      const result = await organizationService.validateOrganizationData(validData)

      expect(mockRepository.validateSchema).toHaveBeenCalledWith(validData, false)
      expect(result).toEqual(validData)
    })

    it('should validate organization data for update', async () => {
      const validData = { name: 'Test' }
      mockRepository.validateSchema.mockResolvedValue(validData)

      const result = await organizationService.validateOrganizationData(validData, true)

      expect(mockRepository.validateSchema).toHaveBeenCalledWith(validData, true)
      expect(result).toEqual(validData)
    })

    it('should handle validation errors', async () => {
      mockRepository.validateSchema.mockRejectedValue(new Error('Validation error'))

      await expect(
        organizationService.validateOrganizationData({})
      ).rejects.toThrow('Failed to validate organization data: Validation error')
    })
  })

  describe('checkCircularReference', () => {
    it('should detect circular reference', async () => {
      const org1 = { ...mockOrganization, id: '1', parentOrganizationId: '2' }
      const org2 = { ...mockOrganization, id: '2', parentOrganizationId: '1' }

      mockRepository.findById
        .mockResolvedValueOnce(org2)
        .mockResolvedValueOnce(org1)

      // Access private method through service instance
      const result = await (organizationService as any).checkCircularReference('1', '2')

      expect(result).toBe(true)
    })

    it('should not detect circular reference in valid hierarchy', async () => {
      const org1 = { ...mockOrganization, id: '1', parentOrganizationId: null }
      const org2 = { ...mockOrganization, id: '2', parentOrganizationId: '1' }

      mockRepository.findById
        .mockResolvedValueOnce(org2)
        .mockResolvedValueOnce(org1)

      const result = await (organizationService as any).checkCircularReference('3', '2')

      expect(result).toBe(false)
    })
  })
})