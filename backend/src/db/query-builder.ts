import { SupabaseClient } from '@supabase/supabase-js'
import { supabase, supabaseAdmin, withRetry, CONNECTION_CONFIG } from '../config/database'

export interface QueryOptions {
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }[]
  limit?: number
  offset?: number
  timeout?: number
}

export interface TransactionOptions {
  isolationLevel?: 'READ_COMMITTED' | 'SERIALIZABLE'
  timeout?: number
}

export class QueryBuilder<T = any> {
  private client: SupabaseClient
  private tableName: string
  private queryOptions: QueryOptions = {}
  private isTransaction = false

  constructor(tableName: string, client: SupabaseClient = supabase) {
    this.tableName = tableName
    this.client = client
  }

  static table<T = any>(tableName: string): QueryBuilder<T> {
    return new QueryBuilder<T>(tableName)
  }

  static adminTable<T = any>(tableName: string): QueryBuilder<T> {
    return new QueryBuilder<T>(tableName, supabaseAdmin)
  }

  select(columns: string = '*'): this {
    this.queryOptions.select = columns
    return this
  }

  where(filters: Record<string, any>): this {
    this.queryOptions.filters = { ...this.queryOptions.filters, ...filters }
    return this
  }

  eq(column: string, value: any): this {
    return this.where({ [column]: value })
  }

