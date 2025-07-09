import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { supabaseAdmin } from '../config/database'

export interface TableDefinition {
  name: string
  columns: ColumnDefinition[]
  constraints?: ConstraintDefinition[]
  indexes?: IndexDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: string
  nullable?: boolean
  primaryKey?: boolean
  unique?: boolean
  default?: string
  references?: {
    table: string
    column: string
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT'
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT'
  }
}

export interface ConstraintDefinition {
  name: string
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK'
  columns: string[]
  references?: {
    table: string
    columns: string[]
  }
  checkCondition?: string
}

export interface IndexDefinition {
  name: string
  columns: string[]
  unique?: boolean
  type?: 'BTREE' | 'HASH' | 'GIN' | 'GIST'
  where?: string
}

export interface MigrationTemplate {
  name: string
  description: string
  upSql: string
  downSql: string
  dependencies?: string[]
}

export class MigrationGenerator {
  private migrationsPath = join(__dirname, 'migrations')
  private templatesPath = join(__dirname, 'templates')

  async ensureDirectories(): Promise<void> {
    if (!existsSync(this.migrationsPath)) {
      await mkdir(this.migrationsPath, { recursive: true })
    }
    if (!existsSync(this.templatesPath)) {
      await mkdir(this.templatesPath, { recursive: true })
    }
  }

  generateCreateTableMigration(table: TableDefinition): MigrationTemplate {
    const upSql = this.generateCreateTableSQL(table)
    const downSql = `DROP TABLE IF EXISTS ${table.name} CASCADE;`

    return {
      name: `create_${table.name}_table`,
      description: `Create ${table.name} table with columns and constraints`,
      upSql,
      downSql
    }
  }

  generateAddColumnMigration(
    tableName: string,
    column: ColumnDefinition
  ): MigrationTemplate {
    const upSql = `ALTER TABLE ${tableName} ADD COLUMN ${this.generateColumnSQL(column)};`
    const downSql = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${column.name};`

    return {
      name: `add_${column.name}_to_${tableName}`,
      description: `Add ${column.name} column to ${tableName} table`,
      upSql,
      downSql
    }
  }

  generateDropColumnMigration(
    tableName: string,
    columnName: string,
    columnDefinition?: ColumnDefinition
  ): MigrationTemplate {
    const upSql = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName};`
    
    let downSql = `-- Cannot automatically restore column ${columnName}`
    if (columnDefinition) {
      downSql = `ALTER TABLE ${tableName} ADD COLUMN ${this.generateColumnSQL(columnDefinition)};`
    }

    return {
      name: `drop_${columnName}_from_${tableName}`,
      description: `Drop ${columnName} column from ${tableName} table`,
      upSql,
      downSql
    }
  }

  generateModifyColumnMigration(
    tableName: string,
    columnName: string,
    oldDefinition: ColumnDefinition,
    newDefinition: ColumnDefinition
  ): MigrationTemplate {
    const changes: string[] = []
    const reverseChanges: string[] = []

    // Type change
    if (oldDefinition.type !== newDefinition.type) {
      changes.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE ${newDefinition.type};`)
      reverseChanges.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE ${oldDefinition.type};`)
    }

