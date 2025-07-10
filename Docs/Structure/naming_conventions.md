# Naming Conventions and Standards

## Summary
The project follows **consistent naming patterns** across all file types and organizational structures to ensure **maintainability** and **developer productivity**.

## File Naming Conventions

### **Component Files**
Vue components use **PascalCase** with descriptive, context-aware names.

#### **Vue Component Naming**
```
# Component files
CustomerCard.vue            # Main component file
CustomerCard.test.ts        # Component tests
CustomerCard.stories.ts     # Storybook stories (if applicable)
CustomerCard.module.css     # CSS modules (if used)
index.ts                    # Barrel export
```

#### **Component Naming Rules**
- **PascalCase** for all component files
- **Descriptive names** that indicate purpose
- **Context-specific** prefixes when needed
- **Consistent suffixes** for different file types

### **TypeScript Files**
TypeScript files use **camelCase** with **descriptive names** and **appropriate suffixes**.

#### **TypeScript File Patterns**
```
# Service files
organizationService.ts      # API service
authService.ts             # Authentication service
validationService.ts       # Validation utilities

# Type definition files
organization.types.ts       # Type definitions
api.types.ts               # API-related types
common.types.ts            # Common type utilities

# Utility files
dateUtils.ts               # Date utility functions
stringUtils.ts             # String utility functions
formatUtils.ts             # Formatting utilities

# Composable files
useOrganizations.ts        # Organizations composable
useAuthentication.ts       # Authentication composable
useLocalStorage.ts         # Local storage composable
```

### **Configuration Files**
Configuration files use **descriptive names** with **appropriate extensions**.

#### **Configuration File Patterns**
```
# Environment files
.env.development           # Development environment
.env.staging               # Staging environment
.env.production            # Production environment
.env.test                  # Test environment

# Build configuration
vite.config.ts             # Vite configuration
tailwind.config.js         # Tailwind CSS configuration
tsconfig.json              # TypeScript configuration

# Tool configuration
.eslintrc.js               # ESLint configuration
.prettierrc.js             # Prettier configuration
.gitignore                 # Git ignore patterns
```

### **Asset Files**
Asset files use **kebab-case** with **descriptive names** and **appropriate prefixes**.

#### **Asset Naming Patterns**
```
# Image files
company-logo.png           # Company logo
user-avatar-placeholder.jpg # User avatar placeholder
dashboard-background.svg    # Dashboard background
hero-illustration.png       # Hero section illustration

# Icon files
icon-user.svg              # User icon
icon-settings.svg          # Settings icon
icon-arrow-right.svg       # Arrow right icon
icon-check-circle.svg      # Check circle icon

# Font files
inter-regular.woff2        # Inter font regular
inter-bold.woff2           # Inter font bold
roboto-light.woff2         # Roboto font light
```

## Directory Naming Conventions

### **Source Code Directories**
Source code directories use **lowercase** with **descriptive names**.

#### **Primary Directory Names**
```
src/
├── components/            # Vue components
├── pages/                 # Page components
├── composables/           # Composable functions
├── stores/                # Pinia stores
├── services/              # Service functions
├── utils/                 # Utility functions
├── types/                 # Type definitions
├── assets/                # Static assets
├── styles/                # Styling files
└── config/                # Configuration files
```

### **Test Directory Structure**
Test directories mirror **source structure** with **clear categorization**.

#### **Test Directory Names**
```
tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
├── fixtures/              # Test data fixtures
├── helpers/               # Test helper functions
├── mocks/                 # Mock implementations
└── coverage/              # Coverage reports
```

### **Documentation Directories**
Documentation directories use **lowercase** with **purpose-specific names**.

#### **Documentation Structure**
```
docs/
├── technical/             # Technical documentation
├── user/                  # User documentation
├── api/                   # API documentation
├── deployment/            # Deployment guides
├── design/                # Design documentation
└── project/               # Project documentation
```

## Code Naming Conventions

### **Variable and Function Names**
Variables and functions use **camelCase** with **descriptive names**.

