# Backend Performance Optimization

## Overview

Backend performance optimization focuses on database query optimization, connection pooling, API response optimization, and efficient resource management. This guide covers Node.js/Express and PostgreSQL optimization techniques for maintaining responsive user experiences under varying load conditions.

## Database Query Optimization

### Query Optimization Strategy

**Analyze and optimize database queries** using query execution plans, index analysis, and performance profiling. Query optimization includes proper JOIN strategies, WHERE clause optimization, and result set limiting for improved response times.

### Index Strategy Implementation

**Strategic indexing** for optimal query performance:

```sql
-- organizations.sql - Performance-optimized queries

-- Index strategy for organizations table
CREATE INDEX CONCURRENTLY idx_organizations_assigned_user_active 
ON organizations(assigned_user_id) 
WHERE is_deleted = FALSE;

CREATE INDEX CONCURRENTLY idx_organizations_priority_created 
ON organizations(priority_level, created_at DESC) 
WHERE is_deleted = FALSE;

CREATE INDEX CONCURRENTLY idx_organizations_industry_priority 
ON organizations(industry_segment, priority_level) 
WHERE is_deleted = FALSE;

-- Full-text search index for organization names
CREATE INDEX CONCURRENTLY idx_organizations_name_search 
ON organizations USING gin(to_tsvector('english', name)) 
WHERE is_deleted = FALSE;

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY idx_organizations_filters 
ON organizations(assigned_user_id, industry_segment, priority_level, created_at DESC) 
WHERE is_deleted = FALSE;
```

### Optimized Query Functions

**Stored functions** for complex queries with optimized performance:

```sql
-- Optimized query for organization listing with filters
CREATE OR REPLACE FUNCTION get_organizations_optimized(
  p_user_id UUID,
  p_industry_segment VARCHAR DEFAULT NULL,
  p_priority_level priority_level DEFAULT NULL,
  p_search_term VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  industry_segment VARCHAR,
  priority_level priority_level,
  primary_email VARCHAR,
  primary_phone VARCHAR,
  annual_revenue BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  contact_count BIGINT,
  interaction_count BIGINT,
  opportunity_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.industry_segment,
    o.priority_level,
    o.primary_email,
    o.primary_phone,
    o.annual_revenue,
    o.created_at,
    COALESCE(c.contact_count, 0) as contact_count,
    COALESCE(i.interaction_count, 0) as interaction_count,
    COALESCE(op.opportunity_count, 0) as opportunity_count
  FROM organizations o
  LEFT JOIN (
    SELECT organization_id, COUNT(*) as contact_count
    FROM contacts 
    WHERE is_deleted = FALSE
    GROUP BY organization_id
  ) c ON o.id = c.organization_id
  LEFT JOIN (
    SELECT organization_id, COUNT(*) as interaction_count
    FROM interactions 
    WHERE created_at >= NOW() - INTERVAL '90 days'
    GROUP BY organization_id
  ) i ON o.id = i.organization_id
  LEFT JOIN (
    SELECT organization_id, COUNT(*) as opportunity_count
    FROM opportunities 
    WHERE stage NOT IN ('closed-won', 'closed-lost')
    GROUP BY organization_id
  ) op ON o.id = op.organization_id
  WHERE 
    o.is_deleted = FALSE
    AND o.assigned_user_id = p_user_id
    AND (p_industry_segment IS NULL OR o.industry_segment = p_industry_segment)
    AND (p_priority_level IS NULL OR o.priority_level = p_priority_level)
    AND (p_search_term IS NULL OR o.name ILIKE '%' || p_search_term || '%')
  ORDER BY 
    o.priority_level ASC,
    o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

### Materialized Views for Analytics

**Materialized views** for dashboard analytics and reporting:

```sql
-- Materialized view for dashboard analytics
CREATE MATERIALIZED VIEW dashboard_analytics AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT o.id) as total_organizations,
  COUNT(DISTINCT CASE WHEN o.priority_level = 'A' THEN o.id END) as high_priority_orgs,
  COUNT(DISTINCT c.id) as total_contacts,
  COUNT(DISTINCT i.id) as interactions_this_month,
  COUNT(DISTINCT op.id) as active_opportunities,
  SUM(CASE WHEN op.stage = 'closed-won' THEN op.value ELSE 0 END) as won_revenue_this_quarter
FROM users u
LEFT JOIN organizations o ON u.id = o.assigned_user_id AND o.is_deleted = FALSE
LEFT JOIN contacts c ON o.id = c.organization_id AND c.is_deleted = FALSE
LEFT JOIN interactions i ON o.id = i.organization_id 
  AND i.created_at >= date_trunc('month', CURRENT_DATE)
