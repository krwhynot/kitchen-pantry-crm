import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { supabase, supabaseAdmin } from '../../config/database'
import { AuthenticatedRequest } from '../../middleware/auth'
import { env } from '../../config/env'

export interface TestUser {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'sales_rep'
  organizationId: string
  accessToken?: string
  refreshToken?: string
}

export interface TestOrganization {
  id: string
  name: string
  type: string
  industry: string
}

/**
 * Creates a test organization for authentication testing
 */
export const createTestOrganization = async (
  override: Partial<TestOrganization> = {}
): Promise<TestOrganization> => {
  const defaultOrg: TestOrganization = {
    id: `test-org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Organization',
    type: 'restaurant',
    industry: 'food_service',
    ...override
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      id: defaultOrg.id,
      name: defaultOrg.name,
      type: defaultOrg.type,
      industry: defaultOrg.industry,
      phone: '555-0123',
      email: 'test@testorg.com',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      country: 'USA',
      website: 'https://testorg.com',
      description: 'Test organization for authentication testing'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test organization: ${error.message}`)
  }

  return defaultOrg
}

/**
 * Creates a test user with authentication tokens
 */
export const createTestUser = async (
  override: Partial<TestUser> = {}
): Promise<TestUser> => {
  // Create organization first if not provided
  let organizationId = override.organizationId
  if (!organizationId) {
    const org = await createTestOrganization()
    organizationId = org.id
  }

  const defaultUser: TestUser = {
    id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test.user.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'sales_rep',
    organizationId,
    ...override
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: defaultUser.email,
    password: defaultUser.password,
    email_confirm: true,
    user_metadata: {
      first_name: defaultUser.firstName,
      last_name: defaultUser.lastName,
      role: defaultUser.role,
      organization_id: defaultUser.organizationId
    }
  })

  if (authError) {
    throw new Error(`Failed to create test user in auth: ${authError.message}`)
  }

  defaultUser.id = authData.user.id

  // Create user record in database
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: defaultUser.id,
      email: defaultUser.email,
      first_name: defaultUser.firstName,
      last_name: defaultUser.lastName,
      role: defaultUser.role,
      organization_id: defaultUser.organizationId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (userError) {
    // Cleanup auth user if database insert fails
    await supabaseAdmin.auth.admin.deleteUser(defaultUser.id)
    throw new Error(`Failed to create test user in database: ${userError.message}`)
  }

  // Generate session tokens
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: defaultUser.email,
    password: defaultUser.password
  })

  if (sessionError) {
    throw new Error(`Failed to create session for test user: ${sessionError.message}`)
  }

  defaultUser.accessToken = sessionData.session?.access_token
  defaultUser.refreshToken = sessionData.session?.refresh_token

  return defaultUser
}

/**
 * Creates multiple test users with different roles
 */
export const createTestUsers = async (
  organizationId?: string
): Promise<{
  admin: TestUser
  manager: TestUser
  salesRep: TestUser
  organization: TestOrganization
}> => {
  const organization = organizationId 
    ? { id: organizationId } as TestOrganization
    : await createTestOrganization()

  const [admin, manager, salesRep] = await Promise.all([
    createTestUser({
      role: 'admin',
      organizationId: organization.id,
      email: `admin.${Date.now()}@example.com`,
      firstName: 'Admin',
      lastName: 'User'
    }),
    createTestUser({
      role: 'manager',
      organizationId: organization.id,
      email: `manager.${Date.now()}@example.com`,
      firstName: 'Manager',
      lastName: 'User'
    }),
    createTestUser({
      role: 'sales_rep',
      organizationId: organization.id,
      email: `salesrep.${Date.now()}@example.com`,
      firstName: 'Sales',
      lastName: 'Rep'
    })
  ])

  return { admin, manager, salesRep, organization }
}

/**
 * Creates an authenticated request object for testing
 */
export const createAuthenticatedRequest = (
  user: TestUser,
  override: Partial<Request> = {}
): AuthenticatedRequest => {
  const req = {
    headers: {
      authorization: `Bearer ${user.accessToken}`,
      'content-type': 'application/json'
    },
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    },
    body: {},
    params: {},
    query: {},
    ...override
  } as AuthenticatedRequest

  return req
}

/**
 * Creates a mock response object for testing
 */
export const createMockResponse = (): Response => {
  const res = {} as Response
  
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.cookie = jest.fn().mockReturnValue(res)
  res.clearCookie = jest.fn().mockReturnValue(res)
  res.header = jest.fn().mockReturnValue(res)
  res.set = jest.fn().mockReturnValue(res)
  
  return res
}

/**
 * Creates a mock next function for testing middleware
 */
export const createMockNext = (): jest.MockedFunction<any> => {
  return jest.fn()
}

