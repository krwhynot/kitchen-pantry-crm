import { Organization } from '@shared/types'
import { OrganizationRepository, OrganizationFilters, OrganizationAnalytics } from '../repositories/OrganizationRepository'
import { BaseService } from './BaseService'

export interface OrganizationSearchOptions {
  query?: string
  type?: string
  priority?: string
  segment?: string
  city?: string
  state?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface OrganizationCreateData {
  name: string
  type: string
  priority?: string
  segment?: string
  description?: string
  parentOrganizationId?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country?: string
  }
  email?: string
  phone?: string
  website?: string
  annualRevenue?: number
  employeeCount?: number
  tags?: string[]
}

export interface OrganizationUpdateData extends Partial<OrganizationCreateData> {
  isActive?: boolean
}

export interface OrganizationPerformanceMetrics {
  totalInteractions: number
  lastInteractionDate: string | null
  totalOpportunities: number
  totalOpportunityValue: number
  avgOpportunityValue: number
  winRate: number
  engagementScore: number
  healthScore: number
}

export interface OrganizationActivityFeed {
  id: string
  type: 'interaction' | 'opportunity' | 'contact' | 'update'
  title: string
  description: string
  userId: string
  userName: string
  createdAt: string
  metadata?: Record<string, any>
}

export class OrganizationService extends BaseService {
  private repository: OrganizationRepository

  constructor() {
    super()
    this.repository = new OrganizationRepository()
  }

