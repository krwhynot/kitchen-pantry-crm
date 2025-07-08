# Kitchen Pantry CRM - Performance Optimization and Monitoring

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2025  
**System:** Kitchen Pantry CRM MVP  

## Executive Summary

The Kitchen Pantry CRM performance optimization and monitoring strategy ensures optimal system performance for food service industry professionals through comprehensive performance measurement, proactive optimization, and real-time monitoring capabilities. The performance framework emphasizes user experience optimization, resource efficiency, and scalability planning essential for business-critical CRM operations.

The monitoring architecture implements multi-layer observability including application performance monitoring (APM), infrastructure monitoring, user experience monitoring, and business metrics tracking. Performance optimization strategies focus on frontend optimization, backend efficiency, database performance, and network optimization to deliver exceptional user experiences across all devices and network conditions.

The performance management approach includes automated performance testing, continuous monitoring, alerting systems, and optimization workflows that ensure consistent performance standards throughout the application lifecycle. All performance metrics align with business objectives and user experience requirements essential for food service industry productivity and success.

## Performance Architecture Overview

### Multi-Layer Performance Monitoring

The Kitchen Pantry CRM performance architecture implements comprehensive monitoring across all system layers, providing complete visibility into application behavior, resource utilization, and user experience metrics. The multi-layer approach ensures performance issues are detected and resolved before impacting user productivity.

**Frontend Performance Layer:** Client-side performance monitoring including page load times, JavaScript execution performance, rendering metrics, and user interaction responsiveness. Frontend monitoring captures Core Web Vitals, bundle analysis, and real user monitoring (RUM) data essential for optimizing user experience across different devices and network conditions.

**Backend Performance Layer:** Server-side performance monitoring including API response times, database query performance, memory utilization, and CPU usage patterns. Backend monitoring provides detailed insights into application bottlenecks, resource constraints, and optimization opportunities essential for maintaining system responsiveness under varying load conditions.

**Infrastructure Performance Layer:** System-level monitoring including server performance, network latency, database performance, and third-party service dependencies. Infrastructure monitoring ensures optimal resource allocation, capacity planning, and proactive issue detection essential for maintaining service reliability and availability.

**Business Performance Layer:** Business metrics monitoring including user engagement, feature adoption, conversion rates, and productivity metrics. Business performance monitoring aligns technical performance with business outcomes, providing insights into how performance impacts user satisfaction and business success.

### Performance Measurement Framework

The performance measurement framework establishes comprehensive metrics, benchmarks, and success criteria aligned with food service industry requirements and user expectations.

**Core Web Vitals Monitoring:**
- **Largest Contentful Paint (LCP):** Target < 2.5 seconds for optimal user experience
- **First Input Delay (FID):** Target < 100 milliseconds for responsive interactions
- **Cumulative Layout Shift (CLS):** Target < 0.1 for visual stability
- **First Contentful Paint (FCP):** Target < 1.8 seconds for perceived performance
- **Time to Interactive (TTI):** Target < 3.5 seconds for full functionality

**API Performance Metrics:**
- **Response Time:** 95th percentile < 500ms for critical endpoints
- **Throughput:** Support minimum 1000 requests per minute per server
- **Error Rate:** Maintain < 0.1% error rate for production systems
- **Database Query Performance:** 95th percentile < 100ms for standard queries
- **Cache Hit Ratio:** Maintain > 90% cache hit ratio for frequently accessed data

**User Experience Metrics:**
- **Page Load Time:** Complete page load < 3 seconds on 3G networks
- **Time to First Byte (TTFB):** Server response < 200ms for optimal performance
- **Interactive Time:** User can interact with interface < 2 seconds after navigation
- **Search Response Time:** Search results display < 500ms after query submission
- **Form Submission Time:** Form processing and feedback < 1 second

## Frontend Performance Optimization

### Bundle Optimization and Code Splitting

Frontend performance optimization focuses on minimizing bundle sizes, implementing efficient code splitting, and optimizing asset delivery for fast loading times across all devices and network conditions.

