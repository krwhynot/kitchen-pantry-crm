# API Error Handling

**Kitchen Pantry CRM Error Reference**

This module provides comprehensive error codes, handling patterns, and troubleshooting guidance for Kitchen Pantry CRM API.

---

## Error Response Format

### Standard Error Structure

**All API errors follow a consistent response format:**

```typescript
interface ErrorResponse {
  success: false;
  error: string;           // Error code
  message: string;         // Human-readable message
  details?: object;        // Additional error details
  timestamp: string;       // ISO timestamp
  requestId: string;       // Unique request identifier
  path?: string;           // API endpoint path
}
```

**Example Error Response:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "The email field is required and must be a valid email address.",
  "details": {
    "field": "email",
    "code": "INVALID_EMAIL",
    "value": "invalid-email"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890",
  "path": "/api/v1/auth/register"
}
```

---

## HTTP Status Codes

### Success Codes (2xx)

**200 OK**
- **Usage:** Successful GET, PUT, PATCH requests
- **Response:** Contains requested data or updated resource

**201 Created**
- **Usage:** Successful POST requests that create resources
- **Response:** Contains newly created resource with ID

**204 No Content**
- **Usage:** Successful DELETE requests
- **Response:** Empty body

### Client Error Codes (4xx)

**400 Bad Request**
- **Cause:** Invalid request syntax, malformed JSON, missing required fields
- **Action:** Check request format and required parameters

```json
{
  "success": false,
  "error": "BAD_REQUEST",
  "message": "Invalid JSON format in request body",
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**401 Unauthorized**
- **Cause:** Missing, invalid, or expired authentication token
- **Action:** Refresh token or re-authenticate

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Access token is invalid or expired",
  "details": {
    "tokenExpired": true,
    "expiredAt": "2025-01-15T09:30:00Z"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**403 Forbidden**
- **Cause:** Valid authentication but insufficient permissions
- **Action:** Contact admin for permission upgrade

```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Insufficient permissions to access this resource",
  "details": {
    "requiredPermission": "customers:write",
    "userPermissions": ["customers:read", "interactions:write"]
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**404 Not Found**
- **Cause:** Requested resource doesn't exist
- **Action:** Verify resource ID and user access

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Customer with ID 'cust_invalid' not found",
  "details": {
    "resource": "customer",
    "id": "cust_invalid"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**409 Conflict**
- **Cause:** Resource conflict, duplicate data, concurrent modification
- **Action:** Resolve conflict and retry

```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "A customer with this email already exists",
  "details": {
    "field": "email",
    "value": "existing@company.com",
    "existingId": "cust_1234567890"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**422 Unprocessable Entity**
- **Cause:** Valid JSON but failed validation rules
- **Action:** Fix validation errors and retry

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed for one or more fields",
  "details": {
    "errors": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Must be a valid email address"
      },
      {
        "field": "password",
        "code": "TOO_SHORT",
        "message": "Must be at least 8 characters long"
      }
    ]
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**429 Too Many Requests**
- **Cause:** Rate limit exceeded
- **Action:** Wait and retry after specified time

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 3600 seconds.",
  "details": {
    "limit": 1000,
    "remaining": 0,
    "resetAt": "2025-01-15T11:30:00Z",
    "retryAfter": 3600
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

### Server Error Codes (5xx)

**500 Internal Server Error**
- **Cause:** Unexpected server error
- **Action:** Retry request, contact support if persistent

```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred. Please try again later.",
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**503 Service Unavailable**
- **Cause:** Server maintenance or overload
- **Action:** Wait and retry, check status page

```json
{
  "success": false,
  "error": "SERVICE_UNAVAILABLE",
  "message": "Service temporarily unavailable due to maintenance",
  "details": {
    "maintenanceEnd": "2025-01-15T12:00:00Z",
    "statusPage": "https://status.kitchenpantrycrm.com"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

---

## Common Error Codes

### Authentication Errors

**INVALID_CREDENTIALS**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

**TOKEN_EXPIRED**
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Access token has expired",
  "details": {
    "expiredAt": "2025-01-15T09:30:00Z"
  }
}
```

**ACCOUNT_LOCKED**
```json
{
  "error": "ACCOUNT_LOCKED",
  "message": "Account locked due to too many failed login attempts",
  "details": {
    "lockoutEnd": "2025-01-15T11:00:00Z",
    "attemptsRemaining": 0
  }
}
```

### Validation Errors

**REQUIRED_FIELD**
```json
{
  "error": "VALIDATION_ERROR",
  "details": {
    "field": "name",
    "code": "REQUIRED_FIELD",
    "message": "This field is required"
  }
}
```

**INVALID_FORMAT**
```json
{
  "error": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "code": "INVALID_FORMAT",
    "message": "Must be a valid email address"
  }
}
```

**VALUE_TOO_LONG**
```json
{
  "error": "VALIDATION_ERROR",
  "details": {
    "field": "description",
    "code": "VALUE_TOO_LONG",
    "message": "Must be 500 characters or less",
    "maxLength": 500,
    "actualLength": 750
  }
}
```

### Business Logic Errors

**DUPLICATE_RESOURCE**
```json
{
  "error": "DUPLICATE_RESOURCE",
  "message": "A customer with this name already exists",
  "details": {
    "field": "name",
    "existingId": "cust_1234567890"
  }
}
```

**RESOURCE_IN_USE**
```json
{
  "error": "RESOURCE_IN_USE",
  "message": "Cannot delete customer with active opportunities",
  "details": {
    "activeOpportunities": 3,
    "totalValue": 50000
  }
}
```

**INSUFFICIENT_PERMISSIONS**
```json
{
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "You don't have permission to perform this action",
  "details": {
    "requiredRole": "manager",
    "currentRole": "sales_rep"
  }
}
```

---

## Error Handling Patterns

### Client-Side Error Handling

**TypeScript Error Handler:**
```typescript
interface APIError {
  success: false;
  error: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
}

async function handleAPICall<T>(
  apiCall: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!response.ok) {
      throw new APIError(data);
    }
    
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      handleAPIError(error);
    } else {
      handleNetworkError(error);
    }
    throw error;
  }
}

