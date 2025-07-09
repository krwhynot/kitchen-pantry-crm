import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import { supabaseAdmin } from '../config/database'
import { DatabaseMigrator } from './migrate'

export interface MigrationInfo {
  id: string
  name: string
  sql: string
  rollbackSql?: string
  dependencies?: string[]
  executed_at?: string
  checksum?: string
  description?: string
}

export interface MigrationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  dependencies: string[]
}

export interface SchemaDiff {
  tablesToCreate: string[]
  tablesToDrop: string[]
  tablesToModify: Array<{
    name: string
    changes: string[]
  }>
  indexesToCreate: string[]
  indexesToDrop: string[]
}

export class MigrationManager extends DatabaseMigrator {
  private migrationsPath = join(__dirname, 'migrations')
  private rollbacksPath = join(__dirname, 'migrations', 'rollbacks')

  async initializeRollbacksDirectory(): Promise<void> {
    if (!existsSync(this.rollbacksPath)) {
      await mkdir(this.rollbacksPath, { recursive: true })
    }
  }

  async generateMigrationChecksum(migration: MigrationInfo): Promise<string> {
    const crypto = await import('crypto')
    const content = `${migration.id}:${migration.sql}:${migration.dependencies?.join(',') || ''}`
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  async validateMigration(migration: MigrationInfo): Promise<MigrationValidationResult> {
    const result: MigrationValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      dependencies: migration.dependencies || []
    }

    // Check SQL syntax (basic validation)
    if (!migration.sql || migration.sql.trim().length === 0) {
      result.errors.push('Migration SQL cannot be empty')
      result.isValid = false
    }

    // Check for dangerous operations
    const dangerousPatterns = [
      /DROP\s+DATABASE/i,
      /DROP\s+SCHEMA/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM\s+\w+\s*$/i // DELETE without WHERE clause
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(migration.sql)) {
        result.warnings.push(`Potentially dangerous operation detected: ${pattern.source}`)
      }
    }

    // Validate dependencies
    if (migration.dependencies) {
      const executedMigrations = await this.getExecutedMigrations()
      for (const dep of migration.dependencies) {
        if (!executedMigrations.includes(dep)) {
          result.errors.push(`Missing dependency: ${dep}`)
          result.isValid = false
        }
      }
    }

    // Check for SQL injection patterns (basic)
    const injectionPatterns = [
      /;\s*DROP/i,
      /;\s*DELETE/i,
      /;\s*INSERT/i,
      /;\s*UPDATE/i
    ]

    for (const pattern of injectionPatterns) {
      if (pattern.test(migration.sql)) {
        result.warnings.push('Potential SQL injection pattern detected')
      }
    }

    return result
  }

  async dryRunMigration(migration: MigrationInfo): Promise<{
    success: boolean
    error?: string
    affectedTables: string[]
  }> {
    try {
      // Start a transaction for dry run
      const { data, error } = await supabaseAdmin.rpc('exec', {
        sql: `
          BEGIN;
          ${migration.sql}
          ROLLBACK;
        `
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          affectedTables: []
        }
      }

      // Extract affected tables from SQL (simple pattern matching)
      const tablePattern = /(?:CREATE TABLE|ALTER TABLE|DROP TABLE|INSERT INTO|UPDATE|DELETE FROM)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
      const matches = migration.sql.match(tablePattern) || []
      const affectedTables = [...new Set(matches.map(match => 
        match.split(/\s+/).pop()?.toLowerCase() || ''
      ).filter(Boolean))]

      return {
        success: true,
        affectedTables
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        affectedTables: []
      }
    }
  }

  async createMigrationWithRollback(
    name: string,
    upSql: string,
    downSql: string,
    options: {
      dependencies?: string[]
      description?: string
    } = {}
  ): Promise<string> {
    await this.initializeRollbacksDirectory()

    // Generate migration ID
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const migrationId = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}`

    const migration: MigrationInfo = {
      id: migrationId,
      name,
      sql: upSql,
      rollbackSql: downSql,
      dependencies: options.dependencies,
      description: options.description
    }

    // Validate migration
    const validation = await this.validateMigration(migration)
    if (!validation.isValid) {
      throw new Error(`Migration validation failed: ${validation.errors.join(', ')}`)
    }

    // Generate checksum
    const checksum = await this.generateMigrationChecksum(migration)

    // Create migration file
    const migrationContent = `-- Migration: ${name}
