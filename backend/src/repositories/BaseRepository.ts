import { QueryBuilder, QueryOptions, TransactionManager, analyzeQueryPerformance } from '../db/query-builder'
import { DataSanitizer, DataNormalizer, DataIntegrityValidator } from '../validation/sanitization'
import { logDatabaseOperation } from '../config/database'

export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface RepositoryOptions {
  enableAuditLog?: boolean
  enablePerformanceAnalysis?: boolean
  enableCaching?: boolean
  sanitizeData?: boolean
  validateIntegrity?: boolean
}

export abstract class BaseRepository<T extends Record<string, any>> {
  protected tableName: string
  protected primaryKey: string = 'id'
  protected options: RepositoryOptions

  constructor(
    tableName: string, 
    options: RepositoryOptions = {
      enableAuditLog: true,
      enablePerformanceAnalysis: true,
      enableCaching: true,
      sanitizeData: true,
      validateIntegrity: true
    }
  ) {
    this.tableName = tableName
    this.options = options
  }

  protected getQueryBuilder(): QueryBuilder<T> {
    return QueryBuilder.table<T>(this.tableName)
  }

  protected getAdminQueryBuilder(): QueryBuilder<T> {
    return QueryBuilder.adminTable<T>(this.tableName)
  }

  protected async executeWithAnalysis<R>(
    operation: () => Promise<R>,
    operationName: string
  ): Promise<R> {
    if (this.options.enablePerformanceAnalysis) {
      const result = await analyzeQueryPerformance(
        this.tableName,
        operation
      )

      if (this.options.enableAuditLog) {
        await logDatabaseOperation(`${this.tableName}.${operationName}`, {
          executionTime: result.executionTime,
          cacheHit: result.cacheHit,
          tableName: this.tableName
        })
      }

      return result.result
    }

    return operation()
  }

