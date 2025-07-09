# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kitchen Pantry CRM is a modern customer relationship management system designed specifically for food service industry professionals. The system targets iPad-wielding sales representatives and emphasizes touch-first design, offline functionality, and seamless integration with existing food service workflows.

**Current Status**: The project is in active development with significant implementation completed. Task 6.2 (API Documentation and Testing) has been completed with comprehensive OpenAPI specifications, testing infrastructure, and database schema implementation. The project now includes working backend API, frontend components, database migrations, and AI-assisted development workflows using MCP integration.

## Project Reference

**Vue.js component library and design system**
@Docs/Frontend Component Architecture.md

**Complete system design and technology stack**
@Docs/System Architecture Overview.md

**Development roadmap and progress tracking**
@Docs/MVP Development TODO.md

**Design system and user experience guidelines**
@Docs/UI/UX Design Guide.md

**Performance management and observability**
@Docs/Performance Optimization and Monitoring.md

**RESTful API design and documentation**
@Docs/API Specifications and Endpoints.md

**Production deployment and DevOps procedures**
@Docs/Deployment and Infrastructure Guide.md

**Security framework and access control**
@Docs/Authentication and Security Implementation.md

**Business rules and process automation**
@Docs/Business Logic and Workflow Management.md

**Comprehensive data structure and relationships**
@Docs/Database Schema and Data Models.md

**Comprehensive testing framework**
@Docs/Testing Strategy and Quality Assurance.md

**Completed API documentation and testing infrastructure**
@API_DOCUMENTATION_SUMMARY.md

**MCP development workflow and AI-assisted database management**
@supabase/MCP_DEVELOPMENT_GUIDE.md

## Technology Stack

### Frontend (Implemented)
- **Vue.js 3.3.4** with Composition API for reactive UI components
- **TypeScript 5.1.6** for type safety and better developer experience
- **Vite 4.4.0** as build tool with Hot Module Replacement (HMR)
- **Pinia 2.1.6** for state management (Vue 3 native)
- **Tailwind CSS 3.3.3** for utility-first styling
- **Vue Router 4.2.4** for navigation
- **Headless UI 1.7.14** for accessible components
- **Heroicons 2.0.18** for consistent iconography
- **Axios 1.4.0** for HTTP client requests

### Backend (Implemented)
- **Node.js 20.x LTS** with Express.js 4.18.2 framework
- **TypeScript 5.1.6** for backend type safety
- **Supabase 2.33.1** for PostgreSQL database and authentication
- **JWT 9.0.2** for stateless authentication
- **Row Level Security (RLS)** for multi-tenant data isolation
- **Zod 3.21.4** for schema validation
- **Swagger UI Express 5.0.0** for API documentation
- **Helmet 7.0.0** for security headers
- **CORS 2.8.5** for cross-origin resource sharing

### Development Tools (Implemented)
- **pnpm 8.12.1** as package manager with workspace support
- **ESLint 8.45.0** with TypeScript and Vue.js rules
- **Prettier 3.1.1** for code formatting
- **Husky 8.0.3** with lint-staged 13.2.3 for git hooks
- **Jest 29.6.1** for backend testing with Supertest 6.3.3
- **Vitest 0.34.1** for frontend testing with @vue/test-utils 2.4.1
- **Playwright 1.37.0** for end-to-end testing
- **TSX 3.12.7** for TypeScript execution
- **Concurrently 8.2.2** for parallel script execution

## Implementation Status

### ✅ Completed Phase 6: API Documentation and Testing

**Task 6.2 - API Documentation and Testing** has been fully implemented with:

#### OpenAPI/Swagger Documentation
- **Complete OpenAPI 3.0.3 specification** (`backend/docs/openapi.yaml`)
- **30+ documented endpoints** covering all core resources
- **Interactive Swagger UI** with custom styling and branding
- **Comprehensive request/response schemas** with validation rules
- **Authentication and authorization specifications**
- **Multiple format support** (JSON, YAML, HTML)

