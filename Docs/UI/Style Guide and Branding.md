# Style Guide and Branding

**Kitchen Pantry CRM Brand Identity**

This file defines the brand identity, visual style, and content guidelines for consistent Kitchen Pantry CRM presentation.

---

## Brand Identity

### Brand Personality

**Core Attributes:**
- **Professional:** Reliable, trustworthy, competent
- **Approachable:** Friendly, accessible, human-centered
- **Efficient:** Streamlined, productive, results-oriented
- **Industry-Aware:** Understanding food service needs

**Brand Values:**
- Simplicity in complex workflows
- Reliability in critical business processes
- Innovation in traditional industries
- Accessibility for all users

### Voice and Tone

**Writing Style:**
- **Clear and Direct:** Avoid jargon, use simple language
- **Helpful and Supportive:** Guide users through processes
- **Confident but Humble:** Knowledgeable without arrogance
- **Consistent:** Maintain tone across all touchpoints

**Tone Examples:**
```
✅ Good: "Let's add your first customer to get started"
❌ Avoid: "You must create a customer record to proceed"

✅ Good: "We couldn't find that customer. Try a different search term"
❌ Avoid: "No results found. Search failed"

✅ Good: "Your changes have been saved successfully"
❌ Avoid: "Data persistence operation completed"
```

---

## Logo and Brand Mark

### Logo Usage

**Primary Logo:**
- Full wordmark with icon
- Minimum width: 120px
- Clear space: 0.5x logo height on all sides
- Use on light backgrounds

**Secondary Logo:**
- Icon only for small spaces
- Minimum size: 24px × 24px
- Use when space is limited
- Maintain aspect ratio

**Logo Variations:**
```css
.logo-primary {
  /* Full logo with text */
  min-width: 120px;
  height: auto;
}

.logo-icon {
  /* Icon only */
  width: 32px;
  height: 32px;
}

.logo-horizontal {
  /* Horizontal layout */
  max-height: 48px;
  width: auto;
}
```

### Brand Colors in Logo

