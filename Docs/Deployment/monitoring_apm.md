monitoring_apm
title: Application Performance Monitoring
---
This section describes the application performance monitoring (APM) capabilities integrated into the deployment, including performance metrics collection, error tracking, and real user monitoring for proactive issue detection and optimization.

## Monitoring and Observability

### Application Performance Monitoring

The deployment includes comprehensive monitoring and observability capabilities for proactive issue detection and performance optimization.

**Performance Metrics:** Application performance monitoring including response times, throughput, error rates, and resource utilization. Performance metrics include real-time dashboards, alerting, and trend analysis.

**Error Tracking:** Comprehensive error tracking with stack traces, user context, and impact analysis. Error tracking includes automatic error grouping, notification systems, and resolution tracking.

**User Experience Monitoring:** Real user monitoring (RUM) for frontend performance including page load times, user interactions, and conversion tracking. User experience monitoring includes performance budgets and optimization recommendations.

```typescript
// monitoring/metrics.ts
import { createPrometheusMetrics } from 'prom-client'

export class MetricsService {
  private static instance: MetricsService
  private httpRequestDuration: any
  private httpRequestTotal: any
  private databaseQueryDuration: any
  private activeConnections: any

  constructor() {
    this.initializeMetrics()
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService()
    }
    return MetricsService.instance
  }

  private initializeMetrics() {
    const promClient = require('prom-client')
    
    // HTTP request metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    })

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    })

    // Database metrics
    this.databaseQueryDuration = new promClient.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5]
    })

    this.activeConnections = new promClient.Gauge({
      name: 'database_active_connections',
      help: 'Number of active database connections'
    })

    // Collect default metrics
    promClient.collectDefaultMetrics()
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration)
    
    this.httpRequestTotal
      .labels(method, route, statusCode.toString())
      .inc()
  }

  recordDatabaseQuery(queryType: string, table: string, duration: number) {
    this.databaseQueryDuration
      .labels(queryType, table)
      .observe(duration)
  }

  updateActiveConnections(count: number) {
    this.activeConnections.set(count)
  }

  getMetrics() {
    const promClient = require('prom-client')
    return promClient.register.metrics()
  }
}

// Express middleware for metrics collection
export function metricsMiddleware() {
  const metrics = MetricsService.getInstance()
  
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000
      metrics.recordHttpRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration
      )
    })
    
    next()
  }
}