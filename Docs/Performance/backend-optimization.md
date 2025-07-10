# Backend Performance Optimization

## Overview

Backend performance optimization focuses on database query optimization, API response optimization, and efficient resource management for optimal data access performance under varying load conditions.

## Database Query Optimization

### Indexing Strategy

Implement **comprehensive indexing strategies** using query execution plans, index analysis, and performance profiling for improved response times.

```sql
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

Create **stored procedures** and **functions** for frequently executed queries to reduce network overhead and improve performance.

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

Use **materialized views** for complex aggregations and reporting queries to improve dashboard performance.

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

### Database Connection Manager

Implement **efficient database connection pooling** and resource management to optimize database performance under varying load conditions.

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
}

export const db = new DatabaseManager()
```

### Query Builder for Performance

Implement a **type-safe query builder** for optimized query construction and execution.

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

### Caching Middleware

Implement **comprehensive API optimization** with response caching, data serialization optimization, and efficient pagination.

```typescript
// middleware/caching.ts - API response caching middleware
import { Request, Response, NextFunction } from 'express'
import Redis from 'ioredis'
import { env } from '../config/environment'

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
}

const cacheManager = new CacheManager()

export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}:${req.user?.id}`,
    condition = (req, res) => req.method === 'GET' && res.statusCode === 200
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || !cacheManager) {
      return next()
    }

    const cacheKey = keyGenerator(req)
    
    try {
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        res.set('X-Cache', 'HIT')
        return res.json(cached)
      }

      const originalJson = res.json.bind(res)
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
```

### Response Compression

Implement **response compression** and **optimization** for reduced payload sizes.

```typescript
// Response compression middleware
import compression from 'compression'

export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false
    }
    
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
```

## Memory Management and Optimization

### Garbage Collection Optimization

Implement **memory management** strategies and **garbage collection optimization** for better performance.

```typescript
// Memory management utilities
export class MemoryManager {
  private memoryThreshold = 0.85 // 85% memory threshold
  private gcInterval = 60000 // 1 minute
  private intervalId?: NodeJS.Timeout

  constructor() {
    this.startMonitoring()
  }

  private startMonitoring() {
    this.intervalId = setInterval(() => {
      this.checkMemoryUsage()
    }, this.gcInterval)
  }

  private checkMemoryUsage() {
    const memoryUsage = process.memoryUsage()
    const heapUsedPercent = memoryUsage.heapUsed / memoryUsage.heapTotal

    if (heapUsedPercent > this.memoryThreshold) {
      console.warn(`High memory usage detected: ${(heapUsedPercent * 100).toFixed(2)}%`)
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
        console.log('Garbage collection triggered')
      }
    }
  }

  getMemoryStats() {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsedPercent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    }
  }

  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }
}

export const memoryManager = new MemoryManager()
```

## Performance Best Practices

### Database Optimization

- Use **appropriate indexes** for query patterns
- Implement **connection pooling** for efficient resource usage
- Use **prepared statements** to prevent SQL injection and improve performance
- Implement **query result caching** for frequently accessed data

### API Optimization

- Implement **response caching** with appropriate TTL values
- Use **compression** for large responses
- Implement **pagination** for large datasets
- Use **efficient serialization** for response data

### Resource Management

- Monitor **memory usage** and implement cleanup strategies
- Use **connection pooling** for database and external service connections
- Implement **request timeouts** to prevent resource exhaustion
- Use **efficient data structures** for in-memory operations

## Related Documentation

- [Overview](./overview.md) - Performance architecture and strategy
- [Frontend Optimization](./frontend-optimization.md) - Client-side optimization strategies
- [Monitoring and APM](./monitoring-apm.md) - Performance monitoring implementation