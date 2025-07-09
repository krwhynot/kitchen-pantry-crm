#!/usr/bin/env node

import { Command } from 'commander'
import { BackupService } from './BackupService'
import { RecoveryService } from './RecoveryService'
import { BackupScheduler } from './BackupScheduler'
import { BackupMonitoring } from './BackupMonitoring'
import { join } from 'path'

const program = new Command()

// Global configuration
const config = {
  backupDir: process.env.BACKUP_DIR || join(process.cwd(), 'backups'),
  dataDir: process.env.DATA_DIR || join(process.cwd(), 'data'),
  verbose: false
}

// Initialize services
const backupService = new BackupService({ outputDir: config.backupDir })
const recoveryService = new RecoveryService(config.backupDir)
const backupScheduler = new BackupScheduler({
  configDir: config.dataDir,
  maxConcurrentJobs: 3,
  defaultRetentionDays: 30
})
const backupMonitoring = new BackupMonitoring({
  dataDir: config.dataDir,
  healthCheckInterval: 30 * 60 * 1000, // 30 minutes
  metricsRetentionDays: 90,
  alertsRetentionDays: 30,
  thresholds: {
    maxBackupAge: 24 * 60 * 60 * 1000, // 24 hours
    minDiskSpaceGB: 10,
    maxBackupTime: 60, // minutes
    minCompressionRatio: 0.5,
    maxFailureRate: 0.1
  }
})