LEFT JOIN opportunities op ON o.id = op.organization_id
  AND (op.stage NOT IN ('closed-won', 'closed-lost') OR 
       (op.stage = 'closed-won' AND op.close_date >= date_trunc('quarter', CURRENT_DATE)))
WHERE u.is_active = TRUE
GROUP BY u.id;

-- Index for materialized view
CREATE UNIQUE INDEX idx_dashboard_analytics_user_id ON dashboard_analytics(user_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_analytics;
END;
$$ LANGUAGE plpgsql;
```

## Connection Pooling and Resource Management

### Database Connection Management

**Efficient database connection pooling** and resource management to optimize database performance under varying load conditions:

```typescript
// config/database.ts - Optimized database configuration
import { Pool, PoolConfig } from 'pg'
import { env } from './environment'

interface DatabaseMetrics {
  totalConnections: number
  idleConnections: number
  waitingClients: number
  queryCount: number
  averageQueryTime: number
}

class DatabaseManager {
  private pool: Pool
  private metrics: DatabaseMetrics = {
    totalConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    queryCount: 0,
    averageQueryTime: 0
  }

  constructor() {
    const poolConfig: PoolConfig = {
      connectionString: env.DATABASE_URL,
      // Connection pool optimization
      max: env.DATABASE_POOL_SIZE || 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // Query timeout
      query_timeout: 10000,
      // SSL configuration for production
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }

    this.pool = new Pool(poolConfig)
    this.setupEventHandlers()
    this.startMetricsCollection()
  }

  private setupEventHandlers() {
    this.pool.on('connect', (client) => {
      console.log('New database connection established')
      this.metrics.totalConnections++
    })

    this.pool.on('remove', (client) => {
      console.log('Database connection removed')
      this.metrics.totalConnections--
    })

    this.pool.on('error', (err, client) => {
      console.error('Database pool error:', err)
    })
  }

  private startMetricsCollection() {
    setInterval(() => {
      this.metrics.totalConnections = this.pool.totalCount
      this.metrics.idleConnections = this.pool.idleCount
      this.metrics.waitingClients = this.pool.waitingCount
    }, 5000)
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now()
    
    try {
      const result = await this.pool.query(text, params)
      
      // Update metrics
      const duration = Date.now() - start
      this.metrics.queryCount++
      this.metrics.averageQueryTime = 
        (this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + duration) / 
        this.metrics.queryCount

      return result.rows
    } catch (error) {
      console.error('Database query error:', error)
      console.error('Query:', text)
      console.error('Params:', params)
      throw error
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  getMetrics(): DatabaseMetrics {
    return { ...this.metrics }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}

export const db = new DatabaseManager()
```

### Query Builder for Optimized Queries

**Query builder** for type-safe and optimized database queries:

```typescript
// Query builder for optimized queries
export class QueryBuilder {
  private selectFields: string[] = []
  private fromTable: string = ''
  private joinClauses: string[] = []
  private whereConditions: string[] = []
  private orderByFields: string[] = []
  private limitValue?: number
  private offsetValue?: number
  private parameters: any[] = []

  select(fields: string | string[]): this {
    if (Array.isArray(fields)) {
      this.selectFields.push(...fields)
    } else {
      this.selectFields.push(fields)
    }
    return this
  }

  from(table: string): this {
    this.fromTable = table
    return this
  }

  leftJoin(table: string, condition: string): this {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`)
    return this
  }

  where(condition: string, value?: any): this {
    if (value !== undefined) {
      this.parameters.push(value)
      this.whereConditions.push(`${condition} $${this.parameters.length}`)
    } else {
      this.whereConditions.push(condition)
    }
    return this
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByFields.push(`${field} ${direction}`)
    return this
  }

  limit(count: number): this {
    this.limitValue = count
    return this
  }

  offset(count: number): this {
    this.offsetValue = count
    return this
  }

  build(): { query: string; params: any[] } {
    let query = `SELECT ${this.selectFields.join(', ')} FROM ${this.fromTable}`
    
    if (this.joinClauses.length > 0) {
      query += ` ${this.joinClauses.join(' ')}`
    }
    
    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`
    }
    
    if (this.orderByFields.length > 0) {
      query += ` ORDER BY ${this.orderByFields.join(', ')}`
    }
    
    if (this.limitValue) {
      query += ` LIMIT ${this.limitValue}`
    }
    
    if (this.offsetValue) {
      query += ` OFFSET ${this.offsetValue}`
    }

    return { query, params: this.parameters }
  }

  async execute<T = any>(): Promise<T[]> {
    const { query, params } = this.build()
    return db.query<T>(query, params)
  }
}
```

## API Response Optimization

### Response Caching Middleware

**API response caching** with Redis and intelligent cache invalidation:

```typescript
// middleware/caching.ts - API response caching middleware
import { Request, Response, NextFunction } from 'express'
import Redis from 'ioredis'
import { env } from '../config/environment'

interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: Request) => string
  condition?: (req: Request, res: Response) => boolean
}

class CacheManager {
  private redis: Redis | null = null

  constructor() {
    if (env.REDIS_URL) {
      this.redis = new Redis(env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error)
      })
    }
  }

  async get(key: string): Promise<any> {
    if (!this.redis) return null

    try {
      const cached = await this.redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl = 300): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async del(pattern: string): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async flush(): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.flushall()
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  }
}

