import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Select from '../Select.vue'

// Mock the Icon component
vi.mock('../../Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name', 'class'],
    template: '<span data-testid="icon" :data-name="name" :class="$props.class"></span>'
  }
}))

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
  { value: 42, label: 'Numeric Option' }
]

describe('Select Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    expect(select.attributes('disabled')).toBeUndefined()
    expect(select.attributes('required')).toBeUndefined()
  })

  it('renders options correctly', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(4)
    
    expect(options[0].attributes('value')).toBe('option1')
    expect(options[0].text()).toBe('Option 1')
    expect(options[0].attributes('disabled')).toBeUndefined()
    
    expect(options[1].attributes('value')).toBe('option2')
    expect(options[1].text()).toBe('Option 2')
    
    expect(options[2].attributes('value')).toBe('option3')
    expect(options[2].text()).toBe('Option 3')
    expect(options[2].attributes('disabled')).toBeDefined()
    
    expect(options[3].attributes('value')).toBe('42')
    expect(options[3].text()).toBe('Numeric Option')
  })

  it('renders with placeholder option', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        placeholder: 'Select an option'
      }
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(5) // 4 regular + 1 placeholder
    
    const placeholderOption = options[0]
    expect(placeholderOption.attributes('value')).toBe('')
    expect(placeholderOption.text()).toBe('Select an option')
    expect(placeholderOption.attributes('disabled')).toBeDefined()
  })

  it('renders without placeholder when not provided', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(4) // Only regular options
    expect(options[0].text()).toBe('Option 1') // First option is not placeholder
  })

  it('renders with modelValue', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        modelValue: 'option2'
      }
    })

    const select = wrapper.find('select')
    expect(select.element.value).toBe('option2')
  })

  it('renders with numeric modelValue', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        modelValue: 42
      }
    })

    const select = wrapper.find('select')
    expect(select.element.value).toBe('42')
  })

  it('renders with disabled state', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        disabled: true
      }
    })

    const select = wrapper.find('select')
    expect(select.attributes('disabled')).toBeDefined()
    expect(select.classes()).toContain('disabled:bg-gray-50')
    expect(select.classes()).toContain('disabled:text-gray-500')
    expect(select.classes()).toContain('disabled:cursor-not-allowed')
  })

  it('renders with required state', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        required: true
      }
    })

    expect(wrapper.find('select').attributes('required')).toBeDefined()
  })

  it('renders with custom id', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        id: 'custom-select'
      }
    })

    expect(wrapper.find('select').attributes('id')).toBe('custom-select')
  })

  it('generates unique id when not provided', () => {
    const wrapper1 = mount(Select, { props: { options: mockOptions } })
    const wrapper2 = mount(Select, { props: { options: mockOptions } })

    const id1 = wrapper1.find('select').attributes('id')
    const id2 = wrapper2.find('select').attributes('id')

    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^select-[a-z0-9]+$/)
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['px-3', 'py-2', 'text-sm', 'min-h-[44px]'] },
      { size: 'md', expectedClasses: ['px-4', 'py-3', 'text-base', 'min-h-[48px]'] },
      { size: 'lg', expectedClasses: ['px-5', 'py-4', 'text-lg', 'min-h-[52px]'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(Select, {
        props: { options: mockOptions, size }
      })

      const select = wrapper.find('select')
      expectedClasses.forEach(className => {
        expect(select.classes()).toContain(className)
      })
    })
  })

  it('applies touch optimization classes by default', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions, size: 'md' }
    })

    expect(wrapper.find('select').classes()).toContain('min-h-[48px]')
  })

  it('does not apply touch optimization classes when touchOptimized is false', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        size: 'md', 
        touchOptimized: false 
      }
    })

    const select = wrapper.find('select')
    expect(select.classes()).not.toContain('min-h-[48px]')
    expect(select.classes()).toContain('px-4')
    expect(select.classes()).toContain('py-3')
    expect(select.classes()).toContain('text-base')
  })

  it('renders chevron-down icon', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const chevronIcon = wrapper.find('[data-testid="icon"][data-name="chevron-down"]')
    expect(chevronIcon.exists()).toBe(true)
    expect(chevronIcon.classes()).toContain('h-5')
    expect(chevronIcon.classes()).toContain('w-5')
    expect(chevronIcon.classes()).toContain('text-gray-400')
  })

  it('renders with error state', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        error: 'This field is required'
      }
    })

    const select = wrapper.find('select')
    expect(select.classes()).toContain('border-red-300')
    expect(select.classes()).toContain('text-red-900')
    expect(select.attributes('aria-invalid')).toBe('true')

    const errorIcon = wrapper.find('[data-testid="icon"][data-name="exclamation-circle"]')
    expect(errorIcon.exists()).toBe(true)
    expect(errorIcon.classes()).toContain('text-red-500')
  })

  it('renders without error state when no error', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const select = wrapper.find('select')
    expect(select.classes()).toContain('border-gray-300')
    expect(select.classes()).toContain('text-gray-900')
    expect(select.attributes('aria-invalid')).toBe('false')

    const errorIcon = wrapper.find('[data-testid="icon"][data-name="exclamation-circle"]')
    expect(errorIcon.exists()).toBe(false)
  })

  it('sets aria-describedby correctly', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        id: 'test-select',
        error: 'Test error'
      }
    })

    const select = wrapper.find('select')
    expect(select.attributes('aria-describedby')).toBe('test-select-error')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        modelValue: ''
      }
    })

    const select = wrapper.find('select')
    await select.setValue('option2')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['option2'])
  })

  it('emits change event', async () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const select = wrapper.find('select')
    await select.trigger('change')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0][0]).toBeInstanceOf(Event)
  })

  it('emits focus event', async () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const select = wrapper.find('select')
    await select.trigger('focus')

    expect(wrapper.emitted('focus')).toBeTruthy()
    expect(wrapper.emitted('focus')![0][0]).toBeInstanceOf(FocusEvent)
  })

  it('emits blur event', async () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const select = wrapper.find('select')
    await select.trigger('blur')

    expect(wrapper.emitted('blur')).toBeTruthy()
    expect(wrapper.emitted('blur')![0][0]).toBeInstanceOf(FocusEvent)
  })

  it('applies base classes correctly', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    const select = wrapper.find('select')
    const expectedBaseClasses = [
      'block',
      'w-full',
      'rounded-lg',
      'border',
      'transition-colors',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:border-transparent',
      'appearance-none',
      'bg-white',
      'pr-10'
    ]

    expectedBaseClasses.forEach(className => {
      expect(select.classes()).toContain(className)
    })
  })

  it('exposes focus method', async () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    // Focus the select programmatically
    wrapper.vm.focus()
    await nextTick()

    expect(typeof wrapper.vm.focus).toBe('function')
  })

  it('exposes blur method', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions }
    })

    // Blur the select programmatically
    wrapper.vm.blur()

    expect(typeof wrapper.vm.blur).toBe('function')
  })

  it('handles empty options array', () => {
    const wrapper = mount(Select, {
      props: { options: [] }
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(0)
  })

  it('handles options with empty string values', () => {
    const optionsWithEmpty = [
      { value: '', label: 'Empty option' },
      { value: 'test', label: 'Test option' }
    ]

    const wrapper = mount(Select, {
      props: { options: optionsWithEmpty }
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(2)
    expect(options[0].attributes('value')).toBe('')
    expect(options[0].text()).toBe('Empty option')
  })

  it('handles selecting option with change event', async () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        modelValue: 'option1'
      }
    })

    const select = wrapper.find('select')
    
    // Manually trigger change event with specific value
    const changeEvent = new Event('change')
    Object.defineProperty(changeEvent, 'target', {
      value: { value: 'option2' },
      enumerable: true
    })
    
    await select.element.dispatchEvent(changeEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('correctly handles focus with async nextTick', async () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions },
      attachTo: document.body
    })

    const focusSpy = vi.spyOn(wrapper.vm.$refs.selectRef, 'focus')
    
    await wrapper.vm.focus()
    
    expect(focusSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('correctly handles blur method', () => {
    const wrapper = mount(Select, {
      props: { options: mockOptions },
      attachTo: document.body
    })

    const blurSpy = vi.spyOn(wrapper.vm.$refs.selectRef, 'blur')
    
    wrapper.vm.blur()
    
    expect(blurSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('maintains reference stability for computed properties', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        id: 'stable-id'
      }
    })

    const firstSelectId = wrapper.vm.selectId
    const firstErrorId = wrapper.vm.errorId
    const firstHasError = wrapper.vm.hasError

    // Re-render shouldn't change computed values when props don't change
    wrapper.vm.$forceUpdate()

    expect(wrapper.vm.selectId).toBe(firstSelectId)
    expect(wrapper.vm.errorId).toBe(firstErrorId)
    expect(wrapper.vm.hasError).toBe(firstHasError)
  })

  it('updates computed properties when props change', async () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        error: undefined
      }
    })

    expect(wrapper.vm.hasError).toBe(false)

    await wrapper.setProps({ error: 'New error' })

    expect(wrapper.vm.hasError).toBe(true)
  })

  it('handles complex select combinations', () => {
    const wrapper = mount(Select, {
      props: {
        options: mockOptions,
        modelValue: 'option2',
        placeholder: 'Choose option',
        disabled: false,
        required: true,
        error: undefined,
        size: 'lg',
        touchOptimized: true,
        id: 'complex-select'
      }
    })

    const select = wrapper.find('select')
    
    // Verify all props are applied correctly
    expect(select.element.value).toBe('option2')
    expect(select.attributes('disabled')).toBeUndefined()
    expect(select.attributes('required')).toBeDefined()
    expect(select.attributes('id')).toBe('complex-select')
    expect(select.attributes('aria-describedby')).toBe('complex-select-error')
    expect(select.attributes('aria-invalid')).toBe('false')

    // Verify classes
    expect(select.classes()).toContain('px-5')
    expect(select.classes()).toContain('py-4')
    expect(select.classes()).toContain('text-lg')
    expect(select.classes()).toContain('min-h-[52px]')
    expect(select.classes()).toContain('border-gray-300')

    // Verify options including placeholder
    const options = wrapper.findAll('option')
    expect(options).toHaveLength(5) // 1 placeholder + 4 options
    expect(options[0].text()).toBe('Choose option')
    expect(options[0].attributes('disabled')).toBeDefined()
  })

  it('renders both chevron and error icons when in error state', () => {
    const wrapper = mount(Select, {
      props: { 
        options: mockOptions,
        error: 'This field is required'
      }
    })

    // Should show chevron icon on right
    const chevronIcon = wrapper.find('[data-testid="icon"][data-name="chevron-down"]')
    expect(chevronIcon.exists()).toBe(true)

    // Should show error icon to the left of chevron
    const errorIcon = wrapper.find('[data-testid="icon"][data-name="exclamation-circle"]')
    expect(errorIcon.exists()).toBe(true)

    // Both icons should exist
    const allIcons = wrapper.findAll('[data-testid="icon"]')
    expect(allIcons).toHaveLength(2)
  })

  it('handles option labels with special characters', () => {
    const specialOptions = [
      { value: 'test1', label: 'Option with "quotes"' },
      { value: 'test2', label: 'Option with <html>' },
      { value: 'test3', label: 'Option with émojis 🚀' }
    ]

    const wrapper = mount(Select, {
      props: { options: specialOptions }
    })

    const options = wrapper.findAll('option')
    expect(options[0].text()).toBe('Option with "quotes"')
    expect(options[1].text()).toBe('Option with <html>')
    expect(options[2].text()).toBe('Option with émojis 🚀')
  })
})