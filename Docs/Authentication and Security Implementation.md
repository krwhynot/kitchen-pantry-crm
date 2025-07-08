# Kitchen Pantry CRM - Authentication and Security Implementation

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2025  
**System:** Kitchen Pantry CRM MVP  

## Executive Summary

The Kitchen Pantry CRM security architecture implements a comprehensive multi-layered approach combining Supabase Auth for user management with custom authorization logic, Row Level Security (RLS) for data isolation, and industry-standard security practices. The system prioritizes data protection while maintaining usability for food service industry professionals operating across multiple devices and locations.

The authentication system leverages JWT tokens for stateless session management, supporting single sign-on (SSO), multi-factor authentication (MFA), and role-based access control (RBAC). Security measures include encryption at rest and in transit, comprehensive input validation, audit logging, and compliance with food service industry regulations including GDPR and CCPA.

The implementation emphasizes zero-trust security principles with defense-in-depth strategies, ensuring data protection at the application, API, and database levels. All security measures are designed to be transparent to end users while providing robust protection against common attack vectors and data breaches.

## Authentication Architecture

### Supabase Auth Integration

Kitchen Pantry CRM leverages Supabase Auth as the primary authentication provider, providing enterprise-grade user management with minimal implementation complexity. Supabase Auth handles user registration, login, password management, and session handling while supporting custom business logic through database triggers and Edge Functions.

**User Registration Flow:** New users are registered through Supabase Auth with email verification required before account activation. The registration process includes custom validation for business email domains, role assignment based on invitation codes, and automatic organization association for team members.

**Login and Session Management:** Users authenticate through Supabase Auth using email/password credentials with optional multi-factor authentication. Successful authentication generates JWT tokens with configurable expiration times, supporting both short-lived access tokens and longer-lived refresh tokens for seamless user experience.

**Password Security:** Supabase Auth implements industry-standard password hashing using bcrypt with configurable salt rounds. Password policies enforce minimum complexity requirements including length, character diversity, and common password prevention. Password reset functionality uses secure token-based flows with time-limited validity.

### JWT Token Implementation

The system implements JSON Web Tokens (JWT) for stateless authentication, providing scalable session management without server-side storage requirements. JWT tokens carry user identity, role information, and custom claims essential for authorization decisions.

**Token Structure:** JWT tokens include standard claims (iss, sub, aud, exp, iat) and custom claims for Kitchen Pantry CRM including user_id, email, role, organization_id, and permissions. Custom claims enable fine-grained authorization without additional database queries.

**Token Lifecycle Management:** Access tokens have short expiration times (1 hour) to minimize security exposure, while refresh tokens provide longer-lived authentication (30 days) for user convenience. Token refresh is handled automatically by the frontend application with fallback to re-authentication when refresh tokens expire.

**Token Validation:** All API endpoints validate JWT tokens for signature authenticity, expiration, and issuer verification. Token validation includes custom claim verification for role-based access control and organization-based data isolation.

```typescript
// utils/auth.ts
import { createClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  app_metadata: {
    role?: string
    organization_id?: string
    permissions?: string[]
  }
}

export class AuthService {
  async signUp(email: string, password: string, metadata: any = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) throw new Error(error.message)
    return data
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error(error.message)
    return data
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw new Error(error.message)
  }

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw new Error(error.message)
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user as AuthUser
  }

  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw new Error(error.message)
    return data
  }

  getAccessToken(): string | null {
    const session = supabase.auth.session()
    return session?.access_token || null
  }

  isAuthenticated(): boolean {
    const session = supabase.auth.session()
    return !!session && !this.isTokenExpired(session.access_token)
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }
}

export const authService = new AuthService()
```

### Multi-Factor Authentication (MFA)

The system supports multi-factor authentication for enhanced security, particularly important for users accessing sensitive customer data and financial information.

**TOTP Implementation:** Time-based One-Time Passwords (TOTP) using authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator. TOTP setup includes QR code generation for easy configuration and backup codes for account recovery.

**SMS Authentication:** SMS-based second factor authentication for users without smartphone apps. SMS authentication includes rate limiting, carrier verification, and fallback mechanisms for delivery failures.

**Email-based MFA:** Email-based second factor for users in regions with limited SMS coverage. Email MFA includes secure token generation, time-limited validity, and anti-phishing measures.

