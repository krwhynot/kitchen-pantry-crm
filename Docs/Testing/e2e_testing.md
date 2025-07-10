# End-to-End Testing

## Overview

End-to-end testing validates **complete user workflows** from frontend interactions through backend processing to database storage, ensuring the entire system works cohesively. This testing level provides confidence in overall system functionality and user experience.

## User Journey Testing

### Organization Management Workflow

End-to-end testing validates **complete user workflows** from frontend interactions through backend processing to database storage. These tests ensure critical business processes work correctly for food service professionals.

```typescript
// tests/e2e/organization-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Organization Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
  })

  test('creates new organization successfully', async ({ page }) => {
    // Navigate to organizations page
    await page.click('[data-testid="nav-organizations"]')
    await expect(page.locator('[data-testid="organizations-title"]')).toBeVisible()

    // Click create organization button
    await page.click('[data-testid="create-organization-button"]')
    await expect(page.locator('[data-testid="organization-form"]')).toBeVisible()

    // Fill organization form
    await page.fill('[data-testid="organization-name"]', 'E2E Test Restaurant')
    await page.selectOption('[data-testid="industry-segment"]', 'Fine Dining')
    await page.selectOption('[data-testid="priority-level"]', 'A')
    await page.fill('[data-testid="primary-email"]', 'contact@e2etest.com')
    await page.fill('[data-testid="primary-phone"]', '+1234567890')
    await page.fill('[data-testid="annual-revenue"]', '1000000')

    // Submit form
    await page.click('[data-testid="save-organization-button"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization created successfully')

    // Verify organization appears in list
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('E2E Test Restaurant')
    
    // Verify organization details
    await page.click('[data-testid="organization-row"]:has-text("E2E Test Restaurant")')
    await expect(page.locator('[data-testid="organization-detail-name"]')).toContainText('E2E Test Restaurant')
    await expect(page.locator('[data-testid="organization-detail-industry"]')).toContainText('Fine Dining')
    await expect(page.locator('[data-testid="organization-detail-priority"]')).toContainText('A')
  })

  test('validates form fields correctly', async ({ page }) => {
    await page.click('[data-testid="nav-organizations"]')
    await page.click('[data-testid="create-organization-button"]')

    // Submit empty form
    await page.click('[data-testid="save-organization-button"]')

    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Organization name is required')

    // Fill invalid email
    await page.fill('[data-testid="organization-name"]', 'Test Restaurant')
    await page.fill('[data-testid="primary-email"]', 'invalid-email')
    await page.click('[data-testid="save-organization-button"]')

    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')

    // Fix email and verify form submits
    await page.fill('[data-testid="primary-email"]', 'valid@email.com')
    await page.click('[data-testid="save-organization-button"]')

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('searches and filters organizations', async ({ page }) => {
    // Create test organizations first
    await createTestOrganization(page, 'Italian Bistro', 'Fine Dining', 'A')
    await createTestOrganization(page, 'Fast Burger', 'Fast Food', 'B')
    await createTestOrganization(page, 'Healthcare Catering', 'Healthcare', 'C')

    await page.goto('/organizations')

    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'italian')
    await page.waitForTimeout(500) // Wait for debounced search

    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Italian Bistro')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('Fast Burger')

    // Clear search
    await page.fill('[data-testid="search-input"]', '')
    await page.waitForTimeout(500)

    // Test priority filter
    await page.selectOption('[data-testid="priority-filter"]', 'A')
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Italian Bistro')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('Fast Burger')

    // Test industry filter
    await page.selectOption('[data-testid="priority-filter"]', '') // Clear priority filter
    await page.selectOption('[data-testid="industry-filter"]', 'Fast Food')
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Fast Burger')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('Italian Bistro')
  })

  test('updates organization information', async ({ page }) => {
    // Create test organization
    await createTestOrganization(page, 'Original Name', 'Fine Dining', 'B')

    await page.goto('/organizations')
    await page.click('[data-testid="organization-row"]:has-text("Original Name")')

    // Click edit button
    await page.click('[data-testid="edit-organization-button"]')
    await expect(page.locator('[data-testid="organization-form"]')).toBeVisible()

    // Update organization details
    await page.fill('[data-testid="organization-name"]', 'Updated Restaurant Name')
    await page.selectOption('[data-testid="priority-level"]', 'A')
    await page.fill('[data-testid="notes"]', 'Updated notes for this organization')

    // Save changes
    await page.click('[data-testid="save-organization-button"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization updated successfully')

    // Verify updated information
    await expect(page.locator('[data-testid="organization-detail-name"]')).toContainText('Updated Restaurant Name')
    await expect(page.locator('[data-testid="organization-detail-priority"]')).toContainText('A')
    await expect(page.locator('[data-testid="organization-detail-notes"]')).toContainText('Updated notes for this organization')
  })

  test('deletes organization with confirmation', async ({ page }) => {
    // Create test organization
    await createTestOrganization(page, 'To Be Deleted', 'Fine Dining', 'C')

    await page.goto('/organizations')
    await page.click('[data-testid="organization-row"]:has-text("To Be Deleted")')

    // Click delete button
    await page.click('[data-testid="delete-organization-button"]')

    // Verify confirmation dialog
    await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Are you sure you want to delete')

    // Cancel deletion
    await page.click('[data-testid="cancel-button"]')
    await expect(page.locator('[data-testid="confirmation-dialog"]')).not.toBeVisible()

    // Try deletion again and confirm
    await page.click('[data-testid="delete-organization-button"]')
    await page.click('[data-testid="confirm-button"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization deleted successfully')

    // Verify organization is removed from list
    await page.goto('/organizations')
    await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('To Be Deleted')
  })

  test('handles network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/v1/organizations', route => {
      route.abort('failed')
    })

    await page.goto('/organizations')

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load organizations')
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

    // Remove network interception
    await page.unroute('**/api/v1/organizations')

    // Click retry button
    await page.click('[data-testid="retry-button"]')

    // Verify organizations load successfully
    await expect(page.locator('[data-testid="organizations-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
  })
})

// Helper function to create test organization
async function createTestOrganization(page: any, name: string, industry: string, priority: string) {
  await page.goto('/organizations')
  await page.click('[data-testid="create-organization-button"]')
  await page.fill('[data-testid="organization-name"]', name)
  await page.selectOption('[data-testid="industry-segment"]', industry)
  await page.selectOption('[data-testid="priority-level"]', priority)
  await page.click('[data-testid="save-organization-button"]')
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
}
```

