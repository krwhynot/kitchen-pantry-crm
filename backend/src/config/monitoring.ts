import { supabaseAdmin } from './database'
import { env } from './env'

export interface MonitoringConfig {
  enabled: boolean
  intervals: {
    healthCheck: number
    performanceCheck: number
    alertCheck: number
  }
  thresholds: {
    maxConnections: number
    maxResponseTime: number
    maxErrorRate: number
    minHitRatio: number
  }
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug'
    destinations: string[]
  }
}

export const monitoringConfig: MonitoringConfig = {
  enabled: true,
  intervals: {
    healthCheck: 60000, // 1 minute
    performanceCheck: 300000, // 5 minutes
    alertCheck: 30000 // 30 seconds
  },
  thresholds: {
    maxConnections: 50,
    maxResponseTime: 1000,
    maxErrorRate: 0.05,
    minHitRatio: 0.95
  },
  logging: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    destinations: ['console', 'file']
  }
}

export interface DatabaseMetrics {
  timestamp: string
  connections: {
    active: number
    idle: number
    total: number
  }
  performance: {
    hitRatio: number
    avgResponseTime: number
    transactionRate: number
  }
  health: {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
  }
}

export const collectDatabaseMetrics = async (): Promise<DatabaseMetrics | null> => {
  try {
    const timestamp = new Date().toISOString()
    
    // Get connection stats
    const { data: connectionStats, error: connError } = await supabaseAdmin
      .from('pg_stat_activity')
      .select('state')
      .not('state', 'is', null)
    
    if (connError) {
      console.error('Failed to get connection stats:', connError)
      return null
    }
    
    // Get database performance stats
    const { data: dbStats, error: dbError } = await supabaseAdmin
      .from('pg_stat_database')
      .select('xact_commit, xact_rollback, blks_read, blks_hit, tup_returned, tup_fetched')
      .eq('datname', 'postgres')
      .single()
    
    if (dbError) {
      console.error('Failed to get database stats:', dbError)
      return null
    }
    
    // Process connection data
    const activeConnections = connectionStats?.filter(conn => conn.state === 'active').length || 0
    const idleConnections = connectionStats?.filter(conn => conn.state === 'idle').length || 0
    const totalConnections = connectionStats?.length || 0
    
    // Calculate performance metrics
    const hitRatio = dbStats?.blks_hit / (dbStats?.blks_hit + dbStats?.blks_read) || 0
    const transactionRate = (dbStats?.xact_commit + dbStats?.xact_rollback) || 0
    
    // Determine health status
    const issues: string[] = []
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (totalConnections > monitoringConfig.thresholds.maxConnections) {
      issues.push(`High connection count: ${totalConnections}`)
      healthStatus = 'warning'
    }
    
    if (hitRatio < monitoringConfig.thresholds.minHitRatio) {
      issues.push(`Low cache hit ratio: ${(hitRatio * 100).toFixed(2)}%`)
      healthStatus = 'warning'
    }
    
    if (activeConnections > monitoringConfig.thresholds.maxConnections * 0.8) {
      issues.push(`High active connections: ${activeConnections}`)
      healthStatus = 'critical'
    }
    
    const metrics: DatabaseMetrics = {
      timestamp,
      connections: {
        active: activeConnections,
        idle: idleConnections,
        total: totalConnections
      },
      performance: {
        hitRatio,
        avgResponseTime: 0, // Would be calculated from query history
        transactionRate
      },
      health: {
        status: healthStatus,
        issues
      }
    }
    
    return metrics
  } catch (error) {
    console.error('Failed to collect database metrics:', error)
    return null
  }
}

export const logDatabaseMetrics = async (metrics: DatabaseMetrics) => {
  const logLevel = metrics.health.status === 'critical' ? 'error' : 
                   metrics.health.status === 'warning' ? 'warn' : 'info'
  
  const logEntry = {
    timestamp: metrics.timestamp,
    level: logLevel,
    type: 'database_metrics',
    metrics,
    environment: env.NODE_ENV
  }
  
  // Console logging
  if (monitoringConfig.logging.destinations.includes('console')) {
    console.log(`[${logLevel.toUpperCase()}] DB Metrics:`, JSON.stringify(logEntry, null, 2))
  }
  
  // File logging (would be implemented with a proper logging library)
  if (monitoringConfig.logging.destinations.includes('file')) {
    // In production, this would write to log files
    console.log('Would write to log file:', logEntry)
  }
  
  // Alert on critical issues
  if (metrics.health.status === 'critical') {
    console.error('🚨 CRITICAL DATABASE ALERT:', metrics.health.issues)
  }
}

export const startDatabaseMonitoring = () => {
  if (!monitoringConfig.enabled) {
    console.log('Database monitoring disabled')
    return null
  }
  
  console.log('Starting database monitoring with config:', monitoringConfig)
  
  // Health check interval
  const healthCheckInterval = setInterval(async () => {
    const metrics = await collectDatabaseMetrics()
    if (metrics) {
      await logDatabaseMetrics(metrics)
    }
  }, monitoringConfig.intervals.healthCheck)
  
  // Performance check interval
  const performanceCheckInterval = setInterval(async () => {
    const metrics = await collectDatabaseMetrics()
    if (metrics) {
      console.log('📊 Database Performance Report:', {
        hitRatio: `${(metrics.performance.hitRatio * 100).toFixed(2)}%`,
        connections: metrics.connections,
        health: metrics.health.status
      })
    }
  }, monitoringConfig.intervals.performanceCheck)
  
  // Alert check interval
  const alertCheckInterval = setInterval(async () => {
    const metrics = await collectDatabaseMetrics()
    if (metrics && metrics.health.status === 'critical') {
      console.error('🚨 DATABASE CRITICAL ALERT:', metrics.health.issues)
    }
  }, monitoringConfig.intervals.alertCheck)
  
  return {
    healthCheckInterval,
    performanceCheckInterval,
    alertCheckInterval
  }
}

export const stopDatabaseMonitoring = (intervals: {
  healthCheckInterval: NodeJS.Timeout
  performanceCheckInterval: NodeJS.Timeout
  alertCheckInterval: NodeJS.Timeout
}) => {
  clearInterval(intervals.healthCheckInterval)
  clearInterval(intervals.performanceCheckInterval)
  clearInterval(intervals.alertCheckInterval)
  console.log('Database monitoring stopped')
}

export const getDetailedDatabaseStatus = async () => {
  try {
    const metrics = await collectDatabaseMetrics()
    if (!metrics) return null
    
    // Get additional diagnostic information
    const { data: longRunningQueries, error: queryError } = await supabaseAdmin
      .from('pg_stat_activity')
      .select('query, state, query_start, state_change')
      .not('query', 'is', null)
      .gte('query_start', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
    
    const { data: tableStats, error: tableError } = await supabaseAdmin
      .from('pg_stat_user_tables')
      .select('relname, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup')
      .order('n_live_tup', { ascending: false })
      .limit(10)
    
    return {
      metrics,
      longRunningQueries: longRunningQueries || [],
      tableStats: tableStats || [],
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to get detailed database status:', error)
    return null
  }
}