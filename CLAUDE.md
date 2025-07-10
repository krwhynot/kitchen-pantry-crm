# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kitchen Pantry CRM is a modern customer relationship management system designed specifically for food service industry professionals. The system uses a **three-tier hybrid architecture** with Vue.js 3 frontend, Node.js/Express middleware, and Supabase backend services.

### System Architecture
 `@Docs/System Architecture Overview.md` – Hybrid Vue.js/Node.js design with progressive enhancement.

### MVP Roadmap
 `@Docs/MVP/README.md` – Phase-based roadmap and progress tracker  
 `@Docs/MVP/overview.md` – Strategy, success metrics, and development goals  
 `@Docs/MVP/phase1_setup.md` – Infra, dev environment, base setup  
 `@Docs/MVP/phase2_data_models.md` – DB schema and data access  
 `@Docs/MVP/phase3_authentication.md` – Auth/RBAC implementation  
 `@Docs/MVP/phase4_business_logic.md` – Core orgs, contacts, and ops logic  
 `@Docs/MVP/phase5_ui_development.md` – Component library + feature UIs  
 `@Docs/MVP/phases6-11_advanced.md` – APIs, testing, security, deploy

### API Docs
 `@Docs/API/API Documentation.md` – Full REST API and integration  
 `@Docs/API/API Error Handling.md` – Standard error handling  
 `@Docs/API/Authentication API.md` – JWT auth & user sessions  
 `@Docs/API/Customers API.md` – CRM & interaction endpoints  
 `@Docs/API/Interactions API.md` – Comms logging + analytics  
 `@Docs/API/Opportunities API.md` – Pipeline + forecasting  
 `@Docs/API/Organizations API.md` – Org structure + hierarchy  
 `@Docs/API/Products API.md` – Food catalog + pricing

### Business Logic
 `@Docs/BusinessLogic/overview.md` – Process/workflow automation  
 `@Docs/BusinessLogic/implementation_guide.md` – Logic integration steps  
 `@Docs/BusinessLogic/lead_management.md` – Lead flow & conversion  
 `@Docs/BusinessLogic/rule_engine.md` – Configurable decision engine  
 `@Docs/BusinessLogic/sales_processes.md` – Full sales pipeline  
 `@Docs/BusinessLogic/workflow_automation.md` – Process automation guides

### Database
 `@Docs/Database/Core Database Entities.md` – ER models and definitions  
 `@Docs/Database/Database Indexes and Performance.md` – PG optimization  
 `@Docs/Database/Database Schema Overview.md` – Schema + RLS  
 `@Docs/Database/Database Security Policies.md` – Access + RLS rules

### Security
 `@Docs/Security/README.md` – Security framework hub  
 `@Docs/Security/Authentication/overview.md` – Auth patterns  
 `@Docs/Security/Authentication/jwt_implementation.md` – JWT config  
 `@Docs/Security/Authentication/multi_factor_auth.md` – MFA setup  
 `@Docs/Security/Authentication/supabase_integration.md` – Supabase auth  
 `@Docs/Security/Authorization/role_based_access.md` – RBAC  
 `@Docs/Security/Authorization/row_level_security.md` – DB RLS policies  
 `@Docs/Security/Compliance/gdpr_compliance.md` – GDPR guide  
 `@Docs/Security/Compliance/ccpa_compliance.md` – CCPA guide  
 `@Docs/Security/Compliance/soc2_compliance.md` – SOC 2 checklist  
 `@Docs/Security/Data_Protection/encryption.md` – At-rest/in-transit encryption  
 `@Docs/Security/Data_Protection/incident_response.md` – Incident handling  
 `@Docs/Security/Monitoring/audit_logging.md` – Logging strategy  
 `@Docs/Security/Monitoring/security_monitoring.md` – Threat monitoring  
 `@Docs/Security/Validation/input_validation.md` – Input sanitization

### Deployment
 `@Docs/Deployment/deployment_overview.md` – Infra + pipeline strategy  
 `@Docs/Deployment/backend_env_secrets.md` – Env/secrets mgmt  
 `@Docs/Deployment/backend_pipeline.md` – Node.js CI/CD  
 `@Docs/Deployment/backend_supabase_mcp.md` – Supabase MCP setup  
 `@Docs/Deployment/database_backup_recovery.md` – Backup + recovery  
 `@Docs/Deployment/database_migrations.md` – Schema versioning  
 `@Docs/Deployment/database_supabase_setup.md` – Supabase config + RLS  
 `@Docs/Deployment/dr_bcp.md` – BCP + geographic redundancy  
 `@Docs/Deployment/frontend_cdn_pwa.md` – PWA + CDN deploy  
 `@Docs/Deployment/infra_cloud_strategy.md` – Multi-cloud infra  
 `@Docs/Deployment/infra_geo_distribution.md` – Global infra  
 `@Docs/Deployment/infra_multi_tier.md` – Tiered infra model  
 `@Docs/Deployment/monitoring_apm.md` – APM setup  
 `@Docs/Deployment/monitoring_health_alerts.md` – Health + alerting  
 `@Docs/Deployment/security_compliance.md` – Infra compliance

