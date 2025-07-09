import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

// Mock the Icon and LoadingSpinner components
vi.mock('../../Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name', 'size'],
    template: '<span data-testid="icon" :data-name="name" :data-size="size"></span>'
  }
}))

vi.mock('../../LoadingSpinner/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    props: ['size'],
    template: '<span data-testid="loading-spinner" :data-size="size"></span>'
  }
}))

describe('Button Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Click me')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('renders with correct variant classes', () => {
    const variants = [
      { variant: 'primary', expectedClass: 'bg-blue-600' },
      { variant: 'secondary', expectedClass: 'bg-gray-200' },
      { variant: 'danger', expectedClass: 'bg-red-600' },
      { variant: 'ghost', expectedClass: 'text-gray-700' }
    ] as const

    variants.forEach(({ variant, expectedClass }) => {
      const wrapper = mount(Button, {
        props: { variant },
        slots: { default: 'Test' }
      })

      expect(wrapper.find('button').classes()).toContain(expectedClass)
    })
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'px-3' },
      { size: 'md', expectedClass: 'px-4' },
      { size: 'lg', expectedClass: 'px-6' },
      { size: 'xl', expectedClass: 'px-8' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(Button, {
        props: { size },
        slots: { default: 'Test' }
      })

      expect(wrapper.find('button').classes()).toContain(expectedClass)
    })
  })

  it('applies touch optimization classes by default', () => {
    const wrapper = mount(Button, {
      props: { size: 'md' },
      slots: { default: 'Test' }
    })

    expect(wrapper.find('button').classes()).toContain('min-h-[48px]')
  })

  it('does not apply touch optimization classes when touchOptimized is false', () => {
    const wrapper = mount(Button, {
      props: { size: 'md', touchOptimized: false },
      slots: { default: 'Test' }
    })

    expect(wrapper.find('button').classes()).not.toContain('min-h-[48px]')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' }
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click event when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Click me' }
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('does not emit click event when loading', async () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: 'Click me' }
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Click me' }
    })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('is disabled when loading prop is true', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: 'Click me' }
    })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders with correct button type', () => {
    const types = ['button', 'submit', 'reset'] as const

    types.forEach(type => {
      const wrapper = mount(Button, {
        props: { type },
        slots: { default: 'Test' }
      })

      expect(wrapper.find('button').attributes('type')).toBe(type)
    })
  })

  it('renders with aria-label when provided', () => {
    const wrapper = mount(Button, {
      props: { ariaLabel: 'Custom button label' },
      slots: { default: 'Click me' }
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe('Custom button label')
  })

  it('renders icon when icon prop is provided', () => {
    const wrapper = mount(Button, {
      props: { icon: 'plus' },
      slots: { default: 'Add Item' }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('plus')
    expect(icon.attributes('data-size')).toBe('20') // md size default
  })

  it('does not render icon when loading', () => {
    const wrapper = mount(Button, {
      props: { icon: 'plus', loading: true },
      slots: { default: 'Add Item' }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.exists()).toBe(false)
  })

  it('renders loading spinner when loading prop is true', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: 'Loading...' }
    })

    const spinner = wrapper.find('[data-testid="loading-spinner"]')
    expect(spinner.exists()).toBe(true)
    expect(spinner.attributes('data-size')).toBe('20') // md size default
  })

  it('renders icon with correct size based on button size', () => {
    const sizes = [
      { size: 'sm', expectedIconSize: '16' },
      { size: 'md', expectedIconSize: '20' },
      { size: 'lg', expectedIconSize: '24' },
      { size: 'xl', expectedIconSize: '28' }
    ] as const

    sizes.forEach(({ size, expectedIconSize }) => {
      const wrapper = mount(Button, {
        props: { size, icon: 'plus' },
        slots: { default: 'Test' }
      })

      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.attributes('data-size')).toBe(expectedIconSize)
    })
  })

  it('renders loading spinner with correct size based on button size', () => {
    const sizes = [
      { size: 'sm', expectedSpinnerSize: '16' },
      { size: 'md', expectedSpinnerSize: '20' },
      { size: 'lg', expectedSpinnerSize: '24' },
      { size: 'xl', expectedSpinnerSize: '28' }
    ] as const

    sizes.forEach(({ size, expectedSpinnerSize }) => {
      const wrapper = mount(Button, {
        props: { size, loading: true },
        slots: { default: 'Test' }
      })

      const spinner = wrapper.find('[data-testid="loading-spinner"]')
      expect(spinner.attributes('data-size')).toBe(expectedSpinnerSize)
    })
  })

  it('applies correct text margin when icon is present', () => {
    const wrapper = mount(Button, {
      props: { icon: 'plus' },
      slots: { default: 'Add Item' }
    })

    const textSpan = wrapper.find('span').last()
    expect(textSpan.classes()).toContain('ml-2')
  })

  it('does not apply text margin when icon is not present', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' }
    })

    const textSpan = wrapper.find('span')
    expect(textSpan.classes()).not.toContain('ml-2')
  })

  it('handles click event correctly', async () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' }
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    const emittedEvents = wrapper.emitted('click')
    expect(emittedEvents).toBeTruthy()
    expect(emittedEvents![0]).toHaveLength(1)
    expect(emittedEvents![0][0]).toBeInstanceOf(MouseEvent)
  })

  it('applies base classes correctly', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Test' }
    })

    const button = wrapper.find('button')
    const expectedBaseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'ease-in-out',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    ]

    expectedBaseClasses.forEach(className => {
      expect(button.classes()).toContain(className)
    })
  })

  it('renders without slot content', () => {
    const wrapper = mount(Button, {
      props: { icon: 'plus', ariaLabel: 'Add button' }
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
    expect(wrapper.find('span').exists()).toBe(false)
  })

  it('applies correct classes for different combinations', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'danger',
        size: 'lg',
        touchOptimized: true
      },
      slots: { default: 'Delete' }
    })

    const button = wrapper.find('button')
    const classes = button.classes()

    // Check variant classes
    expect(classes).toContain('bg-red-600')
    expect(classes).toContain('text-white')
    expect(classes).toContain('hover:bg-red-700')
    expect(classes).toContain('focus:ring-red-500')

    // Check size classes
    expect(classes).toContain('px-6')
    expect(classes).toContain('py-3')
    expect(classes).toContain('text-lg')

    // Check touch optimization
    expect(classes).toContain('min-h-[52px]')
  })
})