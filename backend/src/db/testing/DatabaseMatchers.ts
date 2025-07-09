import { SupabaseClient } from '@supabase/supabase-js'

declare global {
  namespace jest {
    interface Matchers<R> {
      toExistInDatabase(): R
      toHaveCount(expectedCount: number): R
      toMatchDatabaseRecord(expectedRecord: any): R
      toBeValidUUID(): R
      toHaveValidTimestamp(): R
      toBeValidEmail(): R
      toBeValidPhone(): R
      toRespectConstraints(): R
      toHaveRelationship(relatedTable: string, relatedId: string): R
      toBeOrdered(column: string, direction?: 'asc' | 'desc'): R
    }
  }
}

export interface DatabaseMatcherContext {
  client: SupabaseClient
  tableName?: string
}

export class DatabaseMatchers {
  static install(client: SupabaseClient): void {
    expect.extend({
      // Check if a record exists in the database
      async toExistInDatabase(
        this: jest.MatcherContext,
        received: { table: string; id?: string; where?: Record<string, any> }
      ) {
        const { table, id, where } = received
        
        try {
          let query = client.from(table).select('id')
          
          if (id) {
            query = query.eq('id', id)
          } else if (where) {
            Object.entries(where).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          } else {
            return {
              pass: false,
              message: () => 'Must provide either id or where conditions'
            }
          }

          const { data, error } = await query.limit(1)

          if (error) {
            return {
              pass: false,
              message: () => `Database query failed: ${error.message}`
            }
          }

          const exists = data && data.length > 0

          return {
            pass: exists,
            message: () =>
              exists
                ? `Expected record not to exist in ${table}`
                : `Expected record to exist in ${table} with ${id ? `id: ${id}` : `conditions: ${JSON.stringify(where)}`}`
          }
        } catch (error) {
          return {
            pass: false,
            message: () => `Database matcher error: ${error}`
          }
        }
      },

      // Check record count in table
      async toHaveCount(
        this: jest.MatcherContext,
        received: { table: string; where?: Record<string, any> },
        expectedCount: number
      ) {
        const { table, where } = received
        
        try {
          let query = client.from(table).select('*', { count: 'exact', head: true })
          
          if (where) {
            Object.entries(where).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }

          const { count, error } = await query

          if (error) {
            return {
              pass: false,
              message: () => `Database query failed: ${error.message}`
            }
          }

          const actualCount = count || 0
          const pass = actualCount === expectedCount

          return {
            pass,
            message: () =>
              pass
                ? `Expected ${table} not to have ${expectedCount} records`
                : `Expected ${table} to have ${expectedCount} records, but got ${actualCount}`
          }
        } catch (error) {
          return {
            pass: false,
            message: () => `Database matcher error: ${error}`
          }
        }
      },

      // Check if record matches expected values
      async toMatchDatabaseRecord(
        this: jest.MatcherContext,
        received: { table: string; id: string },
        expectedRecord: Record<string, any>
      ) {
        const { table, id } = received
        
        try {
          const { data, error } = await client
            .from(table)
            .select('*')
            .eq('id', id)
            .single()

          if (error) {
            return {
              pass: false,
              message: () => `Database query failed: ${error.message}`
            }
          }

          if (!data) {
            return {
              pass: false,
              message: () => `Record with id ${id} not found in ${table}`
            }
          }

          // Check if all expected fields match
          const mismatches: string[] = []
          
          Object.entries(expectedRecord).forEach(([key, expectedValue]) => {
            const actualValue = data[key]
            
            if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
              mismatches.push(`${key}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`)
            }
          })

          const pass = mismatches.length === 0

          return {
            pass,
            message: () =>
              pass
                ? `Expected record not to match in ${table}`
                : `Record in ${table} doesn't match expected values:\n${mismatches.join('\n')}`
          }
        } catch (error) {
          return {
            pass: false,
            message: () => `Database matcher error: ${error}`
          }
        }
      },

      // Validate UUID format
      toBeValidUUID(this: jest.MatcherContext, received: string) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const pass = uuidRegex.test(received)

        return {
          pass,
          message: () =>
            pass
              ? `Expected ${received} not to be a valid UUID`
              : `Expected ${received} to be a valid UUID`
        }
      },

      // Validate timestamp format
      toHaveValidTimestamp(this: jest.MatcherContext, received: string) {
        const date = new Date(received)
        const pass = !isNaN(date.getTime()) && received.includes('T')

        return {
          pass,
          message: () =>
            pass
              ? `Expected ${received} not to be a valid timestamp`
              : `Expected ${received} to be a valid ISO timestamp`
        }
      },

      // Validate email format
      toBeValidEmail(this: jest.MatcherContext, received: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const pass = emailRegex.test(received)

        return {
          pass,
          message: () =>
            pass
              ? `Expected ${received} not to be a valid email`
              : `Expected ${received} to be a valid email`
        }
      },

      // Validate phone format
      toBeValidPhone(this: jest.MatcherContext, received: string) {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/
        const pass = phoneRegex.test(received) && received.replace(/\D/g, '').length >= 10

        return {
          pass,
          message: () =>
            pass
              ? `Expected ${received} not to be a valid phone number`
              : `Expected ${received} to be a valid phone number`
        }
      },

      // Check database constraints
      async toRespectConstraints(
        this: jest.MatcherContext,
        received: { table: string; data: Record<string, any> }
      ) {
        const { table, data } = received
        
        try {
          // Try to insert the data to see if constraints are violated
          const { error } = await client
            .from(table)
            .insert(data)
            .select()

          // If no error, constraints are respected
          if (!error) {
            // Clean up the test record
            if (data.id) {
              await client.from(table).delete().eq('id', data.id)
            }
            
            return {
              pass: true,
              message: () => `Expected data to violate constraints in ${table}`
            }
          }

          // Check if error is constraint-related
          const isConstraintError = error.message.includes('constraint') ||
                                   error.message.includes('unique') ||
                                   error.message.includes('foreign key') ||
                                   error.message.includes('check')

          return {
            pass: false,
            message: () =>
              isConstraintError
                ? `Data violates constraints in ${table}: ${error.message}`
                : `Unexpected database error in ${table}: ${error.message}`
          }
        } catch (error) {
          return {
            pass: false,
            message: () => `Database matcher error: ${error}`
          }
        }
      },

      // Check if record has relationship
      async toHaveRelationship(
        this: jest.MatcherContext,
        received: { table: string; id: string; foreignKey: string },
        relatedTable: string,
        relatedId: string
      ) {
        const { table, id, foreignKey } = received
        
        try {
          const { data, error } = await client
            .from(table)
            .select(foreignKey)
            .eq('id', id)
            .single()

          if (error) {
            return {
              pass: false,
              message: () => `Database query failed: ${error.message}`
            }
          }

          if (!data) {
            return {
              pass: false,
              message: () => `Record with id ${id} not found in ${table}`
            }
          }

          const actualRelatedId = data[foreignKey]
          const pass = actualRelatedId === relatedId

          return {
            pass,
            message: () =>
              pass
                ? `Expected ${table}.${foreignKey} not to reference ${relatedTable}.${relatedId}`
                : `Expected ${table}.${foreignKey} to reference ${relatedTable}.${relatedId}, but got ${actualRelatedId}`
          }
        } catch (error) {
          return {
            pass: false,
            message: () => `Database matcher error: ${error}`
          }
        }
      },

      // Check if results are ordered
      async toBeOrdered(
        this: jest.MatcherContext,
        received: { table: string; where?: Record<string, any> },
        column: string,
        direction: 'asc' | 'desc' = 'asc'
      ) {
        const { table, where } = received
        
        try {
          let query = client.from(table).select(column)
          
          if (where) {
            Object.entries(where).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }

          const { data, error } = await query

          if (error) {
            return {
              pass: false,
              message: () => `Database query failed: ${error.message}`
            }
          }

          if (!data || data.length < 2) {
            return {
              pass: true,
              message: () => `Not enough records to check ordering`
            }
          }

          const values = data.map(row => row[column])
          const isOrdered = direction === 'asc'
            ? values.every((val, i) => i === 0 || values[i - 1] <= val)
            : values.every((val, i) => i === 0 || values[i - 1] >= val)

          return {
            pass: isOrdered,
            message: () =>
              isOrdered
                ? `Expected ${table}.${column} not to be ordered ${direction}`
                : `Expected ${table}.${column} to be ordered ${direction}`
          }
        } catch (error) {
          return {
            pass: false,
            message: () => `Database matcher error: ${error}`
          }
        }
      }
    })
  }

  // Helper methods for common assertions
  static async assertRecordExists(
    client: SupabaseClient,
    table: string,
    where: Record<string, any>
  ): Promise<boolean> {
    const { data, error } = await client
      .from(table)
      .select('id')
      .match(where)
      .limit(1)

    if (error) {
      throw new Error(`Failed to check record existence: ${error.message}`)
    }

    return !!(data && data.length > 0)
  }

  static async assertRecordCount(
    client: SupabaseClient,
    table: string,
    expectedCount: number,
    where?: Record<string, any>
  ): Promise<boolean> {
    let query = client.from(table).select('*', { count: 'exact', head: true })
    
    if (where) {
      query = query.match(where)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count records: ${error.message}`)
    }

    return count === expectedCount
  }

  static async assertValidReferences(
    client: SupabaseClient,
    table: string,
    record: Record<string, any>,
    references: Record<string, string>
  ): Promise<boolean> {
    for (const [foreignKey, referencedTable] of Object.entries(references)) {
      const foreignKeyValue = record[foreignKey]
      
      if (foreignKeyValue) {
        const exists = await this.assertRecordExists(client, referencedTable, { id: foreignKeyValue })
        if (!exists) {
          throw new Error(`Invalid reference: ${table}.${foreignKey} -> ${referencedTable}.${foreignKeyValue}`)
        }
      }
    }

    return true
  }

  static createTableMatcher(client: SupabaseClient, tableName: string) {
    return {
      exists: (where: Record<string, any>) => ({ table: tableName, where }),
      hasCount: (where?: Record<string, any>) => ({ table: tableName, where }),
      record: (id: string) => ({ table: tableName, id }),
      respectsConstraints: (data: Record<string, any>) => ({ table: tableName, data }),
      isOrdered: (where?: Record<string, any>) => ({ table: tableName, where })
    }
  }
}