### Contact Management Workflow

```typescript
// tests/e2e/contact-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Contact Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to contacts
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
  })

  test('creates contact within organization', async ({ page }) => {
    // First create an organization
    await createTestOrganization(page, 'Test Restaurant', 'Fine Dining', 'A')

    // Navigate to contacts
    await page.click('[data-testid="nav-contacts"]')
    await expect(page.locator('[data-testid="contacts-title"]')).toBeVisible()

    // Create new contact
    await page.click('[data-testid="create-contact-button"]')
    await expect(page.locator('[data-testid="contact-form"]')).toBeVisible()

    // Fill contact form
    await page.fill('[data-testid="first-name"]', 'John')
    await page.fill('[data-testid="last-name"]', 'Doe')
    await page.fill('[data-testid="email-primary"]', 'john.doe@testrestaurant.com')
    await page.fill('[data-testid="phone-primary"]', '+1234567890')
    await page.fill('[data-testid="title"]', 'General Manager')
    await page.selectOption('[data-testid="organization-select"]', 'Test Restaurant')
    await page.selectOption('[data-testid="authority-level"]', 'Decision Maker')

    // Submit form
    await page.click('[data-testid="save-contact-button"]')

    // Verify success and contact appears in list
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Contact created successfully')
    await expect(page.locator('[data-testid="contact-list"]')).toContainText('John Doe')
    await expect(page.locator('[data-testid="contact-list"]')).toContainText('Test Restaurant')
  })

  test('validates contact form fields', async ({ page }) => {
    await page.click('[data-testid="nav-contacts"]')
    await page.click('[data-testid="create-contact-button"]')

    // Submit empty form
    await page.click('[data-testid="save-contact-button"]')

    // Verify validation errors
    await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name is required')
    await expect(page.locator('[data-testid="last-name-error"]')).toContainText('Last name is required')
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required')
    await expect(page.locator('[data-testid="organization-error"]')).toContainText('Organization is required')

    // Fill invalid email
    await page.fill('[data-testid="first-name"]', 'John')
    await page.fill('[data-testid="last-name"]', 'Doe')
    await page.fill('[data-testid="email-primary"]', 'invalid-email')
    await page.click('[data-testid="save-contact-button"]')

    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')
  })

  test('updates contact information', async ({ page }) => {
    // Create test organization and contact
    await createTestOrganization(page, 'Test Restaurant', 'Fine Dining', 'A')
    await createTestContact(page, 'Jane', 'Smith', 'jane.smith@testrestaurant.com', 'Test Restaurant')

    await page.goto('/contacts')
    await page.click('[data-testid="contact-row"]:has-text("Jane Smith")')

    // Edit contact
    await page.click('[data-testid="edit-contact-button"]')
    await expect(page.locator('[data-testid="contact-form"]')).toBeVisible()

    // Update contact details
    await page.fill('[data-testid="title"]', 'Senior Manager')
    await page.selectOption('[data-testid="authority-level"]', 'Influencer')
    await page.fill('[data-testid="notes"]', 'Updated contact notes')

    // Save changes
    await page.click('[data-testid="save-contact-button"]')

    // Verify updates
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Contact updated successfully')
    await expect(page.locator('[data-testid="contact-detail-title"]')).toContainText('Senior Manager')
    await expect(page.locator('[data-testid="contact-detail-authority"]')).toContainText('Influencer')
  })
})

// Helper function to create test contact
async function createTestContact(page: any, firstName: string, lastName: string, email: string, organization: string) {
  await page.goto('/contacts')
  await page.click('[data-testid="create-contact-button"]')
  await page.fill('[data-testid="first-name"]', firstName)
  await page.fill('[data-testid="last-name"]', lastName)
  await page.fill('[data-testid="email-primary"]', email)
  await page.selectOption('[data-testid="organization-select"]', organization)
  await page.click('[data-testid="save-contact-button"]')
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
}
```

