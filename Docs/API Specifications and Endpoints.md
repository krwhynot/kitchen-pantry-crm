# Kitchen Pantry CRM - API Specifications and Endpoints

**Document Version:** 1.0  
**Author:** Manus AI  
**Date:** January 2025  
**System:** Kitchen Pantry CRM MVP  

## Executive Summary

The Kitchen Pantry CRM API provides a comprehensive RESTful interface for managing food service industry relationships, interactions, and sales opportunities. Built on Node.js/Express with Supabase backend integration, the API follows OpenAPI 3.0 specifications and implements industry-standard authentication, validation, and error handling patterns.

The API architecture emphasizes consistency, discoverability, and ease of integration while providing robust business logic validation and data transformation capabilities. All endpoints support JSON request/response formats with comprehensive error handling, pagination, filtering, and sorting capabilities essential for CRM operations.

Authentication is handled through JWT tokens issued by Supabase Auth, with role-based access control enforced at both the API and database levels. The API serves as an intelligent middleware layer, orchestrating complex business operations while maintaining direct Supabase integration for simple CRUD operations.

## API Architecture Overview

### RESTful Design Principles

The Kitchen Pantry CRM API adheres to REST architectural constraints, providing a stateless, cacheable, and uniform interface for client applications. Resource-based URLs represent business entities with standard HTTP methods for CRUD operations.

**Resource Naming Conventions:** All endpoints use plural nouns for resource collections (e.g., `/organizations`, `/contacts`) with singular resource identifiers for specific items (e.g., `/organizations/{id}`). Nested resources follow hierarchical patterns reflecting business relationships (e.g., `/organizations/{id}/contacts`).

**HTTP Method Usage:** GET requests retrieve data without side effects, POST creates new resources, PUT updates entire resources, PATCH performs partial updates, and DELETE removes resources. All methods include appropriate response codes and error handling.

**Stateless Operations:** Each API request contains all necessary information for processing, with no server-side session state. Authentication tokens carry user context, and request parameters specify filtering, sorting, and pagination requirements.

### Request/Response Format Standards

**Content Type:** All API endpoints accept and return `application/json` content type. Request bodies must be valid JSON with appropriate Content-Type headers. Response bodies include structured JSON with consistent formatting.

