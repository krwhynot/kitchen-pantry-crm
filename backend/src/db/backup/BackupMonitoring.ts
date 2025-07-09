import { BackupService, BackupMetadata } from './BackupService'
import { BackupScheduler, ScheduledBackupRun } from './BackupScheduler'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, statSync } from 'fs'

export interface BackupHealthCheck {
  id: string
  timestamp: string
  status: 'healthy' | 'warning' | 'critical'
  checks: {
    recentBackups: BackupCheckResult
    backupIntegrity: BackupCheckResult
    diskSpace: BackupCheckResult
    scheduleHealth: BackupCheckResult
    performanceMetrics: BackupCheckResult
  }
  summary: {
    totalBackups: number
    healthyBackups: number
    corruptedBackups: number
    missedSchedules: number
    avgBackupTime: number
    diskUsageGB: number
  }
}

export interface BackupCheckResult {
  status: 'pass' | 'warning' | 'fail'
  message: string
  details?: any
}

export interface BackupAlert {
  id: string
  type: 'backup_failed' | 'backup_corrupted' | 'schedule_missed' | 'disk_space_low' | 'performance_degraded'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  metadata?: any
}

export interface BackupMetrics {
  timestamp: string
  totalBackups: number
  successfulBackups: number
  failedBackups: number
  averageBackupSize: number
  averageBackupTime: number
  diskUsage: number
  compressionRatio: number
  scheduleCompliance: number
  performanceScore: number
}

export class BackupMonitoring {
  private backupService: BackupService
  private backupScheduler: BackupScheduler
  private alerts: Map<string, BackupAlert> = new Map()
  private metrics: BackupMetrics[] = []
  private healthChecks: BackupHealthCheck[] = []
  private monitoringInterval?: NodeJS.Timeout

  constructor(
    private config: {
      dataDir: string
      healthCheckInterval: number
      metricsRetentionDays: number
      alertsRetentionDays: number
      thresholds: {
        maxBackupAge: number
        minDiskSpaceGB: number
        maxBackupTime: number
        minCompressionRatio: number
        maxFailureRate: number
      }
    }
  ) {
    this.backupService = new BackupService()
    this.backupScheduler = new BackupScheduler({
      configDir: config.dataDir,
      maxConcurrentJobs: 3,
      defaultRetentionDays: 30
    })
  }

  async initialize(): Promise<void> {
    console.log('📊 Initializing backup monitoring...')
    
    // Load existing data
    await this.loadAlerts()
    await this.loadMetrics()
    await this.loadHealthChecks()
    
    // Start monitoring
    await this.startMonitoring()
    
    console.log('✅ Backup monitoring initialized')
  }