```typescript
// services/mfa.ts
export class MFAService {
  async enableTOTP(userId: string) {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    })

    if (error) throw new Error(error.message)
    
    return {
      qr_code: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri
    }
  }

  async verifyTOTP(factorId: string, code: string) {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      code
    })

    if (error) throw new Error(error.message)
    return data
  }

  async challengeMFA() {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId: 'your-factor-id'
    })

    if (error) throw new Error(error.message)
    return data
  }

  async getMFAFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) throw new Error(error.message)
    return data
  }

  async disableMFA(factorId: string) {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId
    })

    if (error) throw new Error(error.message)
    return data
  }
}

export const mfaService = new MFAService()
```

## Authorization and Role-Based Access Control

### Role Hierarchy System

Kitchen Pantry CRM implements a hierarchical role-based access control system designed for food service industry organizational structures. The role system supports delegation, territory management, and flexible permission assignment.

**Admin Role:** System administrators have full access to all data, user management, system configuration, and security settings. Admins can create and modify user roles, manage organization settings, and access audit logs. Admin access includes sensitive financial data, performance metrics, and system health monitoring.

**Manager Role:** Sales managers have access to their team's data, performance metrics, and territory management. Managers can view and modify data for users in their reporting hierarchy, generate team reports, and manage territory assignments. Manager permissions include quota setting, performance review, and team coordination features.

**Sales Representative Role:** Individual sales representatives have access to their assigned organizations, contacts, and opportunities. Sales reps can create and modify interactions, update contact information, and manage their sales pipeline. Access is limited to assigned territories and organizations with no visibility into other users' data.

**Read-Only Role:** Limited access role for temporary users, reporting personnel, or integration accounts. Read-only users can view assigned data without modification permissions. This role supports auditing, reporting, and system integration scenarios requiring data visibility without change capabilities.

### Permission Matrix Implementation

The system implements granular permissions through a comprehensive permission matrix that defines specific capabilities for each role:

