# Accessibility Standards

**Kitchen Pantry CRM Accessibility Compliance**

This file defines comprehensive accessibility standards ensuring WCAG 2.1 AA compliance and inclusive design throughout Kitchen Pantry CRM.

---

## WCAG 2.1 AA Compliance

### Four Principles of Accessibility

**POUR Framework:**
- **Perceivable:** Information presentable to users in ways they can perceive
- **Operable:** Interface components operable by all users
- **Understandable:** Information and UI operation understandable
- **Robust:** Content interpretable by assistive technologies

---

## Color and Contrast Standards

### Contrast Requirements

**Text Contrast Ratios:**
- **Normal text:** Minimum 4.5:1 ratio
- **Large text (18pt+ or 14pt+ bold):** Minimum 3:1 ratio
- **Interactive elements:** Minimum 3:1 ratio against background

**Approved Color Combinations:**
```css
/* High contrast text */
.text-high-contrast {
  color: #111827; /* Gray-900 */
  background: #ffffff; /* White */
  /* Ratio: 16.9:1 */
}

/* Primary button contrast */
.button-primary {
  background: #0ea5e9; /* Primary-500 */
  color: #ffffff; /* White */
  /* Ratio: 4.7:1 */
}

/* Error text contrast */
.error-text {
  color: #dc2626; /* Error-600 */
  background: #ffffff; /* White */
  /* Ratio: 5.7:1 */
}
```

### Color Independence

**Information Conveyance:**
- Never rely on color alone to convey information
- Use icons, text labels, and patterns as additional indicators
- Provide multiple visual cues for status and state changes

**Status Indicators:**
```css
.status-success {
  color: var(--color-success-700);
  background: var(--color-success-50);
  border-left: 4px solid var(--color-success-500);
}

.status-success::before {
  content: "✓";
  font-weight: bold;
  margin-right: var(--spacing-2);
}
```

---

## Keyboard Navigation

### Focus Management

**Focus Indicators:**
```css
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: var(--border-radius-sm);
}

/* Enhanced focus for buttons */
.button:focus-visible {
  outline: 2px solid var(--color-primary-300);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--color-primary-100);
}
```

**Tab Order:**
- Logical sequence following visual layout
- Skip links for main content areas
- Trapped focus in modals and dropdowns
- No keyboard traps in normal navigation

### Keyboard Shortcuts

**Global Shortcuts:**
- `Ctrl/Cmd + N` → Create new customer
- `Ctrl/Cmd + F` → Open search
- `Ctrl/Cmd + S` → Save current form
- `Escape` → Close modal or cancel action
- `Tab` → Navigate to next element
- `Shift + Tab` → Navigate to previous element

**Component-Specific:**
- `Enter` → Activate buttons and links
- `Space` → Toggle checkboxes and buttons
- `Arrow keys` → Navigate menus and lists
- `Home/End` → Jump to first/last item

### Skip Links

**Implementation:**
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
<a href="#navigation" class="skip-link">
  Skip to navigation
</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary-600);
  color: var(--color-neutral-0);
  padding: var(--spacing-2) var(--spacing-4);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  z-index: 1000;
  transition: top var(--duration-200) var(--ease-out);
}

.skip-link:focus {
  top: 6px;
}
```

---

## Screen Reader Support

### Semantic HTML

**Proper Structure:**
```html
<main role="main" aria-labelledby="page-title">
  <header class="page-header">
    <h1 id="page-title">Customer Management</h1>
  </header>
  
  <section aria-labelledby="customer-list-title">
    <h2 id="customer-list-title">Customer List</h2>
    <!-- Content -->
  </section>
</main>
```

### ARIA Implementation

**Labels and Descriptions:**
```html
<!-- Form field with description -->
<label for="customer-name">Customer Name *</label>
<input 
  id="customer-name" 
  type="text" 
  required 
  aria-describedby="name-help"
>
<div id="name-help" class="help-text">
  Enter the full business name
</div>

<!-- Button with accessible label -->
<button 
  type="button" 
  aria-label="Edit customer: Acme Restaurant Group"
>
  <icon name="edit" />
</button>

<!-- Search with combobox -->
<input 
  type="search"
  role="combobox"
  aria-expanded="false"
  aria-controls="search-results"
  aria-describedby="search-help"
>
<div id="search-help" class="sr-only">
  Type to search customers by name or email
</div>
```

### Live Regions

**Dynamic Content Updates:**
```html
<!-- Status messages -->
<div 
  id="status-messages" 
  aria-live="polite" 
  aria-atomic="true" 
  class="sr-only"
>
  <!-- Status updates appear here -->
</div>

<!-- Error messages -->
<div 
  id="error-messages" 
  aria-live="assertive" 
  aria-atomic="true" 
  class="sr-only"
>
  <!-- Error messages appear here -->
</div>

<!-- Loading states -->
<div 
  class="loading-indicator" 
  aria-live="polite" 
  aria-busy="true"
>
  <span class="sr-only">Loading customer data...</span>
  <div class="spinner" aria-hidden="true"></div>
