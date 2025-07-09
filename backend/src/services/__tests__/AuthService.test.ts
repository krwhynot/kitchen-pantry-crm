import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AuthService } from '../AuthService'

// Mock external dependencies
jest.mock('../../config/database', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      refreshSession: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn()
        })),
        gt: jest.fn(() => ({
          order: jest.fn()
        }))
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
      }))
    }))
  },
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        getUserById: jest.fn(),
        updateUserById: jest.fn()
      }
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

jest.mock('../../validation/schemas', () => ({
  userSchemas: {
    registration: {
      parse: jest.fn()
    },
    login: {
      parse: jest.fn()
    }
  }
}))

jest.mock('../../validation/sanitization', () => ({
  DataSanitizer: {
    sanitizeInput: jest.fn((input) => input),
    sanitizeEmail: jest.fn((email) => email.toLowerCase())
  }
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}))

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn()
  }
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('AuthService', () => {
  let authService: AuthService
  let mockBcrypt: any
  let mockSpeakeasy: any
  let mockQRCode: any
  let mockFetch: any

  beforeEach(() => {
    authService = new AuthService()
    mockBcrypt = jest.mocked(require('bcrypt'))
    mockSpeakeasy = jest.mocked(require('speakeasy'))
    mockQRCode = jest.mocked(require('qrcode'))
    mockFetch = jest.mocked(global.fetch)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', async () => {
      const result = await AuthService.validatePasswordStrength('StrongPass123!')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password that is too short', async () => {
      const result = await AuthService.validatePasswordStrength('Pass1!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject password without uppercase', async () => {
      const result = await AuthService.validatePasswordStrength('weakpass123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password without lowercase', async () => {
      const result = await AuthService.validatePasswordStrength('WEAKPASS123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject password without numbers', async () => {
      const result = await AuthService.validatePasswordStrength('WeakPassword!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should reject password without special characters', async () => {
      const result = await AuthService.validatePasswordStrength('WeakPassword123')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('should reject common passwords', async () => {
      const result = await AuthService.validatePasswordStrength('Password123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password contains common words and is not secure')
    })

    it('should reject password containing user information', async () => {
      const userInfo = {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }

      const result = await AuthService.validatePasswordStrength('JohnPassword123!', userInfo)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password cannot contain personal information')
    })

    it('should accept password with custom policy', async () => {
      const customPolicy = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false,
        preventCommonPasswords: false,
        preventUserInfoInPassword: false
      }

      const result = await AuthService.validatePasswordStrength('simplepass', undefined, customPolicy)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle multiple validation errors', async () => {
      const result = await AuthService.validatePasswordStrength('weak')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('Password must be at least 8 characters long')
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
      expect(result.errors).toContain('Password must contain at least one number')
      expect(result.errors).toContain('Password must contain at least one special character')
    })
  })

  describe('checkPasswordBreach', () => {
    it('should return true for breached password', async () => {
      const mockHash = 'ABC123DEF456'
      mockBcrypt.hash.mockResolvedValue(mockHash)
      
      // Mock crypto hash
      const mockCrypto = {
        createHash: jest.fn(() => ({
          update: jest.fn(() => ({
            digest: jest.fn(() => 'ABCDEF123456789')
          }))
        }))
      }
      jest.doMock('crypto', () => mockCrypto)

      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('123456789:100\nOTHERHASH:50')
      })

      const result = await AuthService.checkPasswordBreach('password123')

      expect(result).toBe(true)
    })

    it('should return false for non-breached password', async () => {
      const mockHash = 'ABC123DEF456'
      mockBcrypt.hash.mockResolvedValue(mockHash)
      
      // Mock crypto hash
      const mockCrypto = {
        createHash: jest.fn(() => ({
          update: jest.fn(() => ({
            digest: jest.fn(() => 'ABCDEF123456789')
          }))
        }))
      }
      jest.doMock('crypto', () => mockCrypto)

      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('OTHERHASH:100\nANOTHERHASH:50')
      })

      const result = await AuthService.checkPasswordBreach('uniquepassword123')

      expect(result).toBe(false)
    })

    it('should return false when API call fails', async () => {
      const mockHash = 'ABC123DEF456'
      mockBcrypt.hash.mockResolvedValue(mockHash)
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      })

      const result = await AuthService.checkPasswordBreach('password123')

      expect(result).toBe(false)
    })

    it('should return false when fetch throws error', async () => {
      const mockHash = 'ABC123DEF456'
      mockBcrypt.hash.mockResolvedValue(mockHash)
      
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.checkPasswordBreach('password123')

      expect(result).toBe(false)
    })
  })

  describe('registerUser', () => {
    const mockRegistrationData = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'sales_rep' as const,
      organizationId: 'org123',
      phone: '+1234567890'
    }

    it('should register user successfully', async () => {
      // Mock password validation
      jest.spyOn(AuthService, 'validatePasswordStrength').mockResolvedValue({
        isValid: true,
        errors: []
      })

      // Mock password breach check
      jest.spyOn(AuthService, 'checkPasswordBreach').mockResolvedValue(false)

      // Mock supabase calls
      const mockSupabase = require('../../config/database').supabase
      const mockSupabaseAdmin = require('../../config/database').supabaseAdmin
      
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' }
        },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'org123', isActive: true },
              error: null
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { 
                id: 'user123', 
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'sales_rep',
                organizationId: 'org123',
                emailVerified: false
              },
              error: null
            })
          })
        })
      })

      mockSupabase.auth.resend.mockResolvedValue({
        error: null
      })

      const result = await authService.registerUser(mockRegistrationData)

      expect(result).toEqual(expect.objectContaining({
        user: expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'sales_rep',
          organizationId: 'org123',
          emailVerified: false
        }),
        session: null,
        emailVerificationRequired: true
      }))
    })

    it('should throw error for weak password', async () => {
      jest.spyOn(AuthService, 'validatePasswordStrength').mockResolvedValue({
        isValid: false,
        errors: ['Password is too weak']
      })

      await expect(authService.registerUser({
        ...mockRegistrationData,
        password: 'weak'
      })).rejects.toThrow('Password validation failed')
    })

    it('should throw error for breached password', async () => {
      jest.spyOn(AuthService, 'validatePasswordStrength').mockResolvedValue({
        isValid: true,
        errors: []
      })

      jest.spyOn(AuthService, 'checkPasswordBreach').mockResolvedValue(true)

      await expect(authService.registerUser(mockRegistrationData)).rejects.toThrow('Password has been found in data breaches')
    })

    it('should handle registration errors', async () => {
      jest.spyOn(AuthService, 'validatePasswordStrength').mockResolvedValue({
        isValid: true,
        errors: []
      })

      jest.spyOn(AuthService, 'checkPasswordBreach').mockResolvedValue(false)

      const mockSupabase = require('../../config/database').supabase
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      })

      await expect(authService.registerUser(mockRegistrationData)).rejects.toThrow('Email already registered')
    })
  })

  describe('loginUser', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0'
    }

    it('should login user successfully', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      // Mock successful login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' },
          session: { access_token: 'token123' }
        },
        error: null
      })

      // Mock user profile fetch
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'profile123', role: 'sales_rep', isActive: true, failedLoginAttempts: 0 },
              error: null
            })
          })
        })
      })

      const result = await authService.loginUser(mockLoginData)

      expect(result).toEqual(expect.objectContaining({
        user: expect.objectContaining({
          id: 'user123',
          email: 'test@example.com'
        }),
        session: expect.objectContaining({
          access_token: 'token123'
        })
      }))
    })

    it('should throw error for invalid credentials', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      await expect(authService.loginUser(mockLoginData)).rejects.toThrow('Invalid credentials')
    })

    it('should handle account lockout', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' },
          session: { access_token: 'token123' }
        },
        error: null
      })

      // Mock locked account
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { 
                id: 'profile123', 
                role: 'sales_rep', 
                isActive: true, 
                failedLoginAttempts: 5,
                lastFailedLogin: new Date().toISOString()
              },
              error: null
            })
          })
        })
      })

      await expect(authService.loginUser(mockLoginData)).rejects.toThrow('Account is temporarily locked')
    })

    it('should handle inactive user', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' },
          session: { access_token: 'token123' }
        },
        error: null
      })

      // Mock inactive user
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { 
                id: 'profile123', 
                role: 'sales_rep', 
                isActive: false,
                failedLoginAttempts: 0
              },
              error: null
            })
          })
        })
      })

      await expect(authService.loginUser(mockLoginData)).rejects.toThrow('User account is inactive')
    })
  })

  describe('logoutUser', () => {
    it('should logout user successfully', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      await authService.logoutUser('session123')

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle logout errors', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      })

      await expect(authService.logoutUser('session123')).rejects.toThrow('Logout failed')
    })
  })

  describe('resetPassword', () => {
    it('should send reset password email', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      })

      await authService.resetPassword('test@example.com')

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('should handle reset password errors', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Email not found' }
      })

      await expect(authService.resetPassword('test@example.com')).rejects.toThrow('Email not found')
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock password validation
      jest.spyOn(AuthService, 'validatePasswordStrength').mockResolvedValue({
        isValid: true,
        errors: []
      })

      jest.spyOn(AuthService, 'checkPasswordBreach').mockResolvedValue(false)

      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      })

      await authService.changePassword('user123', 'NewPassword123!')

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewPassword123!'
      })
    })

    it('should reject weak new password', async () => {
      jest.spyOn(AuthService, 'validatePasswordStrength').mockResolvedValue({
        isValid: false,
        errors: ['Password is too weak']
      })

      await expect(authService.changePassword('user123', 'weak')).rejects.toThrow('New password validation failed')
    })

    it('should reject breached password', async () => {
      jest.spyOn(AuthService, 'validatePasswordStrength').mockResolvedValue({
        isValid: true,
        errors: []
      })

      jest.spyOn(AuthService, 'checkPasswordBreach').mockResolvedValue(true)

      await expect(authService.changePassword('user123', 'BreachedPassword123!')).rejects.toThrow('New password has been found in data breaches')
    })
  })

  describe('generateMFASecret', () => {
    it('should generate MFA secret successfully', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/test@example.com?secret=JBSWY3DPEHPK3PXP'
      }

      mockSpeakeasy.generateSecret.mockReturnValue(mockSecret)
      mockQRCode.toDataURL.mockResolvedValue('data:image/png;base64,iVBORw0KGgo...')

      const result = await authService.generateMFASecret('user123', 'test@example.com')

      expect(result).toEqual(expect.objectContaining({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,iVBORw0KGgo...'
      }))
    })

    it('should handle QR code generation errors', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/test@example.com?secret=JBSWY3DPEHPK3PXP'
      }

      mockSpeakeasy.generateSecret.mockReturnValue(mockSecret)
      mockQRCode.toDataURL.mockRejectedValue(new Error('QR generation failed'))

      await expect(authService.generateMFASecret('user123', 'test@example.com')).rejects.toThrow('QR generation failed')
    })
  })

  describe('verifyMFAToken', () => {
    it('should verify MFA token successfully', async () => {
      mockSpeakeasy.totp.verify.mockReturnValue(true)

      const result = await authService.verifyMFAToken('123456', 'JBSWY3DPEHPK3PXP')

      expect(result).toBe(true)
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        token: '123456',
        window: 1
      })
    })

    it('should reject invalid MFA token', async () => {
      mockSpeakeasy.totp.verify.mockReturnValue(false)

      const result = await authService.verifyMFAToken('invalid', 'JBSWY3DPEHPK3PXP')

      expect(result).toBe(false)
    })
  })

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: {
          session: { access_token: 'new_token123' },
          user: { id: 'user123' }
        },
        error: null
      })

      const result = await authService.refreshSession('refresh_token123')

      expect(result).toEqual(expect.objectContaining({
        session: expect.objectContaining({
          access_token: 'new_token123'
        }),
        user: expect.objectContaining({
          id: 'user123'
        })
      }))
    })

    it('should handle refresh errors', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid refresh token' }
      })

      await expect(authService.refreshSession('invalid_token')).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user123', email: 'test@example.com' }
        },
        error: null
      })

      const result = await authService.getCurrentUser('token123')

      expect(result).toEqual(expect.objectContaining({
        id: 'user123',
        email: 'test@example.com'
      }))
    })

    it('should handle invalid token', async () => {
      const mockSupabase = require('../../config/database').supabase
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      await expect(authService.getCurrentUser('invalid_token')).rejects.toThrow('Invalid token')
    })
  })

  describe('enableMFA', () => {
    it('should enable MFA successfully', async () => {
      jest.spyOn(authService, 'verifyMFAToken').mockResolvedValue(true)
      
      const mockSupabase = require('../../config/database').supabase
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })

      await authService.enableMFA('user123', '123456')

      expect(authService.verifyMFAToken).toHaveBeenCalledWith('user123', '123456')
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ mfaEnabled: true })
    })

    it('should throw error for invalid token', async () => {
      jest.spyOn(authService, 'verifyMFAToken').mockResolvedValue(false)

      await expect(authService.enableMFA('user123', 'invalid')).rejects.toThrow('Invalid MFA token')
    })
  })

  describe('disableMFA', () => {
    it('should disable MFA successfully', async () => {
      jest.spyOn(authService, 'verifyMFAToken').mockResolvedValue(true)
      
      const mockSupabase = require('../../config/database').supabase
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })

      await authService.disableMFA('user123', '123456')

      expect(authService.verifyMFAToken).toHaveBeenCalledWith('user123', '123456')
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ 
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null
      })
    })

    it('should throw error for invalid token', async () => {
      jest.spyOn(authService, 'verifyMFAToken').mockResolvedValue(false)

      await expect(authService.disableMFA('user123', 'invalid')).rejects.toThrow('Invalid MFA token')
    })
  })

  describe('recordLoginAttempt', () => {
    it('should record login attempt successfully', async () => {
      const mockSupabase = require('../../config/database').supabase
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          error: null
        })
      })

      const attemptData = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: true,
        timestamp: new Date(),
        failureReason: undefined
      }

      await authService.recordLoginAttempt(attemptData)

      expect(mockSupabase.from).toHaveBeenCalledWith('login_attempts')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        email: attemptData.email,
        ipAddress: attemptData.ipAddress,
        userAgent: attemptData.userAgent,
        success: attemptData.success,
        timestamp: attemptData.timestamp.toISOString(),
        failureReason: attemptData.failureReason
      })
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const mockSupabase = require('../../config/database').supabase
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Database error'))
      })

      const attemptData = {
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: false,
        timestamp: new Date(),
        failureReason: 'Invalid credentials'
      }

      await authService.recordLoginAttempt(attemptData)

      expect(consoleSpy).toHaveBeenCalledWith('Failed to record login attempt:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('checkAccountLockout', () => {
    it('should return not locked for no failed attempts', async () => {
      const mockSupabase = require('../../config/database').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      })

      const result = await authService.checkAccountLockout('test@example.com', '127.0.0.1')

      expect(result).toEqual({
        isLocked: false,
        remainingAttempts: 5
      })
    })

    it('should return locked for max failed attempts', async () => {
      const mockSupabase = require('../../config/database').supabase
      const failedAttempts = Array(5).fill(null).map((_, i) => ({
        timestamp: new Date(Date.now() - (i * 60000)).toISOString()
      }))
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: failedAttempts,
                  error: null
                })
              })
            })
          })
        })
      })

      const result = await authService.checkAccountLockout('test@example.com', '127.0.0.1')

      expect(result).toEqual({
        isLocked: true,
        remainingAttempts: 0,
        lockoutExpiresAt: expect.any(Date)
      })
    })

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const mockSupabase = require('../../config/database').supabase
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Database error')
                })
              })
            })
          })
        })
      })

      const result = await authService.checkAccountLockout('test@example.com', '127.0.0.1')

      expect(result).toEqual({
        isLocked: false,
        remainingAttempts: 5
      })
      expect(consoleSpy).toHaveBeenCalledWith('Failed to check login attempts:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle network errors in password breach check', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await authService.checkPasswordBreach('testpassword')

      expect(result).toBe(false)
    })

    it('should handle malformed breach API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('invalid:response:format')
      })

      const result = await authService.checkPasswordBreach('testpassword')

      expect(result).toBe(false)
    })

    it('should handle empty password validation', async () => {
      const result = await authService.validatePasswordStrength('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should handle null user info in password validation', async () => {
      const result = await authService.validatePasswordStrength('ValidPass123!', null)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle undefined fields in user info', async () => {
      const result = await authService.validatePasswordStrength('ValidPass123!', {
        email: undefined,
        firstName: undefined,
        lastName: undefined
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle crypto hash errors in breach check', async () => {
      const mockCrypto = {
        createHash: jest.fn(() => {
          throw new Error('Crypto error')
        })
      }
      jest.doMock('crypto', () => mockCrypto)

      const result = await authService.checkPasswordBreach('testpassword')

      expect(result).toBe(false)
    })
  })

  describe('static method validation', () => {
    it('should validate static method calls', async () => {
      const staticResult = await AuthService.validatePasswordStrength('TestPassword123!')

      expect(staticResult.isValid).toBe(true)
      expect(staticResult.errors).toHaveLength(0)
    })

    it('should validate static breach check', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('OTHERHASH:100')
      })

      const staticResult = await AuthService.checkPasswordBreach('uniquepassword')

      expect(staticResult).toBe(false)
    })
  })
})