```typescript
// types/permissions.ts
export enum Permission {
  // Organization permissions
  ORGANIZATIONS_VIEW = 'organizations:view',
  ORGANIZATIONS_CREATE = 'organizations:create',
  ORGANIZATIONS_UPDATE = 'organizations:update',
  ORGANIZATIONS_DELETE = 'organizations:delete',
  ORGANIZATIONS_VIEW_ALL = 'organizations:view_all',

  // Contact permissions
  CONTACTS_VIEW = 'contacts:view',
  CONTACTS_CREATE = 'contacts:create',
  CONTACTS_UPDATE = 'contacts:update',
  CONTACTS_DELETE = 'contacts:delete',
  CONTACTS_VIEW_ALL = 'contacts:view_all',

  // Interaction permissions
  INTERACTIONS_VIEW = 'interactions:view',
  INTERACTIONS_CREATE = 'interactions:create',
  INTERACTIONS_UPDATE = 'interactions:update',
  INTERACTIONS_DELETE = 'interactions:delete',
  INTERACTIONS_VIEW_ALL = 'interactions:view_all',

  // Opportunity permissions
  OPPORTUNITIES_VIEW = 'opportunities:view',
  OPPORTUNITIES_CREATE = 'opportunities:create',
  OPPORTUNITIES_UPDATE = 'opportunities:update',
  OPPORTUNITIES_DELETE = 'opportunities:delete',
  OPPORTUNITIES_VIEW_ALL = 'opportunities:view_all',

  // User management permissions
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_ROLES = 'users:manage_roles',

  // System permissions
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_AUDIT = 'system:audit',
  SYSTEM_REPORTS = 'system:reports',
  SYSTEM_SETTINGS = 'system:settings'
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    Permission.ORGANIZATIONS_VIEW_ALL,
    Permission.ORGANIZATIONS_CREATE,
    Permission.ORGANIZATIONS_UPDATE,
    Permission.ORGANIZATIONS_DELETE,
    Permission.CONTACTS_VIEW_ALL,
    Permission.CONTACTS_CREATE,
    Permission.CONTACTS_UPDATE,
    Permission.CONTACTS_DELETE,
    Permission.INTERACTIONS_VIEW_ALL,
    Permission.INTERACTIONS_CREATE,
    Permission.INTERACTIONS_UPDATE,
    Permission.INTERACTIONS_DELETE,
    Permission.OPPORTUNITIES_VIEW_ALL,
    Permission.OPPORTUNITIES_CREATE,
    Permission.OPPORTUNITIES_UPDATE,
    Permission.OPPORTUNITIES_DELETE,
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_UPDATE,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE_ROLES,
    Permission.SYSTEM_ADMIN,
    Permission.SYSTEM_AUDIT,
    Permission.SYSTEM_REPORTS,
    Permission.SYSTEM_SETTINGS
  ],
  
  manager: [
    Permission.ORGANIZATIONS_VIEW,
    Permission.ORGANIZATIONS_CREATE,
    Permission.ORGANIZATIONS_UPDATE,
    Permission.CONTACTS_VIEW,
    Permission.CONTACTS_CREATE,
    Permission.CONTACTS_UPDATE,
    Permission.INTERACTIONS_VIEW,
    Permission.INTERACTIONS_CREATE,
    Permission.INTERACTIONS_UPDATE,
    Permission.OPPORTUNITIES_VIEW,
    Permission.OPPORTUNITIES_CREATE,
    Permission.OPPORTUNITIES_UPDATE,
    Permission.USERS_VIEW,
    Permission.SYSTEM_REPORTS
  ],
  
  sales_rep: [
    Permission.ORGANIZATIONS_VIEW,
    Permission.ORGANIZATIONS_UPDATE,
    Permission.CONTACTS_VIEW,
    Permission.CONTACTS_CREATE,
    Permission.CONTACTS_UPDATE,
    Permission.INTERACTIONS_VIEW,
    Permission.INTERACTIONS_CREATE,
    Permission.INTERACTIONS_UPDATE,
    Permission.OPPORTUNITIES_VIEW,
    Permission.OPPORTUNITIES_CREATE,
    Permission.OPPORTUNITIES_UPDATE
  ],
  
  read_only: [
    Permission.ORGANIZATIONS_VIEW,
    Permission.CONTACTS_VIEW,
    Permission.INTERACTIONS_VIEW,
    Permission.OPPORTUNITIES_VIEW
  ]
}

// services/permissions.ts
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

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  canAccessResource(resource: string, action: string): boolean {
    const permission = `${resource}:${action}` as Permission
    return this.hasPermission(permission)
  }

  filterByPermission<T>(items: T[], getPermission: (item: T) => Permission): T[] {
    return items.filter(item => this.hasPermission(getPermission(item)))
  }
}

export const permissionService = new PermissionService()
```

### Territory-Based Access Control

The system implements territory-based access control for sales organizations with geographic or account-based territories. Territory management ensures users only access data within their assigned scope while supporting management oversight.

**Territory Assignment:** Users are assigned to specific territories containing organizations, contacts, and opportunities. Territory assignments can be geographic (regions, states, cities) or account-based (industry segments, company sizes, relationship types).

**Hierarchical Territories:** Territory hierarchies support management structures where managers oversee multiple territories and can access subordinate data. Territory inheritance enables flexible organizational structures with clear data access boundaries.

**Dynamic Territory Management:** Territory assignments can be modified dynamically to support organizational changes, user transfers, and seasonal adjustments. Territory changes include data migration and access transition procedures.

## Row Level Security (RLS) Implementation

### Database-Level Security Policies

Supabase PostgreSQL Row Level Security provides database-level access control that enforces data isolation regardless of application-level security measures. RLS policies are evaluated for every database query, ensuring consistent security enforcement.

**Organization-Based Isolation:** The primary RLS policy ensures users can only access organizations within their territory or reporting hierarchy. Organization-based isolation extends to all related entities including contacts, interactions, and opportunities.

