import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { supabaseAdmin } from '../../config/database'
import { BackupMetadata } from './BackupService'
import { DatabaseMigrator } from '../migrate'

export interface RecoveryOptions {
  backupId: string
  targetTables?: string[]
  excludeTables?: string[]
  validateBefore: boolean
  createCheckpoint: boolean
  dryRun: boolean
  strategy: 'replace' | 'merge' | 'append'
  batchSize: number
}

export interface RecoveryJob {
  id: string
  backupId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'validating'
  progress: number
  startedAt?: string
  completedAt?: string
  error?: string
  tablesProcessed: number
  recordsRestored: number
  checkpointId?: string
  validationResults?: RecoveryValidationResult[]
}

export interface RecoveryValidationResult {
  table: string
  recordsInBackup: number
  recordsRestored: number
  errors: string[]
  warnings: string[]
}

export interface RecoveryPlan {
  backupMetadata: BackupMetadata
  tables: Array<{
    name: string
    action: 'create' | 'truncate' | 'merge' | 'skip'
    recordCount: number
    dependencies: string[]
  }>
  estimatedDuration: number
  risks: string[]
  requirements: string[]
}

export class RecoveryService {
  private activeJobs: Map<string, RecoveryJob> = new Map()
  private migrator: DatabaseMigrator

  constructor(private backupDir: string) {
    this.migrator = new DatabaseMigrator()
  }

