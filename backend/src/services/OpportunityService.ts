import { Opportunity } from '@shared/types'
import { OpportunityModel } from '../models/Opportunity'
import { ContactModel } from '../models/Contact'
import { OrganizationModel } from '../models/Organization'
import { BaseService } from './BaseService'

export interface OpportunitySearchOptions {
  query?: string
  stage?: string
  contactId?: string
  organizationId?: string
  userId?: string
  minValue?: number
  maxValue?: number
  startDate?: string
  endDate?: string
  priority?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface OpportunityCreateData {
  name: string
  description?: string
  value: number
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  expectedCloseDate: string
  contactId?: string
  organizationId: string
  priority?: 'low' | 'medium' | 'high'
  source?: string
  competitorInfo?: {
    competitors: string[]
    advantages: string[]
    risks: string[]
  }
  products?: {
    productId: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  customFields?: Record<string, any>
  tags?: string[]
}

export interface OpportunityUpdateData extends Partial<OpportunityCreateData> {
  actualCloseDate?: string
  closeReason?: string
  lostReason?: string
  isActive?: boolean
}

export interface OpportunityStageTransition {
  fromStage: string
  toStage: string
  reason?: string
  notes?: string
  userId: string
  date: string
}

export interface OpportunityAnalytics {
  totalOpportunities: number
  totalValue: number
  avgValue: number
  avgDealSize: number
  conversionRate: number
  avgSalesCycle: number
  byStage: Record<string, { count: number; value: number }>
  byPriority: Record<string, { count: number; value: number }>
  bySource: Record<string, { count: number; value: number }>
  byUser: Record<string, { count: number; value: number; winRate: number }>
  monthlyTrends: {
    month: string
    created: number
    closed: number
    won: number
    lost: number
    value: number
  }[]
}

export interface OpportunityForecast {
  period: string
  totalPipeline: number
  weightedPipeline: number
  bestCase: number
  worstCase: number
  mostLikely: number
  closingThisPeriod: Opportunity[]
  atRiskOpportunities: Opportunity[]
}

export interface OpportunityInsights {
  topPerformers: {
    userId: string
    userName: string
    totalValue: number
    winRate: number
    avgDealSize: number
  }[]
  stageAnalysis: {
    stage: string
    avgTimeInStage: number
    conversionRate: number
    averageValue: number
    bottlenecks: string[]
  }[]
  competitorAnalysis: {
    competitor: string
    opportunitiesCount: number
    winRate: number
    avgDealSize: number
    lossReasons: string[]
  }[]
  productPerformance: {
    productId: string
    productName: string
    opportunitiesCount: number
    totalValue: number
    winRate: number
  }[]
}

export interface OpportunityWorkflow {
  id: string
  name: string
  stages: {
    name: string
    order: number
    required: boolean
    automation?: {
      onEnter: string[]
      onExit: string[]
    }
  }[]
  approvals: {
    stage: string
    required: boolean
    approvers: string[]
  }[]
  notifications: {
    trigger: string
    recipients: string[]
    template: string
  }[]
}

export class OpportunityService extends BaseService {
  constructor() {
    super()
  }

  async createOpportunity(data: OpportunityCreateData, userId: string): Promise<Opportunity> {
    try {
      // Validate organization exists
      const organization = await OrganizationModel.findById(data.organizationId)
      if (!organization) {
        throw new Error('Organization not found')
      }

      // Validate contact exists if provided
      if (data.contactId) {
        const contact = await ContactModel.findById(data.contactId)
        if (!contact) {
          throw new Error('Contact not found')
        }
        // Ensure contact belongs to the organization
        if (contact.organizationId !== data.organizationId) {
          throw new Error('Contact does not belong to the specified organization')
        }
      }

      // Validate expected close date is in future
      const expectedCloseDate = new Date(data.expectedCloseDate)
      if (expectedCloseDate < new Date()) {
        throw new Error('Expected close date must be in the future')
      }

      // Validate probability is between 0 and 100
      if (data.probability < 0 || data.probability > 100) {
        throw new Error('Probability must be between 0 and 100')
      }

      // Validate value is positive
      if (data.value <= 0) {
        throw new Error('Opportunity value must be positive')
      }

      // Create opportunity with audit info
      const opportunityData = {
        ...data,
        userId,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stageHistory: [{
          stage: data.stage,
          date: new Date().toISOString(),
          userId,
          notes: 'Opportunity created'
        }]
      }

      const opportunity = await OpportunityModel.create(opportunityData)
      
      // Log activity
      await this.logActivity(opportunity.id, 'create', 'Opportunity created', userId)
      
      return opportunity
    } catch (error) {
      this.handleError(error, 'Failed to create opportunity')
    }
  }

  async updateOpportunity(id: string, data: OpportunityUpdateData, userId: string): Promise<Opportunity> {
    try {
      const existing = await OpportunityModel.findById(id)
      if (!existing) {
        throw new Error('Opportunity not found')
      }

      // Validate organization if changing
      if (data.organizationId && data.organizationId !== existing.organizationId) {
        const organization = await OrganizationModel.findById(data.organizationId)
        if (!organization) {
          throw new Error('Organization not found')
        }
      }

      // Validate contact if changing
      if (data.contactId && data.contactId !== existing.contactId) {
        const contact = await ContactModel.findById(data.contactId)
        if (!contact) {
          throw new Error('Contact not found')
        }
        // Ensure contact belongs to the organization
        const orgId = data.organizationId || existing.organizationId
        if (contact.organizationId !== orgId) {
          throw new Error('Contact does not belong to the specified organization')
        }
      }

      // Handle stage transitions
      if (data.stage && data.stage !== existing.stage) {
        await this.transitionStage(id, data.stage, userId, data.closeReason)
      }

      // Validate probability if provided
      if (data.probability !== undefined && (data.probability < 0 || data.probability > 100)) {
        throw new Error('Probability must be between 0 and 100')
      }

      // Validate value if provided
      if (data.value !== undefined && data.value <= 0) {
        throw new Error('Opportunity value must be positive')
      }

      const updateData = {
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      }

      const updated = await OpportunityModel.update(id, updateData)
      
      // Log activity
      await this.logActivity(id, 'update', 'Opportunity updated', userId)
      
      return updated
    } catch (error) {
      this.handleError(error, 'Failed to update opportunity')
    }
  }

  async deleteOpportunity(id: string, userId: string): Promise<void> {
    try {
      const existing = await OpportunityModel.findById(id)
      if (!existing) {
        throw new Error('Opportunity not found')
      }

      // Soft delete
      await OpportunityModel.update(id, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: userId
      } as Partial<Opportunity>)

      // Log activity
      await this.logActivity(id, 'delete', 'Opportunity deleted', userId)
    } catch (error) {
      this.handleError(error, 'Failed to delete opportunity')
    }
  }

  async getOpportunityById(id: string): Promise<Opportunity | null> {
    try {
      const opportunity = await OpportunityModel.findById(id)
      if (!opportunity) {
        return null
      }

      // Enrich with related data
      const [contact, organization] = await Promise.all([
        opportunity.contactId ? ContactModel.findById(opportunity.contactId) : null,
        OrganizationModel.findById(opportunity.organizationId)
      ])

      return {
        ...opportunity,
        contact,
        organization
      } as Opportunity
    } catch (error) {
      this.handleError(error, 'Failed to retrieve opportunity')
    }
  }

  async searchOpportunities(options: OpportunitySearchOptions = {}): Promise<{
    data: Opportunity[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const { query, limit = 20, offset = 0, minValue, maxValue, startDate, endDate, ...filters } = options
      
      // Add value range filters
      if (minValue !== undefined) {
        filters['value__gte'] = minValue
      }
      if (maxValue !== undefined) {
        filters['value__lte'] = maxValue
      }

      // Add date range filters
      if (startDate) {
        filters['createdAt__gte'] = startDate
      }
      if (endDate) {
        filters['createdAt__lte'] = endDate
      }

      let opportunities: Opportunity[]
      let total: number

      const result = await OpportunityModel.findAll({
        filters,
        limit,
        offset,
        orderBy: { column: 'expectedCloseDate', ascending: true }
      })

      opportunities = result
      total = await OpportunityModel.count(filters)

      // Enrich with related data
      const enrichedOpportunities = await Promise.all(
        opportunities.map(async (opportunity) => {
          const [contact, organization] = await Promise.all([
            opportunity.contactId ? ContactModel.findById(opportunity.contactId) : null,
            OrganizationModel.findById(opportunity.organizationId)
          ])

          return {
            ...opportunity,
            contact,
            organization
          } as Opportunity
        })
      )

      return {
        data: enrichedOpportunities,
        total,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      this.handleError(error, 'Failed to search opportunities')
    }
  }

  async getOpportunitiesByStage(stage: string): Promise<Opportunity[]> {
    try {
      const opportunities = await OpportunityModel.findByStage(stage as any)
      
      // Enrich with related data
      const enrichedOpportunities = await Promise.all(
        opportunities.map(async (opportunity) => {
          const [contact, organization] = await Promise.all([
            opportunity.contactId ? ContactModel.findById(opportunity.contactId) : null,
            OrganizationModel.findById(opportunity.organizationId)
          ])

          return {
            ...opportunity,
            contact,
            organization
          } as Opportunity
        })
      )

      return enrichedOpportunities
    } catch (error) {
      this.handleError(error, 'Failed to get opportunities by stage')
    }
  }

  async getOpportunitiesByUser(userId: string): Promise<Opportunity[]> {
    try {
      const opportunities = await OpportunityModel.findByUser(userId)
      
      // Enrich with related data
      const enrichedOpportunities = await Promise.all(
        opportunities.map(async (opportunity) => {
          const [contact, organization] = await Promise.all([
            opportunity.contactId ? ContactModel.findById(opportunity.contactId) : null,
            OrganizationModel.findById(opportunity.organizationId)
          ])

          return {
            ...opportunity,
            contact,
            organization
          } as Opportunity
        })
      )

      return enrichedOpportunities
    } catch (error) {
      this.handleError(error, 'Failed to get opportunities by user')
    }
  }

  async getOpportunitiesClosingThisMonth(userId?: string): Promise<Opportunity[]> {
    try {
      const opportunities = await OpportunityModel.findClosingThisMonth(userId)
      
      // Enrich with related data
      const enrichedOpportunities = await Promise.all(
        opportunities.map(async (opportunity) => {
          const [contact, organization] = await Promise.all([
            opportunity.contactId ? ContactModel.findById(opportunity.contactId) : null,
            OrganizationModel.findById(opportunity.organizationId)
          ])

          return {
            ...opportunity,
            contact,
            organization
          } as Opportunity
        })
      )

      return enrichedOpportunities
    } catch (error) {
      this.handleError(error, 'Failed to get opportunities closing this month')
    }
  }

  async transitionStage(id: string, newStage: string, userId: string, reason?: string): Promise<Opportunity> {
    try {
      const opportunity = await OpportunityModel.findById(id)
      if (!opportunity) {
        throw new Error('Opportunity not found')
      }

      const transition: OpportunityStageTransition = {
        fromStage: opportunity.stage,
        toStage: newStage,
        reason,
        userId,
        date: new Date().toISOString()
      }

      // Update stage history
      const stageHistory = opportunity.stageHistory || []
      stageHistory.push(transition)

      // Auto-update probability based on stage
      let probability = opportunity.probability
      switch (newStage) {
        case 'prospecting':
          probability = 10
          break
        case 'qualification':
          probability = 25
          break
        case 'proposal':
          probability = 50
          break
        case 'negotiation':
          probability = 75
          break
        case 'closed_won':
          probability = 100
          break
        case 'closed_lost':
          probability = 0
          break
      }

      const updateData: Partial<Opportunity> = {
        stage: newStage as any,
        probability,
        stageHistory,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      }

      // Set close date if closing
      if (newStage === 'closed_won' || newStage === 'closed_lost') {
        updateData.actualCloseDate = new Date().toISOString()
        updateData.closeReason = reason
      }

      const updated = await OpportunityModel.update(id, updateData)
      
      // Log activity
      await this.logActivity(id, 'stage_transition', `Stage changed from ${opportunity.stage} to ${newStage}`, userId)
      
      return updated
    } catch (error) {
      this.handleError(error, 'Failed to transition opportunity stage')
    }
  }

  async getOpportunityAnalytics(dateRange?: { start: Date; end: Date }): Promise<OpportunityAnalytics> {
    try {
      const filters: Record<string, any> = {}
      if (dateRange) {
        filters['createdAt__gte'] = dateRange.start.toISOString()
        filters['createdAt__lte'] = dateRange.end.toISOString()
      }

      const allOpportunities = await OpportunityModel.findAll({ filters, limit: 10000 })
      
      const analytics: OpportunityAnalytics = {
        totalOpportunities: allOpportunities.length,
        totalValue: 0,
        avgValue: 0,
        avgDealSize: 0,
        conversionRate: 0,
        avgSalesCycle: 0,
        byStage: {},
        byPriority: {},
        bySource: {},
        byUser: {},
        monthlyTrends: []
      }

      let totalValue = 0
      let totalClosedWon = 0
      let totalSalesCycle = 0
      let salesCycleCount = 0
      const userStats: Record<string, { count: number; value: number; won: number }> = {}

      for (const opportunity of allOpportunities) {
        totalValue += opportunity.value

        // Count by stage
        const stageKey = opportunity.stage
        if (!analytics.byStage[stageKey]) {
          analytics.byStage[stageKey] = { count: 0, value: 0 }
        }
        analytics.byStage[stageKey].count++
        analytics.byStage[stageKey].value += opportunity.value

        // Count by priority
        if (opportunity.priority) {
          const priorityKey = opportunity.priority
          if (!analytics.byPriority[priorityKey]) {
            analytics.byPriority[priorityKey] = { count: 0, value: 0 }
          }
          analytics.byPriority[priorityKey].count++
          analytics.byPriority[priorityKey].value += opportunity.value
        }

        // Count by source
        if (opportunity.source) {
          const sourceKey = opportunity.source
          if (!analytics.bySource[sourceKey]) {
            analytics.bySource[sourceKey] = { count: 0, value: 0 }
          }
          analytics.bySource[sourceKey].count++
          analytics.bySource[sourceKey].value += opportunity.value
        }

        // Count closed won
        if (opportunity.stage === 'closed_won') {
          totalClosedWon++
        }

        // Calculate sales cycle
        if (opportunity.actualCloseDate) {
          const created = new Date(opportunity.createdAt)
          const closed = new Date(opportunity.actualCloseDate)
          const cycle = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          totalSalesCycle += cycle
          salesCycleCount++
        }

        // User stats
        if (opportunity.userId) {
          if (!userStats[opportunity.userId]) {
            userStats[opportunity.userId] = { count: 0, value: 0, won: 0 }
          }
          userStats[opportunity.userId].count++
          userStats[opportunity.userId].value += opportunity.value
          if (opportunity.stage === 'closed_won') {
            userStats[opportunity.userId].won++
          }
        }
      }

      analytics.totalValue = totalValue
      analytics.avgValue = analytics.totalOpportunities > 0 ? totalValue / analytics.totalOpportunities : 0
      analytics.avgDealSize = analytics.totalValue
      analytics.conversionRate = analytics.totalOpportunities > 0 ? (totalClosedWon / analytics.totalOpportunities) * 100 : 0
      analytics.avgSalesCycle = salesCycleCount > 0 ? totalSalesCycle / salesCycleCount : 0

      // Calculate user stats
      analytics.byUser = Object.entries(userStats).reduce((acc, [userId, stats]) => {
        acc[userId] = {
          count: stats.count,
          value: stats.value,
          winRate: stats.count > 0 ? (stats.won / stats.count) * 100 : 0
        }
        return acc
      }, {} as Record<string, { count: number; value: number; winRate: number }>)

      return analytics
    } catch (error) {
      this.handleError(error, 'Failed to get opportunity analytics')
    }
  }

  async getOpportunityForecast(period: 'month' | 'quarter' | 'year' = 'month'): Promise<OpportunityForecast> {
    try {
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear(), 11, 31)
          break
      }

      const filters = {
        'expectedCloseDate__gte': startDate.toISOString(),
        'expectedCloseDate__lte': endDate.toISOString(),
        isActive: true
      }

      const opportunities = await OpportunityModel.findAll({ filters, limit: 10000 })
      
      let totalPipeline = 0
      let weightedPipeline = 0
      let bestCase = 0
      let worstCase = 0

      for (const opportunity of opportunities) {
        totalPipeline += opportunity.value
        weightedPipeline += opportunity.value * (opportunity.probability / 100)
        
        if (opportunity.probability >= 75) {
          bestCase += opportunity.value
        }
        if (opportunity.probability <= 25) {
          worstCase += opportunity.value
        }
      }

      // Enrich opportunities with related data
      const enrichedOpportunities = await Promise.all(
        opportunities.map(async (opportunity) => {
          const [contact, organization] = await Promise.all([
            opportunity.contactId ? ContactModel.findById(opportunity.contactId) : null,
            OrganizationModel.findById(opportunity.organizationId)
          ])

          return {
            ...opportunity,
            contact,
            organization
          } as Opportunity
        })
      )

      const forecast: OpportunityForecast = {
        period: period,
        totalPipeline,
        weightedPipeline,
        bestCase,
        worstCase,
        mostLikely: weightedPipeline,
        closingThisPeriod: enrichedOpportunities.filter(opp => opp.probability >= 50),
        atRiskOpportunities: enrichedOpportunities.filter(opp => 
          opp.probability < 50 && 
          new Date(opp.expectedCloseDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
      }

      return forecast
    } catch (error) {
      this.handleError(error, 'Failed to get opportunity forecast')
    }
  }

  async getOpportunityInsights(): Promise<OpportunityInsights> {
    try {
      // TODO: Implement comprehensive insights calculation
      // This would analyze patterns in opportunity data
      return {
        topPerformers: [],
        stageAnalysis: [],
        competitorAnalysis: [],
        productPerformance: []
      }
    } catch (error) {
      this.handleError(error, 'Failed to get opportunity insights')
    }
  }

  async bulkUpdateOpportunities(opportunityIds: string[], updates: Partial<OpportunityUpdateData>, userId: string): Promise<Opportunity[]> {
    try {
      const updatedOpportunities = await Promise.all(
        opportunityIds.map(id => this.updateOpportunity(id, updates, userId))
      )

      return updatedOpportunities
    } catch (error) {
      this.handleError(error, 'Failed to bulk update opportunities')
    }
  }

  async cloneOpportunity(id: string, updates: Partial<OpportunityCreateData>, userId: string): Promise<Opportunity> {
    try {
      const existing = await OpportunityModel.findById(id)
      if (!existing) {
        throw new Error('Opportunity not found')
      }

      const cloneData: OpportunityCreateData = {
        name: `${existing.name} (Copy)`,
        description: existing.description,
        value: existing.value,
        stage: 'prospecting',
        probability: 10,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        contactId: existing.contactId,
        organizationId: existing.organizationId,
        priority: existing.priority,
        source: existing.source,
        products: existing.products,
        tags: existing.tags,
        ...updates
      }

      return await this.createOpportunity(cloneData, userId)
    } catch (error) {
      this.handleError(error, 'Failed to clone opportunity')
    }
  }

  async validateOpportunityData(data: any, isUpdate: boolean = false): Promise<Partial<Opportunity>> {
    try {
      // TODO: Implement validation using schemas
      // This would use the opportunity validation schemas
      return data
    } catch (error) {
      this.handleError(error, 'Failed to validate opportunity data')
    }
  }

  private async logActivity(opportunityId: string, type: string, description: string, userId: string): Promise<void> {
    // TODO: Implement activity logging once audit system is in place
    console.log(`[ACTIVITY] ${type} - ${description} for opportunity ${opportunityId} by user ${userId}`)
  }
}