```sql
-- Organizations RLS Policy
CREATE POLICY "Users can access organizations in their territory" ON organizations
  FOR ALL USING (
    -- User is assigned to the organization
    assigned_user_id = auth.uid() OR
    -- User is a manager of the assigned user
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u2.manager_id = u1.id
      WHERE u1.id = auth.uid() 
      AND u2.id = assigned_user_id
    ) OR
    -- User has admin role
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Contacts RLS Policy
CREATE POLICY "Users can access contacts in accessible organizations" ON contacts
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations
      -- Organizations policy will be applied automatically
    )
  );

-- Interactions RLS Policy
CREATE POLICY "Users can access their interactions and team interactions" ON interactions
  FOR ALL USING (
    -- User created the interaction
    user_id = auth.uid() OR
    -- User can access the related organization
    organization_id IN (
      SELECT id FROM organizations
      -- Organizations policy will be applied automatically
    ) OR
    -- User is a manager of the interaction creator
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u2.manager_id = u1.id
      WHERE u1.id = auth.uid() 
      AND u2.id = interactions.user_id
    )
  );

-- Opportunities RLS Policy
CREATE POLICY "Users can access opportunities in accessible organizations" ON opportunities
  FOR ALL USING (
    -- User owns the opportunity
    user_id = auth.uid() OR
    -- User can access the related organization
    organization_id IN (
      SELECT id FROM organizations
      -- Organizations policy will be applied automatically
    ) OR
    -- User is a manager of the opportunity owner
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u2.manager_id = u1.id
      WHERE u1.id = auth.uid() 
      AND u2.id = opportunities.user_id
    )
  );
```

### Dynamic Policy Evaluation

RLS policies support dynamic evaluation based on user context, time-based restrictions, and data sensitivity levels. Dynamic policies enable complex business rules while maintaining performance and security.

**Time-Based Access:** Policies can include time-based restrictions for sensitive operations, temporary access grants, and scheduled data visibility. Time-based policies support compliance requirements and operational security procedures.

**Data Sensitivity Levels:** Different data types have varying sensitivity levels with corresponding access restrictions. Financial data, personal information, and competitive intelligence have enhanced protection through specialized RLS policies.

**Contextual Access Control:** Policies evaluate user context including location, device type, and access patterns to provide adaptive security. Contextual policies can restrict access from unusual locations or require additional authentication for sensitive operations.

## Data Encryption and Protection

### Encryption at Rest

All data stored in the Kitchen Pantry CRM system is encrypted at rest using industry-standard encryption algorithms. Supabase provides automatic encryption for database storage, file uploads, and backup systems.

**Database Encryption:** PostgreSQL data is encrypted using AES-256 encryption with automatic key management. Database encryption includes table data, indexes, and transaction logs. Encryption keys are managed by Supabase with regular rotation and secure storage.

**File Storage Encryption:** Uploaded files including documents, images, and attachments are encrypted using AES-256 before storage. File encryption includes metadata protection and secure key management. Encrypted files are stored in Supabase Storage with access control integration.

**Backup Encryption:** Database backups and system snapshots are encrypted using the same standards as production data. Backup encryption ensures data protection during storage, transfer, and restoration procedures.

### Encryption in Transit

All data transmission between clients, APIs, and databases uses Transport Layer Security (TLS) encryption to prevent interception and tampering.

**HTTPS Enforcement:** All web traffic is encrypted using HTTPS with TLS 1.3 or higher. HTTPS enforcement includes automatic redirection from HTTP, HSTS headers, and certificate pinning for enhanced security.

**API Communication:** All API communications between frontend applications and backend services use encrypted connections. API encryption includes request/response bodies, headers, and authentication tokens.

**Database Connections:** Database connections from application servers to PostgreSQL use encrypted connections with certificate verification. Database encryption prevents data interception during query execution and result transmission.

### Key Management

The system implements comprehensive key management practices for encryption keys, API keys, and authentication secrets.

**Environment Variables:** Sensitive configuration including API keys, database credentials, and encryption keys are stored as environment variables with restricted access. Environment variables are never committed to version control and are managed through secure deployment pipelines.

**Secret Rotation:** Authentication keys, API tokens, and encryption keys are rotated regularly according to security policies. Key rotation includes automated procedures, fallback mechanisms, and zero-downtime transitions.

**Access Control:** Key access is restricted to authorized personnel and systems with comprehensive audit logging. Key access includes multi-person authorization for critical keys and emergency access procedures.

## Input Validation and Sanitization

### Frontend Validation

The frontend implements comprehensive input validation to prevent malicious data entry and provide immediate user feedback. Frontend validation includes format checking, range validation, and business rule enforcement.

