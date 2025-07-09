import { Contact } from '@shared/types'
import { ContactModel } from '../models/Contact'
import { OrganizationModel } from '../models/Organization'
import { BaseService } from './BaseService'

export interface ContactSearchOptions {
  query?: string
  organizationId?: string
  role?: string
  isDecisionMaker?: boolean
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface ContactCreateData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  organizationId: string
  role?: string
  title?: string
  department?: string
  isDecisionMaker?: boolean
  influenceLevel?: 'low' | 'medium' | 'high'
  communicationPreferences?: {
    email: boolean
    phone: boolean
    sms: boolean
    inPerson: boolean
  }
  socialProfiles?: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  notes?: string
}

export interface ContactUpdateData extends Partial<ContactCreateData> {
  isActive?: boolean
}

export interface ContactRelationship {
  contactId: string
  relatedContactId: string
  relationshipType: 'reports_to' | 'colleagues' | 'collaborates_with' | 'mentor' | 'mentee'
  strength: 'weak' | 'moderate' | 'strong'
  notes?: string
}

export interface ContactCommunicationHistory {
  id: string
  type: 'email' | 'phone' | 'meeting' | 'sms' | 'note'
  subject: string
  summary: string
  date: string
  userId: string
  userName: string
  outcome?: string
  nextAction?: string
}

export interface ContactEngagementMetrics {
  totalInteractions: number
  lastInteractionDate: string | null
  avgResponseTime: number
  responseRate: number
  meetingCount: number
  emailCount: number
  phoneCount: number
  engagementScore: number
  influenceScore: number
}

export interface ContactAnalytics {
  totalContacts: number
  byRole: Record<string, number>
  byDepartment: Record<string, number>
  byInfluenceLevel: Record<string, number>
  decisionMakersCount: number
  activeCount: number
  inactiveCount: number
  avgEngagementScore: number
  topEngagedContacts: Contact[]
}

export class ContactService extends BaseService {
  constructor() {
    super()
  }

  async createContact(data: ContactCreateData, userId: string): Promise<Contact> {
    try {
      // Validate organization exists
      const organization = await OrganizationModel.findById(data.organizationId)
      if (!organization) {
        throw new Error('Organization not found')
      }

      // Check for duplicate email
      if (data.email) {
        const existingContact = await ContactModel.findByEmail(data.email)
        if (existingContact) {
          throw new Error(`Contact with email "${data.email}" already exists`)
        }
      }

      // Create contact with audit info
      const contactData = {
        ...data,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const contact = await ContactModel.create(contactData)
      
      // Log activity
      await this.logActivity(contact.id, 'create', 'Contact created', userId)
      
      return contact
    } catch (error) {
      this.handleError(error, 'Failed to create contact')
    }
  }

  async updateContact(id: string, data: ContactUpdateData, userId: string): Promise<Contact> {
    try {
      const existing = await ContactModel.findById(id)
      if (!existing) {
        throw new Error('Contact not found')
      }

      // Check for duplicate email if email is changing
      if (data.email && data.email !== existing.email) {
        const existingContact = await ContactModel.findByEmail(data.email)
        if (existingContact) {
          throw new Error(`Contact with email "${data.email}" already exists`)
        }
      }

      // Validate organization if changing
      if (data.organizationId && data.organizationId !== existing.organizationId) {
        const organization = await OrganizationModel.findById(data.organizationId)
        if (!organization) {
          throw new Error('Organization not found')
        }
      }

      const updateData = {
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      }

      const updated = await ContactModel.update(id, updateData)
      
      // Log activity
      await this.logActivity(id, 'update', 'Contact updated', userId)
      
      return updated
    } catch (error) {
      this.handleError(error, 'Failed to update contact')
    }
  }

  async deleteContact(id: string, userId: string): Promise<void> {
    try {
      const existing = await ContactModel.findById(id)
      if (!existing) {
        throw new Error('Contact not found')
      }

      // Soft delete
      await ContactModel.update(id, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: userId
      } as Partial<Contact>)

      // Log activity
      await this.logActivity(id, 'delete', 'Contact deleted', userId)
    } catch (error) {
      this.handleError(error, 'Failed to delete contact')
    }
  }

  async getContactById(id: string): Promise<Contact | null> {
    try {
      const contact = await ContactModel.findById(id)
      if (!contact) {
        return null
      }

      // Include organization data
      const organization = await OrganizationModel.findById(contact.organizationId)
      return {
        ...contact,
        organization
      } as Contact
    } catch (error) {
      this.handleError(error, 'Failed to retrieve contact')
    }
  }

  async searchContacts(options: ContactSearchOptions = {}): Promise<{
    data: Contact[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const { query, limit = 20, offset = 0, ...filters } = options
      
      let contacts: Contact[]
      let total: number

      if (query) {
        contacts = await ContactModel.searchByName(query)
        total = contacts.length
      } else {
        const result = await ContactModel.findAll({
          filters,
          limit,
          offset
        })
        contacts = result
        total = await ContactModel.count(filters)
      }

      // Include organization data for each contact
      const enrichedContacts = await Promise.all(
        contacts.map(async (contact) => {
          const organization = await OrganizationModel.findById(contact.organizationId)
          return {
            ...contact,
            organization
          } as Contact
        })
      )

      return {
        data: enrichedContacts,
        total,
        page: Math.floor(offset / limit) + 1,
        limit
      }
    } catch (error) {
      this.handleError(error, 'Failed to search contacts')
    }
  }

