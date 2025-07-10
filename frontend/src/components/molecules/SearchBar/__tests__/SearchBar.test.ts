import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '../SearchBar.vue'

// Mock components
vi.mock('../../../atoms/Input/Input.vue', () => ({
  default: {
    name: 'Input',
    props: ['modelValue', 'type', 'placeholder', 'icon', 'size'],
    emits: ['update:modelValue', 'input', 'focus', 'blur', 'keydown'],
    template: `<input 
      data-testid="search-input" 
      :value="modelValue" 
      :type="type"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value); $emit('input')"
      @focus="$emit('focus')"
      @blur="$emit('blur', $event)"
      @keydown="$emit('keydown', $event)"
    />`
  }
}))

vi.mock('../../../atoms/Button/Button.vue', () => ({
  default: {
    name: 'Button',
    props: ['variant', 'size', 'icon'],
    emits: ['click'],
    template: '<button data-testid="clear-button" @click="$emit(\'click\')"><slot /></button>'
  }
}))

vi.mock('../../../atoms/Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name'],
    template: '<span data-testid="icon" :data-name="name"></span>'
  }
}))

vi.mock('../../../atoms/LoadingSpinner/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    props: ['size'],
    template: '<div data-testid="loading-spinner"></div>'
  }
}))

const mockSearchResults = [
  {
    id: '1',
    type: 'organization' as const,
    title: 'Acme Corp',
    subtitle: 'Technology Company',
    data: { id: '1' }
  },
  {
    id: '2',
    type: 'contact' as const,
    title: 'John Doe',
    subtitle: 'CEO at Acme Corp',
    data: { id: '2' }
  },
  {
    id: '3',
    type: 'opportunity' as const,
    title: 'Q4 Software License',
    subtitle: '$50,000 - Proposal',
    data: { id: '3' }
  }
]

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with default props', () => {
    const wrapper = mount(SearchBar)

    const input = wrapper.find('[data-testid="search-input"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Search organizations, contacts, opportunities...')
  })

  it('renders with custom placeholder', () => {
    const wrapper = mount(SearchBar, {
      props: {
        placeholder: 'Custom search placeholder'
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    expect(input.attributes('placeholder')).toBe('Custom search placeholder')
  })

  it('shows clear button when search query is not empty', async () => {
    const wrapper = mount(SearchBar)

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('test query')

    const clearButton = wrapper.find('[data-testid="clear-button"]')
    expect(clearButton.exists()).toBe(true)
  })

  it('does not show clear button when search query is empty', () => {
    const wrapper = mount(SearchBar)

    const clearButton = wrapper.find('[data-testid="clear-button"]')
    expect(clearButton.exists()).toBe(false)
  })

  it('clears search when clear button is clicked', async () => {
    const wrapper = mount(SearchBar)

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('test query')

    const clearButton = wrapper.find('[data-testid="clear-button"]')
    await clearButton.trigger('click')

    expect(input.element.value).toBe('')
  })

  it('shows results dropdown when focused', async () => {
    const wrapper = mount(SearchBar)

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    const dropdown = wrapper.find('.absolute.z-50')
    expect(dropdown.exists()).toBe(true)
  })

  it('hides results dropdown when blurred', async () => {
    const wrapper = mount(SearchBar)

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')
    await input.trigger('blur')

    // Wait for the timeout
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()

    const dropdown = wrapper.find('.absolute.z-50')
    expect(dropdown.exists()).toBe(false)
  })

  it('emits search event when typing', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        minSearchLength: 2
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('test')
    await input.trigger('input')

    // Advance timers to trigger debounced search
    vi.advanceTimersByTime(300)

    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')?.[0]).toEqual(['test', ['organizations', 'contacts', 'opportunities']])
  })

  it('does not emit search event when query is too short', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        minSearchLength: 3
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('te')
    await input.trigger('input')

    vi.advanceTimersByTime(300)

    expect(wrapper.emitted('search')).toBeFalsy()
  })

  it('renders search results when provided', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    expect(wrapper.text()).toContain('Acme Corp')
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Q4 Software License')
  })

  it('renders correct icons for different result types', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    const icons = wrapper.findAll('[data-testid="icon"]')
    const iconNames = icons.map(icon => icon.attributes('data-name'))
    
    expect(iconNames).toContain('building-office') // organization
    expect(iconNames).toContain('user') // contact
    expect(iconNames).toContain('currency-dollar') // opportunity
  })

  it('selects result when clicked', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    const firstResult = wrapper.find('.cursor-pointer')
    await firstResult.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([mockSearchResults[0]])
  })

  it('navigates results with arrow keys', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    // Press arrow down
    await input.trigger('keydown', { key: 'ArrowDown' })
    
    const results = wrapper.findAll('.cursor-pointer')
    expect(results[0].classes()).toContain('bg-blue-600')

    // Press arrow down again
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(results[1].classes()).toContain('bg-blue-600')

    // Press arrow up
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(results[0].classes()).toContain('bg-blue-600')
  })

  it('selects highlighted result with Enter key', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([mockSearchResults[0]])
  })

  it('hides results with Escape key', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    let dropdown = wrapper.find('.absolute.z-50')
    expect(dropdown.exists()).toBe(true)

    await input.trigger('keydown', { key: 'Escape' })

    dropdown = wrapper.find('.absolute.z-50')
    expect(dropdown.exists()).toBe(false)
  })

  it('shows loading state when loading prop is true', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        loading: true
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    const loadingSpinner = wrapper.find('[data-testid="loading-spinner"]')
    expect(loadingSpinner.exists()).toBe(true)
    expect(wrapper.text()).toContain('Searching...')
  })

  it('shows no results message when search returns empty', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: []
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('nonexistent')
    await input.trigger('focus')

    expect(wrapper.text()).toContain('No results found for "nonexistent"')
  })

  it('debounces search input', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        minSearchLength: 1
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    
    // Type multiple characters quickly
    await input.setValue('t')
    await input.trigger('input')
    await input.setValue('te')
    await input.trigger('input')
    await input.setValue('test')
    await input.trigger('input')

    // Should not emit search yet
    expect(wrapper.emitted('search')).toBeFalsy()

    // Advance timers to trigger debounced search
    vi.advanceTimersByTime(300)

    // Should emit search only once with final value
    expect(wrapper.emitted('search')).toHaveLength(1)
    expect(wrapper.emitted('search')?.[0]).toEqual(['test', ['organizations', 'contacts', 'opportunities']])
  })

  it('handles custom search types', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        searchTypes: ['contacts', 'opportunities'],
        minSearchLength: 1
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('test')
    await input.trigger('input')

    vi.advanceTimersByTime(300)

    expect(wrapper.emitted('search')?.[0]).toEqual(['test', ['contacts', 'opportunities']])
  })

  it('handles custom min search length', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        minSearchLength: 5
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.setValue('test')
    await input.trigger('input')

    vi.advanceTimersByTime(300)

    expect(wrapper.emitted('search')).toBeFalsy()

    await input.setValue('testing')
    await input.trigger('input')

    vi.advanceTimersByTime(300)

    expect(wrapper.emitted('search')).toBeTruthy()
  })

  it('renders result subtitles correctly', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    expect(wrapper.text()).toContain('Technology Company')
    expect(wrapper.text()).toContain('CEO at Acme Corp')
    expect(wrapper.text()).toContain('$50,000 - Proposal')
  })

  it('maintains result selection state correctly', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    // No selection initially
    const results = wrapper.findAll('.cursor-pointer')
    expect(results[0].classes()).not.toContain('bg-blue-600')

    // Select first item
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(results[0].classes()).toContain('bg-blue-600')
    expect(results[1].classes()).not.toContain('bg-blue-600')

    // Select second item
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(results[0].classes()).not.toContain('bg-blue-600')
    expect(results[1].classes()).toContain('bg-blue-600')
  })

  it('prevents navigation beyond result bounds', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        results: mockSearchResults.slice(0, 1) // Only one result
      }
    })

    const input = wrapper.find('[data-testid="search-input"]')
    await input.trigger('focus')

    // Try to go down past the last item
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })

    const results = wrapper.findAll('.cursor-pointer')
    expect(results[0].classes()).toContain('bg-blue-600')

    // Try to go up past the first item
    await input.trigger('keydown', { key: 'ArrowUp' })
    await input.trigger('keydown', { key: 'ArrowUp' })

    expect(results[0].classes()).not.toContain('bg-blue-600')
  })
})