    // Nullable change
    if (oldDefinition.nullable !== newDefinition.nullable) {
      if (newDefinition.nullable) {
        changes.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP NOT NULL;`)
        reverseChanges.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL;`)
      } else {
        changes.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL;`)
        reverseChanges.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP NOT NULL;`)
      }
    }

    // Default value change
    if (oldDefinition.default !== newDefinition.default) {
      if (newDefinition.default) {
        changes.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET DEFAULT ${newDefinition.default};`)
      } else {
        changes.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP DEFAULT;`)
      }

      if (oldDefinition.default) {
        reverseChanges.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET DEFAULT ${oldDefinition.default};`)
      } else {
        reverseChanges.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP DEFAULT;`)
      }
    }

    return {
      name: `modify_${columnName}_in_${tableName}`,
      description: `Modify ${columnName} column in ${tableName} table`,
      upSql: changes.join('\n'),
      downSql: reverseChanges.reverse().join('\n')
    }
  }

  generateAddIndexMigration(
    tableName: string,
    index: IndexDefinition
  ): MigrationTemplate {
    const upSql = this.generateCreateIndexSQL(tableName, index)
    const downSql = `DROP INDEX IF EXISTS ${index.name};`

    return {
      name: `add_${index.name}_index`,
      description: `Add ${index.name} index to ${tableName} table`,
      upSql,
      downSql
    }
  }

  generateAddConstraintMigration(
    tableName: string,
    constraint: ConstraintDefinition
  ): MigrationTemplate {
    const upSql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.name} ${this.generateConstraintSQL(constraint)};`
    const downSql = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraint.name};`

    return {
      name: `add_${constraint.name}_constraint`,
      description: `Add ${constraint.name} constraint to ${tableName} table`,
      upSql,
      downSql
    }
  }

  generateSeedDataMigration(
    tableName: string,
    data: Record<string, any>[],
    identifierColumns: string[] = ['id']
  ): MigrationTemplate {
    const columns = Object.keys(data[0] || {})
    const values = data.map(row => 
      `(${columns.map(col => this.formatValue(row[col])).join(', ')})`
    ).join(',\n  ')

    const upSql = `
INSERT INTO ${tableName} (${columns.join(', ')})
VALUES
  ${values}
ON CONFLICT (${identifierColumns.join(', ')}) DO NOTHING;
`.trim()

    // Generate delete statements for rollback
    const deleteConditions = data.map(row => 
      identifierColumns.map(col => `${col} = ${this.formatValue(row[col])}`).join(' AND ')
    )
    
    const downSql = deleteConditions.map(condition => 
      `DELETE FROM ${tableName} WHERE ${condition};`
    ).join('\n')

    return {
      name: `seed_${tableName}_data`,
      description: `Seed initial data for ${tableName} table`,
      upSql,
      downSql
    }
  }

  generateRLSMigration(
    tableName: string,
    policies: Array<{
      name: string
      command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
      role?: string
      using?: string
      withCheck?: string
    }>
  ): MigrationTemplate {
    const upStatements: string[] = [
      `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
    ]

    const downStatements: string[] = [
      `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;`
    ]

    for (const policy of policies) {
      let policySQL = `CREATE POLICY ${policy.name} ON ${tableName} FOR ${policy.command}`
      
      if (policy.role) {
        policySQL += ` TO ${policy.role}`
      }
      
      if (policy.using) {
        policySQL += ` USING (${policy.using})`
      }
      
      if (policy.withCheck) {
        policySQL += ` WITH CHECK (${policy.withCheck})`
      }
      
      policySQL += ';'
      upStatements.push(policySQL)
      downStatements.unshift(`DROP POLICY IF EXISTS ${policy.name} ON ${tableName};`)
    }

    return {
      name: `add_rls_to_${tableName}`,
      description: `Add Row Level Security policies to ${tableName} table`,
      upSql: upStatements.join('\n'),
      downSql: downStatements.join('\n')
    }
  }

  async generateFromSchema(
    sourceSchema: string = 'public',
    targetSchema: string = 'public'
  ): Promise<MigrationTemplate[]> {
    // Get current schema
    const currentTables = await this.getCurrentSchema(sourceSchema)
    
    // For now, return empty array - in a real implementation,
    // this would compare against a target schema definition
    return []
  }

  private async getCurrentSchema(schema: string = 'public'): Promise<TableDefinition[]> {
    try {
      // Get tables
      const { data: tables, error: tablesError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', schema)

      if (tablesError) {
        throw new Error(`Failed to get tables: ${tablesError.message}`)
      }

      const tableDefinitions: TableDefinition[] = []

      for (const table of tables || []) {
        const tableName = table.table_name

        // Get columns
        const { data: columns, error: columnsError } = await supabaseAdmin
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', schema)
          .eq('table_name', tableName)
          .order('ordinal_position')

        if (columnsError) {
          console.error(`Failed to get columns for ${tableName}:`, columnsError.message)
          continue
        }

        const columnDefinitions: ColumnDefinition[] = (columns || []).map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default
        }))

        tableDefinitions.push({
          name: tableName,
          columns: columnDefinitions
        })
      }

      return tableDefinitions
    } catch (error) {
      console.error('Failed to get current schema:', error)
      return []
    }
  }

  private generateCreateTableSQL(table: TableDefinition): string {
    const columns = table.columns.map(col => this.generateColumnSQL(col))
    
    let sql = `CREATE TABLE ${table.name} (\n  ${columns.join(',\n  ')}`

    // Add table-level constraints
    if (table.constraints) {
      const constraints = table.constraints.map(constraint => 
        `CONSTRAINT ${constraint.name} ${this.generateConstraintSQL(constraint)}`
      )
      sql += ',\n  ' + constraints.join(',\n  ')
    }

    sql += '\n);'

    // Add indexes
    if (table.indexes) {
      const indexes = table.indexes.map(index => 
        this.generateCreateIndexSQL(table.name, index)
      )
      sql += '\n\n' + indexes.join('\n')
    }

    return sql
  }

  private generateColumnSQL(column: ColumnDefinition): string {
    let sql = `${column.name} ${column.type}`

    if (column.primaryKey) {
      sql += ' PRIMARY KEY'
    }

    if (!column.nullable && !column.primaryKey) {
      sql += ' NOT NULL'
    }

    if (column.unique) {
      sql += ' UNIQUE'
    }

    if (column.default !== undefined) {
      sql += ` DEFAULT ${column.default}`
    }

    if (column.references) {
      sql += ` REFERENCES ${column.references.table}(${column.references.column})`
      if (column.references.onDelete) {
        sql += ` ON DELETE ${column.references.onDelete}`
      }
      if (column.references.onUpdate) {
        sql += ` ON UPDATE ${column.references.onUpdate}`
      }
    }

    return sql
  }

  private generateConstraintSQL(constraint: ConstraintDefinition): string {
    switch (constraint.type) {
      case 'PRIMARY KEY':
        return `PRIMARY KEY (${constraint.columns.join(', ')})`
      
      case 'FOREIGN KEY':
        if (!constraint.references) {
          throw new Error('Foreign key constraint requires references')
        }
        return `FOREIGN KEY (${constraint.columns.join(', ')}) REFERENCES ${constraint.references.table}(${constraint.references.columns.join(', ')})`
      
      case 'UNIQUE':
        return `UNIQUE (${constraint.columns.join(', ')})`
      
      case 'CHECK':
        if (!constraint.checkCondition) {
          throw new Error('Check constraint requires check condition')
        }
        return `CHECK (${constraint.checkCondition})`
      
      default:
        throw new Error(`Unknown constraint type: ${constraint.type}`)
    }
  }

  private generateCreateIndexSQL(tableName: string, index: IndexDefinition): string {
    let sql = `CREATE`

    if (index.unique) {
      sql += ` UNIQUE`
    }

    sql += ` INDEX ${index.name} ON ${tableName}`

    if (index.type && index.type !== 'BTREE') {
      sql += ` USING ${index.type}`
    }

    sql += ` (${index.columns.join(', ')})`

    if (index.where) {
      sql += ` WHERE ${index.where}`
    }

    sql += ';'

    return sql
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL'
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE'
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`
    }
    return String(value)
  }

  async saveTemplate(template: MigrationTemplate, filename?: string): Promise<string> {
    await this.ensureDirectories()

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const fileName = filename || `${timestamp}_${template.name}.sql`
    const filePath = join(this.templatesPath, fileName)

    const content = `-- Migration Template: ${template.name}
-- Description: ${template.description}
-- Generated: ${new Date().toISOString()}

-- UP
${template.upSql}

-- DOWN
${template.downSql}
`

    await writeFile(filePath, content, 'utf-8')
    console.log(`✅ Migration template saved: ${filePath}`)

    return filePath
  }
}