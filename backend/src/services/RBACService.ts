import { supabase } from '../config/database'
import { AppError } from '../middleware/errorHandler'

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
  isActive: boolean
}

export interface Role {
  id: string
  name: string
  description?: string
  level: number
  permissions: Permission[]
  isActive: boolean
  organizationId?: string
}

export interface UserRole {
  userId: string
  roleId: string
  organizationId?: string
  isActive: boolean
  assignedAt: Date
  assignedBy: string
}

export interface ResourcePermission {
  resource: string
  action: string
  level: 'organization' | 'user'
  conditions?: Record<string, any>
}

export class RBACService {
  // Default system roles and their hierarchy
  private static readonly SYSTEM_ROLES = {
    ADMIN: { name: 'admin', level: 100, description: 'System Administrator' },
    MANAGER: { name: 'manager', level: 75, description: 'Regional Manager' },
    SALES_REP: { name: 'sales_rep', level: 50, description: 'Sales Representative' },
    VIEWER: { name: 'viewer', level: 25, description: 'Read-only Viewer' }
  }

  // Default permissions matrix
  private static readonly DEFAULT_PERMISSIONS = [
    // User management
    { resource: 'users', action: 'create', roles: ['admin'] },
    { resource: 'users', action: 'read', roles: ['admin', 'manager', 'sales_rep', 'viewer'] },
    { resource: 'users', action: 'update', roles: ['admin', 'manager'] },
    { resource: 'users', action: 'delete', roles: ['admin'] },
    
    // Organization management
    { resource: 'organizations', action: 'create', roles: ['admin', 'manager'] },
    { resource: 'organizations', action: 'read', roles: ['admin', 'manager', 'sales_rep', 'viewer'] },
    { resource: 'organizations', action: 'update', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'organizations', action: 'delete', roles: ['admin'] },
    
    // Contact management
    { resource: 'contacts', action: 'create', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'contacts', action: 'read', roles: ['admin', 'manager', 'sales_rep', 'viewer'] },
    { resource: 'contacts', action: 'update', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'contacts', action: 'delete', roles: ['admin', 'manager'] },
    
    // Interaction management
    { resource: 'interactions', action: 'create', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'interactions', action: 'read', roles: ['admin', 'manager', 'sales_rep', 'viewer'] },
    { resource: 'interactions', action: 'update', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'interactions', action: 'delete', roles: ['admin', 'manager'] },
    
    // Opportunity management
    { resource: 'opportunities', action: 'create', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'opportunities', action: 'read', roles: ['admin', 'manager', 'sales_rep', 'viewer'] },
    { resource: 'opportunities', action: 'update', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'opportunities', action: 'delete', roles: ['admin', 'manager'] },
    
    // Product management
    { resource: 'products', action: 'create', roles: ['admin', 'manager'] },
    { resource: 'products', action: 'read', roles: ['admin', 'manager', 'sales_rep', 'viewer'] },
    { resource: 'products', action: 'update', roles: ['admin', 'manager'] },
    { resource: 'products', action: 'delete', roles: ['admin'] },
    
    // Analytics and reporting
    { resource: 'analytics', action: 'read', roles: ['admin', 'manager', 'sales_rep'] },
    { resource: 'reports', action: 'create', roles: ['admin', 'manager'] },
    { resource: 'reports', action: 'read', roles: ['admin', 'manager', 'sales_rep', 'viewer'] },
    
    // System administration
    { resource: 'system', action: 'configure', roles: ['admin'] },
    { resource: 'system', action: 'monitor', roles: ['admin', 'manager'] },
    { resource: 'audit_logs', action: 'read', roles: ['admin', 'manager'] }
  ]

  static async initializeDefaultRoles(organizationId?: string): Promise<void> {
    for (const [key, roleConfig] of Object.entries(RBACService.SYSTEM_ROLES)) {
      await RBACService.createOrUpdateRole({
        name: roleConfig.name,
        description: roleConfig.description,
        level: roleConfig.level,
        organizationId,
        permissions: RBACService.DEFAULT_PERMISSIONS
          .filter(p => p.roles.includes(roleConfig.name))
          .map(p => ({
            resource: p.resource,
            action: p.action,
            name: `${p.resource}:${p.action}`,
            description: `${p.action} ${p.resource}`,
            isActive: true
          }))
      })
    }
  }

  static async createOrUpdateRole(roleData: {
    name: string
    description?: string
    level: number
    organizationId?: string
    permissions: Array<{
      resource: string
      action: string
      name: string
      description?: string
      isActive: boolean
    }>
  }): Promise<Role> {
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleData.name)
      .eq('organizationId', roleData.organizationId || null)
      .single()

