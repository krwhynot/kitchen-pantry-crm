# Kitchen Pantry CRM - Database Backup System

## Overview

This comprehensive backup system provides enterprise-grade database backup, recovery, scheduling, and monitoring capabilities for the Kitchen Pantry CRM system. It includes automated backup scheduling, real-time health monitoring, and disaster recovery procedures.

## Architecture

```
📁 backup/
├── 🔧 BackupService.ts          # Core backup functionality
├── 🔄 RecoveryService.ts        # Database recovery system
├── 📅 BackupScheduler.ts        # Automated backup scheduling
├── 📊 BackupMonitoring.ts       # Health monitoring and alerting
├── 🖥️  BackupCLI.ts             # Command-line interface
├── 📋 DISASTER_RECOVERY.md      # Disaster recovery procedures
└── 📖 README.md                 # This documentation
```

## Features

### 🔧 Core Backup System
- **Multiple formats**: SQL, JSON, CSV
- **Compression**: Automatic compression with gzip
- **Encryption**: Optional backup encryption
- **Incremental backups**: Delta-based backups
- **Schema-only backups**: Structure without data
- **Metadata tracking**: Comprehensive backup metadata

### 🔄 Advanced Recovery
- **Recovery planning**: Analyze and plan recovery operations
- **Multiple strategies**: Replace, merge, or append data
- **Validation**: Pre and post-recovery validation
- **Rollback support**: Checkpoint creation and rollback
- **Dry run mode**: Test recovery without changes
- **Batch processing**: Configurable batch sizes

### 📅 Intelligent Scheduling
- **Cron-based scheduling**: Flexible scheduling with cron expressions
- **Retention policies**: Automatic cleanup of old backups
- **Notifications**: Email/Slack notifications on success/failure
- **Concurrent job management**: Multiple backup jobs with limits
- **Schedule health monitoring**: Track missed or failed schedules

### 📊 Comprehensive Monitoring
- **Health checks**: Regular system health assessments
- **Performance metrics**: Backup performance tracking
- **Alert system**: Proactive alerting for issues
- **Disk usage monitoring**: Track storage consumption
- **Schedule compliance**: Monitor backup schedule adherence

## Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Make CLI executable
chmod +x backend/src/db/backup/BackupCLI.ts
```

### 2. Configuration

Set environment variables:
```bash
export BACKUP_DIR="/opt/kitchen-pantry/backups"
export DATA_DIR="/opt/kitchen-pantry/data"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"
```

### 3. Basic Usage

```bash
# Create a backup
./backup-cli backup create -n "daily-backup"

# List backups
./backup-cli backup list

# Run health check
./backup-cli monitor health

# Create a backup schedule
./backup-cli schedule create "daily-backup" "0 2 * * *"
```

## CLI Commands

### Backup Management

```bash
# Create backup with options
./backup-cli backup create -n "backup-name" -f sql --compression

# List all backups
./backup-cli backup list -l 20

# Validate backup integrity
./backup-cli backup validate <backup-id>

# Delete backup
./backup-cli backup delete <backup-id> --force
```

### Recovery Operations

```bash
# Create recovery plan
./backup-cli recovery plan <backup-id> -s replace

# Execute recovery
./backup-cli recovery execute <backup-id> -s replace

# Dry run recovery
./backup-cli recovery execute <backup-id> --dry-run
```

### Schedule Management

```bash
# Create schedule
./backup-cli schedule create "daily" "0 2 * * *" -r 30

# List schedules
./backup-cli schedule list

# Execute schedule manually
./backup-cli schedule execute <schedule-id>
```

### Monitoring

```bash
# Run health check
./backup-cli monitor health

# View active alerts
./backup-cli monitor alerts

# Get system statistics
./backup-cli monitor stats
```

## API Usage

### BackupService

```typescript
import { BackupService } from './BackupService'

const backupService = new BackupService({
  outputDir: '/opt/backups',
  compression: true,
  format: 'sql'
})

// Create full backup
const job = await backupService.createFullBackup('daily-backup')

