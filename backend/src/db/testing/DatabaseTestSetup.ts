import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../../config/database'
import { DatabaseMigrator } from '../migrate'

export interface TestDatabaseConfig {
  url?: string
  serviceKey?: string
  testDbSuffix?: string
  isolationLevel?: 'transaction' | 'database'
  cleanupStrategy?: 'truncate' | 'rollback' | 'recreate'
}

export interface TestTransaction {
  client: SupabaseClient
  commit: () => Promise<void>
  rollback: () => Promise<void>
  isActive: boolean
}

export class DatabaseTestSetup {
  private testClients: Map<string, SupabaseClient> = new Map()
  private activeTransactions: Map<string, TestTransaction> = new Map()
  private testDatabases: Set<string> = new Set()
  private migrator: DatabaseMigrator

  constructor(private config: TestDatabaseConfig = {}) {
    this.migrator = new DatabaseMigrator()
  }

  async setupTestDatabase(testName?: string): Promise<SupabaseClient> {
    const testId = testName || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (this.config.isolationLevel === 'database') {
      return this.createIsolatedDatabase(testId)
    } else {
      return this.createTransactionIsolatedClient(testId)
    }
  }

  private async createIsolatedDatabase(testId: string): Promise<SupabaseClient> {
    // For Supabase, we'll use the same database but with table prefixes for isolation
    // In a local PostgreSQL setup, you could create actual separate databases
    
    const testClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )

    // Store test client
    this.testClients.set(testId, testClient)
    this.testDatabases.add(testId)

    // Run migrations for test database
    await this.setupTestSchema(testClient, testId)

