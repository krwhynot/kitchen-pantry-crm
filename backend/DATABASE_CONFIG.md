# Database Configuration Guide

This document outlines the comprehensive database configuration implemented for the Kitchen Pantry CRM system.

## Overview

The database configuration system provides:
- **Connection Management**: Robust Supabase connection handling with enhanced configurations
- **Backup & Recovery**: Automated backup health checks and recovery procedures
- **Monitoring & Logging**: Real-time database performance monitoring and logging
- **Environment Management**: Secure configuration management with validation

## Configuration Files

### Core Configuration Files

- `src/config/database.ts` - Main database connection and client configuration
- `src/config/backup.ts` - Backup and recovery management
- `src/config/monitoring.ts` - Database monitoring and alerting
- `src/config/env.ts` - Environment variable management and validation

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

```bash
# Database Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Connection Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000
DB_SSL_MODE=prefer

# Monitoring Configuration
MONITORING_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=json

# Backup Configuration
BACKUP_ENABLED=false
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

## Features

### 1. Connection Management

The database configuration provides:
- **Dual Client Setup**: Separate client configurations for user operations and admin tasks
- **Enhanced Headers**: Custom client identification headers for monitoring
- **Connection Testing**: Automated connection health checks on startup
- **Error Handling**: Comprehensive error handling and logging

### 2. Backup & Recovery

**Backup Features:**
- Health checks for backup system status
- Integrity verification of core database tables
- Configurable backup scheduling (cron format)
- Backup metrics collection and reporting
- Automatic backup task scheduling

**Key Functions:**
- `performBackupHealthCheck()` - Verifies backup system health
- `verifyBackupIntegrity()` - Checks core table accessibility
- `getBackupMetrics()` - Collects database performance metrics
- `scheduleBackupTasks()` - Starts automated backup monitoring

### 3. Database Monitoring

**Monitoring Capabilities:**
- Real-time connection pool monitoring
- Database performance metrics collection
- Health status tracking with alerting
- Configurable monitoring intervals
- Detailed database statistics

**Metrics Collected:**
- Active/idle connection counts
- Cache hit ratios
- Transaction rates
- Query performance statistics
- Long-running query detection

**Alert Thresholds:**
- Maximum connections: 50
- Maximum response time: 1000ms
- Maximum error rate: 5%
- Minimum hit ratio: 95%

### 4. Environment Management

**Configuration Features:**
- Zod-based schema validation
- Environment-specific configurations
- Connection string obfuscation for logging
- Comprehensive validation on startup
- Secure secret management

## Usage

### Starting the Application

The database configuration is automatically initialized when the application starts:

```typescript
import { validateEnvironment } from './config/env'
import { testDatabaseConnection } from './config/database'
import { performBackupHealthCheck } from './config/backup'
import { startDatabaseMonitoring } from './config/monitoring'

// Validate environment
validateEnvironment()

// Test database connection
await testDatabaseConnection()

// Check backup health
await performBackupHealthCheck()

// Start monitoring
startDatabaseMonitoring()
```

### Manual Operations

You can also use the configuration utilities manually:

```typescript
// Test database connection
const isConnected = await testDatabaseConnection()

// Get database statistics
const stats = await getDatabaseStats()

// Check backup status
const backupHealth = await performBackupHealthCheck()

// Collect monitoring metrics
const metrics = await collectDatabaseMetrics()
```

## Configuration Options

### Database Connection

```typescript
// Connection pool configuration
DB_POOL_MIN=2          // Minimum connections
DB_POOL_MAX=10         // Maximum connections
DB_TIMEOUT=30000       // Connection timeout (ms)
DB_IDLE_TIMEOUT=600000 // Idle timeout (ms)
DB_SSL_MODE=prefer     // SSL mode
```

### Monitoring Settings

```typescript
// Monitoring intervals
intervals: {
  healthCheck: 60000,      // 1 minute
  performanceCheck: 300000, // 5 minutes
  alertCheck: 30000        // 30 seconds
}

// Alert thresholds
thresholds: {
  maxConnections: 50,
  maxResponseTime: 1000,
  maxErrorRate: 0.05,
  minHitRatio: 0.95
}
```

### Backup Configuration

```typescript
// Backup settings
enabled: true,
schedule: '0 2 * * *',  // Daily at 2 AM
retention: {
  daily: 7,
  weekly: 4,
  monthly: 12
}
```

## Security Considerations

1. **Environment Variables**: Never commit actual environment variables to version control
2. **Connection Strings**: Use obfuscated logging for connection strings
3. **Service Keys**: Store Supabase service keys securely
4. **JWT Secrets**: Use strong, unique JWT secrets (minimum 32 characters)
5. **SSL Mode**: Use 'require' or 'verify-full' in production

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check SUPABASE_URL and keys are correct
   - Verify network connectivity
   - Check Supabase project status

2. **Monitoring Alerts**
   - Review connection pool usage
   - Check for long-running queries
   - Monitor cache hit ratios

3. **Backup Issues**
   - Verify table accessibility
   - Check backup schedule configuration
   - Review backup health status

### Debug Commands

```bash
# Check environment validation
npm run dev:check-env

# Test database connection
npm run db:test

# View monitoring metrics
npm run db:metrics

# Check backup health
npm run db:backup-health
```

## Development vs Production

### Development
- Backup disabled by default
- Verbose logging enabled
- Lower alert thresholds
- Console-based monitoring

### Production
- Backup enabled and scheduled
- Structured JSON logging
- Strict alert thresholds
- File-based logging
- Enhanced security measures

## MVP Task Completion

This configuration completes the following MVP Development TODO items:

- ✅ **1.2.2 Database Configuration**
  - ✅ Configure database backup and recovery
  - ✅ Set up database monitoring and logging
  - ✅ Configure connection string management

All database configuration requirements from the MVP Development TODO have been successfully implemented.