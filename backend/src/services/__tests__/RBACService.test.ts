import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { RBACService } from '../RBACService'
import { supabase } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'

// Mock the dependencies
jest.mock('../../config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
          in: jest.fn(() => ({
            order: jest.fn()
          }))
        })),
        or: jest.fn(() => ({
          order: jest.fn()
        })),
        order: jest.fn(),
        gte: jest.fn(() => ({
          order: jest.fn()
        })),
        lte: jest.fn(() => ({
          order: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        })),
        onConflict: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn()
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

jest.mock('../../middleware/errorHandler', () => ({
  AppError: jest.fn().mockImplementation((message: string, statusCode: number) => {
    const error = new Error(message) as any
    error.statusCode = statusCode
    return error
  })
}))

describe('RBACService', () => {
  let mockSupabase: any

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'sales_rep',
    organizationId: 'org-1',
    territory: 'west-coast'
  }

  const mockRole = {
    id: 'role-1',
    name: 'sales_rep',
    displayName: 'Sales Representative',
    description: 'Sales team member',
    level: 50,
    organizationId: 'org-1',
    isActive: true,
    permissions: ['contacts:read', 'opportunities:create']
  }

  const mockPermission = {
    id: 'perm-1',
    name: 'contacts:read',
    resourceType: 'contacts',
    action: 'read',
    description: 'Read contact information',
    conditions: null,
    isActive: true
  }

  const mockUserRole = {
    id: 'user-role-1',
    userId: 'user-1',
    roleId: 'role-1',
    assignedBy: 'admin-1',
    assignedAt: '2023-01-01T00:00:00Z',
    isActive: true,
    expiresAt: null,
    conditions: null
  }

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      or: jest.fn(),
      in: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      onConflict: jest.fn()
    }

    // Set up the chain of mocked methods
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.or.mockReturnValue(mockSupabase)
    mockSupabase.in.mockReturnValue(mockSupabase)
    mockSupabase.gte.mockReturnValue(mockSupabase)
    mockSupabase.lte.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.delete.mockReturnValue(mockSupabase)
    mockSupabase.upsert.mockReturnValue(mockSupabase)
    mockSupabase.onConflict.mockReturnValue(mockSupabase)

    // Mock the actual supabase object
    jest.mocked(supabase).from.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initializeDefaultRoles', () => {
    it('should create default system roles', async () => {
      const mockRoles = [
        { id: 'role-1', name: 'admin', level: 100 },
        { id: 'role-2', name: 'manager', level: 75 },
        { id: 'role-3', name: 'sales_rep', level: 50 },
        { id: 'role-4', name: 'viewer', level: 25 }
      ]

      mockSupabase.upsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockRoles,
            error: null
          })
        })
      })

      const result = await RBACService.initializeDefaultRoles('org-1')

      expect(supabase.from).toHaveBeenCalledWith('roles')
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'admin',
            displayName: 'Administrator',
            level: 100,
            organizationId: 'org-1'
          }),
          expect.objectContaining({
            name: 'manager',
            displayName: 'Manager',
            level: 75,
            organizationId: 'org-1'
          }),
          expect.objectContaining({
            name: 'sales_rep',
            displayName: 'Sales Representative',
            level: 50,
            organizationId: 'org-1'
          }),
          expect.objectContaining({
            name: 'viewer',
            displayName: 'Viewer',
            level: 25,
            organizationId: 'org-1'
          })
        ])
      )
      expect(result).toEqual(mockRoles)
    })

    it('should handle role creation errors', async () => {
      const mockError = new Error('Role creation failed')
      mockSupabase.upsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      })

      await expect(RBACService.initializeDefaultRoles('org-1')).rejects.toThrow('Role creation failed')
    })
  })

  describe('createOrUpdateRole', () => {
    it('should create a new role with permissions', async () => {
      const roleData = {
        name: 'custom_role',
        displayName: 'Custom Role',
        description: 'Custom role description',
        level: 60,
        permissions: ['contacts:read', 'opportunities:read']
      }

      mockSupabase.upsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockRole, ...roleData },
            error: null
          })
        })
      })

      const result = await RBACService.createOrUpdateRole(roleData, 'org-1')

      expect(supabase.from).toHaveBeenCalledWith('roles')
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'custom_role',
          displayName: 'Custom Role',
          description: 'Custom role description',
          level: 60,
          organizationId: 'org-1',
          permissions: ['contacts:read', 'opportunities:read']
        })
      )
      expect(result).toEqual(expect.objectContaining(roleData))
    })

    it('should update existing role', async () => {
      const roleData = {
        name: 'sales_rep',
        displayName: 'Updated Sales Rep',
        permissions: ['contacts:read', 'contacts:update']
      }

      mockSupabase.upsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockRole, ...roleData },
            error: null
          })
        })
      })

      const result = await RBACService.createOrUpdateRole(roleData, 'org-1')

      expect(result).toEqual(expect.objectContaining(roleData))
    })

    it('should handle role creation errors', async () => {
      const roleData = {
        name: 'invalid_role',
        displayName: 'Invalid Role'
      }

      mockSupabase.upsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Role creation failed')
          })
        })
      })

      await expect(RBACService.createOrUpdateRole(roleData, 'org-1')).rejects.toThrow('Role creation failed')
    })
  })

  describe('createOrUpdatePermission', () => {
    it('should create a new permission', async () => {
      const permissionData = {
        name: 'products:create',
        resourceType: 'products',
        action: 'create',
        description: 'Create product records',
        conditions: { scope: 'organization' }
      }

      mockSupabase.upsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockPermission, ...permissionData },
            error: null
          })
        })
      })

      const result = await RBACService.createOrUpdatePermission(permissionData)

      expect(supabase.from).toHaveBeenCalledWith('permissions')
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'products:create',
          resourceType: 'products',
          action: 'create',
          description: 'Create product records',
          conditions: { scope: 'organization' }
        })
      )
      expect(result).toEqual(expect.objectContaining(permissionData))
    })

    it('should handle permission creation errors', async () => {
      const permissionData = {
        name: 'invalid:permission',
        resourceType: 'invalid',
        action: 'invalid'
      }

      mockSupabase.upsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Permission creation failed')
          })
        })
      })

      await expect(RBACService.createOrUpdatePermission(permissionData)).rejects.toThrow('Permission creation failed')
    })
  })

  describe('getUserRoles', () => {
    it('should return user roles with permissions', async () => {
      const mockUserRoles = [
        { 
          ...mockUserRole, 
          roles: { 
            ...mockRole, 
            rolePermissions: [
              { permissions: mockPermission }
            ]
          }
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockUserRoles,
        error: null
      })

      const result = await RBACService.getUserRoles('user-1')

      expect(supabase.from).toHaveBeenCalledWith('user_roles')
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        roles (
          *,
          rolePermissions:role_permissions (
            permissions (*)
          )
        )
      `)
      expect(mockSupabase.eq).toHaveBeenCalledWith('userId', 'user-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('isActive', true)
      expect(result).toEqual(mockUserRoles)
    })

    it('should handle user roles fetch errors', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error('User roles fetch failed')
      })

      await expect(RBACService.getUserRoles('user-1')).rejects.toThrow('User roles fetch failed')
    })

    it('should return empty array for user with no roles', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await RBACService.getUserRoles('user-1')

      expect(result).toEqual([])
    })
  })

  describe('getUserPermissions', () => {
    it('should return all user permissions', async () => {
      const mockUserPermissions = [
        { 
          ...mockUserRole, 
          roles: { 
            ...mockRole, 
            rolePermissions: [
              { permissions: mockPermission }
            ]
          }
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockUserPermissions,
        error: null
      })

      const result = await RBACService.getUserPermissions('user-1')

      expect(supabase.from).toHaveBeenCalledWith('user_roles')
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        roles (
          rolePermissions:role_permissions (
            permissions (*)
          )
        )
      `)
      expect(result).toEqual(expect.arrayContaining([mockPermission]))
    })

    it('should handle duplicate permissions', async () => {
      const mockUserPermissions = [
        { 
          roles: { 
            rolePermissions: [
              { permissions: mockPermission },
              { permissions: mockPermission } // Duplicate
            ]
          }
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockUserPermissions,
        error: null
      })

      const result = await RBACService.getUserPermissions('user-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockPermission)
    })

    it('should handle permissions fetch errors', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error('Permissions fetch failed')
      })

      await expect(RBACService.getUserPermissions('user-1')).rejects.toThrow('Permissions fetch failed')
    })
  })

  describe('checkPermission', () => {
    it('should return true for valid permission', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([mockPermission])

      const result = await RBACService.checkPermission('user-1', 'contacts:read')

      expect(RBACService.getUserPermissions).toHaveBeenCalledWith('user-1')
      expect(result).toBe(true)
    })

    it('should return false for invalid permission', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([mockPermission])

      const result = await RBACService.checkPermission('user-1', 'contacts:delete')

      expect(result).toBe(false)
    })

    it('should return false for user with no permissions', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([])

      const result = await RBACService.checkPermission('user-1', 'contacts:read')

      expect(result).toBe(false)
    })

    it('should handle permission check errors', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockRejectedValue(new Error('Permission check failed'))

      await expect(RBACService.checkPermission('user-1', 'contacts:read')).rejects.toThrow('Permission check failed')
    })
  })

  describe('assignUserRole', () => {
    it('should assign role to user successfully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockUserRole,
        error: null
      })

      const result = await RBACService.assignUserRole('user-1', 'role-1', 'admin-1')

      expect(supabase.from).toHaveBeenCalledWith('user_roles')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        userId: 'user-1',
        roleId: 'role-1',
        assignedBy: 'admin-1',
        assignedAt: expect.any(String),
        isActive: true
      })
      expect(result).toEqual(mockUserRole)
    })

    it('should assign role with expiration date', async () => {
      const expiresAt = new Date('2024-12-31T23:59:59Z')
      mockSupabase.single.mockResolvedValue({
        data: { ...mockUserRole, expiresAt: expiresAt.toISOString() },
        error: null
      })

      const result = await RBACService.assignUserRole('user-1', 'role-1', 'admin-1', expiresAt)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        userId: 'user-1',
        roleId: 'role-1',
        assignedBy: 'admin-1',
        assignedAt: expect.any(String),
        isActive: true,
        expiresAt: expiresAt.toISOString()
      })
      expect(result.expiresAt).toBe(expiresAt.toISOString())
    })

    it('should assign role with conditions', async () => {
      const conditions = { territory: 'west-coast' }
      mockSupabase.single.mockResolvedValue({
        data: { ...mockUserRole, conditions },
        error: null
      })

      const result = await RBACService.assignUserRole('user-1', 'role-1', 'admin-1', undefined, conditions)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        userId: 'user-1',
        roleId: 'role-1',
        assignedBy: 'admin-1',
        assignedAt: expect.any(String),
        isActive: true,
        conditions
      })
      expect(result.conditions).toEqual(conditions)
    })

    it('should handle role assignment errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Role assignment failed')
      })

      await expect(RBACService.assignUserRole('user-1', 'role-1', 'admin-1')).rejects.toThrow('Role assignment failed')
    })
  })

  describe('revokeUserRole', () => {
    it('should revoke user role successfully', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: null
      })

      await RBACService.revokeUserRole('user-1', 'role-1', 'admin-1')

      expect(supabase.from).toHaveBeenCalledWith('user_roles')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        isActive: false,
        revokedBy: 'admin-1',
        revokedAt: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('userId', 'user-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('roleId', 'role-1')
    })

    it('should handle role revocation errors', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: new Error('Role revocation failed')
      })

      await expect(RBACService.revokeUserRole('user-1', 'role-1', 'admin-1')).rejects.toThrow('Role revocation failed')
    })
  })

  describe('checkResourceAccess', () => {
    it('should allow access for valid permission and conditions', async () => {
      const mockResourcePermission = {
        permission: mockPermission,
        conditions: { organizationId: 'org-1' }
      }

      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([mockPermission])

      const result = await RBACService.checkResourceAccess(
        'user-1',
        'contacts',
        'read',
        { organizationId: 'org-1' },
        mockUser
      )

      expect(result).toBe(true)
    })

    it('should deny access for invalid permission', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([])

      const result = await RBACService.checkResourceAccess(
        'user-1',
        'contacts',
        'delete',
        { organizationId: 'org-1' },
        mockUser
      )

      expect(result).toBe(false)
    })

    it('should deny access for mismatched organization', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([mockPermission])

      const result = await RBACService.checkResourceAccess(
        'user-1',
        'contacts',
        'read',
        { organizationId: 'other-org' },
        mockUser
      )

      expect(result).toBe(false)
    })

    it('should handle territory-based access control', async () => {
      const territoryPermission = {
        ...mockPermission,
        conditions: { requireOwnTerritory: true }
      }

      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([territoryPermission])

      const result = await RBACService.checkResourceAccess(
        'user-1',
        'contacts',
        'read',
        { territory: 'west-coast' },
        mockUser
      )

      expect(result).toBe(true)
    })

    it('should handle resource access errors', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockRejectedValue(new Error('Resource access check failed'))

      await expect(RBACService.checkResourceAccess(
        'user-1',
        'contacts',
        'read',
        { organizationId: 'org-1' },
        mockUser
      )).rejects.toThrow('Resource access check failed')
    })
  })

  describe('getEffectivePermissions', () => {
    it('should return effective permissions with context', async () => {
      const mockEffectivePermissions = {
        permissions: [mockPermission],
        roles: [mockRole],
        organizationId: 'org-1',
        territory: 'west-coast',
        effectiveFrom: expect.any(String),
        expiresAt: null
      }

      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([mockPermission])
      jest.spyOn(RBACService, 'getUserRoles').mockResolvedValue([{
        ...mockUserRole,
        roles: mockRole
      }])

      const result = await RBACService.getEffectivePermissions('user-1', mockUser)

      expect(result).toEqual(expect.objectContaining({
        permissions: [mockPermission],
        roles: [mockRole],
        organizationId: 'org-1',
        territory: 'west-coast'
      }))
    })

    it('should handle users with no roles', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([])
      jest.spyOn(RBACService, 'getUserRoles').mockResolvedValue([])

      const result = await RBACService.getEffectivePermissions('user-1', mockUser)

      expect(result).toEqual(expect.objectContaining({
        permissions: [],
        roles: [],
        organizationId: 'org-1',
        territory: 'west-coast'
      }))
    })

    it('should handle effective permissions errors', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockRejectedValue(new Error('Effective permissions failed'))

      await expect(RBACService.getEffectivePermissions('user-1', mockUser)).rejects.toThrow('Effective permissions failed')
    })
  })

  describe('auditPermissionChange', () => {
    it('should audit permission change successfully', async () => {
      const auditData = {
        userId: 'user-1',
        actionType: 'role_assigned',
        resourceType: 'user_roles',
        resourceId: 'user-role-1',
        changes: { roleId: 'role-1', assignedBy: 'admin-1' },
        performedBy: 'admin-1'
      }

      mockSupabase.single.mockResolvedValue({
        data: { id: 'audit-1', ...auditData },
        error: null
      })

      const result = await RBACService.auditPermissionChange(auditData)

      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...auditData,
        timestamp: expect.any(String)
      })
      expect(result).toEqual(expect.objectContaining(auditData))
    })

    it('should handle audit logging errors', async () => {
      const auditData = {
        userId: 'user-1',
        actionType: 'role_assigned',
        resourceType: 'user_roles',
        resourceId: 'user-role-1',
        changes: {},
        performedBy: 'admin-1'
      }

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Audit logging failed')
      })

      await expect(RBACService.auditPermissionChange(auditData)).rejects.toThrow('Audit logging failed')
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle null/undefined user IDs', async () => {
      await expect(RBACService.getUserRoles(null as any)).rejects.toThrow()
      await expect(RBACService.getUserPermissions(undefined as any)).rejects.toThrow()
    })

    it('should handle empty permission arrays', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([])

      const result = await RBACService.checkPermission('user-1', 'any:permission')

      expect(result).toBe(false)
    })

    it('should handle malformed permission names', async () => {
      jest.spyOn(RBACService, 'getUserPermissions').mockResolvedValue([mockPermission])

      const result = await RBACService.checkPermission('user-1', 'invalid-permission-format')

      expect(result).toBe(false)
    })

    it('should handle expired user roles', async () => {
      const expiredRole = {
        ...mockUserRole,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        roles: mockRole
      }

      jest.spyOn(RBACService, 'getUserRoles').mockResolvedValue([expiredRole])

      const result = await RBACService.getEffectivePermissions('user-1', mockUser)

      expect(result.roles).toHaveLength(0) // Expired roles should be filtered out
    })

    it('should handle database connection errors', async () => {
      mockSupabase.order.mockRejectedValue(new Error('Database connection failed'))

      await expect(RBACService.getUserRoles('user-1')).rejects.toThrow('Database connection failed')
    })
  })
})