// Create incremental backup
const incrementalJob = await backupService.createIncrementalBackup(
  'base-backup-id',
  'incremental-backup'
)

// List backups
const backups = await backupService.listBackups()

// Validate backup
const validation = await backupService.validateBackup('backup-id')
```

### RecoveryService

```typescript
import { RecoveryService } from './RecoveryService'

const recoveryService = new RecoveryService('/opt/backups')

// Create recovery plan
const plan = await recoveryService.createRecoveryPlan('backup-id', {
  strategy: 'replace',
  validateBefore: true,
  createCheckpoint: true
})

// Execute recovery
const recoveryJob = await recoveryService.executeRecovery('backup-id', {
  strategy: 'replace',
  validateBefore: true,
  createCheckpoint: true,
  dryRun: false,
  batchSize: 1000
})
```

### BackupScheduler

```typescript
import { BackupScheduler } from './BackupScheduler'

const scheduler = new BackupScheduler({
  configDir: '/opt/data',
  maxConcurrentJobs: 3,
  defaultRetentionDays: 30
})

await scheduler.initialize()

// Create schedule
const scheduleId = await scheduler.createSchedule({
  name: 'daily-backup',
  cron: '0 2 * * *',
  enabled: true,
  retentionDays: 30,
  backupConfig: {
    format: 'sql',
    compression: true,
    outputDir: '/opt/backups'
  },
  notifications: {
    onSuccess: ['admin@company.com'],
    onFailure: ['admin@company.com', 'ops@company.com']
  }
})
```

### BackupMonitoring

```typescript
import { BackupMonitoring } from './BackupMonitoring'

