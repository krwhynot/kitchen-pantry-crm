# Input Validation and Sanitization

## Overview

The system implements **comprehensive input validation** and sanitization at both frontend and backend levels to prevent malicious data entry and provide immediate user feedback.

## Frontend Validation

### Client-Side Validation Service
**Immediate feedback** for user input validation:

```typescript
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
}
```

### Business Email Validation
```typescript
static validateBusinessEmail(email: string): boolean {
  const freeEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'
  ]
  
  if (!this.email(email)) return false
  
  const domain = email.split('@')[1].toLowerCase()
  return !freeEmailDomains.includes(domain)
}
```

### Password Validation
```typescript
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
```

## Backend Validation

### Schema Validation with Joi
**Server-side validation** using Joi schemas:

```typescript
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
  notes: Joi.string().max(5000)
})
```

### Validation Middleware
```typescript
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
```

## Security Sanitization

### SQL Injection Prevention
```typescript
export const sanitizeQuery = (query: string): string => {
  return query
    .replace(/[';\\]/g, '') // Remove dangerous characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '')
    .trim()
}
```

### XSS Prevention
```typescript
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

### Input Sanitization
```typescript
static sanitizeInput(value: string): string {
  return value
    .trim()
    .replace(/[<>\"'&]/g, '')
    .substring(0, 1000) // Limit length
}
```

## Database-Level Validation

### Database Constraints
**Final validation layer** using PostgreSQL constraints:

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

## Validation Best Practices

### Multi-Layer Validation
- **Frontend validation** for user experience
- **API validation** for security
- **Database constraints** for data integrity
- **Business rule validation** for domain logic

### Error Handling
- **Clear error messages** for users
- **Detailed logging** for developers
- **Security considerations** in error responses
- **Consistent error format** across the application

### Performance Optimization
- **Efficient validation** algorithms
- **Caching** for repeated validations
- **Asynchronous validation** where appropriate
- **Minimal database queries** for validation

## Common Validation Patterns

### Format Validation
- **Email format** validation
- **Phone number** standardization
- **URL format** checking
- **Date range** validation

### Business Rules
- **Unique constraint** validation
- **Relationship integrity** checking
- **Permission-based** validation
- **Workflow state** validation

### Data Quality
- **Completeness** checking
- **Consistency** validation
- **Accuracy** verification
- **Timeliness** validation