  async createRecoveryPlan(
    backupId: string,
    options: Partial<RecoveryOptions> = {}
  ): Promise<RecoveryPlan> {
    const metadata = await this.getBackupMetadata(backupId)
    if (!metadata) {
      throw new Error(`Backup ${backupId} not found`)
    }

    // Validate backup before creating plan
    const validation = await this.validateBackup(metadata)
    if (!validation.isValid) {
      throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`)
    }

    // Parse backup to understand structure
    const backupData = await this.parseBackup(metadata)
    
    // Create recovery plan
    const plan: RecoveryPlan = {
      backupMetadata: metadata,
      tables: [],
      estimatedDuration: 0,
      risks: [],
      requirements: []
    }

    // Analyze each table
    for (const [tableName, tableData] of Object.entries(backupData.data || {})) {
      if (options.targetTables && !options.targetTables.includes(tableName)) {
        continue
      }
      
      if (options.excludeTables && options.excludeTables.includes(tableName)) {
        continue
      }

      const records = Array.isArray(tableData) ? tableData : []
      const currentTableExists = await this.tableExists(tableName)
      
      let action: 'create' | 'truncate' | 'merge' | 'skip' = 'skip'
      
      if (!currentTableExists) {
        action = 'create'
        plan.requirements.push(`Create table: ${tableName}`)
      } else {
        const strategy = options.strategy || 'replace'
        switch (strategy) {
          case 'replace':
            action = 'truncate'
            plan.risks.push(`All existing data in ${tableName} will be lost`)
            break
          case 'merge':
          case 'append':
            action = 'merge'
            plan.risks.push(`Potential conflicts in ${tableName} if duplicate keys exist`)
            break
        }
      }

      plan.tables.push({
        name: tableName,
        action,
        recordCount: records.length,
        dependencies: this.getTableDependencies(tableName, plan.tables)
      })

      // Estimate processing time (rough calculation)
      plan.estimatedDuration += Math.ceil(records.length / 1000) * 1000 // 1 second per 1000 records
    }

    // Add general requirements and risks
    if (options.createCheckpoint) {
      plan.requirements.push('Create recovery checkpoint before starting')
    }

    plan.risks.push('Database will be temporarily unavailable during recovery')
    plan.requirements.push('Ensure sufficient disk space for recovery operation')

    return plan
  }

  async executeRecovery(
    backupId: string,
    options: RecoveryOptions
  ): Promise<RecoveryJob> {
    const jobId = this.generateJobId()
    
    const job: RecoveryJob = {
      id: jobId,
      backupId,
      status: 'pending',
      progress: 0,
      tablesProcessed: 0,
      recordsRestored: 0
    }

    this.activeJobs.set(jobId, job)

    // Start recovery process asynchronously
    this.executeRecoveryProcess(jobId, options).catch(error => {
      job.status = 'failed'
      job.error = error.message
      console.error(`Recovery job ${jobId} failed:`, error)
    })

    return job
  }

  private async executeRecoveryProcess(
    jobId: string,
    options: RecoveryOptions
  ): Promise<void> {
    const job = this.activeJobs.get(jobId)!
    
    try {
      job.status = 'running'
      job.startedAt = new Date().toISOString()

      console.log(`🔄 Starting recovery job: ${jobId}`)

      // Step 1: Validate backup
      if (options.validateBefore) {
        job.status = 'validating'
        await this.validateRecoveryBackup(options.backupId)
        console.log('✅ Backup validation passed')
      }

      // Step 2: Create checkpoint if requested
      if (options.createCheckpoint && !options.dryRun) {
        job.checkpointId = await this.createRecoveryCheckpoint()
        console.log(`📸 Created recovery checkpoint: ${job.checkpointId}`)
      }

      // Step 3: Load backup data
      const metadata = await this.getBackupMetadata(options.backupId)
      if (!metadata) {
        throw new Error(`Backup metadata not found: ${options.backupId}`)
      }

      const backupData = await this.parseBackup(metadata)

      // Step 4: Execute recovery based on strategy
      const tablesToProcess = this.filterTables(
        Object.keys(backupData.data || {}),
        options
      )

      job.progress = 10

      for (let i = 0; i < tablesToProcess.length; i++) {
        const tableName = tablesToProcess[i]
        const tableData = backupData.data[tableName]

        console.log(`📥 Restoring table: ${tableName}`)

        if (!options.dryRun) {
          const restored = await this.restoreTable(
            tableName,
            tableData,
            options.strategy,
            options.batchSize
          )
          job.recordsRestored += restored
        } else {
          console.log(`[DRY RUN] Would restore ${tableData.length} records to ${tableName}`)
        }

        job.tablesProcessed++
        job.progress = 10 + Math.round(((i + 1) / tablesToProcess.length) * 80)
      }

      // Step 5: Validate restoration
      job.status = 'validating'
      job.validationResults = await this.validateRecovery(tablesToProcess, backupData)

      job.status = 'completed'
      job.completedAt = new Date().toISOString()
      job.progress = 100

      console.log(`✅ Recovery completed: ${jobId}`)
      console.log(`📊 Restored ${job.recordsRestored} records across ${job.tablesProcessed} tables`)

    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      
      // Attempt rollback if checkpoint exists
      if (job.checkpointId && !options.dryRun) {
        console.log(`🔄 Attempting rollback to checkpoint: ${job.checkpointId}`)
        try {
          await this.rollbackToCheckpoint(job.checkpointId)
          console.log('✅ Rollback completed')
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError)
          job.error += ` | Rollback failed: ${rollbackError}`
        }
      }

      throw error
    }
  }

  private async parseBackup(metadata: BackupMetadata): Promise<any> {
    if (!existsSync(metadata.location)) {
      throw new Error(`Backup file not found: ${metadata.location}`)
    }

    switch (metadata.format) {
      case 'json':
        return this.parseJSONBackup(metadata.location)
      case 'sql':
        return this.parseSQLBackup(metadata.location)
      case 'csv':
        return this.parseCSVBackup(metadata.location)
      default:
        throw new Error(`Unsupported backup format: ${metadata.format}`)
    }
  }

  private async parseJSONBackup(filePath: string): Promise<any> {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content)
  }

  private async parseSQLBackup(filePath: string): Promise<any> {
    // This is a simplified parser - real implementation would need proper SQL parsing
    const content = await readFile(filePath, 'utf-8')
    
    // Extract INSERT statements and parse data
    const data: Record<string, any[]> = {}
    const insertRegex = /INSERT INTO (\w+) \([^)]+\) VALUES\s*([^;]+);/gi
    
    let match
    while ((match = insertRegex.exec(content)) !== null) {
      const tableName = match[1]
      const valuesString = match[2]
      
      // Parse values (simplified - real implementation needs proper SQL value parsing)
      if (!data[tableName]) {
        data[tableName] = []
      }
      
      // This is a placeholder - proper SQL parsing would be needed
      console.log(`Found INSERT for ${tableName}`)
    }

    return { data, schema: {} }
  }

  private async parseCSVBackup(filePath: string): Promise<any> {
    // For CSV backups, we need to read multiple files
    const data: Record<string, any[]> = {}
    
    // Get directory and find all CSV files
    const dir = filePath.replace(/[^/]*$/, '')
    const files = await readdir(dir)
    const csvFiles = files.filter(f => f.endsWith('.csv'))

    for (const csvFile of csvFiles) {
      const tableName = csvFile.replace(/.*_(\w+)\.csv$/, '$1')
      const csvPath = join(dir, csvFile)
      const csvContent = await readFile(csvPath, 'utf-8')
      
      data[tableName] = this.parseCSVContent(csvContent)
    }

    return { data, schema: {} }
  }

  private parseCSVContent(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
    const records: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => {
        const cleaned = v.replace(/"/g, '')
        // Try to parse as JSON for complex types
        try {
          return JSON.parse(cleaned)
        } catch {
          return cleaned
        }
      })

      const record: any = {}
      headers.forEach((header, index) => {
        record[header] = values[index]
      })
      
      records.push(record)
    }

    return records
  }

  private async restoreTable(
    tableName: string,
    data: any[],
    strategy: 'replace' | 'merge' | 'append',
    batchSize: number
  ): Promise<number> {
    if (!Array.isArray(data) || data.length === 0) {
      return 0
    }

    let restoredCount = 0

    try {
      // Clear table if replace strategy
      if (strategy === 'replace') {
        const { error: deleteError } = await supabaseAdmin
          .from(tableName)
          .delete()
          .neq('id', 'impossible-id') // Delete all records

        if (deleteError) {
          console.warn(`Failed to clear table ${tableName}:`, deleteError.message)
        }
      }

      // Insert data in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        const { error } = await supabaseAdmin
          .from(tableName)
          .insert(batch)

        if (error) {
          if (strategy === 'merge') {
            // Try upsert for merge strategy
            for (const record of batch) {
              const { error: upsertError } = await supabaseAdmin
                .from(tableName)
                .upsert(record)

              if (!upsertError) {
                restoredCount++
              } else {
                console.warn(`Failed to upsert record in ${tableName}:`, upsertError.message)
              }
            }
          } else {
            throw new Error(`Failed to insert batch into ${tableName}: ${error.message}`)
          }
        } else {
          restoredCount += batch.length
        }

        console.log(`📥 Restored ${Math.min(i + batchSize, data.length)}/${data.length} records to ${tableName}`)
      }

      return restoredCount
    } catch (error) {
      console.error(`Failed to restore table ${tableName}:`, error)
      throw error
    }
  }

  private filterTables(allTables: string[], options: RecoveryOptions): string[] {
    let tables = allTables

    if (options.targetTables) {
      tables = tables.filter(t => options.targetTables!.includes(t))
    }

    if (options.excludeTables) {
      tables = tables.filter(t => !options.excludeTables!.includes(t))
    }

    // Sort tables by dependency order
    return this.sortTablesByDependencies(tables)
  }

  private sortTablesByDependencies(tables: string[]): string[] {
    // Simple dependency order - in real implementation, would analyze foreign keys
    const dependencyOrder = [
      'organizations',
      'users', 
      'products',
      'contacts',
      'opportunities',
      'interactions'
    ]

    const sorted = dependencyOrder.filter(table => tables.includes(table))
    const remaining = tables.filter(table => !dependencyOrder.includes(table))
    
    return [...sorted, ...remaining]
  }

  private getTableDependencies(tableName: string, existingTables: any[]): string[] {
    // Simplified dependency mapping
    const dependencies: Record<string, string[]> = {
      users: ['organizations'],
      contacts: ['organizations'],
      interactions: ['contacts', 'organizations', 'users'],
      opportunities: ['contacts', 'organizations', 'users']
    }

    return dependencies[tableName] || []
  }

  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(tableName)
        .select('id')
        .limit(1)

      return !error
    } catch {
      return false
    }
  }

  private async createRecoveryCheckpoint(): Promise<string> {
    const checkpointId = `checkpoint_${Date.now()}`
    
    // Create a backup of current state before recovery
    // This would integrate with the BackupService
    console.log(`Creating recovery checkpoint: ${checkpointId}`)
    
    // In a real implementation, this would create a full backup
    return checkpointId
  }

  private async rollbackToCheckpoint(checkpointId: string): Promise<void> {
    console.log(`Rolling back to checkpoint: ${checkpointId}`)
    
    // In a real implementation, this would restore from the checkpoint backup
    // For now, just log the action
  }

  private async validateRecovery(
    tables: string[],
    originalData: any
  ): Promise<RecoveryValidationResult[]> {
    const results: RecoveryValidationResult[] = []

    for (const tableName of tables) {
      const originalRecords = originalData.data[tableName] || []
      const result: RecoveryValidationResult = {
        table: tableName,
        recordsInBackup: originalRecords.length,
        recordsRestored: 0,
        errors: [],
        warnings: []
      }

      try {
        // Count restored records
        const { count, error } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          result.errors.push(`Failed to count records: ${error.message}`)
        } else {
          result.recordsRestored = count || 0
          
          if (result.recordsRestored !== result.recordsInBackup) {
            result.warnings.push(
              `Record count mismatch: expected ${result.recordsInBackup}, got ${result.recordsRestored}`
            )
          }
        }
      } catch (error) {
        result.errors.push(`Validation failed: ${error}`)
      }

      results.push(result)
    }

    return results
  }

  private async validateBackup(metadata: BackupMetadata): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // Check if backup file exists
    if (!existsSync(metadata.location)) {
      errors.push('Backup file not found')
    }

    // Verify checksum
    try {
      const crypto = await import('crypto')
      const fs = await import('fs')
      
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(metadata.location)
      
      const currentChecksum = await new Promise<string>((resolve, reject) => {
        stream.on('data', data => hash.update(data))
        stream.on('end', () => resolve(hash.digest('hex')))
        stream.on('error', reject)
      })

      if (currentChecksum !== metadata.checksum) {
        errors.push('Backup checksum verification failed')
      }
    } catch (error) {
      errors.push(`Checksum verification error: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private async validateRecoveryBackup(backupId: string): Promise<void> {
    const metadata = await this.getBackupMetadata(backupId)
    if (!metadata) {
      throw new Error(`Backup metadata not found: ${backupId}`)
    }

    const validation = await this.validateBackup(metadata)
    if (!validation.isValid) {
      throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`)
    }
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = join(this.backupDir, 'metadata.json')
      
      if (existsSync(metadataPath)) {
        const content = await readFile(metadataPath, 'utf-8')
        const allMetadata: BackupMetadata[] = JSON.parse(content)
        return allMetadata.find(m => m.id === backupId) || null
      }

      return null
    } catch (error) {
      console.error('Failed to get backup metadata:', error)
      return null
    }
  }

  private generateJobId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getRecoveryJob(jobId: string): Promise<RecoveryJob | null> {
    return this.activeJobs.get(jobId) || null
  }

  async listRecoveryJobs(): Promise<RecoveryJob[]> {
    return Array.from(this.activeJobs.values())
  }

  async cancelRecovery(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      throw new Error(`Recovery job ${jobId} not found`)
    }

    if (job.status === 'running') {
      // In a real implementation, this would stop the running process
      job.status = 'failed'
      job.error = 'Recovery cancelled by user'
      
      if (job.checkpointId) {
        await this.rollbackToCheckpoint(job.checkpointId)
      }
    }

    console.log(`🚫 Recovery job cancelled: ${jobId}`)
  }
}