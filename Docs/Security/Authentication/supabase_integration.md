# Supabase Authentication Integration

## Overview

Kitchen Pantry CRM leverages **Supabase Auth** as the primary authentication provider, providing enterprise-grade user management with minimal implementation complexity.

## User Registration Flow

### Registration Process
- **Email verification** required before account activation
- **Custom validation** for business email domains
- **Role assignment** based on invitation codes
- **Automatic organization association** for team members

### Business Logic Integration
- **Database triggers** for custom validation
- **Edge Functions** for complex business rules
- **Automated user profile creation**

## Login and Session Management

### Authentication Methods
- **Email/password** credentials (primary)
- **Multi-factor authentication** (optional)
- **SSO integration** for enterprise accounts

### Session Handling
- **JWT tokens** with configurable expiration
- **Short-lived access tokens** (1 hour)
- **Long-lived refresh tokens** (30 days)
- **Automatic token refresh** for seamless UX

## Password Security

### Security Features
- **bcrypt hashing** with configurable salt rounds
- **Industry-standard** password storage
- **Secure token-based** password reset flow
- **Time-limited validity** for reset tokens

### Password Policies
- **Minimum complexity** requirements
- **Length requirements** (8+ characters)
- **Character diversity** enforcement
- **Common password** prevention

## Implementation Code

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
```

## Session Management

### Key Methods
- **getCurrentUser()** - Retrieve current user information
- **getCurrentSession()** - Get active session data
- **refreshSession()** - Refresh authentication tokens
- **onAuthStateChange()** - Monitor authentication state changes

### Token Management
- **Automatic token refresh** prevents session expiration
- **Secure token storage** in browser
- **Token validation** on each API request