### Interaction Tracking Workflow

```typescript
// tests/e2e/interaction-tracking.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Interaction Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login and set up test data
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
  })

  test('logs interaction with contact', async ({ page }) => {
    // Create test organization and contact
    await createTestOrganization(page, 'Test Restaurant', 'Fine Dining', 'A')
    await createTestContact(page, 'John', 'Doe', 'john.doe@testrestaurant.com', 'Test Restaurant')

    // Navigate to interactions
    await page.click('[data-testid="nav-interactions"]')
    await expect(page.locator('[data-testid="interactions-title"]')).toBeVisible()

    // Create new interaction
    await page.click('[data-testid="create-interaction-button"]')
    await expect(page.locator('[data-testid="interaction-form"]')).toBeVisible()

    // Fill interaction form
    await page.selectOption('[data-testid="contact-select"]', 'John Doe')
    await page.selectOption('[data-testid="interaction-type"]', 'Phone Call')
    await page.selectOption('[data-testid="outcome"]', 'Positive')
    await page.fill('[data-testid="notes"]', 'Discussed menu preferences and pricing options')
    await page.fill('[data-testid="follow-up-date"]', '2024-02-15')

    // Submit form
    await page.click('[data-testid="save-interaction-button"]')

    // Verify success and interaction appears in list
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Interaction logged successfully')
    await expect(page.locator('[data-testid="interaction-list"]')).toContainText('John Doe')
    await expect(page.locator('[data-testid="interaction-list"]')).toContainText('Phone Call')
    await expect(page.locator('[data-testid="interaction-list"]')).toContainText('Positive')
  })

  test('tracks follow-up tasks', async ({ page }) => {
    // Create interaction with follow-up
    await createTestInteraction(page, 'John Doe', 'Email', 'Follow-up Required', '2024-02-20')

    // Navigate to dashboard to see follow-up reminders
    await page.click('[data-testid="nav-dashboard"]')
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()

    // Verify follow-up appears in reminders
    await expect(page.locator('[data-testid="follow-up-reminders"]')).toContainText('John Doe')
    await expect(page.locator('[data-testid="follow-up-reminders"]')).toContainText('Feb 20, 2024')

    // Mark follow-up as completed
    await page.click('[data-testid="complete-follow-up-button"]')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Follow-up completed')
  })
})

// Helper function to create test interaction
async function createTestInteraction(page: any, contact: string, type: string, outcome: string, followUpDate: string) {
  await page.goto('/interactions')
  await page.click('[data-testid="create-interaction-button"]')
  await page.selectOption('[data-testid="contact-select"]', contact)
  await page.selectOption('[data-testid="interaction-type"]', type)
  await page.selectOption('[data-testid="outcome"]', outcome)
  await page.fill('[data-testid="notes"]', 'Test interaction notes')
  await page.fill('[data-testid="follow-up-date"]', followUpDate)
  await page.click('[data-testid="save-interaction-button"]')
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
}
```

