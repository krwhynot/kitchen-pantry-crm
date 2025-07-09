import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { supabaseAdmin } from '../config/database'

interface Migration {
  id: string
  name: string
  sql: string
  executed_at?: string
}

export class DatabaseMigrator {
  private migrationsPath = join(__dirname, 'migrations')

  async createMigrationsTable(): Promise<void> {
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS migrations (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (error) {
      throw new Error(`Failed to create migrations table: ${error.message}`)
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('migrations')
      .select('id')
      .order('id')

    if (error) {
      throw new Error(`Failed to get executed migrations: ${error.message}`)
    }

    return data?.map(m => m.id) || []
  }

  async getMigrationFiles(): Promise<Migration[]> {
    try {
      const files = await readdir(this.migrationsPath)
      const sqlFiles = files.filter(file => file.endsWith('.sql')).sort()

      const migrations: Migration[] = []
      for (const file of sqlFiles) {
        const filePath = join(this.migrationsPath, file)
        const sql = await readFile(filePath, 'utf-8')
        const id = file.replace('.sql', '')
        const name = id.replace(/^\d+_/, '').replace(/_/g, ' ')

        migrations.push({ id, name, sql })
      }

      return migrations
    } catch (error) {
      throw new Error(`Failed to read migration files: ${error}`)
    }
  }

  async executeMigration(migration: Migration): Promise<void> {
    console.log(`Executing migration: ${migration.id} - ${migration.name}`)

    // Execute the migration SQL
    const { error: sqlError } = await supabaseAdmin.rpc('exec', {
      sql: migration.sql
    })

    if (sqlError) {
      throw new Error(`Failed to execute migration ${migration.id}: ${sqlError.message}`)
    }

    // Record the migration as executed
    const { error: insertError } = await supabaseAdmin
      .from('migrations')
      .insert({
        id: migration.id,
        name: migration.name
      })

    if (insertError) {
      throw new Error(`Failed to record migration ${migration.id}: ${insertError.message}`)
    }

    console.log(`✅ Migration ${migration.id} completed successfully`)
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🚀 Starting database migrations...')

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable()

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations()
      console.log(`📋 Found ${executedMigrations.length} executed migrations`)

      // Get all migration files
      const allMigrations = await this.getMigrationFiles()
      console.log(`📁 Found ${allMigrations.length} migration files`)

      // Filter out already executed migrations
      const pendingMigrations = allMigrations.filter(
        migration => !executedMigrations.includes(migration.id)
      )

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations to run')
        return
      }

      console.log(`⏳ Running ${pendingMigrations.length} pending migrations...`)

      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration)
      }

      console.log('🎉 All migrations completed successfully!')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    console.log(`Rolling back migration: ${migrationId}`)
    
    const { error } = await supabaseAdmin
      .from('migrations')
      .delete()
      .eq('id', migrationId)

    if (error) {
      throw new Error(`Failed to rollback migration ${migrationId}: ${error.message}`)
    }

    console.log(`✅ Migration ${migrationId} rolled back successfully`)
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new DatabaseMigrator()
  const command = process.argv[2]

  switch (command) {
    case 'up':
      migrator.runMigrations().catch(console.error)
      break
    case 'rollback':
      const migrationId = process.argv[3]
      if (!migrationId) {
        console.error('Please provide migration ID to rollback')
        process.exit(1)
      }
      migrator.rollbackMigration(migrationId).catch(console.error)
      break
    default:
      console.log('Usage: npm run migrate [up|rollback <migration_id>]')
  }
}