**Dynamic Import Strategy:** Implement route-based code splitting and component-level lazy loading to reduce initial bundle size and improve perceived performance. Dynamic imports ensure users only download code necessary for their current workflow, reducing bandwidth usage and improving loading times.

```typescript
// router/index.ts - Route-based code splitting
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/organizations',
      name: 'Organizations',
      component: () => import('../views/Organizations.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/organizations/:id',
      name: 'OrganizationDetail',
      component: () => import('../views/OrganizationDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/contacts',
      name: 'Contacts',
      component: () => import('../views/Contacts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/interactions',
      name: 'Interactions',
      component: () => import('../views/Interactions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/opportunities',
      name: 'Opportunities',
      component: () => import('../views/Opportunities.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

export default router

// components/organisms/DataTable.vue - Component lazy loading
<template>
  <div class="data-table">
    <div class="table-header">
      <h2>{{ title }}</h2>
      <Suspense>
        <template #default>
          <AdvancedFilters 
            v-if="showAdvancedFilters" 
            @filter-change="handleFilterChange"
          />
        </template>
        <template #fallback>
          <div class="loading-placeholder">Loading filters...</div>
        </template>
      </Suspense>
    </div>
    
    <div class="table-content">
      <!-- Table implementation -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

// Lazy load heavy components
const AdvancedFilters = defineAsyncComponent(() => 
  import('../molecules/AdvancedFilters.vue')
)

const showAdvancedFilters = ref(false)

const handleFilterChange = (filters: any) => {
  // Handle filter changes
}
</script>
```

**Asset Optimization Strategy:** Implement comprehensive asset optimization including image compression, font optimization, and CSS/JavaScript minification. Asset optimization reduces bandwidth usage and improves loading performance across different network conditions.

```typescript
// vite.config.ts - Build optimization configuration
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for stable dependencies
          vendor: ['vue', 'vue-router', 'pinia'],
          // UI library chunk
          ui: ['@headlessui/vue', '@heroicons/vue'],
          // Utilities chunk
          utils: ['date-fns', 'lodash-es', 'zod']
        }
      }
    },
    // Enable gzip compression
    reportCompressedSize: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // Development server optimization
  server: {
    hmr: {
      overlay: false
    }
  },
  // CSS optimization
  css: {
    devSourcemap: true
  }
})

// Image optimization configuration
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true
        }]
      }
    } : {})
  }
}
```

### Caching and State Management Optimization

Implement comprehensive caching strategies and optimized state management to reduce server requests and improve application responsiveness.

**Multi-Level Caching Strategy:** Implement browser caching, service worker caching, and application-level caching to minimize network requests and improve perceived performance. Caching strategies include intelligent cache invalidation and offline capability support.

