# Application Performance Monitoring (APM)

## Overview

Application Performance Monitoring (APM) provides comprehensive performance tracking, error monitoring, and user experience analytics for the Kitchen Pantry CRM system. The APM implementation focuses on **real-time monitoring**, **detailed metrics collection**, and **proactive performance management**.

## APM Service Implementation

### Performance Tracking Middleware

Implement **comprehensive performance tracking** with detailed metrics collection for all application requests.

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
          console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${responseTime.toFixed(2)}ms`)
        }

        // Log memory spikes
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
        if (memoryIncrease > 50 * 1024 * 1024) { // 50MB increase
          console.warn(`Memory spike: ${memoryIncrease / 1024 / 1024}MB increase`)
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
    try {
      // Integration with error tracking service (e.g., Sentry)
      console.error('Error tracked:', error.error.message)
    } catch (err) {
      console.error('Failed to send error to tracking service:', err)
    }
  }
}

export const apmService = new APMService()
```

### Performance Analytics

Implement **comprehensive performance analytics** with statistical analysis and trending.

```typescript
// Performance analytics methods
class APMService {
  // ... previous code ...

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
}
```

### Health Check Implementation

Implement **comprehensive health checks** with status determination and system monitoring.

```typescript
// Health check implementation
class APMService {
  // ... previous code ...

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
```

## User Experience Monitoring

### Real User Monitoring (RUM)

Implement **client-side monitoring** for real user experience tracking.

```typescript
// Frontend monitoring utilities
export const useRealUserMonitoring = () => {
  const trackPageLoad = () => {
    window.addEventListener('load', () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics = {
        domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
        loadComplete: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
        timeToFirstByte: navigationTiming.responseStart - navigationTiming.requestStart,
        domainLookup: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
        tcpConnection: navigationTiming.connectEnd - navigationTiming.connectStart,
        serverResponse: navigationTiming.responseEnd - navigationTiming.responseStart,
        pageRender: navigationTiming.loadEventEnd - navigationTiming.responseEnd
      }

      // Send metrics to backend
      sendMetrics('page_load', metrics)
    })
  }

  const trackUserInteractions = () => {
    // Track click events
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const metrics = {
        element: target.tagName,
        id: target.id,
        className: target.className,
        timestamp: Date.now()
      }

      sendMetrics('user_interaction', metrics)
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      const metrics = {
        formId: form.id,
        formAction: form.action,
        timestamp: Date.now()
      }

      sendMetrics('form_submission', metrics)
    })
  }

  const trackCoreWebVitals = () => {
    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      sendMetrics('lcp', {
        value: lastEntry.startTime,
        rating: lastEntry.startTime < 2500 ? 'good' : 'needs-improvement'
      })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        const delay = entry.processingStart - entry.startTime
        sendMetrics('fid', {
          value: delay,
          rating: delay < 100 ? 'good' : 'needs-improvement'
        })
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
      
      sendMetrics('cls', {
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : 'needs-improvement'
      })
    }).observe({ entryTypes: ['layout-shift'] })
  }

  const sendMetrics = async (type: string, data: any) => {
    try {
      await fetch('/api/v1/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (error) {
      console.error('Failed to send metrics:', error)
    }
  }

  return {
    trackPageLoad,
    trackUserInteractions,
    trackCoreWebVitals
  }
}
```

## Performance Dashboards

### Metrics Dashboard

Create **comprehensive performance dashboards** for monitoring and analysis.

