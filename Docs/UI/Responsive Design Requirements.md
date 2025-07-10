# Responsive Design Requirements

**Kitchen Pantry CRM Responsive Specifications**

This file defines responsive design patterns and requirements for optimal user experience across all device types and screen sizes.

---

## Breakpoint System

### Mobile-First Approach

Kitchen Pantry CRM uses a mobile-first responsive strategy, progressively enhancing for larger screens.

**Breakpoint Definitions:**
```css
/* Mobile First - Base styles apply to mobile */
/* No media query needed for mobile styles */

/* Small tablets and large phones */
@media (min-width: 640px) { /* sm */ }

/* Tablets */
@media (min-width: 768px) { /* md */ }

/* Small desktops and large tablets */
@media (min-width: 1024px) { /* lg */ }

/* Large desktops */
@media (min-width: 1280px) { /* xl */ }

/* Extra large screens */
@media (min-width: 1536px) { /* 2xl */ }
```

**Breakpoint Variables:**
- `--breakpoint-sm: 640px` *(Large mobile)*
- `--breakpoint-md: 768px` *(Tablet)*
- `--breakpoint-lg: 1024px` *(Desktop)*
- `--breakpoint-xl: 1280px` *(Large desktop)*
- `--breakpoint-2xl: 1536px` *(Extra large)*

### Device Targeting

**Primary Devices:**
- **Mobile:** iPhone 12/13/14, Samsung Galaxy S21/S22
- **Tablet:** iPad, iPad Pro, Android tablets
- **Desktop:** 1920×1080, 2560×1440 displays
- **Large Desktop:** 4K displays, ultrawide monitors

---

## Layout Adaptation Patterns

### Container System

**Responsive Containers:**
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-4); /* 16px mobile */
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
    padding: 0 var(--spacing-6); /* 24px tablet */
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 0 var(--spacing-8); /* 32px desktop */
  }
}
```

### Grid System

**Responsive Grid:**
```css
.grid {
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: 1fr; /* Mobile: single column */
}

@media (min-width: 640px) {
  .grid-sm-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-sm-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 768px) {
  .grid-md-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-md-4 { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .grid-lg-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-lg-6 { grid-template-columns: repeat(6, 1fr); }
}
```

---

## Navigation Patterns

### Mobile Navigation

**Hamburger Menu Pattern:**
```css
.mobile-nav {
  position: fixed;
  top: 0;
  left: -100%;
  width: 80%;
  height: 100vh;
  background: var(--color-neutral-0);
  transition: left var(--duration-300) var(--ease-in-out);
  z-index: 50;
}

.mobile-nav.open {
  left: 0;
}

.mobile-nav-item {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
  font-size: var(--font-size-lg);
}
```

**Bottom Tab Navigation:**
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-neutral-0);
  border-top: 1px solid var(--color-neutral-200);
  display: flex;
  justify-content: space-around;
  padding: var(--spacing-2) 0;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2);
  min-width: 44px;
}
```

### Tablet Navigation

**Sidebar Navigation:**
```css
@media (min-width: 768px) {
  .tablet-nav {
    position: fixed;
    left: 0;
    top: 0;
    width: 240px;
    height: 100vh;
    background: var(--color-neutral-50);
    border-right: 1px solid var(--color-neutral-200);
  }
  
  .main-content {
    margin-left: 240px;
  }
}
```

### Desktop Navigation

**Top Navigation with Sidebar:**
```css
@media (min-width: 1024px) {
  .desktop-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4) var(--spacing-8);
    background: var(--color-neutral-0);
    border-bottom: 1px solid var(--color-neutral-200);
  }
  
  .nav-menu {
    display: flex;
    gap: var(--spacing-6);
  }
  
  .nav-item {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--border-radius-md);
    transition: var(--transition-colors);
  }
}
```

---

## Component Responsiveness

### Form Layouts

**Mobile Forms:**
```css
.form-mobile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-field-mobile {
  width: 100%;
}

.form-field-mobile input {
  min-height: 44px; /* Touch target minimum */
  font-size: var(--font-size-base); /* Prevent zoom on iOS */
}
```

**Tablet Forms:**
```css
@media (min-width: 768px) {
  .form-tablet {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-6);
  }
  
  .form-field-full {
    grid-column: 1 / -1;
  }
}
```

**Desktop Forms:**
```css
@media (min-width: 1024px) {
  .form-desktop {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-8);
  }
}
```

### Data Table Responsiveness

**Mobile Card Layout:**
```css
@media (max-width: 767px) {
  .table-desktop {
    display: none;
  }
  
  .table-mobile {
    display: block;
  }
  
  .table-card {
    background: var(--color-neutral-0);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-4);
    margin-bottom: var(--spacing-4);
  }
  
  .table-row {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-neutral-100);
  }
}
```

**Desktop Table Layout:**
```css
@media (min-width: 768px) {
  .table-desktop {
    width: 100%;
    border-collapse: collapse;
  }
  
  .table-cell {
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-neutral-200);
  }
}
```

---

## Touch Optimization

### Touch Target Sizing

**Minimum Touch Targets:**
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Button touch targets */
.button-touch {
  min-height: 44px;
  padding: var(--spacing-3) var(--spacing-6);
}

/* Icon button touch targets */
.icon-button-touch {
  min-height: 44px;
  min-width: 44px;
  padding: var(--spacing-2);
}
```

### Touch Spacing

**Interactive Element Spacing:**
```css
.touch-group {
  display: flex;
  gap: var(--spacing-2); /* 8px minimum between touch targets */
}

.touch-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1); /* 4px minimum vertical spacing */
}
```

### Gesture Support

**Swipe Gestures:**
```css
.swipe-container {
  overflow: hidden;
  touch-action: pan-x;
}