function handleAPIError(error: APIError) {
  switch (error.error) {
    case 'UNAUTHORIZED':
    case 'TOKEN_EXPIRED':
      // Redirect to login
      window.location.href = '/login';
      break;
      
    case 'VALIDATION_ERROR':
      // Show field-specific errors
      showValidationErrors(error.details.errors);
      break;
      
    case 'RATE_LIMIT_EXCEEDED':
      // Show rate limit message with retry time
      showRateLimitMessage(error.details.retryAfter);
      break;
      
    default:
      // Show generic error message
      showErrorMessage(error.message);
  }
}
```

### Retry Logic

**Exponential Backoff:**
```typescript
async function retryWithBackoff<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Error Logging

**Client-Side Error Logging:**
```typescript
function logError(error: APIError, context: string) {
  const errorLog = {
    error: error.error,
    message: error.message,
    requestId: error.requestId,
    timestamp: error.timestamp,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Send to error tracking service
  fetch('/api/v1/errors/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorLog)
  }).catch(() => {
    // Fallback to console if logging fails
    console.error('API Error:', errorLog);
  });
}
```

---

## Troubleshooting Guide

### Common Issues and Solutions

**Authentication Issues:**
1. **Token expired:** Use refresh token to get new access token
2. **Invalid token:** Clear local storage and re-authenticate
3. **Account locked:** Wait for lockout period or contact support

**Validation Issues:**
1. **Required fields:** Check all required fields are provided
2. **Format errors:** Validate email, phone, date formats
3. **Length limits:** Check field length requirements

**Permission Issues:**
1. **Insufficient permissions:** Contact admin for role upgrade
2. **Resource access:** Verify user has access to specific resource
3. **Team restrictions:** Check if user is assigned to correct team

**Rate Limiting:**
1. **Exceeded limits:** Implement exponential backoff
2. **Upgrade plan:** Consider higher rate limit tier
3. **Optimize requests:** Batch operations where possible

### Debug Information

**Request Headers for Debugging:**
```typescript
const debugHeaders = {
  'X-Debug-Mode': 'true',
  'X-Request-Source': 'web-app',
  'X-User-Agent': navigator.userAgent,
  'X-Timestamp': new Date().toISOString()
};
```

**Error Context Collection:**
```typescript
function collectErrorContext() {
  return {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    sessionId: getSessionId(),
    buildVersion: process.env.REACT_APP_VERSION
  };
}
```

This comprehensive error handling system ensures robust API integration with clear error messages, proper retry logic, and effective troubleshooting capabilities.

