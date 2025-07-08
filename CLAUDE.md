# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kitchen Pantry CRM is a modern customer relationship management system designed specifically for food service industry professionals. The system targets iPad-wielding sales representatives and emphasizes touch-first design, offline functionality, and seamless integration with existing food service workflows.

**Current Status**: The project is in the documentation and planning phase. No actual code implementation exists yet - only comprehensive architectural documentation and development plans.

## Technology Stack

### Frontend (Planned)
- **Vue.js 3** with Composition API for reactive UI components
- **TypeScript** for type safety and better developer experience
- **Vite** as build tool with Hot Module Replacement (HMR)
- **Pinia** for state management (Vue 3 native)
- **Tailwind CSS** for utility-first styling
- **Vue Router** for navigation
- **Headless UI** for accessible components
- **Heroicons** for consistent iconography

### Backend (Planned)
- **Node.js 20.x LTS** with Express.js framework
- **TypeScript** for backend type safety
- **Supabase** for PostgreSQL database and authentication
- **JWT** for stateless authentication
- **Row Level Security (RLS)** for multi-tenant data isolation

### Development Tools (Planned)
- **pnpm** as package manager
- **ESLint** with TypeScript and Vue.js rules
- **Prettier** for code formatting
- **Husky** with lint-staged for git hooks
- **Jest** for backend testing
- **Vitest** for frontend testing
- **Playwright** for end-to-end testing

## Architecture Overview

The system follows a **three-tier hybrid architecture**:

1. **Frontend Layer**: Vue.js 3 application handling UI rendering, client-side state management, and real-time data synchronization
2. **Middleware Layer**: Node.js/Express API gateway processing business rules, request validation, and complex database operations
3. **Backend Services**: Supabase providing PostgreSQL database, authentication, real-time subscriptions, and file storage

### Progressive Enhancement Strategy

The development approach uses progressive enhancement:
- **Phase 1**: Wrap existing HTML templates in Vue components
- **Phase 2**: Integrate Pinia stores and API calls through middleware
- **Phase 3**: Convert to fully reactive data-driven components with real-time features

## Planned Development Commands

*Note: These commands are not yet implemented as the project is in documentation phase*

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

# Reset database
pnpm db:reset
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

## Planned Project Structure

```
KitchenPantry/
├── frontend/                 # Vue.js 3 application
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── stores/          # Pinia stores
│   │   ├── views/           # Page components
│   │   ├── router/          # Vue Router configuration
│   │   └── utils/           # Frontend utilities
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Backend utilities
│   ├── package.json
│   └── tsconfig.json
├── shared/                   # Shared types and utilities
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Common utilities
├── docs/                     # Project documentation
└── package.json              # Workspace configuration
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
- **OpenAPI/Swagger documentation** (planned)

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

- **No code exists yet** - this is a documentation-only project currently
- Reference `Docs/MVP Development TODO.md` for comprehensive implementation roadmap
- Reference `Docs/System Architecture Overview.md` for detailed technical specifications
- The project uses MCP (Model Context Protocol) servers for various integrations (Supabase, Playwright, etc.)
- All development should follow the progressive enhancement strategy outlined in the architecture documentation

## Next Steps

1. Set up the monorepo structure with frontend and backend directories
2. Initialize package.json files with proper dependencies
3. Configure TypeScript for both frontend and backend
4. Set up Supabase project and database schema
5. Create initial Vue.js application with Vite
6. Implement authentication system with Supabase Auth
7. Begin progressive enhancement from HTML templates to Vue components

When beginning implementation, start with Phase 1 tasks from the MVP Development TODO document.