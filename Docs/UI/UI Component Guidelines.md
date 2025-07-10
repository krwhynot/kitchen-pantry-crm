# UI Component Guidelines

**Kitchen Pantry CRM Component Specifications**

This file provides detailed specifications for all UI components following atomic design principles and Vue.js implementation patterns.

---

## Component Architecture

### Atomic Design Hierarchy

**Component Levels:**
- **Atoms:** Basic building blocks (Button, Input, Icon)
- **Molecules:** Functional combinations (FormField, SearchBar)
- **Organisms:** Complex sections (DataTable, NavigationHeader)
- **Templates:** Page layouts (MainLayout, DashboardTemplate)

**Design Principles:**
- Single responsibility per component
- Consistent prop interfaces
- Accessibility-first implementation
- Mobile-optimized interactions

---

## Atomic Components

### Button Component

**Summary:** Primary interactive element for user actions with multiple variants and states.

**Props Interface:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
}
```

**Variant Specifications:**

**Primary Button:**
```css
.button-primary {
  background-color: var(--color-primary-500);
  color: var(--color-neutral-0);
  border: 1px solid var(--color-primary-500);
  font-weight: var(--font-weight-medium);
}

.button-primary:hover {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}
```

**Secondary Button:**
```css
.button-secondary {
  background-color: var(--color-neutral-0);
  color: var(--color-neutral-700);
  border: 1px solid var(--color-neutral-300);
}

.button-secondary:hover {
  background-color: var(--color-neutral-50);
  border-color: var(--color-neutral-400);
}
```

**Size Specifications:**
- **Small:** `min-height: 36px`, `padding: 8px 16px`, `font-size: 14px`
- **Medium:** `min-height: 44px`, `padding: 12px 24px`, `font-size: 16px`
- **Large:** `min-height: 52px`, `padding: 16px 32px`, `font-size: 18px`
- **Extra Large:** `min-height: 60px`, `padding: 20px 40px`, `font-size: 20px`

**States:**
- **Default:** Base styling as specified
- **Hover:** Darker background/border colors
- **Focus:** 2px outline with primary color
- **Active:** Pressed state with darker colors
- **Disabled:** Reduced opacity, no interactions
- **Loading:** Spinner overlay, disabled interactions

### Input Component

**Summary:** Text input element with validation states and accessibility features.

**Props Interface:**
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search';
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
}
```

**Base Styling:**
```css
.input-base {
  width: 100%;
  min-height: 44px;
  padding: 12px 16px;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: var(--transition-colors);
}

.input-base:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}
```

**Validation States:**
- **Default:** Gray border, normal text
- **Focus:** Primary border with shadow
- **Success:** Green border and icon
- **Error:** Red border with error message
- **Disabled:** Gray background, reduced opacity

### Icon Component

**Summary:** Consistent iconography system using Heroicons with multiple sizes and colors.

**Props Interface:**
```typescript
interface IconProps {
  name: string;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  onClick?: () => void;
}
```

**Size Specifications:**
- **XS:** `12px × 12px`, `stroke-width: 2`
- **SM:** `16px × 16px`, `stroke-width: 1.5`
- **MD:** `20px × 20px`, `stroke-width: 1.5`
- **LG:** `24px × 24px`, `stroke-width: 1.5`
- **XL:** `32px × 32px`, `stroke-width: 1`

**Interactive Icons:**
```css
.icon-interactive {
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-colors);
}

.icon-interactive:hover {
  background-color: var(--color-neutral-100);
}
```

---

## Molecular Components

### FormField Component

**Summary:** Complete form input with label, validation, and helper text.

**Props Interface:**
```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}
```

**Structure:**
```html
<div class="form-field">
  <label class="form-label">
    Customer Name
    <span class="required-indicator">*</span>
  </label>
  <input class="form-input" type="text" required>
  <div class="helper-text">Enter the full business name</div>
  <div class="error-text">This field is required</div>
</div>
```

**Styling:**
```css
.form-field {
  margin-bottom: var(--spacing-6);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
  margin-bottom: var(--spacing-2);
}

.required-indicator {
  color: var(--color-error-500);
  margin-left: var(--spacing-1);
}
```

### SearchBar Component

**Summary:** Search input with suggestions and filter capabilities.

**Props Interface:**
```typescript
interface SearchBarProps {
  placeholder?: string;
  value?: string;
  suggestions?: string[];
  showFilters?: boolean;
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
}
```

**Features:**
- Real-time search suggestions
- Filter button integration
- Clear search functionality
- Keyboard navigation support
- Mobile-optimized layout

### CustomerCard Component

**Summary:** Customer information display card with actions.