#### **Variable Naming Examples**
```typescript
// Variables
const currentUser = ref<User | null>(null)
const organizationList = ref<Organization[]>([])
const isLoading = ref(false)
const hasError = ref(false)

// Functions
function getUserProfile(userId: string): Promise<User> {}
function validateOrganizationData(data: CreateOrganizationDto): boolean {}
function formatDisplayName(firstName: string, lastName: string): string {}
function calculateTotalValue(opportunities: Opportunity[]): number {}
```

### **Constant Names**
Constants use **SCREAMING_SNAKE_CASE** for **environment-level constants**.

#### **Constant Naming Examples**
```typescript
// Environment constants
const API_BASE_URL = 'https://api.example.com'
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_PAGE_SIZE = 25
const CACHE_EXPIRY_TIME = 3600 // 1 hour

// Configuration constants
const SUPPORTED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'pdf']
const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
}
```

### **Class and Interface Names**
Classes and interfaces use **PascalCase** with **descriptive names**.

#### **Class and Interface Examples**
```typescript
// Interfaces
interface User {
  id: string
  email: string
  profile: UserProfile
}

interface CreateOrganizationDto {
  name: string
  type: OrganizationType
  contactInfo: ContactInfo
}

// Classes
class OrganizationService {
  async createOrganization(data: CreateOrganizationDto): Promise<Organization> {}
  async updateOrganization(id: string, data: UpdateOrganizationDto): Promise<Organization> {}
}

class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message)
  }
}
```

### **Type Names**
Type definitions use **PascalCase** with **descriptive suffixes**.

#### **Type Naming Examples**
```typescript
// Basic types
type UserId = string
type OrganizationId = string
type Timestamp = number

// Union types
type UserRole = 'admin' | 'manager' | 'sales_rep' | 'read_only'
type OrganizationType = 'restaurant' | 'catering' | 'distributor' | 'supplier'

// Complex types
type ApiResponse<T> = {
  data: T
  status: 'success' | 'error'
  message?: string
}

type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

## Import and Export Conventions

### **Import Naming**
Imports use **consistent patterns** for **different import types**.

#### **Import Patterns**
```typescript
// External library imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Internal component imports
import { Button, Input } from '@/components/atoms'
import { CustomerCard } from '@/components/molecules'
import { Header } from '@/components/organisms'

// Service and utility imports
import { useOrganizations } from '@/composables/api'
import { OrganizationService } from '@/services/api'
import { formatDate } from '@/utils/date'

// Type imports
import type { Organization, User } from '@/types/api'
import type { ComponentProps } from '@/types/ui'
```

### **Export Naming**
Exports use **barrel exports** for **clean import statements**.

#### **Barrel Export Examples**
```typescript
// src/components/atoms/index.ts
export { default as Button } from './Button/Button.vue'
export { default as Input } from './Input/Input.vue'
export { default as Icon } from './Icon/Icon.vue'
export * from './Button'
export * from './Input'
export * from './Icon'

// src/services/api/index.ts
export { OrganizationService } from './organizationService'
export { ContactService } from './contactService'
export { AuthService } from './authService'
export * from './types'

// src/utils/index.ts
export * from './date'
export * from './string'
export * from './format'
export * from './validation'
```

## Best Practices

### **Naming Guidelines**
- **Descriptive names** that clearly indicate purpose
- **Consistent patterns** across similar file types
- **Avoid abbreviations** unless they're widely understood
- **Use context** to provide meaningful names

### **Organization Standards**
- **Logical grouping** of related files
- **Consistent directory structure** across features
- **Clear separation** between different concerns
- **Scalable patterns** that support growth

### **Code Quality**
- **Meaningful variable names** that explain intent
- **Consistent formatting** with automated tools
- **Clear function names** that describe behavior
- **Proper type annotations** for better tooling

### **Documentation**
- **Consistent file naming** for easy navigation
- **Clear section headers** for document structure
- **Descriptive titles** that indicate content
- **Logical organization** for information flow