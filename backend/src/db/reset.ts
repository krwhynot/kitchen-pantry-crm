import { supabaseAdmin } from '../config/database'
import { DatabaseSeeder } from './seed'

export class DatabaseReset {
  async dropTables(): Promise<void> {
    console.log('🗑️ Dropping all tables...')
    
    const dropSQL = `
      -- Drop tables in reverse dependency order
      DROP TABLE IF EXISTS interactions CASCADE;
      DROP TABLE IF EXISTS opportunities CASCADE;
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS organizations CASCADE;
      DROP TABLE IF EXISTS migrations CASCADE;
      
      -- Drop the update trigger function
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `

    const { error } = await supabaseAdmin.rpc('exec', { sql: dropSQL })
    
    if (error) {
      throw new Error(`Failed to drop tables: ${error.message}`)
    }
    
    console.log('✅ All tables dropped successfully')
  }

  async recreateSchema(): Promise<void> {
    console.log('🔄 Recreating database schema...')
    
    const { DatabaseMigrator } = await import('./migrate')
    const migrator = new DatabaseMigrator()
    
    await migrator.runMigrations()
    console.log('✅ Database schema recreated successfully')
  }

  async seedFreshData(): Promise<void> {
    console.log('🌱 Seeding fresh data...')
    
    const seeder = new DatabaseSeeder()
    await seeder.run()
    
    console.log('✅ Fresh data seeded successfully')
  }

  async reset(): Promise<void> {
    try {
      console.log('🔄 Starting database reset...')
      
      // Drop all tables
      await this.dropTables()
      
      // Recreate schema from migrations
      await this.recreateSchema()
      
      // Seed fresh data
      await this.seedFreshData()
      
      console.log('🎉 Database reset completed successfully!')
      
    } catch (error) {
      console.error('❌ Database reset failed:', error)
      throw error
    }
  }

  async softReset(): Promise<void> {
    try {
      console.log('🧹 Starting soft database reset (data only)...')
      
      const seeder = new DatabaseSeeder()
      
      // Clear existing data
      await seeder.clearDatabase()
      
      // Seed fresh data
      await seeder.run()
      
      console.log('🎉 Soft database reset completed successfully!')
      
    } catch (error) {
      console.error('❌ Soft database reset failed:', error)
      throw error
    }
  }
}

// CLI interface
if (require.main === module) {
  const reset = new DatabaseReset()
  const command = process.argv[2]

  switch (command) {
    case 'hard':
      reset.reset().catch(console.error)
      break
    case 'soft':
      reset.softReset().catch(console.error)
      break
    default:
      console.log('Usage: npm run db:reset [hard|soft]')
      console.log('  hard: Drop and recreate all tables + seed data')
      console.log('  soft: Clear data only + seed fresh data')
  }
}