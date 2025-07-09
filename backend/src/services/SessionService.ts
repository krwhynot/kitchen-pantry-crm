import { supabase, supabaseAdmin } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { randomBytes } from 'crypto'

export interface SessionData {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  ipAddress: string
  userAgent: string
  isActive: boolean
  expiresAt: Date
  refreshExpiresAt: Date
  createdAt: Date
  lastActivityAt: Date
}

export interface SessionConfig {
  accessTokenExpiry: number // seconds
  refreshTokenExpiry: number // seconds
  maxConcurrentSessions: number
  enableSessionRotation: boolean
  requireIpValidation: boolean
  enableActivityTracking: boolean
}

export class SessionService {
  private static readonly DEFAULT_CONFIG: SessionConfig = {
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
    maxConcurrentSessions: 5,
    enableSessionRotation: true,
    requireIpValidation: false,
    enableActivityTracking: true
  }

  static async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    config: Partial<SessionConfig> = {}
  ): Promise<SessionData> {
    const sessionConfig = { ...SessionService.DEFAULT_CONFIG, ...config }

    // Check if user exists and is active
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, isActive, email')
      .eq('id', userId)
      .single()

    if (userError || !userData || !userData.isActive) {
      throw new AppError('Invalid user', 401)
    }

    // Clean up expired sessions for this user
    await SessionService.cleanupExpiredSessions(userId)

    // Check concurrent session limit
    const activeSessions = await SessionService.getActiveSessions(userId)
    if (activeSessions.length >= sessionConfig.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = activeSessions.sort((a, b) => 
        new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime()
      )[0]
      
      await SessionService.invalidateSession(oldestSession.id)
    }

    // Generate session tokens
    const sessionId = randomBytes(32).toString('hex')
    const refreshTokenId = randomBytes(32).toString('hex')

    const now = new Date()
    const expiresAt = new Date(now.getTime() + sessionConfig.accessTokenExpiry * 1000)
    const refreshExpiresAt = new Date(now.getTime() + sessionConfig.refreshTokenExpiry * 1000)

    // Create session in Supabase Auth
    const { data: authSession, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: 'temp' // This would need to be handled differently in production
    })

    if (authError) {
      throw new AppError('Failed to create auth session', 500)
    }

    // Store session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        userId,
        accessToken: authSession.session.access_token,
        refreshToken: refreshTokenId,
        ipAddress,
        userAgent,
        isActive: true,
        expiresAt: expiresAt.toISOString(),
        refreshExpiresAt: refreshExpiresAt.toISOString(),
        createdAt: now.toISOString(),
        lastActivityAt: now.toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      throw new AppError('Failed to create session', 500)
    }

    // Log session creation
    await SessionService.logSessionActivity(sessionId, 'created', { ipAddress, userAgent })

    return {
      id: sessionData.id,
      userId: sessionData.userId,
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      isActive: sessionData.isActive,
      expiresAt: new Date(sessionData.expiresAt),
      refreshExpiresAt: new Date(sessionData.refreshExpiresAt),
      createdAt: new Date(sessionData.createdAt),
      lastActivityAt: new Date(sessionData.lastActivityAt)
    }
  }

  static async refreshSession(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
    config: Partial<SessionConfig> = {}
  ): Promise<SessionData> {
    const sessionConfig = { ...SessionService.DEFAULT_CONFIG, ...config }

    // Find session by refresh token
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('refreshToken', refreshToken)
      .eq('isActive', true)
      .single()

    if (sessionError || !sessionData) {
      throw new AppError('Invalid refresh token', 401)
    }

    // Check if refresh token is expired
    if (new Date() > new Date(sessionData.refreshExpiresAt)) {
      await SessionService.invalidateSession(sessionData.id)
      throw new AppError('Refresh token expired', 401)
    }

    // Validate IP address if required
    if (sessionConfig.requireIpValidation && sessionData.ipAddress !== ipAddress) {
      await SessionService.logSessionActivity(sessionData.id, 'ip_mismatch', { 
        originalIp: sessionData.ipAddress, 
        newIp: ipAddress 
      })
      throw new AppError('IP address validation failed', 401)
    }

    // Generate new tokens if rotation is enabled
    let newAccessToken = sessionData.accessToken
    let newRefreshToken = sessionData.refreshToken

    if (sessionConfig.enableSessionRotation) {
      // Refresh the auth session
      const { data: newAuthSession, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: sessionData.refreshToken
      })

      if (refreshError) {
        await SessionService.invalidateSession(sessionData.id)
        throw new AppError('Session refresh failed', 401)
      }

      newAccessToken = newAuthSession.session.access_token
      newRefreshToken = randomBytes(32).toString('hex')
    }

    // Update session
    const now = new Date()
    const newExpiresAt = new Date(now.getTime() + sessionConfig.accessTokenExpiry * 1000)
    const newRefreshExpiresAt = new Date(now.getTime() + sessionConfig.refreshTokenExpiry * 1000)

    const { data: updatedSession, error: updateError } = await supabase
      .from('user_sessions')
      .update({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt.toISOString(),
        refreshExpiresAt: newRefreshExpiresAt.toISOString(),
        lastActivityAt: now.toISOString(),
        ipAddress, // Update IP if it changed
        userAgent // Update user agent if it changed
      })
      .eq('id', sessionData.id)
      .select()
      .single()

    if (updateError) {
      throw new AppError('Failed to update session', 500)
    }

    // Log session refresh
    await SessionService.logSessionActivity(sessionData.id, 'refreshed', { ipAddress, userAgent })

    return {
      id: updatedSession.id,
      userId: updatedSession.userId,
      accessToken: updatedSession.accessToken,
      refreshToken: updatedSession.refreshToken,
      ipAddress: updatedSession.ipAddress,
      userAgent: updatedSession.userAgent,
      isActive: updatedSession.isActive,
      expiresAt: new Date(updatedSession.expiresAt),
      refreshExpiresAt: new Date(updatedSession.refreshExpiresAt),
      createdAt: new Date(updatedSession.createdAt),
      lastActivityAt: new Date(updatedSession.lastActivityAt)
    }
  }

  static async validateSession(
    accessToken: string,
    ipAddress?: string,
    config: Partial<SessionConfig> = {}
  ): Promise<SessionData | null> {
    const sessionConfig = { ...SessionService.DEFAULT_CONFIG, ...config }

    // Find session by access token
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('accessToken', accessToken)
      .eq('isActive', true)
      .single()

    if (sessionError || !sessionData) {
      return null
    }

    // Check if session is expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      await SessionService.invalidateSession(sessionData.id)
      return null
    }

    // Validate IP address if required
    if (sessionConfig.requireIpValidation && ipAddress && sessionData.ipAddress !== ipAddress) {
      await SessionService.logSessionActivity(sessionData.id, 'ip_mismatch', { 
        originalIp: sessionData.ipAddress, 
        requestIp: ipAddress 
      })
      return null
    }

    // Update last activity if tracking is enabled
    if (sessionConfig.enableActivityTracking) {
      await supabase
        .from('user_sessions')
        .update({ lastActivityAt: new Date().toISOString() })
        .eq('id', sessionData.id)
    }

    return {
      id: sessionData.id,
      userId: sessionData.userId,
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      isActive: sessionData.isActive,
      expiresAt: new Date(sessionData.expiresAt),
      refreshExpiresAt: new Date(sessionData.refreshExpiresAt),
      createdAt: new Date(sessionData.createdAt),
      lastActivityAt: new Date(sessionData.lastActivityAt)
    }
  }

  static async invalidateSession(sessionId: string): Promise<void> {
    // Mark session as inactive
    await supabase
      .from('user_sessions')
      .update({ 
        isActive: false,
        invalidatedAt: new Date().toISOString()
      })
      .eq('id', sessionId)

    // Log session invalidation
    await SessionService.logSessionActivity(sessionId, 'invalidated')
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    // Mark all user sessions as inactive
    await supabase
      .from('user_sessions')
      .update({ 
        isActive: false,
        invalidatedAt: new Date().toISOString()
      })
      .eq('userId', userId)
      .eq('isActive', true)

    // Log bulk session invalidation
    await SessionService.logSessionActivity(null, 'bulk_invalidated', { userId })
  }

  static async getActiveSessions(userId: string): Promise<SessionData[]> {
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .order('lastActivityAt', { ascending: false })

    if (error) {
      console.error('Failed to get active sessions:', error)
      return []
    }

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isActive: session.isActive,
      expiresAt: new Date(session.expiresAt),
      refreshExpiresAt: new Date(session.refreshExpiresAt),
      createdAt: new Date(session.createdAt),
      lastActivityAt: new Date(session.lastActivityAt)
    }))
  }

  static async cleanupExpiredSessions(userId?: string): Promise<number> {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('user_sessions')
      .update({ 
        isActive: false,
        invalidatedAt: now
      })
      .or(`expiresAt.lt.${now},refreshExpiresAt.lt.${now}`)
      .eq('isActive', true)

    if (userId) {
      query = query.eq('userId', userId)
    }

    const { error, count } = await query

    if (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return 0
    }

    return count || 0
  }

  static async getSessionAnalytics(userId?: string): Promise<{
    totalSessions: number
    activeSessions: number
    expiredSessions: number
    averageSessionDuration: number
    uniqueDevices: number
    uniqueIpAddresses: number
  }> {
    let query = supabase
      .from('user_sessions')
      .select('*')

    if (userId) {
      query = query.eq('userId', userId)
    }

    const { data: sessions, error } = await query

    if (error || !sessions) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        averageSessionDuration: 0,
        uniqueDevices: 0,
        uniqueIpAddresses: 0
      }
    }

    const now = new Date()
    const activeSessions = sessions.filter(s => s.isActive && new Date(s.expiresAt) > now)
    const expiredSessions = sessions.filter(s => !s.isActive || new Date(s.expiresAt) <= now)

    // Calculate average session duration
    const durations = sessions.map(s => {
      const start = new Date(s.createdAt)
      const end = s.invalidatedAt ? new Date(s.invalidatedAt) : new Date(s.lastActivityAt)
      return end.getTime() - start.getTime()
    })
    const averageSessionDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length / 1000 // in seconds
      : 0

    // Count unique devices and IPs
    const uniqueDevices = new Set(sessions.map(s => s.userAgent)).size
    const uniqueIpAddresses = new Set(sessions.map(s => s.ipAddress)).size

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      averageSessionDuration,
      uniqueDevices,
      uniqueIpAddresses
    }
  }

  private static async logSessionActivity(
    sessionId: string | null,
    activity: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase
        .from('session_activity_logs')
        .insert({
          sessionId,
          activity,
          metadata: metadata ? JSON.stringify(metadata) : null,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log session activity:', error)
    }
  }
}