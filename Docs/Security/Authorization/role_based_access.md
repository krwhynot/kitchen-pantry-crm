# Role-Based Access Control (RBAC)

## Overview

Kitchen Pantry CRM implements a **hierarchical role-based access control system** designed for food service industry organizational structures with delegation support and flexible permission assignment.

## Role Hierarchy

### Admin Role
- **Full system access** to all data and settings
- **User management** capabilities
- **System configuration** and security settings
- **Audit log access** and compliance reporting
- **Financial data** and performance metrics access

### Manager Role
- **Team data access** within reporting hierarchy
- **Performance metrics** for managed users
- **User management** for direct reports
- **Quota setting** and performance review capabilities
- **Team coordination** and assignment management

### Sales Representative Role
- **Assigned organization** access only
- **Contact and interaction** management
- **Sales pipeline** management
- **No visibility** into other users' data
- **Organization-specific** data access

### Read-Only Role
- **View-only access** to assigned data
- **No modification** permissions
- **Reporting and audit** purposes
- **Integration account** support
- **Temporary user** access

## Permission Matrix

### Organization Permissions
```typescript
// Organization access levels
ORGANIZATIONS_VIEW = 'organizations:view'
ORGANIZATIONS_CREATE = 'organizations:create'
ORGANIZATIONS_UPDATE = 'organizations:update'
ORGANIZATIONS_DELETE = 'organizations:delete'
ORGANIZATIONS_VIEW_ALL = 'organizations:view_all'
```

### Contact Permissions
```typescript
// Contact management permissions
CONTACTS_VIEW = 'contacts:view'
CONTACTS_CREATE = 'contacts:create'
CONTACTS_UPDATE = 'contacts:update'
CONTACTS_DELETE = 'contacts:delete'
CONTACTS_VIEW_ALL = 'contacts:view_all'
```

### System Permissions
```typescript
// System-level permissions
SYSTEM_ADMIN = 'system:admin'
SYSTEM_AUDIT = 'system:audit'
SYSTEM_REPORTS = 'system:reports'
SYSTEM_SETTINGS = 'system:settings'
```

## Permission Service Implementation

```typescript
export class PermissionService {
  private userPermissions: Permission[] = []

  async loadUserPermissions(user: AuthUser) {
    const role = user.app_metadata?.role || 'read_only'
    this.userPermissions = ROLE_PERMISSIONS[role] || []
  }

  hasPermission(permission: Permission): boolean {
    return this.userPermissions.includes(permission)
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  canAccessResource(resource: string, action: string): boolean {
    const permission = `${resource}:${action}` as Permission
    return this.hasPermission(permission)
  }
}
```

## Role Assignment Process

### Initial Assignment
- **Invitation-based** role assignment
- **Organization context** consideration
- **Manager approval** for elevated roles
- **Automatic defaults** for new users

### Role Modification
- **Admin privileges** required for role changes
- **Audit logging** for all role modifications
- **Immediate effect** on user permissions
- **Session refresh** to update tokens

## Access Control Enforcement

### Frontend Protection
- **Component-level** permission checks
- **Route guards** for protected areas
- **UI element** visibility control
- **Real-time** permission validation

### Backend Protection
- **Middleware** permission validation
- **API endpoint** protection
- **Database query** filtering
- **Audit logging** for access attempts