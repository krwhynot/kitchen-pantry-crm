# Kitchen Pantry CRM - API Documentation

**Optimized for Claude Code AI Processing**  
**Version:** 1.0  
**Base URL:** `https://api.kitchenpantrycrm.com/v1`  
**Date:** January 2025  

---

## API Overview

Kitchen Pantry CRM provides a **RESTful API** for managing customer relationships, interactions, and sales opportunities in the food service industry. The API uses **JSON** for data exchange and **JWT tokens** for authentication.

**Key Features:**
- RESTful design with predictable URLs
- JSON request/response format
- JWT-based authentication
- Rate limiting and error handling
- Real-time webhooks for updates

---

## Documentation Structure

The complete API documentation is organized into focused modules for optimal Claude Code AI processing:

### Authentication & Security

1. **[auth_api.md](./auth_api.md)**
   - User authentication and registration
   - JWT token management
   - Password reset workflows
   - Session management

### Core Resources

2. **[users_api.md](./users_api.md)**
   - User profile management
   - Team member operations
   - Role and permission handling
   - User preferences

3. **[customers_api.md](./customers_api.md)**
   - Customer CRUD operations
   - Customer search and filtering
   - Customer status management
   - Bulk operations

4. **[contacts_api.md](./contacts_api.md)**
   - Contact person management
   - Contact-customer relationships
   - Communication preferences
   - Contact history

5. **[interactions_api.md](./interactions_api.md)**
   - Interaction logging and retrieval
   - Activity timeline management
   - Interaction types and categories
   - Follow-up scheduling

6. **[opportunities_api.md](./opportunities_api.md)**
   - Sales opportunity management
   - Pipeline stage operations
   - Revenue forecasting
   - Opportunity analytics

7. **[products_api.md](./products_api.md)**
   - Product catalog management
   - Pricing and inventory
   - Product categories
   - Quote generation

### System APIs

8. **[search_api.md](./search_api.md)**
   - Global search functionality
   - Advanced filtering
   - Search suggestions
   - Saved searches

9. **[reports_api.md](./reports_api.md)**
   - Report generation
   - Analytics and metrics
   - Data export
   - Dashboard widgets

10. **[webhooks_api.md](./webhooks_api.md)**
    - Webhook configuration
    - Event subscriptions
    - Payload formats
    - Retry mechanisms

### Reference Documentation

11. **[api_errors.md](./api_errors.md)**
    - Error code reference
    - Error handling patterns
    - Troubleshooting guide
    - Status code meanings

12. **[api_types.md](./api_types.md)**
    - TypeScript interface definitions
    - Common data structures
    - Enum values
    - Validation schemas

---

## Quick Start

### Base Configuration

**API Base URL:**
```typescript
const API_BASE_URL = 'https://api.kitchenpantrycrm.com/v1';
```

**Request Headers:**
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
  'X-API-Version': '1.0'
};
```

### Authentication Flow

```typescript
// 1. Login to get access token
const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@company.com',
    password: 'password123'
  })
});

const { accessToken } = await loginResponse.json();

// 2. Use token for authenticated requests
const customersResponse = await fetch(`${API_BASE_URL}/customers`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Common Patterns

### Request Format

**Standard Request Structure:**
```typescript
interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: object;
  params?: Record<string, string>;
}
```

### Response Format

**Standard Response Structure:**
```typescript
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}
```

### Pagination

**Pagination Parameters:**
```typescript
interface PaginationParams {
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 20, max: 100)
  sort?: string;        // Sort field
  order?: 'asc' | 'desc'; // Sort direction
}
```

**Pagination Response:**
```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
```

---

## Rate Limiting

### Rate Limit Headers

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Tiers

**Limits by Plan:**
- **Free:** 100 requests/hour
- **Pro:** 1,000 requests/hour
- **Enterprise:** 10,000 requests/hour

**Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 3600 seconds.",
  "retryAfter": 3600
}
```

---

## Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: object;
  timestamp: string;
  requestId: string;
}
```

### Common HTTP Status Codes

- **200 OK:** Request successful
- **201 Created:** Resource created successfully
- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server error

---

## Development Tools

### Postman Collection

**Import URL:**
```
https://api.kitchenpantrycrm.com/postman/collection.json
```

### OpenAPI Specification

**Swagger UI:**
```
https://api.kitchenpantrycrm.com/docs
```

### SDK Libraries

**JavaScript/TypeScript:**
```bash
npm install @kitchenpantry/api-client
```

**Python:**
```bash
pip install kitchenpantry-api
```

---

## Support and Resources

### API Support

- **Documentation:** https://docs.kitchenpantrycrm.com/api
- **Support Email:** api-support@kitchenpantrycrm.com
- **Status Page:** https://status.kitchenpantrycrm.com

### Community

- **GitHub:** https://github.com/kitchenpantry/api-examples
- **Discord:** https://discord.gg/kitchenpantrycrm
- **Stack Overflow:** Tag `kitchenpantry-crm`

This documentation provides comprehensive API specifications optimized for Claude Code AI processing and implementation assistance.

