import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'
import { RBACService } from '../services/RBACService'
import { AuthenticatedRequest } from './auth'

export interface AuthorizationContext {
  organizationId?: string
  resourceId?: string
  resourceOwnerId?: string
  requiredLevel?: number
}

export interface ResourceAccessRule {
  resource: string
  action: string
  level: 'organization' | 'user' | 'global'
  conditions?: (req: AuthenticatedRequest) => boolean | Promise<boolean>
}

export class AuthorizationMiddleware {
  static requirePermission(resource: string, action: string, context?: Partial<AuthorizationContext>) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401)
        }

        // Build authorization context
        const authContext: AuthorizationContext = {
          organizationId: context?.organizationId || req.user.organizationId,
          resourceId: context?.resourceId || req.params.id,
          resourceOwnerId: context?.resourceOwnerId,
          ...context
        }

        // Extract resource owner from request body or params if not provided
        if (!authContext.resourceOwnerId) {
          authContext.resourceOwnerId = req.body?.userId || req.body?.ownerId || req.params.userId
        }

        // Check permission
        const hasPermission = await RBACService.checkPermission(
          req.user.id,
          resource,
          action,
          authContext
        )

        if (!hasPermission) {
          throw new AppError('Insufficient permissions', 403)
        }

        // Store authorization context for downstream middleware
        req.authContext = authContext
        next()
      } catch (error) {
        if (error instanceof AppError) {
          next(error)
        } else {
          next(new AppError('Authorization failed', 500))
        }
      }
    }
  }

  static requireRole(allowedRoles: string | string[], organizationScope: boolean = true) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401)
        }

        const organizationId = organizationScope ? req.user.organizationId : undefined
        const userRoles = await RBACService.getUserRoles(req.user.id, organizationId)
        
        const hasAllowedRole = userRoles.some(role => 
          roles.includes(role.name) && role.isActive
        )

        if (!hasAllowedRole) {
          throw new AppError('Insufficient role permissions', 403)
        }

        req.userRoles = userRoles
        next()
      } catch (error) {
        if (error instanceof AppError) {
          next(error)
        } else {
          next(new AppError('Role authorization failed', 500))
        }
      }
    }
  }

  static requireLevel(minimumLevel: number) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401)
        }

        const userRoles = await RBACService.getUserRoles(req.user.id, req.user.organizationId)
        const highestLevel = userRoles.reduce((max, role) => 
          Math.max(max, role.level), 0
        )

        if (highestLevel < minimumLevel) {
          throw new AppError('Insufficient access level', 403)
        }

        next()
      } catch (error) {
        if (error instanceof AppError) {
          next(error)
        } else {
          next(new AppError('Level authorization failed', 500))
        }
      }
    }
  }

  static requireOwnership(resourceField: string = 'userId') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401)
        }

        // Check if user is admin or manager (can access any resource)
        const userRoles = await RBACService.getUserRoles(req.user.id, req.user.organizationId)
        const hasElevatedRole = userRoles.some(role => 
          ['admin', 'manager'].includes(role.name) && role.isActive
        )

        if (hasElevatedRole) {
          return next()
        }

        // Get resource owner ID from various sources
        let resourceOwnerId: string | undefined

        // Check request body
        if (req.body && req.body[resourceField]) {
          resourceOwnerId = req.body[resourceField]
        }

        // Check URL parameters
        if (!resourceOwnerId && req.params[resourceField]) {
          resourceOwnerId = req.params[resourceField]
        }

        // Check query parameters
        if (!resourceOwnerId && req.query[resourceField]) {
          resourceOwnerId = req.query[resourceField] as string
        }

        // If still no owner ID, try to fetch from database
        if (!resourceOwnerId && req.params.id) {
          const resourceType = req.route?.path?.split('/')[1] // Extract resource type from path
          if (resourceType) {
            try {
              const { data, error } = await req.supabase
                .from(resourceType)
                .select(resourceField)
                .eq('id', req.params.id)
                .single()

              if (!error && data) {
                resourceOwnerId = data[resourceField]
              }
            } catch (dbError) {
              console.warn('Failed to fetch resource owner:', dbError)
            }
          }
        }

        // Check ownership
        if (!resourceOwnerId || resourceOwnerId !== req.user.id) {
          throw new AppError('Access denied: resource ownership required', 403)
        }

        next()
      } catch (error) {
        if (error instanceof AppError) {
          next(error)
        } else {
          next(new AppError('Ownership authorization failed', 500))
        }
      }
    }
  }

  static requireOrganizationAccess(organizationField: string = 'organizationId') {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401)
        }

        // Get target organization ID
        let targetOrganizationId: string | undefined

        // Check request body
        if (req.body && req.body[organizationField]) {
          targetOrganizationId = req.body[organizationField]
        }

        // Check URL parameters
        if (!targetOrganizationId && req.params[organizationField]) {
          targetOrganizationId = req.params[organizationField]
        }

        // Check query parameters
        if (!targetOrganizationId && req.query[organizationField]) {
          targetOrganizationId = req.query[organizationField] as string
        }

        // Default to user's organization if not specified
        if (!targetOrganizationId) {
          targetOrganizationId = req.user.organizationId
        }

        // Check if user has access to the target organization
        const hasAccess = await RBACService.checkResourceAccess(
          req.user.id,
          'organization',
          {
            organizationId: targetOrganizationId
          }
        )

        if (!hasAccess) {
          throw new AppError('Access denied: organization access required', 403)
        }

        req.targetOrganizationId = targetOrganizationId
        next()
      } catch (error) {
        if (error instanceof AppError) {
          next(error)
        } else {
          next(new AppError('Organization authorization failed', 500))
        }
      }
    }
  }


  static conditionalAccess(condition: (req: AuthenticatedRequest) => boolean | Promise<boolean>) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401)
        }

        const hasAccess = await condition(req)

        if (!hasAccess) {
          throw new AppError('Access denied: condition not met', 403)
        }

        next()
      } catch (error) {
        if (error instanceof AppError) {
          next(error)
        } else {
          next(new AppError('Conditional authorization failed', 500))
        }
      }
    }
  }

  static createResourceRule(rule: ResourceAccessRule) {
    return AuthorizationMiddleware.conditionalAccess(async (req) => {
      const hasPermission = await RBACService.checkPermission(
        req.user!.id,
        rule.resource,
        rule.action,
        {
          organizationId: req.user!.organizationId,
          resourceId: req.params.id
        }
      )

      if (!hasPermission) {
        return false
      }

      // Apply additional conditions if specified
      if (rule.conditions) {
        return await rule.conditions(req)
      }

      return true
    })
  }

  static auditAccess(resource: string, action: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (req.user) {
          await RBACService.auditPermissionChange(
            req.user.id,
            `access_${action}`,
            resource,
            req.params.id || 'unknown',
            {
              method: req.method,
              path: req.path,
              query: req.query,
              ip: req.ip,
              userAgent: req.get('User-Agent')
            },
            req.user.id
          )
        }
        next()
      } catch (error) {
        // Continue even if audit fails
        console.error('Access audit failed:', error)
        next()
      }
    }
  }
}

