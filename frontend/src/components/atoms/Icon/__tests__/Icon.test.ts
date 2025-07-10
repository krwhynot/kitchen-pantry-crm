import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '../Icon.vue'

describe('Icon Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('flex-shrink-0')
  })

  it('renders correct icon for known names', () => {
    const iconNames = [
      'user',
      'building-office',
      'phone',
      'envelope',
      'calendar',
      'currency-dollar',
      'magnifying-glass',
      'plus',
      'x-mark',
      'pencil',
      'trash',
      'eye',
      'clock',
      'exclamation-circle',
      'check-circle',
      'information-circle',
      'exclamation-triangle',
      'arrow-up',
      'arrow-down',
      'chevron-up',
      'chevron-down',
      'home',
      'chart-bar',
      'folder',
      'inbox',
      'document',
      'cog-6-tooth',
      'bell',
      'table-cells',
      'list-bullet',
      'map-pin',
      'tag',
      'star',
      'heart'
    ]

    iconNames.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders fallback icon for unknown names', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'unknown-icon'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    // Should fallback to DocumentIcon
  })

  it('renders with custom size as number', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user',
        size: 24
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    // Size 24 should translate to w-6 h-6 (24/4 = 6)
    expect(icon.classes()).toContain('w-6')
    expect(icon.classes()).toContain('h-6')
  })

  it('renders with custom size as string', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user',
        size: 'w-8 h-8'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('w-8')
    expect(icon.classes()).toContain('h-8')
  })

  it('renders with default size', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    // Default size is 20, so 20/4 = 5
    expect(icon.classes()).toContain('w-5')
    expect(icon.classes()).toContain('h-5')
  })

  it('renders with custom classes', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user',
        class: 'text-red-500 hover:text-red-700'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(icon.classes()).toContain('text-red-500')
    expect(icon.classes()).toContain('hover:text-red-700')
  })

  it('renders with aria-label when provided', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user',
        ariaLabel: 'User profile'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('aria-label')).toBe('User profile')
    expect(icon.attributes('aria-hidden')).toBe('false')
  })

  it('renders with aria-hidden when no aria-label provided', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('aria-hidden')).toBe('true')
    expect(icon.attributes('aria-label')).toBeUndefined()
  })

  it('handles common icon aliases', () => {
    const aliases = [
      { alias: 'search', canonical: 'magnifying-glass' },
      { alias: 'x', canonical: 'x-mark' }
    ]

    aliases.forEach(({ alias, canonical }) => {
      const aliasWrapper = mount(Icon, {
        props: { name: alias }
      })
      
      const canonicalWrapper = mount(Icon, {
        props: { name: canonical }
      })
      
      // Both should render the same icon
      expect(aliasWrapper.find('svg').exists()).toBe(true)
      expect(canonicalWrapper.find('svg').exists()).toBe(true)
    })
  })

  it('renders user group icon', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user-group'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
  })

  it('renders communication icons', () => {
    const communicationIcons = ['phone', 'envelope', 'globe-alt', 'link']
    
    communicationIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders navigation icons', () => {
    const navigationIcons = ['home', 'chevron-up', 'chevron-down', 'arrow-up', 'arrow-down']
    
    navigationIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders action icons', () => {
    const actionIcons = ['plus', 'x-mark', 'pencil', 'trash', 'eye', 'arrow-down-tray', 'printer', 'share']
    
    actionIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders status icons', () => {
    const statusIcons = ['clock', 'exclamation-circle', 'check-circle', 'information-circle', 'exclamation-triangle']
    
    statusIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders data icons', () => {
    const dataIcons = ['calendar', 'document', 'folder', 'inbox', 'table-cells', 'list-bullet']
    
    dataIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders system icons', () => {
    const systemIcons = ['cog-6-tooth', 'bell', 'cloud', 'server', 'shield-check', 'key', 'lock-closed']
    
    systemIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders UI icons', () => {
    const uiIcons = ['adjustments-horizontal', 'funnel', 'bars-3', 'ellipsis-horizontal']
    
    uiIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('renders miscellaneous icons', () => {
    const miscIcons = ['map-pin', 'tag', 'star', 'heart']
    
    miscIcons.forEach(iconName => {
      const wrapper = mount(Icon, {
        props: {
          name: iconName
        }
      })
      
      const icon = wrapper.find('svg')
      expect(icon.exists()).toBe(true)
    })
  })

  it('has correct base classes', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.classes()).toContain('flex-shrink-0')
  })

  it('combines base classes with custom classes', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'user',
        class: 'text-blue-500 custom-class'
      }
    })
    
    const icon = wrapper.find('svg')
    expect(icon.classes()).toContain('flex-shrink-0')
    expect(icon.classes()).toContain('text-blue-500')
    expect(icon.classes()).toContain('custom-class')
  })

  it('handles size calculation correctly for various numbers', () => {
    const sizes = [
      { input: 12, expected: 'w-3 h-3' },
      { input: 16, expected: 'w-4 h-4' },
      { input: 20, expected: 'w-5 h-5' },
      { input: 24, expected: 'w-6 h-6' },
      { input: 32, expected: 'w-8 h-8' }
    ]

    sizes.forEach(({ input, expected }) => {
      const wrapper = mount(Icon, {
        props: {
          name: 'user',
          size: input
        }
      })
      
      const icon = wrapper.find('svg')
      const [widthClass, heightClass] = expected.split(' ')
      expect(icon.classes()).toContain(widthClass)
      expect(icon.classes()).toContain(heightClass)
    })
  })
})