</div>
```

### Screen Reader Only Content

**Hidden Content for Context:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Motor Accessibility

### Touch Target Sizing

**Minimum Requirements:**
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Button sizing */
.button-small {
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-4);
}

.button-medium {
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-6);
}
```

**Spacing Requirements:**
```css
.interactive-group {
  display: flex;
  gap: var(--spacing-2); /* 8px minimum */
}

.button-group {
  display: flex;
  gap: var(--spacing-3); /* 12px recommended */
}
```

### Timing Controls

**Session Management:**
```html
<div class="timeout-warning" role="alert">
  <h3>Session Timeout Warning</h3>
  <p>Your session will expire in 2 minutes.</p>
  <div class="timeout-actions">
    <button type="button" class="extend-session">
      Extend Session
    </button>
    <button type="button" class="logout-now">
      Logout Now
    </button>
  </div>
</div>
```

### Motion Preferences

**Reduced Motion Support:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Cognitive Accessibility

### Clear Language

**Writing Guidelines:**
- Use simple, clear language
- Avoid jargon and technical terms
- Provide definitions for industry terms
- Use active voice when possible
- Keep sentences concise

**Error Messages:**
```html
<div class="error-message" role="alert">
  <strong>Email address is required</strong>
  <p>Please enter a valid email address like: name@company.com</p>
  <button type="button" class="error-help">
    Need help with email format?
  </button>
</div>
```

### Consistent Navigation

**Layout Consistency:**
```css
.page-layout {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}

.page-header {
  grid-area: header;
  /* Consistent header styling */
}

.page-sidebar {
  grid-area: sidebar;
  /* Consistent sidebar styling */
}
```

### Help and Documentation

**Contextual Help:**
```html
<div class="form-field">
  <label for="industry">Industry</label>
  <select id="industry" aria-describedby="industry-help">
    <option value="">Select industry</option>
    <!-- Options -->
  </select>
  <div id="industry-help" class="help-text">
    Choose the primary industry this customer operates in
  </div>
  <button 
    type="button" 
    class="help-button"
    aria-label="More help about industry selection"
  >
    ?
  </button>
</div>
```

---

## Form Accessibility

### Form Structure

**Accessible Forms:**
```html
<form aria-labelledby="form-title">
  <h2 id="form-title">Add New Customer</h2>
  
  <fieldset>
    <legend>Basic Information</legend>
    
    <div class="form-field">
      <label for="company-name">
        Company Name
        <span class="required" aria-label="required">*</span>
      </label>
      <input 
        id="company-name" 
        type="text" 
        required 
        aria-describedby="company-help company-error"
      >
      <div id="company-help" class="help-text">
        Enter the full legal business name
      </div>
      <div id="company-error" class="error-text" aria-live="polite">
        <!-- Error message appears here -->
      </div>
    </div>
  </fieldset>
</form>
```

### Validation Feedback

**Real-time Validation:**
```javascript
// Accessible validation feedback
function validateField(field, errorContainer) {
  const isValid = field.checkValidity();
  
  if (!isValid) {
    field.setAttribute('aria-invalid', 'true');
    errorContainer.textContent = field.validationMessage;
    errorContainer.setAttribute('aria-live', 'assertive');
  } else {
    field.removeAttribute('aria-invalid');
    errorContainer.textContent = '';
    errorContainer.removeAttribute('aria-live');
  }
}
```

---

## Testing and Validation

### Automated Testing

**Accessibility Testing Tools:**
- **axe-core:** Automated accessibility testing
- **WAVE:** Web accessibility evaluation
- **Lighthouse:** Performance and accessibility audits
- **Pa11y:** Command-line accessibility testing

**Testing Configuration:**
```javascript
// Jest + axe-core testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<CustomerForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

**Testing Checklist:**
- [ ] Keyboard navigation through all interactive elements
- [ ] Screen reader compatibility (NVDA, JAWS, VoiceOver)
- [ ] High contrast mode functionality
- [ ] Zoom functionality up to 200%
- [ ] Touch target accessibility on mobile
- [ ] Form completion with assistive technologies
- [ ] Color contrast validation
- [ ] Focus indicator visibility

### User Testing

**Accessibility User Testing:**
- Test with users who use assistive technologies
- Validate with users who have motor impairments
- Test with users who have cognitive disabilities
- Gather feedback on language clarity and navigation

---

## Implementation Guidelines

### Development Workflow

**Accessibility Integration:**
1. **Design Phase:** Include accessibility in design reviews
2. **Development Phase:** Implement with accessibility in mind
3. **Testing Phase:** Run automated and manual accessibility tests
4. **Review Phase:** Conduct accessibility code reviews
5. **Deployment Phase:** Validate accessibility in production

### Code Review Checklist

**Accessibility Review Points:**
- [ ] Semantic HTML structure used
- [ ] ARIA labels and descriptions provided
- [ ] Keyboard navigation implemented
- [ ] Focus management handled properly
- [ ] Color contrast meets requirements
- [ ] Alternative text provided for images
- [ ] Form labels and validation accessible
- [ ] Error messages clear and helpful

This comprehensive accessibility framework ensures Kitchen Pantry CRM provides equal access and optimal user experiences for all users, regardless of abilities or assistive technology requirements.