## Cross-Browser and Device Testing

### Browser Compatibility Testing

Cross-browser and device testing ensures **consistent functionality** across different platforms and screen sizes essential for food service professionals using various devices.

```typescript
// tests/e2e/cross-browser.spec.ts
import { test, expect, devices } from '@playwright/test'

// Test on different browsers
const browsers = ['chromium', 'firefox', 'webkit']

browsers.forEach(browserName => {
  test.describe(`${browserName} Browser Tests`, () => {
    test.use({ 
      ...devices['Desktop Chrome'],
      browserName: browserName as any
    })

    test('dashboard loads correctly', async ({ page }) => {
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'testpassword123')
      await page.click('[data-testid="login-button"]')

      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="kpi-cards"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible()
    })

    test('navigation works correctly', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Test navigation to different sections
      await page.click('[data-testid="nav-organizations"]')
      await expect(page).toHaveURL(/.*\/organizations/)
      
      await page.click('[data-testid="nav-contacts"]')
      await expect(page).toHaveURL(/.*\/contacts/)
      
      await page.click('[data-testid="nav-interactions"]')
      await expect(page).toHaveURL(/.*\/interactions/)
    })
  })
})
```

### Device-Specific Testing

```typescript
// Test on different devices
const deviceTests = [
  { name: 'Desktop', device: devices['Desktop Chrome'] },
  { name: 'Tablet', device: devices['iPad Pro'] },
  { name: 'Mobile', device: devices['iPhone 12'] }
]

deviceTests.forEach(({ name, device }) => {
  test.describe(`${name} Device Tests`, () => {
    test.use(device)

    test('responsive layout works correctly', async ({ page }) => {
      await page.goto('/dashboard')

      if (name === 'Mobile') {
        // Mobile should show hamburger menu
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
        await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible()
        
        // Test mobile menu functionality
        await page.click('[data-testid="mobile-menu-button"]')
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
        
        await page.click('[data-testid="mobile-nav-organizations"]')
        await expect(page).toHaveURL(/.*\/organizations/)
      } else {
        // Desktop and tablet should show sidebar
        await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible()
        await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible()
      }
    })

    test('touch interactions work correctly', async ({ page }) => {
      if (name !== 'Desktop') {
        await page.goto('/organizations')
        
        // Test touch-friendly button sizes
        const createButton = page.locator('[data-testid="create-organization-button"]')
        const buttonBox = await createButton.boundingBox()
        
        // Verify minimum touch target size (44px)
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
        
        // Test swipe gestures (if implemented)
        // This would depend on specific swipe gesture implementation
      }
    })

    test('forms work correctly on device', async ({ page }) => {
      await page.goto('/organizations')
      await page.click('[data-testid="create-organization-button"]')

      // Test form input on different devices
      await page.fill('[data-testid="organization-name"]', 'Device Test Restaurant')
      await page.selectOption('[data-testid="industry-segment"]', 'Fine Dining')
      
      if (name === 'Mobile') {
        // Mobile keyboards might affect viewport
        await page.waitForTimeout(500)
      }
      
      await page.click('[data-testid="save-organization-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })
  })
})
```

### iPad-Specific Testing

Given the Kitchen Pantry CRM's focus on **iPad-wielding sales representatives**, specific iPad testing ensures optimal touch-first experience.

