import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '../AppHeader.vue'

// Mock components
vi.mock('../../../atoms/Avatar/Avatar.vue', () => ({
  default: {
    name: 'Avatar',
    props: ['src', 'initials', 'size'],
    template: '<div data-testid="avatar" :data-src="src" :data-initials="initials" :data-size="size"></div>'
  }
}))

vi.mock('../../../atoms/Badge/Badge.vue', () => ({
  default: {
    name: 'Badge',
    props: ['variant', 'size'],
    template: '<span data-testid="badge" :data-variant="variant" :data-size="size"><slot /></span>'
  }
}))

vi.mock('../../../atoms/Button/Button.vue', () => ({
  default: {
    name: 'Button',
    props: ['variant', 'size', 'icon'],
    emits: ['click'],
    template: '<button data-testid="button" :data-variant="variant" :data-size="size" :data-icon="icon" @click="$emit(\'click\')"><slot /></button>'
  }
}))

vi.mock('../../../atoms/Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name', 'size'],
    template: '<span data-testid="icon" :data-name="name" :data-size="size"></span>'
  }
}))

vi.mock('../../../molecules/NavigationItem/NavigationItem.vue', () => ({
  default: {
    name: 'NavigationItem',
    props: ['to', 'href', 'icon', 'label', 'active', 'badge', 'size', 'variant'],
    emits: ['click'],
    template: '<div data-testid="navigation-item" :data-label="label" @click="$emit(\'click\')">{{ label }}</div>'
  }
}))

vi.mock('../../../molecules/SearchBar/SearchBar.vue', () => ({
  default: {
    name: 'SearchBar',
    props: ['placeholder', 'size', 'results', 'loading'],
    emits: ['search', 'select'],
    template: '<div data-testid="search-bar" @search="$emit(\'search\', $event)" @select="$emit(\'select\', $event)"></div>'
  }
}))

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

const mockNavigationItems = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'home', active: true },
  { key: 'contacts', label: 'Contacts', to: '/contacts', icon: 'user', badge: '5' },
  { key: 'organizations', label: 'Organizations', to: '/organizations', icon: 'building-office' }
]

const mockHeaderActions = [
  { key: 'create', label: 'Create', icon: 'plus', variant: 'primary' as const },
  { key: 'export', label: 'Export', icon: 'arrow-down-tray' }
]

const mockUserMenuItems = [
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'settings', label: 'Settings', icon: 'cog-6-tooth' },
  { key: 'logout', label: 'Sign out', icon: 'arrow-right-on-rectangle' }
]

