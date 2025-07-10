# Frontend Performance Optimization

## Overview

Frontend performance optimization focuses on minimizing bundle sizes, implementing efficient code splitting, and optimizing asset delivery for fast loading times across all devices and network conditions. This guide covers Vue.js-specific optimization techniques and progressive web app capabilities.

## Bundle Optimization and Code Splitting

### Dynamic Import Strategy

**Route-based code splitting** and **component-level lazy loading** reduce initial bundle size and improve perceived performance. Dynamic imports ensure users only download code necessary for their current workflow, reducing bandwidth usage and improving loading times.

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
```

### Component-Level Lazy Loading

**Lazy loading heavy components** with Vue's `defineAsyncComponent` and `Suspense`:

```typescript
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

### Build Optimization Configuration

**Vite configuration** for optimal build performance and bundle optimization:

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
```

### CSS and Asset Optimization

**PostCSS configuration** for production-ready CSS optimization:

```javascript
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

## Caching and State Management Optimization

### Multi-Level Caching Strategy

**Browser caching**, **service worker caching**, and **application-level caching** minimize network requests and improve perceived performance. Caching strategies include intelligent cache invalidation and offline capability support.

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

  return {
    organizations,
    loading,
    error,
    organizationsByPriority,
    highPriorityOrganizations,
    fetchOrganizations,
    createOrganization
  }
})
```

### Batch Operations for Performance

**Batch updates** and **optimistic updates** reduce API calls and improve user experience:

```typescript
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
```

## Progressive Web App Optimization

### Service Worker Implementation

**Service worker** for caching and offline functionality with **Workbox** integration:

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
```

### Background Sync and Push Notifications

**Background sync** for offline actions and **push notifications** for real-time updates:

```typescript
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
```

## Vue.js Specific Optimizations

### Component Optimization

**Component performance** optimization techniques:

```typescript
// components/organisms/DataTable.vue - Optimized component
<template>
  <div class="data-table">
    <div class="table-header">
      <h2>{{ title }}</h2>
      <button 
        @click="toggleFilters"
        :aria-expanded="showFilters"
        class="filter-toggle"
      >
        Toggle Filters
      </button>
    </div>
    
    <!-- Use v-show for expensive components that toggle frequently -->
    <div 
      v-show="showFilters"
      class="filters-container"
    >
      <AdvancedFilters 
        @filter-change="handleFilterChange"
        :initial-filters="filters"
      />
    </div>
    
    <!-- Virtual scrolling for large datasets -->
    <div class="table-content">
      <VirtualList
        :items="filteredItems"
        :item-height="60"
        :container-height="400"
        #default="{ item }"
      >
        <TableRow 
          :key="item.id"
          :item="item"
          @click="handleRowClick(item)"
        />
      </VirtualList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useDebounceFn } from '@vueuse/core'

// Lazy load heavy components
const AdvancedFilters = defineAsyncComponent(() => 
  import('../molecules/AdvancedFilters.vue')
)

const props = defineProps<{
  title: string
  items: any[]
  initialFilters?: any
}>()

const showFilters = ref(false)
const filters = ref(props.initialFilters || {})

// Debounced filter handling
const handleFilterChange = useDebounceFn((newFilters: any) => {
  filters.value = newFilters
}, 300)

// Computed with caching
const filteredItems = computed(() => {
  return props.items.filter(item => {
    // Apply filters
    return Object.entries(filters.value).every(([key, value]) => {
      if (!value) return true
      return item[key]?.toString().toLowerCase().includes(value.toLowerCase())
    })
  })
})

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const handleRowClick = (item: any) => {
  // Handle row click
}
</script>
```

### Memory Management

**Memory optimization** and **cleanup strategies**:

```typescript
// composables/useMemoryManagement.ts - Memory management utilities
import { onUnmounted, ref, Ref } from 'vue'

export function useMemoryManagement() {
  const cleanup: Array<() => void> = []
  
  const addCleanup = (fn: () => void) => {
    cleanup.push(fn)
  }
  
  const createManagedRef = <T>(value: T): Ref<T> => {
    const refValue = ref(value)
    
    addCleanup(() => {
      // Clear reference
      refValue.value = null as any
    })
    
    return refValue
  }
  
  const createManagedEventListener = (
    element: EventTarget,
    event: string,
    handler: EventListener
  ) => {
    element.addEventListener(event, handler)
    
    addCleanup(() => {
      element.removeEventListener(event, handler)
    })
  }
  
  const createManagedInterval = (fn: () => void, delay: number) => {
    const intervalId = setInterval(fn, delay)
    
    addCleanup(() => {
      clearInterval(intervalId)
    })
    
    return intervalId
  }
  
  onUnmounted(() => {
    cleanup.forEach(fn => fn())
    cleanup.length = 0
  })
  
  return {
    addCleanup,
    createManagedRef,
    createManagedEventListener,
    createManagedInterval
  }
}
```

## Performance Monitoring

### Frontend Performance Tracking

**Real User Monitoring (RUM)** integration:

```typescript
// utils/performanceMonitoring.ts - Frontend performance tracking
interface PerformanceMetrics {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0
  }
  
  constructor() {
    this.initializeTracking()
  }
  
  private initializeTracking() {
    // Track Core Web Vitals
    this.trackLCP()
    this.trackFID()
    this.trackCLS()
    this.trackFCP()
    this.trackTTFB()
  }
  
  private trackLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.metrics.lcp = lastEntry.startTime
    })
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  }
  
  private trackFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        this.metrics.fid = entry.processingStart - entry.startTime
      })
    })
    
    observer.observe({ entryTypes: ['first-input'] })
  }
  
  private trackCLS() {
    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.metrics.cls = clsValue
    })
    
    observer.observe({ entryTypes: ['layout-shift'] })
  }
  
  private trackFCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime
        }
      })
    })
    
    observer.observe({ entryTypes: ['paint'] })
  }
  
  private trackTTFB() {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationTiming) {
      this.metrics.ttfb = navigationTiming.responseStart - navigationTiming.requestStart
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
  
  sendMetrics() {
    // Send metrics to analytics service
    fetch('/api/v1/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metrics: this.getMetrics(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(console.error)
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Initialize monitoring
if (typeof window !== 'undefined') {
  // Send metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.sendMetrics()
    }, 1000)
  })
}
```

This frontend optimization guide provides comprehensive strategies for achieving optimal performance in Vue.js applications while maintaining excellent user experience across all devices and network conditions.