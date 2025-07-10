import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Input from '../Input.vue'

// Mock the Icon component
vi.mock('../../Icon/Icon.vue', () => ({
  default: {
    name: 'Icon',
    props: ['name', 'class'],
    template: '<span data-testid="icon" :data-name="name" :class="$props.class"></span>'
  }
}))

describe('Input Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Input)

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('disabled')).toBeUndefined()
    expect(input.attributes('readonly')).toBeUndefined()
    expect(input.attributes('required')).toBeUndefined()
  })

  it('renders with modelValue', () => {
    const wrapper = mount(Input, {
      props: { modelValue: 'test value' }
    })

    const input = wrapper.find('input')
    expect(input.element.value).toBe('test value')
  })

  it('renders with numeric modelValue', () => {
    const wrapper = mount(Input, {
      props: { modelValue: 42, type: 'number' }
    })

    const input = wrapper.find('input')
    expect(input.element.value).toBe('42')
  })

  it('renders with correct input types', () => {
    const types = ['text', 'email', 'password', 'tel', 'url', 'search', 'number'] as const

    types.forEach(type => {
      const wrapper = mount(Input, {
        props: { type }
      })

      expect(wrapper.find('input').attributes('type')).toBe(type)
    })
  })

  it('renders with placeholder', () => {
    const wrapper = mount(Input, {
      props: { placeholder: 'Enter your name' }
    })

    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter your name')
  })

  it('renders with disabled state', () => {
    const wrapper = mount(Input, {
      props: { disabled: true }
    })

    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.classes()).toContain('disabled:bg-gray-50')
    expect(input.classes()).toContain('disabled:text-gray-500')
    expect(input.classes()).toContain('disabled:cursor-not-allowed')
  })

  it('renders with readonly state', () => {
    const wrapper = mount(Input, {
      props: { readonly: true }
    })

    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
  })

  it('renders with required state', () => {
    const wrapper = mount(Input, {
      props: { required: true }
    })

    expect(wrapper.find('input').attributes('required')).toBeDefined()
  })

  it('renders with custom id', () => {
    const wrapper = mount(Input, {
      props: { id: 'custom-id' }
    })

    expect(wrapper.find('input').attributes('id')).toBe('custom-id')
  })

  it('generates unique id when not provided', () => {
    const wrapper1 = mount(Input)
    const wrapper2 = mount(Input)

    const id1 = wrapper1.find('input').attributes('id')
    const id2 = wrapper2.find('input').attributes('id')

    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^input-[a-z0-9]+$/)
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['px-3', 'py-2', 'text-sm', 'min-h-[44px]'] },
      { size: 'md', expectedClasses: ['px-4', 'py-3', 'text-base', 'min-h-[48px]'] },
      { size: 'lg', expectedClasses: ['px-5', 'py-4', 'text-lg', 'min-h-[52px]'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(Input, {
        props: { size }
      })

      const input = wrapper.find('input')
      expectedClasses.forEach(className => {
        expect(input.classes()).toContain(className)
      })
    })
  })

  it('applies touch optimization classes by default', () => {
    const wrapper = mount(Input, {
      props: { size: 'md' }
    })

    expect(wrapper.find('input').classes()).toContain('min-h-[48px]')
  })

  it('does not apply touch optimization classes when touchOptimized is false', () => {
    const wrapper = mount(Input, {
      props: { size: 'md', touchOptimized: false }
    })

    const input = wrapper.find('input')
    expect(input.classes()).not.toContain('min-h-[48px]')
    expect(input.classes()).toContain('px-4')
    expect(input.classes()).toContain('py-3')
    expect(input.classes()).toContain('text-base')
  })

  it('renders with icon', () => {
    const wrapper = mount(Input, {
      props: { icon: 'user' }
    })

    const icon = wrapper.find('[data-testid="icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('user')
    expect(icon.classes()).toContain('h-5')
    expect(icon.classes()).toContain('w-5')
    expect(icon.classes()).toContain('text-gray-400')

    // Input should have left padding for icon
    const input = wrapper.find('input')
    expect(input.classes()).toContain('pl-10')
  })

  it('does not apply icon padding when no icon', () => {
    const wrapper = mount(Input)

    const input = wrapper.find('input')
    expect(input.classes()).not.toContain('pl-10')
  })

  it('renders with error state', () => {
    const wrapper = mount(Input, {
      props: { error: 'This field is required' }
    })

    const input = wrapper.find('input')
    expect(input.classes()).toContain('border-red-300')
    expect(input.classes()).toContain('text-red-900')
    expect(input.classes()).toContain('placeholder-red-300')
    expect(input.attributes('aria-invalid')).toBe('true')

    const errorIcon = wrapper.find('[data-testid="icon"]')
    expect(errorIcon.exists()).toBe(true)
    expect(errorIcon.attributes('data-name')).toBe('exclamation-circle')
    expect(errorIcon.classes()).toContain('text-red-500')
  })

  it('renders without error state when no error', () => {
    const wrapper = mount(Input)

    const input = wrapper.find('input')
    expect(input.classes()).toContain('border-gray-300')
    expect(input.classes()).toContain('text-gray-900')
    expect(input.classes()).toContain('placeholder-gray-400')
    expect(input.attributes('aria-invalid')).toBe('false')

    const errorIcon = wrapper.find('[data-testid="icon"]')
    expect(errorIcon.exists()).toBe(false)
  })

  it('sets aria-describedby correctly', () => {
    const wrapper = mount(Input, {
      props: { id: 'test-input', error: 'Test error' }
    })

    const input = wrapper.find('input')
    expect(input.attributes('aria-describedby')).toBe('test-input-error')
  })

  it('emits update:modelValue on input for text type', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: '' }
    })

    const input = wrapper.find('input')
    await input.setValue('new value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new value'])
  })

  it('emits update:modelValue on input for number type', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: 0, type: 'number' }
    })

    const input = wrapper.find('input')
    await input.setValue('42')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([42])
  })

  it('emits 0 for invalid number input', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: 0, type: 'number' }
    })

    const input = wrapper.find('input')
    await input.setValue('invalid')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([0])
  })

  it('emits input event', async () => {
    const wrapper = mount(Input)

    const input = wrapper.find('input')
    await input.trigger('input')

    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')![0][0]).toBeInstanceOf(Event)
  })

  it('emits focus event', async () => {
    const wrapper = mount(Input)

    const input = wrapper.find('input')
    await input.trigger('focus')

    expect(wrapper.emitted('focus')).toBeTruthy()
    expect(wrapper.emitted('focus')![0][0]).toBeInstanceOf(FocusEvent)
  })

  it('emits blur event', async () => {
    const wrapper = mount(Input)

    const input = wrapper.find('input')
    await input.trigger('blur')

    expect(wrapper.emitted('blur')).toBeTruthy()
    expect(wrapper.emitted('blur')![0][0]).toBeInstanceOf(FocusEvent)
  })

  it('applies base classes correctly', () => {
    const wrapper = mount(Input)

    const input = wrapper.find('input')
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
      'focus:border-transparent'
    ]

    expectedBaseClasses.forEach(className => {
      expect(input.classes()).toContain(className)
    })
  })

  it('exposes focus method', async () => {
    const wrapper = mount(Input)

    // Focus the input programmatically
    wrapper.vm.focus()
    await nextTick()

    // The input should be focused (we can't easily test document.activeElement in JSDOM)
    // But we can check that the method exists and doesn't throw
    expect(typeof wrapper.vm.focus).toBe('function')
  })

  it('exposes blur method', () => {
    const wrapper = mount(Input)

    // Blur the input programmatically
    wrapper.vm.blur()

    // The blur method should exist and not throw
    expect(typeof wrapper.vm.blur).toBe('function')
  })

  it('handles both icon and error state correctly', () => {
    const wrapper = mount(Input, {
      props: { 
        icon: 'user', 
        error: 'This field is required' 
      }
    })

    // Should show user icon on left
    const userIcon = wrapper.find('[data-testid="icon"][data-name="user"]')
    expect(userIcon.exists()).toBe(true)

    // Should show error icon on right
    const errorIcon = wrapper.find('[data-testid="icon"][data-name="exclamation-circle"]')
    expect(errorIcon.exists()).toBe(true)

    // Input should have left padding for user icon
    const input = wrapper.find('input')
    expect(input.classes()).toContain('pl-10')
    expect(input.classes()).toContain('border-red-300')
  })

  it('handles empty string as modelValue', () => {
    const wrapper = mount(Input, {
      props: { modelValue: '' }
    })

    const input = wrapper.find('input')
    expect(input.element.value).toBe('')
  })

  it('handles zero as modelValue for number type', () => {
    const wrapper = mount(Input, {
      props: { modelValue: 0, type: 'number' }
    })

    const input = wrapper.find('input')
    expect(input.element.value).toBe('0')
  })

  it('correctly handles focus with async nextTick', async () => {
    const wrapper = mount(Input, {
      attachTo: document.body
    })

    const focusSpy = vi.spyOn(wrapper.vm.$refs.inputRef, 'focus')
    
    await wrapper.vm.focus()
    
    expect(focusSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('correctly handles blur method', () => {
    const wrapper = mount(Input, {
      attachTo: document.body
    })

    const blurSpy = vi.spyOn(wrapper.vm.$refs.inputRef, 'blur')
    
    wrapper.vm.blur()
    
    expect(blurSpy).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('maintains reference stability for computed properties', () => {
    const wrapper = mount(Input, {
      props: { id: 'stable-id' }
    })

    const firstInputId = wrapper.vm.inputId
    const firstErrorId = wrapper.vm.errorId
    const firstHasError = wrapper.vm.hasError

    // Re-render shouldn't change computed values when props don't change
    wrapper.vm.$forceUpdate()

    expect(wrapper.vm.inputId).toBe(firstInputId)
    expect(wrapper.vm.errorId).toBe(firstErrorId)
    expect(wrapper.vm.hasError).toBe(firstHasError)
  })

  it('updates computed properties when props change', async () => {
    const wrapper = mount(Input, {
      props: { error: undefined }
    })

    expect(wrapper.vm.hasError).toBe(false)

    await wrapper.setProps({ error: 'New error' })

    expect(wrapper.vm.hasError).toBe(true)
  })

  it('handles complex input combinations', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'complex test',
        type: 'email',
        placeholder: 'Enter email',
        disabled: false,
        readonly: false,
        required: true,
        icon: 'mail',
        error: undefined,
        size: 'lg',
        touchOptimized: true,
        id: 'email-input'
      }
    })

    const input = wrapper.find('input')
    
    // Verify all props are applied correctly
    expect(input.element.value).toBe('complex test')
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('placeholder')).toBe('Enter email')
    expect(input.attributes('disabled')).toBeUndefined()
    expect(input.attributes('readonly')).toBeUndefined()
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('id')).toBe('email-input')
    expect(input.attributes('aria-describedby')).toBe('email-input-error')
    expect(input.attributes('aria-invalid')).toBe('false')

    // Verify classes
    expect(input.classes()).toContain('px-5')
    expect(input.classes()).toContain('py-4')
    expect(input.classes()).toContain('text-lg')
    expect(input.classes()).toContain('min-h-[52px]')
    expect(input.classes()).toContain('pl-10')
    expect(input.classes()).toContain('border-gray-300')

    // Verify icon
    const icon = wrapper.find('[data-testid="icon"][data-name="mail"]')
    expect(icon.exists()).toBe(true)
  })
})