/**
 * Generates a valid JWT token for testing
 */
export const generateTestToken = (payload: object, expiresIn: string = '1h'): string => {
  const secret = env.JWT_SECRET || 'test-secret'
  return jwt.sign(payload, secret, { expiresIn })
}

/**
 * Generates an invalid/expired JWT token for testing
 */
export const generateExpiredToken = (payload: object): string => {
  const secret = env.JWT_SECRET || 'test-secret'
  return jwt.sign(payload, secret, { expiresIn: '-1h' })
}

/**
 * Cleans up test users and organizations
 */
export const cleanupTestUsers = async (users: TestUser[]): Promise<void> => {
  // Delete users from auth
  const authDeletePromises = users.map(user => 
    supabaseAdmin.auth.admin.deleteUser(user.id).catch(() => {
      // Ignore errors for cleanup
    })
  )

  // Delete users from database
  const userIds = users.map(user => user.id)
  const dbDeletePromise = supabase
    .from('users')
    .delete()
    .in('id', userIds)
    .then(() => {})
    .catch(() => {
      // Ignore errors for cleanup
    })

  await Promise.all([...authDeletePromises, dbDeletePromise])
}

/**
 * Cleans up test organizations
 */
export const cleanupTestOrganizations = async (organizations: TestOrganization[]): Promise<void> => {
  const orgIds = organizations.map(org => org.id)
  await supabase
    .from('organizations')
    .delete()
    .in('id', orgIds)
    .then(() => {})
    .catch(() => {
      // Ignore errors for cleanup
    })
}

/**
 * Comprehensive cleanup for all test data
 */
export const cleanupAllTestData = async (): Promise<void> => {
  try {
    // Clean up test users (those with test- prefix or test emails)
    await supabase
      .from('users')
      .delete()
      .or('id.like.test-%,email.like.%@example.com')
      .then(() => {})
      .catch(() => {})

    // Clean up test organizations
    await supabase
      .from('organizations')
      .delete()
      .like('id', 'test-org-%')
      .then(() => {})
      .catch(() => {})

    // Clean up auth users (this is more complex and should be done carefully)
    // In a real scenario, you might want to track test user IDs separately
  } catch (error) {
    console.warn('Warning: Some test data cleanup failed:', error)
  }
}

/**
 * Validates that a user has the expected authentication state
 */
export const validateAuthState = async (
  user: TestUser,
  expectedState: 'active' | 'inactive' | 'deleted' = 'active'
): Promise<boolean> => {
  try {
    // Check auth state
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.id)
    
    if (expectedState === 'deleted') {
      return authError !== null || !authData.user
    }

    if (authError || !authData.user) {
      return false
    }

    // Check database state
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return false
    }

    return expectedState === 'active' ? userData.is_active : !userData.is_active
  } catch (error) {
    return false
  }
}

/**
 * Test helper to verify token validity
 */
export const verifyTestToken = async (token: string): Promise<{ valid: boolean; user?: any }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return { valid: !error && !!user, user }
  } catch (error) {
    return { valid: false }
  }
}

/**
 * Creates test data for authentication flow testing
 */
export const createAuthTestData = async () => {
  const organization = await createTestOrganization({
    name: 'Auth Test Organization',
    type: 'restaurant',
    industry: 'food_service'
  })

  const users = await createTestUsers(organization.id)

  return {
    organization,
    users,
    cleanup: async () => {
      await cleanupTestUsers(Object.values(users))
      await cleanupTestOrganizations([organization])
    }
  }
}

/**
 * Auth test assertions
 */
export const authAssertions = {
  /**
   * Asserts that a response indicates successful authentication
   */
  expectAuthSuccess: (response: any) => {
    expect(response.status).toBe('success')
    expect(response.data).toHaveProperty('user')
    expect(response.data).toHaveProperty('session')
    expect(response.data.user).toHaveProperty('id')
    expect(response.data.user).toHaveProperty('email')
    expect(response.data.user).toHaveProperty('role')
    expect(response.data.session).toHaveProperty('access_token')
  },

  /**
   * Asserts that a response indicates authentication failure
   */
  expectAuthFailure: (response: any, expectedStatus: number = 401) => {
    expect(response.status).toBe(expectedStatus)
    expect(response.data).not.toHaveProperty('session')
  },

  /**
   * Asserts that a user object has expected properties
   */
  expectValidUser: (user: any) => {
    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('email')
    expect(user).toHaveProperty('role')
    expect(user).toHaveProperty('organizationId')
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    expect(['admin', 'manager', 'sales_rep']).toContain(user.role)
  },

  /**
   * Asserts that a token is valid
   */
  expectValidToken: (token: string) => {
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  }
}