const cacheManager = new CacheManager()

export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}:${req.user?.id}`,
    condition = (req, res) => req.method === 'GET' && res.statusCode === 200
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or when Redis is unavailable
    if (req.method !== 'GET' || !cacheManager) {
      return next()
    }

    const cacheKey = keyGenerator(req)
    
    try {
      // Try to get cached response
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        res.set('X-Cache', 'HIT')
        return res.json(cached)
      }

      // Store original json method
      const originalJson = res.json.bind(res)

      // Override json method to cache response
      res.json = function(data: any) {
        if (condition(req, res)) {
          cacheManager.set(cacheKey, data, ttl).catch(console.error)
        }
        res.set('X-Cache', 'MISS')
        return originalJson(data)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

// Cache invalidation middleware
export function invalidateCache(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res)

    res.json = function(data: any) {
      // Invalidate cache after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheManager.del(pattern).catch(console.error)
        })
      }
      return originalJson(data)
    }

    next()
  }
}
```

### Response Compression and Optimization

**Response compression** and payload optimization:

```typescript
// Response compression middleware
import compression from 'compression'

export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false
    }
    
    // Use compression filter function
    return compression.filter(req, res)
  },
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses larger than 1KB
  windowBits: 15,
  memLevel: 8
})

// Response optimization middleware
export function optimizeResponse() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res)

    res.json = function(data: any) {
      // Add performance headers
      res.set({
        'X-Response-Time': `${Date.now() - req.startTime}ms`,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      })

      // Optimize response data
      if (data && typeof data === 'object') {
        // Remove null values to reduce payload size
        const optimized = removeNullValues(data)
        return originalJson(optimized)
      }

      return originalJson(data)
    }

    next()
  }
}

function removeNullValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues).filter(item => item !== null)
  }
  
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        result[key] = removeNullValues(value)
      }
    }
    return result
  }
  
  return obj
}

export { cacheManager }
```

## Resource Management and Scaling

### Memory Management

**Memory optimization** and **garbage collection** monitoring:

```typescript
// utils/memoryManagement.ts - Memory management utilities
class MemoryManager {
  private memoryUsageHistory: NodeJS.MemoryUsage[] = []
  private readonly MAX_HISTORY = 100

  constructor() {
    this.startMonitoring()
  }

  private startMonitoring() {
    setInterval(() => {
      const usage = process.memoryUsage()
      this.memoryUsageHistory.push(usage)
      
      if (this.memoryUsageHistory.length > this.MAX_HISTORY) {
        this.memoryUsageHistory.shift()
      }
      
      this.checkMemoryThresholds(usage)
    }, 30000) // Check every 30 seconds
  }

  private checkMemoryThresholds(usage: NodeJS.MemoryUsage) {
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100
    
    if (heapUsedPercent > 85) {
      console.warn(`High memory usage: ${heapUsedPercent.toFixed(2)}%`)
      
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc()
      }
    }
  }

  getMemoryStats() {
    const current = process.memoryUsage()
    const history = this.memoryUsageHistory
    
    if (history.length === 0) return { current }
    
    const avg = history.reduce((acc, usage) => ({
      rss: acc.rss + usage.rss,
      heapTotal: acc.heapTotal + usage.heapTotal,
      heapUsed: acc.heapUsed + usage.heapUsed,
      external: acc.external + usage.external,
      arrayBuffers: acc.arrayBuffers + usage.arrayBuffers
    }), { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 })
    
    const count = history.length
    const average = {
      rss: avg.rss / count,
      heapTotal: avg.heapTotal / count,
      heapUsed: avg.heapUsed / count,
      external: avg.external / count,
      arrayBuffers: avg.arrayBuffers / count
    }
    
    return { current, average, history: history.slice(-10) }
  }

  forceGarbageCollection() {
    if (global.gc) {
      global.gc()
      console.log('Garbage collection forced')
    } else {
      console.warn('Garbage collection not available')
    }
  }
}

export const memoryManager = new MemoryManager()
```

