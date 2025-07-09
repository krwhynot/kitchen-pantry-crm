import { BaseRepository, RepositoryOptions } from './BaseRepository'
import { DataIntegrityValidator } from '../validation/sanitization'
import { organizationSchemas } from '../validation/schemas'
import { Organization } from '../../shared/types/organization.types'

export interface OrganizationFilters {
  type?: string
  priority?: string
  segment?: string
  city?: string
  state?: string
  isActive?: boolean
  parentOrganizationId?: string
}

export interface OrganizationAnalytics {
  totalOrganizations: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  bySegment: Record<string, number>
  byState: Record<string, number>
  averageRevenue: number
  totalRevenue: number
  activeCount: number
  inactiveCount: number
}

export class OrganizationRepository extends BaseRepository<Organization> {
  constructor(options?: RepositoryOptions) {
    super('organizations', options)
  }

  protected validateBusinessRules(data: Partial<Organization>, isUpdate: boolean): void {
    // Validate organization name uniqueness (except for updates of the same record)
    if (data.name && !isUpdate) {
      // This would need to be implemented with actual uniqueness check
      DataIntegrityValidator.validateRequired(data.name, 'Organization name')
      DataIntegrityValidator.validateLength(data.name, 1, 255, 'Organization name')
    }

    // Validate parent organization relationship
    if (data.parentOrganizationId) {
      // Ensure parent organization exists and prevent circular references
      // This would need database lookup implementation
    }

    // Validate revenue constraints
    if (data.annualRevenue !== undefined) {
      if (data.annualRevenue < 0) {
        throw new Error('Annual revenue cannot be negative')
      }
    }

    // Validate employee count
    if (data.employeeCount !== undefined) {
      DataIntegrityValidator.validateRange(data.employeeCount, 1, 1000000, 'Employee count')
    }

    // Validate address if provided
    if (data.address) {
      DataIntegrityValidator.validateRequired(data.address.street, 'Street address')
      DataIntegrityValidator.validateRequired(data.address.city, 'City')
      DataIntegrityValidator.validateRequired(data.address.state, 'State')
      DataIntegrityValidator.validateRequired(data.address.zipCode, 'ZIP code')
    }

    // Validate email format if provided
    if (data.email) {
      DataIntegrityValidator.validateFormat(
        data.email,
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Email',
        'Invalid email format'
      )
    }

    // Validate phone format if provided
    if (data.phone) {
      DataIntegrityValidator.validateFormat(
        data.phone,
        /^\+?[\d\s\-\(\)]+$/,
        'Phone',
        'Invalid phone number format'
      )
    }

    // Validate website URL if provided
    if (data.website) {
      try {
        new URL(data.website)
      } catch {
        throw new Error('Invalid website URL format')
      }
    }
  }

  async findByType(type: string, options: { isActive?: boolean } = {}): Promise<Organization[]> {
    const filters: OrganizationFilters = { type }
    if (options.isActive !== undefined) {
      filters.isActive = options.isActive
    }

    return this.findMany(filters)
  }

  async findByPriority(priority: string, options: { isActive?: boolean } = {}): Promise<Organization[]> {
    const filters: OrganizationFilters = { priority }
    if (options.isActive !== undefined) {
      filters.isActive = options.isActive
    }

    return this.findMany(filters)
  }

  async findBySegment(segment: string, options: { isActive?: boolean } = {}): Promise<Organization[]> {
    const filters: OrganizationFilters = { segment }
    if (options.isActive !== undefined) {
      filters.isActive = options.isActive
    }

    return this.findMany(filters)
  }

  async findByLocation(city?: string, state?: string): Promise<Organization[]> {
    const filters: OrganizationFilters = {}
    if (city) filters.city = city
    if (state) filters.state = state

    return this.findMany(filters)
  }

  async findChildren(parentId: string): Promise<Organization[]> {
    return this.findMany({ parentOrganizationId: parentId })
  }

  async findHierarchy(organizationId: string): Promise<{
    organization: Organization | null
    parent: Organization | null
    children: Organization[]
    siblings: Organization[]
  }> {
    const organization = await this.findById(organizationId)
    if (!organization) {
      return { organization: null, parent: null, children: [], siblings: [] }
    }

    const [parent, children, siblings] = await Promise.all([
      organization.parentOrganizationId 
        ? this.findById(organization.parentOrganizationId)
        : Promise.resolve(null),
      this.findChildren(organizationId),
      organization.parentOrganizationId
        ? this.findMany({ 
            parentOrganizationId: organization.parentOrganizationId,
            [`${this.primaryKey}__neq`]: organizationId 
          })
        : Promise.resolve([])
    ])

    return { organization, parent, children, siblings }
  }