// Extended AuthenticatedRequest interface
declare module './auth' {
  interface AuthenticatedRequest {
    authContext?: AuthorizationContext
    userRoles?: any[]
    targetOrganizationId?: string
    supabase?: any
  }
}

// Convenience middleware exports
export const requirePermission = AuthorizationMiddleware.requirePermission
export const requireRole = AuthorizationMiddleware.requireRole
export const requireLevel = AuthorizationMiddleware.requireLevel
export const requireOwnership = AuthorizationMiddleware.requireOwnership
export const requireOrganizationAccess = AuthorizationMiddleware.requireOrganizationAccess
export const conditionalAccess = AuthorizationMiddleware.conditionalAccess
export const createResourceRule = AuthorizationMiddleware.createResourceRule
export const auditAccess = AuthorizationMiddleware.auditAccess

// Common authorization combinations
export const requireAdmin = requireRole('admin', false)
export const requireManagerOrAdmin = requireRole(['manager', 'admin'])
export const requireSalesOrHigher = requireRole(['sales_rep', 'manager', 'admin'])
export const requireOrgAdmin = requireRole('admin', true)

// Resource-specific authorization
export const requireOrganizationManagement = requirePermission('organizations', 'update')
export const requireUserManagement = requirePermission('users', 'create')
export const requireReporting = requirePermission('reports', 'read')
export const requireSystemAccess = requirePermission('system', 'configure')