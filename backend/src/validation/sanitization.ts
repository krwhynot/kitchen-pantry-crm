import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

export interface SanitizationOptions {
  stripHtml?: boolean
  normalizeWhitespace?: boolean
  trim?: boolean
  lowercase?: boolean
  maxLength?: number
  allowedCharacters?: RegExp
}

export interface DataMaskingOptions {
  maskEmail?: boolean
  maskPhone?: boolean
  maskCreditCard?: boolean
  maskSSN?: boolean
  customMasks?: Array<{
    pattern: RegExp
    replacement: string
  }>
}

export class DataSanitizer {
  static sanitizeString(
    input: string | undefined | null,
    options: SanitizationOptions = {}
  ): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    let sanitized = input

    // Strip HTML if requested
    if (options.stripHtml) {
      sanitized = DOMPurify.sanitize(sanitized, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      })
    }

    // Normalize whitespace
    if (options.normalizeWhitespace !== false) {
      sanitized = sanitized.replace(/\s+/g, ' ')
    }

    // Trim whitespace
    if (options.trim !== false) {
      sanitized = sanitized.trim()
    }

    // Convert to lowercase
    if (options.lowercase) {
      sanitized = sanitized.toLowerCase()
    }

    // Enforce maximum length
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength)
    }

    // Filter allowed characters
    if (options.allowedCharacters) {
      sanitized = sanitized.replace(options.allowedCharacters, '')
    }

    return sanitized
  }

  static sanitizeEmail(email: string | undefined | null): string {
    if (!email) return ''
    
    const sanitized = this.sanitizeString(email, {
      trim: true,
      lowercase: true,
      maxLength: 254
    })

    return validator.isEmail(sanitized) ? sanitized : ''
  }

  static sanitizePhone(phone: string | undefined | null): string {
    if (!phone) return ''
    
    // Remove all non-digit characters except + for international numbers
    let sanitized = phone.replace(/[^\d+]/g, '')
    
    // Ensure + is only at the beginning
    if (sanitized.includes('+')) {
      const firstPlus = sanitized.indexOf('+')
      sanitized = '+' + sanitized.substring(firstPlus + 1).replace(/\+/g, '')
    }

    return sanitized
  }

  static sanitizeUrl(url: string | undefined | null): string {
    if (!url) return ''
    
    const sanitized = this.sanitizeString(url, {
      trim: true,
      maxLength: 2048
    })

    // Add protocol if missing
    if (sanitized && !sanitized.match(/^https?:\/\//)) {
      return `https://${sanitized}`
    }

    return validator.isURL(sanitized) ? sanitized : ''
  }

  static sanitizeHtml(html: string | undefined | null, allowedTags: string[] = []): string {
    if (!html) return ''
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover']
    })
  }

  static sanitizeNumeric(input: string | number | undefined | null): number | null {
    if (input === null || input === undefined) return null
    
    const stringValue = String(input).replace(/[^\d.-]/g, '')
    const parsed = parseFloat(stringValue)
    
    return isNaN(parsed) ? null : parsed
  }

  static sanitizeInteger(input: string | number | undefined | null): number | null {
    if (input === null || input === undefined) return null
    
    const stringValue = String(input).replace(/[^\d-]/g, '')
    const parsed = parseInt(stringValue, 10)
    
    return isNaN(parsed) ? null : parsed
  }

  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    schema: Record<keyof T, SanitizationOptions>
  ): Partial<T> {
    const sanitized: Partial<T> = {}

    for (const [key, options] of Object.entries(schema)) {
      const value = obj[key]
      
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          sanitized[key as keyof T] = this.sanitizeString(value, options) as T[keyof T]
        } else if (typeof value === 'number') {
          sanitized[key as keyof T] = value as T[keyof T]
        } else if (Array.isArray(value)) {
          sanitized[key as keyof T] = value.map(item => 
            typeof item === 'string' ? this.sanitizeString(item, options) : item
          ) as T[keyof T]
        } else {
          sanitized[key as keyof T] = value as T[keyof T]
        }
      }
    }

    return sanitized
  }
}

export class DataMasker {
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email
    
    const [local, domain] = email.split('@')
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '*'.repeat(local.length)
    
