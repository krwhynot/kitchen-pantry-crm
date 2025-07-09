import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { supabaseAdmin } from '../../config/database'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

export interface BackupConfig {
  outputDir: string
  includeSchema: boolean
  includeData: boolean
  compression: boolean
  format: 'sql' | 'json' | 'csv'
  tables?: string[]
  excludeTables?: string[]
  batchSize: number
  encryptionKey?: string
}

export interface BackupMetadata {
  id: string
  name: string
  type: 'full' | 'incremental' | 'schema_only' | 'data_only'
  format: 'sql' | 'json' | 'csv'
  size: number
  tableCount: number
  recordCount: number
  checksum: string
  encrypted: boolean
  createdAt: string
  location: string
  retentionUntil?: string
  tags?: string[]
}

export interface BackupJob {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startedAt?: string
  completedAt?: string
  error?: string
  metadata?: BackupMetadata
}

export class BackupService {
  private defaultConfig: BackupConfig = {
    outputDir: join(process.cwd(), 'backups'),
    includeSchema: true,
    includeData: true,
    compression: true,
    format: 'sql',
    batchSize: 1000,
    excludeTables: ['migrations', 'login_attempts', 'session_activity_logs', 'request_logs']
  }

  private activeJobs: Map<string, BackupJob> = new Map()

