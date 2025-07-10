import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '../FormField.vue'

// Mock the atomic components
vi.mock('@/components/atoms', () => ({
  Input: {
    name: 'Input',
    props: ['id', 'modelValue', 'type', 'placeholder', 'disabled', 'readonly', 'required', 'error', 'size', 'touchOptimized'],
    template: '<input data-testid="input" :id="id" :value="modelValue" :type="type" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :required="required" @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\', $event)" @blur="$emit(\'blur\', $event)" @focus="$emit(\'focus\', $event)" />'
  },
  Icon: {
    name: 'Icon',
    props: ['name', 'class'],
    template: '<span data-testid="icon" :data-name="name" :class="$props.class"></span>'
  }
}))

describe('FormField Component', () => {
  it('renders with basic props', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        modelValue: 'test value'
      }
    })

    expect(wrapper.find('label').text()).toContain('Test Field')
    expect(wrapper.find('[data-testid="input"]').element.value).toBe('test value')
  })

  it('renders without label when not provided', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: 'test value'
      }
    })

    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.find('[data-testid="input"]').exists()).toBe(true)
  })

  it('displays required asterisk when required', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Required Field',
        required: true
      }
    })

    const label = wrapper.find('label')
    expect(label.text()).toContain('Required Field')
    expect(label.html()).toContain('<span class="text-red-500 ml-1">*</span>')
  })

  it('does not display asterisk when not required', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Optional Field',
        required: false
      }
    })

    const label = wrapper.find('label')
    expect(label.text()).toBe('Optional Field')
    expect(label.html()).not.toContain('*')
  })

  it('passes through input props correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        modelValue: 'initial value',
        type: 'email',
        placeholder: 'Enter email',
        disabled: true,
        readonly: true,
        required: true,
        size: 'lg',
        touchOptimized: false
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('placeholder')).toBe('Enter email')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('readonly')).toBeDefined()
    expect(input.attributes('required')).toBeDefined()
    expect(input.element.value).toBe('initial value')
  })

  it('generates unique field id when not provided', () => {
    const wrapper1 = mount(FormField, {
      props: { label: 'Field 1' }
    })
    const wrapper2 = mount(FormField, {
      props: { label: 'Field 2' }
    })

    const id1 = wrapper1.find('[data-testid="input"]').attributes('id')
    const id2 = wrapper2.find('[data-testid="input"]').attributes('id')

    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^field-[a-z0-9]+$/)
  })

  it('uses custom id when provided', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Custom Field',
        id: 'custom-field-id'
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    const label = wrapper.find('label')

    expect(input.attributes('id')).toBe('custom-field-id')
    expect(label.attributes('for')).toBe('custom-field-id')
  })

  it('displays help text when provided', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        helpText: 'This is helpful information'
      }
    })

    const helpText = wrapper.find('p')
    expect(helpText.text()).toBe('This is helpful information')
    expect(helpText.classes()).toContain('text-gray-500')
  })

  it('displays error message when provided', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        error: 'This field is required'
      }
    })

    const errorText = wrapper.find('p')
    expect(errorText.text()).toContain('This field is required')
    expect(errorText.classes()).toContain('text-red-600')
    
    const errorIcon = wrapper.find('[data-testid="icon"]')
    expect(errorIcon.exists()).toBe(true)
    expect(errorIcon.attributes('data-name')).toBe('exclamation-circle')
  })

  it('prioritizes error over help text', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        helpText: 'This is helpful information',
        error: 'This field is required'
      }
    })

    const messages = wrapper.findAll('p')
    expect(messages).toHaveLength(1)
    expect(messages[0].text()).toContain('This field is required')
    expect(messages[0].text()).not.toContain('This is helpful information')
  })

  it('applies correct size classes to field container', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'text-sm' },
      { size: 'md', expectedClass: 'text-base' },
      { size: 'lg', expectedClass: 'text-lg' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(FormField, {
        props: { label: 'Test Field', size }
      })

      const fieldContainer = wrapper.find('.form-field')
      expect(fieldContainer.classes()).toContain(expectedClass)
    })
  })

  it('applies correct size classes to label', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'text-sm' },
      { size: 'md', expectedClass: 'text-base' },
      { size: 'lg', expectedClass: 'text-lg' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(FormField, {
        props: { label: 'Test Field', size }
      })

      const label = wrapper.find('label')
      expect(label.classes()).toContain(expectedClass)
    })
  })

  it('applies correct size classes to help text', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'text-xs' },
      { size: 'md', expectedClass: 'text-sm' },
      { size: 'lg', expectedClass: 'text-base' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(FormField, {
        props: { 
          label: 'Test Field', 
          helpText: 'Help text',
          size 
        }
      })

      const helpText = wrapper.find('p')
      expect(helpText.classes()).toContain(expectedClass)
    })
  })

  it('applies correct size classes to error text', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'text-xs' },
      { size: 'md', expectedClass: 'text-sm' },
      { size: 'lg', expectedClass: 'text-base' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(FormField, {
        props: { 
          label: 'Test Field', 
          error: 'Error text',
          size 
        }
      })

      const errorText = wrapper.find('p')
      expect(errorText.classes()).toContain(expectedClass)
    })
  })

  it('applies disabled state to label', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Disabled Field',
        disabled: true
      }
    })

    const label = wrapper.find('label')
    expect(label.classes()).toContain('text-gray-400')
  })

  it('applies normal state to label when not disabled', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Normal Field',
        disabled: false
      }
    })

    const label = wrapper.find('label')
    expect(label.classes()).toContain('text-gray-700')
    expect(label.classes()).not.toContain('text-gray-400')
  })

  it('sets aria attributes correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        helpText: 'This is helpful information',
        id: 'test-field'
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    expect(input.attributes('aria-describedby')).toBe('test-field-help')
    expect(input.attributes('aria-invalid')).toBe('false')

    const helpText = wrapper.find('p')
    expect(helpText.attributes('id')).toBe('test-field-help')
  })

  it('sets aria-invalid to true when error is present', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        error: 'This field is required'
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        modelValue: ''
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    await input.setValue('new value')
    await input.trigger('input')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new value'])
  })

  it('emits input event', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field'
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    await input.trigger('input')

    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')![0][0]).toBeInstanceOf(Event)
  })

  it('emits focus event', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field'
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    await input.trigger('focus')

    expect(wrapper.emitted('focus')).toBeTruthy()
    expect(wrapper.emitted('focus')![0][0]).toBeInstanceOf(FocusEvent)
  })

  it('emits blur event', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field'
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    await input.trigger('blur')

    expect(wrapper.emitted('blur')).toBeTruthy()
    expect(wrapper.emitted('blur')![0][0]).toBeInstanceOf(FocusEvent)
  })

  it('handles number type input correctly', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Number Field',
        type: 'number',
        modelValue: 0
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    await input.setValue('42')
    await input.trigger('input')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([42])
  })

  it('handles invalid number input', async () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Number Field',
        type: 'number',
        modelValue: 0
      }
    })

    const input = wrapper.find('[data-testid="input"]')
    await input.setValue('invalid')
    await input.trigger('input')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([0])
  })

  it('supports custom slot content', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Custom Field'
      },
      slots: {
        default: '<textarea data-testid="custom-input" />'
      }
    })

    expect(wrapper.find('[data-testid="input"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="custom-input"]').exists()).toBe(true)
  })

  it('passes slot props correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Custom Field',
        error: 'Custom error',
        id: 'custom-id'
      },
      slots: {
        default: ({ id, error, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => 
          `<div data-testid="custom-slot" data-id="${id}" data-error="${error}" data-described-by="${ariaDescribedby}" data-invalid="${ariaInvalid}"></div>`
      }
    })

    const customSlot = wrapper.find('[data-testid="custom-slot"]')
    expect(customSlot.attributes('data-id')).toBe('custom-id')
    expect(customSlot.attributes('data-error')).toBe('Custom error')
    expect(customSlot.attributes('data-described-by')).toBe('custom-id-help')
    expect(customSlot.attributes('data-invalid')).toBe('true')
  })

  it('applies base label classes correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field'
      }
    })

    const label = wrapper.find('label')
    expect(label.classes()).toContain('block')
    expect(label.classes()).toContain('font-medium')
  })

  it('applies base error classes correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        error: 'Error message'
      }
    })

    const errorText = wrapper.find('p')
    expect(errorText.classes()).toContain('text-red-600')
    expect(errorText.classes()).toContain('flex')
    expect(errorText.classes()).toContain('items-center')
  })

  it('maintains reference stability for computed properties', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Field',
        id: 'stable-id'
      }
    })

    const firstFieldId = wrapper.vm.fieldId
    const firstHelpId = wrapper.vm.helpId

    // Re-render shouldn't change computed values when props don't change
    wrapper.vm.$forceUpdate()

    expect(wrapper.vm.fieldId).toBe(firstFieldId)
    expect(wrapper.vm.helpId).toBe(firstHelpId)
  })

  it('handles complex field combinations', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Complex Field',
        modelValue: 'initial value',
        type: 'email',
        placeholder: 'Enter your email',
        helpText: 'We will never share your email',
        required: true,
        size: 'lg',
        touchOptimized: false,
        id: 'email-field'
      }
    })

    // Check label
    const label = wrapper.find('label')
    expect(label.text()).toContain('Complex Field')
    expect(label.text()).toContain('*')
    expect(label.attributes('for')).toBe('email-field')
    expect(label.classes()).toContain('text-lg')

    // Check input
    const input = wrapper.find('[data-testid="input"]')
    expect(input.attributes('id')).toBe('email-field')
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('placeholder')).toBe('Enter your email')
    expect(input.attributes('required')).toBeDefined()
    expect(input.element.value).toBe('initial value')

    // Check help text
    const helpText = wrapper.find('p')
    expect(helpText.text()).toBe('We will never share your email')
    expect(helpText.classes()).toContain('text-gray-500')
    expect(helpText.classes()).toContain('text-base')
  })

  it('handles field with both error and required state', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Required Field',
        required: true,
        error: 'This field is required'
      }
    })

    const label = wrapper.find('label')
    expect(label.text()).toContain('Required Field')
    expect(label.text()).toContain('*')

    const errorText = wrapper.find('p')
    expect(errorText.text()).toContain('This field is required')
    expect(errorText.classes()).toContain('text-red-600')

    const input = wrapper.find('[data-testid="input"]')
    expect(input.attributes('aria-invalid')).toBe('true')
  })
})