.swipe-content {
  display: flex;
  transition: transform var(--duration-300) var(--ease-out);
  will-change: transform;
}
```

**Pull-to-Refresh:**
```css
.pull-refresh {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
}

.pull-refresh-indicator {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  transition: top var(--duration-300) var(--ease-out);
}
```

---

## Performance Optimization

### Image Responsiveness

**Responsive Images:**
```css
.responsive-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Aspect ratio containers */
.aspect-16-9 {
  aspect-ratio: 16 / 9;
}

.aspect-4-3 {
  aspect-ratio: 4 / 3;
}

.aspect-1-1 {
  aspect-ratio: 1 / 1;
}
```

**Lazy Loading:**
```css
.image-lazy {
  opacity: 0;
  transition: opacity var(--duration-300) var(--ease-out);
}

.image-lazy.loaded {
  opacity: 1;
}
```

### Content Loading

**Progressive Loading:**
```css
.skeleton-loading {
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 25%,
    var(--color-neutral-100) 50%,
    var(--color-neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s infinite;
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Accessibility Considerations

### Screen Reader Optimization

**Responsive Screen Reader Content:**
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

/* Show on focus for keyboard users */
.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Focus Management

**Responsive Focus Indicators:**
```css
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Larger focus indicators on mobile */
@media (max-width: 767px) {
  .focus-visible {
    outline-width: 3px;
    outline-offset: 3px;
  }
}
```

### Motion Preferences

**Reduced Motion Support:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Guidelines

### Responsive Testing

**Device Testing:**
- Test on actual devices when possible
- Use browser developer tools for initial testing
- Validate touch interactions on touch devices
- Check performance on lower-end devices

**Breakpoint Testing:**
- Test at exact breakpoint widths
- Test between breakpoints for fluid behavior
- Validate layout at extreme sizes
- Check for horizontal scrolling issues

### Performance Testing

**Mobile Performance:**
- Test on 3G network conditions
- Validate image loading and optimization
- Check JavaScript performance on mobile
- Monitor battery usage during extended use

**Accessibility Testing:**
- Test with screen readers on mobile
- Validate keyboard navigation on all devices
- Check color contrast at different screen sizes
- Test with various accessibility tools

This responsive design system ensures optimal user experience across all devices and usage contexts for Kitchen Pantry CRM.

