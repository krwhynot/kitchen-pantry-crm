# Design System Specifications

**Kitchen Pantry CRM Design Foundation**

This file defines the core design tokens and specifications that form the foundation of Kitchen Pantry CRM's visual system.

---

## Color System

### Primary Brand Colors

**Primary Blue Palette:**
- `--color-primary-50: #f0f9ff`
- `--color-primary-100: #e0f2fe`
- `--color-primary-500: #0ea5e9` *(Primary Brand)*
- `--color-primary-600: #0284c7` *(Hover State)*
- `--color-primary-700: #0369a1` *(Active State)*
- `--color-primary-900: #0c4a6e` *(Dark Variant)*

**Secondary Accent:**
- `--color-secondary-100: #fef9c3`
- `--color-secondary-500: #eab308` *(Accent Color)*
- `--color-secondary-600: #ca8a04` *(Hover State)*

### Semantic Colors

**Success (Green):**
- `--color-success-50: #f0fdf4`
- `--color-success-500: #22c55e`
- `--color-success-600: #16a34a`

**Warning (Orange):**
- `--color-warning-50: #fffbeb`
- `--color-warning-500: #f59e0b`
- `--color-warning-600: #d97706`

**Error (Red):**
- `--color-error-50: #fef2f2`
- `--color-error-500: #ef4444`
- `--color-error-600: #dc2626`

**Info (Blue):**
- `--color-info-50: #eff6ff`
- `--color-info-500: #3b82f6`
- `--color-info-600: #2563eb`

### Neutral Colors

**Gray Scale:**
- `--color-neutral-0: #ffffff` *(White)*
- `--color-neutral-50: #f9fafb` *(Light Background)*
- `--color-neutral-100: #f3f4f6` *(Subtle Background)*
- `--color-neutral-200: #e5e7eb` *(Border Light)*
- `--color-neutral-300: #d1d5db` *(Border Default)*
- `--color-neutral-400: #9ca3af` *(Placeholder)*
- `--color-neutral-500: #6b7280` *(Secondary Text)*
- `--color-neutral-600: #4b5563` *(Primary Text Light)*
- `--color-neutral-700: #374151` *(Primary Text)*
- `--color-neutral-800: #1f2937` *(Heading Text)*
- `--color-neutral-900: #111827` *(Dark Text)*

---

## Typography System

### Font Families

**Primary Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

**Monospace Font Stack:**
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
```

### Typography Scale

**Font Sizes:**
- `--font-size-xs: 0.75rem` *(12px)*
- `--font-size-sm: 0.875rem` *(14px)*
- `--font-size-base: 1rem` *(16px)*
- `--font-size-lg: 1.125rem` *(18px)*
- `--font-size-xl: 1.25rem` *(20px)*
- `--font-size-2xl: 1.5rem` *(24px)*
- `--font-size-3xl: 1.875rem` *(30px)*
- `--font-size-4xl: 2.25rem` *(36px)*
- `--font-size-5xl: 3rem` *(48px)*

**Font Weights:**
- `--font-weight-light: 300`
- `--font-weight-normal: 400`
- `--font-weight-medium: 500`
- `--font-weight-semibold: 600`
- `--font-weight-bold: 700`

**Line Heights:**
- `--line-height-tight: 1.25`
- `--line-height-snug: 1.375`
- `--line-height-normal: 1.5`
- `--line-height-relaxed: 1.625`

### Typography Usage

**Heading Styles:**
```css
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-neutral-900);
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-neutral-800);
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  color: var(--color-neutral-800);
}
```

**Body Text Styles:**
```css
.text-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-neutral-700);
}

.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-neutral-700);
}

