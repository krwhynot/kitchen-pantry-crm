# Frontend Performance Optimization

## Overview

Frontend performance optimization focuses on minimizing bundle sizes, implementing efficient code splitting, and optimizing asset delivery for fast loading times across all devices and network conditions.

## Bundle Optimization and Code Splitting

### Dynamic Import Strategy

Implement **route-based code splitting** and **component-level lazy loading** to reduce initial bundle size and improve perceived performance. Dynamic imports ensure users only download code necessary for their current workflow.

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
      path: '/contacts',
      name: 'Contacts',
      component: () => import('../views/Contacts.vue'),
      meta: { requiresAuth: true }
    }
  ]
})
```

### Component Lazy Loading

Use **Vue's Suspense** and **defineAsyncComponent** for heavy components that aren't immediately needed.

```vue
<!-- components/organisms/DataTable.vue -->
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
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

// Lazy load heavy components
const AdvancedFilters = defineAsyncComponent(() => 
  import('../molecules/AdvancedFilters.vue')
)

const showAdvancedFilters = ref(false)
</script>
```

### Build Configuration Optimization

Configure **Vite** for optimal bundle generation with proper chunk splitting and compression.

```typescript
// vite.config.ts - Build optimization
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
  }
})
```

## Caching and State Management Optimization

### Multi-Level Caching Strategy

Implement **browser caching**, **service worker caching**, and **application-level caching** to minimize network requests and improve perceived performance.

```typescript
// stores/organizationStore.ts - Optimized state management
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
}

export const useOrganizationStore = defineStore('organizations', () => {
  const organizations = ref<Organization[]>([])
  const loading = ref(false)
  const cache = new CacheManager()

  // Optimized fetch with caching
  const fetchOrganizations = async (params: OrganizationFilters = {}) => {
    const cacheKey = `organizations:${JSON.stringify(params)}`
    const cached = cache.get<OrganizationResponse>(cacheKey)
    
    if (cached) {
      organizations.value = cached.data
      return cached
    }

    loading.value = true
    try {
      const response = await organizationApi.getOrganizations(params)
      organizations.value = response.data
      cache.set(cacheKey, response)
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    organizations,
    loading,
    fetchOrganizations
  }
})
```

### Computed Properties for Performance

Use **computed properties** and **memoization** to avoid expensive recalculations.

```typescript
// Computed values for performance optimization
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
```

## Progressive Web App Optimization

### Service Worker Implementation

Implement **comprehensive PWA capabilities** with service worker optimization, offline functionality, and native-like performance.

```typescript
// sw.ts - Service worker for caching and offline functionality
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

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
```

### Background Sync and Push Notifications

Implement **background sync** for offline actions and **push notifications** for real-time updates.

```typescript
// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
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
      data: data.data
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})
```

## Asset Optimization

### Image Optimization

Implement **responsive images**, **lazy loading**, and **modern image formats** for optimal loading performance.

```typescript
// Image optimization utilities
export const useImageOptimization = () => {
  const loadImage = (src: string, options: ImageOptions = {}) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      // Set loading attribute for native lazy loading
      img.loading = options.lazy ? 'lazy' : 'eager'
      
      img.onload = () => resolve(img)
      img.onerror = reject
      
      // Use WebP format if supported
      if (supportsWebP()) {
        src = src.replace(/\.(jpg|jpeg|png)$/, '.webp')
      }
      
      img.src = src
    })
  }

  const supportsWebP = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  return { loadImage }
}
```

### Font Optimization

Implement **font preloading**, **font-display optimization**, and **variable fonts** for better text rendering performance.

```css
/* Font optimization */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* Improves perceived performance */
  src: url('./fonts/inter-regular.woff2') format('woff2'),
       url('./fonts/inter-regular.woff') format('woff');
}

/* Preload critical fonts */
<link rel="preload" href="./fonts/inter-regular.woff2" as="font" type="font/woff2" crossorigin>
```

## Performance Monitoring

### Real User Monitoring (RUM)

Implement **Core Web Vitals** monitoring and **user experience tracking**.

```typescript
// Performance monitoring utilities
export const usePerformanceMonitoring = () => {
  const trackCoreWebVitals = () => {
    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry.startTime < 2500) {
        console.log('LCP: Good')
      } else {
        console.log('LCP: Needs improvement')
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.processingStart - entry.startTime < 100) {
          console.log('FID: Good')
        } else {
          console.log('FID: Needs improvement')
        }
      })
    }).observe({ entryTypes: ['first-input'] })

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
    }).observe({ entryTypes: ['layout-shift'] })
  }

  return { trackCoreWebVitals }
}
```

### Bundle Analysis

Monitor **bundle sizes** and **dependency analysis** for ongoing optimization.

```typescript
// Bundle analysis utilities
export const analyzeBundleSize = () => {
  const bundleStats = {
    totalSize: 0,
    gzippedSize: 0,
    chunks: []
  }

  // Analyze webpack bundle
  if (process.env.NODE_ENV === 'production') {
    console.log('Bundle analysis available in production build')
    // Use webpack-bundle-analyzer for detailed analysis
  }

  return bundleStats
}
```

## Performance Best Practices

### Code Quality

- Use **TypeScript** for better optimization opportunities
- Implement **tree shaking** to eliminate dead code
- Use **ES modules** for better bundling
- Minimize **external dependencies**

### Asset Management

- Implement **CDN** for static assets
- Use **HTTP/2** for improved loading performance
- Enable **gzip compression** for text resources
- Optimize **CSS delivery** with critical CSS inlining

### Runtime Performance

- Implement **virtual scrolling** for large lists
- Use **debouncing** for search inputs
- Minimize **DOM manipulations**
- Implement **efficient event handling**

## Related Documentation

- [Overview](./overview.md) - Performance architecture and strategy
- [Backend Optimization](./backend-optimization.md) - Database and API optimization
- [Monitoring and APM](./monitoring-apm.md) - Performance monitoring implementation