  neq(column: string, value: any): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__neq`]: value 
    }
    return this
  }

  gt(column: string, value: any): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__gt`]: value 
    }
    return this
  }

  gte(column: string, value: any): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__gte`]: value 
    }
    return this
  }

  lt(column: string, value: any): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__lt`]: value 
    }
    return this
  }

  lte(column: string, value: any): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__lte`]: value 
    }
    return this
  }

  like(column: string, pattern: string): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__like`]: pattern 
    }
    return this
  }

  ilike(column: string, pattern: string): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__ilike`]: pattern 
    }
    return this
  }

  in(column: string, values: any[]): this {
    this.queryOptions.filters = { 
      ...this.queryOptions.filters, 
      [`${column}__in`]: values 
    }
    return this
  }

  orderBy(column: string, ascending: boolean = true): this {
    if (!this.queryOptions.orderBy) {
      this.queryOptions.orderBy = []
    }
    this.queryOptions.orderBy.push({ column, ascending })
    return this
  }

  limit(count: number): this {
    this.queryOptions.limit = count
    return this
  }

  offset(count: number): this {
    this.queryOptions.offset = count
    return this
  }

  timeout(ms: number): this {
    this.queryOptions.timeout = ms
    return this
  }

  private buildQuery(query: any): any {
    // Apply filters
    if (this.queryOptions.filters) {
      Object.entries(this.queryOptions.filters).forEach(([key, value]) => {
        if (key.includes('__')) {
          const [column, operator] = key.split('__')
          switch (operator) {
            case 'neq':
              query = query.neq(column, value)
              break
            case 'gt':
              query = query.gt(column, value)
              break
            case 'gte':
              query = query.gte(column, value)
              break
            case 'lt':
              query = query.lt(column, value)
              break
            case 'lte':
              query = query.lte(column, value)
              break
            case 'like':
              query = query.like(column, value)
              break
            case 'ilike':
              query = query.ilike(column, value)
              break
            case 'in':
              query = query.in(column, value)
              break
          }
        } else {
          query = query.eq(key, value)
        }
      })
    }

    // Apply ordering
    if (this.queryOptions.orderBy) {
      this.queryOptions.orderBy.forEach(({ column, ascending }) => {
        query = query.order(column, { ascending })
      })
    }

    // Apply pagination
    if (this.queryOptions.limit) {
      query = query.limit(this.queryOptions.limit)
    }

    if (this.queryOptions.offset) {
      const limit = this.queryOptions.limit || 10
      query = query.range(this.queryOptions.offset, this.queryOptions.offset + limit - 1)
    }

    return query
  }

  async find(): Promise<T[]> {
    const operation = async () => {
      let query = this.client
        .from(this.tableName)
        .select(this.queryOptions.select || '*')

      query = this.buildQuery(query)

      const { data, error } = await query

      if (error) {
        throw new Error(`Query failed for ${this.tableName}: ${error.message}`)
      }

      return data || []
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  async findOne(): Promise<T | null> {
    const operation = async () => {
      let query = this.client
        .from(this.tableName)
        .select(this.queryOptions.select || '*')

      query = this.buildQuery(query)

      const { data, error } = await query.limit(1).single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw new Error(`Query failed for ${this.tableName}: ${error.message}`)
      }

      return data
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  async count(): Promise<number> {
    const operation = async () => {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      // Apply only filters for count
      if (this.queryOptions.filters) {
        Object.entries(this.queryOptions.filters).forEach(([key, value]) => {
          if (key.includes('__')) {
            const [column, operator] = key.split('__')
            switch (operator) {
              case 'neq':
                query = query.neq(column, value)
                break
              case 'gt':
                query = query.gt(column, value)
                break
              case 'gte':
                query = query.gte(column, value)
                break
              case 'lt':
                query = query.lt(column, value)
                break
              case 'lte':
                query = query.lte(column, value)
                break
              case 'like':
                query = query.like(column, value)
                break
              case 'ilike':
                query = query.ilike(column, value)
                break
              case 'in':
                query = query.in(column, value)
                break
            }
          } else {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query

      if (error) {
        throw new Error(`Count failed for ${this.tableName}: ${error.message}`)
      }

      return count || 0
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  async insert(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const operation = async () => {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) {
        throw new Error(`Insert failed for ${this.tableName}: ${error.message}`)
      }

      return result
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  async insertMany(data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    const operation = async () => {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data)
        .select()

      if (error) {
        throw new Error(`Bulk insert failed for ${this.tableName}: ${error.message}`)
      }

      return result || []
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  async update(data: Partial<T>): Promise<T[]> {
    const operation = async () => {
      let query = this.client
        .from(this.tableName)
        .update(data)

      // Apply filters for update
      if (this.queryOptions.filters) {
        Object.entries(this.queryOptions.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { data: result, error } = await query.select()

      if (error) {
        throw new Error(`Update failed for ${this.tableName}: ${error.message}`)
      }

      return result || []
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  async delete(): Promise<void> {
    const operation = async () => {
      let query = this.client.from(this.tableName).delete()

      // Apply filters for delete
      if (this.queryOptions.filters) {
        Object.entries(this.queryOptions.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { error } = await query

      if (error) {
        throw new Error(`Delete failed for ${this.tableName}: ${error.message}`)
      }
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  async softDelete(): Promise<T[]> {
    return this.update({ deleted_at: new Date().toISOString() } as Partial<T>)
  }
}

// Transaction management
export class TransactionManager {
  private client: SupabaseClient

  constructor(client: SupabaseClient = supabase) {
    this.client = client
  }

  async execute<T>(
    operations: (client: SupabaseClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const operation = async () => {
      try {
        // Note: Supabase doesn't support explicit transactions in the traditional sense
        // Instead, we use RPC functions or batch operations for atomic operations
        return await operations(this.client)
      } catch (error) {
        throw new Error(`Transaction failed: ${error}`)
      }
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }

  static async batch<T>(operations: Promise<T>[]): Promise<T[]> {
    const operation = async () => {
      return Promise.all(operations)
    }

    return withRetry(operation, CONNECTION_CONFIG.MAX_RETRIES)
  }
}

// Query optimization and caching utilities
export class QueryCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static DEFAULT_TTL = 300000 // 5 minutes

  static set(key: string, data: any, ttl: number = QueryCache.DEFAULT_TTL): void {
    QueryCache.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  static get(key: string): any | null {
    const entry = QueryCache.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      QueryCache.cache.delete(key)
      return null
    }

    return entry.data
  }

  static clear(pattern?: string): void {
    if (pattern) {
      for (const key of QueryCache.cache.keys()) {
        if (key.includes(pattern)) {
          QueryCache.cache.delete(key)
        }
      }
    } else {
      QueryCache.cache.clear()
    }
  }

  static getStats(): { size: number; keys: string[] } {
    return {
      size: QueryCache.cache.size,
      keys: Array.from(QueryCache.cache.keys())
    }
  }
}

// Query performance analysis
export const analyzeQueryPerformance = async (
  tableName: string,
  query: () => Promise<any>
): Promise<{ result: any; executionTime: number; cacheHit: boolean }> => {
  const startTime = performance.now()
  const queryKey = `${tableName}_${JSON.stringify(query)}`
  
  // Check cache first
  const cachedResult = QueryCache.get(queryKey)
  if (cachedResult) {
    return {
      result: cachedResult,
      executionTime: 0,
      cacheHit: true
    }
  }

  try {
    const result = await query()
    const executionTime = performance.now() - startTime

    // Cache successful results
    if (result && executionTime < 1000) { // Only cache fast queries
      QueryCache.set(queryKey, result)
    }

    return {
      result,
      executionTime,
      cacheHit: false
    }
  } catch (error) {
    const executionTime = performance.now() - startTime
    console.error(`Query failed after ${executionTime}ms:`, error)
    throw error
  }
}