**Response Structure:** All API responses follow a standardized format including status indicators, data payload, metadata, and error information when applicable:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-01-07T10:30:00Z",
    "request_id": "req_123456789",
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  },
  "errors": []
}
```

**Error Handling:** Error responses include detailed error information with appropriate HTTP status codes, error codes, and descriptive messages. Validation errors provide field-specific feedback for client-side error handling.

### Authentication and Authorization

**JWT Token Authentication:** All protected endpoints require valid JWT tokens in the Authorization header using Bearer token format. Tokens are issued by Supabase Auth and validated by the API middleware.

**Role-Based Access Control:** User roles (admin, manager, sales_rep, read_only) determine endpoint access and data visibility. Role validation occurs at both the API and database levels through Row Level Security policies.

**Token Validation:** JWT tokens are validated for signature authenticity, expiration, and user context on every request. Invalid or expired tokens result in 401 Unauthorized responses with token refresh instructions.

## Core Resource Endpoints

### Organizations API

The Organizations API manages company and business entity information, serving as the primary tenant boundary for CRM data organization.

#### GET /api/v1/organizations

Retrieves a paginated list of organizations accessible to the authenticated user based on role and territory assignments.

**Query Parameters:**
- `page` (integer, default: 1): Page number for pagination
- `limit` (integer, default: 50, max: 100): Number of records per page
- `search` (string): Full-text search across organization names and descriptions
- `industry_segment` (string): Filter by industry segment (Fine Dining, Fast Food, Healthcare, etc.)
- `priority_level` (string): Filter by priority level (A, B, C, D)
- `assigned_user_id` (UUID): Filter by assigned user
- `sort` (string, default: "name"): Sort field (name, priority_level, last_interaction_date)
- `order` (string, default: "asc"): Sort order (asc, desc)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "org_123e4567-e89b-12d3-a456-426614174000",
      "name": "Gourmet Bistro Group",
      "industry_segment": "Fine Dining",
      "priority_level": "A",
      "business_type": "Restaurant Chain",
      "annual_revenue": 5000000.00,
      "employee_count": 150,
      "website_url": "https://gourmetbistro.com",
      "primary_phone": "+1-555-0123",
      "primary_email": "info@gourmetbistro.com",
      "account_status": "active",
      "assigned_user": {
        "id": "user_123",
        "full_name": "John Smith",
        "email": "john.smith@kitchenpantry.com"
      },
      "last_interaction_date": "2025-01-05T14:30:00Z",
      "next_follow_up_date": "2025-01-10T09:00:00Z",
      "relationship_strength": 8,
      "contact_count": 5,
      "opportunity_count": 2,
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2025-01-05T14:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

#### POST /api/v1/organizations

Creates a new organization record with validation and business rule enforcement.

**Request Body:**
```json
{
  "name": "New Restaurant Group",
  "industry_segment": "Fast Food",
  "priority_level": "B",
  "business_type": "Franchise",
  "annual_revenue": 2500000.00,
  "employee_count": 75,
  "website_url": "https://newrestaurant.com",
  "primary_phone": "+1-555-0456",
  "primary_email": "contact@newrestaurant.com",
  "billing_address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "postal_code": "90210",
    "country": "US"
  },
  "payment_terms": "Net 30",
  "credit_limit": 50000.00,
  "notes": "Potential for expansion into multiple locations"
}
```

**Validation Rules:**
- `name` is required and must be unique within the user's accessible organizations
- `priority_level` must be one of: A, B, C, D
- `industry_segment` must be a valid segment from the lookup table
- `annual_revenue` and `credit_limit` must be positive numbers
- `email` must be valid email format
- `website_url` must be valid URL format

#### GET /api/v1/organizations/{id}

Retrieves detailed information for a specific organization including related contacts, recent interactions, and opportunities.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "org_123e4567-e89b-12d3-a456-426614174000",
    "name": "Gourmet Bistro Group",
    "industry_segment": "Fine Dining",
    "priority_level": "A",
    "business_type": "Restaurant Chain",
    "annual_revenue": 5000000.00,
    "employee_count": 150,
    "billing_address": {
      "street": "456 Business Ave",
      "city": "Metro City",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"
    },
    "shipping_address": {
      "street": "789 Delivery Rd",
      "city": "Metro City", 
      "state": "NY",
      "postal_code": "10002",
      "country": "US"
    },
    "contacts": [
      {
        "id": "contact_123",
        "full_name": "Sarah Johnson",
        "job_title": "Purchasing Manager",
        "is_primary_contact": true,
        "email_primary": "sarah.johnson@gourmetbistro.com",
        "phone_primary": "+1-555-0124"
      }
    ],
    "recent_interactions": [
      {
        "id": "interaction_123",
        "interaction_type": "CALL",
        "interaction_date": "2025-01-05T14:30:00Z",
        "subject": "Q1 Menu Planning Discussion",
        "outcome": "Positive",
        "user": {
          "full_name": "John Smith"
        }
      }
    ],
    "opportunities": [
      {
        "id": "opp_123",
        "opportunity_name": "Spring Menu Launch",
        "stage": "proposal",
        "estimated_value": 75000.00,
        "estimated_close_date": "2025-02-15"
      }
    ]
  }
}
```

#### PUT /api/v1/organizations/{id}

Updates an existing organization with complete resource replacement.

#### PATCH /api/v1/organizations/{id}

Performs partial updates to an organization, updating only specified fields.

#### DELETE /api/v1/organizations/{id}

Soft deletes an organization by setting `is_deleted = true`. Related contacts and interactions are preserved for audit purposes.

### Contacts API

The Contacts API manages individual contact information within organizations, supporting relationship tracking and communication preferences.

#### GET /api/v1/contacts

Retrieves contacts accessible to the authenticated user with filtering and search capabilities.

**Query Parameters:**
- `organization_id` (UUID): Filter contacts by organization
- `search` (string): Search across contact names, job titles, and email addresses
- `is_primary_contact` (boolean): Filter for primary contacts only
- `is_decision_maker` (boolean): Filter for decision makers only
- `authority_level` (integer): Filter by authority level (1-5)
- `last_interaction_days` (integer): Filter contacts with interactions within specified days

#### GET /api/v1/organizations/{org_id}/contacts