```typescript
// stores/organizationStore.ts - Optimized state management with caching
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { organizationApi } from '@/api/organizations'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

export const useOrganizationStore = defineStore('organizations', () => {
  const organizations = ref<Organization[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const cache = new CacheManager()

  // Computed values for performance
  const organizationsByPriority = computed(() => {
    const grouped = organizations.value.reduce((acc, org) => {
      const priority = org.priority_level || 'C'
      if (!acc[priority]) acc[priority] = []
      acc[priority].push(org)
      return acc
    }, {} as Record<string, Organization[]>)

    // Sort each priority group by name
    Object.keys(grouped).forEach(priority => {
      grouped[priority].sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  })

  const highPriorityOrganizations = computed(() => 
    organizations.value.filter(org => org.priority_level === 'A')
  )

  // Optimized fetch with caching
  const fetchOrganizations = async (params: OrganizationFilters = {}) => {
    const cacheKey = `organizations:${JSON.stringify(params)}`
    const cached = cache.get<OrganizationResponse>(cacheKey)
    
    if (cached) {
      organizations.value = cached.data
      return cached
    }

    loading.value = true
    error.value = null

    try {
      const response = await organizationApi.getOrganizations(params)
      organizations.value = response.data
      
      // Cache successful response
      cache.set(cacheKey, response)
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch organizations'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Optimized create with cache invalidation
  const createOrganization = async (data: CreateOrganizationRequest) => {
    try {
      const response = await organizationApi.createOrganization(data)
      
      // Optimistically update local state
      organizations.value.unshift(response.data)
      
      // Invalidate relevant cache entries
      cache.invalidate('organizations:')
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create organization'
      throw err
    }
  }

  // Optimized update with selective cache invalidation
  const updateOrganization = async (id: string, data: UpdateOrganizationRequest) => {
    try {
      const response = await organizationApi.updateOrganization(id, data)
      
      // Update local state
      const index = organizations.value.findIndex(org => org.id === id)
      if (index !== -1) {
        organizations.value[index] = response.data
      }
      
      // Invalidate specific cache entries
      cache.invalidate('organizations:')
      cache.invalidate(`organization:${id}`)
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update organization'
      throw err
    }
  }

  // Batch operations for performance
  const batchUpdateOrganizations = async (updates: Array<{ id: string; data: UpdateOrganizationRequest }>) => {
    try {
      const promises = updates.map(({ id, data }) => 
        organizationApi.updateOrganization(id, data)
      )
      
      const responses = await Promise.all(promises)
      
      // Update local state in batch
      responses.forEach(response => {
        const index = organizations.value.findIndex(org => org.id === response.data.id)
        if (index !== -1) {
          organizations.value[index] = response.data
        }
      })
      
      // Clear cache after batch update
      cache.clear()
      
      return responses
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to batch update organizations'
      throw err
    }
  }

  return {
    organizations,
    loading,
    error,
    organizationsByPriority,
    highPriorityOrganizations,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    batchUpdateOrganizations
  }
})
```

### Progressive Web App Optimization

Implement comprehensive PWA capabilities with service worker optimization, offline functionality, and native-like performance characteristics.

```typescript
// sw.ts - Service worker for caching and offline functionality
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true
      })
    ]
  })
)

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true
      })
    ]
  })
)

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets'
  })
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true
      })
    ]
  })
)

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implement background sync logic for offline actions
  const offlineActions = await getOfflineActions()
  
  for (const action of offlineActions) {
    try {
      await processOfflineAction(action)
      await removeOfflineAction(action.id)
    } catch (error) {
      console.error('Failed to process offline action:', error)
    }
  }
}

// Push notification handling
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url)
    )
  }
})

// Helper functions for offline storage
async function getOfflineActions() {
  // Implement IndexedDB operations for offline actions
  return []
}

async function processOfflineAction(action: any) {
  // Process offline action when back online
}

async function removeOfflineAction(id: string) {
  // Remove processed offline action
}
```

## Backend Performance Optimization

### Database Query Optimization

Implement comprehensive database optimization strategies including query optimization, indexing strategies, and connection pooling for optimal data access performance.

**Query Optimization Strategy:** Analyze and optimize database queries using query execution plans, index analysis, and performance profiling. Query optimization includes proper JOIN strategies, WHERE clause optimization, and result set limiting for improved response times.

```sql
-- Optimized queries with proper indexing
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

**Connection Pooling and Resource Management:** Implement efficient database connection pooling and resource management to optimize database performance under varying load conditions.

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

### API Response Optimization

Implement comprehensive API optimization strategies including response caching, data serialization optimization, and efficient pagination for improved API performance.

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

## Real-Time Monitoring Implementation

### Application Performance Monitoring (APM)

Implement comprehensive APM capabilities with detailed performance tracking, error monitoring, and user experience analytics.

```typescript
// monitoring/apm.ts - Application Performance Monitoring
import { Request, Response, NextFunction } from 'express'
import { performance } from 'perf_hooks'

interface PerformanceMetric {
  timestamp: number
  method: string
  url: string
  statusCode: number
  responseTime: number
  memoryUsage: NodeJS.MemoryUsage
  userId?: string
  userAgent?: string
  ip?: string
}

