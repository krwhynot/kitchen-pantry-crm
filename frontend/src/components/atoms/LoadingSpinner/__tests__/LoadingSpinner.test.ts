import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../LoadingSpinner.vue'

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(LoadingSpinner)
    
    const spinner = wrapper.find('div[role="status"]')
    expect(spinner.exists()).toBe(true)
    expect(spinner.attributes('aria-label')).toBe('Loading')
    
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toContain('animate-spin')
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'xs', expectedClasses: ['w-3', 'h-3'] },
      { size: 'sm', expectedClasses: ['w-4', 'h-4'] },
      { size: 'md', expectedClasses: ['w-5', 'h-5'] },
      { size: 'lg', expectedClasses: ['w-6', 'h-6'] },
      { size: 'xl', expectedClasses: ['w-8', 'h-8'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(LoadingSpinner, {
        props: { size }
      })
      
      const svg = wrapper.find('svg')
      expectedClasses.forEach(className => {
        expect(svg.classes()).toContain(className)
      })
    })
  })

  it('renders with correct color classes', () => {
    const colors = [
      { color: 'primary', expectedClass: 'text-blue-600' },
      { color: 'secondary', expectedClass: 'text-gray-600' },
      { color: 'white', expectedClass: 'text-white' },
      { color: 'gray', expectedClass: 'text-gray-400' }
    ] as const

    colors.forEach(({ color, expectedClass }) => {
      const wrapper = mount(LoadingSpinner, {
        props: { color }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain(expectedClass)
    })
  })

  it('renders text when showText is true', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        showText: true
      }
    })
    
    const text = wrapper.find('span')
    expect(text.exists()).toBe(true)
    expect(text.text()).toBe('Loading...')
    expect(text.classes()).toContain('text-sm')
  })

  it('renders custom text when provided', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        showText: true,
        text: 'Please wait...'
      }
    })
    
    const text = wrapper.find('span')
    expect(text.exists()).toBe(true)
    expect(text.text()).toBe('Please wait...')
  })

  it('does not render text when showText is false', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        showText: false
      }
    })
    
    const text = wrapper.find('span')
    expect(text.exists()).toBe(false)
  })

  it('renders with custom aria-label', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        ariaLabel: 'Processing your request'
      }
    })
    
    const spinner = wrapper.find('div[role="status"]')
    expect(spinner.attributes('aria-label')).toBe('Processing your request')
  })

  it('renders text with correct color classes', () => {
    const colors = [
      { color: 'primary', expectedClass: 'text-blue-600' },
      { color: 'secondary', expectedClass: 'text-gray-600' },
      { color: 'white', expectedClass: 'text-white' },
      { color: 'gray', expectedClass: 'text-gray-400' }
    ] as const

    colors.forEach(({ color, expectedClass }) => {
      const wrapper = mount(LoadingSpinner, {
        props: { color, showText: true }
      })
      
      const text = wrapper.find('span')
      expect(text.classes()).toContain(expectedClass)
    })
  })

  it('has correct spinner base classes', () => {
    const wrapper = mount(LoadingSpinner)
    
    const spinner = wrapper.find('div[role="status"]')
    expect(spinner.classes()).toContain('inline-flex')
    expect(spinner.classes()).toContain('items-center')
  })

  it('adds space-x-2 class when text is shown', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        showText: true
      }
    })
    
    const spinner = wrapper.find('div[role="status"]')
    expect(spinner.classes()).toContain('space-x-2')
  })

  it('does not add space-x-2 class when text is not shown', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        showText: false
      }
    })
    
    const spinner = wrapper.find('div[role="status"]')
    expect(spinner.classes()).not.toContain('space-x-2')
  })

  it('has correct SVG structure', () => {
    const wrapper = mount(LoadingSpinner)
    
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('xmlns')).toBe('http://www.w3.org/2000/svg')
    expect(svg.attributes('fill')).toBe('none')
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    
    const circle = wrapper.find('circle')
    expect(circle.exists()).toBe(true)
    expect(circle.attributes('cx')).toBe('12')
    expect(circle.attributes('cy')).toBe('12')
    expect(circle.attributes('r')).toBe('10')
    expect(circle.attributes('stroke')).toBe('currentColor')
    expect(circle.attributes('stroke-width')).toBe('4')
    
    const path = wrapper.find('path')
    expect(path.exists()).toBe(true)
    expect(path.attributes('fill')).toBe('currentColor')
  })

  it('has correct circle opacity class', () => {
    const wrapper = mount(LoadingSpinner)
    
    const circle = wrapper.find('circle')
    expect(circle.classes()).toContain('opacity-25')
  })

  it('has correct path opacity class', () => {
    const wrapper = mount(LoadingSpinner)
    
    const path = wrapper.find('path')
    expect(path.classes()).toContain('opacity-75')
  })

  it('has correct SVG base classes', () => {
    const wrapper = mount(LoadingSpinner)
    
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('animate-spin')
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mount(LoadingSpinner)
    
    const spinner = wrapper.find('div')
    expect(spinner.attributes('role')).toBe('status')
    expect(spinner.attributes('aria-label')).toBe('Loading')
  })

  it('combines all classes correctly for complex configuration', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'lg',
        color: 'primary',
        showText: true,
        text: 'Processing...',
        ariaLabel: 'Processing your request'
      }
    })
    
    // Check spinner container
    const spinner = wrapper.find('div[role="status"]')
    expect(spinner.classes()).toContain('inline-flex')
    expect(spinner.classes()).toContain('items-center')
    expect(spinner.classes()).toContain('space-x-2')
    expect(spinner.attributes('aria-label')).toBe('Processing your request')
    
    // Check SVG
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('animate-spin')
    expect(svg.classes()).toContain('w-6')
    expect(svg.classes()).toContain('h-6')
    expect(svg.classes()).toContain('text-blue-600')
    
    // Check text
    const text = wrapper.find('span')
    expect(text.exists()).toBe(true)
    expect(text.text()).toBe('Processing...')
    expect(text.classes()).toContain('text-sm')
    expect(text.classes()).toContain('text-blue-600')
  })

  it('renders correctly with minimal configuration', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'xs',
        color: 'gray'
      }
    })
    
    const svg = wrapper.find('svg')
    expect(svg.classes()).toContain('w-3')
    expect(svg.classes()).toContain('h-3')
    expect(svg.classes()).toContain('text-gray-400')
    
    const text = wrapper.find('span')
    expect(text.exists()).toBe(false)
  })
})