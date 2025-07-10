# Project Structure Documentation

## Overview
This folder contains **modular documentation** for the Kitchen Pantry CRM project structure, optimized for **Claude Code AI parsing** and **developer comprehension**.

## Documentation Modules

### **[Overview](overview.md)**
High-level project structure and architectural principles
- **Architectural principles** - separation of concerns, maintainability, scalability
- **Root directory structure** - main folders and their purposes
- **Development patterns** - component organization and state management
- **Build and deployment** - compilation and hosting strategies

### **[Source Code Organization](source_code_organization.md)**
Detailed breakdown of the `src/` directory structure
- **Components** - atomic design methodology (atoms, molecules, organisms, templates)
- **Pages** - page-level components and routing organization
- **Composables** - Vue 3 Composition API reusable logic
- **Stores** - Pinia state management stores
- **Services** - API clients and business logic
- **Types** - TypeScript type definitions
- **Assets** - static asset organization
- **Styles** - styling and design system
- **Configuration** - application settings

### **[Testing and Documentation](testing_documentation.md)**
Testing strategy and documentation organization
- **Testing structure** - unit, integration, and E2E test organization
- **Test utilities** - fixtures, helpers, and mocks
- **Documentation categories** - technical, user, API, and deployment docs
- **Quality assurance** - coverage reporting and testing best practices

### **[Configuration and Build](configuration_build.md)**
Build configurations and deployment management
- **Environment configuration** - development, staging, production settings
- **Build process** - Vite configuration and optimization
- **Deployment targets** - Vercel, Netlify, and Supabase MCP integration
- **Database management** - schema, migrations, and seeding
- **Scripts** - automation for build, deployment, and development

### **[Naming Conventions](naming_conventions.md)**
Consistent naming patterns and standards
- **File naming** - components, TypeScript files, configuration, assets
- **Directory naming** - source code, tests, documentation
- **Code naming** - variables, functions, classes, types
- **Import/export patterns** - barrel exports and path mapping

### **[Development Workflow](development_workflow.md)**
Development practices and team collaboration
- **Local development setup** - environment configuration and tooling
- **Code quality tools** - linting, formatting, and pre-commit hooks
- **Testing workflow** - TDD practices and coverage requirements
- **Build and deployment** - pipeline stages and health checks
- **Version control** - Git workflow and pull request process
- **Team collaboration** - communication and knowledge sharing

## Quick Reference

### **Directory Structure**
```
KitchenPantry/
├── src/                    # Main application source
├── public/                 # Static public assets
├── tests/                  # Testing files
├── docs/                   # Documentation
├── config/                 # Configuration files
├── scripts/                # Automation scripts
├── database/               # Database schema
└── deployment/             # Deployment configs
```

### **Key Technologies**
- **Vue.js 3** with Composition API
- **TypeScript** for type safety
- **Vite** for build tooling
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Supabase** for backend services

### **Development Commands**
```bash
npm run dev                 # Start development server
npm run build               # Build for production
npm run test                # Run all tests
npm run lint                # Run linting
npm run type-check          # Type checking
```

## Navigation Tips

### **For Claude Code AI**
- Each module is **under 400 tokens** per section
- **Clear headings** (## and ###) for easy parsing
- **Bullet points** and **bolded key terms** for clarity
- **Code blocks** with proper formatting
- **Brief summaries** at the start of complex sections

### **For Developers**
- **Modular structure** allows focused reading
- **Cross-references** between related concepts
- **Practical examples** with real code snippets
- **Best practices** integrated throughout
- **Quick reference** sections for common tasks

## Maintenance

### **Updating Documentation**
- **Keep synchronized** with code changes
- **Update examples** when patterns change
- **Review for accuracy** during major updates
- **Maintain consistency** across all modules

### **Adding New Content**
- **Follow established patterns** for new sections
- **Keep sections focused** and under token limits
- **Use consistent formatting** throughout
- **Add cross-references** to related content

---

**Last Updated**: January 2025  
**For**: Kitchen Pantry CRM MVP  
**Audience**: Claude Code AI and Development Team