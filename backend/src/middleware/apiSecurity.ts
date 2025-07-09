import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { createHash, createHmac } from 'crypto'
import { AppError } from './errorHandler'
import { supabase } from '../config/database'

export interface APIKeyData {
  id: string
  name: string
  key: string
  secret: string
  organizationId: string
  permissions: string[]
  isActive: boolean
  rateLimit: number
  lastUsedAt?: Date
  expiresAt?: Date
}

export interface RequestSignatureData {
  timestamp: string
  method: string
  path: string
  body: string
  headers: Record<string, string>
}

export class APISecurityService {
  private static readonly SIGNATURE_TOLERANCE = 300 // 5 minutes
  private static readonly API_KEY_PREFIX = 'kp_'
  private static readonly DEFAULT_RATE_LIMIT = 1000 // requests per hour

  // Rate limiting configurations for different endpoints
  static createRateLimit(options: {
    windowMs?: number
    max?: number
    message?: string
    skipSuccessfulRequests?: boolean
    keyGenerator?: (req: Request) => string
  } = {}) {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 100, // limit each IP to 100 requests per windowMs
      message: options.message || 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      keyGenerator: options.keyGenerator || ((req) => req.ip),
      handler: (req, res) => {
        res.status(429).json({
          status: 'error',
          message: options.message || 'Too many requests, please try again later',
          retryAfter: Math.round(options.windowMs! / 1000) || 900
        })
      }
    })
  }

  // Speed limiting (progressive delays)
  static createSpeedLimit(options: {
    windowMs?: number
    delayAfter?: number
    delayMs?: number
    maxDelayMs?: number
  } = {}) {
    return slowDown({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      delayAfter: options.delayAfter || 50, // allow 50 requests per windowMs without delay
      delayMs: options.delayMs || 100, // add 100ms delay after delayAfter
      maxDelayMs: options.maxDelayMs || 20000, // max delay of 20 seconds
      skipFailedRequests: false,
      skipSuccessfulRequests: false
    })
  }

  // API Key authentication
  static async validateAPIKey(req: Request, res: Response, next: NextFunction) {
    try {
      const apiKey = req.headers['x-api-key'] as string

      if (!apiKey) {
        throw new AppError('API key is required', 401)
      }

      if (!apiKey.startsWith(APISecurityService.API_KEY_PREFIX)) {
        throw new AppError('Invalid API key format', 401)
      }

      // Get API key data from database
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key', apiKey)
        .eq('isActive', true)
        .single()

      if (error || !keyData) {
        throw new AppError('Invalid API key', 401)
      }

      // Check if key is expired
      if (keyData.expiresAt && new Date() > new Date(keyData.expiresAt)) {
        throw new AppError('API key has expired', 401)
      }

      // Check rate limit for this API key
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const { count: requestCount, error: countError } = await supabase
        .from('api_requests')
        .select('id', { count: 'exact', head: true })
        .eq('apiKeyId', keyData.id)
        .gte('timestamp', oneHourAgo.toISOString())

      if (countError) {
        console.error('Failed to check API key rate limit:', countError)
      } else if (requestCount && requestCount >= keyData.rateLimit) {
        throw new AppError('API key rate limit exceeded', 429)
      }

      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ lastUsedAt: now.toISOString() })
        .eq('id', keyData.id)

      // Log API request
      await supabase
        .from('api_requests')
        .insert({
          apiKeyId: keyData.id,
          method: req.method,
          path: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: now.toISOString()
        })

      // Attach API key data to request
      req.apiKey = keyData
      next()
    } catch (error) {
      if (error instanceof AppError) {
        next(error)
      } else {
        next(new AppError('API key validation failed', 500))
      }
    }
  }

  // Request signature validation
  static validateRequestSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-signature'] as string
      const timestamp = req.headers['x-timestamp'] as string

      if (!signature || !timestamp) {
        throw new AppError('Request signature and timestamp are required', 401)
      }

      // Check timestamp tolerance
      const requestTime = parseInt(timestamp)
      const currentTime = Math.floor(Date.now() / 1000)

      if (Math.abs(currentTime - requestTime) > APISecurityService.SIGNATURE_TOLERANCE) {
        throw new AppError('Request timestamp is outside acceptable range', 401)
      }

      // Get API key secret
      if (!req.apiKey) {
        throw new AppError('API key validation must precede signature validation', 500)
      }

      // Build signature data
      const signatureData: RequestSignatureData = {
        timestamp,
        method: req.method,
        path: req.path,
        body: JSON.stringify(req.body || {}),
        headers: {
          'content-type': req.get('content-type') || '',
          'x-timestamp': timestamp
        }
      }

      // Calculate expected signature
      const dataString = Object.entries(signatureData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join('&')

      const expectedSignature = createHmac('sha256', req.apiKey.secret)
        .update(dataString)
        .digest('hex')

      // Compare signatures
      if (signature !== expectedSignature) {
        throw new AppError('Invalid request signature', 401)
      }

      next()
    } catch (error) {
      if (error instanceof AppError) {
        next(error)
      } else {
        next(new AppError('Request signature validation failed', 500))
      }
    }
  }

  // CORS configuration
  static configureCORS(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',')
    const origin = req.headers.origin

    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*')
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-Signature, X-Timestamp')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age', '86400') // 24 hours

    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }

    next()
  }

  // Security headers
  static setSecurityHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent XSS attacks
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '))

    // Strict Transport Security
    if (req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    next()
  }

  // Request size limiting
  static limitRequestSize(maxSize: string = '10mb') {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = req.headers['content-length']
      
      if (contentLength) {
        const size = parseInt(contentLength)
        const maxBytes = APISecurityService.parseSize(maxSize)
        
        if (size > maxBytes) {
          return res.status(413).json({
            status: 'error',
            message: `Request too large. Maximum size is ${maxSize}`,
            maxSize
          })
        }
      }

      next()
    }
  }

  // IP whitelisting/blacklisting
  static createIPFilter(options: {
    whitelist?: string[]
    blacklist?: string[]
    mode?: 'whitelist' | 'blacklist'
  }) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip
      const { whitelist = [], blacklist = [], mode = 'blacklist' } = options

      if (mode === 'whitelist' && whitelist.length > 0) {
        if (!whitelist.some(ip => APISecurityService.matchIP(clientIP, ip))) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: IP not whitelisted'
          })
        }
      }

      if (mode === 'blacklist' && blacklist.length > 0) {
        if (blacklist.some(ip => APISecurityService.matchIP(clientIP, ip))) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: IP blacklisted'
          })
        }
      }

      next()
    }
  }

  // Request logging and monitoring
  static logRequests(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now()

    // Log request details
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`)

    // Override res.end to capture response details
    const originalEnd = res.end
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
      
      // Store request log in database (async, don't wait)
      supabase
        .from('request_logs')
        .insert({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          apiKeyId: req.apiKey?.id,
          timestamp: new Date().toISOString()
        })
        .then(() => {})
        .catch(error => console.error('Failed to log request:', error))

      originalEnd.call(res, chunk, encoding)
    }

    next()
  }

  // Utility methods
  private static parseSize(size: string): number {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 }
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/)
    
    if (!match) {
      throw new Error(`Invalid size format: ${size}`)
    }

    const value = parseFloat(match[1])
    const unit = (match[2] || 'b') as keyof typeof units
    
    return value * units[unit]
  }

  private static matchIP(clientIP: string, pattern: string): boolean {
    // Simple IP matching - could be enhanced with CIDR support
    if (pattern === '*') return true
    if (pattern === clientIP) return true
    
    // Basic wildcard support (e.g., 192.168.*.*)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '\\d+') + '$')
    return regex.test(clientIP)
  }

  // Generate new API key
  static async generateAPIKey(data: {
    name: string
    organizationId: string
    permissions: string[]
    rateLimit?: number
    expiresAt?: Date
  }): Promise<APIKeyData> {
    const key = APISecurityService.API_KEY_PREFIX + createHash('sha256')
      .update(Date.now() + Math.random().toString())
      .digest('hex')
      .substring(0, 32)

    const secret = createHash('sha256')
      .update(Date.now() + Math.random().toString() + key)
      .digest('hex')

    const apiKeyData = {
      name: data.name,
      key,
      secret,
      organizationId: data.organizationId,
      permissions: data.permissions,
      rateLimit: data.rateLimit || APISecurityService.DEFAULT_RATE_LIMIT,
      expiresAt: data.expiresAt?.toISOString(),
      isActive: true
    }

    const { data: createdKey, error } = await supabase
      .from('api_keys')
      .insert(apiKeyData)
      .select()
      .single()

    if (error) {
      throw new AppError(`Failed to create API key: ${error.message}`, 500)
    }

    return {
      id: createdKey.id,
      name: createdKey.name,
      key: createdKey.key,
      secret: createdKey.secret,
      organizationId: createdKey.organizationId,
      permissions: createdKey.permissions,
      isActive: createdKey.isActive,
      rateLimit: createdKey.rateLimit,
      lastUsedAt: createdKey.lastUsedAt ? new Date(createdKey.lastUsedAt) : undefined,
      expiresAt: createdKey.expiresAt ? new Date(createdKey.expiresAt) : undefined
    }
  }
}

// Predefined rate limiting configurations
export const rateLimits = {
  // Strict rate limiting for authentication endpoints
  auth: APISecurityService.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later'
  }),

  // Moderate rate limiting for API endpoints
  api: APISecurityService.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    skipSuccessfulRequests: true
  }),

  // Lenient rate limiting for public endpoints
  public: APISecurityService.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    skipSuccessfulRequests: true
  }),

  // Per-user rate limiting
  perUser: APISecurityService.createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    keyGenerator: (req) => req.user?.id || req.ip
  })
}

// Predefined speed limiting configurations
export const speedLimits = {
  moderate: APISecurityService.createSpeedLimit({
    windowMs: 15 * 60 * 1000,
    delayAfter: 100,
    delayMs: 100,
    maxDelayMs: 10000
  }),

  strict: APISecurityService.createSpeedLimit({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 200,
    maxDelayMs: 20000
  })
}

// Export middleware functions
export const validateAPIKey = APISecurityService.validateAPIKey
export const validateRequestSignature = APISecurityService.validateRequestSignature
export const configureCORS = APISecurityService.configureCORS
export const setSecurityHeaders = APISecurityService.setSecurityHeaders
export const limitRequestSize = APISecurityService.limitRequestSize
export const createIPFilter = APISecurityService.createIPFilter
export const logRequests = APISecurityService.logRequests

// Extended Request interface
declare global {
  namespace Express {
    interface Request {
      apiKey?: APIKeyData
      user?: {
        id: string
        email: string
        role: string
        organizationId: string
      }
    }
  }
}