.text-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-neutral-600);
}
```

---

## Spacing System

### 8px Grid System

**Base Spacing Units:**
- `--spacing-0: 0`
- `--spacing-1: 0.25rem` *(4px)*
- `--spacing-2: 0.5rem` *(8px)*
- `--spacing-3: 0.75rem` *(12px)*
- `--spacing-4: 1rem` *(16px)*
- `--spacing-5: 1.25rem` *(20px)*
- `--spacing-6: 1.5rem` *(24px)*
- `--spacing-8: 2rem` *(32px)*
- `--spacing-10: 2.5rem` *(40px)*
- `--spacing-12: 3rem` *(48px)*
- `--spacing-16: 4rem` *(64px)*
- `--spacing-20: 5rem` *(80px)*
- `--spacing-24: 6rem` *(96px)*

### Layout Spacing

**Container Padding:**
- Mobile: `var(--spacing-4)` *(16px)*
- Tablet: `var(--spacing-6)` *(24px)*
- Desktop: `var(--spacing-8)` *(32px)*

**Component Spacing:**
- Form fields: `var(--spacing-6)` *(24px)*
- Card padding: `var(--spacing-4)` *(16px)*
- Button padding: `var(--spacing-3) var(--spacing-6)` *(12px 24px)*

---

## Border and Shadow System

### Border Radius

**Radius Scale:**
- `--border-radius-none: 0`
- `--border-radius-sm: 0.125rem` *(2px)*
- `--border-radius-base: 0.25rem` *(4px)*
- `--border-radius-md: 0.375rem` *(6px)*
- `--border-radius-lg: 0.5rem` *(8px)*
- `--border-radius-xl: 0.75rem` *(12px)*
- `--border-radius-2xl: 1rem` *(16px)*
- `--border-radius-full: 9999px`

### Border Widths

**Width Scale:**
- `--border-width-0: 0`
- `--border-width-1: 1px`
- `--border-width-2: 2px`
- `--border-width-4: 4px`

### Box Shadows

**Shadow Scale:**
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

---

## Animation System

### Transition Durations

**Duration Scale:**
- `--duration-75: 75ms`
- `--duration-100: 100ms`
- `--duration-150: 150ms`
- `--duration-200: 200ms`
- `--duration-300: 300ms`
- `--duration-500: 500ms`

### Timing Functions

**Easing Functions:**
- `--ease-linear: linear`
- `--ease-in: cubic-bezier(0.4, 0, 1, 1)`
- `--ease-out: cubic-bezier(0, 0, 0.2, 1)`
- `--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)`

### Common Transitions

**Standard Transitions:**
```css
--transition-all: all var(--duration-150) var(--ease-in-out);
--transition-colors: color var(--duration-150) var(--ease-in-out), 
                     background-color var(--duration-150) var(--ease-in-out);
--transition-opacity: opacity var(--duration-150) var(--ease-in-out);
--transition-transform: transform var(--duration-150) var(--ease-in-out);
```

---

## Grid and Layout System

### Container Sizes

**Responsive Containers:**
- `--container-sm: 640px`
- `--container-md: 768px`
- `--container-lg: 1024px`
- `--container-xl: 1280px`
- `--container-2xl: 1536px`

### Grid Columns

**Grid System:**
- `--grid-cols-1: repeat(1, minmax(0, 1fr))`
- `--grid-cols-2: repeat(2, minmax(0, 1fr))`
- `--grid-cols-3: repeat(3, minmax(0, 1fr))`
- `--grid-cols-4: repeat(4, minmax(0, 1fr))`
- `--grid-cols-6: repeat(6, minmax(0, 1fr))`
- `--grid-cols-12: repeat(12, minmax(0, 1fr))`

### Gap Sizes

**Grid and Flex Gaps:**
- `--gap-1: var(--spacing-1)` *(4px)*
- `--gap-2: var(--spacing-2)` *(8px)*
- `--gap-4: var(--spacing-4)` *(16px)*
- `--gap-6: var(--spacing-6)` *(24px)*
- `--gap-8: var(--spacing-8)` *(32px)*

---

## Usage Guidelines

### Color Usage

**Primary Colors:**
- Use primary blue for main actions and brand elements
- Limit primary color usage to maintain visual hierarchy
- Ensure sufficient contrast with background colors

**Semantic Colors:**
- Success: Confirmations, completed states
- Warning: Cautions, pending states
- Error: Failures, validation errors
- Info: Helpful information, tips

### Typography Usage

**Hierarchy:**
- Use heading styles to establish clear information hierarchy
- Maintain consistent line heights for readability
- Apply appropriate font weights for emphasis

### Spacing Usage

**Consistency:**
- Use spacing tokens consistently throughout the application
- Maintain 8px grid alignment for visual harmony
- Apply appropriate spacing for touch targets (minimum 44px)

This design system provides the foundation for consistent, accessible, and scalable UI development throughout Kitchen Pantry CRM.

