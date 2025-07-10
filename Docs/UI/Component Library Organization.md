# Component Library Organization

**Kitchen Pantry CRM Component System**

This file defines the organization, structure, and maintenance of the Kitchen Pantry CRM component library following atomic design principles.

---

## Atomic Design Structure

### Component Hierarchy

**Four-Level Architecture:**
- **Atoms:** Basic building blocks (Button, Input, Icon)
- **Molecules:** Functional combinations (FormField, SearchBar)
- **Organisms:** Complex sections (DataTable, Header)
- **Templates:** Page layouts (MainLayout, DashboardTemplate)

### File Organization

**Directory Structure:**
```
src/components/
├── atoms/
│   ├── Button/
│   │   ├── Button.vue
│   │   ├── Button.types.ts
│   │   ├── Button.stories.ts
│   │   ├── Button.test.ts
│   │   └── index.ts
│   ├── Input/
│   ├── Icon/
│   └── index.ts
├── molecules/
│   ├── FormField/
│   ├── SearchBar/
│   └── index.ts
├── organisms/
│   ├── DataTable/
│   ├── NavigationHeader/
│   └── index.ts
├── templates/
│   ├── MainLayout/
│   ├── DashboardTemplate/
│   └── index.ts
└── index.ts
```

---

## Component Documentation

### Documentation Standards

**Required Files per Component:**
- **Component.vue:** Main implementation
- **Component.types.ts:** TypeScript interfaces
- **Component.stories.ts:** Storybook stories
- **Component.test.ts:** Unit tests
- **index.ts:** Export barrel

### TypeScript Interfaces

**Component Props Pattern:**
```typescript
interface ComponentProps {
  // Required props
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  
  // Optional props
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  
  // Event handlers
  onClick?: (event: MouseEvent) => void;
  onFocus?: () => void;
}

interface ComponentEmits {
  click: [event: MouseEvent];
  focus: [];
  blur: [];
}
```

### Storybook Integration

**Story Structure:**
```typescript
import type { Meta, StoryObj } from '@storybook/vue3';
import Component from './Component.vue';

const meta: Meta<typeof Component> = {
  title: 'Atoms/Component',
  component: Component,
  parameters: {
    docs: {
      description: {
        component: 'Component description for documentation'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'primary',
    size: 'md'
  }
};
```

---

## Testing Strategy

### Unit Testing

**Test Structure:**
```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Component from './Component.vue';

describe('Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(Component);
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Interactions', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(Component);
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const wrapper = mount(Component);
      expect(wrapper.attributes('role')).toBeDefined();
    });
  });
});
```

### Visual Regression Testing

**Playwright Configuration:**
```typescript
import { test, expect } from '@playwright/test';

test('Component visual regression', async ({ page }) => {
  await page.goto('/storybook/?path=/story/atoms-component--default');
  await expect(page.locator('[data-testid="component"]')).toHaveScreenshot();
});
```

---

## Versioning and Maintenance

### Semantic Versioning

**Version Strategy:**
- **Major (1.0.0):** Breaking changes
- **Minor (0.1.0):** New features, backward compatible
- **Patch (0.0.1):** Bug fixes, no breaking changes

### Change Documentation

**Changelog Format:**
```markdown
## [1.2.0] - 2025-01-15

### Added
- New `loading` prop for Button component
- Icon support in Button component

### Changed
- Updated Button hover states for better accessibility

### Fixed
- Button focus indicator visibility issue

### Deprecated
- `type` prop will be removed in v2.0.0

### Removed
- Legacy button styles
```

---

## Component Naming Conventions

### File Naming

**Naming Patterns:**
- **Components:** PascalCase (Button.vue, FormField.vue)
- **Types:** PascalCase with .types.ts suffix
- **Stories:** PascalCase with .stories.ts suffix
- **Tests:** PascalCase with .test.ts suffix

### CSS Class Naming

**BEM Methodology:**
```css
/* Block */
.button { }

/* Element */
.button__icon { }
.button__text { }

/* Modifier */
.button--primary { }
.button--disabled { }

/* State */
.button.is-loading { }
.button.is-focused { }
```

---

## Export Strategy

### Barrel Exports

**Index File Pattern:**
```typescript
// atoms/index.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Icon } from './Icon';

// Main index.ts
export * from './atoms';
export * from './molecules';
export * from './organisms';
export * from './templates';
```

### Type Exports

**Type Export Pattern:**
```typescript
// Component types
export type { ButtonProps, ButtonEmits } from './Button/Button.types';
export type { InputProps, InputEmits } from './Input/Input.types';

// Utility types
export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'primary' | 'secondary';
```

This component library organization ensures scalable, maintainable, and consistent UI development throughout Kitchen Pantry CRM.

