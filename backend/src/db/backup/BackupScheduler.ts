import { BackupService, BackupConfig, BackupMetadata } from './BackupService'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface ScheduleConfig {
  id: string
  name: string
  cron: string
  backupConfig: BackupConfig
  enabled: boolean
  retentionDays: number
  notifications: {
    onSuccess: string[]
    onFailure: string[]
  }
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ScheduledBackupRun {
  id: string
  scheduleId: string
  scheduledAt: string
  startedAt?: string
  completedAt?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  backupId?: string
  error?: string
  duration?: number
  metadata?: BackupMetadata
}

export interface BackupSchedulerStats {
  totalSchedules: number
  activeSchedules: number
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  lastRunTime?: string
  nextRunTime?: string
  averageRunTime: number
  diskUsage: number
}

export class BackupScheduler {
  private schedules: Map<string, ScheduleConfig> = new Map()
  private scheduledRuns: Map<string, ScheduledBackupRun> = new Map()
  private runningJobs: Map<string, NodeJS.Timeout> = new Map()
  private backupService: BackupService
  private configPath: string

  constructor(
    private schedulerConfig: {
      configDir: string
      maxConcurrentJobs: number
      defaultRetentionDays: number
    }
  ) {
    this.configPath = join(schedulerConfig.configDir, 'backup-schedules.json')
    this.backupService = new BackupService()
  }

  async initialize(): Promise<void> {
    console.log('🕐 Initializing backup scheduler...')
    
    // Load existing schedules
    await this.loadSchedules()
    
    // Start scheduling
    await this.startScheduling()
    
    // Clean up old runs
    await this.cleanupOldRuns()
    
    console.log(`✅ Backup scheduler initialized with ${this.schedules.size} schedules`)
  }

  async createSchedule(scheduleConfig: Omit<ScheduleConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const scheduleId = this.generateScheduleId()
    
    const schedule: ScheduleConfig = {
      id: scheduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...scheduleConfig
    }

    // Validate cron expression
    if (!this.isValidCronExpression(schedule.cron)) {
      throw new Error(`Invalid cron expression: ${schedule.cron}`)
    }

    this.schedules.set(scheduleId, schedule)
    await this.saveSchedules()

    // Schedule the job
    if (schedule.enabled) {
      await this.scheduleJob(schedule)
    }

    console.log(`📅 Created backup schedule: ${schedule.name} (${scheduleId})`)
    return scheduleId
  }

  async updateSchedule(scheduleId: string, updates: Partial<ScheduleConfig>): Promise<void> {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`)
    }

    // Validate cron if being updated
    if (updates.cron && !this.isValidCronExpression(updates.cron)) {
      throw new Error(`Invalid cron expression: ${updates.cron}`)
    }

    const updatedSchedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.schedules.set(scheduleId, updatedSchedule)
    await this.saveSchedules()

    // Reschedule if enabled status or cron changed
    if (updates.enabled !== undefined || updates.cron) {
      await this.rescheduleJob(scheduleId)
    }

    console.log(`📝 Updated backup schedule: ${scheduleId}`)
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`)
    }

    // Cancel any running job
    const runningJob = this.runningJobs.get(scheduleId)
    if (runningJob) {
      clearTimeout(runningJob)
      this.runningJobs.delete(scheduleId)
    }

    this.schedules.delete(scheduleId)
    await this.saveSchedules()

    console.log(`🗑️ Deleted backup schedule: ${scheduleId}`)
  }

  async executeSchedule(scheduleId: string, force = false): Promise<ScheduledBackupRun> {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`)
    }

    if (!schedule.enabled && !force) {
      throw new Error(`Schedule is disabled: ${scheduleId}`)
    }

    const runId = this.generateRunId()
    const scheduledRun: ScheduledBackupRun = {
      id: runId,
      scheduleId,
      scheduledAt: new Date().toISOString(),
      status: 'pending'
    }

    this.scheduledRuns.set(runId, scheduledRun)

    // Execute backup asynchronously
    this.executeBackupRun(scheduledRun, schedule).catch(error => {
      console.error(`❌ Backup run failed: ${runId}`, error)
      scheduledRun.status = 'failed'
      scheduledRun.error = error.message
      scheduledRun.completedAt = new Date().toISOString()
    })

    return scheduledRun
  }

  private async executeBackupRun(run: ScheduledBackupRun, schedule: ScheduleConfig): Promise<void> {
    try {
      run.status = 'running'
      run.startedAt = new Date().toISOString()

      console.log(`🚀 Starting scheduled backup: ${schedule.name} (${run.id})`)

      // Generate backup name with timestamp
      const backupName = `${schedule.name}_${new Date().toISOString().split('T')[0]}`
      
      // Execute backup
      const backupJob = await this.backupService.createFullBackup(backupName, schedule.backupConfig)
      
      // Wait for backup to complete
      await this.waitForBackupCompletion(backupJob.id)
      
      const completedJob = await this.backupService.getBackupJob(backupJob.id)
      
      if (completedJob?.status === 'completed' && completedJob.metadata) {
        run.status = 'completed'
        run.backupId = completedJob.metadata.id
        run.metadata = completedJob.metadata
        
        console.log(`✅ Scheduled backup completed: ${schedule.name} (${run.id})`)
        
        // Send success notification
        await this.sendNotification(schedule, run, 'success')
        
        // Clean up old backups based on retention policy
        await this.cleanupOldBackups(schedule)
      } else {
        throw new Error(`Backup job failed: ${completedJob?.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      run.status = 'failed'
      run.error = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ Scheduled backup failed: ${schedule.name} (${run.id})`, error)
      
      // Send failure notification
      await this.sendNotification(schedule, run, 'failure')
      
      throw error
    } finally {
      run.completedAt = new Date().toISOString()
      
      if (run.startedAt) {
        const startTime = new Date(run.startedAt).getTime()
        const endTime = new Date(run.completedAt).getTime()
        run.duration = endTime - startTime
      }
    }
  }

  private async waitForBackupCompletion(backupJobId: string): Promise<void> {
    const timeout = 30 * 60 * 1000 // 30 minutes
    const pollInterval = 5000 // 5 seconds
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const job = await this.backupService.getBackupJob(backupJobId)
      
      if (!job) {
        throw new Error(`Backup job not found: ${backupJobId}`)
      }

      if (job.status === 'completed') {
        return
      }

      if (job.status === 'failed') {
        throw new Error(`Backup job failed: ${job.error}`)
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error(`Backup job timeout: ${backupJobId}`)
  }

  private async scheduleJob(schedule: ScheduleConfig): Promise<void> {
    const nextRun = this.calculateNextRun(schedule.cron)
    const delay = nextRun.getTime() - Date.now()

    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.executeSchedule(schedule.id)
        await this.scheduleJob(schedule) // Reschedule for next run
      }, delay)

      this.runningJobs.set(schedule.id, timeout)
      
      console.log(`⏰ Scheduled backup "${schedule.name}" for ${nextRun.toISOString()}`)
    }
  }

  private async rescheduleJob(scheduleId: string): Promise<void> {
    // Cancel existing job
    const existingJob = this.runningJobs.get(scheduleId)
    if (existingJob) {
      clearTimeout(existingJob)
      this.runningJobs.delete(scheduleId)
    }

    // Schedule new job if enabled
    const schedule = this.schedules.get(scheduleId)
    if (schedule?.enabled) {
      await this.scheduleJob(schedule)
    }
  }

  private async startScheduling(): Promise<void> {
    for (const schedule of this.schedules.values()) {
      if (schedule.enabled) {
        await this.scheduleJob(schedule)
      }
    }
  }

  private async cleanupOldBackups(schedule: ScheduleConfig): Promise<void> {
    if (schedule.retentionDays <= 0) return

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - schedule.retentionDays)

    const allBackups = await this.backupService.listBackups()
    const oldBackups = allBackups.filter(backup => {
      const backupDate = new Date(backup.createdAt)
      return backupDate < cutoffDate && backup.tags?.includes(`schedule:${schedule.id}`)
    })

    for (const backup of oldBackups) {
      try {
        await this.backupService.deleteBackup(backup.id)
        console.log(`🗑️ Deleted old backup: ${backup.name} (${backup.id})`)
      } catch (error) {
        console.warn(`Failed to delete old backup ${backup.id}:`, error)
      }
    }
  }

  private async cleanupOldRuns(): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30) // Keep runs for 30 days

    const oldRuns = Array.from(this.scheduledRuns.values()).filter(run => {
      const runDate = new Date(run.scheduledAt)
      return runDate < cutoffDate
    })

    for (const run of oldRuns) {
      this.scheduledRuns.delete(run.id)
    }

    console.log(`🧹 Cleaned up ${oldRuns.length} old backup runs`)
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simplified cron parser - in production, use a proper cron library
    const parts = cronExpression.split(' ')
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: ${cronExpression}`)
    }

    const now = new Date()
    const next = new Date(now)
    
    // For now, just handle daily backups at a specific hour
    if (cronExpression.startsWith('0 ')) {
      const hour = parseInt(parts[1])
      next.setHours(hour, 0, 0, 0)
      
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
    } else {
      // Default to next hour for other patterns
      next.setHours(next.getHours() + 1, 0, 0, 0)
    }

    return next
  }

  private isValidCronExpression(cron: string): boolean {
    const parts = cron.split(' ')
    return parts.length === 5 // Basic validation
  }

  private async sendNotification(
    schedule: ScheduleConfig,
    run: ScheduledBackupRun,
    type: 'success' | 'failure'
  ): Promise<void> {
    const recipients = type === 'success' ? schedule.notifications.onSuccess : schedule.notifications.onFailure
    
    if (recipients.length === 0) return

    const message = type === 'success'
      ? `✅ Backup "${schedule.name}" completed successfully`
      : `❌ Backup "${schedule.name}" failed: ${run.error}`

    console.log(`📧 Sending notification: ${message}`)
    
    // In production, integrate with email service, Slack, etc.
    for (const recipient of recipients) {
      console.log(`  → ${recipient}: ${message}`)
    }
  }

  private async loadSchedules(): Promise<void> {
    if (existsSync(this.configPath)) {
      try {
        const content = await readFile(this.configPath, 'utf-8')
        const schedules: ScheduleConfig[] = JSON.parse(content)
        
        for (const schedule of schedules) {
          this.schedules.set(schedule.id, schedule)
        }
        
        console.log(`📂 Loaded ${schedules.length} backup schedules`)
      } catch (error) {
        console.error('Failed to load backup schedules:', error)
      }
    }
  }

  private async saveSchedules(): Promise<void> {
    try {
      const schedules = Array.from(this.schedules.values())
      await writeFile(this.configPath, JSON.stringify(schedules, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save backup schedules:', error)
      throw error
    }
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public query methods
  async listSchedules(): Promise<ScheduleConfig[]> {
    return Array.from(this.schedules.values())
  }

  async getSchedule(scheduleId: string): Promise<ScheduleConfig | null> {
    return this.schedules.get(scheduleId) || null
  }

  async listScheduledRuns(scheduleId?: string): Promise<ScheduledBackupRun[]> {
    const runs = Array.from(this.scheduledRuns.values())
    return scheduleId ? runs.filter(run => run.scheduleId === scheduleId) : runs
  }

  async getScheduledRun(runId: string): Promise<ScheduledBackupRun | null> {
    return this.scheduledRuns.get(runId) || null
  }

  async getStats(): Promise<BackupSchedulerStats> {
    const schedules = Array.from(this.schedules.values())
    const runs = Array.from(this.scheduledRuns.values())
    
    const successfulRuns = runs.filter(run => run.status === 'completed')
    const failedRuns = runs.filter(run => run.status === 'failed')
    
    const totalDuration = successfulRuns.reduce((sum, run) => sum + (run.duration || 0), 0)
    const averageRunTime = successfulRuns.length > 0 ? totalDuration / successfulRuns.length : 0
    
    // Get next run time
    const nextRun = schedules
      .filter(s => s.enabled)
      .map(s => this.calculateNextRun(s.cron))
      .sort((a, b) => a.getTime() - b.getTime())[0]
    
    // Get last run time
    const lastRun = runs
      .filter(r => r.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0]
    
    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter(s => s.enabled).length,
      totalRuns: runs.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      lastRunTime: lastRun?.completedAt,
      nextRunTime: nextRun?.toISOString(),
      averageRunTime,
      diskUsage: 0 // Would need to calculate from backup files
    }
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping backup scheduler...')
    
    // Cancel all running jobs
    for (const [scheduleId, timeout] of this.runningJobs.entries()) {
      clearTimeout(timeout)
      console.log(`⏹️ Cancelled scheduled job: ${scheduleId}`)
    }
    
    this.runningJobs.clear()
    console.log('✅ Backup scheduler stopped')
  }
}