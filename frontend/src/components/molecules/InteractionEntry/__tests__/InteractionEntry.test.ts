import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InteractionEntry from '../InteractionEntry.vue'

// Mock components
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

const mockInteraction = {
  id: '1',
  type: 'call' as const,
  title: 'Follow-up call with John Doe',
  description: 'Discussed project requirements and timeline',
  participants: ['John Doe', 'Jane Smith'],
  date: new Date('2023-12-01T10:00:00Z'),
  outcome: 'Project approved, moving to next phase',
  nextSteps: [
    {
      id: 'step1',
      description: 'Send project proposal',
      dueDate: new Date('2023-12-05T10:00:00Z')
    },
    {
      id: 'step2',
      description: 'Schedule kick-off meeting'
    }
  ],
  attachments: [
    {
      id: 'attach1',
      name: 'proposal.pdf',
      type: 'application/pdf',
      url: '/files/proposal.pdf'
    }
  ]
}

describe('InteractionEntry Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    expect(wrapper.find('.relative').exists()).toBe(true)
    expect(wrapper.text()).toContain('Follow-up call with John Doe')
  })

  it('renders interaction title correctly', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    const title = wrapper.find('p.font-medium.text-gray-900')
    expect(title.text()).toBe('Follow-up call with John Doe')
  })

  it('renders interaction type badge', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('call')
    expect(badge.attributes('data-variant')).toBe('success')
    expect(badge.attributes('data-size')).toBe('sm')
  })

  it('renders type icon with correct mapping', () => {
    const typeIconMappings = [
      { type: 'call', expectedIcon: 'phone' },
      { type: 'email', expectedIcon: 'envelope' },
      { type: 'meeting', expectedIcon: 'calendar' },
      { type: 'note', expectedIcon: 'document' },
      { type: 'task', expectedIcon: 'check-circle' }
    ] as const

    typeIconMappings.forEach(({ type, expectedIcon }) => {
      const interaction = { ...mockInteraction, type }
      const wrapper = mount(InteractionEntry, {
        props: { interaction }
      })

      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.attributes('data-name')).toBe(expectedIcon)
    })
  })

  it('renders indicator with correct background color for type', () => {
    const typeColorMappings = [
      { type: 'call', expectedClass: 'bg-green-500' },
      { type: 'email', expectedClass: 'bg-blue-500' },
      { type: 'meeting', expectedClass: 'bg-purple-500' },
      { type: 'note', expectedClass: 'bg-gray-500' },
      { type: 'task', expectedClass: 'bg-yellow-500' }
    ] as const

    typeColorMappings.forEach(({ type, expectedClass }) => {
      const interaction = { ...mockInteraction, type }
      const wrapper = mount(InteractionEntry, {
        props: { interaction }
      })

      const indicator = wrapper.find('.flex.h-8.w-8')
      expect(indicator.classes()).toContain(expectedClass)
    })
  })

  it('renders participants when provided', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    expect(wrapper.text()).toContain('John Doe and Jane Smith')
  })

  it('formats participants correctly for different counts', () => {
    const testCases = [
      {
        participants: ['John Doe'],
        expected: 'John Doe'
      },
      {
        participants: ['John Doe', 'Jane Smith'],
        expected: 'John Doe and Jane Smith'
      },
      {
        participants: ['John Doe', 'Jane Smith', 'Bob Wilson'],
        expected: 'John Doe and 2 others'
      }
    ]

    testCases.forEach(({ participants, expected }) => {
      const interaction = { ...mockInteraction, participants }
      const wrapper = mount(InteractionEntry, {
        props: { interaction }
      })

      expect(wrapper.text()).toContain(expected)
    })
  })

  it('renders description when provided', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    expect(wrapper.text()).toContain('Discussed project requirements and timeline')
  })

  it('does not render description when not provided', () => {
    const interaction = { ...mockInteraction, description: undefined }
    const wrapper = mount(InteractionEntry, {
      props: { interaction }
    })

    const description = wrapper.find('.mt-2 p')
    expect(description.exists()).toBe(false)
  })

  it('renders outcome when provided', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    expect(wrapper.text()).toContain('Project approved, moving to next phase')
    
    const checkIcon = wrapper.findAll('[data-testid="icon"]').find(icon => 
      icon.attributes('data-name') === 'check-circle'
    )
    expect(checkIcon?.exists()).toBe(true)
  })

  it('renders next steps when provided', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    expect(wrapper.text()).toContain('Next Steps:')
    expect(wrapper.text()).toContain('Send project proposal')
    expect(wrapper.text()).toContain('Schedule kick-off meeting')
    expect(wrapper.text()).toContain('(Due:')
  })

  it('renders attachments count when provided', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    expect(wrapper.text()).toContain('1 attachment')
  })

  it('renders plural attachments correctly', () => {
    const interaction = {
      ...mockInteraction,
      attachments: [
        { id: '1', name: 'file1.pdf', type: 'pdf', url: '/file1.pdf' },
        { id: '2', name: 'file2.pdf', type: 'pdf', url: '/file2.pdf' }
      ]
    }
    
    const wrapper = mount(InteractionEntry, {
      props: { interaction }
    })

    expect(wrapper.text()).toContain('2 attachments')
  })

  it('renders actions button when not hidden', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction,
        hideActions: false
      }
    })

    const button = wrapper.find('[data-testid="button"]')
    expect(button.exists()).toBe(true)
    expect(button.attributes('data-variant')).toBe('ghost')
    expect(button.attributes('data-size')).toBe('sm')
    expect(button.attributes('data-icon')).toBe('ellipsis-horizontal')
  })

  it('does not render actions button when hidden', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction,
        hideActions: true
      }
    })

    const button = wrapper.find('[data-testid="button"]')
    expect(button.exists()).toBe(false)
  })

  it('emits actions event when actions button is clicked', async () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    const button = wrapper.find('[data-testid="button"]')
    await button.trigger('click')

    expect(wrapper.emitted('actions')).toBeTruthy()
    expect(wrapper.emitted('actions')?.[0]).toEqual([mockInteraction])
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedPadding: 'pb-3', expectedText: 'text-sm' },
      { size: 'md', expectedPadding: 'pb-4', expectedText: 'text-base' },
      { size: 'lg', expectedPadding: 'pb-5', expectedText: 'text-lg' }
    ] as const

    sizes.forEach(({ size, expectedPadding, expectedText }) => {
      const wrapper = mount(InteractionEntry, {
        props: {
          interaction: mockInteraction,
          size
        }
      })

      const container = wrapper.find('.relative')
      expect(container.classes()).toContain(expectedPadding)

      const title = wrapper.find('p.font-medium.text-gray-900')
      expect(title.classes()).toContain(expectedText)
    })
  })

  it('renders date with correct formatting', () => {
    // Mock current date for consistent testing
    const mockDate = new Date('2023-12-01T12:00:00Z')
    vi.setSystemTime(mockDate)

    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    const time = wrapper.find('time')
    expect(time.exists()).toBe(true)
    expect(time.attributes('datetime')).toBe('2023-12-01T10:00:00.000Z')
    
    vi.useRealTimers()
  })

  it('has correct accessibility attributes', () => {
    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: mockInteraction
      }
    })

    const button = wrapper.find('[data-testid="button"]')
    expect(button.attributes('aria-label')).toContain('More actions for Follow-up call with John Doe')
  })

  it('renders minimal interaction correctly', () => {
    const minimalInteraction = {
      id: '2',
      type: 'note' as const,
      title: 'Quick note',
      participants: [],
      date: new Date('2023-12-01T10:00:00Z')
    }

    const wrapper = mount(InteractionEntry, {
      props: {
        interaction: minimalInteraction
      }
    })

    expect(wrapper.text()).toContain('Quick note')
    expect(wrapper.text()).toContain('note')
    expect(wrapper.text()).not.toContain('Next Steps:')
    expect(wrapper.text()).not.toContain('attachment')
  })

  it('does not render participants section when empty', () => {
    const interaction = { ...mockInteraction, participants: [] }
    const wrapper = mount(InteractionEntry, {
      props: { interaction }
    })

    const userGroupIcon = wrapper.findAll('[data-testid="icon"]').find(icon => 
      icon.attributes('data-name') === 'user-group'
    )
    expect(userGroupIcon?.exists()).toBe(false)
  })

  it('renders next step without due date correctly', () => {
    const interaction = {
      ...mockInteraction,
      nextSteps: [
        {
          id: 'step1',
          description: 'Follow up with client'
        }
      ]
    }

    const wrapper = mount(InteractionEntry, {
      props: { interaction }
    })

    expect(wrapper.text()).toContain('Follow up with client')
    expect(wrapper.text()).not.toContain('(Due:')
  })

  it('renders badge variants correctly for all interaction types', () => {
    const typeVariantMappings = [
      { type: 'call', expectedVariant: 'success' },
      { type: 'email', expectedVariant: 'primary' },
      { type: 'meeting', expectedVariant: 'info' },
      { type: 'note', expectedVariant: 'secondary' },
      { type: 'task', expectedVariant: 'warning' }
    ] as const

    typeVariantMappings.forEach(({ type, expectedVariant }) => {
      const interaction = { ...mockInteraction, type }
      const wrapper = mount(InteractionEntry, {
        props: { interaction }
      })

      const badge = wrapper.find('[data-testid="badge"]')
      expect(badge.attributes('data-variant')).toBe(expectedVariant)
    })
  })
})