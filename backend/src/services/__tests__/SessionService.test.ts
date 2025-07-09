import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { SessionService } from '../SessionService'
import { supabase } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import crypto from 'crypto'

// Mock the dependencies
jest.mock('../../config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
          gte: jest.fn(() => ({
            order: jest.fn()
          })),
          lte: jest.fn(() => ({
            order: jest.fn()
          })),
          limit: jest.fn()
        })),
        gte: jest.fn(() => ({
          order: jest.fn()
        })),
        lte: jest.fn(() => ({
          order: jest.fn()
        })),
        order: jest.fn(),
        limit: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
        or: jest.fn(() => ({
          eq: jest.fn()
        })),
        lte: jest.fn()
      }))
    })),
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn()
    }
  }
}))

jest.mock('../../middleware/errorHandler', () => ({
  AppError: jest.fn().mockImplementation((message: string, statusCode: number) => {
    const error = new Error(message) as any
    error.statusCode = statusCode
    return error
  })
}))

jest.mock('crypto', () => ({
  randomBytes: jest.fn()
}))

describe('SessionService', () => {
  let sessionService: SessionService
  let mockSupabase: any
  let mockCrypto: any

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    isActive: true,
    organizationId: 'org-1'
  }

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    isActive: true,
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    refreshExpiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString()
  }

  const mockSessionConfig = {
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
    maxConcurrentSessions: 5,
    enableSessionRotation: true,
    requireIpValidation: false,
    enableActivityTracking: true
  }

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
      limit: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      or: jest.fn(),
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
        refreshSession: jest.fn()
      }
    }

    mockCrypto = {
      randomBytes: jest.fn()
    }

    // Set up the chain of mocked methods
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.gte.mockReturnValue(mockSupabase)
    mockSupabase.lte.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.limit.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.delete.mockReturnValue(mockSupabase)
    mockSupabase.or.mockReturnValue(mockSupabase)

    // Mock the actual supabase object
    jest.mocked(supabase).from.mockReturnValue(mockSupabase)
    jest.mocked(supabase).auth = mockSupabase.auth

    // Mock crypto
    jest.mocked(crypto).randomBytes.mockReturnValue(Buffer.from('mock-random-bytes'))

    sessionService = new SessionService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createSession', () => {
    it('should create session successfully', async () => {
      // Mock user validation
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUser,
        error: null
      })

      // Mock active sessions check
      mockSupabase.order.mockResolvedValueOnce({
        data: [], // No active sessions
        error: null
      })

      // Mock session creation
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      })

      // Mock activity logging
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'activity-1' },
        error: null
      })

      const result = await sessionService.createSession(
        'user-1',
        '127.0.0.1',
        'Mozilla/5.0',
        mockSessionConfig
      )

      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          isActive: true
        })
      )
      expect(result).toEqual(mockSession)
    })

    it('should throw error for invalid user', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      await expect(
        sessionService.createSession('invalid-user', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('User not found')
    })

    it('should throw error for inactive user', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockUser, isActive: false },
        error: null
      })

      await expect(
        sessionService.createSession('user-1', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('User account is inactive')
    })

    it('should enforce concurrent session limits', async () => {
      const activeSessions = Array(5).fill(null).map((_, i) => ({
        id: `session-${i}`,
        userId: 'user-1',
        isActive: true,
        createdAt: new Date(Date.now() - i * 60000).toISOString()
      }))

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUser,
        error: null
      })

      mockSupabase.order.mockResolvedValueOnce({
        data: activeSessions,
        error: null
      })

      // Mock session deletion (oldest session)
      mockSupabase.eq.mockResolvedValueOnce({
        error: null
      })

      // Mock new session creation
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      })

      // Mock activity logging
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'activity-1' },
        error: null
      })

      const result = await sessionService.createSession(
        'user-1',
        '127.0.0.1',
        'Mozilla/5.0',
        mockSessionConfig
      )

      expect(mockSupabase.delete).toHaveBeenCalledWith()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'session-4') // Oldest session
      expect(result).toEqual(mockSession)
    })

    it('should handle session creation errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUser,
        error: null
      })

      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Session creation failed')
      })

      await expect(
        sessionService.createSession('user-1', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('Session creation failed')
    })
  })

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const validSession = {
        ...mockSession,
        refreshExpiresAt: new Date(Date.now() + 86400000).toISOString() // 1 day from now
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      // Mock session update
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...validSession, accessToken: 'new-access-token' },
        error: null
      })

      // Mock activity logging
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'activity-1' },
        error: null
      })

      const result = await sessionService.refreshSession(
        'refresh-token-456',
        '127.0.0.1',
        'Mozilla/5.0',
        mockSessionConfig
      )

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lastActivityAt: expect.any(String)
        })
      )
      expect(result).toEqual(expect.objectContaining({
        accessToken: 'new-access-token'
      }))
    })

    it('should throw error for invalid refresh token', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      await expect(
        sessionService.refreshSession('invalid-token', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error for expired refresh token', async () => {
      const expiredSession = {
        ...mockSession,
        refreshExpiresAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: expiredSession,
        error: null
      })

      await expect(
        sessionService.refreshSession('refresh-token-456', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('Refresh token expired')
    })

    it('should throw error for inactive session', async () => {
      const inactiveSession = {
        ...mockSession,
        isActive: false
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: inactiveSession,
        error: null
      })

      await expect(
        sessionService.refreshSession('refresh-token-456', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('Session is not active')
    })

    it('should validate IP address when required', async () => {
      const validSession = {
        ...mockSession,
        ipAddress: '192.168.1.1' // Different IP
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      await expect(
        sessionService.refreshSession(
          'refresh-token-456',
          '127.0.0.1',
          'Mozilla/5.0',
          { ...mockSessionConfig, requireIpValidation: true }
        )
      ).rejects.toThrow('IP address mismatch')
    })

    it('should rotate tokens when enabled', async () => {
      const validSession = {
        ...mockSession,
        refreshExpiresAt: new Date(Date.now() + 86400000).toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { ...validSession, refreshToken: 'new-refresh-token' },
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'activity-1' },
        error: null
      })

      const result = await sessionService.refreshSession(
        'refresh-token-456',
        '127.0.0.1',
        'Mozilla/5.0',
        { ...mockSessionConfig, enableSessionRotation: true }
      )

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshToken: expect.any(String)
        })
      )
      expect(result.refreshToken).not.toBe('refresh-token-456')
    })
  })

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      const validSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      // Mock activity update
      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      const result = await sessionService.validateSession(
        'access-token-123',
        '127.0.0.1',
        mockSessionConfig
      )

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.eq).toHaveBeenCalledWith('accessToken', 'access-token-123')
      expect(result).toEqual(validSession)
    })

    it('should return null for invalid access token', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await sessionService.validateSession('invalid-token')

      expect(result).toBeNull()
    })

    it('should return null for expired access token', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: expiredSession,
        error: null
      })

      const result = await sessionService.validateSession('access-token-123')

      expect(result).toBeNull()
    })

    it('should return null for inactive session', async () => {
      const inactiveSession = {
        ...mockSession,
        isActive: false
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: inactiveSession,
        error: null
      })

      const result = await sessionService.validateSession('access-token-123')

      expect(result).toBeNull()
    })

    it('should validate IP address when required', async () => {
      const validSession = {
        ...mockSession,
        ipAddress: '192.168.1.1' // Different IP
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      const result = await sessionService.validateSession(
        'access-token-123',
        '127.0.0.1',
        { ...mockSessionConfig, requireIpValidation: true }
      )

      expect(result).toBeNull()
    })

    it('should update last activity when enabled', async () => {
      const validSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null
      })

      await sessionService.validateSession(
        'access-token-123',
        '127.0.0.1',
        { ...mockSessionConfig, enableActivityTracking: true }
      )

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lastActivityAt: expect.any(String)
        })
      )
    })
  })

  describe('invalidateSession', () => {
    it('should invalidate session successfully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockSession, isActive: false },
        error: null
      })

      // Mock activity logging
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'activity-1' },
        error: null
      })

      await sessionService.invalidateSession('session-1')

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        isActive: false,
        invalidatedAt: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'session-1')
    })

    it('should handle invalidation errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Session invalidation failed')
      })

      await expect(sessionService.invalidateSession('session-1')).rejects.toThrow('Session invalidation failed')
    })
  })

  describe('invalidateAllUserSessions', () => {
    it('should invalidate all user sessions successfully', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        error: null
      })

      // Mock activity logging
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'activity-1' },
        error: null
      })

      await sessionService.invalidateAllUserSessions('user-1')

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        isActive: false,
        invalidatedAt: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('userId', 'user-1')
    })

    it('should handle bulk invalidation errors', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        error: new Error('Bulk invalidation failed')
      })

      await expect(sessionService.invalidateAllUserSessions('user-1')).rejects.toThrow('Bulk invalidation failed')
    })
  })

  describe('getActiveSessions', () => {
    it('should return active sessions for user', async () => {
      const activeSessions = [
        mockSession,
        { ...mockSession, id: 'session-2', ipAddress: '192.168.1.1' }
      ]

      mockSupabase.order.mockResolvedValueOnce({
        data: activeSessions,
        error: null
      })

      const result = await sessionService.getActiveSessions('user-1')

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('userId', 'user-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('isActive', true)
      expect(result).toEqual(activeSessions)
    })

    it('should handle active sessions fetch errors', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: new Error('Active sessions fetch failed')
      })

      await expect(sessionService.getActiveSessions('user-1')).rejects.toThrow('Active sessions fetch failed')
    })

    it('should return empty array for user with no active sessions', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const result = await sessionService.getActiveSessions('user-1')

      expect(result).toEqual([])
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions for specific user', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        error: null
      })

      await sessionService.cleanupExpiredSessions('user-1')

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.delete).toHaveBeenCalledWith()
      expect(mockSupabase.eq).toHaveBeenCalledWith('userId', 'user-1')
      expect(mockSupabase.or).toHaveBeenCalledWith(
        `expiresAt.lt.${expect.any(String)},refreshExpiresAt.lt.${expect.any(String)}`
      )
    })

    it('should clean up expired sessions for all users', async () => {
      mockSupabase.lte.mockResolvedValueOnce({
        error: null
      })

      await sessionService.cleanupExpiredSessions()

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.delete).toHaveBeenCalledWith()
      expect(mockSupabase.or).toHaveBeenCalledWith(
        `expiresAt.lt.${expect.any(String)},refreshExpiresAt.lt.${expect.any(String)}`
      )
    })

    it('should handle cleanup errors', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        error: new Error('Cleanup failed')
      })

      await expect(sessionService.cleanupExpiredSessions('user-1')).rejects.toThrow('Cleanup failed')
    })
  })

  describe('getSessionAnalytics', () => {
    it('should return session analytics for specific user', async () => {
      const mockSessions = [
        {
          ...mockSession,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          lastActivityAt: new Date(Date.now() - 1800000).toISOString()
        },
        {
          ...mockSession,
          id: 'session-2',
          isActive: false,
          ipAddress: '192.168.1.1'
        }
      ]

      mockSupabase.order.mockResolvedValueOnce({
        data: mockSessions,
        error: null
      })

      const result = await sessionService.getSessionAnalytics('user-1')

      expect(supabase.from).toHaveBeenCalledWith('user_sessions')
      expect(mockSupabase.eq).toHaveBeenCalledWith('userId', 'user-1')
      expect(result).toEqual(expect.objectContaining({
        totalSessions: 2,
        activeSessions: 1,
        expiredSessions: 1,
        uniqueIpAddresses: 2,
        uniqueDevices: 1,
        averageSessionDuration: expect.any(Number),
        lastActivity: expect.any(String)
      }))
    })

    it('should return analytics for all users', async () => {
      const mockSessions = [
        mockSession,
        { ...mockSession, id: 'session-2', userId: 'user-2' }
      ]

      mockSupabase.order.mockResolvedValueOnce({
        data: mockSessions,
        error: null
      })

      const result = await sessionService.getSessionAnalytics()

      expect(result).toEqual(expect.objectContaining({
        totalSessions: 2,
        activeSessions: 2,
        expiredSessions: 0,
        uniqueIpAddresses: 1,
        uniqueDevices: 1
      }))
    })

    it('should handle analytics fetch errors', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: new Error('Analytics fetch failed')
      })

      await expect(sessionService.getSessionAnalytics('user-1')).rejects.toThrow('Analytics fetch failed')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null/undefined parameters', async () => {
      await expect(sessionService.createSession(null as any, '127.0.0.1', 'Mozilla/5.0')).rejects.toThrow()
      await expect(sessionService.validateSession(null as any)).resolves.toBeNull()
      await expect(sessionService.refreshSession(null as any, '127.0.0.1', 'Mozilla/5.0')).rejects.toThrow()
    })

    it('should handle database connection errors', async () => {
      mockSupabase.single.mockRejectedValueOnce(new Error('Database connection failed'))

      await expect(
        sessionService.createSession('user-1', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle crypto errors', async () => {
      jest.mocked(crypto).randomBytes.mockImplementation(() => {
        throw new Error('Crypto error')
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUser,
        error: null
      })

      await expect(
        sessionService.createSession('user-1', '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('Crypto error')
    })

    it('should handle malformed session data', async () => {
      const malformedSession = {
        ...mockSession,
        expiresAt: 'invalid-date'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: malformedSession,
        error: null
      })

      const result = await sessionService.validateSession('access-token-123')

      expect(result).toBeNull()
    })

    it('should handle activity logging failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUser,
        error: null
      })

      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSession,
        error: null
      })

      // Mock activity logging failure
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Activity logging failed')
      })

      const result = await sessionService.createSession('user-1', '127.0.0.1', 'Mozilla/5.0')

      expect(result).toEqual(mockSession)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log session activity:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})