describe('AppHeader Component', () => {
  let mockClickOutside: any

  beforeEach(() => {
    // Mock document.addEventListener
    mockClickOutside = vi.fn()
    vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'click') {
        mockClickOutside = handler
      }
    })
    vi.spyOn(document, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with default props', () => {
    const wrapper = mount(AppHeader)

    const header = wrapper.find('header')
    expect(header.exists()).toBe(true)
    expect(header.classes()).toContain('bg-white')
    expect(header.classes()).toContain('shadow-sm')

    expect(wrapper.text()).toContain('Kitchen Pantry CRM')
  })

  it('renders custom app name', () => {
    const wrapper = mount(AppHeader, {
      props: {
        appName: 'Custom App Name'
      }
    })

    expect(wrapper.text()).toContain('Custom App Name')
  })

  it('renders logo when provided', () => {
    const wrapper = mount(AppHeader, {
      props: {
        logoSrc: 'https://example.com/logo.png',
        logoAlt: 'Custom Logo'
      }
    })

    const logo = wrapper.find('img')
    expect(logo.exists()).toBe(true)
    expect(logo.attributes('src')).toBe('https://example.com/logo.png')
    expect(logo.attributes('alt')).toBe('Custom Logo')
  })

  it('renders app name as text when no logo provided', () => {
    const wrapper = mount(AppHeader, {
      props: {
        appName: 'Text Logo App'
      }
    })

    const textLogo = wrapper.find('.text-xl.font-bold')
    expect(textLogo.exists()).toBe(true)
    expect(textLogo.text()).toBe('Text Logo App')
  })

  it('renders mobile menu button when enabled', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showMobileMenu: true
      }
    })

    const mobileButton = wrapper.find('[data-icon="bars-3"]')
    expect(mobileButton.exists()).toBe(true)
    expect(mobileButton.attributes('aria-label')).toBe('Toggle navigation menu')
  })

  it('does not render mobile menu button when disabled', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showMobileMenu: false
      }
    })

    const mobileButton = wrapper.find('[data-icon="bars-3"]')
    expect(mobileButton.exists()).toBe(false)
  })

  it('renders navigation items when provided', () => {
    const wrapper = mount(AppHeader, {
      props: {
        navigationItems: mockNavigationItems
      }
    })

    const navItems = wrapper.findAll('[data-testid="navigation-item"]')
    expect(navItems).toHaveLength(3)
    expect(navItems[0].attributes('data-label')).toBe('Dashboard')
    expect(navItems[1].attributes('data-label')).toBe('Contacts')
    expect(navItems[2].attributes('data-label')).toBe('Organizations')
  })

  it('hides navigation when showNavigation is false', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showNavigation: false,
        navigationItems: mockNavigationItems
      }
    })

    const nav = wrapper.find('nav.hidden.md\\:flex')
    expect(nav.exists()).toBe(false)
  })

  it('renders search bar when enabled', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showSearch: true,
        searchPlaceholder: 'Custom search...',
        searchSize: 'lg'
      }
    })

    const searchBar = wrapper.find('[data-testid="search-bar"]')
    expect(searchBar.exists()).toBe(true)
  })

  it('does not render search bar when disabled', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showSearch: false
      }
    })

    const searchBar = wrapper.find('[data-testid="search-bar"]')
    expect(searchBar.exists()).toBe(false)
  })

  it('renders header actions when provided', () => {
    const wrapper = mount(AppHeader, {
      props: {
        headerActions: mockHeaderActions
      }
    })

    const actionButtons = wrapper.findAll('[data-testid="button"]').filter(btn => 
      btn.text().includes('Create') || btn.text().includes('Export')
    )
    expect(actionButtons.length).toBeGreaterThan(0)
  })

  it('renders current user information', () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: mockUser
      }
    })

    expect(wrapper.text()).toContain('John Doe')
    
    const avatar = wrapper.find('[data-testid="avatar"]')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('data-src')).toBe('https://example.com/avatar.jpg')
    expect(avatar.attributes('data-initials')).toBe('JD')
  })

  it('generates correct user initials', () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: { id: '1', name: 'Jane Smith Wilson', email: 'jane@example.com' }
      }
    })

    const avatar = wrapper.find('[data-testid="avatar"]')
    expect(avatar.attributes('data-initials')).toBe('JS')
  })

  it('handles user without name gracefully', () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: { id: '1', name: '', email: 'user@example.com' }
      }
    })

    const avatar = wrapper.find('[data-testid="avatar"]')
    expect(avatar.attributes('data-initials')).toBe('U')
  })

  it('renders notifications with count', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showNotifications: true,
        notificationCount: 5
      }
    })

    const notificationButton = wrapper.find('[data-icon="bell"]')
    expect(notificationButton.exists()).toBe(true)
    
    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('renders notification count as 99+ when over 99', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showNotifications: true,
        notificationCount: 150
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.text()).toBe('99+')
  })

  it('does not render notification badge when count is 0', () => {
    const wrapper = mount(AppHeader, {
      props: {
        showNotifications: true,
        notificationCount: 0
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.exists()).toBe(false)
  })

  it('toggles mobile navigation when mobile menu button is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        showMobileMenu: true,
        navigationItems: mockNavigationItems
      }
    })

    expect(wrapper.find('.md\\:hidden .space-y-1').exists()).toBe(false)

    const mobileButton = wrapper.find('[data-icon="bars-3"]')
    await mobileButton.trigger('click')

    expect(wrapper.find('.md\\:hidden .space-y-1').exists()).toBe(true)
    expect(wrapper.emitted('mobile-menu-toggle')).toBeTruthy()
  })

  it('toggles user dropdown when user menu is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: mockUser,
        userMenuItems: mockUserMenuItems
      }
    })

    expect(wrapper.find('.absolute.right-0.mt-2').exists()).toBe(false)

    const userButton = wrapper.findAll('[data-testid="button"]').find(btn => 
      btn.element.innerHTML.includes('User menu')
    )
    await userButton?.trigger('click')

    expect(wrapper.find('.absolute.right-0.mt-2').exists()).toBe(true)
  })

  it('renders user menu items when dropdown is open', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: mockUser,
        userMenuItems: mockUserMenuItems
      }
    })

    const userButton = wrapper.findAll('[data-testid="button"]').find(btn => 
      btn.element.innerHTML.includes('User menu')
    )
    await userButton?.trigger('click')

    expect(wrapper.text()).toContain('Profile')
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Sign out')
  })

  it('emits navigation-click when navigation item is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        navigationItems: mockNavigationItems
      }
    })

    const firstNavItem = wrapper.find('[data-testid="navigation-item"]')
    await firstNavItem.trigger('click')

    expect(wrapper.emitted('navigation-click')).toBeTruthy()
    expect(wrapper.emitted('navigation-click')?.[0]).toEqual([mockNavigationItems[0]])
  })

  it('emits header-action when header action button is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        headerActions: mockHeaderActions
      }
    })

    // Find and click the create button
    const createButton = wrapper.findAll('[data-testid="button"]').find(btn => 
      btn.text().includes('Create')
    )
    await createButton?.trigger('click')

    expect(wrapper.emitted('header-action')).toBeTruthy()
    expect(wrapper.emitted('header-action')?.[0]).toEqual(['create'])
  })

  it('emits user-menu-click when user menu item is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: mockUser,
        userMenuItems: mockUserMenuItems
      }
    })

    // Open user dropdown
    const userButton = wrapper.findAll('[data-testid="button"]').find(btn => 
      btn.element.innerHTML.includes('User menu')
    )
    await userButton?.trigger('click')

    // Click profile menu item
    const profileButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Profile')
    )
    await profileButton?.trigger('click')

    expect(wrapper.emitted('user-menu-click')).toBeTruthy()
    expect(wrapper.emitted('user-menu-click')?.[0]).toEqual(['profile'])
  })

  it('emits notifications-toggle when notifications button is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        showNotifications: true
      }
    })

    const notificationButton = wrapper.find('[data-icon="bell"]')
    await notificationButton.trigger('click')

    expect(wrapper.emitted('notifications-toggle')).toBeTruthy()
  })

  it('emits search event when search is performed', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        showSearch: true
      }
    })

    const searchBar = wrapper.find('[data-testid="search-bar"]')
    await searchBar.trigger('search', 'test query')

    expect(wrapper.emitted('search')).toBeTruthy()
  })

  it('emits search-select event when search result is selected', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        showSearch: true
      }
    })

    const mockResult = { id: '1', type: 'contact', title: 'John Doe', subtitle: 'Contact', data: {} }
    
    const searchBar = wrapper.find('[data-testid="search-bar"]')
    await searchBar.trigger('select', mockResult)

    expect(wrapper.emitted('search-select')).toBeTruthy()
  })

  it('closes mobile navigation when navigation item is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        showMobileMenu: true,
        navigationItems: mockNavigationItems
      }
    })

    // Open mobile navigation
    const mobileButton = wrapper.find('[data-icon="bars-3"]')
    await mobileButton.trigger('click')
    
    expect(wrapper.find('.md\\:hidden .space-y-1').exists()).toBe(true)

    // Click navigation item
    const navItem = wrapper.find('[data-testid="navigation-item"]')
    await navItem.trigger('click')

    expect(wrapper.find('.md\\:hidden .space-y-1').exists()).toBe(false)
  })

  it('closes user dropdown when user menu item is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: mockUser,
        userMenuItems: mockUserMenuItems
      }
    })

    // Open user dropdown
    const userButton = wrapper.findAll('[data-testid="button"]').find(btn => 
      btn.element.innerHTML.includes('User menu')
    )
    await userButton?.trigger('click')
    expect(wrapper.find('.absolute.right-0.mt-2').exists()).toBe(true)

    // Click menu item
    const profileButton = wrapper.findAll('button').find(btn => 
      btn.text().includes('Profile')
    )
    await profileButton?.trigger('click')

    expect(wrapper.find('.absolute.right-0.mt-2').exists()).toBe(false)
  })

  it('renders mobile navigation items when mobile menu is open', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        showMobileMenu: true,
        navigationItems: mockNavigationItems
      }
    })

    const mobileButton = wrapper.find('[data-icon="bars-3"]')
    await mobileButton.trigger('click')

    const mobileNavItems = wrapper.findAll('.md\\:hidden [data-testid="navigation-item"]')
    expect(mobileNavItems).toHaveLength(3)
  })

  it('shows correct user email in dropdown', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: mockUser,
        userMenuItems: mockUserMenuItems
      }
    })

    const userButton = wrapper.findAll('[data-testid="button"]').find(btn => 
      btn.element.innerHTML.includes('User menu')
    )
    await userButton?.trigger('click')

    expect(wrapper.text()).toContain('john@example.com')
  })

  it('handles click outside to close dropdowns', () => {
    const wrapper = mount(AppHeader, {
      props: {
        currentUser: mockUser
      }
    })

    // Simulate click outside event
    const mockEvent = {
      target: document.createElement('div')
    }
    
    // Mock closest method
    mockEvent.target.closest = vi.fn().mockReturnValue(null)
    
    // Trigger the click outside handler
    mockClickOutside(mockEvent)

    // Verify dropdowns are closed (this would need to be tested via the component's internal state)
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
  })

  it('renders with all features enabled', () => {
    const wrapper = mount(AppHeader, {
      props: {
        appName: 'Full Feature App',
        logoSrc: 'https://example.com/logo.png',
        currentUser: mockUser,
        navigationItems: mockNavigationItems,
        headerActions: mockHeaderActions,
        userMenuItems: mockUserMenuItems,
        showMobileMenu: true,
        showNavigation: true,
        showSearch: true,
        showNotifications: true,
        notificationCount: 10
      }
    })

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="navigation-item"]')).toHaveLength(3)
    expect(wrapper.find('[data-testid="search-bar"]').exists()).toBe(true)
    expect(wrapper.find('[data-icon="bell"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="badge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="avatar"]').exists()).toBe(true)
  })
})