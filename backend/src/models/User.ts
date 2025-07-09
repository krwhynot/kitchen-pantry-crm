import { BaseModel } from './BaseModel'
import { User } from '@shared/types'

export class UserModel extends BaseModel {
  protected static tableName = 'users'

  static async findAll(options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}): Promise<User[]> {
    return super.findAll<User>(this.tableName, options)
  }

  static async findById(id: string): Promise<User | null> {
    return super.findById<User>(this.tableName, id)
  }

  static async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return super.create<User>(this.tableName, data)
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    return super.update<User>(this.tableName, id, data)
  }

  static async delete(id: string): Promise<void> {
    return super.delete(this.tableName, id)
  }

  static async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll({ filters: { email } })
    return users[0] || null
  }

  static async findByOrganization(organizationId: string): Promise<User[]> {
    return this.findAll({ 
      filters: { organization_id: organizationId },
      orderBy: { column: 'first_name', ascending: true }
    })
  }

  static async findByRole(role: User['role']): Promise<User[]> {
    return this.findAll({ 
      filters: { role },
      orderBy: { column: 'first_name', ascending: true }
    })
  }

  static async findAdmins(): Promise<User[]> {
    return this.findByRole('admin')
  }

  static async findManagers(): Promise<User[]> {
    return this.findByRole('manager')
  }

  static async findSalesReps(): Promise<User[]> {
    return this.findByRole('sales_rep')
  }

  static async searchByName(name: string): Promise<User[]> {
    return this.findAll({
      filters: { 
        first_name: `%${name}%`,
        last_name: `%${name}%` 
      },
      orderBy: { column: 'first_name', ascending: true }
    })
  }

  static async count(filters?: Record<string, any>): Promise<number> {
    return super.count(this.tableName, filters)
  }
}