  async searchByName(query: string, options: { limit?: number; isActive?: boolean } = {}): Promise<Organization[]> {
    const searchResult = await this.search(query, ['name'], {
      limit: options.limit || 10,
      filters: options.isActive !== undefined ? { isActive: options.isActive } : undefined
    })

    return searchResult.data
  }

  async findDuplicatesByName(name: string): Promise<Organization[]> {
    return this.findMany({ 'name__ilike': name })
  }

  async getTopByRevenue(limit: number = 10): Promise<Organization[]> {
    return this.findMany({}, {
      orderBy: [{ column: 'annualRevenue', ascending: false }],
      limit
    })
  }

  async getByRevenueRange(minRevenue: number, maxRevenue: number): Promise<Organization[]> {
    return this.findMany({
      'annualRevenue__gte': minRevenue,
      'annualRevenue__lte': maxRevenue
    })
  }

  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<OrganizationAnalytics> {
    const baseAnalytics = await super.getAnalytics(dateRange)
    
    // Get all organizations for detailed analysis
    const organizations = await this.findAll({ limit: 10000 })
    const orgData = organizations.data

    const analytics: OrganizationAnalytics = {
      totalOrganizations: baseAnalytics.total,
      byType: {},
      byPriority: {},
      bySegment: {},
      byState: {},
      averageRevenue: 0,
      totalRevenue: 0,
      activeCount: 0,
      inactiveCount: 0
    }

    let totalRevenue = 0
    let revenueCount = 0

    for (const org of orgData) {
      // Count by type
      analytics.byType[org.type] = (analytics.byType[org.type] || 0) + 1

      // Count by priority
      if (org.priority) {
        analytics.byPriority[org.priority] = (analytics.byPriority[org.priority] || 0) + 1
      }

      // Count by segment
      if (org.segment) {
        analytics.bySegment[org.segment] = (analytics.bySegment[org.segment] || 0) + 1
      }

      // Count by state
      if (org.address?.state) {
        analytics.byState[org.address.state] = (analytics.byState[org.address.state] || 0) + 1
      }

      // Calculate revenue
      if (org.annualRevenue) {
        totalRevenue += org.annualRevenue
        revenueCount++
      }

      // Count active/inactive
      if (org.isActive) {
        analytics.activeCount++
      } else {
        analytics.inactiveCount++
      }
    }

    analytics.totalRevenue = totalRevenue
    analytics.averageRevenue = revenueCount > 0 ? totalRevenue / revenueCount : 0

    return analytics
  }

  async mergeOrganizations(targetId: string, sourceId: string): Promise<Organization | null> {
    return this.transaction(async (repo) => {
      const [target, source] = await Promise.all([
        repo.findById(targetId),
        repo.findById(sourceId)
      ])

      if (!target || !source) {
        throw new Error('One or both organizations not found')
      }

      // Merge logic: combine data from source into target
      const mergedData: Partial<Organization> = {
        // Keep target's primary data but merge additional information
        description: target.description || source.description,
        tags: [...(target.tags || []), ...(source.tags || [])],
        // Combine revenue if both exist
        annualRevenue: target.annualRevenue || source.annualRevenue,
        employeeCount: target.employeeCount || source.employeeCount,
        // Use higher priority
        priority: target.priority === 'high' ? 'high' : source.priority,
        // Update timestamps
        updatedAt: new Date().toISOString()
      }

      // Update target with merged data
      const updated = await repo.update(targetId, mergedData)

      // Mark source as merged (soft delete with reference)
      await repo.update(sourceId, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        mergedIntoId: targetId
      } as Partial<Organization>)

      // TODO: Update related records (contacts, interactions, opportunities)
      // This would require updates to related tables

      return updated
    })
  }

  async bulkUpdatePriority(organizationIds: string[], priority: string): Promise<Organization[]> {
    return this.updateMany(
      { [`${this.primaryKey}__in`]: organizationIds },
      { priority } as Partial<Organization>
    )
  }

  async bulkUpdateSegment(organizationIds: string[], segment: string): Promise<Organization[]> {
    return this.updateMany(
      { [`${this.primaryKey}__in`]: organizationIds },
      { segment } as Partial<Organization>
    )
  }

  async getOrganizationsNeedingUpdate(): Promise<Organization[]> {
    // Find organizations that haven't been updated in a while
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return this.findMany({
      'updatedAt__lt': thirtyDaysAgo.toISOString(),
      isActive: true
    })
  }

  async validateSchema(data: any, isUpdate: boolean = false): Promise<Partial<Organization>> {
    const schema = isUpdate ? organizationSchemas.update : organizationSchemas.create
    return schema.parse(data)
  }
}