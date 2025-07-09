import { supabase } from '../config/database'

export abstract class BaseModel {
  protected static tableName: string

  static async findAll<T>(
    tableName: string,
    options: {
      select?: string
      filters?: Record<string, any>
      orderBy?: { column: string; ascending?: boolean }
      limit?: number
      offset?: number
    } = {}
  ): Promise<T[]> {
    let query = supabase.from(tableName).select(options.select || '*')

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      })
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching ${tableName}: ${error.message}`)
    }

    return data || []
  }

  static async findById<T>(tableName: string, id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Error fetching ${tableName} by ID: ${error.message}`)
    }

    return data
  }

  static async create<T>(tableName: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating ${tableName}: ${error.message}`)
    }

    return result
  }

  static async update<T>(tableName: string, id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating ${tableName}: ${error.message}`)
    }

    return result
  }

  static async delete(tableName: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Error deleting ${tableName}: ${error.message}`)
    }
  }

  static async softDelete(tableName: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Error soft deleting ${tableName}: ${error.message}`)
    }
  }

  static async count(tableName: string, filters?: Record<string, any>): Promise<number> {
    let query = supabase.from(tableName).select('*', { count: 'exact', head: true })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Error counting ${tableName}: ${error.message}`)
    }

    return count || 0
  }
}