  async getContactsByOrganization(organizationId: string, options: {
    includeInactive?: boolean
    limit?: number
    offset?: number
  } = {}): Promise<{
    data: Contact[]
    total: number
  }> {
    try {
      const filters: Record<string, any> = { organizationId }
      if (!options.includeInactive) {
        filters.isActive = true
      }

      const contacts = await ContactModel.findAll({
        filters,
        limit: options.limit,
        offset: options.offset
      })

      const total = await ContactModel.count(filters)

      return {
        data: contacts,
        total
      }
    } catch (error) {
      this.handleError(error, 'Failed to get contacts by organization')
    }
  }

  async getDecisionMakers(organizationId?: string): Promise<Contact[]> {
    try {
      const decisionMakers = await ContactModel.findDecisionMakers(organizationId)
      
      // Include organization data for each contact
      const enrichedContacts = await Promise.all(
        decisionMakers.map(async (contact) => {
          const organization = await OrganizationModel.findById(contact.organizationId)
          return {
            ...contact,
            organization
          } as Contact
        })
      )

      return enrichedContacts
    } catch (error) {
      this.handleError(error, 'Failed to get decision makers')
    }
  }

  async createContactRelationship(relationship: ContactRelationship, userId: string): Promise<void> {
    try {
      // Validate both contacts exist
      const [contact1, contact2] = await Promise.all([
        ContactModel.findById(relationship.contactId),
        ContactModel.findById(relationship.relatedContactId)
      ])

      if (!contact1 || !contact2) {
        throw new Error('One or both contacts not found')
      }

      // TODO: Implement contact relationship storage
      // This would need a separate relationships table
      
      // Log activity for both contacts
      await Promise.all([
        this.logActivity(relationship.contactId, 'relationship', 
          `Added ${relationship.relationshipType} relationship with ${contact2.firstName} ${contact2.lastName}`, userId),
        this.logActivity(relationship.relatedContactId, 'relationship', 
          `Added ${relationship.relationshipType} relationship with ${contact1.firstName} ${contact1.lastName}`, userId)
      ])
    } catch (error) {
      this.handleError(error, 'Failed to create contact relationship')
    }
  }

  async getContactRelationships(contactId: string): Promise<ContactRelationship[]> {
    try {
      // TODO: Implement contact relationship retrieval
      // This would need a separate relationships table
      return []
    } catch (error) {
      this.handleError(error, 'Failed to get contact relationships')
    }
  }

  async getContactCommunicationHistory(contactId: string, limit: number = 50): Promise<ContactCommunicationHistory[]> {
    try {
      const contact = await ContactModel.findById(contactId)
      if (!contact) {
        throw new Error('Contact not found')
      }

      // TODO: Implement communication history retrieval
      // This would integrate with the interaction tracking system
      return []
    } catch (error) {
      this.handleError(error, 'Failed to get contact communication history')
    }
  }

  async getContactEngagementMetrics(contactId: string): Promise<ContactEngagementMetrics> {
    try {
      const contact = await ContactModel.findById(contactId)
      if (!contact) {
        throw new Error('Contact not found')
      }

      // TODO: Implement engagement metrics calculation
      // This would integrate with the interaction tracking system
      return {
        totalInteractions: 0,
        lastInteractionDate: null,
        avgResponseTime: 0,
        responseRate: 0,
        meetingCount: 0,
        emailCount: 0,
        phoneCount: 0,
        engagementScore: 0,
        influenceScore: 0
      }
    } catch (error) {
      this.handleError(error, 'Failed to get contact engagement metrics')
    }
  }

  async getContactAnalytics(dateRange?: { start: Date; end: Date }): Promise<ContactAnalytics> {
    try {
      // Get all contacts for analysis
      const allContacts = await ContactModel.findAll({ limit: 10000 })
      
      const analytics: ContactAnalytics = {
        totalContacts: allContacts.length,
        byRole: {},
        byDepartment: {},
        byInfluenceLevel: {},
        decisionMakersCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        avgEngagementScore: 0,
        topEngagedContacts: []
      }

      let totalEngagement = 0
      let engagementCount = 0

      for (const contact of allContacts) {
        // Count by role
        if (contact.role) {
          analytics.byRole[contact.role] = (analytics.byRole[contact.role] || 0) + 1
        }

        // Count by department
        if (contact.department) {
          analytics.byDepartment[contact.department] = (analytics.byDepartment[contact.department] || 0) + 1
        }

        // Count by influence level
        if (contact.influenceLevel) {
          analytics.byInfluenceLevel[contact.influenceLevel] = (analytics.byInfluenceLevel[contact.influenceLevel] || 0) + 1
        }

        // Count decision makers
        if (contact.isDecisionMaker) {
          analytics.decisionMakersCount++
        }

        // Count active/inactive
        if (contact.isActive) {
          analytics.activeCount++
        } else {
          analytics.inactiveCount++
        }

        // Calculate engagement (placeholder)
        const engagementScore = 0 // TODO: Calculate from interactions
        totalEngagement += engagementScore
        engagementCount++
      }

      analytics.avgEngagementScore = engagementCount > 0 ? totalEngagement / engagementCount : 0

      // TODO: Calculate top engaged contacts based on interaction data
      analytics.topEngagedContacts = allContacts.slice(0, 10)

      return analytics
    } catch (error) {
      this.handleError(error, 'Failed to get contact analytics')
    }
  }

