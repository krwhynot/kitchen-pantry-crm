import { Interaction } from '@shared/types'
import { InteractionModel } from '../models/Interaction'
import { ContactModel } from '../models/Contact'
import { OrganizationModel } from '../models/Organization'
import { BaseService } from './BaseService'

export interface InteractionSearchOptions {
  query?: string
  type?: string
  contactId?: string
  organizationId?: string
  userId?: string
  startDate?: string
  endDate?: string
  outcome?: string
  isCompleted?: boolean
  limit?: number
  offset?: number
}

export interface InteractionCreateData {
  type: 'email' | 'phone' | 'meeting' | 'sms' | 'note' | 'task' | 'follow_up'
  subject: string
  description?: string
  contactId?: string
  organizationId?: string
  scheduledAt?: string
  duration?: number
  location?: string
  outcome?: string
  nextSteps?: string
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  attachments?: {
    fileName: string
    fileSize: number
    mimeType: string
    fileUrl: string
  }[]
  communicationChannel?: {
    platform: string
    channelId: string
    messageId?: string
  }
}

export interface InteractionUpdateData extends Partial<InteractionCreateData> {
  completedAt?: string
  cancelled?: boolean
  cancelReason?: string
}

export interface InteractionTemplate {
  id: string
  name: string
  type: string
  subject: string
  description: string
  duration: number
  tags: string[]
  isActive: boolean
}

export interface InteractionAnalytics {
  totalInteractions: number
  completedInteractions: number
  pendingInteractions: number
  cancelledInteractions: number
  byType: Record<string, number>
  byOutcome: Record<string, number>
  byPriority: Record<string, number>
  avgDuration: number
  completionRate: number
  responseRate: number
  topPerformers: {
    userId: string
    userName: string
    interactionCount: number
    completionRate: number
  }[]
}

export interface InteractionInsights {
  bestTimeToContact: {
    dayOfWeek: string
    hourOfDay: number
    successRate: number
  }[]
  mostEffectiveChannels: {
    type: string
    successRate: number
    avgResponseTime: number
  }[]
  customerEngagementTrends: {
    month: string
    totalInteractions: number
    completionRate: number
  }[]
  upcomingFollowUps: Interaction[]
}

export interface InteractionAutomationRule {
  id: string
  name: string
  trigger: {
    type: 'time_based' | 'event_based' | 'condition_based'
    conditions: Record<string, any>
  }
  actions: {
    type: 'create_interaction' | 'send_notification' | 'update_contact'
    parameters: Record<string, any>
  }[]
  isActive: boolean
}

export class InteractionService extends BaseService {
  constructor() {
    super()
  }

  async createInteraction(data: InteractionCreateData, userId: string): Promise<Interaction> {
    try {
      // Validate contact exists if provided
      if (data.contactId) {
        const contact = await ContactModel.findById(data.contactId)
        if (!contact) {
          throw new Error('Contact not found')
        }
        // If contact is provided but not organization, use contact's organization
        if (!data.organizationId) {
          data.organizationId = contact.organizationId
        }
      }

      // Validate organization exists if provided
      if (data.organizationId) {
        const organization = await OrganizationModel.findById(data.organizationId)
        if (!organization) {
          throw new Error('Organization not found')
        }
      }

      // Validate scheduled time is in future if provided
      if (data.scheduledAt) {
        const scheduledTime = new Date(data.scheduledAt)
        if (scheduledTime < new Date()) {
          throw new Error('Scheduled time must be in the future')
        }
      }

      // Create interaction with audit info
      const interactionData = {
        ...data,
        userId,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCompleted: false,
        cancelled: false
      }

      const interaction = await InteractionModel.create(interactionData)
      
      // Log activity
      await this.logActivity(interaction.id, 'create', 'Interaction created', userId)
      
      return interaction
    } catch (error) {
      this.handleError(error, 'Failed to create interaction')
    }
  }