#### Comprehensive Testing Infrastructure
- **Jest 29.6.1** with TypeScript support for backend testing
- **Supertest 6.3.3** for API endpoint testing
- **200+ test cases** covering all endpoints and scenarios
- **80% code coverage** minimum requirement with HTML reporting
- **Automated test data generation** and database cleanup
- **Authentication and authorization testing**
- **Error handling and edge case validation**

#### Test Coverage by Module
- **Organizations API**: 8 endpoints with full CRUD testing
- **Contacts API**: 7 endpoints with relationship validation
- **Interactions API**: 6 endpoints with categorization and analytics
- **Opportunities API**: 6 endpoints with pipeline management
- **Search API**: Unified search with relevance scoring
- **Analytics API**: Dashboard KPIs and performance metrics
- **Authentication**: JWT validation and role-based access control

#### Database Implementation
- **PostgreSQL with Supabase** for production-ready database
- **Row Level Security (RLS)** policies for multi-tenant isolation
- **6 core migration files** creating foundational schema
- **Database seeding** with realistic test data
- **Backup and recovery** systems with automated scheduling
- **MCP integration** for AI-assisted database management

### 🔄 Current Development Phase

The project is now in **Phase 7: Testing Implementation** focusing on:
- Unit testing for frontend components
- Integration testing for full user workflows
- MCP-enhanced testing with AI assistance
- Cross-browser and device testing

## Architecture Overview

The system follows a **three-tier hybrid architecture**:

1. **Frontend Layer**: Vue.js 3 application handling UI rendering, client-side state management, and real-time data synchronization
2. **Middleware Layer**: Node.js/Express API gateway processing business rules, request validation, and complex database operations
3. **Backend Services**: Supabase providing PostgreSQL database, authentication, real-time subscriptions, and file storage

### Progressive Enhancement Strategy

The development approach uses progressive enhancement:
- **Phase 1**: Wrap existing HTML templates in Vue components ✅
- **Phase 2**: Integrate Pinia stores and API calls through middleware (In Progress)
- **Phase 3**: Convert to fully reactive data-driven components with real-time features (Planned)

## Development Commands

*Note: All commands are fully implemented and working*

### Development
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Start frontend only
pnpm dev:frontend

# Start backend only  
pnpm dev:backend
```

### Building
```bash
# Build for production
pnpm build

# Build frontend
pnpm build:frontend

# Build backend
pnpm build:backend
```

### Testing
```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm test:frontend

# Run backend tests
pnpm test:backend

# Run E2E tests
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage
```

### Database
```bash
# Run database migrations
pnpm db:migrate

# Seed development database
pnpm db:seed

# Reset database (hard reset)
pnpm db:reset

# Soft reset database
pnpm db:reset:soft

# Rollback last migration
pnpm db:rollback
```

### Supabase
```bash
# Start Supabase local development
pnpm supabase:start

# Stop Supabase services
pnpm supabase:stop

# Check Supabase status
pnpm supabase:status

# Reset Supabase database
pnpm supabase:reset

# Generate TypeScript types
pnpm supabase:types
```

### MCP Development
```bash
# Set up MCP development environment
pnpm mcp:setup