Retrieves all contacts within a specific organization with role-based filtering.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact_123e4567-e89b-12d3-a456-426614174000",
      "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "full_name": "Sarah Johnson",
      "job_title": "Purchasing Manager",
      "department": "Operations",
      "is_primary_contact": true,
      "is_decision_maker": true,
      "authority_level": 4,
      "email_primary": "sarah.johnson@gourmetbistro.com",
      "phone_primary": "+1-555-0124",
      "mobile_phone": "+1-555-0125",
      "preferred_contact_method": "email",
      "preferred_contact_time": "9:00 AM - 5:00 PM EST",
      "linkedin_url": "https://linkedin.com/in/sarahjohnson",
      "communication_preferences": {
        "email_frequency": "weekly",
        "content_types": ["product_updates", "industry_news"],
        "opt_out_marketing": false
      },
      "last_interaction_date": "2025-01-05T14:30:00Z",
      "next_follow_up_date": "2025-01-12T10:00:00Z",
      "relationship_score": 8,
      "influence_score": 9,
      "engagement_level": "high",
      "interaction_count": 15,
      "organization": {
        "name": "Gourmet Bistro Group",
        "industry_segment": "Fine Dining"
      }
    }
  ]
}
```

#### POST /api/v1/contacts

Creates a new contact with organization association and validation.

**Request Body:**
```json
{
  "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
  "first_name": "Michael",
  "last_name": "Chen",
  "job_title": "Executive Chef",
  "department": "Kitchen Operations",
  "is_primary_contact": false,
  "is_decision_maker": true,
  "authority_level": 5,
  "email_primary": "michael.chen@gourmetbistro.com",
  "phone_primary": "+1-555-0126",
  "preferred_contact_method": "phone",
  "communication_preferences": {
    "email_frequency": "monthly",
    "content_types": ["product_updates"],
    "best_contact_time": "2:00 PM - 4:00 PM"
  }
}
```

**Validation Rules:**
- `organization_id` must reference an accessible organization
- `first_name` and `last_name` are required
- `email_primary` must be unique within the organization
- `authority_level` must be between 1 and 5
- Only one primary contact per organization allowed

### Interactions API

The Interactions API tracks all communication and engagement activities between users and contacts, providing comprehensive activity history and follow-up management.

#### GET /api/v1/interactions

Retrieves interaction history with filtering, sorting, and pagination capabilities.

**Query Parameters:**
- `organization_id` (UUID): Filter interactions by organization
- `contact_id` (UUID): Filter interactions by contact
- `user_id` (UUID): Filter interactions by user
- `interaction_type` (string): Filter by interaction type (CALL, EMAIL, MEETING, VISIT, etc.)
- `date_from` (date): Filter interactions from specified date
- `date_to` (date): Filter interactions to specified date
- `outcome` (string): Filter by interaction outcome
- `follow_up_required` (boolean): Filter interactions requiring follow-up
- `priority_level` (string): Filter by priority level

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "int_123e4567-e89b-12d3-a456-426614174000",
      "organization": {
        "id": "org_123",
        "name": "Gourmet Bistro Group"
      },
      "contact": {
        "id": "contact_123",
        "full_name": "Sarah Johnson",
        "job_title": "Purchasing Manager"
      },
      "user": {
        "id": "user_123",
        "full_name": "John Smith"
      },
      "interaction_type": "CALL",
      "interaction_date": "2025-01-05T14:30:00Z",
      "duration_minutes": 45,
      "subject": "Q1 Menu Planning Discussion",
      "description": "Discussed upcoming menu changes and seasonal ingredient requirements. Sarah expressed interest in organic produce options.",
      "outcome": "Positive",
      "outcome_details": "Agreed to schedule follow-up meeting with chef to discuss specific requirements",
      "follow_up_required": true,
      "follow_up_date": "2025-01-12T10:00:00Z",
      "follow_up_notes": "Schedule meeting with Executive Chef Michael Chen",
      "sentiment_score": 4,
      "priority_level": "A",
      "tags": ["menu_planning", "organic_produce", "q1_2025"]
    }
  ]
}
```

#### POST /api/v1/interactions

Creates a new interaction record with automatic relationship updates and follow-up scheduling.

