import { BaseModel } from './BaseModel'
import { Organization } from '@shared/types'

export class OrganizationModel extends BaseModel {
  protected static tableName = 'organizations'

  static async findAll(options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}): Promise<Organization[]> {
    return super.findAll<Organization>(this.tableName, options)
  }

  static async findById(id: string): Promise<Organization | null> {
    return super.findById<Organization>(this.tableName, id)
  }

  static async create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    return super.create<Organization>(this.tableName, data)
  }

  static async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return super.update<Organization>(this.tableName, id, data)
  }

  static async delete(id: string): Promise<void> {
    return super.delete(this.tableName, id)
  }

  static async findByType(type: Organization['type']): Promise<Organization[]> {
    return this.findAll({ filters: { type } })
  }

  static async findChildren(parentId: string): Promise<Organization[]> {
    return this.findAll({ filters: { parent_id: parentId } })
  }

  static async searchByName(name: string): Promise<Organization[]> {
    return this.findAll({
      filters: { name: `%${name}%` }
    })
  }

  static async count(filters?: Record<string, any>): Promise<number> {
    return super.count(this.tableName, filters)
  }
}