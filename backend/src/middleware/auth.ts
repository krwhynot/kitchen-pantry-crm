import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/database'
import { AppError } from './errorHandler'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    organizationId: string
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      throw new AppError('Access token is required', 401)
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401)
    }

    // Get user details from our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new AppError('User not found in system', 401)
    }

    // Attach user info to request
    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      organizationId: userData.organization_id
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else {
      next(new AppError('Authentication failed', 401))
    }
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401)
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403)
    }

    next()
  }
}

export const requireAdmin = requireRole(['admin'])
export const requireManagerOrAdmin = requireRole(['manager', 'admin'])
export const requireAnyRole = requireRole(['sales_rep', 'manager', 'admin'])

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next()
    }

    // Try to authenticate, but don't fail if token is invalid
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (!error && user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, organization_id')
        .eq('id', user.id)
        .single()

      if (userData) {
        req.user = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          organizationId: userData.organization_id
        }
      }
    }

    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}