### Connection and Resource Pooling

**Resource pooling** for external services:

```typescript
// utils/resourcePooling.ts - Resource pooling utilities
import { EventEmitter } from 'events'

interface PoolOptions {
  min: number
  max: number
  idleTimeoutMillis: number
  acquireTimeoutMillis: number
}

class ResourcePool<T> extends EventEmitter {
  private resources: T[] = []
  private availableResources: T[] = []
  private waitingQueue: Array<{
    resolve: (resource: T) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }> = []
  private options: PoolOptions

  constructor(
    private createResource: () => Promise<T>,
    private destroyResource: (resource: T) => Promise<void>,
    options: Partial<PoolOptions> = {}
  ) {
    super()
    
    this.options = {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 10000,
      ...options
    }

    this.initialize()
  }

  private async initialize() {
    // Create minimum number of resources
    for (let i = 0; i < this.options.min; i++) {
      try {
        const resource = await this.createResource()
        this.resources.push(resource)
        this.availableResources.push(resource)
      } catch (error) {
        console.error('Failed to create initial resource:', error)
      }
    }

    // Start idle timeout cleanup
    this.startIdleCleanup()
  }

  private startIdleCleanup() {
    setInterval(() => {
      this.cleanupIdleResources()
    }, this.options.idleTimeoutMillis)
  }

  private cleanupIdleResources() {
    const now = Date.now()
    const idleResources = this.availableResources.filter(
      resource => now - (resource as any).lastUsed > this.options.idleTimeoutMillis
    )

    idleResources.forEach(resource => {
      this.destroyResource(resource).catch(console.error)
      this.removeResource(resource)
    })
  }

  private removeResource(resource: T) {
    const resourceIndex = this.resources.indexOf(resource)
    if (resourceIndex !== -1) {
      this.resources.splice(resourceIndex, 1)
    }

    const availableIndex = this.availableResources.indexOf(resource)
    if (availableIndex !== -1) {
      this.availableResources.splice(availableIndex, 1)
    }
  }

  async acquire(): Promise<T> {
    return new Promise((resolve, reject) => {
      // Try to get available resource
      const resource = this.availableResources.shift()
      if (resource) {
        (resource as any).lastUsed = Date.now()
        resolve(resource)
        return
      }

      // Create new resource if under limit
      if (this.resources.length < this.options.max) {
        this.createResource()
          .then(newResource => {
            this.resources.push(newResource)
            ;(newResource as any).lastUsed = Date.now()
            resolve(newResource)
          })
          .catch(reject)
        return
      }

      // Wait for resource to become available
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve)
        if (index !== -1) {
          this.waitingQueue.splice(index, 1)
        }
        reject(new Error('Resource acquisition timeout'))
      }, this.options.acquireTimeoutMillis)

      this.waitingQueue.push({ resolve, reject, timeout })
    })
  }

  release(resource: T) {
    if (!this.resources.includes(resource)) {
      console.warn('Attempting to release unknown resource')
      return
    }

    // Check if anyone is waiting
    const waiting = this.waitingQueue.shift()
    if (waiting) {
      clearTimeout(waiting.timeout)
      ;(resource as any).lastUsed = Date.now()
      waiting.resolve(resource)
      return
    }

    // Add back to available pool
    this.availableResources.push(resource)
  }

  async destroy() {
    // Clear waiting queue
    this.waitingQueue.forEach(({ reject, timeout }) => {
      clearTimeout(timeout)
      reject(new Error('Pool is being destroyed'))
    })
    this.waitingQueue = []

    // Destroy all resources
    await Promise.all(
      this.resources.map(resource => this.destroyResource(resource))
    )
    
    this.resources = []
    this.availableResources = []
  }

  getStats() {
    return {
      total: this.resources.length,
      available: this.availableResources.length,
      waiting: this.waitingQueue.length,
      options: this.options
    }
  }
}

export { ResourcePool }
```

This backend optimization guide provides comprehensive strategies for maintaining optimal database performance, efficient resource management, and scalable API responses under varying load conditions.