```typescript
// tests/e2e/ipad-specific.spec.ts
import { test, expect, devices } from '@playwright/test'

test.describe('iPad-Specific Features', () => {
  test.use(devices['iPad Pro'])

  test('touch-optimized interface works correctly', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')

    // Verify iPad-optimized layout
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="touch-friendly-sidebar"]')).toBeVisible()

    // Test touch interactions
    await page.tap('[data-testid="nav-organizations"]')
    await expect(page).toHaveURL(/.*\/organizations/)

    // Test drag-and-drop functionality (if implemented)
    // This would depend on specific drag-and-drop implementation
  })

  test('portrait and landscape orientations work', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test landscape orientation (default)
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    
    // Simulate orientation change to portrait
    await page.setViewportSize({ width: 834, height: 1194 })
    await page.waitForTimeout(500)
    
    // Verify layout adapts to portrait
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-optimized-layout"]')).toBeVisible()
  })

  test('offline functionality works', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Go offline
    await page.context().setOffline(true)
    
    // Test offline functionality
    await page.click('[data-testid="nav-organizations"]')
    await expect(page.locator('[data-testid="offline-notice"]')).toBeVisible()
    await expect(page.locator('[data-testid="cached-organizations"]')).toBeVisible()
    
    // Go back online
    await page.context().setOffline(false)
    await page.click('[data-testid="sync-button"]')
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible()
  })
})
```

## E2E Testing Best Practices

### Test Data Management

```typescript
// tests/helpers/e2e-data.ts
import { Page } from '@playwright/test'

export class E2EDataManager {
  private page: Page
  private createdData: Map<string, any[]> = new Map()

  constructor(page: Page) {
    this.page = page
  }

  async createOrganization(data: any) {
    // Create organization via UI
    await this.page.goto('/organizations')
    await this.page.click('[data-testid="create-organization-button"]')
    
    // Fill form
    await this.page.fill('[data-testid="organization-name"]', data.name)
    await this.page.selectOption('[data-testid="industry-segment"]', data.industry_segment)
    await this.page.selectOption('[data-testid="priority-level"]', data.priority_level)
    
    if (data.primary_email) {
      await this.page.fill('[data-testid="primary-email"]', data.primary_email)
    }
    
    await this.page.click('[data-testid="save-organization-button"]')
    
    // Track created data for cleanup
    if (!this.createdData.has('organizations')) {
      this.createdData.set('organizations', [])
    }
    this.createdData.get('organizations')?.push(data)
    
    return data
  }

  async cleanup() {
    // Clean up all created test data
    for (const [type, items] of this.createdData) {
      for (const item of items) {
        await this.deleteItem(type, item)
      }
    }
    
    this.createdData.clear()
  }

  private async deleteItem(type: string, item: any) {
    // Implementation depends on specific deletion UI
    // This would navigate to the item and delete it
  }
}
```

### Error Handling and Resilience

```typescript
// tests/e2e/error-handling.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Error Handling', () => {
  test('handles API failures gracefully', async ({ page }) => {
    // Intercept API calls and return errors
    await page.route('**/api/v1/organizations', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      })
    })

    await page.goto('/organizations')

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    
    // Test retry functionality
    await page.unroute('**/api/v1/organizations')
    await page.click('[data-testid="retry-button"]')
    
    await expect(page.locator('[data-testid="organizations-list"]')).toBeVisible()
  })

  test('handles network timeout gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/v1/organizations', route => {
      // Delay response by 30 seconds to trigger timeout
      setTimeout(() => route.continue(), 30000)
    })

    await page.goto('/organizations')

    // Verify timeout handling
    await expect(page.locator('[data-testid="timeout-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })
})
```

### Performance and Accessibility Testing

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('page load times are acceptable', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // Page should load within 3 seconds
  })

  test('large datasets render efficiently', async ({ page }) => {
    // Create large dataset
    await page.goto('/organizations')
    
    // Measure rendering performance
    const startTime = Date.now()
    await page.selectOption('[data-testid="page-size"]', '100')
    await expect(page.locator('[data-testid="organization-list"]')).toBeVisible()
    
    const renderTime = Date.now() - startTime
    expect(renderTime).toBeLessThan(2000) // Should render within 2 seconds
  })
})

test.describe('Accessibility Tests', () => {
  test('keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Navigate to organizations using keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    await expect(page).toHaveURL(/.*\/organizations/)
  })

  test('screen reader compatibility', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check for proper ARIA labels
    await expect(page.locator('[data-testid="dashboard-title"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="nav-organizations"]')).toHaveAttribute('aria-label')
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h2')).toBeVisible()
  })
})
```

---

This end-to-end testing implementation provides comprehensive coverage of user workflows, cross-browser compatibility, and device-specific functionality while ensuring system reliability and user experience quality for food service professionals.