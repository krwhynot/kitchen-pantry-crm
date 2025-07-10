import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationItem from '../NavigationItem.vue'

// Mock components
vi.mock('../../../atoms/Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name', 'size'],
    template: '<span data-testid="icon" :data-name="name" :data-size="size"></span>'
  }
}))

vi.mock('../../../atoms/Badge/Badge.vue', () => ({
  default: {
    name: 'Badge',
    props: ['variant', 'size'],
    template: '<span data-testid="badge" :data-variant="variant" :data-size="size"><slot /></span>'
  }
}))

describe('NavigationItem Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard'
      }
    })

    const item = wrapper.find('button')
    expect(item.exists()).toBe(true)
    expect(item.text()).toBe('Dashboard')
  })

  it('renders as router-link when to prop is provided', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        to: '/dashboard'
      },
      global: {
        stubs: ['router-link']
      }
    })

    const item = wrapper.find('router-link-stub')
    expect(item.exists()).toBe(true)
    expect(item.attributes('to')).toBe('/dashboard')
  })

  it('renders as anchor when href prop is provided', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'External Link',
        href: 'https://example.com'
      }
    })

    const item = wrapper.find('a')
    expect(item.exists()).toBe(true)
    expect(item.attributes('href')).toBe('https://example.com')
  })

  it('renders with icon when provided', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        icon: 'home'
      }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('home')
  })

  it('renders with correct icon size for different sizes', () => {
    const sizes = [
      { size: 'sm', expectedSize: '16' },
      { size: 'md', expectedSize: '20' },
      { size: 'lg', expectedSize: '24' }
    ] as const

    sizes.forEach(({ size, expectedSize }) => {
      const wrapper = mount(NavigationItem, {
        props: {
          label: 'Dashboard',
          icon: 'home',
          size
        }
      })

      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.attributes('data-size')).toBe(expectedSize)
    })
  })

  it('renders with badge when provided', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Messages',
        badge: '5'
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
    expect(badge.attributes('data-variant')).toBe('default')
    expect(badge.attributes('data-size')).toBe('sm')
  })

  it('renders with custom badge variant', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Alerts',
        badge: '3',
        badgeVariant: 'danger'
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.attributes('data-variant')).toBe('danger')
  })

  it('renders with numeric badge', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Notifications',
        badge: 10
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.text()).toBe('10')
  })

  it('renders chevron when hasSubitems is true', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Settings',
        hasSubitems: true
      }
    })

    const chevron = wrapper.findAll('[data-testid="icon"]').find(icon => 
      icon.attributes('data-name') === 'chevron-down'
    )
    expect(chevron?.exists()).toBe(true)
    expect(chevron?.attributes('data-size')).toBe('12')
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['px-2', 'py-1', 'text-sm', 'min-h-[40px]'] },
      { size: 'md', expectedClasses: ['px-3', 'py-2', 'text-base', 'min-h-[44px]'] },
      { size: 'lg', expectedClasses: ['px-4', 'py-3', 'text-lg', 'min-h-[48px]'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(NavigationItem, {
        props: {
          label: 'Dashboard',
          size
        }
      })

      const item = wrapper.find('button')
      expectedClasses.forEach(className => {
        expect(item.classes()).toContain(className)
      })
    })
  })

  it('renders with correct size classes when touch optimization is disabled', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['px-2', 'py-1', 'text-sm'] },
      { size: 'md', expectedClasses: ['px-3', 'py-2', 'text-base'] },
      { size: 'lg', expectedClasses: ['px-4', 'py-3', 'text-lg'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(NavigationItem, {
        props: {
          label: 'Dashboard',
          size,
          touchOptimized: false
        }
      })

      const item = wrapper.find('button')
      expectedClasses.forEach(className => {
        expect(item.classes()).toContain(className)
      })
      expect(item.classes()).not.toContain('min-h-[40px]')
      expect(item.classes()).not.toContain('min-h-[44px]')
      expect(item.classes()).not.toContain('min-h-[48px]')
    })
  })

  it('renders with correct variant classes', () => {
    const variants = [
      { variant: 'default', expectedClasses: ['w-full', 'justify-start'] },
      { variant: 'compact', expectedClasses: ['justify-center'] },
      { variant: 'pill', expectedClasses: ['justify-center', 'rounded-full'] }
    ] as const

    variants.forEach(({ variant, expectedClasses }) => {
      const wrapper = mount(NavigationItem, {
        props: {
          label: 'Dashboard',
          variant
        }
      })

      const item = wrapper.find('button')
      expectedClasses.forEach(className => {
        expect(item.classes()).toContain(className)
      })
    })
  })

  it('renders with active state classes', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        active: true
      }
    })

    const item = wrapper.find('button')
    expect(item.classes()).toContain('bg-blue-100')
    expect(item.classes()).toContain('text-blue-700')
    expect(item.classes()).toContain('hover:bg-blue-200')
    expect(item.attributes('aria-current')).toBe('page')
  })

  it('renders with disabled state classes', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        disabled: true
      }
    })

    const item = wrapper.find('button')
    expect(item.classes()).toContain('text-gray-400')
    expect(item.classes()).toContain('cursor-not-allowed')
    expect(item.classes()).toContain('disabled:opacity-50')
  })

  it('renders with default state classes', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard'
      }
    })

    const item = wrapper.find('button')
    expect(item.classes()).toContain('text-gray-700')
    expect(item.classes()).toContain('hover:bg-gray-100')
    expect(item.classes()).toContain('hover:text-gray-900')
  })

  it('renders icon with correct color classes for different states', () => {
    const states = [
      { active: true, expectedClass: 'text-blue-600' },
      { disabled: true, expectedClass: 'text-gray-400' },
      { active: false, disabled: false, expectedClass: 'text-gray-500' }
    ]

    states.forEach(({ active, disabled, expectedClass }) => {
      const wrapper = mount(NavigationItem, {
        props: {
          label: 'Dashboard',
          icon: 'home',
          active,
          disabled
        }
      })

      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.classes()).toContain(expectedClass)
    })
  })

  it('renders icon with correct spacing classes', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        icon: 'home',
        variant: 'default'
      }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.classes()).toContain('mr-2')
  })

  it('renders icon without spacing in compact variant', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        icon: 'home',
        variant: 'compact'
      }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.classes()).not.toContain('mr-2')
  })

  it('hides text in compact variant', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        variant: 'compact'
      }
    })

    const text = wrapper.find('span')
    expect(text.classes()).toContain('sr-only')
  })

  it('hides badge in compact variant', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Messages',
        badge: '5',
        variant: 'compact'
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.classes()).toContain('hidden')
  })

  it('hides chevron in compact variant', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Settings',
        hasSubitems: true,
        variant: 'compact'
      }
    })

    const chevron = wrapper.findAll('[data-testid="icon"]').find(icon => 
      icon.attributes('data-name') === 'chevron-down'
    )
    expect(chevron?.classes()).toContain('hidden')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard'
      }
    })

    const item = wrapper.find('button')
    await item.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        disabled: true
      }
    })

    const item = wrapper.find('button')
    await item.trigger('click')

    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('renders slot content instead of label', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard'
      },
      slots: {
        default: 'Custom Content'
      }
    })

    expect(wrapper.text()).toContain('Custom Content')
    expect(wrapper.text()).not.toContain('Dashboard')
  })

  it('has correct base classes', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard'
      }
    })

    const item = wrapper.find('button')
    expect(item.classes()).toContain('inline-flex')
    expect(item.classes()).toContain('items-center')
    expect(item.classes()).toContain('font-medium')
    expect(item.classes()).toContain('rounded-md')
    expect(item.classes()).toContain('transition-colors')
    expect(item.classes()).toContain('duration-200')
    expect(item.classes()).toContain('focus:outline-none')
    expect(item.classes()).toContain('focus:ring-2')
    expect(item.classes()).toContain('focus:ring-offset-2')
    expect(item.classes()).toContain('focus:ring-blue-500')
  })

  it('renders chevron with correct color classes for different states', () => {
    const states = [
      { active: true, expectedClass: 'text-blue-600' },
      { disabled: true, expectedClass: 'text-gray-400' },
      { active: false, disabled: false, expectedClass: 'text-gray-500' }
    ]

    states.forEach(({ active, disabled, expectedClass }) => {
      const wrapper = mount(NavigationItem, {
        props: {
          label: 'Settings',
          hasSubitems: true,
          active,
          disabled
        }
      })

      const chevron = wrapper.findAll('[data-testid="icon"]').find(icon => 
        icon.attributes('data-name') === 'chevron-down'
      )
      expect(chevron?.classes()).toContain(expectedClass)
    })
  })

  it('renders with complex configuration', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Messages',
        icon: 'envelope',
        badge: '12',
        badgeVariant: 'danger',
        hasSubitems: true,
        size: 'lg',
        variant: 'default',
        active: false,
        disabled: false
      }
    })

    // Check all elements are rendered
    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="badge"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="icon"]')).toHaveLength(2) // main icon + chevron
    expect(wrapper.text()).toContain('Messages')
    expect(wrapper.text()).toContain('12')
  })

  it('does not have aria-current when not active', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard',
        active: false
      }
    })

    const item = wrapper.find('button')
    expect(item.attributes('aria-current')).toBeUndefined()
  })

  it('renders text with truncate class', () => {
    const wrapper = mount(NavigationItem, {
      props: {
        label: 'Dashboard'
      }
    })

    const text = wrapper.find('span')
    expect(text.classes()).toContain('truncate')
  })
})