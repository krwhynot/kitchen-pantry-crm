import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Avatar from '../Avatar.vue'

// Mock the Icon component
vi.mock('../../Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name', 'size'],
    template: '<span data-testid="icon" :data-name="name" :data-size="size"></span>'
  }
}))

describe('Avatar Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Avatar)
    
    const avatar = wrapper.find('[data-testid="icon"]')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('data-name')).toBe('user')
    expect(avatar.attributes('data-size')).toBe('20')
  })

  it('renders image when src is provided', () => {
    const wrapper = mount(Avatar, {
      props: {
        src: 'https://example.com/avatar.jpg',
        alt: 'User Avatar'
      }
    })

    const image = wrapper.find('img')
    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe('https://example.com/avatar.jpg')
    expect(image.attributes('alt')).toBe('User Avatar')
  })

  it('renders initials when provided', () => {
    const wrapper = mount(Avatar, {
      props: {
        initials: 'JD'
      }
    })

    const initialsDiv = wrapper.find('div[class*="text-white"]')
    expect(initialsDiv.text()).toBe('JD')
    expect(initialsDiv.classes()).toContain('text-white')
    expect(initialsDiv.classes()).toContain('font-medium')
  })

  it('falls back to initials when image fails to load', async () => {
    const wrapper = mount(Avatar, {
      props: {
        src: 'https://example.com/broken-image.jpg',
        initials: 'JD'
      }
    })

    // Initially shows image
    expect(wrapper.find('img').exists()).toBe(true)
    
    // Trigger image error
    await wrapper.find('img').trigger('error')
    
    // Should now show initials
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('JD')
  })

  it('falls back to icon when image fails and no initials', async () => {
    const wrapper = mount(Avatar, {
      props: {
        src: 'https://example.com/broken-image.jpg'
      }
    })

    // Initially shows image
    expect(wrapper.find('img').exists()).toBe(true)
    
    // Trigger image error
    await wrapper.find('img').trigger('error')
    
    // Should now show icon
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'xs', expectedClass: 'w-6 h-6' },
      { size: 'sm', expectedClass: 'w-8 h-8' },
      { size: 'md', expectedClass: 'w-10 h-10' },
      { size: 'lg', expectedClass: 'w-12 h-12' },
      { size: 'xl', expectedClass: 'w-14 h-14' },
      { size: '2xl', expectedClass: 'w-16 h-16' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(Avatar, {
        props: { size }
      })
      
      const avatar = wrapper.find('div')
      expect(avatar.classes()).toContain(expectedClass.split(' ')[0])
      expect(avatar.classes()).toContain(expectedClass.split(' ')[1])
    })
  })

  it('renders with correct rounded classes', () => {
    const roundedOptions = [
      { rounded: 'full', expectedClass: 'rounded-full' },
      { rounded: 'lg', expectedClass: 'rounded-lg' },
      { rounded: 'md', expectedClass: 'rounded-md' },
      { rounded: 'sm', expectedClass: 'rounded-sm' }
    ] as const

    roundedOptions.forEach(({ rounded, expectedClass }) => {
      const wrapper = mount(Avatar, {
        props: { rounded }
      })
      
      const avatar = wrapper.find('div')
      expect(avatar.classes()).toContain(expectedClass)
    })
  })

  it('renders status indicator when status is provided', () => {
    const wrapper = mount(Avatar, {
      props: {
        status: 'online'
      }
    })

    const statusIndicator = wrapper.find('[class*="absolute bottom-0 right-0"]')
    expect(statusIndicator.exists()).toBe(true)
    
    const statusDot = statusIndicator.find('[class*="bg-green-400"]')
    expect(statusDot.exists()).toBe(true)
  })

  it('renders correct status colors', () => {
    const statuses = [
      { status: 'online', expectedClass: 'bg-green-400' },
      { status: 'offline', expectedClass: 'bg-gray-400' },
      { status: 'away', expectedClass: 'bg-yellow-400' },
      { status: 'busy', expectedClass: 'bg-red-400' }
    ] as const

    statuses.forEach(({ status, expectedClass }) => {
      const wrapper = mount(Avatar, {
        props: { status }
      })
      
      const statusDot = wrapper.find('[class*="w-full h-full rounded-full"]')
      expect(statusDot.classes()).toContain(expectedClass)
    })
  })

  it('exposes generateInitials method', () => {
    const wrapper = mount(Avatar)
    
    const generateInitials = wrapper.vm.generateInitials
    expect(generateInitials).toBeDefined()
    expect(generateInitials('John Doe')).toBe('JD')
    expect(generateInitials('Jane Smith Wilson')).toBe('JS')
    expect(generateInitials('SingleName')).toBe('S')
  })

  it('renders with correct icon size for different avatar sizes', () => {
    const sizes = [
      { size: 'xs', expectedIconSize: '12' },
      { size: 'sm', expectedIconSize: '16' },
      { size: 'md', expectedIconSize: '20' },
      { size: 'lg', expectedIconSize: '24' },
      { size: 'xl', expectedIconSize: '28' },
      { size: '2xl', expectedIconSize: '32' }
    ] as const

    sizes.forEach(({ size, expectedIconSize }) => {
      const wrapper = mount(Avatar, {
        props: { size }
      })
      
      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.attributes('data-size')).toBe(expectedIconSize)
    })
  })

  it('renders with correct text size for initials', () => {
    const sizes = [
      { size: 'xs', expectedTextClass: 'text-xs' },
      { size: 'sm', expectedTextClass: 'text-sm' },
      { size: 'md', expectedTextClass: 'text-base' },
      { size: 'lg', expectedTextClass: 'text-lg' },
      { size: 'xl', expectedTextClass: 'text-xl' },
      { size: '2xl', expectedTextClass: 'text-2xl' }
    ] as const

    sizes.forEach(({ size, expectedTextClass }) => {
      const wrapper = mount(Avatar, {
        props: { size, initials: 'JD' }
      })
      
      const initialsDiv = wrapper.find('div[class*="text-white"]')
      expect(initialsDiv.classes()).toContain(expectedTextClass)
    })
  })

  it('has correct base classes', () => {
    const wrapper = mount(Avatar)
    
    const avatar = wrapper.find('div')
    expect(avatar.classes()).toContain('inline-flex')
    expect(avatar.classes()).toContain('items-center')
    expect(avatar.classes()).toContain('justify-center')
    expect(avatar.classes()).toContain('bg-gray-500')
    expect(avatar.classes()).toContain('overflow-hidden')
    expect(avatar.classes()).toContain('relative')
    expect(avatar.classes()).toContain('flex-shrink-0')
  })

  it('renders image with correct classes', () => {
    const wrapper = mount(Avatar, {
      props: {
        src: 'https://example.com/avatar.jpg'
      }
    })

    const image = wrapper.find('img')
    expect(image.classes()).toContain('w-full')
    expect(image.classes()).toContain('h-full')
    expect(image.classes()).toContain('object-cover')
  })

  it('renders initials with correct classes', () => {
    const wrapper = mount(Avatar, {
      props: {
        initials: 'JD'
      }
    })

    const initialsDiv = wrapper.find('div[class*="text-white"]')
    expect(initialsDiv.classes()).toContain('text-white')
    expect(initialsDiv.classes()).toContain('font-medium')
    expect(initialsDiv.classes()).toContain('select-none')
  })

  it('renders status indicator with correct ring and positioning', () => {
    const wrapper = mount(Avatar, {
      props: {
        status: 'online'
      }
    })

    const statusIndicator = wrapper.find('[class*="absolute bottom-0 right-0"]')
    expect(statusIndicator.classes()).toContain('absolute')
    expect(statusIndicator.classes()).toContain('bottom-0')
    expect(statusIndicator.classes()).toContain('right-0')
    expect(statusIndicator.classes()).toContain('rounded-full')
    expect(statusIndicator.classes()).toContain('ring-2')
    expect(statusIndicator.classes()).toContain('ring-white')
  })
})