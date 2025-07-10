import { supabase, supabaseAdmin } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { userSchemas } from '../validation/schemas'
import { DataSanitizer } from '../validation/sanitization'
import bcrypt from 'bcrypt'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export interface UserRegistrationData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'sales_rep' | 'viewer'
  organizationId: string
  phone?: string
}

export interface LoginAttempt {
  email: string
  ipAddress: string
  userAgent: string
  success: boolean
  timestamp: Date
  failureReason?: string
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
  preventUserInfoInPassword: boolean
}

export interface SessionConfig {
  accessTokenExpiry: number // in seconds
  refreshTokenExpiry: number // in seconds  
  maxConcurrentSessions: number
  enableSessionRotation: boolean
}

export class AuthService {
  private static readonly DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserInfoInPassword: true
  }

  private static readonly DEFAULT_SESSION_CONFIG: SessionConfig = {
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
    maxConcurrentSessions: 5,
    enableSessionRotation: true
  }

  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ]

  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

  static async validatePasswordStrength(
    password: string, 
    userInfo?: { email?: string; firstName?: string; lastName?: string },
    policy: PasswordPolicy = AuthService.DEFAULT_PASSWORD_POLICY
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Check minimum length
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`)
    }

    // Check uppercase requirement
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    // Check lowercase requirement
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    // Check numbers requirement
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    // Check special characters requirement
    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check against common passwords
    if (policy.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase()
      if (AuthService.COMMON_PASSWORDS.some(common => lowerPassword.includes(common.toLowerCase()))) {
        errors.push('Password contains common words and is not secure')
      }
    }

    // Check user info in password
    if (policy.preventUserInfoInPassword && userInfo) {
      const lowerPassword = password.toLowerCase()
      const userInfoFields = [
        userInfo.email?.split('@')[0],
        userInfo.firstName,
        userInfo.lastName
      ].filter(Boolean)

      for (const field of userInfoFields) {
        if (field && lowerPassword.includes(field.toLowerCase())) {
          errors.push('Password cannot contain personal information')
          break
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // Use Have I Been Pwned API to check if password has been breached
      const hash = await bcrypt.hash(password, 1)
      const sha1Hash = require('crypto').createHash('sha1').update(password).digest('hex').toUpperCase()
      const prefix = sha1Hash.substring(0, 5)
      const suffix = sha1Hash.substring(5)

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
      if (response.ok) {
        const data = await response.text()
        return data.includes(suffix)
      }
    } catch (error) {
      console.warn('Password breach check failed:', error)
    }
    return false
  }

  async registerUser(userData: UserRegistrationData): Promise<{
    user: any
    session: any
    emailVerificationRequired: boolean
  }> {
    // Validate and sanitize input data
    const validatedData = userSchemas.create.parse(userData)
    const sanitizedData = {
      ...validatedData,
      email: DataSanitizer.sanitizeEmail(validatedData.email),
      firstName: DataSanitizer.sanitizeString(validatedData.firstName),
      lastName: DataSanitizer.sanitizeString(validatedData.lastName),
      phone: validatedData.phone ? DataSanitizer.sanitizePhone(validatedData.phone) : undefined
    }

    // Validate password strength
    const passwordValidation = await AuthService.validatePasswordStrength(
      sanitizedData.password,
      { 
        email: sanitizedData.email, 
        firstName: sanitizedData.firstName, 
        lastName: sanitizedData.lastName 
      }
    )

    if (!passwordValidation.isValid) {
      throw new AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400)
    }

    // Check for password breach
    const isBreached = await AuthService.checkPasswordBreach(sanitizedData.password)
    if (isBreached) {
      throw new AppError('This password has been found in data breaches and cannot be used', 400)
    }

    // Check if organization exists
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, isActive')
      .eq('id', sanitizedData.organizationId)
      .single()

    if (orgError || !orgData || !orgData.isActive) {
      throw new AppError('Invalid or inactive organization', 400)
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedData.email)
      .single()

    if (existingUser) {
      throw new AppError('User with this email already exists', 400)
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedData.email,
      password: sanitizedData.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName,
        role: sanitizedData.role,
        organization_id: sanitizedData.organizationId
      }
    })

    if (authError) {
      throw new AppError(`Registration failed: ${authError.message}`, 400)
    }

    // Create user record in our database
    const { data: dbUserData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: sanitizedData.email,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        role: sanitizedData.role,
        organizationId: sanitizedData.organizationId,
        phone: sanitizedData.phone,
        isActive: true,
        emailVerified: false,
        lastPasswordChange: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      // Rollback auth user creation if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new AppError(`User creation failed: ${userError.message}`, 400)
    }

    // Send email verification
    const { error: verificationError } = await supabase.auth.resend({
      type: 'signup',
      email: sanitizedData.email
    })

    if (verificationError) {
      console.warn('Email verification send failed:', verificationError)
    }

    return {
      user: {
        id: dbUserData.id,
        email: dbUserData.email,
        firstName: dbUserData.firstName,
        lastName: dbUserData.lastName,
        role: dbUserData.role,
        organizationId: dbUserData.organizationId,
        emailVerified: false
      },
      session: null, // No session until email is verified
      emailVerificationRequired: true
    }
  }

  async recordLoginAttempt(attemptData: LoginAttempt): Promise<void> {
    try {
      await supabase
        .from('login_attempts')
        .insert({
          email: attemptData.email,
          ipAddress: attemptData.ipAddress,
          userAgent: attemptData.userAgent,
          success: attemptData.success,
          timestamp: attemptData.timestamp.toISOString(),
          failureReason: attemptData.failureReason
        })
    } catch (error) {
      console.error('Failed to record login attempt:', error)
    }
  }

  async checkAccountLockout(email: string, ipAddress: string): Promise<{
    isLocked: boolean
    remainingAttempts: number
    lockoutExpiresAt?: Date
  }> {
    const since = new Date(Date.now() - AuthService.LOCKOUT_DURATION)

    // Check failed attempts in the last lockout period
    const { data: failedAttempts, error } = await supabase
      .from('login_attempts')
      .select('timestamp')
      .eq('email', email)
      .eq('success', false)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Failed to check login attempts:', error)
      return { isLocked: false, remainingAttempts: AuthService.MAX_LOGIN_ATTEMPTS }
    }

    const failedCount = failedAttempts?.length || 0
    const remainingAttempts = Math.max(0, AuthService.MAX_LOGIN_ATTEMPTS - failedCount)

    if (failedCount >= AuthService.MAX_LOGIN_ATTEMPTS) {
      const latestFailure = failedAttempts[0]
      const lockoutExpiresAt = new Date(new Date(latestFailure.timestamp).getTime() + AuthService.LOCKOUT_DURATION)
      
      if (new Date() < lockoutExpiresAt) {
        return {
          isLocked: true,
          remainingAttempts: 0,
          lockoutExpiresAt
        }
      }
    }

    return {
      isLocked: false,
      remainingAttempts
    }
  }

  async loginUser(
    email: string, 
    password: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<{ user: any; session: any; mfaRequired?: boolean }> {
    const sanitizedEmail = DataSanitizer.sanitizeEmail(email)
    
    // Check account lockout
    const lockoutStatus = await this.checkAccountLockout(sanitizedEmail, ipAddress)
    if (lockoutStatus.isLocked) {
      await this.recordLoginAttempt({
        email: sanitizedEmail,
        ipAddress,
        userAgent,
        success: false,
        timestamp: new Date(),
        failureReason: 'Account locked'
      })
      throw new AppError(
        `Account is locked due to too many failed attempts. Try again after ${lockoutStatus.lockoutExpiresAt?.toLocaleString()}`,
        423
      )
    }

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password
      })

      if (authError) {
        await this.recordLoginAttempt({
          email: sanitizedEmail,
          ipAddress,
          userAgent,
          success: false,
          timestamp: new Date(),
          failureReason: authError.message
        })
        throw new AppError('Invalid credentials', 401)
      }

      // Get user details from our database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id, email, firstName, lastName, role, organizationId, 
          isActive, emailVerified, mfaEnabled, lastLogin,
          organizations (id, name, type, isActive)
        `)
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        await this.recordLoginAttempt({
          email: sanitizedEmail,
          ipAddress,
          userAgent,
          success: false,
          timestamp: new Date(),
          failureReason: 'User not found in system'
        })
        throw new AppError('User not found in system', 401)
      }

      // Check if user is active
      if (!userData.isActive) {
        await this.recordLoginAttempt({
          email: sanitizedEmail,
          ipAddress,
          userAgent,
          success: false,
          timestamp: new Date(),
          failureReason: 'Account inactive'
        })
        throw new AppError('Account is inactive', 401)
      }

      // Check if organization is active
      if (!userData.organizations?.isActive) {
        await this.recordLoginAttempt({
          email: sanitizedEmail,
          ipAddress,
          userAgent,
          success: false,
          timestamp: new Date(),
          failureReason: 'Organization inactive'
        })
        throw new AppError('Organization is inactive', 401)
      }

      // Check if email is verified
      if (!userData.emailVerified) {
        throw new AppError('Email verification required. Please check your email.', 403)
      }

      // Update last login
      await supabase
        .from('users')
        .update({ 
          lastLogin: new Date().toISOString(),
          loginCount: supabase.raw('login_count + 1')
        })
        .eq('id', userData.id)

      // Record successful login attempt
      await this.recordLoginAttempt({
        email: sanitizedEmail,
        ipAddress,
        userAgent,
        success: true,
        timestamp: new Date()
      })

      const response = {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          organizationId: userData.organizationId,
          organization: userData.organizations
        },
        session: authData.session
      }

      // Check if MFA is required
      if (userData.mfaEnabled) {
        return {
          ...response,
          mfaRequired: true
        }
      }

      return response
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      await this.recordLoginAttempt({
        email: sanitizedEmail,
        ipAddress,
        userAgent,
        success: false,
        timestamp: new Date(),
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      })

      throw new AppError('Login failed', 500)
    }
  }

  async logoutUser(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new AppError(`Logout failed: ${error.message}`, 500)
      }
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        throw new AppError(`Reset password failed: ${error.message}`, 400)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      // Validate new password
      const passwordValidation = await AuthService.validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        throw new AppError(`New password validation failed: ${passwordValidation.errors.join(', ')}`, 400)
      }

      // Check for breach
      const isBreached = await AuthService.checkPasswordBreach(newPassword)
      if (isBreached) {
        throw new AppError('New password has been found in data breaches and cannot be used', 400)
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        throw new AppError(`Change password failed: ${error.message}`, 500)
      }
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  }

  async generateMFASecret(userId: string, userEmail: string): Promise<{
    secret: string
    qrCode: string
  }> {
    try {
      const secret = speakeasy.generateSecret({
        name: `Kitchen Pantry CRM (${userEmail})`,
        issuer: 'Kitchen Pantry CRM',
        length: 32
      })

      const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

      return {
        secret: secret.base32,
        qrCode
      }
    } catch (error) {
      console.error('Error generating MFA secret:', error)
      throw error
    }
  }

  async verifyMFAToken(token: string, secret: string): Promise<boolean> {
    try {
      return speakeasy.totp.verify({
        secret,
        token,
        window: 1
      })
    } catch (error) {
      console.error('Error verifying MFA token:', error)
      return false
    }
  }

  async refreshSession(refreshToken: string): Promise<{ user: any; session: any }> {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })
      
      if (error) {
        throw new AppError(`Session refresh failed: ${error.message}`, 401)
      }

      return {
        user: data.user,
        session: data.session
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      throw error
    }
  }

  async getCurrentUser(token: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.getUser(token)
      
      if (error) {
        throw new AppError(`Get user failed: ${error.message}`, 401)
      }

      return data.user
    } catch (error) {
      console.error('Error getting current user:', error)
      throw error
    }
  }

  async enableMFA(userId: string, token: string): Promise<void> {
    try {
      const isValid = await this.verifyMFAToken(token, await this.getMFASecret(userId))
      
      if (!isValid) {
        throw new AppError('Invalid MFA token', 400)
      }

      const { error } = await supabase
        .from('users')
        .update({ mfaEnabled: true })
        .eq('id', userId)

      if (error) {
        throw new AppError(`Enable MFA failed: ${error.message}`, 500)
      }
    } catch (error) {
      console.error('Error enabling MFA:', error)
      throw error
    }
  }

  async disableMFA(userId: string, token: string): Promise<void> {
    try {
      const isValid = await this.verifyMFAToken(token, await this.getMFASecret(userId))
      
      if (!isValid) {
        throw new AppError('Invalid MFA token', 400)
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null
        })
        .eq('id', userId)

      if (error) {
        throw new AppError(`Disable MFA failed: ${error.message}`, 500)
      }
    } catch (error) {
      console.error('Error disabling MFA:', error)
      throw error
    }
  }

  private async getMFASecret(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('users')
      .select('mfaSecret')
      .eq('id', userId)
      .single()

    if (error || !data?.mfaSecret) {
      throw new AppError('MFA secret not found', 404)
    }

    return data.mfaSecret
  }

  static async generateMFASecret(userId: string): Promise<{
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  }> {
    const user = await supabase
      .from('users')
      .select('email, firstName, lastName')
      .eq('id', userId)
      .single()

    if (!user.data) {
      throw new AppError('User not found', 404)
    }

    const secret = speakeasy.generateSecret({
      name: `Kitchen Pantry CRM (${user.data.email})`,
      issuer: 'Kitchen Pantry CRM',
      length: 32
    })

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Store MFA secret and backup codes (encrypted)
    await supabase
      .from('users')
      .update({
        mfaSecret: secret.base32,
        mfaBackupCodes: backupCodes,
        mfaEnabled: false // Will be enabled after verification
      })
      .eq('id', userId)

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes
    }
  }

  static async verifyMFAToken(userId: string, token: string): Promise<boolean> {
    const { data: userData } = await supabase
      .from('users')
      .select('mfaSecret')
      .eq('id', userId)
      .single()

    if (!userData?.mfaSecret) {
      return false
    }

    return speakeasy.totp.verify({
      secret: userData.mfaSecret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    })
  }

  static async enableMFA(userId: string, token: string): Promise<void> {
    const isValid = await AuthService.verifyMFAToken(userId, token)
    
    if (!isValid) {
      throw new AppError('Invalid MFA token', 400)
    }

    await supabase
      .from('users')
      .update({ mfaEnabled: true })
      .eq('id', userId)
  }

  static async disableMFA(userId: string, token: string): Promise<void> {
    const isValid = await AuthService.verifyMFAToken(userId, token)
    
    if (!isValid) {
      throw new AppError('Invalid MFA token', 400)
    }

    await supabase
      .from('users')
      .update({ 
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null
      })
      .eq('id', userId)
  }
}