-- Description: ${options.description || 'No description provided'}
-- Dependencies: ${options.dependencies?.join(', ') || 'None'}
-- Checksum: ${checksum}

${upSql}
`

    const migrationFile = join(this.migrationsPath, `${migrationId}.sql`)
    await writeFile(migrationFile, migrationContent, 'utf-8')

    // Create rollback file
    const rollbackContent = `-- Rollback for: ${name}
-- Migration ID: ${migrationId}
-- Checksum: ${checksum}

${downSql}
`

    const rollbackFile = join(this.rollbacksPath, `${migrationId}_rollback.sql`)
    await writeFile(rollbackFile, rollbackContent, 'utf-8')

    console.log(`✅ Created migration: ${migrationId}`)
    console.log(`📄 Migration file: ${migrationFile}`)
    console.log(`🔄 Rollback file: ${rollbackFile}`)

    return migrationId
  }

  async getMigrationInfo(migrationId: string): Promise<MigrationInfo | null> {
    try {
      const migrationFile = join(this.migrationsPath, `${migrationId}.sql`)
      const rollbackFile = join(this.rollbacksPath, `${migrationId}_rollback.sql`)

      const sql = await readFile(migrationFile, 'utf-8')
      let rollbackSql: string | undefined

      if (existsSync(rollbackFile)) {
        rollbackSql = await readFile(rollbackFile, 'utf-8')
      }

      // Extract metadata from comments
      const descriptionMatch = sql.match(/-- Description: (.+)/i)
      const dependenciesMatch = sql.match(/-- Dependencies: (.+)/i)
      const checksumMatch = sql.match(/-- Checksum: (.+)/i)

      const dependencies = dependenciesMatch?.[1]
        ?.split(',')
        .map(d => d.trim())
        .filter(d => d !== 'None' && d.length > 0)

      return {
        id: migrationId,
        name: migrationId.replace(/^\d+_/, '').replace(/_/g, ' '),
        sql: sql.replace(/^-- .+$/gm, '').trim(),
        rollbackSql: rollbackSql?.replace(/^-- .+$/gm, '').trim(),
        dependencies,
        description: descriptionMatch?.[1]?.trim(),
        checksum: checksumMatch?.[1]?.trim()
      }
    } catch (error) {
      console.error(`Failed to get migration info for ${migrationId}:`, error)
      return null
    }
  }

  async rollbackToMigration(targetMigrationId: string): Promise<void> {
    console.log(`🔄 Rolling back to migration: ${targetMigrationId}`)

    // Get executed migrations
    const executedMigrations = await this.getExecutedMigrations()
    
    // Find target migration index
    const targetIndex = executedMigrations.indexOf(targetMigrationId)
    if (targetIndex === -1) {
      throw new Error(`Target migration ${targetMigrationId} not found in executed migrations`)
    }

    // Get migrations to rollback (in reverse order)
    const migrationsToRollback = executedMigrations.slice(targetIndex + 1).reverse()

    console.log(`📋 Found ${migrationsToRollback.length} migrations to rollback`)

    // Execute rollbacks
    for (const migrationId of migrationsToRollback) {
      await this.rollbackMigrationWithSql(migrationId)
    }

    console.log(`✅ Rollback to ${targetMigrationId} completed successfully`)
  }

  async rollbackMigrationWithSql(migrationId: string): Promise<void> {
    console.log(`🔄 Rolling back migration: ${migrationId}`)

    const migrationInfo = await this.getMigrationInfo(migrationId)
    if (!migrationInfo?.rollbackSql) {
      throw new Error(`No rollback SQL found for migration ${migrationId}`)
    }

    try {
      // Execute rollback SQL
      const { error: sqlError } = await supabaseAdmin.rpc('exec', {
        sql: migrationInfo.rollbackSql
      })

      if (sqlError) {
        throw new Error(`Failed to execute rollback SQL: ${sqlError.message}`)
      }

      // Remove migration record
      const { error: deleteError } = await supabaseAdmin
        .from('migrations')
        .delete()
        .eq('id', migrationId)

      if (deleteError) {
        throw new Error(`Failed to remove migration record: ${deleteError.message}`)
      }

      console.log(`✅ Migration ${migrationId} rolled back successfully`)
    } catch (error) {
      console.error(`❌ Failed to rollback migration ${migrationId}:`, error)
      throw error
    }
  }

  async compareDatabaseSchema(): Promise<SchemaDiff> {
    try {
      // Get current database schema
      const { data: tables, error: tablesError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (tablesError) {
        throw new Error(`Failed to get tables: ${tablesError.message}`)
      }

      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable')
        .eq('table_schema', 'public')

      if (columnsError) {
        throw new Error(`Failed to get columns: ${columnsError.message}`)
      }

      const { data: indexes, error: indexesError } = await supabaseAdmin
        .rpc('exec', {
          sql: `
            SELECT indexname, tablename 
            FROM pg_indexes 
            WHERE schemaname = 'public'
          `
        })

      if (indexesError) {
        console.warn('Failed to get indexes:', indexesError.message)
      }

      // For now, return a basic diff structure
      // In a real implementation, this would compare against a target schema
      return {
        tablesToCreate: [],
        tablesToDrop: [],
        tablesToModify: [],
        indexesToCreate: [],
        indexesToDrop: []
      }
    } catch (error) {
      console.error('Failed to compare database schema:', error)
      throw error
    }
  }

  async getMigrationDependencyTree(): Promise<Map<string, string[]>> {
    const allMigrations = await this.getMigrationFiles()
    const dependencyTree = new Map<string, string[]>()

    for (const migration of allMigrations) {
      const info = await this.getMigrationInfo(migration.id)
      dependencyTree.set(migration.id, info?.dependencies || [])
    }

    return dependencyTree
  }

  async validateMigrationOrder(): Promise<{
    isValid: boolean
    errors: string[]
    suggestedOrder: string[]
  }> {
    const dependencyTree = await this.getMigrationDependencyTree()
    const executedMigrations = await this.getExecutedMigrations()
    const errors: string[] = []

    // Check if all dependencies are satisfied
    for (const [migrationId, dependencies] of dependencyTree) {
      if (executedMigrations.includes(migrationId)) {
        // Check if dependencies were executed before this migration
        const migrationIndex = executedMigrations.indexOf(migrationId)
        for (const dep of dependencies) {
          const depIndex = executedMigrations.indexOf(dep)
          if (depIndex === -1) {
            errors.push(`Migration ${migrationId} depends on ${dep} which was not executed`)
          } else if (depIndex > migrationIndex) {
            errors.push(`Migration ${migrationId} depends on ${dep} which was executed after it`)
          }
        }
      }
    }

    // Generate suggested order using topological sort
    const suggestedOrder = this.topologicalSort(dependencyTree)

    return {
      isValid: errors.length === 0,
      errors,
      suggestedOrder
    }
  }

  private topologicalSort(dependencyTree: Map<string, string[]>): string[] {
    const visited = new Set<string>()
    const temp = new Set<string>()
    const result: string[] = []

    const visit = (node: string) => {
      if (temp.has(node)) {
        throw new Error(`Circular dependency detected involving ${node}`)
      }
      if (!visited.has(node)) {
        temp.add(node)
        const dependencies = dependencyTree.get(node) || []
        for (const dep of dependencies) {
          visit(dep)
        }
        temp.delete(node)
        visited.add(node)
        result.unshift(node)
      }
    }

    for (const node of dependencyTree.keys()) {
      if (!visited.has(node)) {
        visit(node)
      }
    }

    return result
  }

  async getMigrationStatistics(): Promise<{
    totalMigrations: number
    executedMigrations: number
    pendingMigrations: number
    lastExecutionTime: string | null
    averageExecutionTime: number
    migrationHistory: Array<{
      id: string
      name: string
      executedAt: string
      duration?: number
    }>
  }> {
    const [allMigrations, executedMigrations] = await Promise.all([
      this.getMigrationFiles(),
      this.getExecutedMigrations()
    ])

    // Get execution history with timestamps
    const { data: history, error } = await supabaseAdmin
      .from('migrations')
      .select('id, name, executed_at')
      .order('executed_at', { ascending: false })

    if (error) {
      console.warn('Failed to get migration history:', error.message)
    }

    const migrationHistory = history || []
    const lastExecution = migrationHistory[0]?.executed_at || null

    return {
      totalMigrations: allMigrations.length,
      executedMigrations: executedMigrations.length,
      pendingMigrations: allMigrations.length - executedMigrations.length,
      lastExecutionTime: lastExecution,
      averageExecutionTime: 0, // Would need execution time tracking
      migrationHistory: migrationHistory.map(m => ({
        id: m.id,
        name: m.name,
        executedAt: m.executed_at
      }))
    }
  }
}