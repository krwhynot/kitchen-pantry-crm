# Kitchen Pantry CRM

A modern customer relationship management system designed specifically for food service industry professionals.

## 🎯 Project Overview

Kitchen Pantry CRM is a comprehensive CRM solution tailored for the food service industry, featuring:

- **Mobile-First Design**: Optimized for iPad-wielding sales representatives
- **Touch-First Interface**: Intuitive gestures and responsive design
- **Offline Functionality**: Progressive Web App (PWA) capabilities
- **Real-time Collaboration**: Live data synchronization across teams
- **Industry-Specific Features**: Tailored for food service workflows

## 🚀 Technology Stack

### Frontend
- **Vue.js 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Headless UI** for accessible components

### Backend
- **Node.js** with Express.js
- **TypeScript** throughout the stack
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **JWT** for stateless authentication

### Development Tools
- **pnpm** for package management
- **ESLint** and **Prettier** for code quality
- **Vitest** for frontend testing
- **Jest** for backend testing
- **Playwright** for E2E testing

## 🏗️ Architecture

Kitchen Pantry CRM follows a **three-tier hybrid architecture**:

1. **Frontend Layer**: Vue.js 3 application with reactive UI components
2. **Middleware Layer**: Node.js/Express API gateway for business logic
3. **Backend Services**: Supabase providing database, auth, and real-time features

### Progressive Enhancement Strategy

- **Phase 1**: Wrap existing HTML templates in Vue components
- **Phase 2**: Integrate state management and API calls
- **Phase 3**: Full reactive implementation with real-time features

## 📋 Core Features

### Organization Management
- Company profiles and hierarchies
- Contact relationship mapping
- Activity tracking and analytics

### Contact Management
- Individual contact profiles
- Communication preferences
- Interaction history tracking

### Sales Pipeline
- Opportunity lifecycle management
- Visual pipeline interface
- Forecasting and analytics

### Product Catalog
- Food service product specifications
- Pricing and availability tracking
- Configuration management

## 🔧 Development Status

> **✅ Current Status**: Project has **substantial implementation completed** with working backend API, frontend components, database schema, and comprehensive testing infrastructure.

### Completed
- ✅ **Phase 1-6**: Complete infrastructure with Vue.js 3 frontend, Node.js/Express backend
- ✅ **Database Schema**: PostgreSQL with Supabase, RLS policies, and migrations
- ✅ **API Documentation**: OpenAPI/Swagger with 30+ endpoints and comprehensive testing
- ✅ **Testing Framework**: Jest + Supertest backend testing, Vitest frontend testing
- ✅ **Development Environment**: pnpm workspace monorepo with TypeScript throughout
- ✅ **Component Library**: Atomic design components with Tailwind CSS styling
- ✅ **State Management**: Pinia stores for organizations, contacts, auth, and more

### Current Phase: Phase 7 - Testing Implementation
1. Unit testing for all frontend components
2. Integration testing for user workflows
3. MCP-enhanced testing with AI assistance
4. Cross-browser and device testing

## 📖 Documentation

Comprehensive documentation is available in the `Docs/` directory:

- **[System Architecture Overview](Docs/System%20Architecture%20Overview.md)**: Detailed technical architecture
- **[MVP Development TODO](Docs/MVP%20Development%20TODO.md)**: Complete development roadmap
- **[CLAUDE.md](CLAUDE.md)**: AI assistant guidance for development

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x LTS
- pnpm package manager
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/krwhynot/kitchen-pantry-crm.git
cd kitchen-pantry-crm

# Install dependencies across all workspaces
pnpm install

# Start local Supabase stack 
pnpm supabase:start

# Run database migrations and seeding
pnpm db:migrate
pnpm db:seed

# Start development servers (frontend + backend)
pnpm dev
```

### Development Commands

**Active pnpm workspace monorepo** with working commands:

```bash
# Development - Start both frontend and backend
pnpm dev              # Concurrently runs Vue.js (5173) + Express (3000)
pnpm dev:frontend     # Vue.js with Vite dev server
pnpm dev:backend      # Node.js with tsx watch mode

# Building
pnpm build           # Build all packages (shared → backend → frontend)
pnpm build:frontend  # Build Vue.js for production
pnpm build:backend   # Build Node.js with TypeScript

# Testing - Comprehensive test suite
pnpm test            # Run Jest (backend) + Vitest (frontend)
pnpm test:backend    # Jest with Supertest API testing
pnpm test:frontend   # Vitest component tests
pnpm test:e2e        # Playwright end-to-end tests
pnpm test:coverage   # Coverage reports for both stacks

# Database Operations
pnpm db:migrate      # Run Supabase migrations
pnpm db:seed         # Seed development database
pnpm db:reset        # Hard reset database
pnpm supabase:start  # Start local Supabase stack

# Code Quality
pnpm lint            # ESLint across all packages
pnpm lint:fix        # Auto-fix linting issues
pnpm format          # Prettier format all files
pnpm type-check      # TypeScript checking all packages
```

## 🏢 Target Audience

- Food service sales representatives
- Restaurant industry professionals
- Food distribution companies
- Catering and hospitality businesses

## 🔒 Security & Compliance

- JWT authentication with Supabase Auth
- Row Level Security (RLS) for multi-tenant data isolation
- GDPR compliance measures
- Industry-standard encryption
- Regular security audits

## 📱 Mobile Support

- Progressive Web App (PWA) features
- Offline functionality
- Touch-optimized interface
- Responsive design for all devices
- Special optimization for iPad usage

## 🤝 Contributing

This project is currently in the setup phase. Contribution guidelines will be available once the development structure is established.

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For questions or support, please refer to the documentation or contact the development team.

---

**Kitchen Pantry CRM** - Modernizing food service relationship management, one interaction at a time.