  protected sanitizeData(data: Partial<T>): Partial<T> {
    if (!this.options.sanitizeData) return data

    const sanitized: Partial<T> = {}

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          sanitized[key as keyof T] = DataSanitizer.sanitizeString(value, {
            stripHtml: true,
            normalizeWhitespace: true,
            trim: true
          }) as T[keyof T]
        } else if (typeof value === 'number') {
          sanitized[key as keyof T] = value as T[keyof T]
        } else if (Array.isArray(value)) {
          sanitized[key as keyof T] = DataNormalizer.normalizeArray(value) as T[keyof T]
        } else if (typeof value === 'boolean') {
          sanitized[key as keyof T] = DataNormalizer.normalizeBoolean(value) as T[keyof T]
        } else if (value instanceof Date || typeof value === 'string') {
          // Handle dates
          const normalized = DataNormalizer.normalizeDate(value)
          if (normalized) {
            sanitized[key as keyof T] = normalized as T[keyof T]
          }
        } else {
          sanitized[key as keyof T] = value as T[keyof T]
        }
      }
    }

    return sanitized
  }

  protected validateData(data: Partial<T>, isUpdate: boolean = false): void {
    if (!this.options.validateIntegrity) return

    // Implement specific validation in child classes
    this.validateBusinessRules(data, isUpdate)
  }

  protected abstract validateBusinessRules(data: Partial<T>, isUpdate: boolean): void

  async findAll(options: QueryOptions & PaginationOptions = {}): Promise<PaginationResult<T>> {
    return this.executeWithAnalysis(async () => {
      const { page = 1, limit = 10, ...queryOptions } = options
      const offset = (page - 1) * limit

      const builder = this.getQueryBuilder()
      
      if (queryOptions.select) builder.select(queryOptions.select)
      if (queryOptions.filters) builder.where(queryOptions.filters)
      if (queryOptions.orderBy) {
        queryOptions.orderBy.forEach(order => {
          builder.orderBy(order.column, order.ascending)
        })
      }

      builder.limit(limit).offset(offset)

      const [data, total] = await Promise.all([
        builder.find(),
        this.count(queryOptions.filters)
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }, 'findAll')
  }

  async findById(id: string): Promise<T | null> {
    return this.executeWithAnalysis(async () => {
      return this.getQueryBuilder()
        .where({ [this.primaryKey]: id })
        .findOne()
    }, 'findById')
  }

  async findOne(filters: Record<string, any>): Promise<T | null> {
    return this.executeWithAnalysis(async () => {
      return this.getQueryBuilder()
        .where(filters)
        .findOne()
    }, 'findOne')
  }

  async findMany(filters: Record<string, any>, options: QueryOptions = {}): Promise<T[]> {
    return this.executeWithAnalysis(async () => {
      const builder = this.getQueryBuilder().where(filters)
      
      if (options.select) builder.select(options.select)
      if (options.orderBy) {
        options.orderBy.forEach(order => {
          builder.orderBy(order.column, order.ascending)
        })
      }
      if (options.limit) builder.limit(options.limit)
      if (options.offset) builder.offset(options.offset)

      return builder.find()
    }, 'findMany')
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    return this.executeWithAnalysis(async () => {
      const sanitizedData = this.sanitizeData(data)
      this.validateData(sanitizedData, false)

      return this.getQueryBuilder().insert(sanitizedData)
    }, 'create')
  }

  async createMany(data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    return this.executeWithAnalysis(async () => {
      const sanitizedData = data.map(item => {
        const sanitized = this.sanitizeData(item)
        this.validateData(sanitized, false)
        return sanitized
      })

      return this.getQueryBuilder().insertMany(sanitizedData)
    }, 'createMany')
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.executeWithAnalysis(async () => {
      const sanitizedData = this.sanitizeData(data)
      this.validateData(sanitizedData, true)

      const results = await this.getQueryBuilder()
        .where({ [this.primaryKey]: id })
        .update(sanitizedData)

      return results[0] || null
    }, 'update')
  }

  async updateMany(filters: Record<string, any>, data: Partial<T>): Promise<T[]> {
    return this.executeWithAnalysis(async () => {
      const sanitizedData = this.sanitizeData(data)
      this.validateData(sanitizedData, true)

      return this.getQueryBuilder()
        .where(filters)
        .update(sanitizedData)
    }, 'updateMany')
  }

  async delete(id: string): Promise<void> {
    return this.executeWithAnalysis(async () => {
      await this.getQueryBuilder()
        .where({ [this.primaryKey]: id })
        .delete()
    }, 'delete')
  }

  async deleteMany(filters: Record<string, any>): Promise<void> {
    return this.executeWithAnalysis(async () => {
      await this.getQueryBuilder()
        .where(filters)
        .delete()
    }, 'deleteMany')
  }

  async softDelete(id: string): Promise<T | null> {
    return this.executeWithAnalysis(async () => {
      const results = await this.getQueryBuilder()
        .where({ [this.primaryKey]: id })
        .softDelete()

      return results[0] || null
    }, 'softDelete')
  }

  async softDeleteMany(filters: Record<string, any>): Promise<T[]> {
    return this.executeWithAnalysis(async () => {
      return this.getQueryBuilder()
        .where(filters)
        .softDelete()
    }, 'softDeleteMany')
  }

  async count(filters?: Record<string, any>): Promise<number> {
    return this.executeWithAnalysis(async () => {
      const builder = this.getQueryBuilder()
      
      if (filters) {
        builder.where(filters)
      }

      return builder.count()
    }, 'count')
  }

  async exists(filters: Record<string, any>): Promise<boolean> {
    return this.executeWithAnalysis(async () => {
      const count = await this.getQueryBuilder()
        .where(filters)
        .count()

      return count > 0
    }, 'exists')
  }

  async search(
    query: string,
    searchFields: string[],
    options: QueryOptions & PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    return this.executeWithAnalysis(async () => {
      const { page = 1, limit = 10, ...queryOptions } = options
      const offset = (page - 1) * limit

      // Build search filters
      const searchFilters: Record<string, any> = {}
      searchFields.forEach(field => {
        searchFilters[`${field}__ilike`] = `%${query}%`
      })

      const builder = this.getQueryBuilder()
      
      // Apply base filters
      if (queryOptions.filters) {
        builder.where(queryOptions.filters)
      }

      // Add search filters (this would need to be enhanced for proper OR logic)
      // For now, we'll search the first field
      if (searchFields.length > 0) {
        builder.where({ [`${searchFields[0]}__ilike`]: `%${query}%` })
      }

      if (queryOptions.select) builder.select(queryOptions.select)
      if (queryOptions.orderBy) {
        queryOptions.orderBy.forEach(order => {
          builder.orderBy(order.column, order.ascending)
        })
      }

      builder.limit(limit).offset(offset)

      const [data, total] = await Promise.all([
        builder.find(),
        this.count({ ...queryOptions.filters, [`${searchFields[0]}__ilike`]: `%${query}%` })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }, 'search')
  }

  async transaction<R>(
    operations: (repository: this) => Promise<R>
  ): Promise<R> {
    const transactionManager = new TransactionManager()
    
    return transactionManager.execute(async () => {
      return operations(this)
    })
  }

  // Analytics and reporting methods
  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<any> {
    return this.executeWithAnalysis(async () => {
      const builder = this.getQueryBuilder()

      if (dateRange) {
        builder
          .where({ 'created_at__gte': dateRange.start.toISOString() })
          .where({ 'created_at__lte': dateRange.end.toISOString() })
      }

      const [total, created] = await Promise.all([
        this.count(),
        builder.count()
      ])

      return {
        total,
        createdInRange: created,
        tableName: this.tableName
      }
    }, 'getAnalytics')
  }

  // Bulk operations
  async bulkUpsert(
    data: Array<Partial<T>>,
    conflictColumns: string[] = [this.primaryKey]
  ): Promise<T[]> {
    return this.executeWithAnalysis(async () => {
      const sanitizedData = data.map(item => this.sanitizeData(item))
      
      // For now, we'll implement this as a series of upsert operations
      // This could be optimized with proper SQL upsert commands
      const results: T[] = []
      
      for (const item of sanitizedData) {
        const existing = await this.findOne(
          Object.fromEntries(
            conflictColumns.map(col => [col, item[col as keyof T]])
          )
        )

        if (existing) {
          const updated = await this.update(existing[this.primaryKey], item)
          if (updated) results.push(updated)
        } else {
          const created = await this.create(item as Omit<T, 'id' | 'created_at' | 'updated_at'>)
          results.push(created)
        }
      }

      return results
    }, 'bulkUpsert')
  }
}