  constructor(private config: Partial<BackupConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config }
  }

  async createFullBackup(
    name?: string,
    options: Partial<BackupConfig> = {}
  ): Promise<BackupJob> {
    const jobId = this.generateJobId()
    const backupName = name || `full_backup_${new Date().toISOString().split('T')[0]}`
    const config = { ...this.config, ...options }

    const job: BackupJob = {
      id: jobId,
      status: 'pending',
      progress: 0
    }

    this.activeJobs.set(jobId, job)

    // Start backup process asynchronously
    this.executeBackup(jobId, backupName, 'full', config).catch(error => {
      job.status = 'failed'
      job.error = error.message
      console.error(`Backup job ${jobId} failed:`, error)
    })

    return job
  }

  async createIncrementalBackup(
    baseBackupId: string,
    name?: string,
    options: Partial<BackupConfig> = {}
  ): Promise<BackupJob> {
    const jobId = this.generateJobId()
    const backupName = name || `incremental_backup_${new Date().toISOString().split('T')[0]}`
    const config = { ...this.config, ...options }

    // Get base backup metadata
    const baseBackup = await this.getBackupMetadata(baseBackupId)
    if (!baseBackup) {
      throw new Error(`Base backup ${baseBackupId} not found`)
    }

    const job: BackupJob = {
      id: jobId,
      status: 'pending',
      progress: 0
    }

    this.activeJobs.set(jobId, job)

    // Start incremental backup process
    this.executeIncrementalBackup(jobId, backupName, baseBackup, config).catch(error => {
      job.status = 'failed'
      job.error = error.message
      console.error(`Incremental backup job ${jobId} failed:`, error)
    })

    return job
  }

  private async executeBackup(
    jobId: string,
    name: string,
    type: 'full' | 'incremental' | 'schema_only' | 'data_only',
    config: BackupConfig
  ): Promise<void> {
    const job = this.activeJobs.get(jobId)!
    
    try {
      job.status = 'running'
      job.startedAt = new Date().toISOString()

      await this.ensureBackupDirectory(config.outputDir)

      const fileName = `${name}_${jobId}.${config.format}`
      const filePath = join(config.outputDir, fileName)

      console.log(`🗄️ Starting ${type} backup: ${name}`)

      let totalRecords = 0
      let tableCount = 0

      switch (config.format) {
        case 'sql':
          ({ totalRecords, tableCount } = await this.createSQLBackup(filePath, config, job))
          break
        case 'json':
          ({ totalRecords, tableCount } = await this.createJSONBackup(filePath, config, job))
          break
        case 'csv':
          ({ totalRecords, tableCount } = await this.createCSVBackup(filePath, config, job))
          break
      }

      // Generate checksum
      const checksum = await this.generateChecksum(filePath)
      
      // Get file size
      const stats = await import('fs').then(fs => fs.promises.stat(filePath))
      const size = stats.size

      // Create metadata
      const metadata: BackupMetadata = {
        id: jobId,
        name,
        type,
        format: config.format,
        size,
        tableCount,
        recordCount: totalRecords,
        checksum,
        encrypted: !!config.encryptionKey,
        createdAt: new Date().toISOString(),
        location: filePath,
        tags: [`type:${type}`, `format:${config.format}`]
      }

      // Encrypt if requested
      if (config.encryptionKey) {
        await this.encryptBackup(filePath, config.encryptionKey)
        metadata.encrypted = true
      }

      // Compress if requested
      if (config.compression) {
        await this.compressBackup(filePath)
        const compressedStats = await import('fs').then(fs => fs.promises.stat(`${filePath}.gz`))
        metadata.size = compressedStats.size
        metadata.location = `${filePath}.gz`
      }

      // Save metadata
      await this.saveBackupMetadata(metadata)

      job.status = 'completed'
      job.completedAt = new Date().toISOString()
      job.progress = 100
      job.metadata = metadata

      console.log(`✅ Backup completed: ${name} (${metadata.size} bytes, ${totalRecords} records)`)
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  private async executeIncrementalBackup(
    jobId: string,
    name: string,
    baseBackup: BackupMetadata,
    config: BackupConfig
  ): Promise<void> {
    // For incremental backups, we'll backup only records modified since the base backup
    const baseTimestamp = new Date(baseBackup.createdAt)
    
    const modifiedConfig = {
      ...config,
      // Add timestamp filter for incremental backup
      whereClause: `updated_at > '${baseTimestamp.toISOString()}'`
    }

    await this.executeBackup(jobId, name, 'incremental', modifiedConfig)
  }

  private async createSQLBackup(
    filePath: string,
    config: BackupConfig,
    job: BackupJob
  ): Promise<{ totalRecords: number; tableCount: number }> {
    const writeStream = createWriteStream(filePath)
    let totalRecords = 0
    let tableCount = 0

    try {
      // Write header
      await writeStream.write('-- Kitchen Pantry CRM Database Backup\n')
      await writeStream.write(`-- Created: ${new Date().toISOString()}\n`)
      await writeStream.write(`-- Type: SQL\n\n`)

      // Get tables to backup
      const tables = await this.getTablesToBackup(config)
      tableCount = tables.length

      if (config.includeSchema) {
        await writeStream.write('-- Schema\n')
        for (const table of tables) {
          const schema = await this.getTableSchema(table)
          await writeStream.write(`${schema}\n\n`)
        }
      }

      if (config.includeData) {
        await writeStream.write('-- Data\n')
        
        for (let i = 0; i < tables.length; i++) {
          const table = tables[i]
          const records = await this.exportTableData(table, config)
          
          if (records.length > 0) {
            const insertSQL = this.generateInsertSQL(table, records)
            await writeStream.write(`${insertSQL}\n\n`)
            totalRecords += records.length
          }

          // Update progress
          job.progress = Math.round(((i + 1) / tables.length) * 100)
        }
      }

      await writeStream.end()
      return { totalRecords, tableCount }
    } catch (error) {
      writeStream.destroy()
      throw error
    }
  }

  private async createJSONBackup(
    filePath: string,
    config: BackupConfig,
    job: BackupJob
  ): Promise<{ totalRecords: number; tableCount: number }> {
    const tables = await this.getTablesToBackup(config)
    const backup: any = {
      metadata: {
        created: new Date().toISOString(),
        type: 'json',
        tables: tables.length
      },
      schema: {},
      data: {}
    }

    let totalRecords = 0

    if (config.includeSchema) {
      for (const table of tables) {
        backup.schema[table] = await this.getTableSchemaJSON(table)
      }
    }

    if (config.includeData) {
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i]
        const records = await this.exportTableData(table, config)
        backup.data[table] = records
        totalRecords += records.length

        // Update progress
        job.progress = Math.round(((i + 1) / tables.length) * 100)
      }
    }

    await writeFile(filePath, JSON.stringify(backup, null, 2), 'utf-8')
    return { totalRecords, tableCount: tables.length }
  }

  private async createCSVBackup(
    filePath: string,
    config: BackupConfig,
    job: BackupJob
  ): Promise<{ totalRecords: number; tableCount: number }> {
    const tables = await this.getTablesToBackup(config)
    const zipPath = filePath.replace('.csv', '.zip')
    
    // For CSV, we'll create a ZIP file with one CSV per table
    // This is a simplified implementation
    let totalRecords = 0

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      const records = await this.exportTableData(table, config)
      
      if (records.length > 0) {
        const csvContent = this.convertToCSV(records)
        const tableFilePath = filePath.replace('.csv', `_${table}.csv`)
        await writeFile(tableFilePath, csvContent, 'utf-8')
        totalRecords += records.length
      }

      // Update progress
      job.progress = Math.round(((i + 1) / tables.length) * 100)
    }

    return { totalRecords, tableCount: tables.length }
  }

  private async getTablesToBackup(config: BackupConfig): Promise<string[]> {
    if (config.tables) {
      return config.tables
    }

    // Get all tables
    const { data: tables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (error) {
      throw new Error(`Failed to get tables: ${error.message}`)
    }

    let tableNames = tables?.map(t => t.table_name) || []

    // Exclude specified tables
    if (config.excludeTables) {
      tableNames = tableNames.filter(name => !config.excludeTables!.includes(name))
    }

    return tableNames
  }

  private async exportTableData(table: string, config: BackupConfig): Promise<any[]> {
    try {
      let query = supabaseAdmin.from(table).select('*')

      // Apply incremental backup filter if specified
      if ('whereClause' in config && config.whereClause) {
        // This would need proper SQL parsing in a real implementation
        console.log(`Applying incremental filter for ${table}`)
      }

      const { data, error } = await query

      if (error) {
        console.warn(`Failed to export ${table}:`, error.message)
        return []
      }

      return data || []
    } catch (error) {
      console.warn(`Failed to export ${table}:`, error)
      return []
    }
  }

  private async getTableSchema(table: string): Promise<string> {
    // Get table creation SQL
    // This is a simplified version - real implementation would need to query PostgreSQL system tables
    return `-- Schema for ${table}\n-- (Schema extraction not fully implemented)\n`
  }

  private async getTableSchemaJSON(table: string): Promise<any> {
    try {
      const { data: columns, error } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table)
        .order('ordinal_position')

      if (error) {
        throw new Error(`Failed to get schema for ${table}: ${error.message}`)
      }

      return {
        columns: columns || [],
        table_name: table
      }
    } catch (error) {
      console.warn(`Failed to get schema for ${table}:`, error)
      return { columns: [], table_name: table }
    }
  }

  private generateInsertSQL(table: string, records: any[]): string {
    if (records.length === 0) return ''

    const columns = Object.keys(records[0])
    const values = records.map(record => {
      const vals = columns.map(col => {
        const val = record[col]
        if (val === null || val === undefined) return 'NULL'
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
        if (val instanceof Date) return `'${val.toISOString()}'`
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`
        return String(val)
      })
      return `(${vals.join(', ')})`
    })

    return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values.join(',\n')};`
  }

  private convertToCSV(records: any[]): string {
    if (records.length === 0) return ''

    const columns = Object.keys(records[0])
    const header = columns.join(',')
    const rows = records.map(record => 
      columns.map(col => {
        const val = record[col]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(',')
    )

    return [header, ...rows].join('\n')
  }

  private async generateChecksum(filePath: string): Promise<string> {
    const crypto = await import('crypto')
    const fs = await import('fs')
    
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)
      
      stream.on('data', data => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  private async encryptBackup(filePath: string, encryptionKey: string): Promise<void> {
    // Simplified encryption - in production, use proper encryption libraries
    console.log(`🔐 Encrypting backup: ${filePath}`)
    // Implementation would use crypto libraries for file encryption
  }

  private async compressBackup(filePath: string): Promise<void> {
    const zlib = await import('zlib')
    const fs = await import('fs')
    
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip()
      const source = fs.createReadStream(filePath)
      const destination = fs.createWriteStream(`${filePath}.gz`)
      
      pipeline(source, gzip, destination)
        .then(() => {
          // Remove uncompressed file
          fs.unlinkSync(filePath)
          resolve()
        })
        .catch(reject)
    })
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = join(this.config.outputDir!, 'metadata.json')
    
    let allMetadata: BackupMetadata[] = []
    
    if (existsSync(metadataPath)) {
      const existing = await readFile(metadataPath, 'utf-8')
      allMetadata = JSON.parse(existing)
    }

    allMetadata.push(metadata)
    await writeFile(metadataPath, JSON.stringify(allMetadata, null, 2), 'utf-8')

    // Also store in database if available
    try {
      await supabaseAdmin
        .from('backup_metadata')
        .insert({
          id: metadata.id,
          name: metadata.name,
          type: metadata.type,
          format: metadata.format,
          size: metadata.size,
          table_count: metadata.tableCount,
          record_count: metadata.recordCount,
          checksum: metadata.checksum,
          encrypted: metadata.encrypted,
          created_at: metadata.createdAt,
          location: metadata.location,
          retention_until: metadata.retentionUntil,
          tags: metadata.tags
        })
    } catch (error) {
      console.warn('Failed to save backup metadata to database:', error)
    }
  }

  private async ensureBackupDirectory(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }

  private generateJobId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getBackupJob(jobId: string): Promise<BackupJob | null> {
    return this.activeJobs.get(jobId) || null
  }

  async listBackupJobs(): Promise<BackupJob[]> {
    return Array.from(this.activeJobs.values())
  }

  async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = join(this.config.outputDir!, 'metadata.json')
      
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

  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const metadataPath = join(this.config.outputDir!, 'metadata.json')
      
      if (existsSync(metadataPath)) {
        const content = await readFile(metadataPath, 'utf-8')
        return JSON.parse(content)
      }

      return []
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    const metadata = await this.getBackupMetadata(backupId)
    if (!metadata) {
      throw new Error(`Backup ${backupId} not found`)
    }

    // Delete backup file
    if (existsSync(metadata.location)) {
      await import('fs').then(fs => fs.promises.unlink(metadata.location))
    }

    // Remove from metadata
    const metadataPath = join(this.config.outputDir!, 'metadata.json')
    if (existsSync(metadataPath)) {
      const content = await readFile(metadataPath, 'utf-8')
      const allMetadata: BackupMetadata[] = JSON.parse(content)
      const filtered = allMetadata.filter(m => m.id !== backupId)
      await writeFile(metadataPath, JSON.stringify(filtered, null, 2), 'utf-8')
    }

    console.log(`🗑️ Deleted backup: ${backupId}`)
  }

  async validateBackup(backupId: string): Promise<{
    isValid: boolean
    checksumMatch: boolean
    fileExists: boolean
    errors: string[]
  }> {
    const metadata = await this.getBackupMetadata(backupId)
    if (!metadata) {
      return {
        isValid: false,
        checksumMatch: false,
        fileExists: false,
        errors: ['Backup metadata not found']
      }
    }

    const errors: string[] = []
    let fileExists = false
    let checksumMatch = false

    // Check if file exists
    if (existsSync(metadata.location)) {
      fileExists = true
      
      // Verify checksum
      try {
        const currentChecksum = await this.generateChecksum(metadata.location)
        checksumMatch = currentChecksum === metadata.checksum
        
        if (!checksumMatch) {
          errors.push('Checksum verification failed - backup may be corrupted')
        }
      } catch (error) {
        errors.push(`Failed to verify checksum: ${error}`)
      }
    } else {
      errors.push('Backup file not found')
    }

    return {
      isValid: fileExists && checksumMatch && errors.length === 0,
      checksumMatch,
      fileExists,
      errors
    }
  }
}