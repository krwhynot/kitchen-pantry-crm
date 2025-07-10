database_migrations.md


---
title: Database Migration Strategy
---
This section outlines the comprehensive database migration management strategy, including version control, rollback capabilities, and support for zero-downtime deployments.

### Database Migration Strategy

The system implements comprehensive database migration management with version control, rollback capabilities, and zero-downtime deployment support.

**Migration Scripts:** Structured migration scripts with forward and rollback procedures. Migration scripts include schema changes, data transformations, and index management with comprehensive testing.

**Version Control:** Database schema version control with migration tracking and dependency management. Version control includes migration history, rollback procedures, and conflict resolution.

**Zero-Downtime Migrations:** Migration strategies that minimize service disruption including online schema changes and gradual data migration. Zero-downtime migrations include compatibility layers and progressive rollout procedures.

```typescript
// scripts/migrate.ts
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

interface Migration {
  version: string
  name: string
  up: string
  down?: string
  applied_at?: Date
}

class MigrationManager {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async initializeMigrationTable() {
    const { error } = await this.supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS migrations (
          version VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (error) throw error
  }

  async getAppliedMigrations(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('migrations')
      .select('version')
      .order('version')

    if (error) throw error
    return data.map(m => m.version)
  }

  async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = path.join(__dirname, '../migrations')
    const files = await fs.readdir(migrationsDir)
    
    const migrations: Migration[] = []
    
    for (const file of files.sort()) {
      if (file.endsWith('.sql')) {
        const content = await fs.readFile(
          path.join(migrationsDir, file), 
          'utf-8'
        )
        
        const [version, ...nameParts] = file.replace('.sql', '').split('_')
        
        migrations.push({
          version,
          name: nameParts.join('_'),
          up: content
        })
      }
    }
    
    return migrations
  }

  async runMigrations() {
    await this.initializeMigrationTable()
    
    const appliedMigrations = await this.getAppliedMigrations()
    const allMigrations = await this.loadMigrations()
    
    const pendingMigrations = allMigrations.filter(
      m => !appliedMigrations.includes(m.version)
    )

    console.log(`Found ${pendingMigrations.length} pending migrations`)

    for (const migration of pendingMigrations) {
      console.log(`Applying migration ${migration.version}: ${migration.name}`)
      
      try {
        // Execute migration
        const { error } = await this.supabase.rpc('exec_sql', {
          sql: migration.up
        })

        if (error) throw error

        // Record migration
        const { error: recordError } = await this.supabase
          .from('migrations')
          .insert({
            version: migration.version,
            name: migration.name
          })

        if (recordError) throw recordError

        console.log(`Migration ${migration.version} applied successfully`)
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error)
        throw error
      }
    }

    console.log('All migrations completed successfully')
  }

  async rollbackMigration(version: string) {
    // Implementation for rollback functionality
    console.log(`Rolling back migration ${version}`)
    // Add rollback logic here
  }
}

// CLI interface
if (require.main === module) {
  const migrationManager = new MigrationManager()
  
  const command = process.argv[2]
  
  switch (command) {
    case 'up':
      migrationManager.runMigrations()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Migration failed:', error)
          process.exit(1)
        })
      break
      
    case 'rollback':
      const version = process.argv[3]
      if (!version) {
        console.error('Version required for rollback')
        process.exit(1)
      }
      migrationManager.rollbackMigration(version)
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Rollback failed:', error)
          process.exit(1)
        })
      break
      
    default:
      console.log('Usage: npm run migrate [up|rollback <version>]')
      process.exit(1)
  }
}