### Performance
 `@Docs/Performance/overview.md` – Perf strategy  
 `@Docs/Performance/performance_architecture.md` – Scalable architecture  
 `@Docs/Performance/backend_optimization.md` – Server + DB tuning  
 `@Docs/Performance/frontend_optimization.md` – UI performance  
 `@Docs/Performance/alerting-system.md` – Perf alerts  
 `@Docs/Performance/monitoring-apm.md` – APM metrics  
 `@Docs/Performance/backend-optimization.md` – Server caching  
 `@Docs/Performance/frontend-optimization.md` – UI enhancements

### Testing & QA
 `@Docs/Testing/README.md` – QA strategy hub  
 `@Docs/Testing/testing_framework_architecture.md` – Test infra  
 `@Docs/Testing/unit_testing_implementation.md` – Unit tests (Jest/Vitest)  
 `@Docs/Testing/integration_testing.md` – API/workflow tests  
 `@Docs/Testing/e2e_testing.md` – Playwright/cross-browser E2E  
 `@Docs/Testing/performance_testing.md` – Load/stress testing  
 `@Docs/Testing/qa_processes.md` – QA workflows

### UI/UX Design
 `@Docs/UI/UX Design Guide.md` – UX principles  
 `@Docs/UI/Design System Specifications.md` – Tokens + guidelines  
 `@Docs/UI/Component Library Organization.md` – Atomic components  
 `@Docs/UI/UI Component Guidelines.md` – Design standards  
 `@Docs/UI/Style Guide and Branding.md` – Branding + visuals  
 `@Docs/UI/Accessibility Standards.md` – WCAG compliance  
 `@Docs/UI/Responsive Design Requirements.md` – Mobile-first UI  
 `@Docs/UI/User Experience Flow Diagrams.md` – UX flows

### Project Structure
 `@Docs/Structure/README.md` – Structure guide  
 `@Docs/Structure/overview.md` – High-level architecture  
 `@Docs/Structure/source_code_organization.md` – `src/` breakdown  
 `@Docs/Structure/testing_documentation.md` – Test doc structure  
 `@Docs/Structure/configuration_build.md` – Build + env setup  
 `@Docs/Structure/naming_conventions.md` – Naming standards  
 `@Docs/Structure/development_workflow.md` – Dev best practices
   
## Architecture

### Hybrid Architecture Pattern
- **Frontend Layer**: Vue.js 3 with Composition API, TypeScript, Pinia state management
- **Middleware Layer**: Node.js/Express API gateway for business logic and validation
- **Backend Services**: Supabase (PostgreSQL + Auth + Real-time + Storage)

### Progressive Enhancement Strategy
The system follows a phased migration approach:
1. **Phase 1**: Wrap existing HTML templates in Vue components
2. **Phase 2**: Integrate Pinia stores, API calls, and authentication
3. **Phase 3**: Full reactive implementation with real-time features

### Key Technical Decisions
- **pnpm workspace monorepo** with `backend/`, `frontend/`, and `shared/` packages
- **TypeScript throughout** the entire stack for type safety
- **Atomic Design** pattern for component organization (atoms → molecules → organisms)
- **Row Level Security (RLS)** in Supabase for multi-tenant data isolation
- **JWT authentication** with Supabase Auth integration

## Development Commands

### Core Development Workflow
```bash
# Start development environment (both frontend and backend)
pnpm dev

# Individual services
pnpm dev:frontend    # Vue.js dev server on port 5173
pnpm dev:backend     # Node.js with tsx watch mode on port 3000
```

### Building
```bash
# Build all packages in dependency order
pnpm build           # shared → backend → frontend

# Individual builds
pnpm build:frontend  # Vue.js production build
pnpm build:backend   # TypeScript compilation
```

### Testing
```bash
# Run all tests
pnpm test            # Jest (backend) + Vitest (frontend)

# Individual test suites
pnpm test:backend    # Jest with Supertest for API testing
pnpm test:frontend   # Vitest for component tests
pnpm test:e2e        # Playwright end-to-end tests
pnpm test:coverage   # Coverage reports for both stacks
```

### Database Operations
```bash
# Database management
pnpm db:migrate      # Run Supabase migrations
pnpm db:seed         # Seed development database
pnpm db:reset        # Hard reset database
pnpm supabase:start  # Start local Supabase stack
```

