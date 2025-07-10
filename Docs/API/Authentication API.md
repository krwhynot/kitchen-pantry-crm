# Authentication API

**Kitchen Pantry CRM Authentication Endpoints**

This module handles user authentication, registration, and session management using JWT tokens.

---

## Authentication Overview

**Authentication Method:** JWT (JSON Web Tokens)  
**Token Expiry:** 24 hours (access token), 30 days (refresh token)  
**Security:** HTTPS required, bcrypt password hashing  

---

## User Registration

### POST /auth/register

**Purpose:** Create a new user account with email verification.

**Request Parameters:**
```typescript
interface RegisterRequest {
  email: string;           // Valid email address
  password: string;        // Minimum 8 characters
  firstName: string;       // User's first name
  lastName: string;        // User's last name
  company?: string;        // Company name (optional)
  phone?: string;          // Phone number (optional)
}
```

**Response Format:**
```typescript
interface RegisterResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      emailVerified: false;
      createdAt: string;
    };
    message: string;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@restaurant.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Restaurant Group'
  })
});
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_1234567890",
      "email": "john.doe@restaurant.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": false,
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**Error Handling:**
- **400:** Email already exists, invalid password format
- **422:** Validation errors (weak password, invalid email)
- **500:** Server error during registration

---

## User Login

### POST /auth/login

**Purpose:** Authenticate user and return access/refresh tokens.

**Request Parameters:**
```typescript
interface LoginRequest {
  email: string;           // User's email address
  password: string;        // User's password
  rememberMe?: boolean;    // Extend token expiry (optional)
}
```

**Response Format:**
```typescript
interface LoginResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      permissions: string[];
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@restaurant.com',
    password: 'SecurePass123!',
    rememberMe: true
  })
});

const { data } = await response.json();
localStorage.setItem('accessToken', data.tokens.accessToken);
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_1234567890",
      "email": "john.doe@restaurant.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "sales_rep",
      "permissions": ["customers:read", "customers:write", "interactions:write"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

**Error Handling:**
- **401:** Invalid credentials, account locked
- **403:** Email not verified, account disabled
- **429:** Too many login attempts

---

## Token Refresh

### POST /auth/refresh

**Purpose:** Refresh expired access token using refresh token.

**Request Parameters:**
```typescript
interface RefreshRequest {
  refreshToken: string;    // Valid refresh token
}
```

**Response Format:**
```typescript
interface RefreshResponse {
  success: true;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const { data } = await response.json();
localStorage.setItem('accessToken', data.accessToken);
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Error Handling:**
- **401:** Invalid or expired refresh token
- **403:** Refresh token revoked

---

## Password Reset

### POST /auth/forgot-password

**Purpose:** Initiate password reset process by sending reset email.

**Request Parameters:**
```typescript
interface ForgotPasswordRequest {
  email: string;           // User's email address
}
```

**Response Format:**
```typescript
interface ForgotPasswordResponse {
  success: true;
  data: {
    message: string;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@restaurant.com'
  })
});
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, we've sent a password reset link."
  }
}
```

### POST /auth/reset-password

**Purpose:** Reset password using token from reset email.

**Request Parameters:**
```typescript
interface ResetPasswordRequest {
  token: string;           // Reset token from email
  password: string;        // New password
  confirmPassword: string; // Password confirmation
}
```

**Response Format:**
```typescript
interface ResetPasswordResponse {
  success: true;
  data: {
    message: string;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'reset_token_from_email',
    password: 'NewSecurePass123!',
    confirmPassword: 'NewSecurePass123!'
  })
});
```

**Error Handling:**
- **400:** Invalid or expired token, passwords don't match
- **422:** Password doesn't meet requirements

---

## Email Verification

### POST /auth/verify-email

**Purpose:** Verify user email address using verification token.

**Request Parameters:**
```typescript
interface VerifyEmailRequest {
  token: string;           // Verification token from email
}
```

**Response Format:**
```typescript
interface VerifyEmailResponse {
  success: true;
  data: {
    message: string;
    user: {
      id: string;
      email: string;
      emailVerified: true;
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'verification_token_from_email'
  })
});
```

**Error Handling:**
- **400:** Invalid or expired verification token
- **409:** Email already verified

---

## Logout

### POST /auth/logout

**Purpose:** Invalidate current session and refresh token.

**Request Parameters:**
```typescript
interface LogoutRequest {
  refreshToken?: string;   // Optional refresh token to invalidate
}
```

**Response Format:**
```typescript
interface LogoutResponse {
  success: true;
  data: {
    message: string;
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

// Clear local storage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Session Validation

### GET /auth/me

**Purpose:** Validate current session and get user information.

**Request Parameters:** None (uses Authorization header)

**Response Format:**
```typescript
interface MeResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      permissions: string[];
      lastLoginAt: string;
    };
  };
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

if (response.ok) {
  const { data } = await response.json();
  console.log('Current user:', data.user);
} else {
  // Token invalid, redirect to login
  window.location.href = '/login';
}
```

**Error Handling:**
- **401:** Invalid or expired access token
- **403:** Account disabled or suspended

This authentication system provides secure, JWT-based authentication with comprehensive error handling and session management.

