import { beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals'
import { cleanupAllTestData } from '../utils/testing/auth-test-utils'

// Global test setup for authentication testing
beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test'
  process.env.MCP_ENVIRONMENT = 'disabled'
  process.env.MCP_SECURITY_LEVEL = 'disabled'
  
  // Initialize any global test resources
  console.log('🧪 Starting authentication test suite...')
})

afterAll(async () => {
  // Clean up all test data
  await cleanupAllTestData()
  
  console.log('✅ Authentication test suite completed')
})

beforeEach(() => {
  // Reset any mocks before each test
  jest.clearAllMocks()
})

afterEach(async () => {
  // Clean up after each test if needed
  // Individual tests handle their own cleanup
})

// Mock implementations for testing
jest.mock('../config/database', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        in: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      delete: jest.fn(() => ({
        in: jest.fn(),
        like: jest.fn(),
        or: jest.fn()
      }))
    }))
  },
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        getUserById: jest.fn()
      }
    }
  }
}))

// Mock JWT for testing
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ id: 'test-user-id' }))
}))

// Mock bcrypt for testing if needed
// jest.mock('bcrypt', () => ({
//   hash: jest.fn(() => Promise.resolve('hashed-password')),
//   compare: jest.fn(() => Promise.resolve(true))
// }))

// Increase timeout for integration tests
jest.setTimeout(30000)

// Global test utilities
global.testUtils = {
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
  }),
  
  createMockRes: () => {
    const res = {} as any
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    res.cookie = jest.fn().mockReturnValue(res)
    res.clearCookie = jest.fn().mockReturnValue(res)
    return res
  },
  
  createMockNext: () => jest.fn()
}

// Declare global test utilities type
declare global {
  var testUtils: {
    createMockReq: (overrides?: any) => any
    createMockRes: () => any
    createMockNext: () => jest.MockedFunction<any>
  }
}