interface ErrorMetric {
  timestamp: number
  error: Error
  request: {
    method: string
    url: string
    headers: any
    body?: any
    userId?: string
  }
  stack: string
}

class APMService {
  private metrics: PerformanceMetric[] = []
  private errors: ErrorMetric[] = []
  private readonly MAX_METRICS = 10000
  private readonly MAX_ERRORS = 1000

  // Performance tracking middleware
  trackPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now()
      req.startTime = Date.now()

      // Capture initial memory usage
      const initialMemory = process.memoryUsage()

      res.on('finish', () => {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        const finalMemory = process.memoryUsage()

        const metric: PerformanceMetric = {
          timestamp: Date.now(),
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime,
          memoryUsage: finalMemory,
          userId: req.user?.id,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }

        this.addMetric(metric)

        // Log slow requests
        if (responseTime > 1000) {
          console.warn(`Slow request detected: ${req.method} ${req.originalUrl} - ${responseTime.toFixed(2)}ms`)
        }

        // Log memory spikes
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
        if (memoryIncrease > 50 * 1024 * 1024) { // 50MB increase
          console.warn(`Memory spike detected: ${memoryIncrease / 1024 / 1024}MB increase`)
        }
      })

      next()
    }
  }

  // Error tracking middleware
  trackErrors() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const errorMetric: ErrorMetric = {
        timestamp: Date.now(),
        error,
        request: {
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          body: req.body,
          userId: req.user?.id
        },
        stack: error.stack || ''
      }

      this.addError(errorMetric)

      // Send to external error tracking service
      this.sendToErrorTracking(errorMetric)

      next(error)
    }
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  private addError(error: ErrorMetric) {
    this.errors.push(error)
    
    // Keep only recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS)
    }
  }

  private async sendToErrorTracking(error: ErrorMetric) {
    // Integration with error tracking service (e.g., Sentry)
    try {
      // Implement error tracking service integration
      console.error('Error tracked:', error.error.message)
    } catch (err) {
      console.error('Failed to send error to tracking service:', err)
    }
  }

  // Analytics methods
  getPerformanceStats(timeWindow = 3600000) { // 1 hour default
    const cutoff = Date.now() - timeWindow
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)

    if (recentMetrics.length === 0) {
      return null
    }

    const responseTimes = recentMetrics.map(m => m.responseTime)
    const statusCodes = recentMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      medianResponseTime: this.calculateMedian(responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      statusCodeDistribution: statusCodes,
      errorRate: (statusCodes[500] || 0) / recentMetrics.length,
      slowRequestCount: recentMetrics.filter(m => m.responseTime > 1000).length,
      memoryUsage: {
        current: process.memoryUsage(),
        average: this.calculateAverageMemoryUsage(recentMetrics)
      }
    }
  }

  getErrorStats(timeWindow = 3600000) {
    const cutoff = Date.now() - timeWindow
    const recentErrors = this.errors.filter(e => e.timestamp > cutoff)

    const errorsByType = recentErrors.reduce((acc, e) => {
      const type = e.error.constructor.name
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorsByEndpoint = recentErrors.reduce((acc, e) => {
      const endpoint = `${e.request.method} ${e.request.url}`
      acc[endpoint] = (acc[endpoint] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByEndpoint,
      topErrors: Object.entries(errorsByType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    }
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid]
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index]
  }

  private calculateAverageMemoryUsage(metrics: PerformanceMetric[]): NodeJS.MemoryUsage {
    const totals = metrics.reduce((acc, m) => ({
      rss: acc.rss + m.memoryUsage.rss,
      heapTotal: acc.heapTotal + m.memoryUsage.heapTotal,
      heapUsed: acc.heapUsed + m.memoryUsage.heapUsed,
      external: acc.external + m.memoryUsage.external,
      arrayBuffers: acc.arrayBuffers + m.memoryUsage.arrayBuffers
    }), {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0
    })

    const count = metrics.length
    return {
      rss: totals.rss / count,
      heapTotal: totals.heapTotal / count,
      heapUsed: totals.heapUsed / count,
      external: totals.external / count,
      arrayBuffers: totals.arrayBuffers / count
    }
  }

  // Health check endpoint
  getHealthStatus() {
    const stats = this.getPerformanceStats()
    const errorStats = this.getErrorStats()
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    return {
      status: this.determineHealthStatus(stats, errorStats, memoryUsage),
      uptime,
      memoryUsage,
      performance: stats,
      errors: errorStats,
      timestamp: Date.now()
    }
  }

  private determineHealthStatus(
    stats: any, 
    errorStats: any, 
    memoryUsage: NodeJS.MemoryUsage
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Memory check
    const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal
    if (memoryUsagePercent > 0.9) return 'unhealthy'
    if (memoryUsagePercent > 0.7) return 'degraded'

    // Performance check
    if (stats) {
      if (stats.p95ResponseTime > 2000) return 'unhealthy'
      if (stats.p95ResponseTime > 1000) return 'degraded'
      if (stats.errorRate > 0.05) return 'unhealthy'
      if (stats.errorRate > 0.01) return 'degraded'
    }

    return 'healthy'
  }
}

export const apmService = new APMService()

// Express middleware exports
export const performanceMiddleware = apmService.trackPerformance()
export const errorTrackingMiddleware = apmService.trackErrors()

// Health check route handler
export const healthCheckHandler = (req: Request, res: Response) => {
  const health = apmService.getHealthStatus()
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503
  
  res.status(statusCode).json(health)
}

// Performance stats route handler
export const performanceStatsHandler = (req: Request, res: Response) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000
  const stats = apmService.getPerformanceStats(timeWindow)
  const errorStats = apmService.getErrorStats(timeWindow)
  
  res.json({
    performance: stats,
    errors: errorStats,
    timestamp: Date.now()
  })
}
```

### Real-Time Alerting System

Implement comprehensive alerting capabilities with multiple notification channels and intelligent alert management.

```typescript
// monitoring/alerting.ts - Real-time alerting system
import nodemailer from 'nodemailer'
import { WebClient } from '@slack/web-api'
import { env } from '../config/environment'

interface Alert {
  id: string
  type: 'performance' | 'error' | 'security' | 'business'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: number
  metadata: any
  resolved: boolean
  resolvedAt?: number
}

interface AlertRule {
  id: string
  name: string
  condition: (metrics: any) => boolean
  severity: Alert['severity']
  type: Alert['type']
  cooldown: number // Minutes between alerts
  channels: ('email' | 'slack' | 'webhook')[]
}

class AlertingService {
  private alerts: Alert[] = []
  private alertHistory: Alert[] = []
  private lastAlertTimes: Map<string, number> = new Map()
  private emailTransporter: nodemailer.Transporter
  private slackClient: WebClient

  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })

    // Initialize Slack client
    this.slackClient = new WebClient(env.SLACK_BOT_TOKEN)

    // Start monitoring
    this.startMonitoring()
  }

  private alertRules: AlertRule[] = [
    {
      id: 'high_response_time',
      name: 'High Response Time',
      condition: (metrics) => metrics.p95ResponseTime > 2000,
      severity: 'high',
      type: 'performance',
      cooldown: 15,
      channels: ['email', 'slack']
    },
    {
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 0.05,
      severity: 'critical',
      type: 'error',
      cooldown: 5,
      channels: ['email', 'slack', 'webhook']
    },
    {
      id: 'memory_usage_high',
      name: 'High Memory Usage',
      condition: (metrics) => {
        const usage = metrics.memoryUsage.current
        return usage.heapUsed / usage.heapTotal > 0.85
      },
      severity: 'medium',
      type: 'performance',
      cooldown: 30,
      channels: ['slack']
    },
    {
      id: 'database_connection_issues',
      name: 'Database Connection Issues',
      condition: (metrics) => metrics.databaseErrors > 10,
      severity: 'critical',
      type: 'error',
      cooldown: 5,
      channels: ['email', 'slack', 'webhook']
    },
    {
      id: 'failed_login_attempts',
      name: 'Multiple Failed Login Attempts',
      condition: (metrics) => metrics.failedLogins > 50,
      severity: 'high',
      type: 'security',
      cooldown: 10,
      channels: ['email', 'slack']
    }
  ]

  private startMonitoring() {
    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts()
    }, 60000)

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts()
    }, 3600000)
  }

  private async checkAlerts() {
    try {
      // Get current metrics from APM service
      const metrics = await this.getCurrentMetrics()

      for (const rule of this.alertRules) {
        if (this.shouldCheckRule(rule) && rule.condition(metrics)) {
          await this.triggerAlert(rule, metrics)
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }

  private shouldCheckRule(rule: AlertRule): boolean {
    const lastAlertTime = this.lastAlertTimes.get(rule.id) || 0
    const cooldownMs = rule.cooldown * 60 * 1000
    return Date.now() - lastAlertTime > cooldownMs
  }

  private async triggerAlert(rule: AlertRule, metrics: any) {
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      description: this.generateAlertDescription(rule, metrics),
      timestamp: Date.now(),
      metadata: { rule: rule.id, metrics },
      resolved: false
    }

    this.alerts.push(alert)
    this.alertHistory.push(alert)
    this.lastAlertTimes.set(rule.id, Date.now())

    // Send notifications
    await this.sendNotifications(alert, rule.channels)

    console.log(`Alert triggered: ${alert.title}`)
  }

  private generateAlertDescription(rule: AlertRule, metrics: any): string {
    switch (rule.id) {
      case 'high_response_time':
        return `95th percentile response time is ${metrics.p95ResponseTime.toFixed(2)}ms (threshold: 2000ms)`
      
      case 'high_error_rate':
        return `Error rate is ${(metrics.errorRate * 100).toFixed(2)}% (threshold: 5%)`
      
      case 'memory_usage_high':
        const usage = metrics.memoryUsage.current
        const percent = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(1)
        return `Memory usage is ${percent}% (threshold: 85%)`
      
      case 'database_connection_issues':
        return `${metrics.databaseErrors} database errors in the last hour (threshold: 10)`
      
      case 'failed_login_attempts':
        return `${metrics.failedLogins} failed login attempts in the last hour (threshold: 50)`
      
      default:
        return 'Alert condition met'
    }
  }

  private async sendNotifications(alert: Alert, channels: string[]) {
    const promises = channels.map(channel => {
      switch (channel) {
        case 'email':
          return this.sendEmailAlert(alert)
        case 'slack':
          return this.sendSlackAlert(alert)
        case 'webhook':
          return this.sendWebhookAlert(alert)
        default:
          return Promise.resolve()
      }
    })

    await Promise.allSettled(promises)
  }

  private async sendEmailAlert(alert: Alert) {
    try {
      const subject = `[${alert.severity.toUpperCase()}] Kitchen Pantry CRM Alert: ${alert.title}`
      const html = this.generateEmailTemplate(alert)

      await this.emailTransporter.sendMail({
        from: env.ALERT_FROM_EMAIL,
        to: env.ALERT_TO_EMAILS?.split(',') || [],
        subject,
        html
      })
    } catch (error) {
      console.error('Failed to send email alert:', error)
    }
  }

  private async sendSlackAlert(alert: Alert) {
    try {
      const color = this.getSeverityColor(alert.severity)
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.title}*\n${alert.description}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Severity: ${alert.severity} | Time: ${new Date(alert.timestamp).toISOString()}`
            }
          ]
        }
      ]

      await this.slackClient.chat.postMessage({
        channel: env.SLACK_ALERT_CHANNEL,
        text: `Alert: ${alert.title}`,
        blocks,
        attachments: [
          {
            color,
            fallback: alert.description
          }
        ]
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  private async sendWebhookAlert(alert: Alert) {
    try {
      if (!env.ALERT_WEBHOOK_URL) return

      const response = await fetch(env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert,
          timestamp: Date.now(),
          service: 'kitchen-pantry-crm'
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error)
    }
  }

  private generateEmailTemplate(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; text-align: center;">
            <h1>Kitchen Pantry CRM Alert</h1>
            <h2>${alert.title}</h2>
          </div>
          
          <div style="padding: 20px;">
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            
            <h3>Description</h3>
            <p>${alert.description}</p>
            
            <h3>Metadata</h3>
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(alert.metadata, null, 2)}
            </pre>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p>This alert was generated by Kitchen Pantry CRM monitoring system.</p>
            <p>Please investigate and resolve the issue promptly.</p>
          </div>
        </body>
      </html>
    `
  }

  private getSeverityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'low': return '#28a745'
      case 'medium': return '#ffc107'
      case 'high': return '#fd7e14'
      case 'critical': return '#dc3545'
      default: return '#6c757d'
    }
  }

  private async getCurrentMetrics(): Promise<any> {
    // This would integrate with your APM service
    // For now, return mock metrics
    return {
      p95ResponseTime: 1500,
      errorRate: 0.02,
      memoryUsage: {
        current: process.memoryUsage()
      },
      databaseErrors: 5,
      failedLogins: 25
    }
  }

  private cleanupOldAlerts() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoff)
    
    // Remove resolved alerts older than 24 hours
    const resolvedCutoff = Date.now() - (24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > resolvedCutoff
    )
  }

  // Public methods for alert management
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  getAlertHistory(limit = 100): Alert[] {
    return this.alertHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      return true
    }
    return false
  }

  getAlertStats(timeWindow = 24 * 60 * 60 * 1000): any {
    const cutoff = Date.now() - timeWindow
    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp > cutoff)

    const byType = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySeverity = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: recentAlerts.length,
      active: this.getActiveAlerts().length,
      byType,
      bySeverity,
      averageResolutionTime: this.calculateAverageResolutionTime(recentAlerts)
    }
  }

  private calculateAverageResolutionTime(alerts: Alert[]): number {
    const resolvedAlerts = alerts.filter(alert => alert.resolved && alert.resolvedAt)
    if (resolvedAlerts.length === 0) return 0

    const totalTime = resolvedAlerts.reduce((sum, alert) => 
      sum + (alert.resolvedAt! - alert.timestamp), 0
    )

    return totalTime / resolvedAlerts.length
  }
}