    if (existingRole) {
      // Update existing role
      const { data: updatedRole, error } = await supabase
        .from('roles')
        .update({
          description: roleData.description,
          level: roleData.level,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingRole.id)
        .select()
        .single()

      if (error) {
        throw new AppError(`Failed to update role: ${error.message}`, 500)
      }

      return updatedRole
    }

    // Create new role
    const { data: newRole, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
        organizationId: roleData.organizationId,
        isActive: true
      })
      .select()
      .single()

    if (roleError) {
      throw new AppError(`Failed to create role: ${roleError.message}`, 500)
    }

    // Create permissions
    for (const permissionData of roleData.permissions) {
      await RBACService.createOrUpdatePermission({
        ...permissionData,
        roleId: newRole.id
      })
    }

    return newRole
  }

  static async createOrUpdatePermission(permissionData: {
    name: string
    resource: string
    action: string
    description?: string
    isActive: boolean
    roleId?: string
  }): Promise<Permission> {
    // Check if permission already exists
    const { data: existingPermission } = await supabase
      .from('permissions')
      .select('id')
      .eq('resource', permissionData.resource)
      .eq('action', permissionData.action)
      .single()

    if (existingPermission) {
      // Update existing permission
      const { data: updatedPermission, error } = await supabase
        .from('permissions')
        .update({
          name: permissionData.name,
          description: permissionData.description,
          isActive: permissionData.isActive,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingPermission.id)
        .select()
        .single()

      if (error) {
        throw new AppError(`Failed to update permission: ${error.message}`, 500)
      }

      // Link to role if provided
      if (permissionData.roleId) {
        await supabase
          .from('role_permissions')
          .upsert({
            roleId: permissionData.roleId,
            permissionId: existingPermission.id
          })
      }

      return updatedPermission
    }

    // Create new permission
    const { data: newPermission, error: permissionError } = await supabase
      .from('permissions')
      .insert({
        name: permissionData.name,
        resource: permissionData.resource,
        action: permissionData.action,
        description: permissionData.description,
        isActive: permissionData.isActive
      })
      .select()
      .single()

    if (permissionError) {
      throw new AppError(`Failed to create permission: ${permissionError.message}`, 500)
    }

    // Link to role if provided
    if (permissionData.roleId) {
      await supabase
        .from('role_permissions')
        .insert({
          roleId: permissionData.roleId,
          permissionId: newPermission.id
        })
    }

    return newPermission
  }

  static async assignUserRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    options: {
      organizationId?: string
      expiresAt?: Date
    } = {}
  ): Promise<UserRole> {
    // Validate user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, isActive')
      .eq('id', userId)
      .single()

    if (userError || !userData || !userData.isActive) {
      throw new AppError('Invalid or inactive user', 400)
    }

    // Validate role exists
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, name, isActive')
      .eq('id', roleId)
      .single()

    if (roleError || !roleData || !roleData.isActive) {
      throw new AppError('Invalid or inactive role', 400)
    }

    // Check if user already has this role
    const { data: existingAssignment } = await supabase
      .from('user_roles')
      .select('id')
      .eq('userId', userId)
      .eq('roleId', roleId)
      .eq('organizationId', options.organizationId || null)
      .eq('isActive', true)
      .single()

    if (existingAssignment) {
      throw new AppError('User already has this role', 400)
    }

    // Create role assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('user_roles')
      .insert({
        userId,
        roleId,
        organizationId: options.organizationId,
        assignedBy,
        assignedAt: new Date().toISOString(),
        expiresAt: options.expiresAt?.toISOString(),
        isActive: true
      })
      .select()
      .single()

    if (assignmentError) {
      throw new AppError(`Failed to assign role: ${assignmentError.message}`, 500)
    }

    return {
      userId: assignment.userId,
      roleId: assignment.roleId,
      organizationId: assignment.organizationId,
      isActive: assignment.isActive,
      assignedAt: new Date(assignment.assignedAt),
      assignedBy: assignment.assignedBy
    }
  }

  static async revokeUserRole(
    userId: string,
    roleId: string,
    revokedBy: string,
    organizationId?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .update({
        isActive: false,
        revokedAt: new Date().toISOString(),
        revokedBy
      })
      .eq('userId', userId)
      .eq('roleId', roleId)
      .eq('organizationId', organizationId || null)
      .eq('isActive', true)

    if (error) {
      throw new AppError(`Failed to revoke role: ${error.message}`, 500)
    }
  }

  static async getUserRoles(userId: string, organizationId?: string): Promise<Role[]> {
    let query = supabase
      .from('user_roles')
      .select(`
        roles (
          id, name, description, level, isActive,
          role_permissions (
            permissions (
              id, name, resource, action, description, isActive
            )
          )
        )
      `)
      .eq('userId', userId)
      .eq('isActive', true)

    if (organizationId) {
      query = query.eq('organizationId', organizationId)
    }

    const { data: userRoles, error } = await query

    if (error) {
      throw new AppError(`Failed to get user roles: ${error.message}`, 500)
    }

    return userRoles?.map(ur => ({
      id: ur.roles.id,
      name: ur.roles.name,
      description: ur.roles.description,
      level: ur.roles.level,
      isActive: ur.roles.isActive,
      permissions: ur.roles.role_permissions?.map((rp: any) => rp.permissions) || []
    })) || []
  }

  static async getUserPermissions(userId: string, organizationId?: string): Promise<Permission[]> {
    const roles = await RBACService.getUserRoles(userId, organizationId)
    const allPermissions: Permission[] = []

    for (const role of roles) {
      if (role.isActive) {
        allPermissions.push(...role.permissions.filter(p => p.isActive))
      }
    }

    // Remove duplicates
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    )

    return uniquePermissions
  }

  static async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context: {
      organizationId?: string
      resourceId?: string
      resourceOwnerId?: string
    } = {}
  ): Promise<boolean> {
    try {
      const permissions = await RBACService.getUserPermissions(userId, context.organizationId)
      
      // Check if user has the required permission
      const hasPermission = permissions.some(p =>
        p.resource === resource &&
        p.action === action &&
        p.isActive
      )

      if (!hasPermission) {
        return false
      }

      // Check resource-level access
      return RBACService.checkResourceAccess(userId, resource, context)
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }

  static async checkResourceAccess(
    userId: string,
    resource: string,
    context: {
      organizationId?: string
      resourceId?: string
      resourceOwnerId?: string
    } = {}
  ): Promise<boolean> {
    // Get user information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organizationId, role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return false
    }

    // Check organization-level access
    if (context.organizationId && userData.organizationId !== context.organizationId) {
      // Check if user has cross-organization permissions
      const roles = await RBACService.getUserRoles(userId)
      const hasAdminRole = roles.some(r => r.name === 'admin' && r.isActive)
      
      if (!hasAdminRole) {
        return false
      }
    }

    // Check resource ownership
    if (context.resourceOwnerId && context.resourceOwnerId !== userId) {
      // Check if user can access resources owned by others
      const roles = await RBACService.getUserRoles(userId, userData.organizationId)
      const canAccessOthersData = roles.some(r => 
        (r.name === 'admin' || r.name === 'manager') && r.isActive
      )
      
      if (!canAccessOthersData) {
        return false
      }
    }

    return true
  }

  static async getEffectivePermissions(
    userId: string,
    organizationId?: string
  ): Promise<{
    user: any
    roles: Role[]
    permissions: Permission[]
    accessLevel: string
    restrictions: string[]
  }> {
    const [userData, roles, permissions] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      RBACService.getUserRoles(userId, organizationId),
      RBACService.getUserPermissions(userId, organizationId)
    ])

    if (userData.error || !userData.data) {
      throw new AppError('User not found', 404)
    }

    // Determine access level
    const highestRole = roles.reduce((highest, role) => 
      role.level > (highest?.level || 0) ? role : highest
    , roles[0])

    const accessLevel = highestRole?.name || 'none'

    // Determine restrictions
    const restrictions: string[] = []
    
    if (accessLevel === 'sales_rep') {
      restrictions.push('no_admin_functions')
    }
    
    if (accessLevel === 'viewer') {
      restrictions.push('read_only')
      restrictions.push('no_create_update_delete')
    }

    if (!userData.data.emailVerified) {
      restrictions.push('email_verification_required')
    }

    return {
      user: userData.data,
      roles: roles.filter(r => r.isActive),
      permissions: permissions.filter(p => p.isActive),
      accessLevel,
      restrictions
    }
  }

  static async auditPermissionChange(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes: any,
    performedBy: string
  ): Promise<void> {
    try {
      await supabase
        .from('permission_audit_logs')
        .insert({
          userId,
          action,
          resourceType,
          resourceId,
          changes: JSON.stringify(changes),
          performedBy,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to audit permission change:', error)
    }
  }
}