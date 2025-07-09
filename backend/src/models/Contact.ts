import { BaseModel } from './BaseModel'
import { Contact } from '@shared/types'

export class ContactModel extends BaseModel {
  protected static tableName = 'contacts'

  static async findAll(options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}): Promise<Contact[]> {
    return super.findAll<Contact>(this.tableName, options)
  }

  static async findById(id: string): Promise<Contact | null> {
    return super.findById<Contact>(this.tableName, id)
  }

  static async create(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    return super.create<Contact>(this.tableName, data)
  }

  static async update(id: string, data: Partial<Contact>): Promise<Contact> {
    return super.update<Contact>(this.tableName, id, data)
  }

  static async delete(id: string): Promise<void> {
    return super.delete(this.tableName, id)
  }

  static async findByOrganization(organizationId: string): Promise<Contact[]> {
    return this.findAll({ filters: { organization_id: organizationId } })
  }

  static async findDecisionMakers(organizationId?: string): Promise<Contact[]> {
    const filters: Record<string, any> = { is_decision_maker: true }
    if (organizationId) {
      filters.organization_id = organizationId
    }
    return this.findAll({ filters })
  }

  static async searchByName(name: string): Promise<Contact[]> {
    return this.findAll({
      filters: { 
        first_name: `%${name}%`,
        last_name: `%${name}%` 
      }
    })
  }

  static async findByEmail(email: string): Promise<Contact | null> {
    const contacts = await this.findAll({ filters: { email } })
    return contacts[0] || null
  }

  static async count(filters?: Record<string, any>): Promise<number> {
    return super.count(this.tableName, filters)
  }
}