# Validate MCP security configuration
pnpm mcp:validate
```

### Code Quality
```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type checking
pnpm type-check
```

## Current Project Structure

```
KitchenPantry/
├── frontend/                 # Vue.js 3 application
│   ├── src/
│   │   ├── components/      # Atomic design components (atoms, molecules, organisms)
│   │   ├── stores/          # Pinia stores (auth, organizations, contacts, etc.)
│   │   ├── views/           # Page components
│   │   ├── router/          # Vue Router configuration
│   │   ├── composables/     # Vue composables
│   │   ├── utils/           # Frontend utilities with dev/mock APIs
│   │   └── types/           # Frontend type definitions
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Express middleware (auth, validation, swagger)
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   ├── repositories/    # Data access layer
│   │   ├── config/          # Configuration files
│   │   ├── db/              # Database utilities, migrations, seeds
│   │   ├── validation/      # Zod schemas
│   │   └── utils/           # Backend utilities
│   ├── docs/
│   │   └── openapi.yaml     # OpenAPI 3.0.3 specification
│   ├── tests/
│   │   ├── api/             # API endpoint tests
│   │   └── setup.ts         # Test configuration
│   ├── scripts/             # Build and utility scripts
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── shared/                   # Shared types and utilities
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Common utilities
├── supabase/                 # Supabase configuration
│   ├── migrations/          # Database migrations
│   ├── scripts/             # MCP setup scripts
│   ├── config.toml          # Supabase configuration
│   ├── mcp-config.json      # MCP configuration
│   └── seed.sql             # Database seeding
├── Docs/                     # Project documentation
├── API_DOCUMENTATION_SUMMARY.md  # Completed API docs summary
├── package.json              # Workspace configuration
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── pnpm-lock.yaml           # Dependency lock file
```

## Core Business Entities

The system manages these primary entities:

- **Organizations**: Company information, hierarchies, and relationships
- **Contacts**: Individual people within organizations with roles and responsibilities
- **Interactions**: All communication history (emails, calls, meetings, etc.)
- **Opportunities**: Sales pipeline tracking with stages and forecasting
- **Products**: Food service product catalog with pricing and specifications
- **Users**: System users with role-based permissions and territories

## Database Design Principles

- **Multi-tenant architecture** with organization-level data isolation
- **Row Level Security (RLS)** policies for secure data access
- **Soft deletion** strategy for data integrity
- **Audit trails** with created_at, updated_at, and created_by fields
- **Normalized relational design** optimized for food service workflows

## API Design

- **RESTful endpoints** following HTTP conventions
- **API versioning** with `/api/v1/` prefix
- **Resource-based URLs** (organizations, contacts, interactions, opportunities)
- **Consistent response format** with status codes, data payload, and error messages
- **Pagination and filtering** for large datasets
- **OpenAPI/Swagger documentation** ✅ (implemented in `backend/docs/openapi.yaml`)

## Security Considerations

- **JWT token authentication** with Supabase Auth integration
- **Role-based access control (RBAC)** for different user types
- **Row Level Security (RLS)** for database-level access control
- **Input validation and sanitization** using Zod schemas
- **HTTPS/TLS encryption** for all communications
- **GDPR compliance** measures for data privacy

## Development Best Practices

- **Mobile-first design** optimized for iPad sales representatives
- **Progressive Web App (PWA)** features for offline functionality
- **Touch-first interface** with intuitive gestures
- **Real-time synchronization** using Supabase subscriptions
- **Component-based architecture** with reusable UI elements
- **Type-safe development** with TypeScript throughout the stack

## Important Notes

- **Active development** - Task 6.2 completed with comprehensive API documentation and testing
- Reference `Docs/MVP Development TODO.md` for comprehensive implementation roadmap and current progress
- Reference `Docs/System Architecture Overview.md` for detailed technical specifications  
- Reference `API_DOCUMENTATION_SUMMARY.md` for complete API implementation details
- Reference `supabase/MCP_DEVELOPMENT_GUIDE.md` for AI-assisted development workflows
- The project uses MCP (Model Context Protocol) servers for enhanced development experience
- All development follows the progressive enhancement strategy with Phase 1 components completed
- Database schema is fully implemented with RLS policies and automated testing

## Next Steps

**Current Phase: Phase 7 - Testing Implementation**

### Immediate Next Tasks (Phase 7.1)
1. **Unit Testing Implementation**
   - Frontend component unit tests with Vitest
   - Backend service and utility unit tests
   - Model validation and business logic tests
   - Integration with existing Jest testing infrastructure

2. **Integration Testing Setup**
   - End-to-end user workflow testing
   - API integration testing with real database
   - Authentication and authorization flow testing
   - Database migration and seeding testing

### Phase 7.2 - MCP-Enhanced Testing
1. **AI-Assisted Test Development**
   - MCP-powered test data generation
   - Schema-driven test case creation
   - Automated test scenario validation
   - Database testing utilities with MCP

### Phase 7.3 - Cross-Browser Testing
1. **Multi-Platform Validation**
   - Playwright E2E testing across browsers
   - Mobile device testing and validation
   - Accessibility testing implementation
   - Visual regression testing setup

**Reference**: See `Docs/MVP Development TODO.md` for detailed Phase 7 implementation plan

### Completed Milestones ✅
- ✅ **Phase 6.2**: API Documentation and Testing infrastructure
- ✅ **Database Schema**: Complete with RLS policies and migrations
- ✅ **OpenAPI Documentation**: Interactive Swagger UI with 30+ endpoints
- ✅ **Testing Framework**: Jest/Supertest with 200+ test cases
- ✅ **MCP Integration**: AI-assisted database development workflows

## Supabase MCP Tool Usage Guide

The project uses Supabase MCP (Model Context Protocol) server for database operations. Here's how to effectively use the available tools:

### Project Information
- **Project URL**: https://sbrlujvekkpthwztxfyo.supabase.co
- **Database**: PostgreSQL with Row Level Security (RLS) enabled
- **Authentication**: Supabase Auth with JWT tokens

### Database Management Functions

#### Table Operations
- `mcp__supabase__list_tables` - List all tables in specified schemas (default: public)
- `mcp__supabase__execute_sql` - Execute raw SQL queries (use for SELECT operations)
- `mcp__supabase__apply_migration` - Apply DDL migrations (CREATE, ALTER, DROP tables)

#### Migration Management
- `mcp__supabase__list_migrations` - List all applied migrations
- `mcp__supabase__apply_migration` - Apply new migrations with name and SQL

#### Development Branches
- `mcp__supabase__create_branch` - Create development branch (requires cost confirmation)
- `mcp__supabase__list_branches` - List all development branches
- `mcp__supabase__delete_branch` - Delete development branch
- `mcp__supabase__merge_branch` - Merge branch to production
- `mcp__supabase__reset_branch` - Reset branch to specific migration
- `mcp__supabase__rebase_branch` - Rebase branch on production

#### Project Configuration
- `mcp__supabase__get_project_url` - Get project API URL
- `mcp__supabase__get_anon_key` - Get anonymous API key
- `mcp__supabase__generate_typescript_types` - Generate TypeScript types from schema

#### Extensions and Logs
- `mcp__supabase__list_extensions` - List all database extensions
- `mcp__supabase__get_logs` - Get logs by service (api, postgres, auth, etc.)
- `mcp__supabase__get_advisors` - Get security/performance advisors

#### Edge Functions
- `mcp__supabase__list_edge_functions` - List all Edge Functions
- `mcp__supabase__deploy_edge_function` - Deploy Edge Function with files

#### Documentation
- `mcp__supabase__search_docs` - Search Supabase documentation with GraphQL

### Current Database Schema

The project has these main tables:
- **profiles** - User profiles (id, email, role, full_name)
- **organizations** - Company information with priority/segment/distributor settings
- **contacts** - Individual contacts within organizations
- **customers** - Customer records with broker assignments
- **products** - Food service product catalog
- **orders** - Order tracking with customer/broker relationships
- **visits** - Sales visit records with GPS coordinates
- **reminders** - Task reminders with priority levels
- **deals** - Sales pipeline opportunities
- **tasks** - General task management
- **sales** - Sales representative information
- **settings** - Configuration categories (priority, segment, role, etc.)
- **audit_logs** - System audit trail

### Best Practices

1. **DDL Operations**: Always use `apply_migration` for schema changes
2. **Data Operations**: Use `execute_sql` for SELECT queries and data manipulation
3. **Development**: Create branches for testing schema changes
4. **Security**: All tables have RLS enabled - respect security policies
5. **Documentation**: Use `search_docs` for Supabase feature guidance
6. **Monitoring**: Check `get_advisors` regularly for security/performance issues

### Common Usage Patterns

```sql
-- List all tables
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- View user roles
SELECT id, email, role FROM profiles;

-- Get organization data with settings
SELECT o.*, 
       p.label as priority_label,
       s.label as segment_label,
       d.label as distributor_label
FROM organizations o
LEFT JOIN settings p ON o.priorityId = p.id
LEFT JOIN settings s ON o.segmentId = s.id  
LEFT JOIN settings d ON o.distributorId = d.id;
```

### Error Handling
- Check `get_logs` for database errors
- Use `get_advisors` for security/performance warnings
- Review RLS policies if access is denied
- Always test migrations on development branches first