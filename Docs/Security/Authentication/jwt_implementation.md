# JWT Token Implementation

## Overview

The system implements **JSON Web Tokens (JWT)** for stateless authentication, providing scalable session management without server-side storage requirements.

## Token Structure

### Standard Claims
- **iss** (issuer) - Token issuer identification
- **sub** (subject) - User identifier
- **aud** (audience) - Token audience
- **exp** (expiration) - Token expiration time
- **iat** (issued at) - Token creation time

### Custom Claims
- **user_id** - Kitchen Pantry CRM user identifier
- **email** - User email address
- **role** - User role (admin, manager, sales_rep, read_only)
- **organization_id** - Associated organization
- **permissions** - Array of specific permissions

## Token Lifecycle Management

### Access Tokens
- **Short expiration** (1 hour) to minimize security exposure
- **Automatic refresh** handled by frontend
- **Immediate invalidation** on logout

### Refresh Tokens
- **Longer-lived** authentication (30 days)
- **User convenience** for seamless experience
- **Secure storage** and rotation

### Token Refresh Process
1. **Automatic detection** of token expiration
2. **Background refresh** using refresh token
3. **Fallback to re-authentication** if refresh fails
4. **Transparent to user** experience

## Token Validation

### Validation Requirements
- **Signature authenticity** verification
- **Expiration time** checking
- **Issuer verification** against trusted sources
- **Custom claim validation** for authorization

### Security Features
- **Role-based access control** through custom claims
- **Organization-based data isolation**
- **Fine-grained authorization** without database queries

## Implementation Example

```typescript
export class AuthService {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error(error.message)
    return data
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
```

## Security Best Practices

### Token Storage
- **Secure browser storage** for persistence
- **HttpOnly cookies** for enhanced security
- **Automatic cleanup** on logout

### Token Rotation
- **Regular refresh** cycles
- **Immediate invalidation** on security events
- **Audit logging** for all token operations