    return `${maskedLocal}@${domain}`
  }

  static maskPhone(phone: string): string {
    if (!phone) return phone
    
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 4) return '*'.repeat(phone.length)
    
    const masked = digits.substring(0, digits.length - 4).replace(/\d/g, '*') + 
                   digits.substring(digits.length - 4)
    
    // Preserve original formatting
    let result = phone
    let digitIndex = 0
    for (let i = 0; i < result.length; i++) {
      if (/\d/.test(result[i])) {
        result = result.substring(0, i) + masked[digitIndex] + result.substring(i + 1)
        digitIndex++
      }
    }
    
    return result
  }

  static maskCreditCard(cardNumber: string): string {
    if (!cardNumber) return cardNumber
    
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 4) return '*'.repeat(cardNumber.length)
    
    const masked = '*'.repeat(digits.length - 4) + digits.substring(digits.length - 4)
    
    // Preserve original formatting
    let result = cardNumber
    let digitIndex = 0
    for (let i = 0; i < result.length; i++) {
      if (/\d/.test(result[i])) {
        result = result.substring(0, i) + masked[digitIndex] + result.substring(i + 1)
        digitIndex++
      }
    }
    
    return result
  }

  static maskSSN(ssn: string): string {
    if (!ssn) return ssn
    
    const digits = ssn.replace(/\D/g, '')
    if (digits.length < 4) return '*'.repeat(ssn.length)
    
    const masked = '*'.repeat(digits.length - 4) + digits.substring(digits.length - 4)
    
    // Preserve original formatting
    let result = ssn
    let digitIndex = 0
    for (let i = 0; i < result.length; i++) {
      if (/\d/.test(result[i])) {
        result = result.substring(0, i) + masked[digitIndex] + result.substring(i + 1)
        digitIndex++
      }
    }
    
    return result
  }

  static maskData<T extends Record<string, any>>(
    data: T,
    options: DataMaskingOptions = {}
  ): T {
    const masked = { ...data }

    // Apply built-in masks
    if (options.maskEmail) {
      for (const key in masked) {
        if (typeof masked[key] === 'string' && masked[key].includes('@')) {
          masked[key] = this.maskEmail(masked[key]) as T[Extract<keyof T, string>]
        }
      }
    }

    if (options.maskPhone) {
      for (const key in masked) {
        if (typeof masked[key] === 'string' && /^\+?[\d\s\-\(\)]+$/.test(masked[key])) {
          masked[key] = this.maskPhone(masked[key]) as T[Extract<keyof T, string>]
        }
      }
    }

    if (options.maskCreditCard) {
      for (const key in masked) {
        if (typeof masked[key] === 'string' && /^\d{13,19}$/.test(masked[key].replace(/\s/g, ''))) {
          masked[key] = this.maskCreditCard(masked[key]) as T[Extract<keyof T, string>]
        }
      }
    }

    if (options.maskSSN) {
      for (const key in masked) {
        if (typeof masked[key] === 'string' && /^\d{3}-?\d{2}-?\d{4}$/.test(masked[key])) {
          masked[key] = this.maskSSN(masked[key]) as T[Extract<keyof T, string>]
        }
      }
    }

    // Apply custom masks
    if (options.customMasks) {
      for (const { pattern, replacement } of options.customMasks) {
        for (const key in masked) {
          if (typeof masked[key] === 'string') {
            masked[key] = masked[key].replace(pattern, replacement) as T[Extract<keyof T, string>]
          }
        }
      }
    }

    return masked
  }
}

// Data normalization utilities
export class DataNormalizer {
  static normalizeDate(date: string | Date | undefined | null): string | null {
    if (!date) return null
    
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return null
      
      return dateObj.toISOString()
    } catch {
      return null
    }
  }

  static normalizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim()
      return ['true', '1', 'yes', 'on', 'enabled'].includes(lower)
    }
    if (typeof value === 'number') {
      return value !== 0
    }
    return false
  }

  static normalizeArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value
    if (value === null || value === undefined) return []
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : [value]
      } catch {
        return [value]
      }
    }
    return [value]
  }

  static normalizeObject<T extends Record<string, any>>(
    obj: any,
    defaults: Partial<T> = {}
  ): T {
    if (!obj || typeof obj !== 'object') {
      return { ...defaults } as T
    }

    return { ...defaults, ...obj } as T
  }

  static normalizeText(text: string | undefined | null): string {
    if (!text) return ''
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\u2018\u2019]/g, "'") // Normalize quotes
      .replace(/[\u201C\u201D]/g, '"') // Normalize double quotes
      .replace(/[\u2013\u2014]/g, '-') // Normalize dashes
  }
}

// Data integrity constraints
export class DataIntegrityValidator {
  static validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} is required`)
    }
  }

  static validateUnique(
    value: any,
    existingValues: any[],
    fieldName: string
  ): void {
    if (existingValues.includes(value)) {
      throw new Error(`${fieldName} must be unique`)
    }
  }

  static validateRange(
    value: number,
    min: number,
    max: number,
    fieldName: string
  ): void {
    if (value < min || value > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`)
    }
  }

  static validateLength(
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string
  ): void {
    if (value.length < minLength || value.length > maxLength) {
      throw new Error(`${fieldName} must be between ${minLength} and ${maxLength} characters`)
    }
  }

  static validateFormat(
    value: string,
    pattern: RegExp,
    fieldName: string,
    message?: string
  ): void {
    if (!pattern.test(value)) {
      throw new Error(message || `${fieldName} has invalid format`)
    }
  }

  static validateDependency(
    value: any,
    dependentValue: any,
    fieldName: string,
    dependentFieldName: string
  ): void {
    if (value && !dependentValue) {
      throw new Error(`${dependentFieldName} is required when ${fieldName} is provided`)
    }
  }
}