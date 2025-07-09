import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('5'),
  
  // Database connection configuration
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),
  DB_TIMEOUT: z.string().transform(Number).default('30000'),
  DB_IDLE_TIMEOUT: z.string().transform(Number).default('600000'),
  DB_SSL_MODE: z.string().default('prefer'),
  
  // Monitoring and logging
  MONITORING_ENABLED: z.string().transform(val => val === 'true').default('true'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  
  // Backup configuration
  BACKUP_ENABLED: z.string().transform(val => val === 'true').default('false'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default('30'),
  
  // MCP Development Configuration
  MCP_ENVIRONMENT: z.enum(['development', 'testing', 'disabled']).default('disabled'),
  MCP_SECURITY_LEVEL: z.enum(['development_only', 'testing_only', 'disabled']).default('disabled'),
  MCP_CONFIG_PATH: z.string().default('./supabase/mcp-config.json'),
  MCP_SCHEMA_MANAGEMENT: z.string().transform(val => val === 'true').default('false'),
  MCP_QUERY_ASSISTANCE: z.string().transform(val => val === 'true').default('false'),
  MCP_DATA_GENERATION: z.string().transform(val => val === 'true').default('false'),
  MCP_TESTING_SUPPORT: z.string().transform(val => val === 'true').default('false')
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>

// Connection string validation and management
export const validateDatabaseConnection = () => {
  const errors: string[] = []
  
  if (!env.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required')
  }
  
  if (!env.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is required')
  }
  
  if (!env.SUPABASE_SERVICE_KEY) {
    errors.push('SUPABASE_SERVICE_KEY is required')
  }
  
  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET is required')
  }
  
  if (errors.length > 0) {
    console.error('Database configuration errors:', errors)
    throw new Error(`Database configuration invalid: ${errors.join(', ')}`)
  }
  
  console.log('✅ Database configuration validated successfully')
  return true
}

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const config = {
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    
    database: {
      url: env.SUPABASE_URL,
      poolConfig: {
        min: env.DB_POOL_MIN,
        max: env.DB_POOL_MAX,
        timeout: env.DB_TIMEOUT,
        idleTimeout: env.DB_IDLE_TIMEOUT
      },
      ssl: env.DB_SSL_MODE,
      monitoring: env.MONITORING_ENABLED
    },
    
    backup: {
      enabled: env.BACKUP_ENABLED,
      schedule: env.BACKUP_SCHEDULE,
      retentionDays: env.BACKUP_RETENTION_DAYS
    },
    
    logging: {
      level: env.LOG_LEVEL,
      format: env.LOG_FORMAT
    },
    
    security: {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
      corsOrigin: env.CORS_ORIGIN
    },
    
    rateLimiting: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
      authMaxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS
    },
    
    mcp: {
      environment: env.MCP_ENVIRONMENT,
      securityLevel: env.MCP_SECURITY_LEVEL,
      configPath: env.MCP_CONFIG_PATH,
      features: {
        schemaManagement: env.MCP_SCHEMA_MANAGEMENT,
        queryAssistance: env.MCP_QUERY_ASSISTANCE,
        dataGeneration: env.MCP_DATA_GENERATION,
        testingSupport: env.MCP_TESTING_SUPPORT
      }
    }
  }
  
  return config
}

// Connection string obfuscation for logging
export const obfuscateConnectionString = (connectionString: string | undefined) => {
  if (!connectionString) return 'undefined'
  
  // Hide sensitive parts of the URL
  return connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
}

// MCP security validation
export const validateMCPSecurity = () => {
  const config = getEnvironmentConfig()
  
  // Only allow MCP in development/testing
  if (config.isProduction && config.mcp.environment !== 'disabled') {
    throw new Error('MCP is not allowed in production environment')
  }
  
  // Validate security level
  if (config.mcp.environment === 'development' && config.mcp.securityLevel !== 'development_only') {
    throw new Error('MCP security level must be development_only in development environment')
  }
  
  // Validate database connection for MCP
  if (config.mcp.environment !== 'disabled' && config.database.url) {
    if (!config.database.url.includes('127.0.0.1') && !config.database.url.includes('localhost')) {
      throw new Error('MCP can only connect to local development databases')
    }
  }
  
  console.log('✅ MCP security validation passed')
  return true
}

// Environment validation on startup
export const validateEnvironment = () => {
  try {
    console.log('🔍 Validating environment configuration...')
    
    // Validate database connection
    validateDatabaseConnection()
    
    // Validate MCP security
    validateMCPSecurity()
    
    // Log environment config (with obfuscated secrets)
    const config = getEnvironmentConfig()
    console.log('Environment config:', {
      ...config,
      database: {
        ...config.database,
        url: obfuscateConnectionString(config.database.url)
      },
      security: {
        ...config.security,
        jwtSecret: config.security.jwtSecret ? '[HIDDEN]' : 'undefined'
      }
    })
    
    console.log('✅ Environment validation completed successfully')
    return true
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    throw error
  }
}