### Code Quality
```bash
# Linting and formatting
pnpm lint            # ESLint across all packages
pnpm lint:fix        # Auto-fix linting issues
pnpm format          # Prettier format all files
pnpm type-check      # TypeScript checking all packages
```

### MCP Integration
```bash
# MCP development setup (AI-assisted development)
pnpm mcp:setup       # Initialize MCP development environment
pnpm mcp:validate    # Validate MCP security configuration
```

## Project Structure

### Database Schema
Core entities follow food service industry relationships:
- **Organizations** (primary entity)
- **Contacts** (belong to Organizations)
- **Interactions** (link Contacts and Users)
- **Opportunities** (sales pipeline tracking)
- **Products** (food service catalog)

### Frontend Organization
- **Components**: Atomic design pattern (`atoms/`, `molecules/`, `organisms/`)
- **Stores**: Pinia stores for each major entity (auth, organizations, contacts, etc.)
- **Services**: API communication layer
- **Types**: Shared TypeScript interfaces

### Backend Organization
- **Controllers**: Request/response handling
- **Services**: Business logic implementation
- **Repositories**: Data access layer
- **Middleware**: Auth, validation, error handling, rate limiting
- **Models**: Database entity definitions

## Key Implementation Details

### Authentication Flow
- JWT tokens with Supabase Auth
- Role-based access control (Admin, Manager, Sales Rep)
- Row Level Security policies for tenant isolation

### API Design
- RESTful endpoints following resource-based patterns
- Consistent response format with status codes, data, errors
- Pagination and filtering support for list endpoints
- OpenAPI/Swagger documentation

### Testing Strategy
- **Unit Tests**: Jest (backend), Vitest (frontend)
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for user workflows
- **Test Data**: Factory pattern for consistent test data generation

### State Management
- Pinia stores with TypeScript interfaces
- Reactive data binding with Vue 3 Composition API
- Optimistic updates with error recovery
- Real-time synchronization via Supabase subscriptions

## Development Guidelines

### Code Organization
- Follow existing TypeScript patterns and interfaces
- Use atomic design principles for components
- Implement proper error handling and validation
- Follow the established naming conventions

### Testing Requirements
- Write unit tests for all new utilities and services
- Add integration tests for new API endpoints
- Include component tests for complex UI logic
- Update E2E tests for critical user workflows

### Database Changes
- Always use migrations for schema changes
- Update TypeScript types after schema modifications
- Test RLS policies thoroughly
- Document any breaking changes

### Performance Considerations
- Use pagination for large datasets
- Implement proper indexing for queries
- Optimize component re-renders
- Consider real-time subscription efficiency

## Security Implementation

### Authentication & Authorization
- JWT tokens with short expiration times
- Role-based permissions at API and database levels
- Input validation using Zod schemas
- Rate limiting on API endpoints

### Data Protection
- Row Level Security for multi-tenant isolation
- Sensitive data encryption at rest
- Audit trails for all data modifications
- Proper error handling without information disclosure

## Common Development Patterns

### API Endpoint Pattern
```typescript
// Service layer handles business logic
export class EntityService extends BaseService {
  async create(data: CreateEntityDTO): Promise<Entity> {
    // Validation, business rules, database operations
  }
}

// Controller handles HTTP concerns
export const createEntity = async (req: Request, res: Response) => {
  // Authentication, request validation, response formatting
}
```

### Vue Component Pattern
```vue
<script setup lang="ts">
// Composition API with TypeScript
// Pinia store usage
// Proper error handling
</script>
```

### Database Migration Pattern
```sql
-- Always include rollback instructions
-- Use proper naming conventions
-- Test with sample data
```

## Troubleshooting

### Common Issues
- **Database Connection**: Check Supabase status and environment variables
- **Build Errors**: Ensure dependencies are installed with `pnpm install`
- **Type Errors**: Run `pnpm type-check` to identify TypeScript issues
- **Test Failures**: Check test database setup and mock data

### Debug Commands
```bash
# Check service status
pnpm supabase:status

# View build logs
pnpm build --verbose

# Run specific test suites
pnpm test:backend -- --testNamePattern="specific test"
```

## Current Development Status

The project is in **Phase 7 - Testing Implementation** with:
- ✅ Complete infrastructure (Vue.js 3 + Node.js/Express + Supabase)
- ✅ Database schema with RLS policies
- ✅ API documentation with 30+ endpoints
- ✅ Component library with atomic design
- ✅ State management with Pinia
- 🔄 Comprehensive unit and integration testing
- 🔄 MCP-enhanced development workflow

## Environment Setup

### Prerequisites
- Node.js 20.x LTS
- pnpm 8.x
- Supabase CLI

### Initial Setup
```bash
# Install dependencies
pnpm install

# Start local Supabase
pnpm supabase:start

# Run migrations and seed data
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Supabase Studio: http://localhost:54323