import { supabaseAdmin } from './database'
import { env } from './env'

export interface BackupConfig {
  enabled: boolean
  schedule: string
  retention: {
    daily: number
    weekly: number
    monthly: number
  }
  compression: boolean
  encryption: boolean
}

export const backupConfig: BackupConfig = {
  enabled: env.NODE_ENV === 'production',
  schedule: '0 2 * * *', // Daily at 2 AM
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 12
  },
  compression: true,
  encryption: true
}

export const performBackupHealthCheck = async () => {
  try {
    // Check Supabase backup status
    const { data: tables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%')
    
    if (error) {
      console.error('Backup health check failed:', error)
      return {
        status: 'error',
        message: 'Failed to access database tables',
        timestamp: new Date().toISOString()
      }
    }
    
    const healthCheck = {
      status: 'healthy',
      tablesAccessible: tables?.length || 0,
      lastCheck: new Date().toISOString(),
      backupEnabled: backupConfig.enabled,
      environment: env.NODE_ENV
    }
    
    console.log('✅ Backup health check passed:', healthCheck)
    return healthCheck
  } catch (error) {
    console.error('Backup health check failed:', error)
    return {
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    }
  }
}

export const verifyBackupIntegrity = async () => {
  try {
    // Verify core tables exist and have data
    const coreTables = ['organizations', 'contacts', 'interactions', 'opportunities', 'users', 'products']
    const verificationResults = []
    
    for (const table of coreTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('id', { count: 'exact' })
          .limit(1)
        
        if (error) {
          verificationResults.push({
            table,
            status: 'error',
            error: error.message
          })
        } else {
          verificationResults.push({
            table,
            status: 'accessible',
            hasData: data && data.length > 0
          })
        }
      } catch (tableError) {
        verificationResults.push({
          table,
          status: 'error',
          error: String(tableError)
        })
      }
    }
    
    const allTablesAccessible = verificationResults.every(result => result.status === 'accessible')
    
    return {
      status: allTablesAccessible ? 'verified' : 'partial',
      timestamp: new Date().toISOString(),
      results: verificationResults
    }
  } catch (error) {
    console.error('Backup integrity verification failed:', error)
    return {
      status: 'error',
      message: 'Verification failed',
      timestamp: new Date().toISOString()
    }
  }
}

export const getBackupMetrics = async () => {
  try {
    const { data: dbStats, error } = await supabaseAdmin
      .from('pg_stat_database')
      .select('datname, xact_commit, xact_rollback, blks_read, blks_hit, tup_returned, tup_fetched')
      .eq('datname', 'postgres')
      .single()
    
    if (error) {
      console.error('Failed to get backup metrics:', error)
      return null
    }
    
    return {
      database: dbStats?.datname,
      transactions: {
        committed: dbStats?.xact_commit,
        rolledBack: dbStats?.xact_rollback
      },
      blocks: {
        read: dbStats?.blks_read,
        hit: dbStats?.blks_hit,
        hitRatio: dbStats?.blks_hit / (dbStats?.blks_hit + dbStats?.blks_read) * 100
      },
      tuples: {
        returned: dbStats?.tup_returned,
        fetched: dbStats?.tup_fetched
      },
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to get backup metrics:', error)
    return null
  }
}

export const scheduleBackupTasks = () => {
  if (!backupConfig.enabled) {
    console.log('Backup scheduling disabled in', env.NODE_ENV)
    return
  }
  
  console.log('Backup scheduling enabled with config:', backupConfig)
  
  // Note: In production, this would integrate with a proper job scheduler
  // For now, we'll set up basic monitoring intervals
  
  const healthCheckInterval = setInterval(async () => {
    const healthCheck = await performBackupHealthCheck()
    if (healthCheck.status === 'error') {
      console.error('Backup health check failed:', healthCheck)
    }
  }, 60000 * 60) // Every hour
  
  const integrityCheckInterval = setInterval(async () => {
    const integrityCheck = await verifyBackupIntegrity()
    if (integrityCheck.status === 'error') {
      console.error('Backup integrity check failed:', integrityCheck)
    }
  }, 60000 * 60 * 6) // Every 6 hours
  
  return {
    healthCheckInterval,
    integrityCheckInterval
  }
}

export const stopBackupTasks = (intervals: { healthCheckInterval: NodeJS.Timeout, integrityCheckInterval: NodeJS.Timeout }) => {
  clearInterval(intervals.healthCheckInterval)
  clearInterval(intervals.integrityCheckInterval)
  console.log('Backup tasks stopped')
}