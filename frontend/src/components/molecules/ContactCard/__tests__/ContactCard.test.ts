import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactCard from '../ContactCard.vue'

// Mock the atomic components
vi.mock('@/components/atoms', () => ({
  Avatar: {
    name: 'Avatar',
    props: ['src', 'initials', 'size', 'status'],
    template: '<div data-testid="avatar" :data-src="src" :data-initials="initials" :data-size="size" :data-status="status"></div>'
  },
  Badge: {
    name: 'Badge',
    props: ['variant', 'size'],
    template: '<span data-testid="badge" :data-variant="variant" :data-size="size"><slot /></span>'
  },
  Button: {
    name: 'Button',
    props: ['variant', 'size', 'icon'],
    template: '<button data-testid="button" :data-variant="variant" :data-size="size" :data-icon="icon" @click="$emit(\'click\')"><slot /></button>'
  },
  Icon: {
    name: 'Icon',
    props: ['name', 'size', 'class'],
    template: '<span data-testid="icon" :data-name="name" :data-size="size" :class="$props.class"></span>'
  }
}))

const mockContact = {
  id: '1',
  name: 'John Doe',
  title: 'Sales Manager',
  organization: 'Acme Corporation',
  email: 'john.doe@acme.com',
  phone: '+1-555-0123',
  avatar: 'https://example.com/avatar.jpg',
  priority: 'A' as const,
  status: 'online' as const,
  lastInteraction: new Date('2023-12-01T10:00:00Z')
}

const minimalContact = {
  id: '2',
  name: 'Jane Smith'
}