  async updateInteraction(id: string, data: InteractionUpdateData, userId: string): Promise<Interaction> {
    try {
      const existing = await InteractionModel.findById(id)
      if (!existing) {
        throw new Error('Interaction not found')
      }

      // Validate contact if changing
      if (data.contactId && data.contactId !== existing.contactId) {
        const contact = await ContactModel.findById(data.contactId)
        if (!contact) {
          throw new Error('Contact not found')
        }
      }

      // Validate organization if changing
      if (data.organizationId && data.organizationId !== existing.organizationId) {
        const organization = await OrganizationModel.findById(data.organizationId)
        if (!organization) {
          throw new Error('Organization not found')
        }
      }

      // Auto-complete if marking as completed
      if (data.completedAt && !existing.completedAt) {
        data.isCompleted = true
      }

      const updateData = {
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      }

      const updated = await InteractionModel.update(id, updateData)
      
      // Log activity
      await this.logActivity(id, 'update', 'Interaction updated', userId)
      
      return updated
    } catch (error) {
      this.handleError(error, 'Failed to update interaction')
    }
  }

  async deleteInteraction(id: string, userId: string): Promise<void> {
    try {
      const existing = await InteractionModel.findById(id)
      if (!existing) {
        throw new Error('Interaction not found')
      }

      // Soft delete
      await InteractionModel.update(id, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: userId
      } as Partial<Interaction>)

      // Log activity
      await this.logActivity(id, 'delete', 'Interaction deleted', userId)
    } catch (error) {
      this.handleError(error, 'Failed to delete interaction')
    }
  }

  async getInteractionById(id: string): Promise<Interaction | null> {
    try {
      const interaction = await InteractionModel.findById(id)
      if (!interaction) {
        return null
      }

      // Enrich with related data
      const [contact, organization] = await Promise.all([
        interaction.contactId ? ContactModel.findById(interaction.contactId) : null,
        interaction.organizationId ? OrganizationModel.findById(interaction.organizationId) : null
      ])

      return {
        ...interaction,
        contact,
        organization
      } as Interaction
    } catch (error) {
      this.handleError(error, 'Failed to retrieve interaction')
    }
  }

  async searchInteractions(options: InteractionSearchOptions = {}): Promise<{
    data: Interaction[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const { query, limit = 20, offset = 0, startDate, endDate, ...filters } = options
      
      // Add date range filters
      if (startDate) {
        filters['createdAt__gte'] = startDate
      }
      if (endDate) {
        filters['createdAt__lte'] = endDate
      }

      let interactions: Interaction[]
      let total: number

      const result = await InteractionModel.findAll({
        filters,
        limit,
        offset,
        orderBy: { column: 'createdAt', ascending: false }
      })

      interactions = result
      total = await InteractionModel.count(filters)

      // Enrich with related data
      const enrichedInteractions = await Promise.all(
        interactions.map(async (interaction) => {
          const [contact, organization] = await Promise.all([
            interaction.contactId ? ContactModel.findById(interaction.contactId) : null,
            interaction.organizationId ? OrganizationModel.findById(interaction.organizationId) : null
          ])

          return {
            ...interaction,
            contact,
            organization
          } as Interaction
        })
      )

      return {
        data: enrichedInteractions,
        total,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      this.handleError(error, 'Failed to search interactions')
    }
  }

  async getInteractionsByContact(contactId: string, options: {
    limit?: number
    offset?: number
    includeCompleted?: boolean
  } = {}): Promise<{
    data: Interaction[]
    total: number
  }> {
    try {
      const filters: Record<string, any> = { contactId }
      if (!options.includeCompleted) {
        filters.isCompleted = false
      }

      const interactions = await InteractionModel.findAll({
        filters,
        limit: options.limit,
        offset: options.offset,
        orderBy: { column: 'createdAt', ascending: false }
      })

      const total = await InteractionModel.count(filters)

      return {
        data: interactions,
        total
      }
    } catch (error) {
      this.handleError(error, 'Failed to get interactions by contact')
    }
  }

  async getInteractionsByOrganization(organizationId: string, options: {
    limit?: number
    offset?: number
    includeCompleted?: boolean
  } = {}): Promise<{
    data: Interaction[]
    total: number
  }> {
    try {
      const filters: Record<string, any> = { organizationId }
      if (!options.includeCompleted) {
        filters.isCompleted = false
      }

      const interactions = await InteractionModel.findAll({
        filters,
        limit: options.limit,
        offset: options.offset,
        orderBy: { column: 'createdAt', ascending: false }
      })

      const total = await InteractionModel.count(filters)

      return {
        data: interactions,
        total
      }
    } catch (error) {
      this.handleError(error, 'Failed to get interactions by organization')
    }
  }

  async getScheduledInteractions(userId?: string): Promise<Interaction[]> {
    try {
      const scheduled = await InteractionModel.findScheduled(userId)
      
      // Enrich with related data
      const enrichedInteractions = await Promise.all(
        scheduled.map(async (interaction) => {
          const [contact, organization] = await Promise.all([
            interaction.contactId ? ContactModel.findById(interaction.contactId) : null,
            interaction.organizationId ? OrganizationModel.findById(interaction.organizationId) : null
          ])

          return {
            ...interaction,
            contact,
            organization
          } as Interaction
        })
      )

      return enrichedInteractions
    } catch (error) {
      this.handleError(error, 'Failed to get scheduled interactions')
    }
  }

  async completeInteraction(id: string, outcome: string, nextSteps?: string, userId?: string): Promise<Interaction> {
    try {
      const updateData: InteractionUpdateData = {
        completedAt: new Date().toISOString(),
        outcome,
        nextSteps,
        isCompleted: true
      }

      const updated = await this.updateInteraction(id, updateData, userId || 'system')
      
      // Create follow-up interaction if next steps are provided
      if (nextSteps) {
        await this.createFollowUpInteraction(id, nextSteps, userId || 'system')
      }

      return updated
    } catch (error) {
      this.handleError(error, 'Failed to complete interaction')
    }
  }

  async cancelInteraction(id: string, reason: string, userId: string): Promise<Interaction> {
    try {
      const updateData: InteractionUpdateData = {
        cancelled: true,
        cancelReason: reason,
        completedAt: new Date().toISOString()
      }

      return await this.updateInteraction(id, updateData, userId)
    } catch (error) {
      this.handleError(error, 'Failed to cancel interaction')
    }
  }

  async rescheduleInteraction(id: string, newScheduledAt: string, userId: string): Promise<Interaction> {
    try {
      const newTime = new Date(newScheduledAt)
      if (newTime < new Date()) {
        throw new Error('Rescheduled time must be in the future')
      }

      const updateData: InteractionUpdateData = {
        scheduledAt: newScheduledAt
      }

      return await this.updateInteraction(id, updateData, userId)
    } catch (error) {
      this.handleError(error, 'Failed to reschedule interaction')
    }
  }

  async getInteractionAnalytics(dateRange?: { start: Date; end: Date }): Promise<InteractionAnalytics> {
    try {
      const filters: Record<string, any> = {}
      if (dateRange) {
        filters['createdAt__gte'] = dateRange.start.toISOString()
        filters['createdAt__lte'] = dateRange.end.toISOString()
      }

      const allInteractions = await InteractionModel.findAll({ filters, limit: 10000 })
      
      const analytics: InteractionAnalytics = {
        totalInteractions: allInteractions.length,
        completedInteractions: 0,
        pendingInteractions: 0,
        cancelledInteractions: 0,
        byType: {},
        byOutcome: {},
        byPriority: {},
        avgDuration: 0,
        completionRate: 0,
        responseRate: 0,
        topPerformers: []
      }

      let totalDuration = 0
      let durationCount = 0
      const userStats: Record<string, { count: number; completed: number }> = {}

      for (const interaction of allInteractions) {
        // Count by completion status
        if (interaction.cancelled) {
          analytics.cancelledInteractions++
        } else if (interaction.isCompleted) {
          analytics.completedInteractions++
        } else {
          analytics.pendingInteractions++
        }

        // Count by type
        analytics.byType[interaction.type] = (analytics.byType[interaction.type] || 0) + 1

        // Count by outcome
        if (interaction.outcome) {
          analytics.byOutcome[interaction.outcome] = (analytics.byOutcome[interaction.outcome] || 0) + 1
        }

        // Count by priority
        if (interaction.priority) {
          analytics.byPriority[interaction.priority] = (analytics.byPriority[interaction.priority] || 0) + 1
        }

        // Calculate duration
        if (interaction.duration) {
          totalDuration += interaction.duration
          durationCount++
        }

        // User performance stats
        if (interaction.userId) {
          if (!userStats[interaction.userId]) {
            userStats[interaction.userId] = { count: 0, completed: 0 }
          }
          userStats[interaction.userId].count++
          if (interaction.isCompleted) {
            userStats[interaction.userId].completed++
          }
        }
      }

      analytics.avgDuration = durationCount > 0 ? totalDuration / durationCount : 0
      analytics.completionRate = analytics.totalInteractions > 0 ? 
        (analytics.completedInteractions / analytics.totalInteractions) * 100 : 0

      // Calculate top performers
      analytics.topPerformers = Object.entries(userStats)
        .map(([userId, stats]) => ({
          userId,
          userName: 'User', // TODO: Get actual user name
          interactionCount: stats.count,
          completionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0
        }))
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 10)

      return analytics
    } catch (error) {
      this.handleError(error, 'Failed to get interaction analytics')
    }
  }

  async getInteractionInsights(userId?: string): Promise<InteractionInsights> {
    try {
      // TODO: Implement comprehensive insights calculation
      // This would analyze patterns in interaction data
      return {
        bestTimeToContact: [],
        mostEffectiveChannels: [],
        customerEngagementTrends: [],
        upcomingFollowUps: []
      }
    } catch (error) {
      this.handleError(error, 'Failed to get interaction insights')
    }
  }

  async createInteractionTemplate(template: Omit<InteractionTemplate, 'id'>, userId: string): Promise<InteractionTemplate> {
    try {
      // TODO: Implement template storage
      // This would store reusable interaction templates
      const templateData = {
        ...template,
        id: this.generateId(),
        createdBy: userId,
        createdAt: new Date().toISOString()
      }

      return templateData
    } catch (error) {
      this.handleError(error, 'Failed to create interaction template')
    }
  }

  async getInteractionTemplates(userId?: string): Promise<InteractionTemplate[]> {
    try {
      // TODO: Implement template retrieval
      // This would get templates available to the user
      return []
    } catch (error) {
      this.handleError(error, 'Failed to get interaction templates')
    }
  }

  async bulkUpdateInteractions(interactionIds: string[], updates: Partial<InteractionUpdateData>, userId: string): Promise<Interaction[]> {
    try {
      const updatedInteractions = await Promise.all(
        interactionIds.map(id => this.updateInteraction(id, updates, userId))
      )

      return updatedInteractions
    } catch (error) {
      this.handleError(error, 'Failed to bulk update interactions')
    }
  }

  async createFollowUpInteraction(parentId: string, nextSteps: string, userId: string): Promise<Interaction> {
    try {
      const parentInteraction = await InteractionModel.findById(parentId)
      if (!parentInteraction) {
        throw new Error('Parent interaction not found')
      }

      const followUpData: InteractionCreateData = {
        type: 'follow_up',
        subject: `Follow-up: ${parentInteraction.subject}`,
        description: nextSteps,
        contactId: parentInteraction.contactId,
        organizationId: parentInteraction.organizationId,
        priority: parentInteraction.priority,
        parentInteractionId: parentId
      }

      return await this.createInteraction(followUpData, userId)
    } catch (error) {
      this.handleError(error, 'Failed to create follow-up interaction')
    }
  }

  async getInteractionChain(interactionId: string): Promise<Interaction[]> {
    try {
      // TODO: Implement interaction chain retrieval
      // This would get all related interactions (parent and children)
      return []
    } catch (error) {
      this.handleError(error, 'Failed to get interaction chain')
    }
  }

  async validateInteractionData(data: any, isUpdate: boolean = false): Promise<Partial<Interaction>> {
    try {
      // TODO: Implement validation using schemas
      // This would use the interaction validation schemas
      return data
    } catch (error) {
      this.handleError(error, 'Failed to validate interaction data')
    }
  }

  private async logActivity(interactionId: string, type: string, description: string, userId: string): Promise<void> {
    // TODO: Implement activity logging once audit system is in place
    console.log(`[ACTIVITY] ${type} - ${description} for interaction ${interactionId} by user ${userId}`)
  }
}