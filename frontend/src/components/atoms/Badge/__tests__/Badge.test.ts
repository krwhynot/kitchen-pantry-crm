import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '../Badge.vue'

// Mock the Icon component
vi.mock('../../Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name', 'size'],
    template: '<span data-testid="icon" :data-name="name" :data-size="size"></span>'
  }
}))

describe('Badge Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Badge Text'
      }
    })
    
    const badge = wrapper.find('span')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Badge Text')
    expect(badge.classes()).toContain('inline-flex')
    expect(badge.classes()).toContain('items-center')
    expect(badge.classes()).toContain('font-medium')
    expect(badge.classes()).toContain('rounded-full')
  })

  it('renders with correct variant classes', () => {
    const variants = [
      { variant: 'default', expectedClass: 'bg-gray-100', textClass: 'text-gray-800' },
      { variant: 'primary', expectedClass: 'bg-blue-100', textClass: 'text-blue-800' },
      { variant: 'secondary', expectedClass: 'bg-gray-200', textClass: 'text-gray-800' },
      { variant: 'success', expectedClass: 'bg-green-100', textClass: 'text-green-800' },
      { variant: 'warning', expectedClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
      { variant: 'danger', expectedClass: 'bg-red-100', textClass: 'text-red-800' },
      { variant: 'info', expectedClass: 'bg-blue-100', textClass: 'text-blue-800' }
    ] as const

    variants.forEach(({ variant, expectedClass, textClass }) => {
      const wrapper = mount(Badge, {
        props: { variant },
        slots: { default: 'Test' }
      })
      
      const badge = wrapper.find('span')
      expect(badge.classes()).toContain(expectedClass)
      expect(badge.classes()).toContain(textClass)
    })
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['px-2', 'py-0.5', 'text-xs'] },
      { size: 'md', expectedClasses: ['px-2.5', 'py-1', 'text-sm'] },
      { size: 'lg', expectedClasses: ['px-3', 'py-1.5', 'text-base'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(Badge, {
        props: { size },
        slots: { default: 'Test' }
      })
      
      const badge = wrapper.find('span')
      expectedClasses.forEach(className => {
        expect(badge.classes()).toContain(className)
      })
    })
  })

  it('renders with outlined variant classes', () => {
    const variants = [
      { variant: 'default', expectedClasses: ['bg-gray-100', 'text-gray-800', 'border', 'border-gray-300'] },
      { variant: 'primary', expectedClasses: ['bg-blue-50', 'text-blue-800', 'border', 'border-blue-300'] },
      { variant: 'success', expectedClasses: ['bg-green-50', 'text-green-800', 'border', 'border-green-300'] },
      { variant: 'warning', expectedClasses: ['bg-yellow-50', 'text-yellow-800', 'border', 'border-yellow-300'] },
      { variant: 'danger', expectedClasses: ['bg-red-50', 'text-red-800', 'border', 'border-red-300'] }
    ] as const

    variants.forEach(({ variant, expectedClasses }) => {
      const wrapper = mount(Badge, {
        props: { variant, outlined: true },
        slots: { default: 'Test' }
      })
      
      const badge = wrapper.find('span')
      expectedClasses.forEach(className => {
        expect(badge.classes()).toContain(className)
      })
    })
  })

  it('renders with icon when provided', () => {
    const wrapper = mount(Badge, {
      props: {
        icon: 'star'
      },
      slots: {
        default: 'Badge with Icon'
      }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('star')
    expect(icon.classes()).toContain('mr-1')
  })

  it('renders with correct icon size for different badge sizes', () => {
    const sizes = [
      { size: 'sm', expectedIconSize: '12' },
      { size: 'md', expectedIconSize: '14' },
      { size: 'lg', expectedIconSize: '16' }
    ] as const

    sizes.forEach(({ size, expectedIconSize }) => {
      const wrapper = mount(Badge, {
        props: { size, icon: 'star' },
        slots: { default: 'Test' }
      })
      
      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.attributes('data-size')).toBe(expectedIconSize)
    })
  })

  it('renders dismissible badge with close button', () => {
    const wrapper = mount(Badge, {
      props: {
        dismissible: true
      },
      slots: {
        default: 'Dismissible Badge'
      }
    })

    const dismissButton = wrapper.find('button')
    expect(dismissButton.exists()).toBe(true)
    expect(dismissButton.attributes('aria-label')).toBe('Dismiss')
    
    const closeIcon = dismissButton.find('[data-testid="icon"]')
    expect(closeIcon.exists()).toBe(true)
    expect(closeIcon.attributes('data-name')).toBe('x')
    expect(closeIcon.attributes('data-size')).toBe('12')
  })

  it('emits dismiss event when close button is clicked', async () => {
    const wrapper = mount(Badge, {
      props: {
        dismissible: true
      },
      slots: {
        default: 'Dismissible Badge'
      }
    })

    const dismissButton = wrapper.find('button')
    await dismissButton.trigger('click')
    
    expect(wrapper.emitted('dismiss')).toBeTruthy()
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('renders dismiss button with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['w-4', 'h-4'] },
      { size: 'md', expectedClasses: ['w-5', 'h-5'] },
      { size: 'lg', expectedClasses: ['w-6', 'h-6'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(Badge, {
        props: { size, dismissible: true },
        slots: { default: 'Test' }
      })
      
      const dismissButton = wrapper.find('button')
      expectedClasses.forEach(className => {
        expect(dismissButton.classes()).toContain(className)
      })
    })
  })

  it('renders dismiss button with correct hover and focus classes', () => {
    const wrapper = mount(Badge, {
      props: {
        dismissible: true
      },
      slots: {
        default: 'Test'
      }
    })

    const dismissButton = wrapper.find('button')
    expect(dismissButton.classes()).toContain('hover:bg-black')
    expect(dismissButton.classes()).toContain('hover:bg-opacity-20')
    expect(dismissButton.classes()).toContain('focus:outline-none')
    expect(dismissButton.classes()).toContain('focus:ring-2')
    expect(dismissButton.classes()).toContain('focus:ring-offset-2')
    expect(dismissButton.classes()).toContain('focus:ring-blue-500')
  })

  it('has correct base classes', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Test'
      }
    })
    
    const badge = wrapper.find('span')
    expect(badge.classes()).toContain('inline-flex')
    expect(badge.classes()).toContain('items-center')
    expect(badge.classes()).toContain('font-medium')
    expect(badge.classes()).toContain('rounded-full')
    expect(badge.classes()).toContain('transition-colors')
    expect(badge.classes()).toContain('duration-200')
  })

  it('renders both icon and dismiss button when both are provided', () => {
    const wrapper = mount(Badge, {
      props: {
        icon: 'star',
        dismissible: true
      },
      slots: {
        default: 'Complete Badge'
      }
    })

    const icons = wrapper.findAll('[data-testid="icon"]')
    expect(icons).toHaveLength(2)
    
    // First icon should be the badge icon
    expect(icons[0].attributes('data-name')).toBe('star')
    expect(icons[0].classes()).toContain('mr-1')
    
    // Second icon should be the dismiss icon
    expect(icons[1].attributes('data-name')).toBe('x')
    expect(icons[1].attributes('data-size')).toBe('12')
  })

  it('renders content in default slot', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: '<strong>HTML Content</strong>'
      }
    })
    
    const badge = wrapper.find('span')
    expect(badge.html()).toContain('<strong>HTML Content</strong>')
  })

  it('does not render dismiss button when dismissible is false', () => {
    const wrapper = mount(Badge, {
      props: {
        dismissible: false
      },
      slots: {
        default: 'Non-dismissible Badge'
      }
    })

    const dismissButton = wrapper.find('button')
    expect(dismissButton.exists()).toBe(false)
  })

  it('does not render icon when icon prop is not provided', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Badge without Icon'
      }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.exists()).toBe(false)
  })
})