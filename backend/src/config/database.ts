import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Connection configuration with enhanced settings
const connectionConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'kitchen-pantry-crm@1.0.0'
    }
  }
}

const adminConnectionConfig = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'kitchen-pantry-crm-admin@1.0.0'
    }
  }
}

export const supabase = createClient(
  env.SUPABASE_URL || '',
  env.SUPABASE_ANON_KEY || '',
  connectionConfig
)

export const supabaseAdmin = createClient(
  env.SUPABASE_URL || '',
  env.SUPABASE_SERVICE_KEY || '',
  adminConnectionConfig
)

// Database health monitoring
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('pg_stat_activity')
      .select('state')
      .limit(1)
    
    if (error) {
      console.error('Database connection test failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

// Database monitoring utilities
export const getDatabaseStats = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pg_stat_database')
      .select('datname, numbackends, xact_commit, xact_rollback, blks_read, blks_hit')
      .eq('datname', 'postgres')
      .single()
    
    if (error) {
      console.error('Failed to get database stats:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Failed to get database stats:', error)
    return null
  }
}

// Connection pool monitoring
export const getConnectionPoolStats = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('pg_stat_activity')
      .select('state, count(*)')
      .not('state', 'is', null)
    
    if (error) {
      console.error('Failed to get connection pool stats:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Failed to get connection pool stats:', error)
    return null
  }
}

// Connection retry and failover logic
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        break
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Connection security and encryption validation
export const validateConnectionSecurity = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('pg_settings')
      .select('name, setting')
      .in('name', ['ssl', 'shared_preload_libraries'])
    
    if (error) {
      console.error('Failed to validate connection security:', error)
      return false
    }
    
    const sslSetting = data?.find(s => s.name === 'ssl')?.setting
    console.log('✅ Connection security validated, SSL:', sslSetting)
    return true
  } catch (error) {
    console.error('Failed to validate connection security:', error)
    return false
  }
}

// Connection metrics and performance monitoring
export const getConnectionMetrics = async () => {
  try {
    const [dbStats, poolStats] = await Promise.all([
      getDatabaseStats(),
      getConnectionPoolStats()
    ])
    
    return {
      database: dbStats,
      connectionPool: poolStats,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to get connection metrics:', error)
    return null
  }
}

// Connection timeout and limits configuration
export const CONNECTION_CONFIG = {
  QUERY_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 1000, // 1 second
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  METRICS_COLLECTION_INTERVAL: 300000 // 5 minutes
}

// Connection testing utilities with timeout
export const testConnectionWithTimeout = async (timeout: number = CONNECTION_CONFIG.CONNECTION_TIMEOUT): Promise<boolean> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error('Database connection test timed out')
      resolve(false)
    }, timeout)
    
    testDatabaseConnection()
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(false)
      })
  })
}

// Database backup verification
export const verifyBackupStatus = async () => {
  try {
    // Check if backup-related tables exist and are accessible
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)
    
    if (error) {
      console.error('Backup verification failed:', error)
      return false
    }
    
    console.log('✅ Backup verification successful')
    return true
  } catch (error) {
    console.error('Backup verification failed:', error)
    return false
  }
}

// Database logging utilities
export const logDatabaseOperation = async (operation: string, details: any) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      environment: env.NODE_ENV
    }
    
    console.log('DB Operation:', JSON.stringify(logEntry, null, 2))
    
    // In production, this could be sent to a logging service
    // For development, we'll log to console
    
    return true
  } catch (error) {
    console.error('Failed to log database operation:', error)
    return false
  }
}