**Request Body:**
```json
{
  "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
  "contact_id": "contact_123e4567-e89b-12d3-a456-426614174000",
  "interaction_type": "MEETING",
  "interaction_date": "2025-01-08T15:00:00Z",
  "duration_minutes": 60,
  "subject": "Product Demonstration",
  "description": "Demonstrated new kitchen equipment line including energy-efficient ovens and prep stations.",
  "outcome": "Very Positive",
  "outcome_details": "Strong interest shown, requested formal proposal",
  "follow_up_required": true,
  "follow_up_date": "2025-01-15T09:00:00Z",
  "follow_up_notes": "Prepare formal proposal with pricing and installation timeline",
  "location": "Gourmet Bistro - Main Location",
  "meeting_attendees": ["Sarah Johnson", "Michael Chen", "John Smith"],
  "sentiment_score": 5,
  "priority_level": "A",
  "tags": ["product_demo", "kitchen_equipment", "proposal_requested"]
}
```

**Business Logic:**
- Automatically updates `last_interaction_date` on related organization and contact records
- Creates follow-up tasks if `follow_up_required` is true
- Updates relationship scores based on interaction outcomes
- Triggers notification workflows for team members

### Opportunities API

The Opportunities API manages sales pipeline tracking, including deal progression, value estimation, and competitive intelligence.

#### GET /api/v1/opportunities

Retrieves opportunities with pipeline analysis and forecasting capabilities.

**Query Parameters:**
- `organization_id` (UUID): Filter opportunities by organization
- `user_id` (UUID): Filter opportunities by assigned user
- `stage` (string): Filter by sales stage
- `probability_min` (integer): Minimum probability threshold
- `estimated_value_min` (decimal): Minimum estimated value
- `close_date_from` (date): Filter by estimated close date range
- `close_date_to` (date): Filter by estimated close date range

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "opp_123e4567-e89b-12d3-a456-426614174000",
      "organization": {
        "id": "org_123",
        "name": "Gourmet Bistro Group",
        "priority_level": "A"
      },
      "primary_contact": {
        "id": "contact_123",
        "full_name": "Sarah Johnson",
        "job_title": "Purchasing Manager"
      },
      "user": {
        "id": "user_123",
        "full_name": "John Smith"
      },
      "opportunity_name": "Spring Menu Equipment Upgrade",
      "description": "Complete kitchen equipment refresh for spring menu launch including ovens, prep stations, and refrigeration units",
      "opportunity_type": "New Business",
      "stage": "proposal",
      "probability": 75,
      "estimated_value": 125000.00,
      "estimated_close_date": "2025-02-28",
      "sales_cycle_days": 45,
      "lead_source": "Referral",
      "budget_confirmed": true,
      "authority_confirmed": true,
      "need_confirmed": true,
      "timeline_confirmed": true,
      "proposal_submitted": true,
      "proposal_date": "2025-01-15",
      "decision_criteria": "Energy efficiency, cost savings, installation timeline, warranty terms",
      "competitor_info": "Competing against KitchenPro Solutions and Industrial Food Systems",
      "priority_level": "A",
      "recent_interactions": [
        {
          "interaction_type": "MEETING",
          "interaction_date": "2025-01-08T15:00:00Z",
          "subject": "Product Demonstration",
          "outcome": "Very Positive"
        }
      ]
    }
  ],
  "meta": {
    "pipeline_summary": {
      "total_opportunities": 25,
      "total_value": 2500000.00,
      "weighted_value": 1875000.00,
      "average_deal_size": 100000.00,
      "average_sales_cycle": 60
    }
  }
}
```

#### POST /api/v1/opportunities

Creates a new sales opportunity with BANT qualification tracking.

**Request Body:**
```json
{
  "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
  "primary_contact_id": "contact_123e4567-e89b-12d3-a456-426614174000",
  "opportunity_name": "Summer Catering Contract",
  "description": "Annual catering contract for corporate events and meetings",
  "opportunity_type": "Renewal",
  "stage": "qualification",
  "probability": 60,
  "estimated_value": 85000.00,
  "estimated_close_date": "2025-03-31",
  "lead_source": "Existing Customer",
  "decision_criteria": "Menu variety, pricing, service quality, reliability",
  "decision_timeline": "Decision by end of March 2025",
  "budget_confirmed": false,
  "authority_confirmed": true,
  "need_confirmed": true,
  "timeline_confirmed": true,
  "priority_level": "B"
}
```

## Utility and Support Endpoints

### Search API

#### GET /api/v1/search

Provides unified search across organizations, contacts, and opportunities with relevance scoring.

**Query Parameters:**
- `q` (string, required): Search query
- `types` (array): Resource types to search (organizations, contacts, opportunities)
- `limit` (integer, default: 20): Maximum results per type

**Response Example:**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "org_123",
        "name": "Gourmet Bistro Group",
        "industry_segment": "Fine Dining",
        "relevance_score": 0.95
      }
    ],
    "contacts": [
      {
        "id": "contact_123",
        "full_name": "Sarah Johnson",
        "job_title": "Purchasing Manager",
        "organization_name": "Gourmet Bistro Group",
        "relevance_score": 0.87
      }
    ],
    "opportunities": [
      {
        "id": "opp_123",
        "opportunity_name": "Spring Menu Equipment Upgrade",
        "organization_name": "Gourmet Bistro Group",
        "stage": "proposal",
        "relevance_score": 0.82
      }
    ]
  }
}
```

