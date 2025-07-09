import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import { env, validateEnvironment } from './config/env'
import { swaggerSpec } from './config/swagger'
import { testDatabaseConnection } from './config/database'
import { performBackupHealthCheck, scheduleBackupTasks } from './config/backup'
import { startDatabaseMonitoring } from './config/monitoring'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { generalLimiter } from './middleware/rateLimiter'
import routes from './routes'

dotenv.config()

const app = express()

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: development
 */

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}))

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}))

// Rate limiting
app.use(generalLimiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Kitchen Pantry CRM API Documentation'
}))

// API routes
app.use('/api/v1', routes)

// Error handling middleware
app.use(notFoundHandler)
app.use(errorHandler)

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start server
app.listen(env.PORT, async () => {
  console.log(`🚀 Server running on port ${env.PORT}`)
  console.log(`📖 Environment: ${env.NODE_ENV}`)
  console.log(`🔗 API: http://localhost:${env.PORT}/api/v1`)
  console.log(`📚 API Docs: http://localhost:${env.PORT}/api-docs`)
  
  try {
    // Validate environment configuration
    validateEnvironment()
    
    // Test database connection
    if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
      await testDatabaseConnection()
      
      // Perform backup health check
      console.log('🔍 Performing backup health check...')
      const backupHealth = await performBackupHealthCheck()
      console.log('Backup health status:', backupHealth.status)
      
      // Start database monitoring
      console.log('📊 Starting database monitoring...')
      const monitoringIntervals = startDatabaseMonitoring()
      
      // Schedule backup tasks
      console.log('💾 Scheduling backup tasks...')
      const backupIntervals = scheduleBackupTasks()
      
      // Graceful shutdown handling
      const gracefulShutdown = () => {
        console.log('📴 Shutting down gracefully...')
        
        if (monitoringIntervals) {
          console.log('Stopping database monitoring...')
          // Note: stopDatabaseMonitoring function would be called here
        }
        
        if (backupIntervals) {
          console.log('Stopping backup tasks...')
          // Note: stopBackupTasks function would be called here
        }
        
        process.exit(0)
      }
      
      process.on('SIGTERM', gracefulShutdown)
      process.on('SIGINT', gracefulShutdown)
      
      console.log('✅ Database configuration completed successfully')
    } else {
      console.log('⚠️  Database connection skipped - missing Supabase configuration')
      console.log('   Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables')
    }
  } catch (error) {
    console.error('❌ Server startup failed:', error)
    process.exit(1)
  }
})