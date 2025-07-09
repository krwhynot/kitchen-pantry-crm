import { Request, Response } from 'express'
import { register, login, logout, refreshToken, resetPassword, updatePassword, getProfile } from '../../controllers/authController'
import { AuthTestFactory } from '../../utils/testing/auth-test-factory'
import { 
  createMockResponse, 
  createMockNext, 
  authAssertions,
  cleanupAllTestData
} from '../../utils/testing/auth-test-utils'
import { supabase } from '../../config/database'

describe('Authentication Controller', () => {
  let authFactory: AuthTestFactory
  let mockResponse: Response
  let mockNext: jest.MockedFunction<any>

  beforeEach(() => {
    authFactory = new AuthTestFactory()
    mockResponse = createMockResponse()
    mockNext = createMockNext()
  })

  afterEach(async () => {
    await authFactory.cleanup()
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  describe('Register', () => {
    it('should register a new user successfully', async () => {
      const testData = await authFactory.createRegistrationTestData()
      
      const req = {
        body: testData.validRegistrationData
      } as Request

      // Call the register controller
      await register[1](req, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: testData.validRegistrationData.email,
              firstName: testData.validRegistrationData.firstName,
              lastName: testData.validRegistrationData.lastName,
              role: testData.validRegistrationData.role
            }),
            session: expect.objectContaining({
              access_token: expect.any(String)
            })
          })
        })
      )
    })

    it('should fail registration with invalid email', async () => {
      const testData = await authFactory.createRegistrationTestData()
      const invalidData = testData.invalidRegistrationData.find(d => d._error === 'Invalid email format')!
      
      const req = {
        body: {
          email: invalidData.email,
          password: invalidData.password,
          firstName: invalidData.firstName,
          lastName: invalidData.lastName,
          role: invalidData.role,
          organizationId: invalidData.organizationId
        }
      } as Request

      await register[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('validation')
      }))
    })

    it('should fail registration with non-existent organization', async () => {
      const testData = await authFactory.createRegistrationTestData()
      
      const req = {
        body: {
          ...testData.validRegistrationData,
          organizationId: 'non-existent-id'
        }
      } as Request

      await register[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Organization not found')
      }))
    })

    it('should fail registration with duplicate email', async () => {
      const testData = await authFactory.createRegistrationTestData()
      const scenario = await authFactory.createBasicScenario()
      
      const req = {
        body: {
          ...testData.validRegistrationData,
          email: scenario.user.email // Use existing user's email
        }
      } as Request

      await register[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Registration failed')
      }))
    })
  })

  describe('Login', () => {
    it('should login user successfully with valid credentials', async () => {
      const testData = await authFactory.createAuthFlowTestData()
      
      const req = {
        body: testData.credentials.validLogin
      } as Request

      await login[1](req, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: testData.credentials.validLogin.email
            }),
            session: expect.objectContaining({
              access_token: expect.any(String)
            })
          })
        })
      )
    })

    it('should fail login with invalid credentials', async () => {
      const testData = await authFactory.createAuthFlowTestData()
      
      const req = {
        body: testData.credentials.invalidLogin
      } as Request

      await login[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid credentials'
      }))
    })

    it('should fail login with malformed email', async () => {
      const testData = await authFactory.createAuthFlowTestData()
      
      const req = {
        body: testData.credentials.malformedLogin
      } as Request

      await login[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('validation')
      }))
    })
  })

  describe('Logout', () => {
    it('should logout user successfully', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = {
        headers: {
          authorization: `Bearer ${scenario.user.accessToken}`
        }
      } as Request

      await logout(req, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Logout successful'
        })
      )
    })

    it('should logout successfully even without token', async () => {
      const req = {
        headers: {}
      } as Request

      await logout(req, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Logout successful'
        })
      )
    })
  })

  describe('Refresh Token', () => {
    it('should refresh token successfully', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = {
        body: {
          refresh_token: scenario.user.refreshToken
        }
      } as Request

      await refreshToken(req, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            session: expect.objectContaining({
              access_token: expect.any(String)
            })
          })
        })
      )
    })

    it('should fail refresh with missing refresh token', async () => {
      const req = {
        body: {}
      } as Request

      await refreshToken(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Refresh token is required'
      }))
    })

    it('should fail refresh with invalid refresh token', async () => {
      const req = {
        body: {
          refresh_token: 'invalid-refresh-token'
        }
      } as Request

      await refreshToken(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token refresh failed'
      }))
    })
  })

  describe('Reset Password', () => {
    it('should send reset password email successfully', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = {
        body: {
          email: scenario.user.email
        }
      } as Request

      await resetPassword[1](req, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Password reset email sent'
        })
      )
    })

    it('should fail reset with invalid email format', async () => {
      const req = {
        body: {
          email: 'invalid-email'
        }
      } as Request

      await resetPassword[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('validation')
      }))
    })
  })

  describe('Update Password', () => {
    it('should update password successfully', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = {
        headers: {
          authorization: `Bearer ${scenario.user.accessToken}`
        },
        body: {
          currentPassword: scenario.user.password,
          newPassword: 'NewPassword123!'
        }
      } as Request

      await updatePassword[1](req, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Password updated successfully'
        })
      )
    })

    it('should fail update password without token', async () => {
      const req = {
        headers: {},
        body: {
          currentPassword: 'oldpass',
          newPassword: 'NewPassword123!'
        }
      } as Request

      await updatePassword[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Access token is required'
      }))
    })

    it('should fail update password with invalid new password', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = {
        headers: {
          authorization: `Bearer ${scenario.user.accessToken}`
        },
        body: {
          currentPassword: scenario.user.password,
          newPassword: '123' // Too short
        }
      } as Request

      await updatePassword[1](req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('validation')
      }))
    })
  })

  describe('Get Profile', () => {
    it('should get user profile successfully', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const req = {
        headers: {
          authorization: `Bearer ${scenario.user.accessToken}`
        }
      } as Request

      await getProfile(req, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: scenario.user.id,
              email: scenario.user.email,
              firstName: scenario.user.firstName,
              lastName: scenario.user.lastName,
              role: scenario.user.role
            })
          })
        })
      )
    })

    it('should fail get profile without token', async () => {
      const req = {
        headers: {}
      } as Request

      await getProfile(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Access token is required'
      }))
    })

    it('should fail get profile with invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as Request

      await getProfile(req, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid or expired token'
      }))
    })
  })

  describe('Authentication Assertions', () => {
    it('should pass auth success assertions', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      const mockAuthResponse = {
        status: 'success',
        data: {
          user: {
            id: scenario.user.id,
            email: scenario.user.email,
            role: scenario.user.role,
            organizationId: scenario.user.organizationId
          },
          session: {
            access_token: scenario.user.accessToken
          }
        }
      }

      expect(() => authAssertions.expectAuthSuccess(mockAuthResponse)).not.toThrow()
    })

    it('should pass user validation assertions', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      expect(() => authAssertions.expectValidUser(scenario.user)).not.toThrow()
    })

    it('should pass token validation assertions', async () => {
      const scenario = await authFactory.createBasicScenario()
      
      expect(() => authAssertions.expectValidToken(scenario.user.accessToken!)).not.toThrow()
    })
  })
})