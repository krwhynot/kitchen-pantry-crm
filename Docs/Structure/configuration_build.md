# Configuration and Build Structure

## Summary
The project uses **environment-specific configurations** and **optimized build processes** to support **multiple deployment targets** and **development workflows**.

## Configuration Directory (`config/`)

### **Environment Configuration**
Configuration is organized by **environment** and **purpose** for flexible deployment.

#### **Configuration Structure**
```
config/
├── environments/           # Environment-specific configurations
├── build/                  # Build configuration files
├── deployment/             # Deployment configurations
├── linting/                # Code quality configurations
└── security/               # Security configurations
```

### **Environment Settings (`config/environments/`)**
Environment variables are managed through **dedicated files** for each deployment target.

#### **Environment Files**
```
environments/
├── development.env         # Development environment variables
├── staging.env             # Staging environment variables
├── production.env          # Production environment variables
└── test.env                # Test environment variables
```

#### **Environment Variable Pattern**
```bash
# Development environment example
VITE_APP_NAME=Kitchen Pantry CRM
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://localhost:54321
VITE_DEBUG_MODE=true
VITE_ENVIRONMENT=development
```

### **Build Configuration (`config/build/`)**
Build configurations optimize **compilation** and **bundling** for different environments.

#### **Build Files**
```
build/
├── vite.config.ts          # Vite build configuration
├── rollup.config.js        # Rollup configuration
├── webpack.config.js       # Webpack configuration (if needed)
└── optimization.config.js  # Build optimization settings
```

#### **Vite Configuration Example**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue'],
        },
      },
    },
  },
})
```

### **Deployment Configuration (`config/deployment/`)**
Deployment configurations support **multiple hosting platforms** and **Supabase MCP integration**.

#### **Deployment Options**
```
deployment/
├── supabase-mcp/           # Supabase MCP configurations
├── hosting/                # Hosting platform configurations
├── vercel.json             # Vercel deployment config
├── netlify.toml            # Netlify deployment config
└── railway.json            # Railway deployment config
```

### **Code Quality Configuration (`config/linting/`)**
Linting configurations ensure **code quality** and **consistency** across the project.

#### **Quality Tools**
```
linting/
├── eslint.config.js        # ESLint configuration
├── prettier.config.js      # Prettier configuration
├── stylelint.config.js     # Stylelint configuration
└── commitlint.config.js    # Commit linting configuration
```

## Scripts Directory (`scripts/`)

### **Automation Scripts**
Scripts automate **common tasks** for **development**, **building**, and **deployment**.

#### **Script Categories**
```
scripts/
├── build/                  # Build automation scripts
├── deployment/             # Deployment automation
├── development/            # Development utilities
├── database/               # Database scripts
└── utilities/              # General utility scripts
```

### **Build Scripts (`scripts/build/`)**
Build scripts handle **compilation**, **optimization**, and **asset processing**.

#### **Build Automation**
```
build/
├── build.sh                # Main build script
├── clean.sh                # Clean build artifacts
├── optimize.sh             # Build optimization
└── analyze.sh              # Bundle analysis
```

### **Deployment Scripts (`scripts/deployment/`)**
Deployment scripts automate **environment setup** and **application deployment**.

#### **Deployment Automation**
```
deployment/
├── deploy.sh               # Main deployment script
├── deploy-staging.sh       # Staging deployment
├── deploy-production.sh    # Production deployment
├── rollback.sh             # Deployment rollback
└── health-check.sh         # Post-deployment health check
```

### **Development Scripts (`scripts/development/`)**
Development scripts provide **utilities** for **local development** and **testing**.

#### **Development Utilities**
```
development/
├── setup.sh                # Development environment setup
├── seed-data.sh            # Database seeding
├── generate-types.sh       # Type generation
├── lint-fix.sh             # Automated linting fixes
└── test-watch.sh           # Test watching
```

## Database Configuration (`database/`)

### **Database Schema Management**
Database configurations handle **schema definitions**, **migrations**, and **seed data**.

#### **Database Structure**
```
database/
├── migrations/             # Supabase migrations
├── seeds/                  # Database seed data
├── schemas/                # Schema definitions
├── types/                  # Database type definitions
└── documentation/          # Database documentation
```

### **Migration Management**
```
migrations/
├── 001_initial_schema.sql  # Initial database schema
├── 002_add_organizations.sql # Organizations table
├── 003_add_contacts.sql    # Contacts table
├── 004_add_interactions.sql # Interactions table
├── 005_add_opportunities.sql # Opportunities table
└── [timestamp]_[description].sql # Additional migrations
```

## Deployment Directory (`deployment/`)

### **Environment-Specific Deployment**
Deployment configurations support **multiple environments** with **specific requirements**.

#### **Deployment Environments**
```
deployment/
├── production/             # Production deployment
├── staging/                # Staging deployment
├── development/            # Development deployment
├── infrastructure/         # Infrastructure as code
└── scripts/                # Deployment scripts
```

### **Production Deployment (`deployment/production/`)**
Production deployment configurations optimize for **performance** and **reliability**.

#### **Production Configuration**
```
production/
├── vercel.json             # Vercel production config
├── environment.env         # Production environment variables
├── build.config.js         # Production build configuration
└── monitoring.config.js    # Production monitoring
```

### **Staging Deployment (`deployment/staging/`)**
Staging deployment configurations provide **testing environment** before production.

#### **Staging Configuration**
```
staging/
├── vercel.json             # Vercel staging config
├── environment.env         # Staging environment variables
├── build.config.js         # Staging build configuration
└── testing.config.js       # Staging testing configuration
```

## Build Process

### **Development Build**
```bash
# Development build commands
npm run dev                 # Start development server
npm run build:dev           # Build for development
npm run preview             # Preview build locally
```

### **Production Build**
```bash
# Production build commands
npm run build               # Build for production
npm run build:analyze       # Analyze bundle size
npm run build:optimize      # Optimized production build
```

### **Deployment Commands**
```bash
# Deployment commands
npm run deploy:staging      # Deploy to staging
npm run deploy:production   # Deploy to production
npm run deploy:rollback     # Rollback deployment
```

## Configuration Management

### **Environment Variables**
```typescript
// src/config/app.ts
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'Kitchen Pantry CRM',
  version: '1.0.0',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  debug: import.meta.env.VITE_DEBUG_MODE === 'true',
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: 10000,
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
}
```

### **TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/assets/*": ["./src/assets/*"]
    }
  }
}
```

## Best Practices

### **Configuration Guidelines**
- **Environment-specific** configurations for flexibility
- **Secure secret management** for sensitive data
- **Version control** for configuration files
- **Documentation** for configuration options

### **Build Optimization**
- **Code splitting** for performance
- **Asset optimization** for faster loading
- **Bundle analysis** for size monitoring
- **Caching strategies** for efficiency

### **Deployment Standards**
- **Automated deployment** pipelines
- **Health checks** after deployment
- **Rollback procedures** for failures
- **Environment parity** between stages