**Logo Color Usage:**
- **Primary:** Use brand blue (#0ea5e9) on light backgrounds
- **White:** Use white version on dark backgrounds
- **Monochrome:** Use gray version when color not available
- **Never:** Alter colors, add effects, or distort proportions

---

## Iconography System

### Icon Style

**Design Principles:**
- **Outline style:** 1.5px stroke weight
- **Rounded corners:** Consistent corner radius
- **Minimal detail:** Clear at small sizes
- **Consistent sizing:** 16px, 20px, 24px, 32px grid

**Icon Library:**
- **Primary:** Heroicons v2 outline
- **Fallback:** Lucide icons for missing icons
- **Custom:** Kitchen Pantry specific icons when needed

### Icon Usage

**Semantic Icons:**
```css
.icon-success { color: var(--color-success-500); }
.icon-warning { color: var(--color-warning-500); }
.icon-error { color: var(--color-error-500); }
.icon-info { color: var(--color-info-500); }
.icon-neutral { color: var(--color-neutral-500); }
```

**Interactive Icons:**
```css
.icon-button {
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-colors);
}

.icon-button:hover {
  background-color: var(--color-neutral-100);
}
```

---

## Photography and Imagery

### Photography Style

**Visual Characteristics:**
- **Natural lighting:** Bright, welcoming environments
- **Authentic moments:** Real people in work settings
- **Professional quality:** High resolution, well-composed
- **Diverse representation:** Inclusive of all backgrounds

**Subject Matter:**
- Food service professionals at work
- Restaurant and kitchen environments
- Business meetings and interactions
- Technology in use (tablets, phones)

### Image Treatment

**Photo Filters:**
```css
.brand-photo {
  filter: brightness(1.05) contrast(1.02) saturate(1.1);
}

.brand-overlay {
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.1) 0%,
    rgba(14, 165, 233, 0.05) 100%
  );
}
```

**Image Specifications:**
- **Format:** WebP with JPEG fallback
- **Quality:** 85% compression for web
- **Aspect Ratios:** 16:9, 4:3, 1:1 for different contexts
- **Alt Text:** Descriptive, contextual alternative text

---

## Content Guidelines

### Writing Standards

**Capitalization:**
- **Sentence case:** For buttons, labels, headings
- **Title case:** For page titles, navigation items
- **All caps:** Avoid except for abbreviations

**Punctuation:**
- **Periods:** Use in complete sentences, avoid in labels
- **Commas:** Use Oxford comma in lists
- **Quotation marks:** Use straight quotes, not curly

**Numbers:**
- **Spell out:** Numbers one through nine
- **Use numerals:** For 10 and above
- **Percentages:** Always use numerals (5%, not five percent)

### Microcopy

**Button Text:**
```
✅ Good: "Save Customer", "Add Interaction", "Send Email"
❌ Avoid: "Submit", "OK", "Click Here"
```

**Error Messages:**
```
✅ Good: "Please enter a valid email address"
❌ Avoid: "Invalid input detected"
```

**Success Messages:**
```
✅ Good: "Customer saved successfully"
❌ Avoid: "Operation completed"
```

### Placeholder Text

**Form Placeholders:**
```html
<!-- Good examples -->
<input placeholder="Enter customer name">
<input placeholder="name@company.com">
<textarea placeholder="Add notes about this interaction..."></textarea>

<!-- Avoid -->
<input placeholder="Input required">
<input placeholder="Text goes here">
```

---

## UI Text Patterns

### Navigation Labels

**Primary Navigation:**
- Dashboard
- Customers
- Interactions
- Opportunities
- Products
- Reports

**Action Labels:**
- Add Customer
- Log Interaction
- Create Opportunity
- Generate Report
- Export Data

### Status Indicators

**Customer Status:**
- Active
- Inactive
- Prospect
- Archived

**Opportunity Status:**
- Qualified
- Proposal
- Negotiation
- Closed Won
- Closed Lost

### Form Labels

**Required Fields:**
```html
<label for="customer-name">
  Customer Name <span class="required">*</span>
</label>
```

**Optional Fields:**
```html
<label for="customer-notes">
  Notes <span class="optional">(optional)</span>
</label>
```

---

## Email and Communication

### Email Templates

**Subject Line Format:**
- "Kitchen Pantry CRM: [Action/Update]"
- Keep under 50 characters
- Be specific and actionable

**Email Signature:**
```
Best regards,
The Kitchen Pantry CRM Team

Kitchen Pantry CRM
Streamlining Food Service Sales
support@kitchenpantrycrm.com
```

### Notification Messages

**In-App Notifications:**
```css
.notification-success {
  background: var(--color-success-50);
  border: 1px solid var(--color-success-200);
  color: var(--color-success-800);
}

.notification-error {
  background: var(--color-error-50);
  border: 1px solid var(--color-error-200);
  color: var(--color-error-800);
}
```

---

## Responsive Brand Application

### Mobile Branding

**Logo Adaptation:**
- Use icon-only version in mobile headers
- Maintain minimum touch target size
- Ensure readability at small sizes

**Typography Scaling:**
```css
@media (max-width: 640px) {
  .brand-heading {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
  }
  
  .brand-subheading {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-snug);
  }
}
```

### Print Materials

**Business Cards:**
- Logo placement: Top left or centered
- Contact information: Clear hierarchy
- Brand colors: Use sparingly for accent

**Letterhead:**
- Logo: Top left corner
- Contact info: Header or footer
- Brand line: Subtle placement

---

## Brand Application Examples

### Loading States

**Branded Loading:**
```css
.loading-spinner {
  border: 3px solid var(--color-neutral-200);
  border-top: 3px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Empty States

**Branded Empty State:**
```html
<div class="empty-state">
  <div class="empty-icon">
    <icon name="users" size="xl" />
  </div>
  <h3>No customers yet</h3>
  <p>Add your first customer to get started with Kitchen Pantry CRM</p>
  <button class="button-primary">Add Customer</button>
</div>
```

### Error Pages

**404 Page:**
```html
<div class="error-page">
  <div class="error-content">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <a href="/dashboard" class="button-primary">Return to Dashboard</a>
  </div>
</div>
```

---

## Brand Compliance

### Do's and Don'ts

**Logo Usage:**
✅ **Do:**
- Use approved logo files
- Maintain clear space
- Use on appropriate backgrounds
- Scale proportionally

❌ **Don't:**
- Alter logo colors
- Add effects or shadows
- Stretch or distort
- Use low-resolution versions

**Color Usage:**
✅ **Do:**
- Use brand colors consistently
- Follow contrast guidelines
- Test on different devices

❌ **Don't:**
- Create new color variations
- Use colors that fail accessibility tests
- Overuse brand colors

### Quality Assurance

**Brand Review Checklist:**
- [ ] Logo usage follows guidelines
- [ ] Colors match brand specifications
- [ ] Typography uses approved fonts
- [ ] Voice and tone consistent
- [ ] Accessibility standards met
- [ ] Mobile presentation tested

This comprehensive style guide ensures consistent brand presentation and user experience across all Kitchen Pantry CRM touchpoints.

