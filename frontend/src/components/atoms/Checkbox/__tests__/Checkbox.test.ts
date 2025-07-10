import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from '../Checkbox.vue'

describe('Checkbox Component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Checkbox)
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect(checkbox.attributes('checked')).toBeUndefined()
    expect(checkbox.attributes('disabled')).toBeUndefined()
    expect(checkbox.attributes('required')).toBeUndefined()
  })

  it('renders with model value', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: true
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.element.checked).toBe(true)
  })

  it('renders with label', () => {
    const wrapper = mount(Checkbox, {
      props: {
        label: 'Test Label'
      }
    })
    
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Test Label')
  })

  it('renders with slot content', () => {
    const wrapper = mount(Checkbox, {
      slots: {
        default: 'Slot Content'
      }
    })
    
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Slot Content')
  })

  it('renders with description', () => {
    const wrapper = mount(Checkbox, {
      props: {
        label: 'Test Label',
        description: 'Test Description'
      }
    })
    
    const description = wrapper.find('p')
    expect(description.exists()).toBe(true)
    expect(description.text()).toBe('Test Description')
  })

  it('renders with correct size classes', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['h-4', 'w-4'] },
      { size: 'md', expectedClasses: ['h-5', 'w-5'] },
      { size: 'lg', expectedClasses: ['h-6', 'w-6'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(Checkbox, {
        props: { size }
      })
      
      const checkbox = wrapper.find('input[type="checkbox"]')
      expectedClasses.forEach(className => {
        expect(checkbox.classes()).toContain(className)
      })
    })
  })

  it('renders with correct size classes when touch optimization is disabled', () => {
    const sizes = [
      { size: 'sm', expectedClasses: ['h-3', 'w-3'] },
      { size: 'md', expectedClasses: ['h-4', 'w-4'] },
      { size: 'lg', expectedClasses: ['h-5', 'w-5'] }
    ] as const

    sizes.forEach(({ size, expectedClasses }) => {
      const wrapper = mount(Checkbox, {
        props: { size, touchOptimized: false }
      })
      
      const checkbox = wrapper.find('input[type="checkbox"]')
      expectedClasses.forEach(className => {
        expect(checkbox.classes()).toContain(className)
      })
    })
  })

  it('renders with label text size classes', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'text-sm' },
      { size: 'md', expectedClass: 'text-base' },
      { size: 'lg', expectedClass: 'text-lg' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(Checkbox, {
        props: { size, label: 'Test Label' }
      })
      
      const label = wrapper.find('label')
      expect(label.classes()).toContain(expectedClass)
    })
  })

  it('renders with description text size classes', () => {
    const sizes = [
      { size: 'sm', expectedClass: 'text-xs' },
      { size: 'md', expectedClass: 'text-sm' },
      { size: 'lg', expectedClass: 'text-base' }
    ] as const

    sizes.forEach(({ size, expectedClass }) => {
      const wrapper = mount(Checkbox, {
        props: { size, label: 'Test Label', description: 'Test Description' }
      })
      
      const description = wrapper.find('p')
      expect(description.classes()).toContain(expectedClass)
    })
  })

  it('renders as disabled when disabled prop is true', () => {
    const wrapper = mount(Checkbox, {
      props: {
        disabled: true,
        label: 'Disabled Checkbox'
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.attributes('disabled')).toBeDefined()
    expect(checkbox.classes()).toContain('disabled:opacity-50')
    expect(checkbox.classes()).toContain('disabled:cursor-not-allowed')
    
    const label = wrapper.find('label')
    expect(label.classes()).toContain('text-gray-400')
    expect(label.classes()).toContain('cursor-not-allowed')
  })

  it('renders as required when required prop is true', () => {
    const wrapper = mount(Checkbox, {
      props: {
        required: true
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.attributes('required')).toBeDefined()
  })

  it('renders with error state', () => {
    const wrapper = mount(Checkbox, {
      props: {
        error: 'This field is required',
        label: 'Error Checkbox'
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.classes()).toContain('border-red-300')
    expect(checkbox.classes()).toContain('text-red-600')
    expect(checkbox.classes()).toContain('focus:ring-red-500')
    
    const label = wrapper.find('label')
    expect(label.classes()).toContain('text-red-900')
  })

  it('renders with indeterminate state', () => {
    const wrapper = mount(Checkbox, {
      props: {
        indeterminate: true
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.attributes('indeterminate')).toBeDefined()
  })

  it('emits update:modelValue when changed', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('emits change event when changed', async () => {
    const wrapper = mount(Checkbox)
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.trigger('change')
    
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('emits focus event when focused', async () => {
    const wrapper = mount(Checkbox)
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.trigger('focus')
    
    expect(wrapper.emitted('focus')).toBeTruthy()
    expect(wrapper.emitted('focus')).toHaveLength(1)
  })

  it('emits blur event when blurred', async () => {
    const wrapper = mount(Checkbox)
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.trigger('blur')
    
    expect(wrapper.emitted('blur')).toBeTruthy()
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('has correct base classes', () => {
    const wrapper = mount(Checkbox)
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.classes()).toContain('rounded')
    expect(checkbox.classes()).toContain('border-gray-300')
    expect(checkbox.classes()).toContain('text-blue-600')
    expect(checkbox.classes()).toContain('transition-colors')
    expect(checkbox.classes()).toContain('duration-200')
    expect(checkbox.classes()).toContain('focus:ring-2')
    expect(checkbox.classes()).toContain('focus:ring-blue-500')
    expect(checkbox.classes()).toContain('focus:ring-offset-2')
  })

  it('has correct label classes', () => {
    const wrapper = mount(Checkbox, {
      props: {
        label: 'Test Label'
      }
    })
    
    const label = wrapper.find('label')
    expect(label.classes()).toContain('font-medium')
    expect(label.classes()).toContain('cursor-pointer')
    expect(label.classes()).toContain('text-gray-900')
  })

  it('has correct description classes', () => {
    const wrapper = mount(Checkbox, {
      props: {
        label: 'Test Label',
        description: 'Test Description'
      }
    })
    
    const description = wrapper.find('p')
    expect(description.classes()).toContain('mt-1')
    expect(description.classes()).toContain('text-gray-500')
  })

  it('generates unique id when not provided', () => {
    const wrapper1 = mount(Checkbox)
    const wrapper2 = mount(Checkbox)
    
    const checkbox1 = wrapper1.find('input[type="checkbox"]')
    const checkbox2 = wrapper2.find('input[type="checkbox"]')
    
    expect(checkbox1.attributes('id')).toBeDefined()
    expect(checkbox2.attributes('id')).toBeDefined()
    expect(checkbox1.attributes('id')).not.toBe(checkbox2.attributes('id'))
  })

  it('uses provided id when given', () => {
    const wrapper = mount(Checkbox, {
      props: {
        id: 'custom-checkbox-id'
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.attributes('id')).toBe('custom-checkbox-id')
  })

  it('associates label with checkbox using for attribute', () => {
    const wrapper = mount(Checkbox, {
      props: {
        id: 'test-checkbox',
        label: 'Test Label'
      }
    })
    
    const checkbox = wrapper.find('input[type="checkbox"]')
    const label = wrapper.find('label')
    
    expect(checkbox.attributes('id')).toBe('test-checkbox')
    expect(label.attributes('for')).toBe('test-checkbox')
  })

  it('exposes focus and blur methods', () => {
    const wrapper = mount(Checkbox)
    
    expect(wrapper.vm.focus).toBeDefined()
    expect(wrapper.vm.blur).toBeDefined()
    expect(typeof wrapper.vm.focus).toBe('function')
    expect(typeof wrapper.vm.blur).toBe('function')
  })

  it('does not render label section when no label or slot provided', () => {
    const wrapper = mount(Checkbox)
    
    const labelSection = wrapper.find('.ml-3.text-sm')
    expect(labelSection.exists()).toBe(false)
  })

  it('renders label section when slot is provided', () => {
    const wrapper = mount(Checkbox, {
      slots: {
        default: 'Slot Content'
      }
    })
    
    const labelSection = wrapper.find('.ml-3.text-sm')
    expect(labelSection.exists()).toBe(true)
  })

  it('renders label section when label prop is provided', () => {
    const wrapper = mount(Checkbox, {
      props: {
        label: 'Test Label'
      }
    })
    
    const labelSection = wrapper.find('.ml-3.text-sm')
    expect(labelSection.exists()).toBe(true)
  })

  it('does not render description when not provided', () => {
    const wrapper = mount(Checkbox, {
      props: {
        label: 'Test Label'
      }
    })
    
    const description = wrapper.find('p')
    expect(description.exists()).toBe(false)
  })
})