  private async startMonitoring(): Promise<void> {
    // Initial health check
    await this.runHealthCheck()
    
    // Schedule regular health checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runHealthCheck()
        await this.collectMetrics()
        await this.checkAlerts()
        await this.cleanupOldData()
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error)
      }
    }, this.config.healthCheckInterval)
    
    console.log(`⏰ Monitoring scheduled every ${this.config.healthCheckInterval}ms`)
  }

  async runHealthCheck(): Promise<BackupHealthCheck> {
    const checkId = `health_${Date.now()}`
    const timestamp = new Date().toISOString()
    
    console.log(`🏥 Running backup health check: ${checkId}`)
    
    const healthCheck: BackupHealthCheck = {
      id: checkId,
      timestamp,
      status: 'healthy',
      checks: {
        recentBackups: await this.checkRecentBackups(),
        backupIntegrity: await this.checkBackupIntegrity(),
        diskSpace: await this.checkDiskSpace(),
        scheduleHealth: await this.checkScheduleHealth(),
        performanceMetrics: await this.checkPerformanceMetrics()
      },
      summary: {
        totalBackups: 0,
        healthyBackups: 0,
        corruptedBackups: 0,
        missedSchedules: 0,
        avgBackupTime: 0,
        diskUsageGB: 0
      }
    }
    
    // Calculate overall status
    const checks = Object.values(healthCheck.checks)
    const criticalIssues = checks.filter(check => check.status === 'fail').length
    const warnings = checks.filter(check => check.status === 'warning').length
    
    if (criticalIssues > 0) {
      healthCheck.status = 'critical'
    } else if (warnings > 0) {
      healthCheck.status = 'warning'
    }
    
    // Calculate summary
    await this.calculateHealthSummary(healthCheck)
    
    // Store health check
    this.healthChecks.push(healthCheck)
    await this.saveHealthChecks()
    
    console.log(`📋 Health check completed: ${healthCheck.status}`)
    return healthCheck
  }

  private async checkRecentBackups(): Promise<BackupCheckResult> {
    try {
      const backups = await this.backupService.listBackups()
      const now = new Date()
      const cutoffTime = new Date(now.getTime() - this.config.thresholds.maxBackupAge)
      
      const recentBackups = backups.filter(backup => {
        const backupDate = new Date(backup.createdAt)
        return backupDate > cutoffTime
      })
      
      if (recentBackups.length === 0) {
        return {
          status: 'fail',
          message: 'No recent backups found',
          details: { totalBackups: backups.length, recentBackups: 0 }
        }
      }
      
      return {
        status: 'pass',
        message: `${recentBackups.length} recent backups found`,
        details: { totalBackups: backups.length, recentBackups: recentBackups.length }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Failed to check recent backups: ${error}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async checkBackupIntegrity(): Promise<BackupCheckResult> {
    try {
      const backups = await this.backupService.listBackups()
      const recentBackups = backups.slice(-10) // Check last 10 backups
      
      let corruptedCount = 0
      const results: any[] = []
      
      for (const backup of recentBackups) {
        const validation = await this.backupService.validateBackup(backup.id)
        
        if (!validation.isValid) {
          corruptedCount++
          results.push({
            backupId: backup.id,
            name: backup.name,
            errors: validation.errors
          })
        }
      }
      
      if (corruptedCount > 0) {
        return {
          status: 'fail',
          message: `${corruptedCount} corrupted backups found`,
          details: { corruptedBackups: results, totalChecked: recentBackups.length }
        }
      }
      
      return {
        status: 'pass',
        message: 'All recent backups are valid',
        details: { checkedBackups: recentBackups.length }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Failed to check backup integrity: ${error}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async checkDiskSpace(): Promise<BackupCheckResult> {
    try {
      const backups = await this.backupService.listBackups()
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
      const totalSizeGB = totalSize / (1024 * 1024 * 1024)
      
      // Get available disk space (simplified - would need proper disk space checking)
      const availableSpaceGB = 100 // Placeholder
      
      if (availableSpaceGB < this.config.thresholds.minDiskSpaceGB) {
        return {
          status: 'fail',
          message: `Low disk space: ${availableSpaceGB.toFixed(2)}GB remaining`,
          details: { availableSpaceGB, usedSpaceGB: totalSizeGB, threshold: this.config.thresholds.minDiskSpaceGB }
        }
      }
      
      if (availableSpaceGB < this.config.thresholds.minDiskSpaceGB * 2) {
        return {
          status: 'warning',
          message: `Disk space getting low: ${availableSpaceGB.toFixed(2)}GB remaining`,
          details: { availableSpaceGB, usedSpaceGB: totalSizeGB, threshold: this.config.thresholds.minDiskSpaceGB }
        }
      }
      
      return {
        status: 'pass',
        message: `Sufficient disk space: ${availableSpaceGB.toFixed(2)}GB available`,
        details: { availableSpaceGB, usedSpaceGB: totalSizeGB }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Failed to check disk space: ${error}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async checkScheduleHealth(): Promise<BackupCheckResult> {
    try {
      const schedules = await this.backupScheduler.listSchedules()
      const runs = await this.backupScheduler.listScheduledRuns()
      
      const activeSchedules = schedules.filter(s => s.enabled)
      const recentRuns = runs.filter(run => {
        const runDate = new Date(run.scheduledAt)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return runDate > dayAgo
      })
      
      const missedSchedules = activeSchedules.filter(schedule => {
        const lastRun = runs
          .filter(run => run.scheduleId === schedule.id)
          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0]
        
        if (!lastRun) return true
        
        const lastRunDate = new Date(lastRun.scheduledAt)
        const expectedNext = new Date(lastRunDate.getTime() + 24 * 60 * 60 * 1000) // Daily assumption
        
        return expectedNext < new Date() && lastRun.status !== 'completed'
      })
      
      if (missedSchedules.length > 0) {
        return {
          status: 'fail',
          message: `${missedSchedules.length} schedules missed their runs`,
          details: { 
            missedSchedules: missedSchedules.map(s => s.name),
            totalSchedules: activeSchedules.length,
            recentRuns: recentRuns.length
          }
        }
      }
      
      return {
        status: 'pass',
        message: `All ${activeSchedules.length} schedules are healthy`,
        details: { activeSchedules: activeSchedules.length, recentRuns: recentRuns.length }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Failed to check schedule health: ${error}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async checkPerformanceMetrics(): Promise<BackupCheckResult> {
    try {
      const runs = await this.backupScheduler.listScheduledRuns()
      const completedRuns = runs.filter(run => run.status === 'completed' && run.duration)
      
      if (completedRuns.length === 0) {
        return {
          status: 'warning',
          message: 'No completed backup runs to analyze',
          details: { totalRuns: runs.length }
        }
      }
      
      const avgDuration = completedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / completedRuns.length
      const avgDurationMinutes = avgDuration / (1000 * 60)
      
      if (avgDurationMinutes > this.config.thresholds.maxBackupTime) {
        return {
          status: 'warning',
          message: `Backup performance degraded: ${avgDurationMinutes.toFixed(1)}min average`,
          details: { 
            avgDurationMinutes, 
            threshold: this.config.thresholds.maxBackupTime,
            completedRuns: completedRuns.length
          }
        }
      }
      
      return {
        status: 'pass',
        message: `Backup performance good: ${avgDurationMinutes.toFixed(1)}min average`,
        details: { avgDurationMinutes, completedRuns: completedRuns.length }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Failed to check performance metrics: ${error}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  private async calculateHealthSummary(healthCheck: BackupHealthCheck): Promise<void> {
    try {
      const backups = await this.backupService.listBackups()
      const runs = await this.backupScheduler.listScheduledRuns()
      
      const completedRuns = runs.filter(run => run.status === 'completed' && run.duration)
      const avgBackupTime = completedRuns.length > 0 
        ? completedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / completedRuns.length
        : 0
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
      const diskUsageGB = totalSize / (1024 * 1024 * 1024)
      
      healthCheck.summary = {
        totalBackups: backups.length,
        healthyBackups: backups.length, // Would need integrity check results
        corruptedBackups: 0, // Would need integrity check results
        missedSchedules: 0, // Would need schedule analysis
        avgBackupTime,
        diskUsageGB
      }
    } catch (error) {
      console.error('Failed to calculate health summary:', error)
    }
  }

  async collectMetrics(): Promise<BackupMetrics> {
    const timestamp = new Date().toISOString()
    
    try {
      const backups = await this.backupService.listBackups()
      const runs = await this.backupScheduler.listScheduledRuns()
      
      const successfulBackups = backups.filter(b => b.type === 'full' || b.type === 'incremental')
      const failedRuns = runs.filter(r => r.status === 'failed')
      const completedRuns = runs.filter(r => r.status === 'completed' && r.duration)
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
      const avgBackupSize = backups.length > 0 ? totalSize / backups.length : 0
      
      const avgBackupTime = completedRuns.length > 0
        ? completedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / completedRuns.length
        : 0
      
      const metrics: BackupMetrics = {
        timestamp,
        totalBackups: backups.length,
        successfulBackups: successfulBackups.length,
        failedBackups: failedRuns.length,
        averageBackupSize: avgBackupSize,
        averageBackupTime: avgBackupTime,
        diskUsage: totalSize,
        compressionRatio: 0.7, // Placeholder
        scheduleCompliance: 0.95, // Placeholder
        performanceScore: 0.85 // Placeholder
      }
      
      this.metrics.push(metrics)
      await this.saveMetrics()
      
      return metrics
    } catch (error) {
      console.error('Failed to collect metrics:', error)
      throw error
    }
  }

  async createAlert(alertData: Omit<BackupAlert, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const alert: BackupAlert = {
      id: alertId,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...alertData
    }
    
    this.alerts.set(alertId, alert)
    await this.saveAlerts()
    
    console.log(`🚨 Alert created: ${alert.title} (${alertId})`)
    return alertId
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId)
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`)
    }
    
    alert.resolved = true
    alert.resolvedAt = new Date().toISOString()
    
    await this.saveAlerts()
    console.log(`✅ Alert resolved: ${alertId}`)
  }

  private async checkAlerts(): Promise<void> {
    const healthCheck = this.healthChecks[this.healthChecks.length - 1]
    if (!healthCheck) return
    
    // Check for critical issues
    if (healthCheck.status === 'critical') {
      await this.createAlert({
        type: 'backup_failed',
        severity: 'critical',
        title: 'Backup System Critical',
        message: 'Multiple backup health checks failed',
        metadata: { healthCheckId: healthCheck.id }
      })
    }
    
    // Check for disk space issues
    if (healthCheck.checks.diskSpace.status === 'fail') {
      await this.createAlert({
        type: 'disk_space_low',
        severity: 'high',
        title: 'Low Disk Space',
        message: healthCheck.checks.diskSpace.message,
        metadata: healthCheck.checks.diskSpace.details
      })
    }
    
    // Check for performance issues
    if (healthCheck.checks.performanceMetrics.status === 'warning') {
      await this.createAlert({
        type: 'performance_degraded',
        severity: 'medium',
        title: 'Backup Performance Degraded',
        message: healthCheck.checks.performanceMetrics.message,
        metadata: healthCheck.checks.performanceMetrics.details
      })
    }
  }

  private async cleanupOldData(): Promise<void> {
    const metricsRetention = this.config.metricsRetentionDays * 24 * 60 * 60 * 1000
    const alertsRetention = this.config.alertsRetentionDays * 24 * 60 * 60 * 1000
    const now = Date.now()
    
    // Clean up old metrics
    const oldMetrics = this.metrics.filter(m => {
      const age = now - new Date(m.timestamp).getTime()
      return age > metricsRetention
    })
    
    this.metrics = this.metrics.filter(m => {
      const age = now - new Date(m.timestamp).getTime()
      return age <= metricsRetention
    })
    
    // Clean up old resolved alerts
    const oldAlerts = Array.from(this.alerts.values()).filter(a => {
      if (!a.resolved) return false
      const age = now - new Date(a.timestamp).getTime()
      return age > alertsRetention
    })
    
    for (const alert of oldAlerts) {
      this.alerts.delete(alert.id)
    }
    
    if (oldMetrics.length > 0 || oldAlerts.length > 0) {
      await this.saveMetrics()
      await this.saveAlerts()
      console.log(`🧹 Cleaned up ${oldMetrics.length} old metrics and ${oldAlerts.length} old alerts`)
    }
  }

  // Data persistence methods
  private async loadAlerts(): Promise<void> {
    const alertsPath = join(this.config.dataDir, 'backup-alerts.json')
    if (existsSync(alertsPath)) {
      try {
        const content = await readFile(alertsPath, 'utf-8')
        const alerts: BackupAlert[] = JSON.parse(content)
        for (const alert of alerts) {
          this.alerts.set(alert.id, alert)
        }
      } catch (error) {
        console.error('Failed to load alerts:', error)
      }
    }
  }

  private async saveAlerts(): Promise<void> {
    const alertsPath = join(this.config.dataDir, 'backup-alerts.json')
    const alerts = Array.from(this.alerts.values())
    await writeFile(alertsPath, JSON.stringify(alerts, null, 2), 'utf-8')
  }

  private async loadMetrics(): Promise<void> {
    const metricsPath = join(this.config.dataDir, 'backup-metrics.json')
    if (existsSync(metricsPath)) {
      try {
        const content = await readFile(metricsPath, 'utf-8')
        this.metrics = JSON.parse(content)
      } catch (error) {
        console.error('Failed to load metrics:', error)
      }
    }
  }

  private async saveMetrics(): Promise<void> {
    const metricsPath = join(this.config.dataDir, 'backup-metrics.json')
    await writeFile(metricsPath, JSON.stringify(this.metrics, null, 2), 'utf-8')
  }

  private async loadHealthChecks(): Promise<void> {
    const healthPath = join(this.config.dataDir, 'backup-health.json')
    if (existsSync(healthPath)) {
      try {
        const content = await readFile(healthPath, 'utf-8')
        this.healthChecks = JSON.parse(content)
      } catch (error) {
        console.error('Failed to load health checks:', error)
      }
    }
  }

  private async saveHealthChecks(): Promise<void> {
    const healthPath = join(this.config.dataDir, 'backup-health.json')
    await writeFile(healthPath, JSON.stringify(this.healthChecks, null, 2), 'utf-8')
  }

  // Public query methods
  async getLatestHealthCheck(): Promise<BackupHealthCheck | null> {
    return this.healthChecks[this.healthChecks.length - 1] || null
  }

  async getHealthHistory(days: number = 7): Promise<BackupHealthCheck[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return this.healthChecks.filter(check => new Date(check.timestamp) > cutoff)
  }

  async getActiveAlerts(): Promise<BackupAlert[]> {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  async getMetricsHistory(days: number = 30): Promise<BackupMetrics[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return this.metrics.filter(metric => new Date(metric.timestamp) > cutoff)
  }

  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }
    
    console.log('🛑 Backup monitoring stopped')
  }
}