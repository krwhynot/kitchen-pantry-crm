# Development Tools and Utilities

This directory contains various development tools and utilities for the Kitchen Pantry CRM frontend application.

## Overview

The development tools are organized into several categories:

### 1. Vue DevTools Configuration
- **Location**: `vite.config.ts` and `main.ts`
- **Purpose**: Enables Vue DevTools in development mode for debugging components, state, and performance
- **Features**:
  - Component inspection
  - State management debugging
  - Performance monitoring
  - Hot module replacement (HMR)

### 2. Component Testing Utilities
- **Location**: `src/test/`
- **Purpose**: Provides utilities for testing Vue components with Vitest
- **Features**:
  - Test wrapper creation with proper setup
  - Mock data generators for testing
  - Async operation helpers
  - Form validation testing utilities

### 3. Mock Data System
- **Location**: `src/utils/mockData.ts` and `src/utils/mockApi.ts`
- **Purpose**: Generates realistic mock data for development and testing
- **Features**:
  - Comprehensive data generators for all business entities
  - Full mock API service with CRUD operations
  - Realistic relationships between entities
  - Configurable data sets

### 4. Error Boundary Components
- **Location**: `src/components/ErrorBoundary.vue` and `src/composables/useErrorHandler.ts`
- **Purpose**: Provides error handling and recovery mechanisms
- **Features**:
  - Component-level error boundaries
  - Global error handling
  - Error reporting and logging
  - User-friendly error messages

### 5. Development Utilities
- **Location**: `src/utils/devUtils.ts`
- **Purpose**: Collection of utilities for development workflow
- **Features**:
  - Logging with different levels
  - Performance measurement
  - State debugging
  - Network debugging
  - Feature flags
  - Local storage helpers

## Usage Examples

### Using Mock Data

```typescript
import { MockDataGenerator } from '@/utils/mockData'

// Generate a single user
const user = MockDataGenerator.generateUser({
  name: 'John Doe',
  email: 'john@example.com'
})

// Generate multiple organizations
const organizations = MockDataGenerator.generateOrganizations(10)

// Generate complete data set with relationships
const fullDataSet = MockDataGenerator.generateCompleteDataSet()
```

### Using Mock API

```typescript
import { mockApi } from '@/utils/mockApi'

// Use in development instead of real API
const users = await mockApi.getUsers()
const newUser = await mockApi.createUser({ name: 'Jane Doe' })
```

### Using Error Boundaries

```vue
<template>
  <ErrorBoundary @error="handleError">
    <MyComponent />
  </ErrorBoundary>
</template>

<script setup>
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError } = useErrorHandler({
  onError: (error, info) => {
    console.log('Error caught:', error, info)
  }
})
</script>
```

### Using Component Testing

```typescript
import { createTestWrapper, waitForUpdate } from '@/test/utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const wrapper = createTestWrapper(MyComponent, {
      props: { title: 'Test' }
    })
    
    expect(wrapper.text()).toContain('Test')
  })
})
```

### Using Development Utilities

```typescript
import DevUtils from '@/utils/devUtils'

// Logging
DevUtils.log.info('User logged in', { userId: '123' })

// Performance measurement
DevUtils.performance.mark('component-render-start')
// ... component rendering
DevUtils.performance.mark('component-render-end')
DevUtils.performance.measure('component-render', 'component-render-start', 'component-render-end')

// Feature flags
DevUtils.featureFlags.set('new-feature', true)
const isEnabled = DevUtils.featureFlags.get('new-feature')

// Storage helpers
DevUtils.storage.set('user-preference', { theme: 'dark' })
const preference = DevUtils.storage.get('user-preference')
```

### Browser Console Access

In development mode, utilities are available globally:

```javascript
// Access development tools in browser console
window.dev.MockDataGenerator.generateUser()
window.dev.mockApi.getUsers()
window.dev.DevUtils.log.info('Debug message')
window.devUtils.featureFlags.list()
```

## Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Vite Configuration

The development tools are configured in `vite.config.ts`:

```typescript
export default defineConfig({
  // Vue DevTools enabled
  plugins: [vue()],
  
  // Test configuration
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts']
  }
})
```

## Best Practices

1. **Use mock data in development**: Switch between mock and real API based on environment
2. **Wrap components in error boundaries**: Prevent errors from crashing the entire application
3. **Use development logging**: Log important events and state changes for debugging
4. **Test with mock data**: Use consistent mock data for testing to ensure reliability
5. **Feature flags**: Use feature flags to enable/disable features during development

## Testing

Run the test suite with:

```bash
pnpm test              # Run all tests
pnpm test:coverage     # Run tests with coverage
pnpm test:e2e          # Run end-to-end tests
```

## Troubleshooting

### Vue DevTools Not Working
1. Check that `app.config.devtools = true` is set in development
2. Ensure Vue DevTools browser extension is installed
3. Check browser console for any errors

### Mock API Not Working
1. Verify mock API is being used instead of real API
2. Check network tab to ensure requests are being intercepted
3. Verify mock data is being generated correctly

### Tests Failing
1. Check test setup file is properly configured
2. Verify mock data is consistent
3. Check component dependencies are properly mocked

## Contributing

When adding new development tools:

1. Follow the existing patterns and structure
2. Add comprehensive documentation
3. Include usage examples
4. Write tests for new utilities
5. Update this README with new features