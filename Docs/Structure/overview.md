# Project Structure Overview

## Summary
Kitchen Pantry CRM follows a **modern Vue.js 3 + TypeScript architecture** with **Supabase backend services**. The project emphasizes **separation of concerns**, **maintainability**, and **scalability** through clear organizational boundaries.

## Key Architectural Principles

### **Separation of Concerns**
- **Frontend components** isolated from backend services
- **Configuration files** separated from application logic
- **Documentation** maintained separately from code
- **Testing** organized by test type and scope

### **Maintainability Focus**
- **Atomic design patterns** for component organization
- **Barrel exports** for clean import statements
- **TypeScript** for type safety throughout
- **Consistent naming conventions** across all files

### **Scalability Support**
- **Modular architecture** enabling team collaboration
- **Environment-specific configurations** for different deployment targets
- **Comprehensive testing strategy** for quality assurance
- **Build optimization** for production deployment

## Root Directory Structure

```
kitchen-pantry-crm/
├── src/                    # Main application source code
├── public/                 # Static public assets
├── docs/                   # Project documentation
├── tests/                  # Testing files and configurations
├── config/                 # Build and environment configurations
├── scripts/                # Build and utility scripts
├── database/               # Database schema and migrations
├── deployment/             # Deployment configurations
└── .github/                # GitHub workflows and templates
```

## Core Development Patterns

### **Component Organization**
- **Atomic design methodology** (atoms → molecules → organisms → templates)
- **Co-located testing** files alongside components
- **Barrel exports** for clean imports
- **TypeScript interfaces** for prop definitions

### **State Management**
- **Pinia stores** for application-wide state
- **Composables** for reusable reactive logic
- **Services** for business logic and API interactions
- **Types** for comprehensive type safety

### **Configuration Management**
- **Environment-specific** `.env` files
- **Centralized configuration** in `src/config/`
- **TypeScript path mapping** for clean imports
- **Build optimization** through Vite

## Development Workflow

### **Local Development**
1. **Clone repository** and install dependencies
2. **Configure environment** variables
3. **Start development server** with hot reload
4. **Access application** at `http://localhost:3000`

### **Code Quality**
- **ESLint** for code linting
- **Prettier** for consistent formatting
- **Husky** for pre-commit hooks
- **TypeScript** for type checking

### **Testing Strategy**
- **Unit tests** with Vitest
- **Integration tests** for API endpoints
- **E2E tests** with Playwright
- **Coverage reporting** with minimum thresholds

## Build and Deployment

### **Build Process**
- **Vite** as primary build tool
- **TypeScript compilation** with type checking
- **Asset optimization** for production
- **Code splitting** for performance

### **Deployment Targets**
- **Vercel** for production deployment
- **Netlify** for alternative hosting
- **Supabase MCP** for local development support
- **Staging environments** for testing

## File Organization Standards

### **Naming Conventions**
- **PascalCase** for Vue components
- **camelCase** for TypeScript files
- **kebab-case** for assets and images
- **Descriptive names** with context

### **Import Patterns**
- **Barrel exports** for directory-level imports
- **TypeScript path mapping** for clean imports
- **Consistent import ordering** (external → internal → relative)
- **Type imports** separated from value imports