  async bulkUpdateContacts(contactIds: string[], updates: Partial<ContactUpdateData>, userId: string): Promise<Contact[]> {
    try {
      const updatedContacts = await Promise.all(
        contactIds.map(id => this.updateContact(id, updates, userId))
      )

      return updatedContacts
    } catch (error) {
      this.handleError(error, 'Failed to bulk update contacts')
    }
  }

  async importContacts(contacts: ContactCreateData[], userId: string): Promise<{
    successful: Contact[]
    failed: { contact: ContactCreateData; error: string }[]
  }> {
    try {
      const successful: Contact[] = []
      const failed: { contact: ContactCreateData; error: string }[] = []

      for (const contactData of contacts) {
        try {
          const contact = await this.createContact(contactData, userId)
          successful.push(contact)
        } catch (error) {
          failed.push({
            contact: contactData,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return { successful, failed }
    } catch (error) {
      this.handleError(error, 'Failed to import contacts')
    }
  }

  async exportContacts(organizationId?: string): Promise<Contact[]> {
    try {
      const filters: Record<string, any> = { isActive: true }
      if (organizationId) {
        filters.organizationId = organizationId
      }

      const contacts = await ContactModel.findAll({ filters, limit: 10000 })
      
      // Include organization data for each contact
      const enrichedContacts = await Promise.all(
        contacts.map(async (contact) => {
          const organization = await OrganizationModel.findById(contact.organizationId)
          return {
            ...contact,
            organization
          } as Contact
        })
      )

      return enrichedContacts
    } catch (error) {
      this.handleError(error, 'Failed to export contacts')
    }
  }

  async findDuplicateContacts(): Promise<{
    duplicates: Contact[][]
    totalDuplicates: number
  }> {
    try {
      // TODO: Implement duplicate detection logic
      // This would check for matching email, phone, or name combinations
      return {
        duplicates: [],
        totalDuplicates: 0
      }
    } catch (error) {
      this.handleError(error, 'Failed to find duplicate contacts')
    }
  }

  async mergeContacts(targetId: string, sourceId: string, userId: string): Promise<Contact> {
    try {
      if (targetId === sourceId) {
        throw new Error('Cannot merge contact with itself')
      }

      const [target, source] = await Promise.all([
        ContactModel.findById(targetId),
        ContactModel.findById(sourceId)
      ])

      if (!target || !source) {
        throw new Error('One or both contacts not found')
      }

      // Merge logic: combine data from source into target
      const mergedData: Partial<Contact> = {
        // Keep target's primary data but merge additional information
        phone: target.phone || source.phone,
        email: target.email || source.email,
        title: target.title || source.title,
        department: target.department || source.department,
        notes: [target.notes, source.notes].filter(Boolean).join('\n\n'),
        // Use higher influence level
        influenceLevel: target.influenceLevel === 'high' ? 'high' : 
                       source.influenceLevel === 'high' ? 'high' :
                       target.influenceLevel === 'medium' ? 'medium' : source.influenceLevel,
        isDecisionMaker: target.isDecisionMaker || source.isDecisionMaker,
        // Update timestamps
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      }

      // Update target with merged data
      const updated = await ContactModel.update(targetId, mergedData)

      // Mark source as merged (soft delete with reference)
      await ContactModel.update(sourceId, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        mergedIntoId: targetId
      } as Partial<Contact>)

      // Log activity for both contacts
      await Promise.all([
        this.logActivity(targetId, 'merge', `Merged with contact ${source.firstName} ${source.lastName}`, userId),
        this.logActivity(sourceId, 'merge', `Merged into contact ${target.firstName} ${target.lastName}`, userId)
      ])

      return updated
    } catch (error) {
      this.handleError(error, 'Failed to merge contacts')
    }
  }

  async validateContactData(data: any, isUpdate: boolean = false): Promise<Partial<Contact>> {
    try {
      // TODO: Implement validation using schemas
      // This would use the contact validation schemas
      return data
    } catch (error) {
      this.handleError(error, 'Failed to validate contact data')
    }
  }

  private async logActivity(contactId: string, type: string, description: string, userId: string): Promise<void> {
    // TODO: Implement activity logging once audit system is in place
    console.log(`[ACTIVITY] ${type} - ${description} for contact ${contactId} by user ${userId}`)
  }
}