export const alertingService = new AlertingService()

// Express route handlers
export const getActiveAlertsHandler = (req: Request, res: Response) => {
  const alerts = alertingService.getActiveAlerts()
  res.json({ success: true, data: alerts })
}

export const getAlertHistoryHandler = (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  const history = alertingService.getAlertHistory(limit)
  res.json({ success: true, data: history })
}

export const resolveAlertHandler = (req: Request, res: Response) => {
  const { alertId } = req.params
  const resolved = alertingService.resolveAlert(alertId)
  
  if (resolved) {
    res.json({ success: true, message: 'Alert resolved' })
  } else {
    res.status(404).json({ success: false, message: 'Alert not found or already resolved' })
  }
}

export const getAlertStatsHandler = (req: Request, res: Response) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || (24 * 60 * 60 * 1000)
  const stats = alertingService.getAlertStats(timeWindow)
  res.json({ success: true, data: stats })
}
```

## Conclusion

The Kitchen Pantry CRM performance optimization and monitoring strategy provides comprehensive performance management capabilities essential for maintaining optimal system performance in food service industry applications. The multi-layer monitoring approach ensures complete visibility into application behavior while proactive optimization strategies maintain exceptional user experiences.

The performance framework emphasizes automated monitoring, intelligent alerting, and continuous optimization processes that scale with business growth and user demands. Comprehensive caching strategies, database optimization, and frontend performance techniques ensure consistent performance across all user interactions and system components.

This performance optimization and monitoring guide serves as the foundation for maintaining high-performance CRM operations, providing the tools and processes necessary for delivering exceptional user experiences essential for food service industry productivity and success.