### Analytics API

#### GET /api/v1/analytics/dashboard

Provides dashboard KPI metrics and performance indicators.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_organizations": 150,
      "total_contacts": 450,
      "total_opportunities": 25,
      "pipeline_value": 2500000.00,
      "weighted_pipeline": 1875000.00,
      "activities_this_week": 35,
      "follow_ups_due": 12
    },
    "trends": {
      "organizations_growth": 5.2,
      "pipeline_growth": 12.8,
      "activity_trend": 8.5
    },
    "pipeline_by_stage": [
      {
        "stage": "prospecting",
        "count": 8,
        "value": 400000.00
      },
      {
        "stage": "qualification", 
        "count": 6,
        "value": 750000.00
      },
      {
        "stage": "proposal",
        "count": 4,
        "value": 500000.00
      }
    ]
  }
}
```

### File Upload API

#### POST /api/v1/files/upload

Handles file uploads with virus scanning and metadata extraction.

**Request:** Multipart form data with file attachment

**Response Example:**
```json
{
  "success": true,
  "data": {
    "file_id": "file_123e4567-e89b-12d3-a456-426614174000",
    "filename": "proposal_document.pdf",
    "size": 2048576,
    "mime_type": "application/pdf",
    "url": "https://storage.supabase.co/object/public/files/proposal_document.pdf",
    "metadata": {
      "pages": 15,
      "created_date": "2025-01-07T10:30:00Z"
    }
  }
}
```

## Error Handling and Status Codes

### HTTP Status Code Usage

The API uses standard HTTP status codes with consistent error response formats:

**2xx Success Codes:**
- `200 OK`: Successful GET, PUT, PATCH requests
- `201 Created`: Successful POST requests creating new resources
- `204 No Content`: Successful DELETE requests

**4xx Client Error Codes:**
- `400 Bad Request`: Invalid request format or missing required fields
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Valid authentication but insufficient permissions
- `404 Not Found`: Requested resource does not exist
- `409 Conflict`: Resource conflict (duplicate names, constraint violations)
- `422 Unprocessable Entity`: Valid request format but business rule violations

**5xx Server Error Codes:**
- `500 Internal Server Error`: Unexpected server errors
- `502 Bad Gateway`: Supabase or external service unavailable
- `503 Service Unavailable`: Temporary service maintenance

### Error Response Format

All error responses follow a consistent structure with detailed error information:

```json
{
  "success": false,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input data",
      "field": "email_primary",
      "details": "Email format is invalid"
    }
  ],
  "meta": {
    "timestamp": "2025-01-07T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### Validation Error Handling

Field-level validation errors provide specific feedback for form validation:

```json
{
  "success": false,
  "errors": [
    {
      "code": "REQUIRED_FIELD",
      "message": "Required field missing",
      "field": "name",
      "details": "Organization name is required"
    },
    {
      "code": "INVALID_FORMAT",
      "message": "Invalid field format",
      "field": "email_primary",
      "details": "Email must be in valid format (user@domain.com)"
    },
    {
      "code": "CONSTRAINT_VIOLATION",
      "message": "Business rule violation",
      "field": "priority_level",
      "details": "Priority level must be one of: A, B, C, D"
    }
  ]
}
```

## Rate Limiting and Throttling

### Rate Limit Implementation

API endpoints implement rate limiting to prevent abuse and ensure fair resource usage:

**Rate Limit Headers:**
- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when rate limit resets

**Rate Limit Tiers:**
- **Authenticated Users**: 1000 requests per hour
- **Admin Users**: 2000 requests per hour
- **Search Endpoints**: 100 requests per 15 minutes
- **File Upload**: 50 uploads per hour

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "errors": [
    {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests",
      "details": "Rate limit of 1000 requests per hour exceeded. Try again in 15 minutes."
    }
  ],
  "meta": {
    "retry_after": 900
  }
}
```

## API Versioning Strategy

### Version Management

The API uses URL path versioning with backward compatibility support:

**Current Version:** `/api/v1/`
**Version Header:** `Accept: application/vnd.kitchenpantry.v1+json`

**Deprecation Policy:**
- New versions introduced with 6-month overlap period
- Deprecated versions supported for 12 months minimum
- Breaking changes require new major version
- Non-breaking changes added to current version

**Version Negotiation:**
- Default to latest version if no version specified
- Support version specification via URL path or Accept header
- Return version information in response headers

## Performance Optimization

### Caching Strategy

**Response Caching:**
- GET endpoints cache responses for 5 minutes
- Cache invalidation on related resource updates
- ETags for conditional requests
- Cache-Control headers for client-side caching

**Database Query Optimization:**
- Connection pooling for efficient resource usage
- Query result pagination to limit response size
- Strategic indexing for common query patterns
- Query performance monitoring and optimization

### Pagination Implementation

All list endpoints support cursor-based pagination for consistent performance:

**Pagination Parameters:**
- `page` (integer): Page number (1-based)
- `limit` (integer): Records per page (max 100)
- `cursor` (string): Cursor for next page (optional)

**Pagination Response:**
```json
{
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 150,
      "pages": 3,
      "has_next": true,
      "has_prev": true,
      "next_cursor": "eyJpZCI6IjEyMyJ9",
      "prev_cursor": "eyJpZCI6IjQ1NiJ9"
    }
  }
}
```

## Security Considerations

### Input Validation

All API inputs undergo comprehensive validation:

**Request Validation:**
- JSON schema validation for request structure
- Data type validation for all fields
- Range validation for numeric fields
- Format validation for emails, URLs, phone numbers
- SQL injection prevention through parameterized queries

**Output Sanitization:**
- HTML encoding for text fields
- URL validation for external links
- File type validation for uploads
- Content Security Policy headers

### Authentication Security

**Token Security:**
- JWT tokens with short expiration times (1 hour)
- Refresh token rotation for extended sessions
- Token blacklisting for logout and security events
- Secure token storage recommendations

**API Security Headers:**
- CORS configuration for allowed origins
- Content Security Policy (CSP) headers
- X-Frame-Options for clickjacking protection
- X-Content-Type-Options for MIME sniffing protection

## Integration Guidelines

### Client SDK Recommendations

**JavaScript/TypeScript SDK:**
```typescript
import { KitchenPantryAPI } from '@kitchenpantry/api-client';