**Props Interface:**
```typescript
interface CustomerCardProps {
  customer: Customer;
  showActions?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

**Layout Structure:**
- **Header:** Customer name, status badge
- **Body:** Contact information, last interaction
- **Footer:** Action buttons (Edit, Delete, View)

**Responsive Behavior:**
- Mobile: Single column, stacked information
- Tablet: Two-column layout
- Desktop: Multi-column with expanded actions

---

## Organism Components

### DataTable Component

**Summary:** Comprehensive data display with sorting, filtering, and pagination.

**Props Interface:**
```typescript
interface DataTableProps {
  columns: TableColumn[];
  data: any[];
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  selectable?: boolean;
  loading?: boolean;
  emptyState?: React.ReactNode;
}
```

**Features:**
- **Sorting:** Click column headers to sort
- **Filtering:** Advanced filter options
- **Pagination:** Configurable page sizes
- **Selection:** Single or multiple row selection
- **Loading States:** Skeleton loading indicators
- **Empty States:** Custom empty state messages

**Mobile Adaptation:**
- Desktop: Traditional table layout
- Mobile: Card-based layout with key information
- Tablet: Horizontal scroll with sticky columns

### NavigationHeader Component

**Summary:** Main application header with navigation and user controls.

**Props Interface:**
```typescript
interface NavigationHeaderProps {
  user?: User;
  showSearch?: boolean;
  showNotifications?: boolean;
  onMenuToggle?: () => void;
  onLogout?: () => void;
}
```

**Layout Elements:**
- **Left:** Logo, menu toggle (mobile)
- **Center:** Search bar (desktop)
- **Right:** Notifications, user menu

**Responsive Behavior:**
- Mobile: Hamburger menu, minimal header
- Tablet: Expanded navigation items
- Desktop: Full navigation with search

### CustomerForm Component

**Summary:** Comprehensive customer creation and editing form.

**Props Interface:**
```typescript
interface CustomerFormProps {
  customer?: Customer;
  mode: 'create' | 'edit';
  onSubmit?: (customer: Customer) => void;
  onCancel?: () => void;
}
```

**Form Sections:**
1. **Basic Information:** Name, type, status
2. **Contact Details:** Email, phone, address
3. **Business Information:** Industry, size, notes
4. **Preferences:** Communication preferences, tags

**Validation:**
- Real-time field validation
- Form-level validation on submit
- Clear error messaging
- Success confirmation

---

## Component States

### Interactive States

**Standard State Pattern:**
- **Default:** Base appearance
- **Hover:** Visual feedback on mouse over
- **Focus:** Keyboard focus indicator
- **Active:** Pressed/clicked state
- **Disabled:** Non-interactive state
- **Loading:** Processing state

### Validation States

**Form Validation Pattern:**
- **Default:** Normal input state
- **Valid:** Success indicator (green)
- **Invalid:** Error indicator (red)
- **Warning:** Caution indicator (orange)
- **Info:** Information indicator (blue)

### Loading States

**Loading Patterns:**
- **Skeleton:** Placeholder content shapes
- **Spinner:** Animated loading indicator
- **Progress:** Determinate progress bar
- **Shimmer:** Animated placeholder effect

---

## Accessibility Implementation

### Keyboard Navigation

**Tab Order:**
- Logical tab sequence following visual layout
- Skip links for main content areas
- Trapped focus in modals and dropdowns

**Keyboard Shortcuts:**
- `Enter` and `Space` for button activation
- `Escape` for modal/dropdown closing
- Arrow keys for menu navigation

### Screen Reader Support

**ARIA Implementation:**
- Semantic HTML structure
- ARIA labels for complex components
- Live regions for dynamic content
- Role attributes for custom components

### Color and Contrast

**Accessibility Standards:**
- WCAG 2.1 AA contrast ratios
- Color-independent information
- Focus indicators with sufficient contrast
- High contrast mode support

---

## Implementation Guidelines

### Vue.js Patterns

**Composition API:**
```typescript
// Component setup
const props = defineProps<ComponentProps>();
const emit = defineEmits<ComponentEmits>();

// Reactive state
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed properties
const buttonClasses = computed(() => ({
  [`button-${props.variant}`]: true,
  [`button-${props.size}`]: true,
  'button-loading': isLoading.value
}));
```

**Event Handling:**
```typescript
// Event emission
const handleClick = () => {
  if (!props.disabled && !isLoading.value) {
    emit('click');
  }
};

// Form validation
const validateInput = (value: string) => {
  if (props.required && !value.trim()) {
    return 'This field is required';
  }
  return null;
};
```

### Testing Patterns

**Component Testing:**
- Props validation
- Event emission
- State management
- Accessibility compliance
- Visual regression

**Integration Testing:**
- User workflow testing
- Form submission flows
- Navigation patterns
- Error handling

This component system ensures consistent, accessible, and maintainable UI development throughout Kitchen Pantry CRM.