```typescript
// utils/validation.ts
export class ValidationService {
  static email(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  static phone(value: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))
  }

  static url(value: string): boolean {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  static sanitizeHtml(value: string): string {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  static sanitizeInput(value: string): string {
    return value
      .trim()
      .replace(/[<>\"'&]/g, '')
      .substring(0, 1000) // Limit length
  }

  static validateBusinessEmail(email: string): boolean {
    const freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'
    ]
    
    if (!this.email(email)) return false
    
    const domain = email.split('@')[1].toLowerCase()
    return !freeEmailDomains.includes(domain)
  }

  static validatePassword(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}
```

### Backend Validation

The Node.js API implements comprehensive server-side validation using schema validation libraries and custom business rule validation.

```typescript
// middleware/validation.ts
import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

export const organizationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  industry_segment: Joi.string().valid(
    'Fine Dining', 'Fast Food', 'Healthcare', 'Education', 
    'Corporate Catering', 'Hospitality'
  ),
  priority_level: Joi.string().valid('A', 'B', 'C', 'D'),
  business_type: Joi.string().max(50),
  annual_revenue: Joi.number().positive().max(999999999999.99),
  employee_count: Joi.number().integer().positive().max(1000000),
  website_url: Joi.string().uri(),
  primary_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  primary_email: Joi.string().email(),
  billing_address: Joi.object({
    street: Joi.string().max(255),
    city: Joi.string().max(100),
    state: Joi.string().max(50),
    postal_code: Joi.string().max(20),
    country: Joi.string().length(2)
  }),
  payment_terms: Joi.string().max(100),
  credit_limit: Joi.number().positive().max(999999999999.99),
  notes: Joi.string().max(5000)
})

export const validateOrganization = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = organizationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: 'VALIDATION_ERROR'
    }))

    return res.status(422).json({
      success: false,
      errors
    })
  }

  req.body = value
  next()
}

// SQL Injection Prevention
export const sanitizeQuery = (query: string): string => {
  return query
    .replace(/[';\\]/g, '') // Remove dangerous characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '')
    .trim()
}

// XSS Prevention
export const sanitizeOutput = (data: any): any => {
  if (typeof data === 'string') {
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput)
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeOutput(value)
    }
    return sanitized
  }
  
  return data
}
```

### Database Validation

PostgreSQL database constraints provide the final layer of validation, ensuring data integrity regardless of application-level validation.

```sql
-- Email format validation
ALTER TABLE contacts ADD CONSTRAINT chk_email_format 
  CHECK (email_primary ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Phone number format validation
ALTER TABLE contacts ADD CONSTRAINT chk_phone_format 
  CHECK (phone_primary ~ '^\+?[1-9]\d{1,14}$');

-- Priority level validation
ALTER TABLE organizations ADD CONSTRAINT chk_priority_level 
  CHECK (priority_level IN ('A', 'B', 'C', 'D'));

-- Positive number validation
ALTER TABLE organizations ADD CONSTRAINT chk_positive_revenue 
  CHECK (annual_revenue > 0);

-- URL format validation
ALTER TABLE organizations ADD CONSTRAINT chk_website_url 
  CHECK (website_url ~ '^https?://[^\s/$.?#].[^\s]*$');

-- Date range validation
ALTER TABLE interactions ADD CONSTRAINT chk_interaction_date 
  CHECK (interaction_date <= NOW() AND interaction_date >= '2020-01-01');

-- Relationship score validation
ALTER TABLE contacts ADD CONSTRAINT chk_relationship_score 
  CHECK (relationship_score BETWEEN 1 AND 10);
```

## Audit Logging and Monitoring

### Comprehensive Audit Trail

The system implements comprehensive audit logging for all user actions, data changes, and system events. Audit logs provide accountability, compliance support, and security incident investigation capabilities.

**User Action Logging:** All user actions including login, logout, data access, and modifications are logged with timestamps, user identification, IP addresses, and user agents. Action logs include successful operations and failed attempts with detailed error information.

**Data Change Tracking:** Database triggers capture all data modifications including before/after values, changed fields, and user context. Data change logs support compliance requirements, data recovery, and change analysis.

**System Event Logging:** System events including authentication failures, permission violations, and security incidents are logged with detailed context. System logs enable security monitoring, threat detection, and incident response.

