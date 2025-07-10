# Source Code Organization

## Summary
The `src/` directory contains all application logic using **Vue.js 3 patterns** with **TypeScript support** and **atomic design principles** for component organization.

## Directory Structure

```
src/
├── components/         # Vue.js components (atomic design)
├── pages/             # Page-level components and routing
├── composables/       # Vue 3 composition API reusable logic
├── stores/            # Pinia state management stores
├── services/          # API services and business logic
├── utils/             # Utility functions and helpers
├── types/             # TypeScript type definitions
├── assets/            # Static assets (images, fonts, icons)
├── styles/            # Global styles and design system
└── config/            # Application configuration
```

## Components (`src/components/`)

### **Atomic Design Organization**
Components follow atomic design methodology for **reusability** and **maintainability**.

#### **Atoms - Basic Building Blocks**
```
components/atoms/
├── Button/
│   ├── Button.vue           # Core button component
│   ├── Button.test.ts       # Component tests
│   └── index.ts             # Export barrel
├── Input/
├── Icon/
├── Badge/
├── Avatar/
└── Spinner/
```

#### **Molecules - Atom Combinations**
```
components/molecules/
├── SearchBar/
├── FormField/
├── CustomerCard/
├── InteractionCard/
├── OpportunityCard/
└── NavigationItem/
```

#### **Organisms - Complex UI Sections**
```
components/organisms/
├── Header/
├── Sidebar/
├── DataTable/
├── CustomerList/
├── InteractionForm/
├── OpportunityPipeline/
└── DashboardStats/
```

#### **Templates - Page Layout Templates**
```
components/templates/
├── DefaultLayout/
├── AuthLayout/
└── MobileLayout/
```

## Pages (`src/pages/`)

### **Page-Level Components**
Page components orchestrate **layout** and **data flow** for specific application screens.

#### **Core Page Categories**
```
pages/
├── auth/                   # Authentication pages
├── dashboard/              # Dashboard and home pages
├── organizations/          # Organization management
├── contacts/               # Contact management
├── interactions/           # Interaction tracking
├── opportunities/          # Opportunity management
├── products/               # Product catalog
├── reports/                # Reporting and analytics
├── maps/                   # Map functionality
└── settings/               # Settings and configuration
```

#### **Standard Page Pattern**
Each page category includes:
- **List page** for data overview
- **Detail page** for individual record view
- **Create page** for new record creation
- **Edit page** for record modification

## Composables (`src/composables/`)

### **Vue 3 Composition API Logic**
Composables encapsulate **reactive state**, **computed properties**, and **reusable methods**.

#### **Composable Categories**
```
composables/
├── auth/                   # Authentication composables
├── api/                    # API interaction composables
├── ui/                     # UI interaction composables
├── forms/                  # Form handling composables
├── data/                   # Data management composables
├── location/               # Location and mapping composables
└── utils/                  # Utility composables
```

#### **Key Composables**
- **`useAuth`** - Authentication state and methods
- **`useApi`** - Generic API interaction logic
- **`useModal`** - Modal management
- **`useForm`** - Generic form handling
- **`useLocalStorage`** - Local storage management
- **`useGeolocation`** - GPS and location services

## Stores (`src/stores/`)

### **Pinia State Management**
Stores handle **application-wide state** with domain-specific organization.

#### **Store Structure**
```
stores/
├── auth.ts                 # Authentication store
├── organizations.ts        # Organizations data store
├── contacts.ts             # Contacts data store
├── interactions.ts         # Interactions data store
├── opportunities.ts        # Opportunities data store
├── products.ts             # Products data store
├── ui.ts                   # UI state store
├── settings.ts             # Application settings store
└── cache.ts                # Data caching store
```

#### **Store Responsibilities**
- **State management** for domain entities
- **Action methods** for state mutations
- **Getter methods** for computed state
- **Persistence** through local storage integration

## Services (`src/services/`)

### **Business Logic and API Clients**
Services provide **abstraction layers** for data operations and external system interactions.

#### **Service Categories**
```
services/
├── api/                    # API service clients
├── supabase/               # Supabase service integration
├── external/               # External service integrations
├── business/               # Business logic services
└── storage/                # Storage and caching services
```

#### **API Service Pattern**
```
api/
├── base.ts                 # Base API client configuration
├── auth.ts                 # Authentication API client
├── organizations.ts        # Organizations API client
├── contacts.ts             # Contacts API client
└── [entity].ts             # Entity-specific API clients
```

## Types (`src/types/`)

### **TypeScript Type Definitions**
Types ensure **type safety** throughout the application with organized definitions.

#### **Type Categories**
```
types/
├── api/                    # API-related types
├── ui/                     # UI component types
├── business/               # Business domain types
├── utils/                  # Utility types
└── global.d.ts             # Global type declarations
```

#### **Type Organization**
- **API types** define request/response contracts
- **UI types** define component prop interfaces
- **Business types** define domain entity shapes
- **Utility types** provide common type utilities

## Assets (`src/assets/`)

### **Static Asset Organization**
```
assets/
├── images/                 # Image assets
│   ├── logos/              # Company and brand logos
│   ├── icons/              # Custom icon images
│   ├── backgrounds/        # Background images
│   └── illustrations/      # Illustration graphics
├── fonts/                  # Custom font files
├── videos/                 # Video assets
└── documents/              # Document templates
```

## Styles (`src/styles/`)

### **Global Styling with Tailwind CSS**
```
styles/
├── base/                   # Base styles and resets
├── components/             # Component-specific styles
├── themes/                 # Theme definitions
├── responsive/             # Responsive design styles
├── animations/             # Animation definitions
└── vendor/                 # Third-party styles
```

## Configuration (`src/config/`)

### **Application Configuration**
```
config/
├── app.ts                  # Application configuration
├── api.ts                  # API configuration
├── auth.ts                 # Authentication configuration
├── database.ts             # Database configuration
├── constants.ts            # Application constants
└── environments.ts         # Environment-specific configs
```