  async createOrganization(data: OrganizationCreateData, userId: string): Promise<Organization> {
    try {
      // Validate parent organization exists if provided
      if (data.parentOrganizationId) {
        const parentOrg = await this.repository.findById(data.parentOrganizationId)
        if (!parentOrg) {
          throw new Error('Parent organization not found')
        }
        if (!parentOrg.isActive) {
          throw new Error('Parent organization is not active')
        }
      }

      // Check for duplicates
      const duplicates = await this.repository.findDuplicatesByName(data.name)
      if (duplicates.length > 0) {
        throw new Error(`Organization with name "${data.name}" already exists`)
      }

      // Create organization with audit info
      const organizationData = {
        ...data,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const organization = await this.repository.create(organizationData)
      
      // Log activity
      await this.logActivity(organization.id, 'create', 'Organization created', userId)
      
      return organization
    } catch (error) {
      this.handleError(error, 'Failed to create organization')
    }
  }

  async updateOrganization(id: string, data: OrganizationUpdateData, userId: string): Promise<Organization> {
    try {
      const existing = await this.repository.findById(id)
      if (!existing) {
        throw new Error('Organization not found')
      }

      // Validate parent organization if being updated
      if (data.parentOrganizationId && data.parentOrganizationId !== existing.parentOrganizationId) {
        if (data.parentOrganizationId === id) {
          throw new Error('Organization cannot be its own parent')
        }
        
        const parentOrg = await this.repository.findById(data.parentOrganizationId)
        if (!parentOrg) {
          throw new Error('Parent organization not found')
        }

        // Check for circular references
        const isCircular = await this.checkCircularReference(id, data.parentOrganizationId)
        if (isCircular) {
          throw new Error('Circular reference detected in organization hierarchy')
        }
      }

      // Check for name duplicates if name is changing
      if (data.name && data.name !== existing.name) {
        const duplicates = await this.repository.findDuplicatesByName(data.name)
        if (duplicates.length > 0) {
          throw new Error(`Organization with name "${data.name}" already exists`)
        }
      }

      const updateData = {
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      }

      const updated = await this.repository.update(id, updateData)
      
      // Log activity
      await this.logActivity(id, 'update', 'Organization updated', userId)
      
      return updated
    } catch (error) {
      this.handleError(error, 'Failed to update organization')
    }
  }

  async deleteOrganization(id: string, userId: string): Promise<void> {
    try {
      const existing = await this.repository.findById(id)
      if (!existing) {
        throw new Error('Organization not found')
      }

      // Check if organization has children
      const children = await this.repository.findChildren(id)
      if (children.length > 0) {
        throw new Error('Cannot delete organization with child organizations')
      }

      // Soft delete
      await this.repository.update(id, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: userId
      } as Partial<Organization>)

      // Log activity
      await this.logActivity(id, 'delete', 'Organization deleted', userId)
    } catch (error) {
      this.handleError(error, 'Failed to delete organization')
    }
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      return await this.repository.findById(id)
    } catch (error) {
      this.handleError(error, 'Failed to retrieve organization')
    }
  }

  async searchOrganizations(options: OrganizationSearchOptions = {}): Promise<{
    data: Organization[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const { query, limit = 20, offset = 0, ...filters } = options
      
      let organizations: Organization[]
      let total: number

      if (query) {
        const searchResult = await this.repository.searchByName(query, { 
          limit, 
          isActive: filters.isActive 
        })
        organizations = searchResult
        total = searchResult.length
      } else {
        const result = await this.repository.findAll({
          filters: filters as OrganizationFilters,
          limit,
          offset
        })
        organizations = result.data
        total = result.total
      }

      return {
        data: organizations,
        total,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      this.handleError(error, 'Failed to search organizations')
    }
  }

  async getOrganizationHierarchy(id: string): Promise<{
    organization: Organization | null
    parent: Organization | null
    children: Organization[]
    siblings: Organization[]
  }> {
    try {
      return await this.repository.findHierarchy(id)
    } catch (error) {
      this.handleError(error, 'Failed to get organization hierarchy')
    }
  }

  async getOrganizationAnalytics(dateRange?: { start: Date; end: Date }): Promise<OrganizationAnalytics> {
    try {
      return await this.repository.getAnalytics(dateRange)
    } catch (error) {
      this.handleError(error, 'Failed to get organization analytics')
    }
  }

  async mergeOrganizations(targetId: string, sourceId: string, userId: string): Promise<Organization> {
    try {
      if (targetId === sourceId) {
        throw new Error('Cannot merge organization with itself')
      }

      const [target, source] = await Promise.all([
        this.repository.findById(targetId),
        this.repository.findById(sourceId)
      ])

      if (!target || !source) {
        throw new Error('One or both organizations not found')
      }

      const merged = await this.repository.mergeOrganizations(targetId, sourceId)
      
      // Log activity for both organizations
      await Promise.all([
        this.logActivity(targetId, 'merge', `Merged with organization ${source.name}`, userId),
        this.logActivity(sourceId, 'merge', `Merged into organization ${target.name}`, userId)
      ])

      return merged!
    } catch (error) {
      this.handleError(error, 'Failed to merge organizations')
    }
  }

  async bulkUpdatePriority(organizationIds: string[], priority: string, userId: string): Promise<Organization[]> {
    try {
      const updated = await this.repository.bulkUpdatePriority(organizationIds, priority)
      
      // Log activity for all organizations
      await Promise.all(organizationIds.map(id => 
        this.logActivity(id, 'bulk_update', `Priority updated to ${priority}`, userId)
      ))

      return updated
    } catch (error) {
      this.handleError(error, 'Failed to bulk update organization priorities')
    }
  }

  async bulkUpdateSegment(organizationIds: string[], segment: string, userId: string): Promise<Organization[]> {
    try {
      const updated = await this.repository.bulkUpdateSegment(organizationIds, segment)
      
      // Log activity for all organizations
      await Promise.all(organizationIds.map(id => 
        this.logActivity(id, 'bulk_update', `Segment updated to ${segment}`, userId)
      ))

      return updated
    } catch (error) {
      this.handleError(error, 'Failed to bulk update organization segments')
    }
  }

  async getOrganizationPerformanceMetrics(id: string): Promise<OrganizationPerformanceMetrics> {
    try {
      const organization = await this.repository.findById(id)
      if (!organization) {
        throw new Error('Organization not found')
      }

      // TODO: Implement actual metrics calculation once interaction and opportunity services are available
      // For now, return mock data structure
      return {
        totalInteractions: 0,
        lastInteractionDate: null,
        totalOpportunities: 0,
        totalOpportunityValue: 0,
        avgOpportunityValue: 0,
        winRate: 0,
        engagementScore: 0,
        healthScore: 0
      }
    } catch (error) {
      this.handleError(error, 'Failed to get organization performance metrics')
    }
  }

  async getOrganizationActivityFeed(id: string, limit: number = 50): Promise<OrganizationActivityFeed[]> {
    try {
      const organization = await this.repository.findById(id)
      if (!organization) {
        throw new Error('Organization not found')
      }

      // TODO: Implement actual activity feed once audit log system is in place
      // For now, return empty array
      return []
    } catch (error) {
      this.handleError(error, 'Failed to get organization activity feed')
    }
  }

  async getOrganizationsNeedingUpdate(): Promise<Organization[]> {
    try {
      return await this.repository.getOrganizationsNeedingUpdate()
    } catch (error) {
      this.handleError(error, 'Failed to get organizations needing update')
    }
  }

  async validateOrganizationData(data: any, isUpdate: boolean = false): Promise<Partial<Organization>> {
    try {
      return await this.repository.validateSchema(data, isUpdate)
    } catch (error) {
      this.handleError(error, 'Failed to validate organization data')
    }
  }

  private async checkCircularReference(organizationId: string, parentId: string): Promise<boolean> {
    let currentId = parentId
    const visited = new Set<string>([organizationId])

    while (currentId) {
      if (visited.has(currentId)) {
        return true
      }
      visited.add(currentId)

      const parent = await this.repository.findById(currentId)
      if (!parent) {
        break
      }
      currentId = parent.parentOrganizationId || ''
    }

    return false
  }

  private async logActivity(organizationId: string, type: string, description: string, userId: string): Promise<void> {
    // TODO: Implement activity logging once audit system is in place
    console.log(`[ACTIVITY] ${type} - ${description} for organization ${organizationId} by user ${userId}`)
  }
}