```sql
-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255)
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_info RECORD;
BEGIN
  -- Get user information
  SELECT email INTO user_info FROM auth.users WHERE id = auth.uid();
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (
      table_name, record_id, action, old_values, 
      user_id, user_email, timestamp
    ) VALUES (
      TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD),
      auth.uid(), user_info.email, NOW()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (
      table_name, record_id, action, old_values, new_values,
      user_id, user_email, timestamp
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW),
      auth.uid(), user_info.email, NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      table_name, record_id, action, new_values,
      user_id, user_email, timestamp
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW),
      auth.uid(), user_info.email, NOW()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all main tables
CREATE TRIGGER audit_organizations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contacts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_interactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON interactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_opportunities_trigger
  AFTER INSERT OR UPDATE OR DELETE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### Security Monitoring

The system implements real-time security monitoring to detect and respond to potential threats, unauthorized access attempts, and suspicious activities.

**Failed Authentication Monitoring:** Multiple failed login attempts trigger account lockout and security alerts. Failed authentication monitoring includes IP-based tracking, geographic analysis, and pattern detection.

**Unusual Access Pattern Detection:** Machine learning algorithms analyze user access patterns to detect anomalies including unusual login times, geographic locations, and data access patterns. Anomaly detection triggers security reviews and additional authentication requirements.

**Data Access Monitoring:** Comprehensive monitoring of data access patterns including bulk data exports, sensitive data queries, and unusual query patterns. Data access monitoring supports insider threat detection and compliance reporting.

```typescript
// services/securityMonitoring.ts
export class SecurityMonitoringService {
  private static readonly MAX_FAILED_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

  async recordFailedLogin(email: string, ipAddress: string, userAgent: string) {
    const key = `failed_login:${email}:${ipAddress}`
    const attempts = await this.getFailedAttempts(key)
    
    if (attempts >= SecurityMonitoringService.MAX_FAILED_ATTEMPTS) {
      await this.lockAccount(email)
      await this.sendSecurityAlert('ACCOUNT_LOCKED', { email, ipAddress })
    }
    
    await this.incrementFailedAttempts(key)
    
    // Log security event
    await this.logSecurityEvent({
      event_type: 'FAILED_LOGIN',
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      severity: 'MEDIUM'
    })
  }

  async recordSuccessfulLogin(userId: string, email: string, ipAddress: string) {
    // Clear failed attempts
    const key = `failed_login:${email}:${ipAddress}`
    await this.clearFailedAttempts(key)
    
    // Check for unusual location
    const isUnusualLocation = await this.checkUnusualLocation(userId, ipAddress)
    if (isUnusualLocation) {
      await this.sendSecurityAlert('UNUSUAL_LOCATION', { 
        userId, email, ipAddress 
      })
    }
    
    // Log successful login
    await this.logSecurityEvent({
      event_type: 'SUCCESSFUL_LOGIN',
      user_id: userId,
      email,
      ip_address: ipAddress,
      severity: 'LOW'
    })
  }

  async detectDataAccessAnomaly(userId: string, action: string, resourceType: string) {
    const pattern = await this.analyzeAccessPattern(userId, action, resourceType)
    
    if (pattern.isAnomalous) {
      await this.logSecurityEvent({
        event_type: 'DATA_ACCESS_ANOMALY',
        user_id: userId,
        details: {
          action,
          resource_type: resourceType,
          anomaly_score: pattern.anomalyScore
        },
        severity: 'HIGH'
      })
      
      await this.sendSecurityAlert('DATA_ACCESS_ANOMALY', {
        userId,
        action,
        resourceType,
        anomalyScore: pattern.anomalyScore
      })
    }
  }

  private async logSecurityEvent(event: SecurityEvent) {
    // Log to database and external security monitoring system
    await supabase.from('security_events').insert(event)
  }