```typescript
// Dashboard data aggregation
export class PerformanceDashboard {
  private apmService: APMService

  constructor(apmService: APMService) {
    this.apmService = apmService
  }

  async getDashboardData(timeWindow = 3600000) {
    const performanceStats = this.apmService.getPerformanceStats(timeWindow)
    const errorStats = this.apmService.getErrorStats(timeWindow)
    const healthStatus = this.apmService.getHealthStatus()

    return {
      overview: {
        totalRequests: performanceStats?.totalRequests || 0,
        averageResponseTime: performanceStats?.averageResponseTime || 0,
        errorRate: performanceStats?.errorRate || 0,
        healthStatus: healthStatus.status
      },
      performance: {
        responseTimeDistribution: this.getResponseTimeDistribution(performanceStats),
        topSlowEndpoints: this.getTopSlowEndpoints(timeWindow),
        memoryUsage: performanceStats?.memoryUsage || null
      },
      errors: {
        totalErrors: errorStats?.totalErrors || 0,
        errorsByType: errorStats?.errorsByType || {},
        errorsByEndpoint: errorStats?.errorsByEndpoint || {},
        topErrors: errorStats?.topErrors || []
      },
      trends: {
        responseTimeTrend: this.getResponseTimeTrend(timeWindow),
        errorRateTrend: this.getErrorRateTrend(timeWindow),
        throughputTrend: this.getThroughputTrend(timeWindow)
      }
    }
  }

  private getResponseTimeDistribution(stats: any) {
    if (!stats) return null

    return {
      '< 100ms': stats.responseTimes?.filter((t: number) => t < 100).length || 0,
      '100-500ms': stats.responseTimes?.filter((t: number) => t >= 100 && t < 500).length || 0,
      '500ms-1s': stats.responseTimes?.filter((t: number) => t >= 500 && t < 1000).length || 0,
      '1s-2s': stats.responseTimes?.filter((t: number) => t >= 1000 && t < 2000).length || 0,
      '> 2s': stats.responseTimes?.filter((t: number) => t >= 2000).length || 0
    }
  }

  private getTopSlowEndpoints(timeWindow: number) {
    const cutoff = Date.now() - timeWindow
    const recentMetrics = this.apmService.metrics.filter(m => m.timestamp > cutoff)

    const endpointStats = recentMetrics.reduce((acc, metric) => {
      const endpoint = `${metric.method} ${metric.url}`
      if (!acc[endpoint]) {
        acc[endpoint] = {
          count: 0,
          totalTime: 0,
          maxTime: 0
        }
      }
      acc[endpoint].count++
      acc[endpoint].totalTime += metric.responseTime
      acc[endpoint].maxTime = Math.max(acc[endpoint].maxTime, metric.responseTime)
      return acc
    }, {} as Record<string, any>)

    return Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count,
        maxTime: stats.maxTime,
        count: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)
  }

  private getResponseTimeTrend(timeWindow: number) {
    // Implementation for response time trend analysis
    return []
  }

  private getErrorRateTrend(timeWindow: number) {
    // Implementation for error rate trend analysis
    return []
  }

  private getThroughputTrend(timeWindow: number) {
    // Implementation for throughput trend analysis
    return []
  }
}
```

## Express Route Handlers

### APM API Endpoints

Create **API endpoints** for accessing performance metrics and health status.

```typescript
// Express route handlers
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

// Dashboard data handler
export const dashboardDataHandler = async (req: Request, res: Response) => {
  const timeWindow = parseInt(req.query.timeWindow as string) || 3600000
  const dashboard = new PerformanceDashboard(apmService)
  const data = await dashboard.getDashboardData(timeWindow)
  
  res.json({
    success: true,
    data,
    timestamp: Date.now()
  })
}
```

## Integration Best Practices

### APM Configuration

- Configure **appropriate sampling rates** for high-traffic environments
- Implement **data retention policies** to manage storage costs
- Use **asynchronous processing** for metric collection to avoid performance impact
- Set up **proper alerting thresholds** based on application requirements

### Monitoring Strategy

- Monitor **key performance indicators** (KPIs) relevant to business objectives
- Implement **distributed tracing** for complex request flows
- Use **real user monitoring** to understand actual user experience
- Set up **automated anomaly detection** for proactive issue identification

## Related Documentation

- [Overview](./overview.md) - Performance architecture and strategy
- [Alerting System](./alerting-system.md) - Real-time alerting implementation
- [Frontend Optimization](./frontend-optimization.md) - Client-side performance strategies
- [Backend Optimization](./backend-optimization.md) - Server-side optimization techniques