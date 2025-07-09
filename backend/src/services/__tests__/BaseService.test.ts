import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { BaseService } from '../BaseService'

// Create a concrete implementation of BaseService for testing
class TestService extends BaseService {
  // Expose protected methods for testing
  public testHandleError(error: any, message: string): never {
    return this.handleError(error, message)
  }

  public testValidateRequired(value: any, fieldName: string): void {
    return this.validateRequired(value, fieldName)
  }

  public testValidateEmail(email: string): void {
    return this.validateEmail(email)
  }

  public testValidateUrl(url: string): void {
    return this.validateUrl(url)
  }

  public testValidatePhoneNumber(phone: string): void {
    return this.validatePhoneNumber(phone)
  }

  public testSanitizeString(value: string): string {
    return this.sanitizeString(value)
  }

  public testGenerateId(): string {
    return this.generateId()
  }
}

describe('BaseService', () => {
  let testService: TestService

  beforeEach(() => {
    testService = new TestService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('handleError', () => {
    it('should throw error with custom message when given Error instance', () => {
      const originalError = new Error('Original error message')
      const customMessage = 'Custom error message'

      expect(() => {
        testService.testHandleError(originalError, customMessage)
      }).toThrow('Custom error message: Original error message')
    })

    it('should throw error with custom message when given non-Error object', () => {
      const originalError = 'String error'
      const customMessage = 'Custom error message'

      expect(() => {
        testService.testHandleError(originalError, customMessage)
      }).toThrow('Custom error message')
    })

    it('should throw error with custom message when given undefined', () => {
      const customMessage = 'Custom error message'

      expect(() => {
        testService.testHandleError(undefined, customMessage)
      }).toThrow('Custom error message')
    })

    it('should throw error with custom message when given null', () => {
      const customMessage = 'Custom error message'

      expect(() => {
        testService.testHandleError(null, customMessage)
      }).toThrow('Custom error message')
    })

    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const originalError = new Error('Test error')
      const customMessage = 'Custom message'

      try {
        testService.testHandleError(originalError, customMessage)
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SERVICE ERROR] Custom message:',
        originalError
      )

      consoleSpy.mockRestore()
    })
  })

  describe('validateRequired', () => {
    it('should not throw error for valid values', () => {
      expect(() => {
        testService.testValidateRequired('valid value', 'fieldName')
      }).not.toThrow()

      expect(() => {
        testService.testValidateRequired(123, 'fieldName')
      }).not.toThrow()

      expect(() => {
        testService.testValidateRequired(true, 'fieldName')
      }).not.toThrow()

      expect(() => {
        testService.testValidateRequired(false, 'fieldName')
      }).not.toThrow()

      expect(() => {
        testService.testValidateRequired([], 'fieldName')
      }).not.toThrow()

      expect(() => {
        testService.testValidateRequired({}, 'fieldName')
      }).not.toThrow()
    })

    it('should throw error for undefined value', () => {
      expect(() => {
        testService.testValidateRequired(undefined, 'fieldName')
      }).toThrow('fieldName is required')
    })

    it('should throw error for null value', () => {
      expect(() => {
        testService.testValidateRequired(null, 'fieldName')
      }).toThrow('fieldName is required')
    })

    it('should throw error for empty string', () => {
      expect(() => {
        testService.testValidateRequired('', 'fieldName')
      }).toThrow('fieldName is required')
    })

    it('should use provided field name in error message', () => {
      expect(() => {
        testService.testValidateRequired(null, 'customField')
      }).toThrow('customField is required')
    })
  })

  describe('validateEmail', () => {
    it('should not throw error for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@domain.co.uk',
        'user_name@domain-name.com',
        'user123@domain123.com',
        'a@b.co',
        'test.email.with+symbol@example.com'
      ]

      validEmails.forEach(email => {
        expect(() => {
          testService.testValidateEmail(email)
        }).not.toThrow()
      })
    })

    it('should throw error for invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double.dot@domain.com',
        'user@domain..com',
        'user@.domain.com',
        'user@domain.com.',
        '',
        'user name@domain.com',
        'user@domain com'
      ]

      invalidEmails.forEach(email => {
        expect(() => {
          testService.testValidateEmail(email)
        }).toThrow('Invalid email format')
      })
    })
  })

  describe('validateUrl', () => {
    it('should not throw error for valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://example.com:8080',
        'https://subdomain.example.com',
        'ftp://example.com',
        'file://localhost/path'
      ]

      validUrls.forEach(url => {
        expect(() => {
          testService.testValidateUrl(url)
        }).not.toThrow()
      })
    })

    it('should throw error for invalid URLs', () => {
      const invalidUrls = [
        'invalid-url',
        'not-a-url',
        'example.com',
        'www.example.com',
        'http://',
        'https://',
        'http://.',
        'http://..',
        'http://../',
        'http://?',
        'http://??/',
        'http://foo.bar?q=Spaces should be encoded',
        'http://foo.bar/foo(bar)baz quux'
      ]

      invalidUrls.forEach(url => {
        expect(() => {
          testService.testValidateUrl(url)
        }).toThrow('Invalid URL format')
      })
    })
  })

  describe('validatePhoneNumber', () => {
    it('should not throw error for valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1 234 567 8900',
        '(123) 456-7890',
        '+44 20 7946 0958',
        '+33 1 42 86 83 26',
        '123-456-7890',
        '123.456.7890',
        '123 456 7890',
        '+1-234-567-8900'
      ]

      validPhones.forEach(phone => {
        expect(() => {
          testService.testValidatePhoneNumber(phone)
        }).not.toThrow()
      })
    })

    it('should throw error for invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        '123abc',
        'phone',
        '++1234567890',
        '1234567890abc',
        '12345',
        '',
        'not-a-phone',
        '123-456-78901234567890',
        '(123',
        '123)',
        '+',
        '-',
        '()',
        '---'
      ]

      invalidPhones.forEach(phone => {
        expect(() => {
          testService.testValidatePhoneNumber(phone)
        }).toThrow('Invalid phone number format')
      })
    })
  })

  describe('sanitizeString', () => {
    it('should trim whitespace from start and end', () => {
      expect(testService.testSanitizeString('  hello world  ')).toBe('hello world')
      expect(testService.testSanitizeString('\t\nhello world\t\n')).toBe('hello world')
      expect(testService.testSanitizeString('   test   ')).toBe('test')
    })

    it('should replace multiple spaces with single space', () => {
      expect(testService.testSanitizeString('hello    world')).toBe('hello world')
      expect(testService.testSanitizeString('multiple   spaces    here')).toBe('multiple spaces here')
      expect(testService.testSanitizeString('tabs\t\tand\t\tspaces')).toBe('tabs and spaces')
    })

    it('should handle mixed whitespace characters', () => {
      expect(testService.testSanitizeString('  hello\t\tworld\n\n  ')).toBe('hello world')
      expect(testService.testSanitizeString('\r\n\t  test  \r\n\t')).toBe('test')
    })

    it('should handle empty string', () => {
      expect(testService.testSanitizeString('')).toBe('')
    })

    it('should handle string with only whitespace', () => {
      expect(testService.testSanitizeString('   \t\n   ')).toBe('')
    })

    it('should not modify strings that are already clean', () => {
      expect(testService.testSanitizeString('hello world')).toBe('hello world')
      expect(testService.testSanitizeString('test')).toBe('test')
    })
  })

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = testService.testGenerateId()
      expect(typeof id).toBe('string')
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 1000; i++) {
        ids.add(testService.testGenerateId())
      }
      expect(ids.size).toBe(1000)
    })

    it('should generate IDs with reasonable length', () => {
      const id = testService.testGenerateId()
      expect(id.length).toBeGreaterThan(5)
      expect(id.length).toBeLessThan(50)
    })

    it('should generate IDs containing only alphanumeric characters', () => {
      const id = testService.testGenerateId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    })

    it('should generate different IDs on subsequent calls', () => {
      const id1 = testService.testGenerateId()
      const id2 = testService.testGenerateId()
      expect(id1).not.toBe(id2)
    })
  })
})