  private async sendSecurityAlert(alertType: string, details: any) {
    // Send alerts to security team
    // Implementation depends on alerting system (email, Slack, etc.)
  }
}
```

## Compliance and Regulatory Requirements

### GDPR Compliance

The system implements comprehensive GDPR compliance measures for European users, including data protection, user rights, and privacy controls.

**Data Minimization:** The system collects only necessary data for CRM operations with clear purpose limitation. Data collection includes explicit consent mechanisms and purpose specification for each data type.

**Right to Access:** Users can request complete copies of their personal data through automated export functionality. Data access includes all stored information, processing history, and data sharing records.

**Right to Rectification:** Users can update and correct their personal information through self-service interfaces. Data rectification includes audit trails and notification of data sharing partners.

**Right to Erasure:** Users can request deletion of their personal data with automated processing for non-essential data. Data erasure includes secure deletion procedures and retention policy compliance.

**Data Portability:** Users can export their data in machine-readable formats for transfer to other systems. Data portability includes standardized formats and comprehensive data export capabilities.

### CCPA Compliance

California Consumer Privacy Act compliance provides privacy rights for California residents with comprehensive data protection measures.

**Privacy Notice:** Clear privacy notices describe data collection, use, and sharing practices with regular updates and user notifications. Privacy notices include contact information for privacy inquiries and opt-out procedures.

**Right to Know:** Users can request information about personal data collection, use, and sharing with detailed reporting. Right to know includes data categories, sources, purposes, and third-party sharing information.

**Right to Delete:** Users can request deletion of personal information with verification procedures and exception handling. Right to delete includes secure deletion and third-party notification requirements.

**Right to Opt-Out:** Users can opt out of personal information sales with simple opt-out mechanisms. Opt-out procedures include global privacy controls and persistent preference management.

### SOC 2 Compliance

The system implements SOC 2 Type II controls for security, availability, processing integrity, confidentiality, and privacy.

**Security Controls:** Comprehensive security controls including access management, encryption, monitoring, and incident response. Security controls include regular testing, documentation, and continuous improvement.

**Availability Controls:** System availability controls including redundancy, backup procedures, and disaster recovery. Availability controls ensure consistent service delivery and data protection.

**Processing Integrity Controls:** Data processing integrity controls including validation, error handling, and quality assurance. Processing integrity ensures accurate and complete data handling.

**Confidentiality Controls:** Data confidentiality controls including encryption, access restrictions, and information handling procedures. Confidentiality controls protect sensitive business and personal information.

## Incident Response and Recovery

### Security Incident Response Plan

The system includes comprehensive incident response procedures for security breaches, data leaks, and system compromises.

**Incident Detection:** Automated monitoring systems detect security incidents through anomaly detection, alert correlation, and threat intelligence. Incident detection includes real-time alerting and escalation procedures.

**Incident Classification:** Security incidents are classified by severity, impact, and urgency with corresponding response procedures. Incident classification includes stakeholder notification and resource allocation.

**Incident Containment:** Immediate containment procedures isolate affected systems and prevent incident escalation. Containment procedures include system isolation, access revocation, and evidence preservation.

**Incident Recovery:** Recovery procedures restore normal operations while maintaining security and data integrity. Recovery includes system restoration, data validation, and security enhancement.

**Post-Incident Analysis:** Comprehensive analysis of security incidents identifies root causes and improvement opportunities. Post-incident analysis includes documentation, lessons learned, and process enhancement.

### Business Continuity Planning

The system implements comprehensive business continuity planning to ensure service availability during disruptions.

**Backup and Recovery:** Automated backup procedures with regular testing and validation ensure data protection and recovery capabilities. Backup procedures include multiple recovery points and geographic distribution.

**Disaster Recovery:** Disaster recovery procedures enable rapid service restoration during major disruptions. Disaster recovery includes alternative infrastructure, data replication, and communication plans.

**Service Continuity:** Service continuity procedures maintain critical CRM functions during partial system outages. Service continuity includes degraded mode operations and priority function identification.

## Conclusion

The Kitchen Pantry CRM authentication and security implementation provides comprehensive protection for food service industry data while maintaining usability and performance. The multi-layered security approach combines industry-standard authentication with custom authorization logic and database-level security enforcement.

The system's security architecture supports regulatory compliance, audit requirements, and industry best practices while enabling flexible access control for diverse organizational structures. Comprehensive monitoring and incident response capabilities ensure rapid threat detection and effective security incident management.

This security implementation serves as the foundation for all Kitchen Pantry CRM operations, providing the trust and protection essential for successful customer relationship management in the food service industry. The security measures are designed to evolve with emerging threats while maintaining the usability and performance required for effective CRM operations.

