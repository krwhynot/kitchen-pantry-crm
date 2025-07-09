import { BaseModel } from './BaseModel'
import { Interaction } from '@shared/types'

export class InteractionModel extends BaseModel {
  protected static tableName = 'interactions'

  static async findAll(options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}): Promise<Interaction[]> {
    return super.findAll<Interaction>(this.tableName, options)
  }

  static async findById(id: string): Promise<Interaction | null> {
    return super.findById<Interaction>(this.tableName, id)
  }

  static async create(data: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interaction> {
    return super.create<Interaction>(this.tableName, data)
  }

  static async update(id: string, data: Partial<Interaction>): Promise<Interaction> {
    return super.update<Interaction>(this.tableName, id, data)
  }

  static async delete(id: string): Promise<void> {
    return super.delete(this.tableName, id)
  }

  static async findByContact(contactId: string): Promise<Interaction[]> {
    return this.findAll({ 
      filters: { contact_id: contactId },
      orderBy: { column: 'created_at', ascending: false }
    })
  }

  static async findByOrganization(organizationId: string): Promise<Interaction[]> {
    return this.findAll({ 
      filters: { organization_id: organizationId },
      orderBy: { column: 'created_at', ascending: false }
    })
  }

  static async findByUser(userId: string): Promise<Interaction[]> {
    return this.findAll({ 
      filters: { user_id: userId },
      orderBy: { column: 'created_at', ascending: false }
    })
  }

  static async findByType(type: Interaction['type']): Promise<Interaction[]> {
    return this.findAll({ 
      filters: { type },
      orderBy: { column: 'created_at', ascending: false }
    })
  }

  static async findScheduled(userId?: string): Promise<Interaction[]> {
    const filters: Record<string, any> = { 
      completed_at: null,
      scheduled_at: { gte: new Date().toISOString() }
    }
    if (userId) {
      filters.user_id = userId
    }
    return this.findAll({ 
      filters,
      orderBy: { column: 'scheduled_at', ascending: true }
    })
  }

  static async count(filters?: Record<string, any>): Promise<number> {
    return super.count(this.tableName, filters)
  }
}