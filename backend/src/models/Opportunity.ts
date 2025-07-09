import { BaseModel } from './BaseModel'
import { Opportunity } from '@shared/types'

export class OpportunityModel extends BaseModel {
  protected static tableName = 'opportunities'

  static async findAll(options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}): Promise<Opportunity[]> {
    return super.findAll<Opportunity>(this.tableName, options)
  }

  static async findById(id: string): Promise<Opportunity | null> {
    return super.findById<Opportunity>(this.tableName, id)
  }

  static async create(data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Opportunity> {
    return super.create<Opportunity>(this.tableName, data)
  }

  static async update(id: string, data: Partial<Opportunity>): Promise<Opportunity> {
    return super.update<Opportunity>(this.tableName, id, data)
  }

  static async delete(id: string): Promise<void> {
    return super.delete(this.tableName, id)
  }

  static async findByOrganization(organizationId: string): Promise<Opportunity[]> {
    return this.findAll({ 
      filters: { organization_id: organizationId },
      orderBy: { column: 'expected_close_date', ascending: true }
    })
  }

  static async findByContact(contactId: string): Promise<Opportunity[]> {
    return this.findAll({ 
      filters: { contact_id: contactId },
      orderBy: { column: 'expected_close_date', ascending: true }
    })
  }

  static async findByUser(userId: string): Promise<Opportunity[]> {
    return this.findAll({ 
      filters: { user_id: userId },
      orderBy: { column: 'expected_close_date', ascending: true }
    })
  }

  static async findByStage(stage: Opportunity['stage']): Promise<Opportunity[]> {
    return this.findAll({ 
      filters: { stage },
      orderBy: { column: 'expected_close_date', ascending: true }
    })
  }

  static async findClosingThisMonth(userId?: string): Promise<Opportunity[]> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)

    const filters: Record<string, any> = {
      expected_close_date: { 
        gte: startOfMonth.toISOString(),
        lte: endOfMonth.toISOString()
      }
    }
    
    if (userId) {
      filters.user_id = userId
    }

    return this.findAll({ 
      filters,
      orderBy: { column: 'expected_close_date', ascending: true }
    })
  }

  static async calculateTotalValue(filters?: Record<string, any>): Promise<number> {
    // This would need to be implemented with a proper aggregation query
    const opportunities = await this.findAll({ filters })
    return opportunities.reduce((total, opp) => total + opp.value, 0)
  }

  static async count(filters?: Record<string, any>): Promise<number> {
    return super.count(this.tableName, filters)
  }
}