// Utility functions
function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function error(message: string): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`)
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Program setup
program
  .name('backup-cli')
  .description('Kitchen Pantry CRM Database Backup and Recovery CLI')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-d, --backup-dir <path>', 'Backup directory path', config.backupDir)
  .option('--data-dir <path>', 'Data directory path', config.dataDir)

// Global option handler
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts()
  config.verbose = opts.verbose
  config.backupDir = opts.backupDir
  config.dataDir = opts.dataDir
})

// Backup commands
const backupCmd = program
  .command('backup')
  .description('Backup management commands')

backupCmd
  .command('create')
  .description('Create a new backup')
  .option('-n, --name <name>', 'Backup name')
  .option('-f, --format <format>', 'Backup format (sql, json, csv)', 'sql')
  .option('-t, --tables <tables>', 'Comma-separated list of tables to backup')
  .option('-e, --exclude <tables>', 'Comma-separated list of tables to exclude')
  .option('--no-schema', 'Exclude schema from backup')
  .option('--no-data', 'Exclude data from backup')
  .option('--no-compression', 'Disable compression')
  .option('--encryption-key <key>', 'Encryption key for backup')
  .action(async (options) => {
    try {
      log('Creating backup...')
      
      const backupConfig = {
        format: options.format,
        tables: options.tables ? options.tables.split(',') : undefined,
        excludeTables: options.exclude ? options.exclude.split(',') : undefined,
        includeSchema: options.schema !== false,
        includeData: options.data !== false,
        compression: options.compression !== false,
        encryptionKey: options.encryptionKey
      }
      
      const job = await backupService.createFullBackup(options.name, backupConfig)
      log(`Backup job created: ${job.id}`)
      
      // Monitor job progress
      const checkInterval = setInterval(async () => {
        const currentJob = await backupService.getBackupJob(job.id)
        if (currentJob) {
          if (config.verbose) {
            log(`Progress: ${currentJob.progress}%`)
          }
          
          if (currentJob.status === 'completed') {
            clearInterval(checkInterval)
            log(`✅ Backup completed: ${currentJob.metadata?.name} (${formatBytes(currentJob.metadata?.size || 0)})`)
          } else if (currentJob.status === 'failed') {
            clearInterval(checkInterval)
            error(`Backup failed: ${currentJob.error}`)
            process.exit(1)
          }
        }
      }, 2000)
      
    } catch (err) {
      error(`Failed to create backup: ${err}`)
      process.exit(1)
    }
  })

backupCmd
  .command('list')
  .description('List all backups')
  .option('-l, --limit <number>', 'Limit number of results', '20')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (options) => {
    try {
      const backups = await backupService.listBackups()
      const limited = backups.slice(0, parseInt(options.limit))
      
      if (options.format === 'json') {
        console.log(JSON.stringify(limited, null, 2))
      } else {
        console.log('\\n📋 Backups:')
        console.log('─'.repeat(80))
        console.log('ID'.padEnd(20) + 'Name'.padEnd(25) + 'Type'.padEnd(12) + 'Size'.padEnd(10) + 'Created')
        console.log('─'.repeat(80))
        
        for (const backup of limited) {
          const row = [
            backup.id.slice(0, 18),
            backup.name.slice(0, 23),
            backup.type.padEnd(10),
            formatBytes(backup.size).padEnd(8),
            new Date(backup.createdAt).toLocaleString()
          ]
          console.log(row.join(' '))
        }
      }
    } catch (err) {
      error(`Failed to list backups: ${err}`)
      process.exit(1)
    }
  })

backupCmd
  .command('validate <backup-id>')
  .description('Validate a backup')
  .action(async (backupId) => {
    try {
      log(`Validating backup: ${backupId}`)
      
      const validation = await backupService.validateBackup(backupId)
      
      if (validation.isValid) {
        log('✅ Backup is valid')
      } else {
        error('❌ Backup validation failed:')
        for (const err of validation.errors) {
          console.log(`  - ${err}`)
        }
        process.exit(1)
      }
    } catch (err) {
      error(`Failed to validate backup: ${err}`)
      process.exit(1)
    }
  })

backupCmd
  .command('delete <backup-id>')
  .description('Delete a backup')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (backupId, options) => {
    try {
      if (!options.force) {
        // In a real CLI, you'd use a proper prompt library
        console.log('⚠️  This will permanently delete the backup. Use --force to confirm.')
        process.exit(1)
      }
      
      await backupService.deleteBackup(backupId)
      log(`🗑️ Backup deleted: ${backupId}`)
    } catch (err) {
      error(`Failed to delete backup: ${err}`)
      process.exit(1)
    }
  })

// Recovery commands
const recoveryCmd = program
  .command('recovery')
  .description('Recovery management commands')

recoveryCmd
  .command('plan <backup-id>')
  .description('Create a recovery plan')
  .option('-t, --target-tables <tables>', 'Comma-separated list of tables to recover')
  .option('-e, --exclude-tables <tables>', 'Comma-separated list of tables to exclude')
  .option('-s, --strategy <strategy>', 'Recovery strategy (replace, merge, append)', 'replace')
  .action(async (backupId, options) => {
    try {
      log(`Creating recovery plan for backup: ${backupId}`)
      
      const recoveryOptions = {
        backupId,
        targetTables: options.targetTables ? options.targetTables.split(',') : undefined,
        excludeTables: options.excludeTables ? options.excludeTables.split(',') : undefined,
        strategy: options.strategy,
        validateBefore: true,
        createCheckpoint: true,
        dryRun: false,
        batchSize: 1000
      }
      
      const plan = await recoveryService.createRecoveryPlan(backupId, recoveryOptions)
      
      console.log('\\n📋 Recovery Plan:')
      console.log('─'.repeat(60))
      console.log(`Backup: ${plan.backupMetadata.name}`)
      console.log(`Tables: ${plan.tables.length}`)
      console.log(`Estimated Duration: ${formatDuration(plan.estimatedDuration)}`)
      console.log()
      
      if (plan.risks.length > 0) {
        console.log('⚠️  Risks:')
        for (const risk of plan.risks) {
          console.log(`  - ${risk}`)
        }
        console.log()
      }
      
      if (plan.requirements.length > 0) {
        console.log('📋 Requirements:')
        for (const req of plan.requirements) {
          console.log(`  - ${req}`)
        }
      }
      
    } catch (err) {
      error(`Failed to create recovery plan: ${err}`)
      process.exit(1)
    }
  })

recoveryCmd
  .command('execute <backup-id>')
  .description('Execute a recovery')
  .option('-t, --target-tables <tables>', 'Comma-separated list of tables to recover')
  .option('-e, --exclude-tables <tables>', 'Comma-separated list of tables to exclude')
  .option('-s, --strategy <strategy>', 'Recovery strategy (replace, merge, append)', 'replace')
  .option('--dry-run', 'Perform a dry run without making changes')
  .option('--no-validate', 'Skip backup validation')
  .option('--no-checkpoint', 'Skip creating recovery checkpoint')
  .action(async (backupId, options) => {
    try {
      log(`Starting recovery from backup: ${backupId}`)
      
      const recoveryOptions = {
        backupId,
        targetTables: options.targetTables ? options.targetTables.split(',') : undefined,
        excludeTables: options.excludeTables ? options.excludeTables.split(',') : undefined,
        strategy: options.strategy,
        validateBefore: !options.noValidate,
        createCheckpoint: !options.noCheckpoint,
        dryRun: options.dryRun,
        batchSize: 1000
      }
      
      const job = await recoveryService.executeRecovery(backupId, recoveryOptions)
      log(`Recovery job created: ${job.id}`)
      
      // Monitor job progress
      const checkInterval = setInterval(async () => {
        const currentJob = await recoveryService.getRecoveryJob(job.id)
        if (currentJob) {
          if (config.verbose) {
            log(`Progress: ${currentJob.progress}% (${currentJob.tablesProcessed} tables, ${currentJob.recordsRestored} records)`)
          }
          
          if (currentJob.status === 'completed') {
            clearInterval(checkInterval)
            log(`✅ Recovery completed: ${currentJob.recordsRestored} records restored`)
            
            if (currentJob.validationResults) {
              console.log('\\n📊 Validation Results:')
              for (const result of currentJob.validationResults) {
                const status = result.errors.length > 0 ? '❌' : '✅'
                console.log(`  ${status} ${result.table}: ${result.recordsRestored}/${result.recordsInBackup} records`)
              }
            }
          } else if (currentJob.status === 'failed') {
            clearInterval(checkInterval)
            error(`Recovery failed: ${currentJob.error}`)
            process.exit(1)
          }
        }
      }, 2000)
      
    } catch (err) {
      error(`Failed to execute recovery: ${err}`)
      process.exit(1)
    }
  })

// Schedule commands
const scheduleCmd = program
  .command('schedule')
  .description('Backup schedule management')

scheduleCmd
  .command('create <name> <cron>')
  .description('Create a backup schedule')
  .option('-f, --format <format>', 'Backup format', 'sql')
  .option('-r, --retention <days>', 'Retention period in days', '30')
  .option('--compression', 'Enable compression')
  .option('--notification-email <emails>', 'Comma-separated email addresses for notifications')
  .action(async (name, cron, options) => {
    try {
      const scheduleConfig = {
        name,
        cron,
        enabled: true,
        retentionDays: parseInt(options.retention),
        backupConfig: {
          format: options.format,
          compression: options.compression,
          includeSchema: true,
          includeData: true,
          batchSize: 1000,
          outputDir: config.backupDir
        },
        notifications: {
          onSuccess: options.notificationEmail ? options.notificationEmail.split(',') : [],
          onFailure: options.notificationEmail ? options.notificationEmail.split(',') : []
        },
        tags: ['automated']
      }
      
      const scheduleId = await backupScheduler.createSchedule(scheduleConfig)
      log(`✅ Schedule created: ${scheduleId}`)
    } catch (err) {
      error(`Failed to create schedule: ${err}`)
      process.exit(1)
    }
  })

scheduleCmd
  .command('list')
  .description('List all backup schedules')
  .action(async () => {
    try {
      const schedules = await backupScheduler.listSchedules()
      
      console.log('\\n📅 Backup Schedules:')
      console.log('─'.repeat(80))
      console.log('Name'.padEnd(25) + 'Cron'.padEnd(15) + 'Enabled'.padEnd(10) + 'Retention'.padEnd(12) + 'Next Run')
      console.log('─'.repeat(80))
      
      for (const schedule of schedules) {
        const row = [
          schedule.name.slice(0, 23),
          schedule.cron.padEnd(13),
          (schedule.enabled ? '✅' : '❌').padEnd(8),
          `${schedule.retentionDays}d`.padEnd(10),
          'Next run calculation needed' // Would need proper cron calculation
        ]
        console.log(row.join(' '))
      }
    } catch (err) {
      error(`Failed to list schedules: ${err}`)
      process.exit(1)
    }
  })

// Monitoring commands
const monitorCmd = program
  .command('monitor')
  .description('Backup monitoring and health checks')

monitorCmd
  .command('health')
  .description('Run health check')
  .action(async () => {
    try {
      log('Running backup health check...')
      
      const healthCheck = await backupMonitoring.runHealthCheck()
      
      console.log('\\n🏥 Backup Health Check:')
      console.log('─'.repeat(50))
      console.log(`Overall Status: ${healthCheck.status === 'healthy' ? '✅ Healthy' : healthCheck.status === 'warning' ? '⚠️  Warning' : '❌ Critical'}`)
      console.log(`Timestamp: ${new Date(healthCheck.timestamp).toLocaleString()}`)
      console.log()
      
      const checks = [
        { name: 'Recent Backups', check: healthCheck.checks.recentBackups },
        { name: 'Backup Integrity', check: healthCheck.checks.backupIntegrity },
        { name: 'Disk Space', check: healthCheck.checks.diskSpace },
        { name: 'Schedule Health', check: healthCheck.checks.scheduleHealth },
        { name: 'Performance', check: healthCheck.checks.performanceMetrics }
      ]
      
      for (const { name, check } of checks) {
        const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
        console.log(`${icon} ${name}: ${check.message}`)
      }
      
      console.log()
      console.log('📊 Summary:')
      console.log(`  Total Backups: ${healthCheck.summary.totalBackups}`)
      console.log(`  Healthy Backups: ${healthCheck.summary.healthyBackups}`)
      console.log(`  Average Backup Time: ${formatDuration(healthCheck.summary.avgBackupTime)}`)
      console.log(`  Disk Usage: ${formatBytes(healthCheck.summary.diskUsageGB * 1024 * 1024 * 1024)}`)
      
    } catch (err) {
      error(`Failed to run health check: ${err}`)
      process.exit(1)
    }
  })

monitorCmd
  .command('alerts')
  .description('List active alerts')
  .action(async () => {
    try {
      const alerts = await backupMonitoring.getActiveAlerts()
      
      if (alerts.length === 0) {
        log('✅ No active alerts')
        return
      }
      
      console.log('\\n🚨 Active Alerts:')
      console.log('─'.repeat(80))
      
      for (const alert of alerts) {
        const severityIcon = {
          low: '🟢',
          medium: '🟡',
          high: '🟠',
          critical: '🔴'
        }[alert.severity]
        
        console.log(`${severityIcon} ${alert.title}`)
        console.log(`   ${alert.message}`)
        console.log(`   Created: ${new Date(alert.timestamp).toLocaleString()}`)
        console.log()
      }
    } catch (err) {
      error(`Failed to get alerts: ${err}`)
      process.exit(1)
    }
  })

// Error handling
process.on('uncaughtException', (err) => {
  error(`Uncaught exception: ${err.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled rejection at ${promise}: ${reason}`)
  process.exit(1)
})

// Parse command line arguments
program.parse()