describe('ContactCard Component', () => {
  it('renders with basic contact information', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Sales Manager')
    expect(wrapper.text()).toContain('Acme Corporation')
  })

  it('renders with minimal contact information', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: minimalContact }
    })

    expect(wrapper.text()).toContain('Jane Smith')
    expect(wrapper.find('[data-testid="avatar"]').exists()).toBe(true)
  })

  it('displays avatar with correct props', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const avatar = wrapper.find('[data-testid="avatar"]')
    expect(avatar.attributes('data-src')).toBe('https://example.com/avatar.jpg')
    expect(avatar.attributes('data-initials')).toBe('JD')
    expect(avatar.attributes('data-size')).toBe('md')
    expect(avatar.attributes('data-status')).toBe('online')
  })

  it('generates correct initials from name', () => {
    const contacts = [
      { id: '1', name: 'John Doe', expectedInitials: 'JD' },
      { id: '2', name: 'Jane', expectedInitials: 'J' },
      { id: '3', name: 'Mary Jane Watson', expectedInitials: 'MJ' },
      { id: '4', name: 'jean-claude van damme', expectedInitials: 'JV' }
    ]

    contacts.forEach(({ id, name, expectedInitials }) => {
      const wrapper = mount(ContactCard, {
        props: { contact: { id, name } }
      })

      const avatar = wrapper.find('[data-testid="avatar"]')
      expect(avatar.attributes('data-initials')).toBe(expectedInitials)
    })
  })

  it('displays priority badge when priority is set', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('A')
    expect(badge.attributes('data-variant')).toBe('danger')
    expect(badge.attributes('data-size')).toBe('sm')
  })

  it('does not display priority badge when priority is not set', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: minimalContact }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.exists()).toBe(false)
  })

  it('displays correct priority badge variants', () => {
    const priorities = [
      { priority: 'A', expectedVariant: 'danger' },
      { priority: 'B', expectedVariant: 'warning' },
      { priority: 'C', expectedVariant: 'secondary' }
    ] as const

    priorities.forEach(({ priority, expectedVariant }) => {
      const wrapper = mount(ContactCard, {
        props: { 
          contact: { ...mockContact, priority }
        }
      })

      const badge = wrapper.find('[data-testid="badge"]')
      expect(badge.attributes('data-variant')).toBe(expectedVariant)
    })
  })

  it('displays email button when email is provided', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const emailIcon = wrapper.find('[data-testid="icon"][data-name="envelope"]')
    expect(emailIcon.exists()).toBe(true)
    expect(emailIcon.attributes('data-size')).toBe('16')
  })

  it('does not display email button when email is not provided', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: minimalContact }
    })

    const emailIcon = wrapper.find('[data-testid="icon"][data-name="envelope"]')
    expect(emailIcon.exists()).toBe(false)
  })

  it('displays phone button when phone is provided', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const phoneIcon = wrapper.find('[data-testid="icon"][data-name="phone"]')
    expect(phoneIcon.exists()).toBe(true)
    expect(phoneIcon.attributes('data-size')).toBe('16')
  })

  it('does not display phone button when phone is not provided', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: minimalContact }
    })

    const phoneIcon = wrapper.find('[data-testid="icon"][data-name="phone"]')
    expect(phoneIcon.exists()).toBe(false)
  })

  it('displays last interaction when provided', () => {
    // Mock Date.now() to return a fixed date for consistent testing
    const mockDate = new Date('2023-12-05T10:00:00Z')
    vi.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const clockIcon = wrapper.find('[data-testid="icon"][data-name="clock"]')
    expect(clockIcon.exists()).toBe(true)
    expect(wrapper.text()).toContain('4 days ago')

    vi.restoreAllMocks()
  })

  it('displays actions button by default', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const actionsButton = wrapper.find('[data-testid="button"]')
    expect(actionsButton.exists()).toBe(true)
    expect(actionsButton.attributes('data-icon')).toBe('ellipsis-horizontal')
    expect(actionsButton.attributes('data-variant')).toBe('ghost')
    expect(actionsButton.attributes('data-size')).toBe('sm')
  })

  it('hides actions button when hideActions is true', () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact,
        hideActions: true
      }
    })

    const actionsButton = wrapper.find('[data-testid="button"]')
    expect(actionsButton.exists()).toBe(false)
  })

  it('applies correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedPadding: 'p-3', expectedNameSize: 'text-sm' },
      { size: 'md', expectedPadding: 'p-4', expectedNameSize: 'text-base' },
      { size: 'lg', expectedPadding: 'p-5', expectedNameSize: 'text-lg' }
    ] as const

    sizes.forEach(({ size, expectedPadding, expectedNameSize }) => {
      const wrapper = mount(ContactCard, {
        props: { contact: mockContact, size }
      })

      const card = wrapper.find('div')
      expect(card.classes()).toContain(expectedPadding)

      const name = wrapper.find('h3')
      expect(name.classes()).toContain(expectedNameSize)

      const avatar = wrapper.find('[data-testid="avatar"]')
      expect(avatar.attributes('data-size')).toBe(size)
    })
  })

  it('applies clickable styles when clickable', () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact,
        clickable: true
      }
    })

    const card = wrapper.find('div')
    expect(card.classes()).toContain('hover:shadow-md')
    expect(card.classes()).toContain('hover:border-gray-300')
    expect(card.classes()).toContain('cursor-pointer')
  })

  it('does not apply clickable styles when not clickable', () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact,
        clickable: false
      }
    })

    const card = wrapper.find('div')
    expect(card.classes()).not.toContain('hover:shadow-md')
    expect(card.classes()).not.toContain('hover:border-gray-300')
    expect(card.classes()).not.toContain('cursor-pointer')
  })

  it('applies selected styles when selected', () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact,
        selected: true
      }
    })

    const card = wrapper.find('div')
    expect(card.classes()).toContain('ring-2')
    expect(card.classes()).toContain('ring-blue-500')
    expect(card.classes()).toContain('border-blue-500')
  })

  it('emits click event when card is clicked', async () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact,
        clickable: true
      }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([mockContact])
  })

  it('does not emit click event when not clickable', async () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact,
        clickable: false
      }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('emits email event when email button is clicked', async () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const emailButton = wrapper.find('button[aria-label="Email John Doe"]')
    await emailButton.trigger('click')

    expect(wrapper.emitted('email')).toBeTruthy()
    expect(wrapper.emitted('email')![0]).toEqual([mockContact])
  })

  it('emits phone event when phone button is clicked', async () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const phoneButton = wrapper.find('button[aria-label="Call John Doe"]')
    await phoneButton.trigger('click')

    expect(wrapper.emitted('phone')).toBeTruthy()
    expect(wrapper.emitted('phone')![0]).toEqual([mockContact])
  })

  it('emits actions event when actions button is clicked', async () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const actionsButton = wrapper.find('[data-testid="button"]')
    await actionsButton.trigger('click')

    expect(wrapper.emitted('actions')).toBeTruthy()
    expect(wrapper.emitted('actions')![0]).toEqual([mockContact])
  })

  it('prevents click propagation for action buttons', async () => {
    const wrapper = mount(ContactCard, {
      props: { 
        contact: mockContact,
        clickable: true
      }
    })

    // Click email button
    const emailButton = wrapper.find('button[aria-label="Email John Doe"]')
    await emailButton.trigger('click')

    // Should not emit card click event
    expect(wrapper.emitted('click')).toBeFalsy()
    expect(wrapper.emitted('email')).toBeTruthy()
  })

  it('formats last interaction correctly', () => {
    const testCases = [
      {
        name: 'same day',
        lastInteraction: new Date(),
        expected: 'Today'
      },
      {
        name: 'yesterday',
        lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expected: 'Yesterday'
      },
      {
        name: 'few days ago',
        lastInteraction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expected: '3 days ago'
      },
      {
        name: 'over a week ago',
        lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expected: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    ]

    testCases.forEach(({ name, lastInteraction, expected }) => {
      const wrapper = mount(ContactCard, {
        props: { 
          contact: { ...mockContact, lastInteraction }
        }
      })

      expect(wrapper.text()).toContain(expected)
    })
  })

  it('handles contact without optional fields gracefully', () => {
    const minimalContactCard = mount(ContactCard, {
      props: { contact: minimalContact }
    })

    expect(minimalContactCard.text()).toContain('Jane Smith')
    expect(minimalContactCard.find('[data-testid="badge"]').exists()).toBe(false)
    expect(minimalContactCard.find('[data-testid="icon"][data-name="envelope"]').exists()).toBe(false)
    expect(minimalContactCard.find('[data-testid="icon"][data-name="phone"]').exists()).toBe(false)
    expect(minimalContactCard.find('[data-testid="icon"][data-name="clock"]').exists()).toBe(false)
  })

  it('applies correct accessibility attributes', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const emailButton = wrapper.find('button[aria-label="Email John Doe"]')
    expect(emailButton.exists()).toBe(true)

    const phoneButton = wrapper.find('button[aria-label="Call John Doe"]')
    expect(phoneButton.exists()).toBe(true)

    const actionsButton = wrapper.find('button[aria-label="More actions for John Doe"]')
    expect(actionsButton.exists()).toBe(true)
  })

  it('truncates long text content correctly', () => {
    const longContact = {
      id: '1',
      name: 'This is a very long name that should be truncated',
      title: 'This is a very long title that should be truncated',
      organization: 'This is a very long organization name that should be truncated'
    }

    const wrapper = mount(ContactCard, {
      props: { contact: longContact }
    })

    const name = wrapper.find('h3')
    expect(name.classes()).toContain('truncate')

    const title = wrapper.findAll('p')[0]
    expect(title.classes()).toContain('truncate')

    const organization = wrapper.findAll('p')[1]
    expect(organization.classes()).toContain('truncate')
  })

  it('handles different avatar sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const

    sizes.forEach(size => {
      const wrapper = mount(ContactCard, {
        props: { 
          contact: mockContact,
          size
        }
      })

      const avatar = wrapper.find('[data-testid="avatar"]')
      expect(avatar.attributes('data-size')).toBe(size)
    })
  })

  it('applies base card styling correctly', () => {
    const wrapper = mount(ContactCard, {
      props: { contact: mockContact }
    })

    const card = wrapper.find('div')
    expect(card.classes()).toContain('bg-white')
    expect(card.classes()).toContain('rounded-lg')
    expect(card.classes()).toContain('border')
    expect(card.classes()).toContain('border-gray-200')
    expect(card.classes()).toContain('transition-all')
    expect(card.classes()).toContain('duration-200')
  })

  it('handles complex contact object correctly', () => {
    const complexContact = {
      id: 'complex-1',
      name: 'Dr. Sarah Johnson-Williams',
      title: 'Chief Technology Officer & Senior Partner',
      organization: 'Global Tech Solutions International LLC',
      email: 'sarah.johnson-williams@globaltech.com',
      phone: '+1-555-987-6543',
      avatar: 'https://cdn.example.com/avatars/sarah.jpg',
      priority: 'B' as const,
      status: 'away' as const,
      lastInteraction: new Date('2023-11-15T14:30:00Z')
    }

    const wrapper = mount(ContactCard, {
      props: { 
        contact: complexContact,
        size: 'lg',
        selected: true,
        clickable: true
      }
    })

    expect(wrapper.text()).toContain('Dr. Sarah Johnson-Williams')
    expect(wrapper.text()).toContain('Chief Technology Officer & Senior Partner')
    expect(wrapper.text()).toContain('Global Tech Solutions International LLC')
    expect(wrapper.text()).toContain('B')

    const avatar = wrapper.find('[data-testid="avatar"]')
    expect(avatar.attributes('data-initials')).toBe('DS')
    expect(avatar.attributes('data-status')).toBe('away')

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.attributes('data-variant')).toBe('warning')
  })
})