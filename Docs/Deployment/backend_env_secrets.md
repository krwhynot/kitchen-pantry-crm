backend_env_secrets.md

```markdown
---
file_name: 09_backend_env_secrets.md
title: Backend Environment and Secrets Management
---
This section covers the comprehensive environment configuration for the backend, including secure secret management and runtime validation to ensure system stability and security.

### Environment Configuration and Secrets Management

The backend deployment includes comprehensive environment configuration with secure secret management and validation.

**Environment Variables:** Structured environment variable management with validation and type checking. Environment configuration includes database connections, API keys, and feature flags with appropriate security measures.

**Secret Management:** Secure secret storage and rotation with access control and audit logging. Secret management includes database credentials, API keys, and encryption keys with automated rotation capabilities.

**Configuration Validation:** Runtime configuration validation with error handling and fallback mechanisms. Configuration validation ensures system stability and prevents deployment failures due to configuration errors.

```typescript
// config/environment.ts
import { z } from 'zod'

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database configuration
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  
  // Supabase configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),
  
  // Security configuration
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // External services
  REDIS_URL: z.string().url().optional(),
  SMTP_URL: z.string().url().optional(),
  
  // Feature flags
  ENABLE_RATE_LIMITING: z.coerce.boolean().default(true),
  ENABLE_AUDIT_LOGGING: z.coerce.boolean().default(true),
  
  // Monitoring
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().url().optional()
})

export type Environment = z.infer<typeof environmentSchema>

export const env = environmentSchema.parse(process.env)

// Validate critical configuration
export function validateEnvironment(): void {
  try {
    environmentSchema.parse(process.env)
    console.log('Environment configuration validated successfully')
  } catch (error) {
    console.error('Environment configuration validation failed:', error)
    process.exit(1)
  }
}