const api = new KitchenPantryAPI({
  baseURL: 'https://api.kitchenpantry.com/v1',
  apiKey: 'your-api-key'
});

// Get organizations
const organizations = await api.organizations.list({
  priority_level: 'A',
  limit: 25
});

// Create interaction
const interaction = await api.interactions.create({
  organization_id: 'org_123',
  contact_id: 'contact_456',
  interaction_type: 'CALL',
  subject: 'Follow-up call',
  outcome: 'Positive'
});
```

### Webhook Integration

**Webhook Events:**
- `organization.created`
- `organization.updated`
- `contact.created`
- `interaction.created`
- `opportunity.stage_changed`

**Webhook Payload Example:**
```json
{
  "event": "opportunity.stage_changed",
  "timestamp": "2025-01-07T10:30:00Z",
  "data": {
    "opportunity_id": "opp_123",
    "previous_stage": "qualification",
    "new_stage": "proposal",
    "organization": {
      "id": "org_123",
      "name": "Gourmet Bistro Group"
    }
  }
}
```

## Conclusion

The Kitchen Pantry CRM API provides a comprehensive, secure, and scalable interface for food service industry relationship management. The RESTful design ensures consistency and ease of integration while supporting complex business workflows and real-time collaboration.

The API architecture balances performance, security, and usability through strategic caching, comprehensive validation, and role-based access control. Detailed error handling and monitoring capabilities ensure reliable operation and effective troubleshooting.

This API specification serves as the authoritative reference for all client integrations, providing clear contracts for frontend development, mobile applications, and third-party system integrations essential for Kitchen Pantry CRM success.