const monitoring = new BackupMonitoring({
  dataDir: '/opt/data',
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

await monitoring.initialize()

// Run health check
const healthCheck = await monitoring.runHealthCheck()

// Get active alerts
const alerts = await monitoring.getActiveAlerts()

// Get metrics history
const metrics = await monitoring.getMetricsHistory(30) // Last 30 days
```

## Configuration

### Backup Configuration

```typescript
interface BackupConfig {
  outputDir: string              // Backup output directory
  includeSchema: boolean         // Include database schema
  includeData: boolean          // Include table data
  compression: boolean          // Enable compression
  format: 'sql' | 'json' | 'csv' // Backup format
  tables?: string[]             // Specific tables to backup
  excludeTables?: string[]      // Tables to exclude
  batchSize: number             // Batch size for data processing
  encryptionKey?: string        // Optional encryption key
}
```

### Recovery Configuration

```typescript
interface RecoveryOptions {
  backupId: string              // Backup to recover from
  targetTables?: string[]       // Specific tables to recover
  excludeTables?: string[]      // Tables to exclude
  validateBefore: boolean       // Validate backup before recovery
  createCheckpoint: boolean     // Create recovery checkpoint
  dryRun: boolean              // Perform dry run
  strategy: 'replace' | 'merge' | 'append' // Recovery strategy
  batchSize: number            // Batch size for processing
}
```

### Schedule Configuration

```typescript
interface ScheduleConfig {
  name: string                  // Schedule name
  cron: string                 // Cron expression
  enabled: boolean             // Schedule enabled
  retentionDays: number        // Backup retention period
  backupConfig: BackupConfig   // Backup configuration
  notifications: {
    onSuccess: string[]        // Success notification emails
    onFailure: string[]        // Failure notification emails
  }
  tags: string[]              // Schedule tags
}
```

## Backup Formats

### SQL Format
- **File Extension**: `.sql`
- **Compression**: `.sql.gz`
- **Features**: Full schema + data, direct PostgreSQL restore
- **Best For**: Complete database backups, migrations

### JSON Format
- **File Extension**: `.json`
- **Compression**: `.json.gz`
- **Features**: Structured data, easy parsing, metadata included
- **Best For**: Data analysis, partial restores, debugging

### CSV Format
- **File Extension**: `.csv` (one file per table)
- **Compression**: `.zip`
- **Features**: Human-readable, Excel-compatible, lightweight
- **Best For**: Data exports, reporting, data migration

## Monitoring and Alerting

### Health Checks

The system performs regular health checks covering:

1. **Recent Backups**: Ensures backups are created regularly
2. **Backup Integrity**: Validates backup file integrity
3. **Disk Space**: Monitors available storage
4. **Schedule Health**: Tracks schedule execution
5. **Performance**: Monitors backup performance

### Alert Types

- **backup_failed**: Backup job failed
- **backup_corrupted**: Backup file corrupted
- **schedule_missed**: Scheduled backup missed
- **disk_space_low**: Insufficient disk space
- **performance_degraded**: Backup performance issues

### Thresholds

Default monitoring thresholds:
- **Max Backup Age**: 24 hours
- **Min Disk Space**: 10GB
- **Max Backup Time**: 60 minutes
- **Min Compression Ratio**: 50%
- **Max Failure Rate**: 10%

## Disaster Recovery

For complete disaster recovery procedures, see [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md).

### Quick Recovery Steps

1. **Assess Situation**: Run health check
2. **Identify Backup**: Find most recent valid backup
3. **Create Plan**: Generate recovery plan
4. **Execute Recovery**: Run recovery with monitoring
5. **Validate**: Verify system functionality
6. **Resume Operations**: Restart services

### Recovery Time Objectives

- **Critical Systems**: 2 hours
- **Standard Systems**: 4 hours
- **Non-critical Systems**: 8 hours

## Best Practices

### Backup Strategy

1. **Multiple Backup Types**: Use full, incremental, and schema backups
2. **Offsite Storage**: Store backups in multiple locations
3. **Regular Testing**: Test backup restoration regularly
4. **Retention Policy**: Implement appropriate retention policies
5. **Monitoring**: Monitor backup health continuously

### Security

1. **Encryption**: Encrypt sensitive backups
2. **Access Control**: Restrict backup access
3. **Audit Trail**: Log all backup operations
4. **Secure Storage**: Use secure storage locations
5. **Key Management**: Manage encryption keys securely

### Performance

1. **Batch Processing**: Use appropriate batch sizes
2. **Compression**: Enable compression for large backups
3. **Parallel Processing**: Use multiple concurrent jobs
4. **Off-peak Scheduling**: Schedule backups during low usage
5. **Resource Monitoring**: Monitor system resources

## Troubleshooting

### Common Issues

#### Backup Failures
- **Cause**: Database connection issues, disk space, permissions
- **Solution**: Check database connectivity, free disk space, verify permissions

#### Recovery Failures
- **Cause**: Corrupted backup, schema mismatch, constraint violations
- **Solution**: Validate backup, check schema compatibility, review constraints

#### Schedule Misses
- **Cause**: System downtime, resource constraints, configuration errors
- **Solution**: Check system status, review resource usage, validate configuration

#### Performance Issues
- **Cause**: Large datasets, insufficient resources, network issues
- **Solution**: Optimize batch sizes, increase resources, check network connectivity

### Debugging Commands

```bash
# Check backup service logs
journalctl -u backup-service -f

# Verify database connectivity
psql -h localhost -U username -d kitchen_pantry -c "SELECT 1"

# Check disk usage
df -h /opt/kitchen-pantry/backups

# Monitor system resources
top -p $(pgrep -f backup-cli)

# Validate backup manually
./backup-cli backup validate <backup-id>
```

## Support

For issues and questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [disaster recovery procedures](./DISASTER_RECOVERY.md)
3. Check system logs and health status
4. Contact the development team

## Contributing

When contributing to the backup system:

1. Follow TypeScript coding standards
2. Add comprehensive error handling
3. Include proper logging
4. Write unit tests
5. Update documentation
6. Test disaster recovery scenarios

## License

This backup system is part of the Kitchen Pantry CRM project and follows the same license terms.

---

**Version**: 1.0  
**Last Updated**: [Current Date]  
**Maintainer**: Kitchen Pantry CRM Team