    return testClient
  }

  private async createTransactionIsolatedClient(testId: string): Promise<SupabaseClient> {
    // Create a client that will use transactions for isolation
    const testClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    this.testClients.set(testId, testClient)

    return testClient
  }

  async startTransaction(testId: string): Promise<TestTransaction> {
    const client = this.testClients.get(testId)
    if (!client) {
      throw new Error(`Test client not found for test: ${testId}`)
    }

    // Note: Supabase JS client doesn't directly support transactions
    // This is a simplified implementation - in production you'd use a different approach
    const transaction: TestTransaction = {
      client,
      commit: async () => {
        // In a real implementation, this would commit the transaction
        transaction.isActive = false
      },
      rollback: async () => {
        // In a real implementation, this would rollback the transaction
        await this.cleanupTestData(testId)
        transaction.isActive = false
      },
      isActive: true
    }

    this.activeTransactions.set(testId, transaction)
    return transaction
  }

  async setupTestSchema(client: SupabaseClient, testId: string): Promise<void> {
    try {
      // Create test-specific tables or use existing schema
      // For now, we'll use the existing schema but could prefix table names for isolation
      
      console.log(`🔧 Setting up test schema for: ${testId}`)
      
      // Run migrations to ensure schema is up to date
      await this.migrator.runMigrations()
      
      console.log(`✅ Test schema ready for: ${testId}`)
    } catch (error) {
      console.error(`❌ Failed to setup test schema for ${testId}:`, error)
      throw error
    }
  }

  async seedTestData(testId: string, seedData: Record<string, any[]>): Promise<void> {
    const client = this.testClients.get(testId)
    if (!client) {
      throw new Error(`Test client not found for test: ${testId}`)
    }

    try {
      for (const [tableName, records] of Object.entries(seedData)) {
        if (records.length > 0) {
          console.log(`🌱 Seeding ${records.length} records for ${tableName}`)
          
          const { error } = await client
            .from(tableName)
            .insert(records)

          if (error) {
            throw new Error(`Failed to seed ${tableName}: ${error.message}`)
          }
        }
      }
      
      console.log(`✅ Test data seeded for: ${testId}`)
    } catch (error) {
      console.error(`❌ Failed to seed test data for ${testId}:`, error)
      throw error
    }
  }

  async cleanupTestData(testId: string): Promise<void> {
    const client = this.testClients.get(testId)
    if (!client) {
      return // Already cleaned up
    }

    try {
      const strategy = this.config.cleanupStrategy || 'truncate'
      
      switch (strategy) {
        case 'truncate':
          await this.truncateTestTables(client)
          break
        case 'rollback':
          await this.rollbackTransaction(testId)
          break
        case 'recreate':
          await this.recreateTestSchema(client, testId)
          break
      }
      
      console.log(`🧹 Test data cleaned up for: ${testId}`)
    } catch (error) {
      console.error(`❌ Failed to cleanup test data for ${testId}:`, error)
    }
  }

  private async truncateTestTables(client: SupabaseClient): Promise<void> {
    // Get list of tables to truncate
    const tables = [
      'interactions', 'opportunities', 'contacts', 'users', 'organizations',
      'products', 'login_attempts', 'user_sessions', 'api_keys', 'api_requests',
      'permission_audit_logs', 'session_activity_logs', 'request_logs'
    ]

    // Truncate in reverse dependency order
    for (const table of tables.reverse()) {
      try {
        const { error } = await client.rpc('exec', {
          sql: `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`
        })
        
        if (error && !error.message.includes('does not exist')) {
          console.warn(`Warning: Failed to truncate ${table}:`, error.message)
        }
      } catch (error) {
        console.warn(`Warning: Failed to truncate ${table}:`, error)
      }
    }
  }

  private async rollbackTransaction(testId: string): Promise<void> {
    const transaction = this.activeTransactions.get(testId)
    if (transaction && transaction.isActive) {
      await transaction.rollback()
    }
  }

  private async recreateTestSchema(client: SupabaseClient, testId: string): Promise<void> {
    // Drop and recreate test schema
    // This is a more aggressive cleanup strategy
    await this.truncateTestTables(client)
    await this.setupTestSchema(client, testId)
  }

  async teardownTest(testId: string): Promise<void> {
    try {
      // Cleanup test data
      await this.cleanupTestData(testId)

      // Close transaction if active
      const transaction = this.activeTransactions.get(testId)
      if (transaction && transaction.isActive) {
        await transaction.rollback()
      }

      // Remove from tracking
      this.testClients.delete(testId)
      this.activeTransactions.delete(testId)
      this.testDatabases.delete(testId)
      
      console.log(`🧹 Test torn down: ${testId}`)
    } catch (error) {
      console.error(`❌ Failed to teardown test ${testId}:`, error)
    }
  }

  async teardownAllTests(): Promise<void> {
    console.log('🧹 Tearing down all test databases...')
    
    const teardownPromises = Array.from(this.testClients.keys()).map(testId =>
      this.teardownTest(testId)
    )

    await Promise.all(teardownPromises)
    
    console.log('✅ All test databases torn down')
  }

  async getTestDatabaseStats(testId: string): Promise<{
    tableCount: number
    recordCounts: Record<string, number>
    activeConnections: number
  }> {
    const client = this.testClients.get(testId)
    if (!client) {
      throw new Error(`Test client not found for test: ${testId}`)
    }

    try {
      // Get table count
      const { data: tables, error: tablesError } = await client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (tablesError) {
        throw new Error(`Failed to get table count: ${tablesError.message}`)
      }

      const tableCount = tables?.length || 0

      // Get record counts for main tables
      const mainTables = ['organizations', 'users', 'contacts', 'interactions', 'opportunities', 'products']
      const recordCounts: Record<string, number> = {}

      for (const table of mainTables) {
        try {
          const { count, error } = await client
            .from(table)
            .select('*', { count: 'exact', head: true })

          if (!error) {
            recordCounts[table] = count || 0
          }
        } catch (error) {
          recordCounts[table] = 0
        }
      }

      return {
        tableCount,
        recordCounts,
        activeConnections: this.testClients.size
      }
    } catch (error) {
      console.error(`Failed to get test database stats for ${testId}:`, error)
      throw error
    }
  }

  async waitForTestDatabase(testId: string, timeout: number = 30000): Promise<boolean> {
    const client = this.testClients.get(testId)
    if (!client) {
      return false
    }

    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      try {
        const { error } = await client
          .from('organizations')
          .select('id')
          .limit(1)

        if (!error) {
          return true
        }
      } catch (error) {
        // Continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return false
  }

  // Helper method for Jest setup
  static async setupJestEnvironment(): Promise<{
    setup: (testName?: string) => Promise<SupabaseClient>
    teardown: (testId: string) => Promise<void>
    teardownAll: () => Promise<void>
  }> {
    const testSetup = new DatabaseTestSetup({
      isolationLevel: 'transaction',
      cleanupStrategy: 'truncate'
    })

    return {
      setup: (testName?: string) => testSetup.setupTestDatabase(testName),
      teardown: (testId: string) => testSetup.teardownTest(testId),
      teardownAll: () => testSetup.teardownAllTests()
    }
  }
}