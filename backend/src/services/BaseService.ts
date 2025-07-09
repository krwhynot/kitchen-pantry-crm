export abstract class BaseService {
  protected handleError(error: any, message: string): never {
    console.error(`[SERVICE ERROR] ${message}:`, error)
    
    if (error instanceof Error) {
      throw new Error(`${message}: ${error.message}`)
    }
    
    throw new Error(message)
  }

  protected validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`)
    }
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  protected validateUrl(url: string): void {
    try {
      new URL(url)
    } catch {
      throw new Error('Invalid URL format')
    }
  }

  protected validatePhoneNumber(phone: string): void {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone number format')
    }
  }

  protected sanitizeString(value: string): string {
    return value.trim().replace(/\s+/g, ' ')
  }

  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}